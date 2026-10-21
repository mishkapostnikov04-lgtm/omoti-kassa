(function (root) {
  'use strict';
  const point=document.currentScript?.dataset.cashierPoint;
  if(!['anikina','novogodnyaya','sovetskaya'].includes(point))throw Error('Cashier connection point is missing');
  const diagnosticKey='omoti_'+point+'_runtime_diagnostics_v1';
  const stages=['access','card','quote','checkout','status','cancel','ui','lifecycle'];
  let records=[];
  function safeRecord(input) {
    const item={time:typeof input.time==='string' && /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(input.time)?input.time:new Date().toISOString()};
    if(!stages.includes(input.stage))return null;item.stage=input.stage;
    if(['start','success','error','cancel','state','hidden','visible'].includes(input.phase))item.phase=input.phase;
    if(typeof input.code==='string'&&/^[A-Z_]{1,64}$/.test(input.code))item.code=input.code;
    for(const key of ['attempt','status','durationMs'])if(Number.isFinite(input[key])&&input[key]>=0&&input[key]<=86400000)item[key]=Math.round(input[key]);
    for(const key of ['hasItems','hasSeller','hasPayment','hasCard','disabled'])if(typeof input[key]==='boolean')item[key]=input[key];
    return item;
  }
  try {const saved=JSON.parse(localStorage.getItem(diagnosticKey)||'[]');if(Array.isArray(saved))records=saved.slice(-80).map(safeRecord).filter(Boolean);}catch(_){}
  function record(input) {
    const item=safeRecord(input);if(!item)return;records.push(item);records=records.slice(-80);
    try{localStorage.setItem(diagnosticKey,JSON.stringify(records));}catch(_){}
  }
  function diagnostics(){return {build:'cashier-readiness-20261021-r1',point,events:records.map(x=>({...x}))};}
  document.addEventListener('visibilitychange',()=>record({stage:'lifecycle',phase:document.hidden?'hidden':'visible'}));
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
    record({stage:error.stage||stage,phase:error.code==='CASHIER_READ_CANCELLED'?'cancel':'error',code:error.code||'CASHIER_CONNECTION_ERROR',status:Number(error.status)||0,attempt,durationMs:Date.now()-started});
    // Deliberately exclude card numbers, bodies, URLs, device tokens and identities.
    if (root.console && root.console.warn) root.console.warn('[OMOTI connection]', {
      stage: error.stage || stage, code: error.code || 'CASHIER_CONNECTION_ERROR',
      status: Number(error.status) || null, attempt: attempt, durationMs: Date.now() - started
    });
  }
  function cancelled(stage) {
    return Object.assign(new Error('Поиск остановлен.'), {code:'CASHIER_READ_CANCELLED',stage:stage,retryable:false});
  }
  async function once(url, options, timeoutMs, stage, readSignal) {
    if(readSignal?.aborted) throw cancelled(stage);
    const controller = new AbortController();
    const abortRead=()=>controller.abort();
    readSignal?.addEventListener('abort',abortRead,{once:true});
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
      if (readSignal?.aborted) throw cancelled(stage);
      if (error.stage) throw error;
      if (controller.signal.aborted || error.name === 'AbortError') throw failure(stage, 'CASHIER_TIMEOUT');
      throw failure(stage, 'CASHIER_CONNECTION_ERROR');
    } finally { clearTimeout(timer);readSignal?.removeEventListener('abort',abortRead); }
  }
  async function run(task, stage, attempts) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const started = Date.now();
      record({stage,phase:'start',attempt});
      try {const value=await task();record({stage,phase:'success',attempt,durationMs:Date.now()-started});return value;}
      catch (error) {
        if(error.code!=='CASHIER_READ_CANCELLED') diagnostic(error, stage, attempt, started);else record({stage,phase:'cancel',code:'CASHIER_READ_CANCELLED',attempt,durationMs:Date.now()-started});
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
  async function loyalty(url, action, payload, getToken, readOptions) {
    const read = action === 'card' || action === 'quote';
    // Cancellation and the shorter deadline apply only to read-only requests.
    // Checkout/status/cancel retain their original 30s deadline and one attempt.
    const readSignal=read?readOptions?.signal:undefined;
    return run(async function () {
      if(readSignal?.aborted) throw cancelled(action);
      const token = await getToken();
      if(readSignal?.aborted) throw cancelled(action);
      const result = await once(url + action, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(payload)
      }, read?12000:30000, action, readSignal);
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
  root.CashierConnection = Object.freeze({ authJson: authJson, loyalty: loyalty, record:record, diagnostics:diagnostics });
})(window);
