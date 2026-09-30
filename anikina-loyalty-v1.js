/* Anikina loyalty. Only authenticated OMOTI API calls; no provider key in Pages.
 * Loyalty sales never enter the ordinary offline queue. A durable server intent
 * owns retries. The browser retains only the pending sale identity, never cards.
 * ZXing is loaded from the same site; camera frames stay in memory.
 */
(function () {
  'use strict';
  const CAP_PERCENT = 30;
  const PAYMENT_TYPES = ['Безналичный', 'Наличный', 'Перевод', 'Смешанная'];
  const PENDING_KEY = 'omoti_anikina_loyalty_pending_v1';
  const state = { card: '', cardHolderName: '', balance: null, scanning: false, generation: 0, stream: null, timer: null,
    revision: 0, lookup: false, calculation: null, quoteKey: '', waitingKey: '', failedKey: '',
    quoteTimer: null, quoteError: '', pending: null, sending: false, storageBlocked: false, maximumSelected: false };
  let decoderPromise, reader, fastReader, decodeCanvas, lastFocus, hooks;
  const $ = id => document.getElementById(id);
  const rub = cents => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(cents / 100);
  function cardNumber(raw) {
    const text = String(raw).trim();
    if (!/^\d(?:[\d ]*\d)?$/.test(text)) return null;
    const digits = text.replace(/ /g, '');
    return digits.length <= 16 && Number.isSafeInteger(Number(digits)) ? digits : null;
  }
  function cents(raw) {
    const text = String(raw).trim();
    if (!/^\d+$/.test(text)) return null;
    const value = Number(text) * 100;
    return Number.isSafeInteger(value) && value <= 100000000 ? value : null;
  }
  function quote(total, balance, requested) {
    const valid = [total, balance, requested].every(n => Number.isSafeInteger(n) && n >= 0);
    if (!valid || requested % 100) return null;
    const limit = Math.floor(Math.min(balance, Math.floor(total * CAP_PERCENT / 100)) / 100) * 100;
    return { limit, redeem: Math.min(requested, limit), due: Math.floor((total - Math.min(requested, limit))/100)*100, exceeded: requested > limit };
  }
  function eligible() { return !hooks.editing() && PAYMENT_TYPES.includes(hooks.payment()); }
  function canPrepare() { return !hooks.editing() && (!hooks.payment() || eligible()); }
  function isActive() { return !!(isPending() || state.card || $('loyalty-card').value.trim() || state.scanning || state.lookup); }
  function isPending() { return !!state.pending || state.storageBlocked; }
  function message(text) { $('loyalty-status').textContent = text; $('loyalty-status').hidden = !text; }
  function invalidate() {
    state.revision++; clearTimeout(state.quoteTimer); state.quoteTimer=null;
    state.calculation=null; state.quoteKey=''; state.waitingKey=''; state.failedKey=''; state.quoteError='';
  }
  function quoteInput() { return { ...hooks.input(), cardCode:state.card, redeemMinor:cents($('loyalty-amount').value || '0') }; }
  function inputKey(input) { return JSON.stringify([input, Math.round(hooks.total()*100)]); }
  function requestQuote(input,key) {
    state.waitingKey=key; const revision=++state.revision;
    clearTimeout(state.quoteTimer);
    state.quoteTimer=setTimeout(async () => {
      try {
        const result=await hooks.request('quote',input);
        if (revision!==state.revision || key!==inputKey(quoteInput())) return;
        state.calculation=result; state.balance=result.balanceMinor; state.quoteKey=key; state.quoteError='';
      } catch(error) {
        if (revision!==state.revision) return;
        state.failedKey=key; state.quoteError=error.message || 'Не удалось рассчитать бонусы.';
      } finally {
        if (revision===state.revision) { state.waitingKey=''; hooks.refresh(); }
      }
    },250);
  }
  function update() {
    if (!hooks) return;
    // A confirmed card narrows payment choices. Never discard a pending financial intent.
    if (!isPending() && hooks.paymentOptions?.(state.card ? PAYMENT_TYPES : null)) {
      invalidate(); hooks.refresh(); return;
    }
    const total = Math.max(0, Math.round(hooks.total() * 100));
    const maximum = state.card && canPrepare() ? quote(total,state.balance,0) : null;
    // Keep the explicit "maximum" choice within the new cap after a price/promotion change.
    // Manually entered redemption is never silently changed.
    if (state.maximumSelected && maximum && !isPending()) $('loyalty-amount').value=String(maximum.limit/100);
    const amount = cents($('loyalty-amount').value || '0');
    const local = maximum && amount!==null ? quote(total,state.balance,amount) : null;
    const input=quoteInput(), key=inputKey(input);
    const canQuote=state.card && eligible() && total>0 && local && !local.exceeded && !state.pending && !state.lookup;
    if(canQuote && key!==state.quoteKey && key!==state.waitingKey && key!==state.failedKey) requestQuote(input,key);
    const checked=canQuote && state.quoteKey===key ? state.calculation : null;
    $('loyalty-card-summary').textContent=state.card
      ? (state.cardHolderName ? state.cardHolderName+' · карта' : 'Карта')+' •••• '+state.card.slice(-4)
      : 'Мои Места · необязательно';
    $('loyalty-clear').hidden=!isActive() || !!state.pending;
    $('loyalty-scan').disabled=state.lookup || !!state.pending || hooks.busy();
    $('loyalty-card-confirm').disabled=state.lookup || !!state.pending;
    $('loyalty-card-confirm').textContent=state.lookup ? 'Проверяем…' : 'Найти';
    $('loyalty-payment').hidden=!state.card || total===0;
    $('cart-total-label').textContent=state.card ? 'Сумма чека' : 'К оплате';
    $('loyalty-balance-text').textContent=state.balance===null ? '' : 'Доступно '+rub(Math.floor(state.balance/100)*100);
    $('loyalty-limit-text').textContent=maximum ? 'Можно списать до '+rub(maximum.limit)+' · не больше 30% после акции' : '';
    $('loyalty-max').disabled=!maximum || total===0 || !!state.pending;
    $('loyalty-amount').disabled=!canPrepare() || !!state.pending;
    // Cached HTML from checkout1 has no new hook/label; retain its safe payment guard.
    const dueLabel=$('loyalty-due-label');
    if(dueLabel) dueLabel.textContent='К оплате';
    $('loyalty-due').textContent=checked ? rub(checked.dueMinor) : local && !local.exceeded ? rub(local.due) : '—';
    $('loyalty-earn').hidden=!checked || checked.earnMinor===null;
    $('loyalty-earn').textContent=checked && checked.earnMinor!==null ? 'Начислим '+rub(checked.earnMinor)+' · '+checked.accrualPercent+'% от оплаты деньгами, округляем вверх' : '';
    $('loyalty-rounding').hidden=!checked || !checked.roundingMinor;
    const note=!canPrepare() ? 'Для этой операции бонусы недоступны. Уберите карту.'
      : amount===null ? 'Введите целое число бонусных рублей, например 50.'
      : local?.exceeded ? 'Сумма выше лимита. Уменьшите её или нажмите «Максимум».'
      : state.quoteError && state.failedKey===key ? state.quoteError
      : checked && checked.totalMinor!==total ? 'Цена на сервере изменилась. Обновите кассу и проверьте состав.'
      : checked && !checked.settlementEnabled ? 'Проведение бонусных покупок ещё не включено.'
      : canQuote && !checked ? 'Проверяем расчёт…' : '';
    $('loyalty-preview-note').textContent=note; $('loyalty-preview-note').hidden=!note;
    $('loyalty-retry').hidden=!(state.quoteError && state.failedKey===key);
    if (isActive()) {
      const due=checked ? checked.dueMinor/100 : null;
      if (due!==null) hooks.renderPayment(due);
      $('close-btn').disabled=!!state.pending || state.sending || state.lookup || state.scanning || hooks.busy()
        || !checked || !checked.settlementEnabled || checked.totalMinor!==total || !hooks.ready(due);
    }
    if(isPending()) hooks.lock(true);
  }
  function clear() {
    if(isPending()) return false;
    stopCamera(); invalidate(); state.card = ''; state.cardHolderName=''; state.balance=null; state.lookup=false; state.maximumSelected=false;
    $('loyalty-card').value=''; $('loyalty-amount').value='0';
    $('loyalty-manual').hidden=true; $('loyalty-manual-toggle').setAttribute('aria-expanded','false');
    message('');
    return true;
  }
  async function acceptCard(raw) {
    if(state.pending || hooks.busy()) return false;
    const value = cardNumber(raw);
    if (!value) { message('Нужен цифровой номер карты. Проверьте цифры под штрихкодом.'); return false; }
    invalidate(); const revision=state.revision;
    state.card=''; state.cardHolderName=''; state.balance=null; state.lookup=true; state.maximumSelected=false; $('loyalty-card').value=value; $('loyalty-amount').value='0';
    message('Проверяем карту…'); hooks.refresh();
    try {
      const result=await hooks.request('card',{cardCode:value});
      if(revision!==state.revision) return false;
      state.card=value; state.balance=result.balanceMinor;
      state.cardHolderName=typeof result.cardHolderName==='string' ? result.cardHolderName.trim().slice(0,200) : '';
      $('loyalty-manual').hidden=true; $('loyalty-manual-toggle').setAttribute('aria-expanded','false');
      message(''); return true;
    } catch(error) {
      if(revision===state.revision) message(error.message || 'Не удалось проверить карту. Повторите или уберите карту.');
      return false;
    } finally { if(revision===state.revision) {state.lookup=false; hooks.refresh();} }
  }
  function pendingMessage(text,canCancel=false) {
    $('loyalty-pending').hidden=false; $('loyalty-pending-message').textContent=text;
    $('loyalty-cancel-attempt').hidden=!canCancel;
  }
  function rememberPending(payload) {
    const identity={saleKey:payload.saleKey,num:String(payload.num)};
    localStorage.setItem(PENDING_KEY,JSON.stringify(identity));
    if(localStorage.getItem(PENDING_KEY)!==JSON.stringify(identity)) throw Error('Не удалось сохранить защиту от повтора. Покупка не отправлена.');
    state.pending=identity;
  }
  function forgetPending() {
    localStorage.removeItem(PENDING_KEY); state.pending=null; state.sending=false;
    $('loyalty-pending').hidden=true; hooks.lock(false);
  }
  function finish(result) {
    // Keep the identity if clearing storage fails; repeated status is read/reconcile only.
    forgetPending(); clear(); hooks.completed(result); hooks.refresh();
  }
  async function submit() {
    if(state.pending || state.sending || hooks.busy() || $('close-btn').disabled) return;
    const input=quoteInput(), key=inputKey(input), calculation=state.calculation;
    if(!calculation || state.quoteKey!==key || !calculation.settlementEnabled) return;
    const payload={...hooks.buildPayload(),cardCode:state.card,redeemMinor:input.redeemMinor,expectedTotalMinor:calculation.totalMinor};
    try { rememberPending(payload); } catch(error) { message(error.message || 'Нет доступа к хранилищу. Покупка не отправлена.'); return; }
    state.sending=true; invalidate(); hooks.lock(true);
    pendingMessage('Проводим покупку. Не закрывайте кассу и не создавайте второй чек.');
    try {
      const result=await hooks.request('checkout',payload);
      if(result.state==='completed') finish(result);
      else pendingMessage('Нужно подтвердить результат покупки. Нажмите «Проверить статус».');
    } catch(error) { pendingMessage(error.message || 'Связь прервалась. Не создавайте второй чек — проверьте статус.'); }
    finally {state.sending=false; $('loyalty-check-status').disabled=false; hooks.refresh();}
  }
  async function checkStatus() {
    if(!state.pending || state.sending) return;
    state.sending=true; $('loyalty-check-status').disabled=true;
    try {
      const result=await hooks.request('status',state.pending);
      if(result.state==='completed') finish(result);
      else if(result.state==='cancelled') {forgetPending(); clear(); hooks.discardIdentity(); hooks.refresh();}
      else if(['not_found','prepared'].includes(result.state)) pendingMessage('Покупка ещё не отправлена в «Мои Места». Можно безопасно вернуться к чеку.',true);
      else pendingMessage('Результат пока не подтверждён. Не повторяйте покупку; проверьте статус позже или обратитесь к владельцу.');
    } catch(error) {pendingMessage(error.message || 'Нет связи. Повторите проверку статуса.');}
    finally {state.sending=false; $('loyalty-check-status').disabled=false; hooks.refresh();}
  }
  async function cancelAttempt() {
    if(!state.pending || state.sending) return;
    state.sending=true; $('loyalty-cancel-attempt').disabled=true;
    try {
      const result=await hooks.request('cancel',state.pending);
      if(result.state==='completed') finish(result);
      else if(result.state==='cancelled') {forgetPending(); clear(); hooks.discardIdentity(); hooks.refresh();}
    } catch(error) {pendingMessage(error.message || 'Не удалось отменить попытку. Проверьте статус.');}
    finally {state.sending=false; $('loyalty-cancel-attempt').disabled=false; hooks.refresh();}
  }
  function loadDecoder() {
    if (window.ZXing) return Promise.resolve(window.ZXing);
    if (decoderPromise) return decoderPromise;
    decoderPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = './vendor/zxing-0.23.0.min.js';
      const timeout = setTimeout(() => { script.remove(); decoderPromise = null; reject(new Error('decoder')); }, 15000);
      script.onload = () => { clearTimeout(timeout); resolve(window.ZXing); };
      script.onerror = () => { clearTimeout(timeout); script.remove(); decoderPromise = null; reject(new Error('decoder')); };
      document.head.appendChild(script);
    });
    return decoderPromise;
  }
  // Rotation is explicit: the sample client card has a vertical Code 128 barcode.
  function decodeFrame(source, rotate, centerOnly = false) {
    const ZX = window.ZXing;
    if (!reader) {
      reader = new ZX.MultiFormatReader();
      reader.setHints(new Map([[ZX.DecodeHintType.POSSIBLE_FORMATS, [ZX.BarcodeFormat.CODE_128]], [ZX.DecodeHintType.TRY_HARDER, true]]));
      fastReader = new ZX.MultiFormatReader();
      fastReader.setHints(new Map([[ZX.DecodeHintType.POSSIBLE_FORMATS, [ZX.BarcodeFormat.CODE_128]]]));
    }
    const w = source.videoWidth || source.naturalWidth || source.width;
    const h = source.videoHeight || source.naturalHeight || source.height;
    if (!w || !h) return null;
    // Keep native barcode detail in the aim area; periodically search the whole frame too.
    const side = Math.round(Math.min(w, h) * .8);
    const cw = centerOnly ? side : w, ch = centerOnly ? side : h;
    const scale = Math.min(1, (centerOnly ? 1600 : 1440) / Math.max(cw, ch));
    const sw = Math.round(cw * scale), sh = Math.round(ch * scale);
    const canvas = decodeCanvas || (decodeCanvas = document.createElement('canvas'));
    canvas.width = rotate ? sh : sw; canvas.height = rotate ? sw : sh;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (rotate) { ctx.translate(sh, 0); ctx.rotate(Math.PI / 2); }
    ctx.drawImage(source, (w - cw) / 2, (h - ch) / 2, cw, ch, 0, 0, sw, sh);
    const activeReader = centerOnly ? fastReader : reader;
    try {
      const bitmap = new ZX.BinaryBitmap(new ZX.HybridBinarizer(new ZX.HTMLCanvasElementLuminanceSource(canvas)));
      return activeReader.decodeWithState(bitmap).getText();
    } catch (_) { return null; } finally { activeReader.reset(); }
  }
  function stopCamera() {
    state.generation++; state.scanning = false;
    clearTimeout(state.timer); state.timer = null;
    if (state.stream) state.stream.getTracks().forEach(track => track.stop());
    state.stream = null;
    const video = $('loyalty-video');
    if (video) { video.onresize = null; video.pause(); video.srcObject = null; }
    if ($('loyalty-camera-guide')) $('loyalty-camera-guide').hidden = true;
    if (decodeCanvas) { decodeCanvas.width = 0; decodeCanvas.height = 0; }
    const dialog = $('loyalty-camera');
    if (dialog && dialog.open) dialog.close();
  }
  function closeCamera() { stopCamera(); hooks.refresh(); if (lastFocus) lastFocus.focus(); }
  async function startCamera() {
    if (state.scanning || hooks.busy() || state.pending || state.lookup) return;
    lastFocus = document.activeElement;
    const dialog = $('loyalty-camera');
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !dialog.showModal) {
      message('Камера недоступна. Откройте кассу в Safari или Chrome либо введите номер карты.'); return;
    }
    state.scanning = true; const generation = ++state.generation;
    dialog.showModal(); $('loyalty-camera-note').textContent = 'Разрешите доступ к камере.';
    hooks.refresh();
    try {
      await loadDecoder();
      if (generation !== state.generation) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } } });
      if (generation !== state.generation) { stream.getTracks().forEach(track => track.stop()); return; }
      state.stream = stream;
      const video = $('loyalty-video'); video.srcObject = stream; await video.play();
      if (generation !== state.generation) return;
      // Optional enhancement: unsupported/rejected focus settings must never stop scanning.
      try {
        const track = stream.getVideoTracks()[0];
        if (track.getCapabilities?.().focusMode?.includes('continuous')) {
          Promise.resolve(track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] })).catch(() => {});
        }
      } catch (_) { /* Camera defaults remain usable. */ }
      const alignGuide = () => {
        const w = video.videoWidth, h = video.videoHeight;
        if (!w || !h) return;
        const side = Math.min(w, h) * .8, guide = $('loyalty-camera-guide');
        $('loyalty-camera-view').style.setProperty('--camera-ratio', w / h);
        guide.style.width = (side / w * 100) + '%'; guide.style.height = (side / h * 100) + '%'; guide.hidden = false;
      };
      video.onresize = alignGuide; alignGuide();
      const started = Date.now(); let attempt = 0, previous = '', hits = 0, matchedAt = 0, preferred = null, lastFrame = -1;
      $('loyalty-camera-note').textContent = 'Поместите весь штрихкод в рамку и задержите телефон.';
      const scan = () => {
        if (generation !== state.generation) return;
        if (Date.now() - started > 45000) { closeCamera(); message('Штрихкод не распознан. Попробуйте ещё раз или введите номер карты.'); return; }
        // One decode per pass yields to the UI. Reuse the successful orientation for confirmation.
        if (video.readyState < 2 || video.currentTime === lastFrame) { state.timer = setTimeout(scan, 100); return; }
        lastFrame = video.currentTime;
        const mode = preferred !== null && Date.now() - matchedAt < 1500 ? preferred : attempt++ % 4;
        const value = decodeFrame(video, mode % 2 === 1, mode < 2);
        if (value && cardNumber(value)) {
          hits = value === previous && Date.now() - matchedAt < 1500 ? hits + 1 : 1;
          previous = value; matchedAt = Date.now(); preferred = mode;
          if (hits >= 2) { closeCamera(); acceptCard(value); return; }
        }
        state.timer = setTimeout(scan, 100);
      };
      scan();
    } catch (error) {
      if (generation !== state.generation) return;
      closeCamera();
      message(error.name === 'NotAllowedError' ? 'Доступ к камере запрещён. Разрешите его в настройках браузера или введите номер вручную.'
        : error.name === 'NotFoundError' ? 'Камера не найдена. Введите номер карты вручную.'
        : error.message === 'decoder' ? 'Не удалось загрузить сканер. Проверьте интернет и повторите или введите номер вручную.'
        : 'Не удалось открыть камеру. Закройте другое приложение с камерой и повторите или введите номер вручную.');
    }
  }
  function init(options) {
    hooks = options;
    $('loyalty-panel').hidden = false;
    $('loyalty-scan').addEventListener('click', startCamera);
    $('loyalty-camera-close').addEventListener('click', closeCamera);
    $('loyalty-camera').addEventListener('cancel', event => { event.preventDefault(); closeCamera(); });
    $('loyalty-clear').addEventListener('click', () => { clear(); hooks.refresh(); });
    $('loyalty-card-confirm').addEventListener('click', () => acceptCard($('loyalty-card').value));
    $('loyalty-card').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); acceptCard(event.target.value); } });
    $('loyalty-card').addEventListener('input', () => {
      invalidate(); state.card = ''; state.cardHolderName=''; state.balance=null; state.lookup=false; state.maximumSelected=false; $('loyalty-amount').value = '0';
      message(''); hooks.refresh();
    });
    $('loyalty-manual-toggle').addEventListener('click', () => {
      const open=$('loyalty-manual').hidden;
      $('loyalty-manual').hidden=!open; $('loyalty-manual-toggle').setAttribute('aria-expanded',String(open));
      if(open) $('loyalty-card').focus();
    });
    $('loyalty-amount').addEventListener('input', () => {state.maximumSelected=false; invalidate(); hooks.refresh();});
    $('loyalty-retry').addEventListener('click', () => {invalidate(); hooks.refresh();});
    $('loyalty-max').addEventListener('click', () => {
      const result = quote(Math.round(hooks.total() * 100), state.balance, 0);
      if (!canPrepare() || isPending() || !state.card || !result) return;
      state.maximumSelected=true; $('loyalty-amount').value = String(result.limit / 100); invalidate(); hooks.refresh();
    });
    $('loyalty-check-status').addEventListener('click',checkStatus);
    $('loyalty-cancel-attempt').addEventListener('click',cancelAttempt);
    document.addEventListener('visibilitychange', () => { if (document.hidden && state.scanning) closeCamera(); });
    window.addEventListener('pagehide', stopCamera);
    try {
      const saved=JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
      if(saved !== null && (!saved || typeof saved.saleKey!=='string' || !saved.saleKey || typeof saved.num!=='string' || !saved.num)) throw Error('Invalid saved identity');
      if(saved) {
        state.pending={saleKey:saved.saleKey,num:saved.num};
        pendingMessage('Есть незавершённая бонусная покупка. Сначала проверьте её статус.');
        hooks.lock(true);
      }
    } catch (_) {
      state.storageBlocked=true;
      pendingMessage('Не удалось прочитать сохранённый статус покупки. Не очищайте данные браузера: сначала нужна сверка с владельцем.');
      $('loyalty-check-status').disabled=true;
      hooks.lock(true);
    }
    update();
  }
  window.AnikinaLoyalty = Object.freeze({ init, update, clear, stopCamera, isActive, isPending, submit, cardNumber, cents, quote, decodeFrame, loadDecoder });
})();
