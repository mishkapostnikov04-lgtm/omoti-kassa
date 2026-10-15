'use strict';const H=require('./harness.cjs'),assert=require('node:assert/strict');
const list=JSON.parse(H.fs.readFileSync(H.path.join(H.pack,'evidence/screens/EVIDENCE.json'))),out=H.path.join(H.task,process.env.ORACLE?'visual-oracle':'visual');H.fs.mkdirSync(out,{recursive:true});
async function scenario(p,id,sov){const n=id.slice(2).split('-')[0];
 const seed=()=>p.evaluate(()=>{setSeller([...document.querySelectorAll('#seller-row button')].find(b=>b.textContent.includes('Демо А')),'Демо А');changeQty('Дубайский шоколад',2);changeQty('Кокос-Маракуйя',1);});
 if(['02','03','04','05'].includes(n)){await seed();if(n==='03')await p.evaluate(()=>{changeQty('Дубайский шоколад',-1);C31UI.openSheet('cart');});if(n==='04')await p.evaluate(()=>{cart={'Дубайский шоколад':1};updateCart();setPay([...document.querySelectorAll('#pay-grid button')].find(b=>b.textContent==='Себе без оплаты'),'Себе без оплаты');});if(n==='05'){await p.evaluate(async()=>{setPay([...document.querySelectorAll('#pay-grid button')].find(b=>b.textContent==='Безналичный'),'Безналичный');await closeCheck();});await p.waitForTimeout(550);}}
 if(n==='06')await p.evaluate(()=>C31UI.openSheet('point'));
 if(n==='07'||n==='08'){await p.evaluate(()=>switchTab('journal'));await p.waitForFunction(()=>allChecks.length>0);if(n==='08')await p.evaluate(()=>C31UI.showDetail(allChecks.find(c=>c.receiptNumber==='204').num));}
 if(+n>=10&&+n<20||n==='19b'){
  if(n==='17'||n==='18')await p.evaluate(mode=>OMOTI_PREVIEW.mode=mode,n==='17'?'empty':'summary-error');
  if(n==='18'){await p.evaluate(()=>{switchTab('stats');if(typeof PIN_CODE!=='undefined'){if(location.pathname.includes('/designer/')){pinUnlocked=true;document.getElementById('pin-overlay').classList.remove('open');openTab('stats');}else for(const d of PIN_CODE)pinKey(d);}});await p.waitForFunction(()=>document.getElementById('stats-spinner').textContent.includes('Нет связи'));}else await (process.env.ORACLE&&sov?(async()=>{await p.evaluate(()=>switchTab('stats'));await p.locator('#preview-pin-unlock').click();await p.waitForFunction(()=>document.getElementById('stats-content').style.display==='block');})():H.stats(p,sov));
  if(n==='11'){await p.evaluate(()=>document.querySelectorAll('.k-sec__head[aria-expanded="false"]').forEach(e=>e.click()));await p.evaluate(()=>{const e=document.querySelector('.k-stats__scroll');e.scrollTop=e.scrollHeight;});}
  if(n==='12')await p.evaluate(()=>document.querySelectorAll('.k-sec__head[aria-expanded="true"]').forEach(e=>e.click()));
  if(n==='13')await p.evaluate(()=>document.querySelector('.k-stats__scroll').scrollTop=520);
  if(n==='14')await p.evaluate(()=>C31UI.openSheet('period'));
  if(n==='19'||n==='19b')await p.evaluate(()=>{const e=document.querySelector('.k-stats__scroll'),s=document.querySelector('[data-sec="staff"]');e.scrollTop=s.offsetTop-8;});
 }
 if(+n>=20&&+n<30){await p.evaluate(()=>switchTab('restock'));await p.waitForFunction(()=>restockStockLoaded);
  if(n==='21')await p.evaluate(()=>{setRestockMotiFact('Смородина','exact',0);setRestockMotiFact('Клубника','more_than_5',6);toggleRestockMotiRow('Криспи');document.querySelectorAll('#restock-supplies .restock-option').forEach((b,i)=>{if(i<2)toggleRestockOption(b);});});
  if(n==='22'){await p.evaluate(()=>{openRestockExactEditor('Криспи');const input=document.querySelector('input.restock-exact-input');input.value='1200';setRestockExactDraft('Криспи',input);saveRestockExact('Криспи');window.scrollTo(0,0);const sc=document.querySelector('.k-restock__scroll'),card=document.querySelector('.restock-fact-card.expanded');sc.scrollTop+=card.getBoundingClientRect().top-234;});assert.equal(await p.locator('input.restock-exact-input').getAttribute('aria-invalid'),'true');}
  if(n==='23'){await p.evaluate(()=>openRestockExactEditor('Криспи'));await p.locator('input.restock-exact-input').fill('12');await p.locator('.restock-exact-save').click();}
  if(['24','25','26'].includes(n))await p.evaluate(()=>setRestockMotiFact('Смородина','exact',0));
  if(n==='24')await p.evaluate(()=>{OMOTI_PREVIEW.mode='slow';submitRestock();});
  if(n==='25')await p.evaluate(async()=>{await submitRestock();});
  if(n==='26')await p.evaluate(async()=>{toggleRestockOption(document.querySelector('#restock-supplies .restock-option'));OMOTI_PREVIEW.mode='restock-error';await submitRestock();});
  if(n==='27')await p.evaluate(()=>toggleRestockMotiRow('Криспи'));
 }
 if(+n>=30){await p.evaluate(()=>{switchTab('restock');switchTab('stats');});if(n==='31')await p.evaluate(()=>{pinKey('1');pinKey('2');});if(n==='32')await p.evaluate(()=>{const wrong=PIN_CODE==='0000'?'1111':'0000';for(const d of wrong)pinKey(d);});if(n==='33')await p.evaluate(()=>pinKey('1'));if(n==='34')await p.evaluate(()=>pinCancel());}
}
(async()=>{const only=process.env.SCREENS?new RegExp(process.env.SCREENS):null,s=await H.server(),b=await H.pw.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),rows=(process.env.RESUME||only)&&H.fs.existsSync(H.path.join(out,'CAPTURES.json'))?JSON.parse(H.fs.readFileSync(H.path.join(out,'CAPTURES.json'))).filter(x=>!only?.test(x.id)):[];try{
 for(const row of list){if(only&&!only.test(row.id))continue;if(rows.filter(x=>x.id===row.id).length===3)continue;for(const width of (process.env.ORACLE?[row.width]:[360,390,430])){const t=await H.context(b,s.url,width,{demo:true}),p=t.page;await p.goto(s.url+(process.env.ORACLE?'/designer/':'/')+row.file);await H.ready(p);if(!process.env.ORACLE)await p.waitForFunction(()=>PointsBoot.state==='ready');
  await scenario(p,row.id,row.file.includes('sovetskaya'));
  if(!row.id.includes('32-pin-error')&&!row.id.includes('24-restock-sending'))await p.waitForTimeout(120);
  if(/-(03|06|14)-/.test(row.id))await p.evaluate(()=>document.activeElement?.blur());
  const state=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,ready:window.PointsBoot?.state||'ready',sections:document.querySelectorAll('.k-sec').length,visibleScreens:[...document.querySelectorAll('.screen')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.id),realWrites:OMOTI_PREVIEW.realWrites,errors:OMOTI_PREVIEW.violations}));assert.equal(state.overflow,false);assert.equal(state.ready,'ready');assert.equal(state.visibleScreens.length,1,'only the active screen may paint');
  const filename=row.id+'@'+width+'.png';await p.screenshot({path:H.path.join(out,filename),animations:'disabled'});
  rows.push({...row,width,actual:filename,originalWidth:row.width,matchedViewport:width===row.width,state});await t.done();
 }console.log('CAPTURED',row.id,process.env.ORACLE?String(row.width):'360/390/430');H.fs.writeFileSync(H.path.join(out,'CAPTURES.json'),JSON.stringify(rows,null,2));}
}finally{await b.close();s.s.close();}console.log(rows.length,'captures complete');})().catch(e=>{console.error(e.stack);process.exitCode=1;});
