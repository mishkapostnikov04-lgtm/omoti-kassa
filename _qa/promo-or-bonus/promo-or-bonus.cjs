'use strict';
// Акция «скидка или бонусы» (10.11.2026) в трёх кассах. Расчёт и покупку с картой обслуживает настоящий код
// сервера розницы (новый или прежний), загруженный в Node; остальные запросы — подставные данные стенда.
// Сеть наружу закрыта, service worker заблокирован, настоящих чеков и бонусов нет.
// Запуск встроенным Node с Playwright из корня репозитория:
//   QA_SERVER_NEW=<candidate-b2c> QA_SERVER_OLD=<baseline-b2c> QA_KASSA_MAIN=<копия main> node _qa/promo-or-bonus/promo-or-bonus.cjs
const fs = require('fs'), path = require('path'), http = require('http'), assert = require('assert/strict');
const { pathToFileURL } = require('url');
const crypto = require('crypto');
const H = require('../anikina-freeze/shift-harness.cjs');
const art = path.resolve(H.root, '..', '..', 'promo-or-bonus-20261110');
const SERVER = { new: path.resolve(process.env.QA_SERVER_NEW || path.join(art, 'candidate-b2c')), old: path.resolve(process.env.QA_SERVER_OLD || path.join(art, 'baseline-b2c')) };
const KASSA = { new: H.root, main: path.resolve(process.env.QA_KASSA_MAIN || path.join(art, 'kassa-main')) };
const out = path.join(__dirname, 'local-browser'); fs.mkdirSync(out, { recursive: true });
const points = process.env.QA_POINT ? [process.env.QA_POINT] : ['anikina', 'novogodnyaya', 'sovetskaya'];
const SLUG = { anikina: 'аникина', novogodnyaya: 'новогодняя', sovetskaya: 'советская' };
const LABEL = { anikina: 'Аникина', novogodnyaya: 'Новогодняя', sovetskaya: 'Советская' };
const norm = text => String(text || '').replace(/[\u00a0\u202f]/g, ' ').replace(/\s+/g, ' ').trim();

function staticServer(root) {
  return new Promise(resolve => {
    const s = http.createServer((req, res) => {
      try {
        const url = new URL(req.url, 'http://localhost'), file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
        if (!file.startsWith(root + path.sep) || req.method !== 'GET') throw Error('scope');
        res.setHeader('Content-Type', ({ '.html': 'text/html;charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.json': 'application/json' })[path.extname(file)] || 'application/octet-stream');
        const raw = fs.readFileSync(file);
        res.end(/\.(js|css)$/.test(file) ? raw.toString().replaceAll('\r\n', '\n') : raw);
      } catch (_) { res.statusCode = 404; res.end('Not found'); }
    });
    s.listen(0, '127.0.0.1', () => resolve({ s, url: 'http://127.0.0.1:' + s.address().port }));
  });
}

const now = Date.now();
const PROMO_ROW = { promotion_id: 'qa_promo_nov', name: 'Скидка 15% на весь чек', discount_percent: 15,
  starts_at: new Date(now - 3600e3).toISOString(), ends_at: new Date(now + 86400e3).toISOString(), timezone: 'Asia/Novosibirsk',
  point_slugs: ['аникина', 'новогодняя', 'советская'], eligible_pay_types: ['Безналичный', 'Наличный', 'Перевод', 'Смешанная'],
  applies_to_all_catalog_items: true, catalog_item_ids: null, enabled: true, notes: '' };

async function loadServer(root) {
  const m = rel => import(pathToFileURL(path.join(root, rel)).href);
  const svc = await m('src/cashier/loyalty-service.js'), promo = await m('src/cashier/promotions.js');
  return { createLoyaltyService: svc.createLoyaltyService, serializePromotion: promo.serializePromotion };
}
// Моти-кейк не из прежнего списка касс: его цена и признак «Участвует в акциях» приходят из каталога продажи.
const CAKE = 'cat_fistashka_moti_keyk', CAKE_NAME = 'Фисташка Моти кейк';
const cakeCatalog = excluded => ({ [CAKE]: { catalogItemId: CAKE, name: CAKE_NAME, itemType: 'moti_flavor', visibleAtSale: true,
  prices: { normal: 400, yandex: 400, self: 350 }, sellerPayout: null, promoExcluded: excluded === true } });
