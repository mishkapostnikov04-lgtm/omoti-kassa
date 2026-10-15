/* QA новой реализации C3.2 Новогодней и Советской (src/points-ui + две HTML).
   Запуск из корня пакета при работающем preview (python3 preview/server.py):
     PLAYWRIGHT_MODULE=<путь к playwright> node evidence/qa/points-c32-qa.cjs
   Только offline preview и фикстуры: любой запрос не на локальный origin обрывается; реальных операций нет. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const HARN=require('./harness.cjs');
const {chromium}=(()=>{try{return require('playwright');}catch(e){if(process.env.PLAYWRIGHT_MODULE)return require(process.env.PLAYWRIGHT_MODULE);throw Error('Нужен playwright (PLAYWRIGHT_MODULE)');}})();
const root=HARN.root,origin=(process.env.PREVIEW_BASE_URL||'http://127.0.0.1:8906').replace(/\/$/,''),out=path.join(__dirname,'RESULTS-points-c32.json');
const rows=[];const H={360:780,390:844,430:932};
function check(name,fn){return fn().then(()=>{rows.push({case:name,status:'PASS'});console.log('PASS',name);},e=>{rows.push({case:name,status:'FAIL',error:e.message});console.log('FAIL',name,'—',e.message);});}
const sha=f=>crypto.createHash('sha256').update(!f.endsWith('.ttf')?fs.readFileSync(f,'utf8').replaceAll('\r\n','\n'):fs.readFileSync(f)).digest('hex');

(async()=>{
 // 0. Статика: зафиксированная копия базы C3.2 и независимость Аникиной.
 await check('c32-base: копия базовых файлов Аникиной; единственное отличие — xmlns в data:URI integration.css',async()=>{
  for(const f of ['tokens.css','components.css','itogi.css','motion.css','motion.js','geologica-400.ttf','geologica-500.ttf','geologica-600.ttf','geologica-700.ttf','geologica-800.ttf','OFL.txt'])assert.equal(sha(path.join(root,'points-ui/c32-base',f)),sha(path.join(root,'anikina-c31',f)),f);
  const a=fs.readFileSync(path.join(root,'anikina-c31/integration.css'),'utf8').replaceAll('\r\n','\n'),b=fs.readFileSync(path.join(root,'points-ui/c32-base/integration.css'),'utf8');
  assert.equal(b.replace("xmlns='http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'","xmlns='http://www.w3.org/2000/svg'"),a);
 });
 await check('Аникина не подключает points-ui; точки не подключают anikina-c31',async()=>{
  assert.ok(!fs.readFileSync(path.join(root,'omoti_anikina.html'),'utf8').includes('points-ui'));
  for(const f of ['omoti_kassa.html','omoti_sovetskaya.html'])assert.ok(!/anikina-c31\//.test(fs.readFileSync(path.join(root,f),'utf8')),f);
 });

 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 async function open(file,width=390){
  const ctx=await b.newContext({viewport:{width,height:H[width]},serviceWorkers:'block',locale:'ru-RU',timezoneId:'Asia/Novosibirsk',reducedMotion:'reduce'});
  await ctx.addInitScript({content:HARN.fixtureScript()});const leaks=[];await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin===new URL(origin).origin)return r.continue();if(!u.hostname.endsWith('.kaspersky-labs.com'))leaks.push(u.host);return r.abort(); /* Environment injection is blocked, not an app transport. */});
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin+'/src/'+file);await p.waitForFunction(()=>typeof promotionConfig!=='undefined'&&promotionConfig&&document.querySelector('#c31-dock'));
  p.done=async()=>{assert.deepEqual(errors,[],'ошибки страницы');assert.deepEqual(leaks,[],'запросы мимо preview');assert.deepEqual(await p.evaluate(()=>OMOTI_PREVIEW.violations),[],'нарушения стенда');await ctx.close();};
  return p;
 }
 const ready=p=>p.waitForFunction(()=>document.getElementById('stats-content').style.display==='block');
 async function stats(p,sov){if(sov){await p.evaluate(()=>switchTab('stats'));await p.locator('#pin-overlay.open').waitFor();await p.locator('#preview-pin-unlock').click();}else await p.evaluate(()=>switchTab('stats'));await ready(p);}

 try{
 for(const file of ['omoti_kassa.html','omoti_sovetskaya.html']){
  const sov=file.includes('sovetskaya'),P=sov?'Советская':'Новогодняя';

  await check(P+': 4 раздела в доке, порядок кода, «Остатки» с полным aria-label',async()=>{
   const p=await open(file);
   const nav=await p.evaluate(()=>[...document.querySelectorAll('.k-nav .tab-btn')].map(b=>({t:b.textContent.trim(),a:b.getAttribute('aria-label'),c:b.getAttribute('aria-current')})));
   assert.deepEqual(nav.map(x=>x.t),['Касса','Журнал','Итоги','Остатки']);assert.equal(nav[3].a,'Что заканчивается?');assert.equal(nav[0].c,'page');
   await p.evaluate(()=>switchTab('restock'));assert.equal(await p.evaluate(()=>document.querySelectorAll('.k-nav .tab-btn')[3].getAttribute('aria-current')),'page');
   await p.done();
  });

  await check(P+': Итоги — 6 разделов, порядок, раскрытие по умолчанию, запоминание после перезагрузки',async()=>{
   const p=await open(file);await stats(p,sov);
   const secs=await p.evaluate(()=>[...document.querySelectorAll('.k-sec')].map(s=>[s.dataset.sec,s.querySelector('.k-sec__head').getAttribute('aria-expanded')]));
   assert.deepEqual(secs,[['payout','true'],['staff','true'],['sales','true'],['attention','false'],['bonus','true'],['top','false']]);
   await p.locator('[data-sec="payout"] .k-sec__head').click();await p.locator('[data-sec="top"] .k-sec__head').click();
   assert.equal(await p.locator('[data-sec="payout"] .k-sec__sum').textContent(),await p.locator('#p-total').textContent(),'свёрнутая сводка = #p-total');
   await p.reload();await p.waitForFunction(()=>typeof promotionConfig!=='undefined'&&promotionConfig);await stats(p,sov);
   assert.equal(await p.locator('[data-sec="payout"] .k-sec__head').getAttribute('aria-expanded'),'false');assert.equal(await p.locator('[data-sec="top"] .k-sec__head').getAttribute('aria-expanded'),'true');
   assert.ok(await p.evaluate(k=>!!localStorage.getItem(k),'omoti_'+(sov?'sovetskaya':'novogodnyaya')+'_stats_sections_v1'));
   await p.done();
  });

  await check(P+': «К выплате» и сотрудники показывают ровно поля ответа /summary (без пересчёта)',async()=>{
   const p=await open(file);await stats(p,sov);
   const r=await p.evaluate(async()=>{const j=await (await fetch(CASHIER_SUMMARY_API)).json(),t=j.totals,txt=id=>document.getElementById(id).textContent;
    return {expect:[money(t.earned),money(t.cashReceived),money(t.selfPaidCash),money(t.selfUnpaid),money(t.payout)],shown:['p-sales','p-cash','p-self-paid-cash','p-self','p-total'].map(txt),
     staffExpect:j.staff.map(s=>money(s.payout)),staffShown:[...document.querySelectorAll('#staff-stat-list .k-staffpay__row .ss-payout')].map(e=>e.textContent),
     head:document.querySelector('#staff-stat-list .k-staffpay__head .ss-payout')?.textContent,note:document.querySelector('.k-staffpay__note')?.textContent,
     groups:[...document.querySelectorAll('.k-pay__group')].map(e=>e.textContent),minus:[...document.querySelectorAll('.k-pay__row--minus .k-pay__val')].map(e=>e.id),
     inPayout:['p-sales','p-cash','p-self-paid-cash','p-self','p-total'].every(id=>document.getElementById(id).closest('[data-sec="payout"]'))};});
   assert.deepEqual(r.shown,r.expect);assert.deepEqual(r.staffShown,r.staffExpect);assert.ok(r.inPayout);
   assert.deepEqual(r.groups,['Заработано','Вычитается']);assert.deepEqual(r.minus,['p-cash','p-self-paid-cash','p-self']);
   assert.equal(r.head,'После личных удержаний');assert.match(r.note,/Наличные в кассе здесь не вычтены/);
   for(const id of ['s-earn','s-cash','s-sub','payout-period'])assert.ok(await p.evaluate(i=>!!document.getElementById(i),id),'native #'+id+' в DOM');
   await p.done();
  });

  await check(P+': после фиктивного чека «К выплате» обновляется значением сервера (fixture 380 → 410)',async()=>{
   const p=await open(file);
   await p.evaluate(()=>{const b=[...document.querySelectorAll('#seller-row button')].find(b=>b.textContent.includes('Демо А'));setSeller(b,'Демо А');const q=[...document.querySelectorAll('#pay-grid button')].find(b=>b.textContent==='Безналичный');setPay(q,'Безналичный');changeQty('Смородина',1);});
   await p.evaluate(()=>closeCheck());await p.waitForFunction(()=>!closeCheckInFlight);
   assert.equal(await p.evaluate(()=>seller),'','продавец сброшен кодом');assert.ok(await p.evaluate(()=>document.getElementById('c31-staff').classList.contains('k-who--need')));
   await stats(p,sov);assert.equal(await p.evaluate(()=>Number(document.getElementById('p-total').textContent.replace(/[^\d-]/g,''))),410);
   await p.done();
  });

  for(const w of [360,390,430])await check(P+' '+w+': геометрия — Итоги и остатки над доком, без горизонтальной прокрутки, навигация 40 px',async()=>{
   const p=await open(file,w);
   await p.evaluate(()=>localStorage.setItem('omoti_'+CASHIER_ACCESS_POINT+'_stats_sections_v1',JSON.stringify({payout:true,staff:true,sales:true,attention:true,bonus:true,top:true})));
   await p.reload();await p.waitForFunction(()=>typeof promotionConfig!=='undefined'&&promotionConfig);
   await p.evaluate(()=>switchTab('restock'));await p.waitForTimeout(200);
   const r=await p.evaluate(()=>{const s=document.querySelector('.k-restock__scroll');s.scrollTop=1e5;const last=[...document.querySelectorAll('#restock-supplies .restock-option')].at(-1).getBoundingClientRect(),bar=document.querySelector('.k-send-bar').getBoundingClientRect(),btn=document.getElementById('restock-submit').getBoundingClientRect(),dock=document.getElementById('c31-dock').getBoundingClientRect();return {last:last.bottom,barTop:bar.top+22,btn:btn.bottom,dock:dock.top,h:document.documentElement.scrollWidth>innerWidth};});
   assert.ok(r.last<=r.barTop,'последний расходник под кнопкой отправки');assert.ok(r.btn<=r.dock,'кнопка отправки под доком');assert.equal(r.h,false);
   await stats(p,sov);
   const s=await p.evaluate(()=>{const sc=document.querySelector('.k-stats__scroll');sc.scrollTop=1e5;const last=[...document.querySelectorAll('.k-sec:not([hidden])')].at(-1).getBoundingClientRect(),dock=document.getElementById('c31-dock').getBoundingClientRect(),nav=[...document.querySelectorAll('.k-nav button')].map(b=>b.getBoundingClientRect().height);const clipped=[...document.querySelectorAll('.k-pay__val,#p-total,.k-staffpay .ss-payout,.k-pay__period b')].filter(e=>e.scrollWidth>e.clientWidth+1).length;return {last:last.bottom,dock:dock.top,nav,clipped,h:document.documentElement.scrollWidth>innerWidth};});
   assert.ok(s.last<=s.dock,'последний раздел над доком');assert.equal(s.clipped,0,'суммы не обрезаны');assert.equal(s.h,false);assert.ok(s.nav.every(h=>Math.round(h)===40));
   await p.done();
  });

  await check(P+': остатки — 0–5, 6+, точное 0–999, ошибка ввода, блок отправки, отказ и повтор, payload кода',async()=>{
   const p=await open(file);await p.evaluate(()=>switchTab('restock'));
   await p.evaluate(()=>toggleRestockMotiRow('Криспи'));
   const row=await p.evaluate(()=>{const c=document.querySelector('.restock-fact-card.expanded');return {nums:[...c.querySelectorAll('.restock-fact-btn')].map(b=>b.textContent.trim()),open:c.querySelector('.restock-exact-open')?.textContent};});
   assert.deepEqual(row.nums.slice(0,6),['0','1','2','3','4','5']);assert.match(row.nums[6],/^6\+больше пяти, не считали$/);assert.match(row.open,/Точное количество/);
   await p.evaluate(()=>{setRestockMotiFact('Смородина','exact',0);setRestockMotiFact('Клубника','more_than_5',6);openRestockExactEditor('Криспи');});
   assert.equal(await p.locator('#restock-submit').isDisabled(),true,'пока открыт ввод — отправка заблокирована');
   assert.match(await p.locator('.k-send-bar__hint').textContent(),/Готово/);
   await p.locator('input.restock-exact-input').fill('-1');await p.locator('.restock-exact-save').click();assert.equal(await p.locator('input.restock-exact-input').getAttribute('aria-invalid'),'true');
   await p.locator('input.restock-exact-input').fill('12');await p.locator('.restock-exact-save').click();
   await p.locator('#restock-supplies .restock-option').first().click();
   assert.equal(await p.locator('#restock-submit').textContent(),'Отправить');assert.equal(await p.locator('#restock-submit').getAttribute('data-count'),' · 4 позиции');
   assert.equal(await p.locator('#restock-supplies .restock-option').first().getAttribute('aria-pressed'),'true');
   assert.ok(await p.evaluate(()=>document.querySelector('.restock-selected-pill.is-six')?.textContent.includes('6+')));
   await p.evaluate(()=>OMOTI_PREVIEW.mode='restock-error');await p.locator('#restock-submit').click();await p.waitForFunction(()=>document.getElementById('restock-submit').textContent==='Отправить');
   assert.equal(await p.evaluate(()=>selectedRestockItems().length),4,'отметки сохранены после ошибки');
   await p.evaluate(()=>OMOTI_PREVIEW.mode='normal');await p.locator('#restock-submit').click();await p.waitForFunction(()=>OMOTI_PREVIEW.restocks.length===1);
   const pl=await p.evaluate(()=>OMOTI_PREVIEW.restocks[0]);assert.equal(pl.locationId,sov?'sovetskaya':'novogodnyaya');
   const six=pl.items.find(x=>x.label==='Клубника'),ex=pl.items.find(x=>x.label==='Криспи');assert.deepEqual([six.mode,six.qty,six.sixPlus],['more_than_5',6,true]);assert.deepEqual([ex.mode,ex.qty],['exact',12]);
   await p.waitForFunction(()=>selectedRestockItems().length===0);assert.ok(await p.evaluate(()=>getComputedStyle(document.getElementById('restock-last')).display!=='none'));
   await p.done();
  });

  if(sov)await check('Советская: PIN поверх всего, ошибка, «Отмена» возвращает раздел, уход из Итогов закрывает доступ',async()=>{
   const p=await open(file);await p.evaluate(()=>switchTab('restock'));
   await p.evaluate(()=>switchTab('stats'));await p.locator('#pin-overlay.open').waitFor();
   const cover=await p.evaluate(()=>{const d=document.getElementById('c31-dock').getBoundingClientRect(),el=document.elementFromPoint(d.left+d.width/2,d.top+d.height/2);return !!el.closest('#pin-overlay');});assert.ok(cover,'док закрыт экраном PIN');
   assert.equal(await p.evaluate(()=>document.querySelector('.screen.active').id),'screen-restock');
   await p.evaluate(()=>{pinKey('0');pinKey('0');pinKey('0');pinKey('0');});assert.ok(await p.evaluate(()=>document.getElementById('pin-overlay').classList.contains('is-error')));
   await p.waitForTimeout(700);assert.ok(await p.evaluate(()=>!document.querySelector('.pin-dot.error')&&!document.getElementById('pin-overlay').classList.contains('is-error')));
   await p.evaluate(()=>pinCancel());assert.equal(await p.evaluate(()=>document.querySelectorAll('.k-nav .tab-btn')[3].getAttribute('aria-current')),'page');
   assert.equal(await p.evaluate(()=>document.querySelector('.screen.active').id),'screen-restock');
   await p.evaluate(()=>switchTab('stats'));await p.locator('#preview-pin-unlock').click();await ready(p);
   assert.equal(await p.evaluate(()=>document.querySelectorAll('.k-nav .tab-btn')[2].getAttribute('aria-current')),'page');assert.ok(await p.evaluate(()=>document.getElementById('c31-dock').closest('#screen-stats')!==null));
   await p.evaluate(()=>switchTab('journal'));assert.equal(await p.evaluate(()=>pinUnlocked),false);
   await p.evaluate(()=>switchTab('stats'));await p.locator('#pin-overlay.open').waitFor();
   assert.ok(await p.evaluate(()=>/^\d{4}$/.test(PIN_CODE)),'configured PIN preserved; never logged');
   await p.done();
  });
  if(!sov)await check('Новогодняя: PIN нет — Итоги открываются сразу',async()=>{const p=await open(file);await p.evaluate(()=>switchTab('stats'));await ready(p);assert.equal(await p.evaluate(()=>!!document.getElementById('pin-overlay')),false);await p.done();});

  await check(P+': «Себе без оплаты» — пояснение про «К выплате» и кнопка «Записать · сумма»',async()=>{
   const p=await open(file);
   await p.evaluate(()=>{const b=[...document.querySelectorAll('#seller-row button')].find(b=>b.textContent.includes('Демо А'));setSeller(b,'Демо А');changeQty('Смородина',1);const q=[...document.querySelectorAll('#pay-grid button')].find(b=>b.textContent==='Себе без оплаты');setPay(q,'Себе без оплаты');});
   const r=await p.evaluate(()=>({note:document.querySelector('.k-dock__line').textContent,btn:document.getElementById('close-btn').textContent,hidden:document.querySelector('.k-dock__line').hidden}));
   assert.equal(r.hidden,false);assert.match(r.note,/К выплате/);assert.match(r.btn,/^Записать · /);
   await p.done();
  });
 }
 }finally{await b.close();fs.writeFileSync(out,JSON.stringify(rows,null,2));}
 const fail=rows.filter(r=>r.status!=='PASS');console.log(fail.length?fail.length+' FAIL':'ALL PASS ('+rows.length+')');if(fail.length)process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
