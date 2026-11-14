'use strict';
// «Остатки» по разделам «Моти» / «Кейки» / «Мункейки» (решение владельца 14.11.2026), три кассы.
// Новогодняя и Советская: разделы в прежнем списке пересчёта, ввод и отправка как раньше.
// Аникина: новая вкладка «Остатки» ТОЛЬКО ДЛЯ ПРОСМОТРА — POST /b2c-api/point-restock/requests {action:'stock'} (r2: GET /stock
// закрыт в nginx Basic Auth), без полей и отправки. Каждый адрес, к которому обращается касса, сверяется со снимком nginx.
// Подставные данные: все запросы к orders.omoti.ru перехвачены (shift-harness + перехват чтения остатков Аникиной ниже),
// service worker заблокирован, настоящих чеков, пересчётов и устройств нет.
// Запуск встроенным Node с Playwright из корня репозитория: node _qa/stock-groups/stock-groups.cjs
// QA_SHOTS=<папка> — куда класть снимки; QA_POINT=anikina|novogodnyaya|sovetskaya — одна касса.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),H=require('../anikina-freeze/shift-harness.cjs');
const out=path.join(__dirname,'local-browser');fs.mkdirSync(out,{recursive:true});
const shots=process.env.QA_SHOTS||out;fs.mkdirSync(shots,{recursive:true});
const points=process.env.QA_POINT?[process.env.QA_POINT]:['novogodnyaya','sovetskaya','anikina'];
const CAKES=['Банан карамель','Мак клубника','Манго маракуйя','Фисташка'],SET='Набор на 4 шт';
const B_CAKES={id:'cakes',name:'Кейки',order:20},B_MOON={id:'mooncakes',name:'Мункейки',order:30};
const base=H.assortment.map(x=>({...x})),MOTI=base.filter(x=>x.name!=='Мункейки').map(x=>x.name);
assert.equal(MOTI.length,22,'22 моти, как на живой кассе');
// mode: 'groups' — сервер с группами; 'old' — сервер до group-blocks (нет cashierBlock); 'swap' — «Мункейки» order 10.
function setCatalog(point,mode='groups'){
 const moon=point==='anikina'?'Набор Мункейки':'Мункейки',block=b=>mode==='old'?{}:{cashierBlock:mode==='swap'&&b===B_MOON?{...b,order:10}:b};
 H.assortment.length=0;
 H.assortment.push(...base.map(x=>x.name==='Мункейки'?{...x,name:moon,catalogItemId:'qa_moon',itemType:'mooncake',cashierSeparate:true,...block(B_MOON)}:{...x,cashierSeparate:false}),
  ...CAKES.map((name,i)=>({name,catalogItemId:'qa_cake_'+i,itemType:'moti_flavor',legacy:false,isPremium:true,cashierSeparate:true,...block(B_CAKES),prices:{normal:400,self:200,yandex:450}})),
  {name:SET,catalogItemId:'qa_set_0',itemType:'set',legacy:false,isPremium:false,cashierSeparate:false,availableQty:8,prices:{normal:720,self:400,yandex:1000},bundleDefinition:{mochiQty:4,allowPromotions:false,components:[{name:'Смородина',qty:4}]}});
 return moon;
}
// Anikina stock as the new server answers (qty = centralQty ?? effectiveStock): similar to the live numbers.
function anikinaStock(version=1){
 const qty={'Бабл Гам':176,'Набор Мункейки':-2,'Банан карамель':14,'Мак клубника':0,'Манго маракуйя':6,'Фисташка':3,'Смородина':version===1?40:38};
 const items=H.assortment.filter(x=>x.itemType!=='set'&&x.name!=='Твикс'&&x.name!=='Банан- Нутелла').map((x,i)=>({catalogItemId:x.catalogItemId,legacyFlavorName:x.name,itemType:x.itemType==='mooncake'?'mooncake':'moti_flavor',qty:qty[x.name]??(20+i)}));
 // Name differs from the cashier («Банан- Нутелла») and no catalogItemId: matched by the normalised name.
 items.push({catalogItemId:null,legacyFlavorName:'Банан-Нутелла',itemType:'moti_flavor',qty:121},{catalogItemId:'qa_not_sold',legacyFlavorName:'Не продаётся на кассе',itemType:'moti_flavor',qty:9});
 return {ok:true,locationId:'central_anikina',readOnly:true,items,generatedAt:version===1?'2026-11-14T07:05:00.000Z':'2026-11-14T08:41:00.000Z'};
}
// r2: the Anikina cashier reads via POST /b2c-api/point-restock/requests {action:'stock', locationId:'anikina'} — the only
// point-restock address nginx opens for the cashiers. Any other Anikina point-restock request is a leak (and is aborted).
// The points' requests fall through to shift-harness unchanged.
async function stockRoute(t){
 t.stock={reads:[],mode:'ok',version:1};
 await t.ctx.route('https://orders.omoti.ru/b2c-api/point-restock/**',async r=>{const req=r.request(),u=new URL(req.url());
  if(t.s.point!=='anikina')return r.fallback();
  let body=null;try{body=JSON.parse(req.postData()||'null');}catch(_){body='unparsed';}
  const h=await req.allHeaders();t.stock.reads.push({method:req.method(),path:u.pathname,search:u.search,body,auth:h.authorization||'',type:h['content-type']||''});
  if(req.method()!=='POST'||u.pathname!=='/b2c-api/point-restock/requests'||u.search||!body||typeof body!=='object'||body.action!=='stock'||body.locationId!=='anikina'||Object.keys(body).length!==2){t.s.leaks.push('Anikina point-restock: '+req.method()+' '+u.pathname+u.search+' '+JSON.stringify(body));return r.abort();}
  if(t.stock.mode==='fail')return r.abort('connectionreset');
  if(t.stock.mode==='old')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:false,error:'Point restock is allowed only for novogodnyaya or sovetskaya'})});
  return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(anikinaStock(t.stock.version))});});
}
// Every address a cashier calls must be one nginx serves without Basic Auth (snapshot of the live config; any other path is
// 401 for a cashier — the r1 GET /stock passed the tests and failed on the server for exactly this reason).
const NGINX=require('./nginx-open-locations.json');
const openInNginx=p=>NGINX.exact.includes(p)||NGINX.prefix.some(x=>p.startsWith(x));
function assertNginxOpen(t){const used=[...t.s.calls,...t.stock.reads].map(c=>c.method+' '+c.path);assert.ok(used.length>0);
 assert.deepEqual([...new Set(used.filter(x=>!openInNginx(x.slice(x.indexOf(' ')+1))))],[],'касса обращается только к адресам, открытым в nginx');}
