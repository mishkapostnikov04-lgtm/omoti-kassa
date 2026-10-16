(function (root) {
  'use strict';
  function failure(stage, code, status) {
    const messages = {
      access: 'Не удалось проверить доступ кассы: нет ответа от сервера. Проверьте интернет и повторите поиск.',
      card: 'Не удалось получить ответ по карте. Проверьте интернет и нажмите «Повторить поиск».',
      quote: 'Не удалось рассчитать бонусы. Проверьте интернет и повторите поиск карты.',
      checkout: 'Ответ по покупке не получен. Не создавайте второй чек — нажмите «Проверить статус».',
      status: 'Не удалось получить статус покупки. Повторите проверку статуса.',
      cancel: 'Ответ по отмене не получен. Проверьте статус этой покупки.'
    };
    return Object.assign(new Error(messages[stage] || 'Нет ответа от сервера. Повторите запрос.'),
      { code: code || 'CASHIER_CONNECTION_ERROR', stage: stage, status: status, retryable: true });
  }
  function diagnostic(error, stage, attempt, started) {
    // Deliberately exclude card numbers, bodies, URLs, device tokens and identities.
    if (root.console && root.console.warn) root.console.warn('[OMOTI connection]', {
      stage: error.stage || stage, code: error.code || 'CASHIER_CONNECTION_ERROR',
      status: Number(error.status) || null, attempt: attempt, durationMs: Date.now() - started
    });
  }
  async function once(url, options, timeoutMs, stage) {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, timeoutMs);
    try {
      const res = await fetch(url, Object.assign({}, options, { signal: controller.signal }));
      let data;
      try { data = await res.json(); }
      catch (error) {
        if (controller.signal.aborted || error.name === 'AbortError') throw failure(stage, 'CASHIER_TIMEOUT');
        throw failure(stage, 'CASHIER_INVALID_RESPONSE', res.status);
      }
      return { res: res, data: data };
    } catch (error) {
      if (error.stage) throw error;
      if (controller.signal.aborted || error.name === 'AbortError') throw failure(stage, 'CASHIER_TIMEOUT');
      throw failure(stage, 'CASHIER_CONNECTION_ERROR');
    } finally { clearTimeout(timer); }
  }
  async function run(task, stage, attempts) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const started = Date.now();
      try { return await task(); }
      catch (error) {
        diagnostic(error, stage, attempt, started);
        // Authentication has its own retry. Do not multiply retries at an outer layer.
        if (!error.retryable || (error.stage && error.stage !== stage) || attempt === attempts) throw error;
        await new Promise(function (resolve) { setTimeout(resolve, 600); });
      }
    }
  }
  async function authJson(url, options) {
    const read = !options || !options.method || options.method === 'GET';
    return run(async function () {
      const result = await once(url, options, 8000, 'access');
      if (result.res.status >= 500) throw failure('access', 'CASHIER_SERVER_UNAVAILABLE', result.res.status);
      return result;
    }, 'access', read ? 2 : 1);
  }
  async function loyalty(url, action, payload, getToken) {
    const read = action === 'card' || action === 'quote';
    return run(async function () {
      const token = await getToken();
      const result = await once(url + action, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(payload)
      }, 30000, action);
      const res = result.res, data = result.data;
      if (!res.ok || !data || !data.ok) {
        const code = data && data.code;
        const retryable = res.status >= 500 &&
          ['LOYALTY_CONNECTION_ERROR', 'LOYALTY_PROVIDER_RETRYABLE', 'LOYALTY_UNAVAILABLE'].includes(code);
        const error = Object.assign(new Error(data && data.error || 'Сервер не подтвердил запрос. Повторите проверку.'),
          { code: code, status: res.status, stage: action, retryable: retryable });
        if (res.status === 401 || res.status === 403) {
          error.message = data && data.error || 'Доступ кассы не подтверждён. Сообщите владельцу.';
          if (root.cashierInvalidateAccess) root.cashierInvalidateAccess();
        }
        throw error;
      }
      return data;
    }, action, read ? 2 : 1);
  }
  root.CashierConnection = Object.freeze({ authJson: authJson, loyalty: loyalty });
})(window);
