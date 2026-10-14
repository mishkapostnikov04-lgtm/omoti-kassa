// Эталоны «Итогов»: прототип в каждом состоянии manifest.json → метрики. node tools/check-itogi.mjs
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; const require=createRequire(import.meta.url); const {chromium}=require('../c31/harness.cjs');
const root = "E:\\OMOTI работа\\ОМОТИ проекты\\_local_artifacts\\cashier-anikina-itogi-c32-20261014\\package\\omoti-kassa-c32-itogi-addon";
const man = JSON.parse(fs.readFileSync(path.join(root, 'reference/manifest.json'), 'utf8'));
const html = fs.readFileSync(path.join(root, 'prototype/itogi-c32-prototype.html'), 'utf8');
const b = await chromium.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe"}); let fail = 0;
for (const x of man) {
  const ctx = await b.newContext({ viewport: { width: x.w, height: x.h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); await p.route('**/*',async r=>{const u=new URL(r.request().url());if(u.hostname==='fonts.googleapis.com')return r.fulfill({contentType:'text/css',body:[400,500,600,700,800].map(w=>'@font-face{font-family:Geologica;font-weight:'+w+';src:url("http://127.0.0.1:8898/anikina-c31/geologica-'+w+'.ttf")}').join('')});if(u.hostname==='127.0.0.1')return r.continue();return r.abort();}); await p.setContent(html, { waitUntil: 'load' }).catch(() => {});
  await p.evaluate(([w, h, ios]) => IT.frame(w, h, ios), [x.w, x.h, x.frame === 'iphone']);
  await p.evaluate(()=>document.fonts.ready); await p.evaluate(n => IT.preset(n), x.preset); await p.waitForTimeout(350);
  const m = await p.evaluate(() => {
    const R = e => e.getBoundingClientRect(), d = R(document.getElementById('dock')), sc = document.getElementById('scroll'), secs = [...document.querySelectorAll('.k-sec')];
    const last = secs.length ? R(secs.at(-1)).bottom : 0, end = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 2;
    return { dock: Math.round(d.height), scrollBottom: Math.round(R(sc).bottom), dockTop: Math.round(d.top),
      closed: secs.filter(s => s.classList.contains('is-closed') && !s.querySelector('.k-sec__chips')).map(s => Math.round(R(s).height)),
      clip: [...document.querySelectorAll('.k-sec__title,.k-figure,.k-kpi dd,.k-srow__val,.k-barrow__val,.k-problem,.k-period__txt b')].filter(e => e.offsetParent && e.scrollWidth > e.clientWidth + 1).length,
      lastGap: end ? Math.round(d.top - last) : null, hs: document.documentElement.scrollWidth > innerWidth };
  });
  const bad = [];
  if (Math.abs(m.dock - x.dock) > 1) bad.push(`док ${m.dock} ≠ ${x.dock}`);
  if (m.scrollBottom !== m.dockTop) bad.push('прокрутка заходит под док');
  if (m.closed.some(h => h !== 56)) bad.push('свёрнутый раздел не 56: ' + m.closed);
  if (m.clip) bad.push('обрезан текст: ' + m.clip);
  if (m.lastGap !== null && m.lastGap < 20) bad.push('последний раздел у дока: ' + m.lastGap);
  if (m.hs) bad.push('горизонтальная прокрутка');
  if (bad.length) { fail++; console.log('FAIL', x.id, bad.join('; ')); }
  await ctx.close();
}
await b.close();
console.log(fail ? `Расхождений: ${fail}` : `Эталоны: ${man.length} состояний совпадают`); process.exit(fail ? 1 : 0);
