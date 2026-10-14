// Проверка «Итогов» действующей кассы (локально или опубликованной) на C3.2 вариант А.
//   BASE_URL=https://…/omoti_anikina.html node tools/qa-itogi-live.mjs
// БЕЗОПАСНОСТЬ: все запросы к orders.omoti.ru — фикстуры; запрос без фикстуры = ошибка. Только чтение (GET).
import { createRequire } from 'node:module'; const require=createRequire(import.meta.url); const {chromium}=require('../c31/harness.cjs');
const BASE_URL = process.env.BASE_URL; if (!BASE_URL) { console.error('BASE_URL не задан'); process.exit(2); }
const now = new Date().toISOString();
const SUMMARY = { ok: true, totals: { mochiQty: 651, salesAmount: 120345, cashReceived: 14960, yandexQty: 20 },
  staff: [{ seller: 'Ярмарка', qty: 599 }, { seller: 'Евгений', qty: 33 }, { seller: 'Марина', qty: 11, selfDeduct: 2530, selfUnpaidQty: 25 }, { seller: 'Анна', qty: 8 }, { seller: 'Людмила', qty: 0 }],
  topFlavors: [['Дубайский шоколад', 68], ['Мята шоколад', 54], ['Сникерс', 49], ['Банан- Нутелла', 41], ['Трюфель', 41], ['Сливочный лимон', 36], ['Твикс', 36], ['Бабл Гам', 35]].map(([name, qty]) => ({ name, qty })),
  payments: [], defects: [{ name: 'Сникерс', qty: 10 }, { name: 'Дубайский шоколад', qty: 6 }, { name: 'Клубника', qty: 6 }, { name: 'Мохито', qty: 4 }],
  loyaltySummary: { cardChecks: 79, spentMinor: 103500, earnedMinor: 274400, pendingCount: 0, activity: { changesCount: 1, cancelledCount: 1, spentAdjustmentMinor: 0, earnedAdjustmentMinor: -900 } } };
const FX = { 'GET /b2c-api/cashier-access/status': { ok: true, device: { status: 'approved' }, serverNow: now }, 'GET /b2c-api/cashier-notices': { ok: true, notices: [] },
  'GET /b2c-api/b2c/cashier/anikina/promotion': { ok: true, serverNow: now, promotions: [] }, 'GET /b2c-api/b2c/cashier/anikina/checks': { ok: true, checks: [] },
  'GET /b2c-api/b2c/cashier/anikina/summary': SUMMARY };
