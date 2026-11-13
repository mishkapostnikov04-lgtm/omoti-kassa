'use strict';
// Блоки «Кейки» и «Мункейки» внутри отдельной части сетки вкусов (решение владельца 14.11.2026), три кассы.
// Подставные данные: бизнес-запросы перехвачены (shift-harness), service worker заблокирован, настоящих чеков нет.
// Вариант «б» (подписи, BLOCK_CAPTIONS=true) — как в выпуске; вариант «а» (без подписей) стенд отдаёт с
// BLOCK_CAPTIONS=false и пересчитанным SRI — только в памяти этого стенда, файлы не меняются.
// Запуск встроенным Node с Playwright из корня репозитория: node _qa/group-blocks/group-blocks.cjs
// QA_SHOTS=<папка> — куда класть снимки (по умолчанию рядом с результатами).
const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto'),assert=require('assert/strict'),H=require('../anikina-freeze/shift-harness.cjs');
const out=path.join(__dirname,'local-browser');fs.mkdirSync(out,{recursive:true});
const shots=process.env.QA_SHOTS||out;fs.mkdirSync(shots,{recursive:true});
const points=process.env.QA_POINT?[process.env.QA_POINT]:['anikina','novogodnyaya','sovetskaya'];
const RELEASE='releases/20261114-group-blocks-r1/';
const CAKES=['Банан чизкейк','Клубника мак чизкейк','Манго маракуйя чизкейк','Фисташка чизкей'],SET='Набор на 4 шт',FREE='Новинка без группы';
const B_CAKES={id:'cakes',name:'Кейки',order:20},B_MOON={id:'mooncakes',name:'Мункейки',order:30};
const base=H.assortment.map(x=>({...x}));
// mode: 'groups' — новый сервер; 'old' — сервер до выпуска (нет cashierBlock); 'free' — плюс позиция без группы (null); 'swap' — «Мункейки» order 10
function setCatalog(mode){
 const block=b=>mode==='old'?{}:{cashierBlock:mode==='swap'&&b===B_MOON?{...b,order:10}:b};
 H.assortment.length=0;
 H.assortment.push(...base.map(x=>x.name==='Мункейки'?{...x,cashierSeparate:true,...block(B_MOON)}:{...x,cashierSeparate:false}),
  ...CAKES.map((name,i)=>({name,catalogItemId:'qa_cake_'+i,itemType:'moti_flavor',legacy:false,isPremium:true,cashierSeparate:true,...block(B_CAKES),prices:{normal:400,self:200,yandex:450}})),
  ...(mode==='free'?[{name:FREE,catalogItemId:'qa_free',itemType:'moti_flavor',legacy:false,isPremium:false,cashierSeparate:true,cashierBlock:null,prices:{normal:190,self:100,yandex:250}}]:[]),
  {name:SET,catalogItemId:'qa_set_0',itemType:'set',legacy:false,isPremium:false,cashierSeparate:false,availableQty:8,prices:{normal:720,self:400,yandex:1000},bundleDefinition:{mochiQty:4,allowPromotions:false,components:[{name:'Смородина',qty:4}]}});
}
// Static server like c31/harness (JS/CSS with Git LF bytes); variant «а» flips the constant and the matching SRI.
let plain=false;
const sri=b=>'sha384-'+crypto.createHash('sha384').update(b).digest('base64');
function file(rel){const f=path.resolve(H.root,'.'+rel);if(!f.startsWith(H.root+path.sep))throw Error('scope');return f;}
function js(rel){let t=fs.readFileSync(file(rel)).toString().replaceAll('\r\n','\n');if(plain&&rel.includes(RELEASE)){const n=t.replace('const BLOCK_CAPTIONS=true,','const BLOCK_CAPTIONS=false,');assert.notEqual(n,t,'constant found');t=n;}return t;}
async function server(){const s=http.createServer((req,res)=>{try{const u=new URL(req.url,'http://localhost'),rel=decodeURIComponent(u.pathname),ext=path.extname(rel);
  res.setHeader('Content-Type',({'.html':'text/html;charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.ttf':'font/ttf','.json':'application/json'})[ext]||'application/octet-stream');
  if(/\.(js|css)$/.test(rel))return res.end(js(rel));
  let raw=fs.readFileSync(file(rel));
  if(ext==='.html'&&plain){let h=raw.toString();for(const name of ['points-interface.js','anikina-interface.js']){const rel2='/'+RELEASE+name,git=fs.readFileSync(file(rel2)).toString().replaceAll('\r\n','\n'),i=h.indexOf('src="./'+RELEASE+name);if(i<0)continue;const was=sri(Buffer.from(git)),now=sri(Buffer.from(js(rel2)));assert.ok(h.includes(was),'release SRI in html');h=h.replace(was,now);}raw=h;}
  res.end(raw);}catch(_){res.statusCode=404;res.end('Not found');}});
 await new Promise(r=>s.listen(0,'127.0.0.1',r));return {s,url:'http://127.0.0.1:'+s.address().port};}
