// Проверка пакета и кода кассы на соответствие C3.2.
//   node tools/check-c32.mjs                 — эталоны: прототип в каждом состоянии manifest.json → метрики
//   node tools/check-c32.mjs --code ../repo  — код кассы: нет ли значений 3.1, которые C3.2 заменил; есть ли обязательное новое
// Ничего не отправляет в сеть, кроме загрузки шрифта Google Fonts прототипом (можно без сети — будет системный шрифт).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const H=require('../c31/harness.cjs');
const root=path.resolve(process.env.C32_PACK||path.join(H.root,'../_local_artifacts/cashier-anikina-c32-20261014/package/omoti-kassa-c32-handoff-addon'));
const arg = process.argv.slice(2);
let fail = 0; const bad = m => { fail++; console.log('FAIL', m); };

if (arg[0] === '--code') {
  const repo = path.resolve(arg[1] || '.');
  const files = ['omoti_anikina.html', ...fs.readdirSync(path.join(repo, 'anikina-c31')).filter(f => /\.(css|js)$/.test(f)).map(f => 'anikina-c31/' + f)];
  const src = Object.fromEntries(files.map(f => [f, fs.readFileSync(path.join(repo, f), 'utf8')]));
  const all = Object.values(src).join('\n');
  // Значения 3.1, заменённые в 3.2 (CHANGES.md §0, §10). Комментарии не считаются.
  const STALE = [
    ['k-ctx', /\bk-ctx\b/], ['k-staff', /\bk-staff\b/], ['k-mode', /\bk-mode\b/], ['data-mode', /data-mode/], ['k-tape', /\bk-tape\b/],
    ['k-dock__label', /k-dock__label/], ['k-dock__note', /k-dock__note/], ['k-tile__price', /k-tile__price/], ['k-tile--prem', /k-tile--prem/], ['k-tile__foot', /k-tile__foot/],
    ['--k-svc-*', /--k-svc-/], ['is-service', /is-service/], ['«Служебное» в интерфейсе', />\s*Служебное\s*</],
    ['«СЛУЖЕБНОЕ · не продажа»', /СЛУЖЕБНОЕ · не продажа/], ['«СПИСАНИЕ БРАКА · не выручка»', /СПИСАНИЕ БРАКА · не выручка/],
    ['фиксированная высота дока строкой', /--k-current-dock['"]\s*,\s*payType/], ['--k-current-dock:174px', /--k-current-dock:\s*174px/],
    ['сетка от номинального дока', /current-dock\)\s*\+\s*12px/], ['низ дока max(16px, inset)', /max\(\s*(?:var\(--k-dock-pad-bottom\)|16px)\s*,\s*env\(safe-area-inset-bottom\)\s*\)/],
    ['кнопка ↶ в доке #c31-undo в .k-dock__r1', /k-dock__r1[^`]*c31-undo/], ['вкусы в списке Журнала k-row__i', /k-row__i\b/], ['k-row--service', /k-row--service/],
    ['янтарная метка карты k-badge--card', /k-badge--card/], ['скрытие полосы прокрутки сетки', /(?:k-grid|flavors-grid)[^{}]*\{[^}]*scrollbar-width:\s*none/],
    ['перерисовка всей сетки innerHTML', /grid\.innerHTML\s*=/],
  ];
  const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const [name, re] of STALE) for (const [f, s] of Object.entries(src)) if (re.test(strip(s))) bad(`осталось из 3.1: ${name} — ${f}`);
  const NEED = [['KMotion.init', /KMotion\.init\(/], ['.k-topline', /k-topline/], ['ResizeObserver на доке', /ResizeObserver/], ['--k-current-dock от замера', /getBoundingClientRect\(\)\.height/],
    ['overscroll-behavior: contain', /overscroll-behavior:\s*contain/], ['лист через .is-open', /is-open/], ['«СЕБЕ И БРАК · НЕ В ВЫРУЧКУ»', /СЕБЕ И БРАК · НЕ В ВЫРУЧКУ/], ['k-jgroup (Журнал 3.2)', /k-jgroup/], ['k-rcpt (открытый чек 3.2)', /k-rcpt/]];
  for (const [name, re] of NEED) if (!re.test(all)) bad(`нет обязательного 3.2: ${name}`);
  console.log(fail ? `\nНайдено расхождений: ${fail}` : 'Код: значений 3.1 не осталось, обязательное 3.2 на месте');
  process.exit(fail ? 1 : 0);
}

const {chromium}=H;
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'reference/manifest.json'), 'utf8')).filter(x => x.preset);
const html = fs.readFileSync(path.join(root, 'prototype/kassa-c32-prototype.html'), 'utf8');
const b = await chromium.launch({executablePath:process.env.OMOTI_CHROME_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const pages = {};
for (const x of manifest) {
  const key = x.w + 'x' + x.h;
  if (!pages[key]) {
    const ctx = await b.newContext({ viewport: { width: x.w, height: x.h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'ru-RU' });
    const p = await ctx.newPage(); await p.setContent(html, { waitUntil: 'load' }).catch(() => {});
    await p.evaluate(([w, h]) => window.C32.frame(w, h), [x.w, x.h]); pages[key] = p;
  }
  const p = pages[key];
  await p.evaluate(k => C32.frameKind(k), x.frame === 'iphone' ? 'ios' : 'android');
  // Isolate each case from the previous preset. The sealed prototype observes content-box;
  // padding-only frame changes can otherwise retain its prior --k-current-dock measurement.
  // Exercise both content sizes after setting the frame, then keep ALL original metric assertions.
  await p.evaluate(() => C32.preset('empty')); await p.waitForTimeout(350);
  await p.evaluate(() => C32.preset('check')); await p.waitForTimeout(350);
  await p.evaluate(n => C32.preset(n), x.preset); await p.waitForTimeout(450);
  if (x.scrolledToEnd) { await p.evaluate(() => document.getElementById('grid').scrollTop = 1e6); await p.waitForTimeout(80); }
  const m = await p.evaluate(() => {
    const R = e => e.getBoundingClientRect(); const d = R(document.getElementById('dock'));
    const cd = parseFloat(getComputedStyle(document.getElementById('app')).getPropertyValue('--k-current-dock'));
    const kassa = !document.querySelector('.k-kassa').hidden; const g = document.getElementById('grid');
    const last = kassa ? Math.max(...[...g.querySelectorAll('.k-tile')].map(t => R(t).bottom)) : 0;
    const tile = document.querySelector('.k-tile:not(.k-tile--edit)');
    return { dock: Math.round(d.height), cd, dockTop: d.top, last, fadeTop: R(document.querySelector('.k-fade')).top, tileH: tile && kassa ? Math.round(R(tile).height) : 70, hs: document.documentElement.scrollWidth > innerWidth };
  });
  if (Math.abs(m.dock - x.dock) > 1) bad(`${x.id}: док ${m.dock}, эталон ${x.dock}`);
  if (Math.abs(m.cd - m.dock) > 1) bad(`${x.id}: --k-current-dock ${m.cd} ≠ док ${m.dock}`);
  if (m.tileH !== 70) bad(`${x.id}: плитка ${m.tileH}`);
  if (x.scrolledToEnd && m.last > m.fadeTop + 0.5) bad(`${x.id}: последний ряд под тенью/доком`);
  if (m.hs) bad(`${x.id}: горизонтальная прокрутка`);
}
await b.close();
console.log(fail ? `\nРасхождений: ${fail}` : `Эталоны: ${manifest.length} состояний прототипа совпадают с manifest.json`);
process.exit(fail ? 1 : 0);
