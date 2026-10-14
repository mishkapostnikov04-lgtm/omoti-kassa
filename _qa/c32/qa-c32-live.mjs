// Проверка ДЕЙСТВУЮЩЕЙ кассы (локально или опубликованной) на C3.2: геометрия дока, прокрутка, касания, движение.
//   BASE_URL=https://…/omoti_anikina.html node tools/qa-c32-live.mjs [geometry|scroll|motion|reduced|all]
//   BASE_URL=http://localhost:8080/omoti_anikina.html …   (локальный сервер из корня репозитория)
//
// БЕЗОПАСНОСТЬ. Каждый запрос к orders.omoti.ru отвечается фикстурой и НЕ уходит на сервер.
// Любой запрос к orders.omoti.ru, которого нет в FIXTURES, — ошибка прогона. Чеки не сохраняются (save_check не вызывается).
//
// Что дописать Codex: SEL — селекторы после внедрения (если отличаются), FIXTURES — по коду, если формат изменился.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const H=require('../c31/harness.cjs');
const {chromium}=H;

const root=path.resolve(process.env.C32_PACK||path.join(H.root,'../_local_artifacts/cashier-anikina-c32-20261014/package/omoti-kassa-c32-handoff-addon'));
const BASE_URL = process.env.BASE_URL; if (!BASE_URL) { console.error('BASE_URL не задан'); process.exit(2); }
const only = process.argv[2] || 'all';
const motionSpec = JSON.parse(fs.readFileSync(path.join(root, 'design-system/motion.json'), 'utf8'));

const SEL = {
  app: '.app', grid: '#flavors-grid', dock: '.k-dock', fade: '.k-fade',
  tile: n => `.k-tile[data-name="${n}"] .k-tile__hit`, count: n => `.k-tile[data-name="${n}"] .k-count`,
  checkBtn: '.k-ib--check, #c31-cart', scrim: '.k-scrim', pay: t => `.k-dock__r2 [data-pay="${t}"]`, unpay: '.k-chosen',
};
const now = new Date().toISOString();
const FIXTURES = {
  'GET /b2c-api/cashier-access/status': { ok: true, device: { status: 'approved' }, serverNow: now },
  'GET /b2c-api/cashier-notices': { ok: true, notices: [] },
  'GET /b2c-api/b2c/cashier/anikina/promotion': { ok: true, serverNow: now, promotions: [] },
  'GET /b2c-api/b2c/cashier/anikina/checks': { ok: true, checks: [] },
  'GET /b2c-api/b2c/cashier/anikina/summary': { ok: true, totals: {}, staff: [], topFlavors: [], payments: [], defects: [] },
};
const leaks = [];
let failCount = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) failCount++; return c; };

// Runtime adaptation: existing strict fixture owner; SW blocked.
async function open(b,w,h,{ios=false,reduced=false}={}){
 const t=await H.context(b,BASE_URL,w,h),p=t.page,ctx=t.ctx;
 await p.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
 ctx.on('close',()=>{leaks.push(...t.missing.filter(x=>!x.includes('kaspersky-labs.com/')));ok(t.errors.length===0,'runtime errors: '+JSON.stringify(t.errors));});
 await p.goto(BASE_URL);await p.waitForFunction(()=>window.C31UI&&promotionConfig);await p.evaluate(()=>document.fonts.ready);
 if(ios)await p.addStyleTag({content:':root{--k-safe-t:59px!important;--k-safe-b:34px!important}'});
 await p.waitForTimeout(150);return {ctx,p,errs:t.errors};
}
const firstFlavors = p => p.evaluate(s => [...document.querySelectorAll(s + ' .k-tile:not(.k-tile--off)')].map(t => t.dataset.name), SEL.grid);
const cart = p => p.evaluate(() => ({ ...cart }));
const metrics = p => p.evaluate(S => {
  const R = e => e.getBoundingClientRect(); const d = R(document.querySelector(S.dock)); const g = document.querySelector(S.grid);
  const tiles = [...g.querySelectorAll('.k-tile')]; const last = Math.max(...tiles.map(t => R(t).bottom));
  const cd = parseFloat(getComputedStyle(document.querySelector(S.app)).getPropertyValue('--k-current-dock'));
  return { dock: d.height, dockTop: d.top, cd, last, fadeTop: R(document.querySelector(S.fade)).top, docScroll: document.scrollingElement.scrollTop, gridScroll: g.scrollTop };
}, { app: SEL.app, grid: SEL.grid, dock: SEL.dock, fade: SEL.fade });