function serverFor(lib, point, cake) {
  const intents = new Map(), calls = [], answers = [];
  const provider = {
    card: async () => ({ cardCode: '1234567', balanceMinor: 95000 }),
    findPurchase: async p => intents.get('remote:' + p.purchaseUuid) || null,
    findBonus: async (p, uuid) => intents.get('bonus:' + uuid) || null,
    purchase: async p => {
      intents.set('remote:' + p.purchaseUuid, structuredClone(p));
      for (const r of p.bonusRecords) intents.set('bonus:' + r.bonusUuid, { ...r, cardCode: p.cardCode, transaction: { posId: p.posId, purchaseId: p.purchaseId } });
      return { purchaseId: p.purchaseId };
    },
    postBonus: async () => { throw Error('unexpected repair'); },
  };
  let seq = 500;
  const operations = { find: async key => intents.get(key) || null,
    withLocks: async (key, code, fn) => fn({
      find: async () => intents.get(key) || null,
      nextPurchaseDate: async clock => clock().toISOString(),
      prepare: async data => {
        const ext = { ...structuredClone(data.providerPayload), purchaseId: 2000000000 + intents.size, purchaseUuid: crypto.randomUUID() };
        for (const r of ext.bonusRecords) r.bonusUuid = crypto.randomUUID();
        const op = { id: crypto.randomUUID(), sale_key: key, card_code: data.cardCode, payload: structuredClone(data.payload), provider_payload: ext,
          fingerprint: data.fingerprint, state: 'prepared', updated_at: new Date() };
        intents.set(key, op); return op;
      },
      state: async (op, state, code = null) => { op.state = state; op.last_error_code = code; },
      complete: async op => {
        const p = op.payload;
        op.state = 'completed';
        op.result = { ok: true, check: { ...p, receiptNumber: String(++seq), revision: 1, point: LABEL[point], total: p.finalTotal, loyalty: p.loyaltySnapshot,
          items: p.items.map(i => ({ ...i, name: i.name ?? i.legacyFlavorName })) } };
      },
      cancel: async op => { op.state = 'cancelled'; },
    }) };
  const store = { ...(cake === undefined ? {} : { pool: {} }), findApplicablePromotion: async (slug, pay) => PROMO_ROW.point_slugs.includes(slug) && PROMO_ROW.eligible_pay_types.includes(pay) ? PROMO_ROW : null };
  const service = lib.createLoyaltyService({ store, operations, provider, point, enabled: true, writesEnabled: true, posId: 105901, accrualPercent: 5,
    ...(cake === undefined ? {} : { catalogLoader: async () => cakeCatalog(cake) }) });
  // Подставные коды стенда (qa_N) серверу неизвестны — он узнаёт прежние вкусы по названию; код моти-кейка настоящий.
  const strip = input => ({ ...input, items: (input.items || []).map(({ catalogItemId, bundleVersion, ...rest }) => catalogItemId === CAKE ? { ...rest, catalogItemId } : rest) });
  return {
    calls, answers,
    async handle(action, input) {
      calls.push({ action, input: structuredClone(input) });
      try {
        if (action === 'quote') { const { canonical, ...pub } = await service.quote(strip(input)); answers.push(pub); return { status: 200, body: { ok: true, ...pub } }; }
        if (action === 'checkout') return { status: 200, body: { ok: true, ...(await service.checkout(strip(input))) } };
        if (action === 'status') return { status: 200, body: { ok: true, ...(await service.status(strip(input))) } };
      } catch (error) { return { status: error.status || 422, body: { ok: false, code: error.code, error: error.message } }; }
      return null;
    },
  };
}