const leaks = []; let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const KEY = 'omoti_anikina_stats_sections_v1', DEF = { results: true, attention: false, bonus: true, staff: true, top: false };
async function open(b, w, h, ctxIn) {
  const ctx = ctxIn || await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers:'block', locale: 'ru-RU' });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/*', async r => { const q = r.request(), u = new URL(q.url());
    if (u.hostname === 'orders.omoti.ru') { const k = Object.keys(FX).find(k => `${q.method()} ${u.pathname}`.startsWith(k)); if (!k) { leaks.push(`${q.method()} ${u.pathname}`); return r.fulfill({ status: 503, body: '{"ok":false}' }); } return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(FX[k]) }); }
    if (/google|gstatic|yandex|metrika/.test(u.hostname)) return r.abort(); return r.continue(); });
  await p.goto(BASE_URL); await p.waitForTimeout(1500); await p.evaluate(() => switchTab('stats')); await p.waitForTimeout(1200);
  return { ctx, p, errs };
}
const state = p => p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.k-stats .k-sec')].map(s => [s.dataset.sec, s.classList.contains('is-open')])));
const b = await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe"});
for (const [w, h] of [[390, 844], [360, 780], [430, 932]]) {
  const { ctx, p, errs } = await open(b, w, h); const tag = `${w}×${h}:`;
  const keys = await p.evaluate(() => [...document.querySelectorAll('.k-stats .k-sec')].map(s => s.dataset.sec));
  ok(JSON.stringify(keys) === JSON.stringify(['results', 'attention', 'bonus', 'staff', 'top']), `${tag} пять разделов по порядку (${keys.join(', ')})`);
  if (w === 390 && keys.length === 5) {
    ok(JSON.stringify(await state(p)) === JSON.stringify(DEF), `${tag} состояние по умолчанию`);
    const sums = await p.evaluate(() => [...document.querySelectorAll('.k-sec.is-closed')].map(s => s.querySelector('.k-sec__sum,.k-sec__chips')?.textContent.trim()));
    ok(sums.length === 2 && sums.every(Boolean), `${tag} у свёрнутых разделов есть сводка: ${sums.join(' | ')}`);
    ok(await p.evaluate(() => /Долг\s*·\s*2\s?530/.test(document.querySelector('[data-sec="attention"] .k-sec__chips')?.textContent || '') && /Брак\s*·\s*26 шт/.test(document.querySelector('[data-sec="attention"] .k-sec__chips')?.textContent || '')), `${tag} чипы «Долг · 2 530 ₽», «Брак · 26 шт» из данных кода`);
    ok(await p.evaluate(() => /8 вкусов/.test(document.querySelector('[data-sec="top"] .k-sec__sum')?.textContent || '')), `${tag} сводка Топа «8 вкусов»`);
    await p.click('[data-sec="top"] .k-sec__head'); await p.click('[data-sec="bonus"] .k-sec__head');
    const st = await state(p); ok(st.top === true && st.bonus === false, `${tag} тап по заголовку раскрывает и сворачивает`);
    ok(await p.evaluate(k => { try { const v = JSON.parse(localStorage.getItem(k)); return v.top === true && v.bonus === false; } catch (_) { return false; } }, KEY), `${tag} состояние записано в ${KEY}`);
    await p.evaluate(() => selectAll()); await p.waitForTimeout(900);
    const st2 = await state(p); ok(st2.top === true && st2.bonus === false, `${tag} смена периода не сбрасывает разделы`);
    await p.reload(); await p.waitForTimeout(1500); await p.evaluate(() => switchTab('stats')); await p.waitForTimeout(1200);
    const st3 = await state(p); ok(st3.top === true && st3.bonus === false, `${tag} после перезагрузки разделы как были`);
    await p.click('[data-sec="attention"]', { position: { x: 60, y: 60 } }).catch(() => {}); ok((await state(p)).attention === true, `${tag} тап по свёрнутой карточке (чипы) раскрывает`);
    ok(await p.evaluate(() => { const r = document.querySelector('[data-sec="results"]'); return !!r && !r.textContent.includes('от клиентов') && !r.textContent.includes('засчитаны'); }), `${tag} подписей «от клиентов», «засчитаны» нет`);
  }
  if (keys.length !== 5) ok(false, `${tag} разметка C3.2 (.k-stats, .k-sec) не найдена — дальнейшие проверки раскрытия пропущены`);
  const g = await p.evaluate(() => { const sc = document.querySelector('.k-stats__scroll'), d = document.querySelector('.k-dock'); if (!sc) return null; sc.scrollTop = 1e6; const R = e => e.getBoundingClientRect(); const secs = [...document.querySelectorAll('.k-stats .k-sec:not([hidden])')];
    const nested = [...document.querySelectorAll('.k-stats *')].filter(e => e !== sc && e.scrollHeight > e.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)).length;
    return { bottom: Math.round(R(sc).bottom), dockTop: Math.round(R(d).top), last: secs.length ? Math.round(R(secs.at(-1)).bottom) : 1e6, nested, doc: document.scrollingElement.scrollTop }; });
  ok(!!g && g.bottom === g.dockTop, `${tag} низ прокрутки = верх дока`);
  ok(!!g && g.dockTop - g.last >= 8, `${tag} последний раздел полностью над доком`);
  ok(!!g && g.nested === 0, `${tag} одна прокрутка, вложенных нет`);
  ok(!!g && g.doc === 0, `${tag} страница не сдвинута`);
  ok(errs.length === 0, `${tag} ошибок в консоли нет${errs.length ? ': ' + errs[0] : ''}`);
  await ctx.close();
}
await b.close();
ok(leaks.length === 0, `запросы без фикстур: ${leaks.join(', ') || 'нет'}`);
console.log(fails ? `\nОшибок: ${fails}` : '\nВсё прошло'); process.exit(fails ? 1 : 0);
