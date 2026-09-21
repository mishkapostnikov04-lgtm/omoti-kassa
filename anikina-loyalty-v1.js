/* Anikina loyalty foundation. Deliberately no remote calls or checkout mutations.
 * Real redemption must be a server-authorized, durable operation, never a UI flag.
 * ZXing is loaded from the same site; camera frames and card data stay in memory.
 */
(function () {
  'use strict';
  const CAP_PERCENT = 30;
  const state = { card: '', scanning: false, generation: 0, stream: null, timer: null };
  let decoderPromise, reader, fastReader, decodeCanvas, lastFocus, hooks;
  const $ = id => document.getElementById(id);
  const rub = cents => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 }).format(cents / 100);
  function cardNumber(raw) {
    const text = String(raw).trim();
    if (!/^\d(?:[\d ]*\d)?$/.test(text)) return null;
    const digits = text.replace(/ /g, '');
    return digits.length <= 16 && Number.isSafeInteger(Number(digits)) ? digits : null;
  }
  function cents(raw) {
    const text = String(raw).trim().replace(',', '.');
    if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return null;
    const parts = text.split('.');
    const value = Number(parts[0]) * 100 + Number((parts[1] || '').padEnd(2, '0'));
    return Number.isSafeInteger(value) && value <= 100000000 ? value : null;
  }
  function quote(total, balance, requested) {
    const valid = [total, balance, requested].every(n => Number.isSafeInteger(n) && n >= 0);
    if (!valid) return null;
    const limit = Math.min(balance, Math.floor(total * CAP_PERCENT / 100));
    return { limit, redeem: Math.min(requested, limit), due: total - Math.min(requested, limit), exceeded: requested > limit };
  }
  function eligible() { return !hooks.editing() && ['Безналичный', 'Наличный', 'Перевод', 'Смешанная'].includes(hooks.payment()); }
  function isActive() { return !!($('loyalty-card').value.trim() || $('loyalty-balance').value || $('loyalty-amount').value || state.scanning); }
  function message(text) { $('loyalty-status').textContent = text; $('loyalty-status').hidden = !text; }
  function update() {
    if (!hooks) return;
    const total = Math.max(0, Math.round(hooks.total() * 100));
    const balance = cents($('loyalty-balance').value), amount = cents($('loyalty-amount').value || '0');
    // The limit does not depend on the amount being edited. Maximum also repairs invalid input.
    const maximum = eligible() && state.card ? quote(total, balance, 0) : null;
    const result = maximum && amount !== null ? quote(total, balance, amount) : null;
    $('loyalty-base').textContent = rub(total);
    $('loyalty-limit').textContent = maximum ? rub(maximum.limit) : '—';
    $('loyalty-redeem').textContent = result && !result.exceeded ? rub(result.redeem) : '—';
    $('loyalty-due').textContent = result && !result.exceeded ? rub(result.due) : '—';
    $('loyalty-max').disabled = !maximum || total === 0;
    $('loyalty-preview-note').textContent = !eligible()
      ? (hooks.editing() || hooks.payment() ? 'Бонусы недоступны для этого чека.' : 'Выберите способ оплаты.')
      : !state.card ? 'Сканируйте карту или подтвердите её номер.'
      : balance === null ? ($('loyalty-balance').value ? 'Проверьте сумму баланса.' : 'Укажите баланс — рассчитаем максимум.')
      : total === 0 ? 'Добавьте товары в чек.'
      : amount === null ? 'Проверьте сумму бонусов.'
      : result.exceeded ? 'Сумма выше лимита. Нажмите «Максимум» или уменьшите её.'
      : '';
    $('loyalty-checkout-warning').hidden = !isActive();
    if (isActive()) $('close-btn').disabled = true;
  }
  function clear() {
    stopCamera(); state.card = '';
    ['loyalty-card', 'loyalty-balance', 'loyalty-amount'].forEach(id => { $(id).value = ''; });
    $('loyalty-preview').open = false;
    message('');
  }
  function acceptCard(raw) {
    const value = cardNumber(raw);
    if (!value) { message('Нужен цифровой номер карты. Проверьте цифры под штрихкодом.'); return false; }
    state.card = value; $('loyalty-card').value = value;
    $('loyalty-balance').value = ''; $('loyalty-amount').value = '';
    message('Карта № ' + value);
    hooks.refresh(); return true;
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
    if (state.scanning || hooks.busy()) return;
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
      state.card = ''; $('loyalty-balance').value = ''; $('loyalty-amount').value = '';
      message(''); hooks.refresh();
    });
    ['loyalty-balance', 'loyalty-amount'].forEach(id => $(id).addEventListener('input', () => hooks.refresh()));
    $('loyalty-max').addEventListener('click', () => {
      const result = quote(Math.round(hooks.total() * 100), cents($('loyalty-balance').value), 0);
      if (!eligible() || !state.card || !result) return;
      $('loyalty-amount').value = (result.limit / 100).toFixed(2); hooks.refresh();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && state.scanning) closeCamera(); });
    window.addEventListener('pagehide', stopCamera);
    update();
  }
  window.AnikinaLoyalty = Object.freeze({ init, update, clear, stopCamera, isActive, cardNumber, cents, quote, decodeFrame, loadDecoder });
})();
