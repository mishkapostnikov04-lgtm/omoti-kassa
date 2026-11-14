'use strict';
// «Перевод» — «По ссылке» / «На карту Анне» (решение владельца 14.11.2026), три кассы.
// Транспорт закрыт (shift-harness: все запросы к orders.omoti.ru перехвачены, service worker заблокирован, настоящих
// чеков нет). Сохранение чека и журнал обслуживает НАСТОЯЩИЙ код сервера розницы (обработчик кассы и хранилище),
// загруженный в Node, на PostgreSQL в памяти (PGlite) со всеми миграциями: кандидат или сервер до выпуска.
// Подстановка стенда: catalogItemId подставного ассортимента (qa_N) убирается, сервер узнаёт вкус по названию.
// Запуск встроенным Node с Playwright из корня репозитория:
//   QA_SERVER_NEW=<…/tests/runtime-cand> QA_SERVER_OLD=<…/tests/runtime-live> QA_PGLITE=<…/pglite/dist/index.js> \
//   QA_MIGRATIONS_B2B=<…/002_shared_catalog_items.sql> node _qa/transfer-kind/transfer-kind.cjs
// QA_SHOTS=<папка> — куда класть снимки.
const fs = require('fs'), path = require('path'), assert = require('assert/strict');
const { Readable } = require('stream');
const { pathToFileURL } = require('url');
const H = require('../anikina-freeze/shift-harness.cjs');

const art = path.resolve(H.root, '..');
const SERVER = { new: path.resolve(process.env.QA_SERVER_NEW || path.join(art, 'tests', 'runtime-cand')), old: path.resolve(process.env.QA_SERVER_OLD || path.join(art, 'tests', 'runtime-live')) };
const PGLITE = process.env.QA_PGLITE || path.resolve(art, '..', 'loyalty-analytics-20261012', 'sql-tests', 'node_modules', '@electric-sql', 'pglite', 'dist', 'index.js');
const B2B_CATALOG = process.env.QA_MIGRATIONS_B2B || path.resolve(art, '..', 'product-groups-20261113', 'stage3', 'live', 'opt', 'omoti', 'app', 'omoti-b2b-server', 'migrations', '002_shared_catalog_items.sql');
const out = path.join(__dirname, 'local-browser'); fs.mkdirSync(out, { recursive: true });
const shots = process.env.QA_SHOTS || out; fs.mkdirSync(shots, { recursive: true });
const points = process.env.QA_POINT ? [process.env.QA_POINT] : ['anikina', 'novogodnyaya', 'sovetskaya'];
const TITLE = { anikina: 'Аникина', novogodnyaya: 'Новогодняя', sovetskaya: 'Советская' };
const norm = (t) => String(t || '').replace(/[\u00a0\u202f]/g, ' ').replace(/\s+/g, ' ').trim();