async function open(browser, base, point, serverLib, cake) {
  const t = await H.context(browser, base, point);
  const server = serverFor(serverLib, point, cake);
  // Добавленные позже маршруты имеют приоритет: акция и расчёт с картой — из кода сервера.
  await t.ctx.route('**/b2c/cashier/*/promotion', async r => {
    const assortment = cake === undefined ? H.assortment : [...H.assortment, { name: CAKE_NAME, catalogItemId: CAKE, itemType: 'moti_flavor', legacy: false,
      isPremium: false, cashierSeparate: true, promoExcluded: cake === true, prices: { normal: 400, self: 350, yandex: 400 } }];
    return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, serverNow: new Date().toISOString(),
      promotions: [serverLib.serializePromotion(PROMO_ROW)], assortment }) });
  });
  await t.ctx.route('**/' + point + '/loyalty/*', async r => {
    const action = r.request().url().split('/').at(-1), p = r.request().postDataJSON() || {};
    if (!['quote', 'checkout', 'status'].includes(action) || p.attachCard || p.correction) return r.fallback();
    const res = await server.handle(action, p);
    if (!res) return r.fallback();
    return r.fulfill({ status: res.status, contentType: 'application/json', body: JSON.stringify(res.body) });
  });
  await t.page.evaluate(() => loadPromotionConfig(true));
  await t.page.waitForFunction(() => Array.isArray(promotionConfig?.promotions) && promotionConfig.promotions.some(x => x.id === 'qa_promo_nov'));
  return { ...t, server };
}
async function basket(p) {
  await H.seller(p);
  const hit = p.locator('[data-name="Смородина"] .k-tile__hit');
  await hit.click(); await hit.click();
  await H.pay(p, 'Безналичный');
}
async function setRedeem(p, rub) {
  if (await p.evaluate(() => C31UI.state.opened !== 'card')) await p.locator('#c31-card').click();
  await p.locator('#loyalty-amount').fill(String(rub));
}
// \u00ab\u041a \u043e\u043f\u043b\u0430\u0442\u0435\u00bb \u0434\u043e \u043e\u0442\u0432\u0435\u0442\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430 \u2014 \u043f\u0440\u0435\u0434\u0432\u0430\u0440\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0435. \u0416\u0434\u0451\u043c, \u043f\u043e\u043a\u0430 \u043a\u0430\u0441\u0441\u0430 \u043f\u0440\u0438\u043c\u0435\u0442 \u043e\u0442\u0432\u0435\u0442: \u043a\u043d\u043e\u043f\u043a\u0430 \u0437\u0430\u043a\u0440\u044b\u0442\u0438\u044f \u0447\u0435\u043a\u0430 \u0430\u043a\u0442\u0438\u0432\u043d\u0430.
async function waitDue(p, text) {
  await p.waitForFunction(t => (document.getElementById('loyalty-due')?.textContent || '').replace(/[\u00a0\u202f]/g, ' ').trim() === t
    && !document.getElementById('close-btn').disabled && document.getElementById('loyalty-preview-note').hidden, text, { timeout: 8000 });
  await p.waitForTimeout(150);
}
// \u0418\u0442\u043e\u0433 \u0432 \u0434\u043e\u043a\u0435 C3.2 \u043f\u043e\u0441\u043b\u0435 \u0432\u044b\u0431\u043e\u0440\u0430 \u043a\u0430\u0440\u0442\u044b \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u0442 \u0441\u0443\u043c\u043c\u0443 \u043a \u043e\u043f\u043b\u0430\u0442\u0435; \u0441\u0443\u043c\u043c\u0443 \u0447\u0435\u043a\u0430 \u0441\u0432\u0435\u0440\u044f\u0435\u043c \u043f\u043e \u043e\u0442\u0432\u0435\u0442\u0443 \u0441\u0435\u0440\u0432\u0435\u0440\u0430.
const last = t => t.server.answers.at(-1);
const view = p => p.evaluate(() => ({ total: document.getElementById('total-sum')?.textContent, due: document.getElementById('loyalty-due')?.textContent,
  hint: document.getElementById('loyalty-personal-discount')?.hidden ? '' : document.getElementById('loyalty-personal-discount')?.textContent,
  limit: document.getElementById('loyalty-limit-text')?.textContent, amount: document.getElementById('loyalty-amount')?.value,
  closeDisabled: document.getElementById('close-btn')?.disabled }));