async function geometry(b) {
  for (const [w, h, ios] of [[360, 780, false], [390, 844, false], [393, 852, true], [430, 932, false]]) {
    const { ctx, p } = await open(b, w, h, { ios });
    const names = await firstFlavors(p);
    for (const state of ['empty', 'check', 'self']) {
      if (state === 'check') for (const n of names.slice(0, 3)) await p.tap(SEL.tile(n));
      if (state === 'self') await p.evaluate(() => { const b = [...document.querySelectorAll('#pay-grid .pay-btn')].find(x => x.textContent === 'Себе оплачено'); if (b) setPay(b, 'Себе оплачено'); });
      await p.waitForTimeout(400);
      await p.evaluate(s => { document.querySelector(s).scrollTop = 1e6; }, SEL.grid); await p.waitForTimeout(150);
      const m = await metrics(p); const tag = `${w}×${h}${ios ? ' iPhone' : ''} ${state}:`;
      ok(Math.abs(m.cd - m.dock) <= 1, `${tag} --k-current-dock ${m.cd} = фактический док ${m.dock.toFixed(1)}`);
      ok(m.last <= m.fadeTop + 0.5, `${tag} низ последнего ряда ${m.last.toFixed(1)} ≤ верх тени над доком ${m.fadeTop.toFixed(1)}`);
      ok(m.docScroll === 0, `${tag} страница не сдвинута`);
    }
    await ctx.close();
  }
}

// Прокрутка: «палец» через CDP Input.dispatchTouchEvent (Chromium). Начало жеста — в центре плитки.
// Chromium не повторяет все особенности WebKit на iPhone, поэтому §4 QA обязательно проходится и на настоящих телефонах.
async function scroll(b) {
  const { ctx, p } = await open(b, 360, 640, { ios: true });
  const cdp = await ctx.newCDPSession(p); const names = await firstFlavors(p);
  const range = () => p.evaluate(s => { const g = document.querySelector(s); return g.scrollHeight - g.clientHeight; }, SEL.grid);
  async function drag(name, dy, { rerenderAt = 0 } = {}) {
    const r = await p.locator(`.k-tile[data-name="${name}"]`).boundingBox();
    const x = r.x + r.width / 2, y = Math.min(Math.max(r.y + r.height / 2, 120), 420);
    const s0 = (await metrics(p)).gridScroll;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 12; i++) {
      if (rerenderAt && i === rerenderAt) await p.evaluate(() => { updateCart(); });          // перерисовка посреди жеста
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + dy * i / 12 }] });
      await new Promise(r => setTimeout(r, 16));
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await p.waitForTimeout(250);
    const s1 = (await metrics(p)).gridScroll, max = await range();
    const expectMove = dy < 0 ? s0 < max - 1 : s0 > 1;                                          // у края двигаться некуда
    return !expectMove || Math.abs(s1 - s0) >= 20;
  }
  for (const n of names.slice(0, 4)) await p.tap(SEL.tile(n));
  ok(await range() > 100, 'сетка прокручивается (есть что листать на 360 × 640)');
  const before = JSON.stringify(await cart(p));
  let stuck = 0; for (let i = 0; i < 20; i++) if (!(await drag(names[(i % 6) + 3], i % 2 ? 180 : -180))) stuck++;
  ok(stuck === 0, `20 быстрых жестов, начатых на плитке: «залипших» ${stuck}`);
  ok(JSON.stringify(await cart(p)) === before, 'жесты прокрутки не изменили количество');
  stuck = 0; for (let i = 0; i < 10; i++) if (!(await drag(names[5], i % 2 ? 180 : -180, { rerenderAt: 4 }))) stuck++;
  ok(stuck === 0, `перерисовка updateCart() посреди жеста: «залипших» ${stuck}`);
  stuck = 0; for (let i = 0; i < 4; i++) if (!(await drag(names[5], i % 2 ? 180 : -180))) stuck++;
  ok(stuck === 0, 'сразу после перерисовок прокрутка работает с первого жеста');
  await p.click(SEL.checkBtn); await p.waitForTimeout(350); await p.keyboard.press('Escape'); await p.waitForTimeout(350);
  ok(await drag(names[4], -180) && await drag(names[4], 180), 'после листа чека прокрутка с первого жеста');
  const payBtn = p.locator('.k-dock__r2 .k-pay').first(); if (await payBtn.count()) { await payBtn.tap(); await p.waitForTimeout(300); }
  ok(await drag(names[4], -180) && await drag(names[4], 180), 'после выбора оплаты прокрутка с первого жеста');
  if (await p.locator(SEL.unpay).count()) await p.tap(SEL.unpay);
  const n = names[0]; const q0 = (await cart(p))[n] || 0;
  for (let i = 0; i < 30; i++) await p.tap(SEL.tile(n));
  ok(((await cart(p))[n] || 0) === q0 + 30, '30 быстрых касаний = ровно +30');
  ok(await drag(names[2], -180) && await drag(names[2], 180), 'после 30 добавлений прокрутка работает');
  const q1 = (await cart(p))[n]; await p.tap(SEL.count(n)); ok((await cart(p))[n] === q1, 'тап по числу не меняет количество');
  ok((await metrics(p)).docScroll === 0, 'страница ни разу не сдвинулась');
  await ctx.close();
}

