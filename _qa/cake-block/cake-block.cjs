'use strict';
// Отдельный блок моти-кейков и мункейков в сетке вкусов (решение владельца 09.11.2026).
// Все три кассы, подставные данные: бизнес-запросы перехвачены, service worker заблокирован, настоящих чеков нет.
// Запуск встроенным Node с Playwright из корня репозитория: node _qa/cake-block/cake-block.cjs
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),H=require('../anikina-freeze/shift-harness.cjs');
const out=path.join(__dirname,process.env.QA_PUBLIC_BASE?'public':'local-browser');fs.mkdirSync(out,{recursive:true});
const points=process.env.QA_POINT?[process.env.QA_POINT]:['anikina','novogodnyaya','sovetskaya'];
const CAKES=['Манго маракуйя Моти кейк','Фисташка Моти кейк'],SET='Набор на 4 шт';
const base=H.assortment.map(x=>({...x}));
function setCatalog({separate}){
 H.assortment.length=0;
 H.assortment.push(...base.map(x=>({...x})),
  ...CAKES.map((name,i)=>({name,catalogItemId:'qa_cake_'+i,itemType:'moti_flavor',legacy:false,isPremium:false,...(separate?{cashierSeparate:true}:{}),prices:{normal:350,self:200,yandex:450}})),
  {name:SET,catalogItemId:'qa_set_0',itemType:'set',legacy:false,isPremium:false,availableQty:8,prices:{normal:720,self:400,yandex:1000},bundleDefinition:{mochiQty:4,allowPromotions:false,components:[{name:'Смородина',qty:4}]}});
}
const grid=p=>p.evaluate(()=>[...document.getElementById('flavors-grid').children].map(el=>{const r=el.getBoundingClientRect(),c=getComputedStyle(el);return {tile:el.classList.contains('k-tile'),name:el.dataset.name,extra:el.classList.contains('k-tile--extra'),start:el.classList.contains('k-tile--block-start'),left:Math.round(r.left),top:Math.round(r.top),bg:c.backgroundColor,shadow:c.boxShadow};}));
(async()=>{
 const server=await H.server(),browser=await H.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),results=[];
 async function run(point,name,options,fn){setCatalog(options);const t=await H.context(browser,server.url,point);
  try{await fn(t.page,t);assert.deepEqual(t.s.errors,[]);assert.deepEqual(t.s.leaks,[]);results.push({point,name,status:'PASS'});console.log('PASS',point,name);}
  catch(e){results.push({point,name,status:'FAIL',error:String(e&&e.message||e)});console.log('FAIL',point,name,e&&e.message);await t.page.screenshot({path:path.join(out,'FAIL-'+point+'-'+name.replace(/\W+/gu,'-')+'.png')}).catch(()=>{});}
  finally{await t.ctx.close();}
 }
 try{for(const point of points){
  await run(point,'block order, new row, colour, no headings',{separate:true},async p=>{
   await p.locator('[data-name="'+CAKES[0]+'"] .k-tile__hit').waitFor();const g=await grid(p),names=g.map(x=>x.name);
   assert.ok(g.every(x=>x.tile),'в сетке только плитки, без заголовков');
   const moti=g.filter(x=>!x.extra&&x.name!==SET),extra=g.filter(x=>x.extra);
   assert.deepEqual(extra.map(x=>x.name),[...CAKES,'Мункейки'],'блок: моти-кейки по алфавиту, затем мункейки');
   assert.deepEqual(names,[...moti.map(x=>x.name),...CAKES,'Мункейки',SET],'порядок: моти → блок → наборы');
   assert.deepEqual(moti.map(x=>x.name),[...moti.map(x=>x.name)].sort((a,b)=>a.localeCompare(b,'ru')),'моти по алфавиту, как раньше');
   assert.deepEqual(g.filter(x=>x.start).map(x=>x.name),[CAKES[0]],'новую строку начинает только первая плитка блока');
   assert.equal(extra[0].left,g[0].left,'блок начинается с первой колонки');assert.ok(extra[0].top>moti.at(-1).top,'блок ниже последней строки моти');
   assert.ok(extra.every(x=>x.bg==='rgb(255, 255, 255)'&&x.shadow!=='none'),'плитки блока белые с рамкой');
   assert.ok(moti.every(x=>x.bg==='rgb(235, 233, 227)'),'обычные плитки прежнего цвета');
   assert.equal(g.at(-1).bg,'rgb(235, 233, 227)','набор прежнего цвета');
   await p.locator('#flavors-grid').evaluate(el=>el.scrollTop=el.scrollHeight);await p.waitForTimeout(250);
   await p.screenshot({path:path.join(out,point+'-block.png')});
  });
  await run(point,'cake sells as an ordinary item; selected tile is amber',{separate:true},async(p,t)=>{
   await H.seller(p);const hit=p.locator('[data-name="'+CAKES[1]+'"] .k-tile__hit');await hit.scrollIntoViewIfNeeded();await hit.click();await hit.click();
   const on=(await grid(p)).find(x=>x.name===CAKES[1]);assert.equal(on.bg,'rgb(255, 243, 220)','выбранная плитка блока — как у всех выбранных');
   assert.equal(await p.evaluate(()=>cartTotal()),700);
   await H.pay(p,'Безналичный');await H.close(p);
   assert.equal(t.s.checks.length,1);assert.deepEqual(t.s.checks[0].items.map(i=>[i.name,i.qty,i.catalogItemId]),[[CAKES[1],2,'qa_cake_1']]);
   assert.equal((await grid(p)).find(x=>x.name===CAKES[1]).bg,'rgb(255, 255, 255)','после продажи плитка снова белая');
  });
  await run(point,'server without the setting: only mooncakes form the block',{separate:false},async p=>{
   await p.locator('[data-name="Мункейки"] .k-tile__hit').waitFor();const g=await grid(p);
   assert.deepEqual(g.filter(x=>x.extra).map(x=>x.name),['Мункейки']);assert.deepEqual(g.filter(x=>x.start).map(x=>x.name),['Мункейки']);
   assert.deepEqual(g.slice(-2).map(x=>x.name),['Мункейки',SET]);
   const plain=g.filter(x=>!x.extra&&x.name!==SET).map(x=>x.name);assert.ok(CAKES.every(n=>plain.includes(n)),'моти-кейки остаются среди моти');
  });
 }}finally{await browser.close();server.s.close();fs.writeFileSync(path.join(out,'RESULTS.json'),JSON.stringify(results,null,1));}
 const failed=results.filter(r=>r.status!=='PASS');console.log(results.length-failed.length+'/'+results.length+' PASS');process.exit(failed.length?1:0);
})();