(async () => {
  const LIB = { new: await loadServer(SERVER.new), old: await loadServer(SERVER.old) };
  const sites = { new: await staticServer(KASSA.new) };
  if (fs.existsSync(path.join(KASSA.main, 'omoti_kassa.html'))) sites.main = await staticServer(KASSA.main);
  const browser = await H.chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' }), results = [];
  async function run(point, name, kassa, server, fn, width, cake) {
    const t = await open(browser, sites[kassa].url, point, LIB[server], cake);
    if (width) await t.page.setViewportSize({ width, height: 844 });  // 0 — размер по умолчанию
    try {
      await fn(t.page, t);
      assert.deepEqual(t.s.errors, []); assert.deepEqual(t.s.leaks, []);
      results.push({ point, name, status: 'PASS' }); console.log('PASS', point, name);
    } catch (e) {
      results.push({ point, name, status: 'FAIL', error: String(e && e.message || e) }); console.log('FAIL', point, name, e && e.message);
      await t.page.screenshot({ path: path.join(out, 'FAIL-' + point + '-' + name.replace(/[^\wа-я]+/giu, '-').slice(0, 60) + '.png') }).catch(() => {});
    } finally { await t.ctx.close(); }
  }
  try {
    for (const point of points) {
      await run(point, 'без карты: скидка по акции в чеке, как раньше', 'new', 'new', async (p, t) => {
        await basket(p);
        assert.equal(await p.evaluate(() => cartTotal()), 306);
        await H.close(p);
        const save = t.s.calls.filter(c => c.action === 'save_check').at(-1);
        assert.equal(save.body.promotionId, 'qa_promo_nov');
        assert.equal(t.server.calls.length, 0, 'без карты сервер бонусов не вызывается');
      });
      await run(point, 'карта: скидка ↔ списание без лишних кнопок, подсказка, покупка со списанием', 'new', 'new', async (p, t) => {
        await basket(p); await H.card(p);
        await waitDue(p, '306 ₽');
        let v = await view(p);
        assert.deepEqual([last(t).totalMinor, last(t).maximumMinor, last(t).promotionWaived], [30600, 10800, false]);
        assert.equal(norm(v.limit), 'Не больше 30% суммы чека.');
        assert.equal(norm(v.hint), 'Сейчас скидка по акции −54 ₽. Бонусами можно списать до 108 ₽ вместо неё.');
        await p.screenshot({ path: path.join(out, point + '-discount.png') });
        await setRedeem(p, 50); await waitDue(p, '310 ₽');
        v = await view(p);
        assert.deepEqual([last(t).totalMinor, last(t).redeemMinor, last(t).promotionWaived], [36000, 5000, true]);
        assert.equal(norm(v.hint), 'Скидка по акции −54 ₽ не применена: вместо неё списываются бонусы.');
        await p.screenshot({ path: path.join(out, point + '-redeem.png') });
        await setRedeem(p, 0); await waitDue(p, '306 ₽');
        assert.deepEqual([last(t).totalMinor, last(t).promotionWaived], [30600, false]);
        assert.equal(norm((await view(p)).hint), 'Сейчас скидка по акции −54 ₽. Бонусами можно списать до 108 ₽ вместо неё.');
        await p.locator('#loyalty-max').click(); await waitDue(p, '252 ₽');
        v = await view(p); assert.equal(v.amount, '108'); assert.deepEqual([last(t).totalMinor, last(t).redeemMinor], [36000, 10800]);
        await setRedeem(p, 50); await waitDue(p, '310 ₽');
        await H.close(p);
        const checkout = t.server.calls.filter(c => c.action === 'checkout').at(-1);
        assert.equal(checkout.input.redeemMinor, 5000); assert.equal(checkout.input.expectedTotalMinor, 36000); assert.equal(checkout.input.promotionId, 'qa_promo_nov');
        assert.equal(t.server.calls.filter(c => c.action === 'checkout').length, 1, 'одна покупка');
        assert.equal(await p.evaluate(() => Object.values(cart).some(q => q > 0)), false, 'корзина очищена');
      });
      await run(point, 'карта: покупка со скидкой без списания', 'new', 'new', async (p, t) => {
        await basket(p); await H.card(p); await waitDue(p, '306 ₽');
        await H.close(p);
        const checkout = t.server.calls.filter(c => c.action === 'checkout').at(-1);
        assert.equal(checkout.input.redeemMinor, 0); assert.equal(checkout.input.expectedTotalMinor, 30600);
      });
      await run(point, 'узкий экран 360: подсказка не ломает лист карты', 'new', 'new', async p => {
        await basket(p); await H.card(p); await waitDue(p, '306 ₽');
        const box = await p.evaluate(() => { const r = document.getElementById('loyalty-personal-discount').getBoundingClientRect(); return { w: r.width, right: r.right, vw: innerWidth, scroll: document.documentElement.scrollWidth }; });
        assert.ok(box.w > 0 && box.right <= box.vw + 0.5 && box.scroll <= box.vw + 0.5, JSON.stringify(box));
        await p.screenshot({ path: path.join(out, point + '-360.png') });
      }, 360);
      await run(point, 'новая касса + прежний сервер: поведение прежнее', 'new', 'old', async (p, t) => {
        await basket(p); await H.card(p); await waitDue(p, '306 ₽');
        let v = await view(p); assert.equal(v.hint, ''); assert.equal(norm(v.limit), 'Не больше 30% суммы после акции.');
        await setRedeem(p, 50); await waitDue(p, '256 ₽');
        v = await view(p); assert.deepEqual([last(t).totalMinor, last(t).redeemMinor], [30600, 5000]); assert.equal(v.hint, '');
      });
      await run(point, 'порядок продавца: карта и бонусы до выбора оплаты — сразу сумма сервера, затем оплата и покупка', 'new', 'new', async (p, t) => {
        await H.seller(p);
        const hit = p.locator('[data-name="Смородина"] .k-tile__hit'); await hit.click(); await hit.click();
        await H.card(p);
        const settled = async text => { await p.waitForFunction(x => (document.getElementById('loyalty-due')?.textContent || '').replace(/[  ]/g, ' ').trim() === x
          && document.getElementById('loyalty-preview-note').hidden, text, { timeout: 8000 }); await p.waitForTimeout(150); };
        await settled('306 ₽');
        assert.equal(norm((await view(p)).hint), 'Сейчас скидка по акции −54 ₽. Бонусами можно списать до 108 ₽ вместо неё.');
        await setRedeem(p, 50); await settled('310 ₽');
        assert.deepEqual([last(t).totalMinor, last(t).promotionWaived], [36000, true]);
        assert.equal((await view(p)).closeDisabled, true, 'без оплаты чек не закрыть');
        assert.ok(t.server.calls.filter(c => c.action === 'quote').every(c => c.input.pay === 'Безналичный'));
        await p.screenshot({ path: path.join(out, point + '-before-payment.png') });
        await H.dismiss(p); await H.pay(p, 'Наличный'); await waitDue(p, '310 ₽');
        assert.equal(t.server.calls.filter(c => c.action === 'quote').at(-1).input.pay, 'Наличный');
        await H.close(p);
        const checkout = t.server.calls.filter(c => c.action === 'checkout').at(-1);
        assert.deepEqual([checkout.input.pay, checkout.input.redeemMinor, checkout.input.expectedTotalMinor], ['Наличный', 5000, 36000]);
      });
      await run(point, 'док: сумма не моргает при выборе оплаты, над суммой видно скидку или бонусы', 'new', 'new', async (p, t) => {
        await H.seller(p);
        await p.locator('[data-name="Смородина"] .k-tile__hit').click();
        const dock = () => p.evaluate(() => ({ sum: document.getElementById('total-sum').textContent.replace(/[  ]/g, ' ').trim(),
          badge: document.getElementById('c31-sum-promo')?.hidden ? '' : (document.getElementById('c31-sum-promo')?.textContent || '').replace(/[  ]/g, ' ') }));
        assert.deepEqual(await dock(), { sum: '153 ₽', badge: '−15% · 27 ₽' }, 'без карты: скидка по корзине');
        await H.card(p);
        await p.waitForFunction(() => document.getElementById('loyalty-preview-note').hidden && /153/.test(document.getElementById('loyalty-due').textContent));
        await p.waitForTimeout(200);
        assert.deepEqual(await dock(), { sum: '153 ₽', badge: '−15% · 27 ₽' }, 'карта без списания: скидка из ответа сервера');
        await p.locator('#loyalty-max').click();
        await p.waitForFunction(() => /126/.test(document.getElementById('loyalty-due').textContent) && document.getElementById('loyalty-preview-note').hidden);
        await p.waitForTimeout(200); await H.dismiss(p); await p.waitForTimeout(200);
        assert.deepEqual(await dock(), { sum: '126 ₽', badge: 'бонусы −54 ₽' }, 'списание видно над суммой');
        await p.screenshot({ path: path.join(out, point + '-dock-bonus.png') });
        const seen = new Set();
        const sampling = (async () => { for (let i = 0; i < 75; i++) { seen.add((await dock()).sum); await p.waitForTimeout(20); } })();
        await H.pay(p, 'Безналичный'); await sampling;
        assert.deepEqual([...seen], ['126 ₽'], 'сумма при смене оплаты не меняется: ' + [...seen].join(', '));
        await waitDue(p, '126 ₽');
        await H.close(p);
        const checkout = t.server.calls.filter(c => c.action === 'checkout').at(-1);
        assert.deepEqual([checkout.input.pay, checkout.input.redeemMinor, checkout.input.expectedTotalMinor], ['Безналичный', 5400, 18000]);
      });
      await run(point, 'моти-кейк не участвует: без карты — скидка только на моти', 'new', 'new', async (p, t) => {
        await basket(p); await p.locator('[data-name="' + CAKE_NAME + '"] .k-tile__hit').click();
        assert.equal(await p.evaluate(() => cartTotal()), 706, '306 + 400');
        await H.close(p);
        const save = t.s.calls.filter(c => c.action === 'save_check').at(-1);
        assert.ok(save.body.items.some(i => i.catalogItemId === CAKE));
      }, 0, true);
      await run(point, 'моти-кейк не участвует: с картой сумма совпадает с сервером, списание снимает скидку', 'new', 'new', async (p, t) => {
        await basket(p); await p.locator('[data-name="' + CAKE_NAME + '"] .k-tile__hit').click(); await H.card(p);
        await waitDue(p, '706 ₽');
        assert.deepEqual([last(t).totalMinor, last(t).promotionDiscountMinor, last(t).redeemBasisTotalMinor], [70600, 5400, 76000]);
        assert.equal(norm((await view(p)).hint), 'Сейчас скидка по акции −54 ₽. Бонусами можно списать до 228 ₽ вместо неё.');
        await setRedeem(p, 50); await waitDue(p, '710 ₽');
        assert.deepEqual([last(t).totalMinor, last(t).promotionWaived], [76000, true]);
        await H.close(p);
        const checkout = t.server.calls.filter(c => c.action === 'checkout').at(-1);
        assert.deepEqual([checkout.input.redeemMinor, checkout.input.expectedTotalMinor], [5000, 76000]);
        await p.screenshot({ path: path.join(out, point + '-cake-excluded.png') });
      }, 0, true);
      await run(point, 'моти-кейк участвует (переключатель включён): скидка и на него, касса и сервер сходятся', 'new', 'new', async (p, t) => {
        await basket(p); await p.locator('[data-name="' + CAKE_NAME + '"] .k-tile__hit').click();
        assert.equal(await p.evaluate(() => cartTotal()), 646);
        await H.card(p); await waitDue(p, '646 ₽');
        assert.equal(last(t).totalMinor, 64600);
      }, 0, false);
      if (sites.main) await run(point, 'прежняя касса + новый сервер: расчёт верный, покупка проходит', 'main', 'new', async (p, t) => {
        await basket(p); await H.card(p); await waitDue(p, '306 ₽');
        await setRedeem(p, 50); await waitDue(p, '310 ₽');
        assert.deepEqual([last(t).totalMinor, last(t).promotionWaived], [36000, true]);
        await H.close(p);
        const checkout = t.server.calls.filter(c => c.action === 'checkout').at(-1);
        assert.equal(checkout.input.redeemMinor, 5000); assert.equal(checkout.input.expectedTotalMinor, 36000);
      });
    }
  } finally {
    await browser.close(); for (const site of Object.values(sites)) site.s.close();
    fs.writeFileSync(path.join(out, 'RESULTS.json'), JSON.stringify(results, null, 1));
  }
  const failed = results.filter(r => r.status !== 'PASS');
  console.log((results.length - failed.length) + '/' + results.length + ' PASS' + (sites.main ? '' : ' (прежняя касса не проверялась: нет копии main)'));
  process.exit(failed.length ? 1 : 0);
})();