let PGlite;
const libs = {};
async function serverLib(which) {
  if (!libs[which]) {
    const m = (rel) => import(pathToFileURL(path.join(SERVER[which], 'src', rel)).href);
    libs[which] = { mirror: await m('cashier/mirror.js'), store: await m('legacy/postgres-store.js') };
  }
  return libs[which];
}
async function backend(which) {
  PGlite = PGlite || (await import(pathToFileURL(PGLITE).href)).PGlite;
  const db = new PGlite();
  await db.exec(fs.readFileSync(B2B_CATALOG, 'utf8').replace(/ALTER TABLE order_items[\s\S]*$/, ''));
  await db.exec('ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS bundle_definition jsonb;');
  const mig = path.join(SERVER[which], 'migrations');
  for (const f of fs.readdirSync(mig).filter((f) => f.endsWith('.sql')).sort()) await db.exec(fs.readFileSync(path.join(mig, f), 'utf8'));
  const query = async (sql, params) => { const r = await db.query(typeof sql === 'string' ? sql : sql.text, params ?? sql.values); return { rows: r.rows, rowCount: r.fields?.length ? r.rows.length : (r.affectedRows ?? r.rows.length) }; };
  const pool = { query, connect: async () => ({ query, release() {} }) };
  const lib = await serverLib(which);
  const store = new lib.store.PostgresLegacyRetailStore(pool);
  const handler = lib.mirror.createCashierMirrorApiHandler({ store, authorize: async () => true, includeCashierHistoryDetails: false });
  const saves = [];
  async function call(method, url, body) {
    const raw = body ? Buffer.from(body) : Buffer.alloc(0);
    const req = Readable.from(raw.length ? [raw] : []);
    Object.assign(req, { method, url, headers: { 'content-length': String(raw.length) } });
    return new Promise((resolve, reject) => {
      let status = 0;
      Promise.resolve(handler(req, { writeHead(s) { status = s; }, end(text) { resolve({ status, body: text || '' }); } })).catch(reject);
    });
  }
  return {
    which, pool, saves, fail: false,
    raw: async (num) => (await query('select pay_type, raw_row_json, edited from retail_checks where external_num_normalized=$1', [String(num)])).rows[0] || null,
    async route(ctx) {
      await ctx.route(/orders\.omoti\.ru\/b2c-api\/b2c\/cashier\/(?:[^/]+\/)?(save_check|checks)(\?|$)/, async (r) => {
        const req = r.request(), u = new URL(req.url());
        if (u.pathname.endsWith('/save_check')) {
          if (this.fail) return r.abort('connectionreset');
          const payload = JSON.parse(req.postData() || '{}');
          saves.push(payload);
          const body = { ...payload, items: (payload.items || []).map(({ catalogItemId, bundleVersion, ...item }) => item) };
          const res = await call('POST', '/api/b2c/cashier/save_check', JSON.stringify(body));
          return r.fulfill({ status: res.status, contentType: 'application/json', body: res.body });
        }
        const res = await call('GET', u.pathname.replace('/b2c-api/', '/api/') + u.search);
        return r.fulfill({ status: res.status, contentType: 'application/json', body: res.body });
      });
    },
  };
}

const dock = (p) => p.evaluate(() => {
  const t = (el) => (el ? el.innerText.replace(/[\u00a0\u202f]/g, ' ').replace(/\s+/g, ' ').trim() : '');
  const box = document.getElementById('transfer-clarify'), self = document.getElementById('self-clarify'), close = document.getElementById('close-btn');
  const r = box.getBoundingClientRect();
  return {
    inDock: !!box.closest('.k-dock'), hidden: box.hidden || getComputedStyle(box).display === 'none', selfHidden: self.hidden || getComputedStyle(self).display === 'none',
    text: t(box), pressed: [...box.querySelectorAll('button')].map((b) => b.getAttribute('aria-pressed')),
    sameLook: [...box.querySelectorAll('button')].every((b) => b.className === self.querySelector('button').className.replace(' active', '').trim() || b.classList.contains('self-sub-btn')),
    btnFit: [...box.querySelectorAll('button')].every((b) => b.scrollWidth <= b.clientWidth + 1), boxFit: box.scrollWidth <= box.clientWidth + 1,
    height: Math.round(r.height), closeDisabled: close.disabled, closeText: t(close), docScroll: document.documentElement.scrollWidth - innerWidth,
  };
});
const kind = (p, k) => p.locator(`#transfer-clarify [data-transfer-kind="${k}"]`).click();
async function sale(p, payment, kindValue) {
  await H.add(p);
  await H.pay(p, payment);
  if (kindValue) await kind(p, kindValue);
}
async function journalOf(p, num) {
  await p.locator('.k-nav button').nth(1).click();
  await p.waitForTimeout(250);
  const row = p.locator(`.k-row[data-check="${num}"]`);
  await row.waitFor();
  const text = norm(await row.innerText());
  await row.click();
  await p.locator('.k-rcpt__pay').waitFor();
  return { row: text, detail: norm(await p.locator('.k-rcpt__pay').innerText()) };
}

