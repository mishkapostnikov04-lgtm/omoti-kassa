/* OMOTI · Аникина · вкладка «Оплата»: ссылка на оплату через СБП (торговый эквайринг Т-Банка).
   Отдельный модуль: если он не загрузится, вкладка остаётся скрытой, касса работает как раньше.
   Ключ банка только на сервере; касса отправляет сумму и читает ссылку/статус. */
(function () {
  'use strict';
  var API = 'https://orders.omoti.ru/b2c-api/cashier-sbp/';
  var POINT = 'anikina';
  var POLL_MS = 5000;
  var POLL_LIMIT_MS = 30 * 60 * 1000;
  var screen = document.getElementById('screen-pay');
  var tabBtn = document.getElementById('tab-pay');
  if (!screen || !tabBtn || typeof window.fetchWithTimeout !== 'function') return;

  var STATUS = {
    creating: ['Создаём ссылку…', 'wait'],
    waiting: ['Ждём оплату', 'wait'],
    paid: ['Оплачено', 'ok'],
    declined: ['Не оплачено', 'bad'],
    failed: ['Ссылка не создана', 'bad'],
  };
  var ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>';

  var current = null;
  var pending = null; // {requestId, amount, comment}: повтор того же запроса после сбоя сети
  var links = [];
  var pollTimer = null;
  var pollStarted = 0;
  var busy = false;

  screen.innerHTML =
    '<div class="k-head"><div><h2>Оплата</h2><small>Ссылка для клиента · СБП</small></div></div>' +
    '<div class="k-list sbp-body">' +
      '<form class="k-card sbp-form" id="sbp-form" novalidate>' +
        '<label class="k-label" for="sbp-amount">Сумма вместе с доставкой, ₽</label>' +
        '<input class="k-field k-field--money" id="sbp-amount" inputmode="decimal" autocomplete="off" placeholder="0 ₽" maxlength="12">' +
        '<label class="k-label" for="sbp-comment">Комментарий <span class="sbp-muted">(необязательно)</span></label>' +
        '<input class="k-field" id="sbp-comment" autocomplete="off" maxlength="200" placeholder="Например: Анна, доставка">' +
        '<p class="k-status k-status--err" id="sbp-form-error" role="alert" hidden></p>' +
        '<button class="k-btn k-btn--amber" id="sbp-create" type="submit">Создать ссылку</button>' +
      '</form>' +
      '<section class="k-card sbp-result" id="sbp-result" aria-live="polite" hidden>' +
        '<div class="sbp-result__top"><b class="sbp-amount" id="sbp-result-amount"></b><span class="sbp-badge" id="sbp-result-status"></span></div>' +
        '<p class="sbp-muted" id="sbp-result-comment" hidden></p>' +
        '<div id="sbp-result-link-box" hidden>' +
          '<input class="k-field sbp-link" id="sbp-result-link" readonly aria-label="Ссылка на оплату">' +
          '<button class="k-btn" id="sbp-copy" type="button">Скопировать ссылку</button>' +
          '<button class="k-btn k-btn--light" id="sbp-share" type="button" hidden>Отправить…</button>' +
          '<div class="sbp-qr" id="sbp-qr" aria-label="QR-код для оплаты"></div>' +
          '<p class="k-status k-status--info sbp-note">Отправьте ссылку клиенту. После оплаты пробейте чек в «Кассе» как «Безналичный», в комментарии — «по ссылке».</p>' +
        '</div>' +
        '<p class="k-status sbp-paid" id="sbp-result-paid" hidden></p>' +
        '<p class="k-status k-status--err" id="sbp-result-error" hidden></p>' +
        '<div class="sbp-actions"><button class="k-btn k-btn--light" id="sbp-check" type="button">Проверить оплату</button>' +
        '<button class="k-btn k-btn--light" id="sbp-new" type="button">Новая ссылка</button></div>' +
      '</section>' +
      '<div class="k-card__title sbp-history-title" id="sbp-history-title" hidden>Последние ссылки</div>' +
      '<div class="sbp-history" id="sbp-history"></div>' +
      '<p class="k-status k-status--err" id="sbp-list-error" hidden></p>' +
    '</div>';

  function $(id) { return document.getElementById(id); }
  function money(v) { var n = Number(v), whole = Math.round(n * 100) % 100 === 0; return n.toLocaleString('ru-RU', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 }) + ' ₽'; }
  function time(v) { var d = new Date(v); return isNaN(d) ? '' : d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  function show(el, text) { el.textContent = text || ''; el.hidden = !text; }
  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    var b = crypto.getRandomValues(new Uint8Array(16)); b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128;
    var h = Array.prototype.map.call(b, function (x) { return (x + 256).toString(16).slice(1); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }
  function parseAmount(text) {
    var s = String(text || '').replace(/[\s₽]/g, '').replace(',', '.');
    if (!/^\d{1,7}(\.\d{1,2})?$/.test(s)) return null;
    var n = Number(s);
    return n >= 10 && n <= 1000000 ? n : null;
  }

  async function api(path, options) {
    var res = await window.fetchWithTimeout(API + path, Object.assign({ cache: 'no-store' }, options || {}), 20000);
    var data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    if (!res.ok || !data || !data.ok) throw new Error((data && data.error) || 'Сервер не ответил. Проверьте интернет и попробуйте ещё раз.');
    return data;
  }
  function post(path, body) {
    return api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({ point: POINT }, body)) });
  }

  function renderQr(url) {
    var box = $('sbp-qr');
    box.innerHTML = '';
    if (!url || typeof window.qrcode !== 'function') { box.hidden = true; return; }
    try {
      var qr = window.qrcode(0, 'M'); qr.addData(url); qr.make();
      box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
      box.hidden = false;
    } catch (e) { box.hidden = true; }
  }

  function renderCurrent() {
    var box = $('sbp-result');
    $('sbp-form').hidden = Boolean(current);
    box.hidden = !current;
    if (!current) return;
    var st = STATUS[current.status] || ['', 'wait'];
    $('sbp-result-amount').textContent = money(current.amount);
    var badge = $('sbp-result-status'); badge.textContent = st[0]; badge.dataset.tone = st[1];
    show($('sbp-result-comment'), current.comment);
    var hasLink = Boolean(current.url) && current.status === 'waiting';
    $('sbp-result-link-box').hidden = !hasLink;
    if (hasLink && $('sbp-result-link').value !== current.url) { $('sbp-result-link').value = current.url; renderQr(current.url); }
    $('sbp-share').hidden = !(hasLink && navigator.share);
    show($('sbp-result-paid'), current.status === 'paid' ? 'Оплата получена' + (current.paidAt ? ' · ' + time(current.paidAt) : '') + '. Пробейте чек в «Кассе» как «Безналичный», в комментарии — «по ссылке».' : '');
    show($('sbp-result-error'), current.status === 'failed' ? current.message : current.status === 'declined' ? 'Клиент не оплатил или срок ссылки истёк. Создайте новую ссылку.' : '');
    $('sbp-check').hidden = current.status !== 'waiting';
    $('sbp-new').className = current.status === 'waiting' ? 'k-btn k-btn--light' : 'k-btn';
  }

  function renderHistory() {
    var list = $('sbp-history');
    var rows = links.filter(function (l) { return !current || l.id !== current.id; });
    $('sbp-history-title').hidden = !rows.length;
    list.innerHTML = '';
    rows.forEach(function (l) {
      var st = STATUS[l.status] || ['', 'wait'];
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'sbp-row';
      b.innerHTML = '<span class="sbp-row__main"><b></b><small></small></span><span class="sbp-badge"></span>';
      b.querySelector('b').textContent = money(l.amount);
      b.querySelector('small').textContent = time(l.createdAt) + (l.comment ? ' · ' + l.comment : '');
      var badge = b.querySelector('.sbp-badge'); badge.textContent = st[0]; badge.dataset.tone = st[1];
      b.onclick = function () { setCurrent(l); };
      list.append(b);
    });
  }

  function upsert(link) {
    links = [link].concat(links.filter(function (l) { return l.id !== link.id; }));
  }
  function setCurrent(link) {
    current = link;
    if (link) upsert(link);
    renderCurrent(); renderHistory(); schedulePoll(true);
  }

  function visible() { return screen.classList.contains('active') && !document.hidden; }
  function schedulePoll(restart) {
    clearTimeout(pollTimer);
    if (restart) pollStarted = Date.now();
    if (!current || current.status !== 'waiting' || Date.now() - pollStarted > POLL_LIMIT_MS) return;
    pollTimer = setTimeout(function () { if (visible()) checkStatus(false); else schedulePoll(false); }, POLL_MS);
  }

  async function checkStatus(manual) {
    if (!current) return;
    var id = current.id;
    if (manual) { $('sbp-check').disabled = true; $('sbp-check').textContent = 'Проверяем…'; }
    try {
      var data = await post('status', { id: id });
      if (current && current.id === id) { current = data.link; upsert(data.link); renderCurrent(); renderHistory(); }
      if (manual) show($('sbp-result-error'), '');
    } catch (e) {
      if (manual) show($('sbp-result-error'), e.message);
    } finally {
      if (manual) { $('sbp-check').disabled = false; $('sbp-check').textContent = 'Проверить оплату'; }
      schedulePoll(false);
    }
  }

  async function loadList() {
    try {
      var data = await api('links?point=' + POINT);
      links = data.links || [];
      if (current) { var fresh = links.filter(function (l) { return l.id === current.id; })[0]; if (fresh) current = fresh; }
      show($('sbp-list-error'), '');
      renderCurrent(); renderHistory(); schedulePoll(false);
    } catch (e) {
      show($('sbp-list-error'), e.message);
    }
  }

  $('sbp-form').addEventListener('submit', async function (event) {
    event.preventDefault();
    if (busy) return;
    var amount = parseAmount($('sbp-amount').value);
    var comment = $('sbp-comment').value.replace(/\s+/g, ' ').trim();
    if (amount === null) { show($('sbp-form-error'), 'Введите сумму от 10 до 1 000 000 ₽, например 1250 или 1250,50.'); $('sbp-amount').focus(); return; }
    show($('sbp-form-error'), '');
    if (!pending || pending.amount !== amount || pending.comment !== comment) pending = { requestId: uuid(), amount: amount, comment: comment };
    busy = true;
    var btn = $('sbp-create'); btn.disabled = true; btn.textContent = 'Создаём ссылку…';
    try {
      var data = await post('links', { amount: amount, comment: comment, requestId: pending.requestId });
      pending = null;
      $('sbp-amount').value = ''; $('sbp-comment').value = '';
      setCurrent(data.link);
    } catch (e) {
      show($('sbp-form-error'), e.message);
      btn.textContent = 'Повторить';
      btn.disabled = false;
      busy = false;
      return;
    }
    btn.disabled = false; btn.textContent = 'Создать ссылку'; busy = false;
  });

  $('sbp-amount').addEventListener('input', function () { show($('sbp-form-error'), ''); if (!busy) $('sbp-create').textContent = 'Создать ссылку'; });
  $('sbp-check').onclick = function () { checkStatus(true); };
  $('sbp-new').onclick = function () { setCurrent(null); $('sbp-amount').focus(); };
  $('sbp-copy').onclick = async function () {
    var input = $('sbp-result-link'), btn = this, ok = false;
    try { await navigator.clipboard.writeText(input.value); ok = true; }
    catch (e) { input.focus(); input.select(); try { ok = document.execCommand('copy'); } catch (e2) { ok = false; } }
    btn.textContent = ok ? 'Скопировано ✓' : 'Выделите ссылку и скопируйте';
    setTimeout(function () { btn.textContent = 'Скопировать ссылку'; }, 2500);
  };
  $('sbp-share').onclick = function () {
    if (!current || !current.url || !navigator.share) return;
    navigator.share({ title: 'Оплата заказа ОМОТИ', text: 'Оплата заказа ОМОТИ: ' + money(current.amount), url: current.url }).catch(function () {});
  };
  document.addEventListener('visibilitychange', function () { if (visible() && current && current.status === 'waiting') checkStatus(false); });

  // Вкладка: интерфейс C3 сам выставляет aria-current по трём прежним вкладкам; здесь — только для «Оплаты».
  function markActive() {
    var active = screen.classList.contains('active');
    var want = active ? 'page' : 'false';
    if (tabBtn.getAttribute('aria-current') !== null && tabBtn.getAttribute('aria-current') !== want) tabBtn.setAttribute('aria-current', want);
    tabBtn.classList.toggle('active', active);
    tabBtn.setAttribute('aria-selected', active ? 'true' : 'false');
    if (tabBtn.parentElement && tabBtn.parentElement.classList.contains('k-nav')) {
      tabBtn.parentElement.classList.add('k-nav--4');
      if (!tabBtn.querySelector('svg path')) tabBtn.innerHTML = ICON + 'Оплата';
    }
  }
  new MutationObserver(markActive).observe(tabBtn, { attributes: true, attributeFilter: ['aria-current'] });
  // Интерфейс C3 переносит кнопки вкладок в нижнюю панель после загрузки; ждём переноса и отключаемся.
  if (!tabBtn.closest('.k-nav')) {
    var moved = new MutationObserver(function () { if (tabBtn.closest('.k-nav')) { moved.disconnect(); markActive(); } });
    moved.observe(document.body, { childList: true, subtree: true });
  }
  var opened = false;
  new MutationObserver(function () {
    markActive();
    if (screen.classList.contains('active')) {
      if (!opened) { opened = true; loadList(); }
      else if (current && current.status === 'waiting') checkStatus(false);
    } else { opened = false; }
  }).observe(screen, { attributes: true, attributeFilter: ['class'] });

  tabBtn.hidden = false;
  markActive();
})();