async function motion(b) {
  const { ctx, p } = await open(b, 390, 844);
  const names = await firstFlavors(p);
  await p.tap(SEL.tile(names[0])); await p.tap(SEL.tile(names[0]));
  const anims = await p.evaluate(() => document.getAnimations().map(a => ({ c: String(a.effect?.target?.className || ''), d: a.effect.getComputedTiming().duration })));
  const has = (cls, d) => anims.some(a => a.c.includes(cls) && Math.round(a.d) === d);
  ok(has('k-count', 260), 'число: 260 мс'); ok(has('k-fly', 420), '«+1»: 420 мс'); ok(has('k-sum', 260), 'сумма: 260 мс'); ok(has('k-cnt', 240), '«Чек · N»: 240 мс');
  await p.click(SEL.checkBtn); await p.waitForTimeout(30);
  const t = await p.evaluate(() => document.getAnimations().map(a => ({ c: String(a.effect?.target?.className || ''), d: a.effect.getComputedTiming().duration, p: a.transitionProperty })));
  ok(t.some(a => a.c.includes('k-sheet') && a.p === 'transform' && Math.round(a.d) === 260), 'лист: transform 260 мс');
  ok(t.some(a => a.c.includes('k-scrim') && Math.round(a.d) === 200), 'затемнение: 200 мс');
  console.log('  эталон параметров:', motionSpec.effects.map(e => e.n + ':' + JSON.stringify(e.duration)).join(' '));
  await ctx.close();
}

async function reduced(b) {
  const { ctx, p } = await open(b, 390, 844, { reduced: true });
  await p.evaluate(() => { window.__vib = 0; navigator.vibrate = () => { window.__vib++; return true; }; });
  const names = await firstFlavors(p); await p.tap(SEL.tile(names[0])); await p.click(SEL.checkBtn); await p.waitForTimeout(30);
  ok(await p.evaluate(() => document.getAnimations().length === 0 && !document.querySelector('.k-fly') && window.__vib === 0), '«Уменьшение движения»: ни одной анимации, «+1» и вибрации');
  await ctx.close();
}

const b = await chromium.launch({executablePath:process.env.OMOTI_CHROME_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
for (const [k, f] of Object.entries({ geometry, scroll, motion, reduced })) if (only === 'all' || only === k) { console.log(`\n== ${k}`); await f(b); }
await b.close();
ok(leaks.length === 0, `запросы без фикстур: ${leaks.length ? leaks.join(', ') : 'нет'}`);
console.log(failCount ? `\nОшибок: ${failCount}` : '\nВсё прошло'); process.exit(failCount ? 1 : 0);