// Points: titles and cards of #restock-flavors in DOM order.
const pointList=p=>p.evaluate(()=>[...document.getElementById('restock-flavors').children].map(el=>el.classList.contains('restock-group-title')?{title:el.querySelector('span').textContent,count:el.querySelector('small').textContent,group:el.dataset.stockGroup,role:el.getAttribute('role'),color:getComputedStyle(el).color,fs:getComputedStyle(el).fontSize,mt:getComputedStyle(el).marginTop}:{card:el.querySelector('.restock-fact-name')?.textContent,pill:el.querySelector('.restock-stock-pill')?.textContent||''}));
const anikinaList=p=>p.evaluate(()=>[...document.querySelectorAll('#anikina-stock-list .stock-group')].map(g=>({title:g.querySelector('.stock-group-title span').textContent,count:g.querySelector('.stock-group-title small').textContent,rows:[...g.querySelectorAll('.stock-row')].map(r=>[r.querySelector('.stock-name').textContent,r.querySelector('.stock-qty').textContent])})));
const sections=list=>{const r=[];for(const x of list){if(x.title!==undefined)r.push({title:x.title,count:x.count,names:[]});else r.at(-1).names.push(x.card);}return r;};
async function openRestock(p){await p.locator('.k-nav button').nth(3).click();await p.waitForFunction(()=>document.querySelector('.screen.active')?.id==='screen-restock');}
async function noHorizontalScroll(p,w){const g=await p.evaluate(()=>({doc:document.documentElement.scrollWidth,vw:innerWidth,nav:[...document.querySelectorAll('.k-nav button')].filter(b=>!b.hidden).map(b=>({sw:b.scrollWidth,cw:b.clientWidth}))}));assert.ok(g.doc<=g.vw,'нет горизонтальной прокрутки при '+w);for(const b of g.nav)assert.ok(b.sw<=b.cw+1,'подпись вкладки помещается при '+w);}
async function shoot(p,point){
 const scroller=point==='anikina'?'#screen-restock .k-list':'.k-restock__scroll',target=point==='anikina'?'[data-stock-group="cakes"]':'[data-stock-group="cakes"]';
 for(const [w,h] of [[390,844],[768,1024],[1280,800]]){
  await p.setViewportSize({width:w,height:h});await p.waitForTimeout(300);await noHorizontalScroll(p,w);
  await p.locator(scroller).evaluate(el=>{el.scrollTop=0;});await p.waitForTimeout(150);
  await p.screenshot({path:path.join(shots,point+'-restock-'+w+'.png')});
  await p.locator(scroller).evaluate((el,sel)=>{const t=el.querySelector(sel);el.scrollTop=t?Math.max(0,t.offsetTop-el.clientHeight*.2):el.scrollHeight;},target);await p.waitForTimeout(150);
  await p.screenshot({path:path.join(shots,point+'-restock-'+w+'-blocks.png')});
 }
 await p.setViewportSize({width:390,height:844});
}
(async()=>{
 const srv=await H.server(),browser=await H.chromium.launch({executablePath:process.env.OMOTI_CHROME_EXE||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),results=[];
 async function run(point,name,{mode='groups'}={},fn){const moon=setCatalog(point,mode);const t=await H.context(browser,srv.url,point),consoleErrors=[];await stockRoute(t);
  t.page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  try{await fn(t.page,t,moon);assertNginxOpen(t);assert.deepEqual(t.s.errors,[]);assert.deepEqual(t.s.leaks,[]);assert.deepEqual(consoleErrors.filter(x=>!/net::ERR_CONNECTION_RESET|Failed to load resource/.test(x)),[],'ошибок консоли нет');
   assert.equal(await t.page.evaluate(()=>(window.AnikinaBoot||window.PointsBoot)?.state),'ready','касса загрузилась (SRI сошёлся)');
   results.push({point,name,status:'PASS'});console.log('PASS',point,name);}
  catch(e){results.push({point,name,status:'FAIL',error:String(e&&e.stack||e)});console.log('FAIL',point,name,e&&e.message);await t.page.screenshot({path:path.join(out,'FAIL-'+point+'-'+name.replace(/\W+/gu,'-').slice(0,60)+'.png')}).catch(()=>{});}
  finally{await t.ctx.close();}
 }
 const motiSorted=MOTI.slice().sort((a,b)=>a.localeCompare(b,'ru'));
 try{for(const point of points){
  if(point!=='anikina'){
   await run(point,'sections «Моти» 22 → «Кейки» 4 → «Мункейки» 1, alphabet inside, no common «Моти» title, sets left out',{},async(p,t)=>{
    await openRestock(p);await p.waitForFunction(()=>document.querySelectorAll('#restock-flavors .restock-stock-pill').length>0&&!/обновляем/.test(document.getElementById('restock-flavors').textContent));
    const list=await pointList(p),sec=sections(list),titles=list.filter(x=>x.title!==undefined);
    assert.deepEqual(sec,[{title:'Моти',count:'22 вкуса',names:motiSorted},{title:'Кейки',count:'4 вкуса',names:CAKES},{title:'Мункейки',count:'1 вкус',names:['Мункейки']}]);
    assert.deepEqual(titles.map(x=>x.group),['moti','cakes','mooncakes']);assert.ok(titles.every(x=>x.role==='heading'));
    assert.ok(titles.every(x=>x.color==='rgb(119, 117, 111)'&&x.fs==='12.5px'),'заголовок раздела — прежний серый заголовок списка');
    assert.deepEqual(titles.map(x=>x.mt),['0px','8px','8px'],'отступ перед вторым и третьим разделом');
    assert.ok(!list.some(x=>x.card===SET),'наборов в пересчёте нет, как раньше');
    assert.ok(list.filter(x=>x.card).every(x=>x.pill==='норма: 10'),'остаток по системе у каждого вкуса, как раньше');
    assert.equal(await p.locator('#screen-restock .restock-card').first().locator(':scope > .restock-title').count(),0,'общего заголовка «Моти» над разделами нет');
    assert.equal(await p.locator('#screen-restock .restock-card').nth(1).locator('.restock-title').textContent(),'Расходникиотметьте нужное');
    await shoot(p,point);
   });
   await run(point,'input and submit as before: 0–5, 6+, exact number, supply — one restock check with the same items',{},async(p,t)=>{
    await openRestock(p);await p.waitForSelector('#restock-flavors .restock-fact-card');
    await p.locator('.restock-fact-head',{hasText:'Бабл Гам'}).click();await p.getByRole('button',{name:'Бабл Гам: фактический остаток 3',exact:true}).click();
    await p.locator('.restock-fact-head',{hasText:'Манго маракуйя'}).click();await p.getByRole('button',{name:'Манго маракуйя: больше пяти, точно не считали',exact:true}).click();
    await p.locator('.restock-fact-head',{hasText:'Мункейки'}).click();await p.locator('.restock-fact-card.expanded .restock-exact-open').click();await p.locator('input.restock-exact-input').fill('12');await p.locator('.restock-exact-save').click();
    await p.locator('#restock-supplies .restock-option').first().click();
    const sec=sections(await pointList(p));assert.deepEqual(sec.map(s=>s.title),['Моти','Кейки','Мункейки'],'разделы остаются после отметок');
    assert.equal(await p.locator('#restock-submit').getAttribute('data-count'),' · 4 позиции');
    const supply=await p.locator('#restock-supplies .restock-option').first().evaluate(b=>({id:b.dataset.restockValue,label:b.dataset.restockLabel}));
    await p.locator('#restock-submit').click();await p.waitForFunction(()=>selectedRestockItems().length===0);
    assert.equal(t.s.restocks.length,1,'одна заявка');const pl=t.s.restocks[0];
    assert.equal(pl.action,'check');assert.equal(pl.locationId,point);assert.equal(pl.source,'cashier_restock_tab');
    const item=n=>({itemType:'moti',catalogItemId:H.assortment.find(x=>x.name===n).catalogItemId,legacyFlavorName:n,label:n});
    assert.deepEqual(pl.items,[{...item('Бабл Гам'),mode:'exact',qty:3,sixPlus:false},{...item('Манго маракуйя'),mode:'more_than_5',qty:6,sixPlus:true},{...item('Мункейки'),mode:'exact',qty:12,sixPlus:false},{itemType:'supply',supplyItemId:supply.id,label:supply.label}],'состав заявки как раньше');
    assert.ok(t.s.calls.every(c=>!(c.path.includes('/point-restock/')&&c.method==='GET')),'точки по-прежнему читают остатки через POST');
    assert.deepEqual(sections(await pointList(p)).map(s=>s.names.length),[22,4,1]);
   });
   await run(point,'server before group-blocks (no cashierBlock): one section «Моти» in the previous order',{mode:'old'},async p=>{
    await openRestock(p);await p.waitForSelector('#restock-flavors .restock-fact-card');
    const sec=sections(await pointList(p)),before=await p.evaluate(()=>activeLooseFlavors());
    assert.equal(sec.length,1);assert.equal(sec[0].title,'Моти');assert.equal(sec[0].count,'27 вкусов');assert.deepEqual(sec[0].names,before,'порядок прежний (как activeLooseFlavors)');
   });
   await run(point,'block order follows the server: «Мункейки» order 10 goes before «Кейки»',{mode:'swap'},async p=>{
    await openRestock(p);await p.waitForSelector('#restock-flavors .restock-fact-card');
    assert.deepEqual(sections(await pointList(p)).map(s=>s.title),['Моти','Мункейки','Кейки']);
   });
  }else{
   await run(point,'5 tabs in one row; «Остатки» read only: POST /requests {action:stock} with the device token (nginx-open address), sections, «Пульс» numbers, negative as 0, no inputs, no sending',{},async(p,t,moon)=>{
    const tabs=await p.evaluate(()=>[...document.querySelectorAll('.k-nav button')].filter(b=>!b.hidden).map(b=>b.textContent.trim()));
    assert.deepEqual(tabs,['Касса','Журнал','Итоги','Остатки','Оплата'],'пять вкладок: «Оплата» добавляет sbp-link');
    const nav=await p.evaluate(()=>{const b=[...document.querySelectorAll('.k-nav button')].filter(x=>!x.hidden).map(x=>x.getBoundingClientRect());return {tops:[...new Set(b.map(r=>Math.round(r.top)))],widths:b.map(r=>Math.round(r.width))};});
    assert.equal(nav.tops.length,1,'все вкладки в одну строку');assert.ok(Math.max(...nav.widths)-Math.min(...nav.widths)<=1,'вкладки одной ширины');
    assert.equal(t.stock.reads.length,0,'остатки не читаются, пока вкладка не открыта');
    await openRestock(p);await p.waitForSelector('#anikina-stock-list .stock-row');
    assert.equal(await p.locator('.k-nav button').nth(3).getAttribute('aria-current'),'page');
    assert.deepEqual(t.stock.reads,[{method:'POST',path:'/b2c-api/point-restock/requests',search:'',body:{action:'stock',locationId:'anikina'},auth:'Bearer fixture-token',type:'text/plain;charset=utf-8'}],'чтение — POST /requests {action:stock}, как у точек');
    const list=await anikinaList(p);
    assert.deepEqual(list.map(g=>[g.title,g.count,g.rows.length]),[['Моти','22 вкуса',22],['Кейки','4 вкуса',4],['Мункейки','1 вкус',1]]);
    assert.deepEqual(list[0].rows.map(r=>r[0]),motiSorted);assert.deepEqual(list[1].rows.map(r=>r[0]),CAKES);
    const qty=Object.fromEntries(list.flatMap(g=>g.rows));
    assert.equal(qty['Бабл Гам'],'176 шт');assert.equal(qty['Банан- Нутелла'],'121 шт','сопоставление по названию');assert.equal(qty[moon],'0 шт','−2 показывается как 0');
    assert.equal(qty['Мак клубника'],'0 шт');assert.equal(qty['Твикс'],'—','нет в ответе сервера — прочерк');assert.equal(qty['Банан карамель'],'14 шт');
    assert.ok(!(SET in qty)&&!('Не продаётся на кассе' in qty),'наборы и позиции не с экрана продажи не показываются');
    const screen=await p.evaluate(()=>{const s=document.getElementById('screen-restock');const own=sel=>[...s.querySelectorAll(sel)].filter(el=>!el.closest('#c31-dock'));return {inputs:own('input,textarea,select,[contenteditable]').length,buttons:own('button').map(b=>b.textContent.trim()),sub:document.getElementById('c31-stock-sub').textContent,title:s.querySelector('.k-head h2').textContent};});
    assert.equal(screen.inputs,0,'полей ввода нет');assert.deepEqual(screen.buttons,['Обновить'],'единственная кнопка — «Обновить»');
    assert.equal(screen.title,'Остатки');assert.equal(screen.sub,'Обновлено 14:05 · только просмотр');
    const st=await p.evaluate(()=>{const g=document.querySelector('.stock-group-title'),r=document.querySelector('.stock-rows'),q=document.querySelector('.stock-row .stock-qty');return {color:getComputedStyle(g).color,fs:getComputedStyle(g).fontSize,bg:getComputedStyle(r).backgroundColor,qfs:getComputedStyle(q).fontSize};});
    assert.deepEqual(st,{color:'rgb(119, 117, 111)',fs:'12.5px',bg:'rgb(255, 255, 255)',qfs:'15px'});
    assert.ok(t.s.calls.every(c=>!c.path.includes('/point-restock/')),'других запросов к пересчёту не было');
    assert.ok(t.stock.reads.every(r=>r.body?.action==='stock'),'у Аникиной только action stock');
    await shoot(p,point);
   });
   await run(point,'«Обновить» reads again and shows the new numbers and time; errors keep the last numbers',{},async(p,t)=>{
    await openRestock(p);await p.waitForSelector('#anikina-stock-list .stock-row');
    t.stock.version=2;await p.locator('#c31-stock-refresh').click();await p.waitForFunction(()=>/08|15:41/.test(document.getElementById('c31-stock-sub').textContent));
    assert.equal(await p.locator('#c31-stock-sub').textContent(),'Обновлено 15:41 · только просмотр');
    assert.equal(Object.fromEntries((await anikinaList(p)).flatMap(g=>g.rows))['Смородина'],'38 шт');assert.equal(t.stock.reads.length,2);
    t.stock.mode='fail';await p.locator('#c31-stock-refresh').click();await p.waitForFunction(()=>!document.getElementById('anikina-stock-status').hidden&&!anikinaStockLoading);
    assert.equal(await p.locator('#anikina-stock-status').textContent(),'Не удалось обновить остатки. Показаны цифры на 15:41.');
    assert.equal(Object.fromEntries((await anikinaList(p)).flatMap(g=>g.rows))['Смородина'],'38 шт','прежние цифры остаются');
    t.stock.mode='ok';await p.locator('.k-nav button').nth(0).click();await openRestock(p);await p.waitForFunction(()=>document.getElementById('anikina-stock-status').hidden);
    assert.equal(t.stock.reads.length,4,'каждое открытие вкладки читает заново');
    assert.ok(t.s.calls.every(c=>!c.path.includes('/point-restock/')));assert.ok(t.stock.reads.every(r=>r.method==='POST'&&r.body?.action==='stock'&&r.body?.locationId==='anikina'));
   });
   await run(point,'first read fails / server before the release answers ok:false: a clear message, no numbers, no crash',{},async(p,t)=>{
    t.stock.mode='old';await openRestock(p);await p.waitForFunction(()=>!anikinaStockLoading&&!document.getElementById('anikina-stock-status').hidden);
    assert.equal(await p.locator('#anikina-stock-status').textContent(),'Не удалось загрузить остатки. Нажмите «Обновить».');assert.equal(await p.locator('#anikina-stock-list .stock-row').count(),0);
    assert.equal(await p.locator('#c31-stock-sub').textContent(),'Только просмотр');
    await p.setViewportSize({width:390,height:844});await p.screenshot({path:path.join(shots,"anikina-restock-390-error.png")});
    t.stock.mode='ok';await p.locator('#c31-stock-refresh').click();await p.waitForSelector('#anikina-stock-list .stock-row');
    assert.equal(await p.locator('#anikina-stock-status').isHidden(),true);
   });
   await run(point,'sale after visiting «Остатки»: dock and grid back, check saved through the intercepted transport',{},async(p,t)=>{
    await openRestock(p);await p.waitForSelector('#anikina-stock-list .stock-row');await p.locator('.k-nav button').nth(0).click();
    await p.waitForFunction(()=>document.querySelector('.screen.active')?.id==='screen-kassa');
    for(const [w,h] of [[390,844],[768,1024],[1280,800]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(250);await noHorizontalScroll(p,w);await p.screenshot({path:path.join(shots,'anikina-kassa-nav-'+w+'.png')});}
    await p.setViewportSize({width:390,height:844});
    await H.add(p);await H.pay(p,'Безналичный');await H.close(p);
    assert.equal(t.s.checks.length,1);assert.deepEqual(t.s.checks[0].items.map(i=>[i.name,i.qty]),[['Смородина',1]]);
    await openRestock(p);assert.equal(await p.locator('.k-nav button').nth(3).getAttribute('aria-current'),'page');
    for(const w of [360,390]){await p.setViewportSize({width:w,height:780});await p.waitForTimeout(200);await noHorizontalScroll(p,w);}
   });
  }
 }}finally{await browser.close();srv.s.close();fs.writeFileSync(path.join(out,'RESULTS.json'),JSON.stringify(results,null,1));}
 const failed=results.filter(r=>r.status!=='PASS');console.log(results.length-failed.length+'/'+results.length+' PASS');process.exit(failed.length?1:0);
})();