(async () => {
  const srv = await H.server(), browser = await H.chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' }), results = [];
  async function run(point, name, which, fn) {
    const be = await backend(which);
    const t = await H.context(browser, srv.url, point);
    await be.route(t.ctx);
    const consoleErrors = [];
    t.page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) consoleErrors.push(m.text()); });
    try {
      await fn(t.page, be, t);
      assert.deepEqual(t.s.errors, [], 'нет ошибок страницы');
      assert.deepEqual(t.s.leaks, [], 'нет запросов мимо стенда');
      assert.deepEqual(consoleErrors, [], 'нет ошибок консоли');
      results.push({ point, name, status: 'PASS' }); console.log('PASS', point, name);
    } catch (e) {
      results.push({ point, name, status: 'FAIL', error: String(e && e.message || e) }); console.log('FAIL', point, name, e && e.message);
      await t.page.screenshot({ path: path.join(out, 'FAIL-' + point + '-' + name.replace(/\W+/gu, '-').slice(0, 60) + '.png') }).catch(() => {});
    } finally { await t.ctx.close(); }
  }
  try {
    for (const point of points) {
      await run(point, '«Перевод» требует под-выбор; вид как у «Себе оплачено»; 360/390/768/820 без прокрутки', 'new', async (p) => {
        await H.add(p);
        let d = await dock(p);
        assert.ok(d.inDock && d.hidden, 'до выбора оплаты под-выбора нет');
        // Прямое нажатие: общий помощник H.pay сам выбирает «По ссылке», а здесь проверяется, что заранее ничего не выбрано.
        await p.locator('.k-dock__r2 [data-pay="Перевод"]').click();
        d = await dock(p);
        assert.ok(!d.hidden && d.selfHidden, 'под-выбор виден, «Как оплатили» скрыт');
        assert.equal(d.text, 'Куда перевели: По ссылке На карту Анне');
        assert.deepEqual(d.pressed, ['false', 'false'], 'ничего не выбрано заранее');
        assert.ok(d.closeDisabled && d.closeText === 'Выберите, куда перевели', 'без выбора закрыть нельзя: ' + d.closeText);
        const self = await p.evaluate(() => { const s = document.getElementById('self-clarify'), t = document.getElementById('transfer-clarify'); const cs = (el) => { const c = getComputedStyle(el); return [c.display, c.gridTemplateColumns.split(' ').length, c.height, c.gap].join('|'); }; const b = (el) => { const c = getComputedStyle([...el.querySelectorAll('button')].find((x) => !x.classList.contains('active'))); return [c.height, c.borderRadius, c.fontSize, c.fontWeight, c.backgroundColor, c.color].join('|'); }; s.hidden = false; const r = [cs(s), cs(t), b(s), b(t)]; s.hidden = true; return r; });
        assert.equal(self[1], self[0], 'тот же блок дока, что «Как оплатили»');
        assert.equal(self[3], self[2], 'кнопки того же вида (невыбранные)');
        for (const [w, h] of [[360, 780], [390, 844], [768, 1024], [820, 1180]]) {
          await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(250);
          d = await dock(p);
          assert.ok(d.docScroll <= 0 && d.btnFit && d.boxFit, `без прокрутки и обрезки при ${w}: ${JSON.stringify(d)}`);
          await p.screenshot({ path: path.join(shots, `${point}-transfer-choice-${w}.png`) });
        }
        await p.setViewportSize({ width: 390, height: 844 });
        await kind(p, 'link');
        d = await dock(p);
        assert.deepEqual(d.pressed, ['true', 'false']);
        assert.ok(!d.closeDisabled && d.closeText === 'Закрыть чек', d.closeText);
        for (const w of [360, 768]) { await p.setViewportSize({ width: w, height: w === 360 ? 780 : 1024 }); await p.waitForTimeout(200); await p.screenshot({ path: path.join(shots, `${point}-transfer-link-picked-${w}.png`) }); }
      });
      await run(point, 'оба варианта доходят до сервера-кандидата и хранятся; журнал и чек показывают', 'new', async (p, be) => {
        await sale(p, 'Перевод', 'link'); await H.close(p);
        await sale(p, 'Перевод', 'card'); await H.close(p);
        assert.deepEqual(be.saves.map((x) => [x.pay, x.transferKind]), [['Перевод', 'link'], ['Перевод', 'card']]);
        assert.deepEqual((await be.raw(be.saves[0].num)).raw_row_json, { omotiTransferKind: 'link' });
        assert.deepEqual((await be.raw(be.saves[1].num)).raw_row_json, { omotiTransferKind: 'card' });
        await p.evaluate(() => { dataLoaded = false; return loadRemoteData(true); });
        const j = await journalOf(p, be.saves[1].num);
        assert.match(j.row, /Перевод · на карту Анне/);
        assert.match(j.detail, /^Перевод · на карту Анне/);
        await p.screenshot({ path: path.join(out, `${point}-receipt-card.png`) });
      });
      await run(point, 'правка чека меняет вариант (на карту → по ссылке), сервер хранит новое', 'new', async (p, be) => {
        await sale(p, 'Перевод', 'card'); await H.close(p);
        const num = be.saves[0].num;
        await p.evaluate(() => { dataLoaded = false; return loadRemoteData(true); });
        await journalOf(p, num);
        await p.locator('#c31-edit').click();
        await p.waitForFunction(() => !!editNum);
        let d = await dock(p);
        assert.ok(!d.hidden && d.pressed[1] === 'true' && d.pressed[0] === 'false', 'в правке выбран сохранённый вариант: ' + JSON.stringify(d.pressed));
        await kind(p, 'link');
        await H.close(p);
        const last = be.saves.at(-1);
        assert.deepEqual([String(last.num), last.edited, last.transferKind], [String(num), true, 'link']);
        assert.deepEqual((await be.raw(num)).raw_row_json, { omotiTransferKind: 'link' });
        await p.evaluate(() => { dataLoaded = false; return loadRemoteData(true); });
        assert.match((await journalOf(p, num)).row, /Перевод · по ссылке/);
      });
      await run(point, 'возврат к другой оплате: под-выбор исчезает, поле не уходит; «Смешанная» без под-выбора', 'new', async (p, be) => {
        await sale(p, 'Перевод', 'card');
        await p.locator('.k-dock__r2 .k-chosen').click();
        let d = await dock(p);
        assert.ok(d.hidden, 'после ✕ под-выбора нет');
        // Прямое нажатие: общий помощник H.pay сам выбирает «По ссылке», а здесь проверяется, что заранее ничего не выбрано.
        await p.locator('.k-dock__r2 [data-pay="Перевод"]').click();
        d = await dock(p);
        assert.deepEqual(d.pressed, ['false', 'false'], 'выбор не остаётся от прошлого раза');
        await p.locator('.k-dock__r2 .k-chosen').click();
        await H.pay(p, 'Наличный');
        d = await dock(p);
        assert.ok(d.hidden && !d.closeDisabled);
        await H.close(p);
        assert.equal(be.saves[0].pay, 'Наличный');
        assert.equal('transferKind' in be.saves[0], false, 'поле не отправлено');
        assert.equal((await be.raw(be.saves[0].num)).raw_row_json, null);
        await H.add(p);
        await H.pay(p, 'Смешанная');
        assert.ok((await dock(p)).hidden, 'у смешанной под-выбора нет');
        await H.dismiss(p);
      });
      await run(point, 'офлайн-очередь доносит поле', 'new', async (p, be) => {
        be.fail = true;
        await sale(p, 'Перевод', 'link');
        await H.dismiss(p); await H.ready(p);
        await p.locator('#close-btn').click();
        await p.waitForFunction(() => !Object.values(cart).some((q) => q > 0));
        const queued = await p.evaluate(() => readOperationQueue().map((x) => x.payload));
        assert.equal(queued.length, 1);
        assert.deepEqual([queued[0].pay, queued[0].transferKind], ['Перевод', 'link']);
        be.fail = false;
        await p.evaluate(() => retryOperationQueue());
        await p.waitForFunction(() => !readOperationQueue().length, null, { timeout: 8000 });
        assert.deepEqual((await be.raw(queued[0].num)).raw_row_json, { omotiTransferKind: 'link' });
      });
      await run(point, 'сервер до выпуска: касса с полем работает, чек сохраняется (поле игнорируется)', 'old', async (p, be) => {
        await sale(p, 'Перевод', 'link'); await H.close(p);
        assert.equal(be.saves[0].transferKind, 'link');
        const row = await be.raw(be.saves[0].num);
        assert.deepEqual([row.pay_type, row.raw_row_json], ['Перевод', null]);
        await p.evaluate(() => { dataLoaded = false; return loadRemoteData(true); });
        const j = await journalOf(p, be.saves[0].num);
        assert.match(j.row, /Перевод/);
        assert.doesNotMatch(j.row, /по ссылке|на карту/, 'старый сервер признак не возвращает');
      });
    }
  } finally {
    await browser.close(); srv.s.close();
    fs.writeFileSync(path.join(out, 'RESULTS.json'), JSON.stringify(results, null, 1));
  }
  const failed = results.filter((r) => r.status !== 'PASS');
  console.log(results.length - failed.length + '/' + results.length + ' PASS');
  process.exit(failed.length ? 1 : 0);
})();