const grid=p=>p.evaluate(()=>[...document.getElementById('flavors-grid').children].map(el=>{const r=el.getBoundingClientRect(),c=getComputedStyle(el);return {tile:el.classList.contains('k-tile'),cap:el.classList.contains('k-grid-cap'),name:el.dataset.name||null,text:el.classList.contains('k-grid-cap')?el.textContent:null,extra:el.classList.contains('k-tile--extra'),start:el.classList.contains('k-tile--block-start'),left:Math.round(r.left),right:Math.round(r.right),top:Math.round(r.top),bottom:Math.round(r.bottom),height:r.height,bg:c.backgroundColor,shadow:c.boxShadow,color:c.color,fs:c.fontSize};}));
async function settle(p){await p.locator('[data-name="'+CAKES[0]+'"] .k-tile__hit').waitFor();await p.waitForTimeout(200);}
async function shoot(p,name){
 for(const [w,h] of [[360,780],[390,844],[768,1024],[820,1180]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(250);
  await p.locator('#flavors-grid').evaluate(el=>{const first=el.querySelector('.k-tile--block-start');el.scrollTop=first?Math.max(0,first.offsetTop-el.clientHeight*.38):el.scrollHeight;});await p.waitForTimeout(250);
  const g=await grid(p),xs=g.filter(x=>x.tile).map(x=>x.right),gr=await p.locator('#flavors-grid').evaluate(el=>({w:el.scrollWidth,cw:el.clientWidth,doc:document.documentElement.scrollWidth,vw:innerWidth}));
  assert.ok(gr.doc<=gr.vw&&gr.w<=gr.cw+1,'нет горизонтальной прокрутки при '+w);
  for(const c of g.filter(x=>x.cap))assert.ok(c.height<=18.01,'подпись не выше 18 px при '+w);
  await p.screenshot({path:path.join(shots,name+'-'+w+'.png')});
 }
 await p.setViewportSize({width:390,height:844});
}
(async()=>{
 const srv=await server(),browser=await H.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),results=[];
 async function run(point,name,{mode='groups',variant='b'},fn){setCatalog(mode);plain=variant==='a';const t=await H.context(browser,srv.url,point),consoleErrors=[];
  t.page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  try{await fn(t.page,t);assert.deepEqual(t.s.errors,[]);assert.deepEqual(t.s.leaks,[]);assert.deepEqual(consoleErrors,[],'ошибок консоли нет');
   assert.equal(await t.page.evaluate(()=>(window.AnikinaBoot||window.PointsBoot)?.state),'ready','касса загрузилась (SRI сошёлся)');
   results.push({point,name,status:'PASS'});console.log('PASS',point,name);}
  catch(e){results.push({point,name,status:'FAIL',error:String(e&&e.message||e)});console.log('FAIL',point,name,e&&e.message);await t.page.screenshot({path:path.join(out,'FAIL-'+point+'-'+name.replace(/\W+/gu,'-')+'.png')}).catch(()=>{});}
  finally{await t.ctx.close();}
 }
 const order=g=>g.map(x=>x.cap?'#'+x.text:x.name);
 try{for(const point of points){
  await run(point,'variant b: captions «Кейки» then «Мункейки», each block on a new row, sets after',{},async p=>{
   await settle(p);const g=await grid(p),moti=g.filter(x=>x.tile&&!x.extra&&x.name!==SET),caps=g.filter(x=>x.cap);
   assert.deepEqual(order(g),[...moti.map(x=>x.name),'#Кейки',...CAKES,'#Мункейки','Мункейки',SET],'моти → «Кейки» → «Мункейки» → наборы');
   assert.deepEqual(g.filter(x=>x.start).map(x=>x.name),[CAKES[0],'Мункейки'],'каждый блок начинается с новой строки');
   const first=g[0].left,cake=g.find(x=>x.name===CAKES[0]),moon=g.find(x=>x.name==='Мункейки'),lastCake=g.find(x=>x.name===CAKES.at(-1));
   assert.equal(cake.left,first);assert.equal(moon.left,first);assert.ok(cake.top>moti.at(-1).bottom);assert.ok(moon.top>lastCake.bottom,'«Мункейки» ниже последнего кейка');
   for(const c of caps){assert.ok(c.height<=18.01&&c.height>=12,'высота подписи '+c.height);assert.equal(c.left,first,'подпись от первой колонки');assert.equal(c.color,'rgb(119, 117, 111)','серая подпись --k-muted-2');assert.equal(c.fs,'11.5px');}
   assert.ok(caps[0].top>=moti.at(-1).bottom&&caps[0].bottom<=cake.top,'подпись «Кейки» между моти и кейками');assert.ok(caps[1].top>=lastCake.bottom&&caps[1].bottom<=moon.top);
   assert.ok(cake.top-moti.at(-1).bottom<=30,'подпись занимает не больше ~30 px по высоте');
   assert.ok(g.filter(x=>x.extra).every(x=>x.bg==='rgb(255, 255, 255)'&&x.shadow!=='none'),'плитки блоков белые с рамкой');
   assert.ok(moti.every(x=>x.bg==='rgb(235, 233, 227)'),'обычные плитки прежнего цвета');assert.equal(g.at(-1).bg,'rgb(235, 233, 227)');
   await shoot(p,point+'-b-captions');
  });
  await run(point,'variant a: no captions, each block on a new row',{variant:'a'},async p=>{
   await settle(p);const g=await grid(p),moti=g.filter(x=>x.tile&&!x.extra&&x.name!==SET);
   assert.ok(g.every(x=>x.tile),'без подписей — в сетке только плитки');
   assert.deepEqual(order(g),[...moti.map(x=>x.name),...CAKES,'Мункейки',SET]);
   assert.deepEqual(g.filter(x=>x.start).map(x=>x.name),[CAKES[0],'Мункейки']);
   const cake=g.find(x=>x.name===CAKES[0]),moon=g.find(x=>x.name==='Мункейки');assert.equal(cake.left,g[0].left);assert.equal(moon.left,g[0].left);assert.ok(moon.top>g.find(x=>x.name===CAKES.at(-1)).bottom);
   await shoot(p,point+'-a-rows');
  });
  await run(point,'server before the release (no cashierBlock): exactly one block as now',{mode:'old'},async p=>{
   await settle(p);const g=await grid(p),moti=g.filter(x=>x.tile&&!x.extra&&x.name!==SET);
   assert.ok(g.every(x=>x.tile),'без заголовков');assert.deepEqual(order(g),[...moti.map(x=>x.name),...CAKES,'Мункейки',SET]);
   assert.deepEqual(g.filter(x=>x.start).map(x=>x.name),[CAKES[0]],'одна новая строка — как сейчас');
   const moon=g.find(x=>x.name==='Мункейки'),last=g.find(x=>x.name===CAKES.at(-1));assert.equal(moon.top,last.top,'«Мункейки» в той же строке, что и последний кейк (как сейчас)');
   if(point==='sovetskaya')await shoot(p,point+'-old-server');
  });
  await run(point,'order follows the server: «Мункейки» order 10 goes first; item without a group stays first without a caption',{mode:'swap'},async p=>{
   await settle(p);let g=await grid(p);const moti=g.filter(x=>x.tile&&!x.extra&&x.name!==SET);
   assert.deepEqual(order(g),[...moti.map(x=>x.name),'#Мункейки','Мункейки','#Кейки',...CAKES,SET]);
  });
  await run(point,'item with cashierBlock null: common block first, no caption, then «Кейки», «Мункейки»',{mode:'free'},async p=>{
   await settle(p);const g=await grid(p),moti=g.filter(x=>x.tile&&!x.extra&&x.name!==SET&&x.name!==FREE);
   assert.deepEqual(order(g),[...moti.map(x=>x.name),FREE,'#Кейки',...CAKES,'#Мункейки','Мункейки',SET]);
   assert.deepEqual(g.filter(x=>x.start).map(x=>x.name),[FREE,CAKES[0],'Мункейки']);
  });
  await run(point,'sale from every block (moti, Кейки, Мункейки, set) through the intercepted transport; captions survive re-render',{},async(p,t)=>{
   await H.seller(p);await settle(p);
   for(const name of ['Смородина',CAKES[2],'Мункейки',SET])await p.locator('[data-name="'+name+'"] .k-tile__hit').click();
   await p.locator('[data-name="'+CAKES[2]+'"] .k-tile__hit').click();
   const g=await grid(p);assert.equal(g.filter(x=>x.cap).length,2,'подписи не дублируются');assert.equal(g.find(x=>x.name===CAKES[2]).bg,'rgb(255, 243, 220)','выбранная плитка — как все выбранные');
   assert.equal(await p.evaluate(()=>cartTotal()),180+400*2+600+720);
   await H.pay(p,'Безналичный');await H.close(p);
   assert.equal(t.s.checks.length,1);
   assert.deepEqual(t.s.checks[0].items.map(i=>[i.name,i.qty]).sort(),[[CAKES[2],2],['Мункейки',1],[SET,1],['Смородина',1]].sort());
   const after=await grid(p);assert.deepEqual(order(after),order(g));assert.ok(after.filter(x=>x.extra).every(x=>x.bg==='rgb(255, 255, 255)'),'после продажи плитки снова белые');
  });
 }}finally{await browser.close();srv.s.close();fs.writeFileSync(path.join(out,'RESULTS.json'),JSON.stringify(results,null,1));}
 const failed=results.filter(r=>r.status!=='PASS');console.log(results.length-failed.length+'/'+results.length+' PASS');process.exit(failed.length?1:0);
})();
