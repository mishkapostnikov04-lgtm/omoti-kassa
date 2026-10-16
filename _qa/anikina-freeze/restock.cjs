'use strict';
const H=require('./shift-harness.cjs'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(process.env.QA_OUTPUT||path.join(H.root,'../evidence/restock'));fs.mkdirSync(out,{recursive:true});const rows=[];
(async()=>{const server=await H.server(),browser=await H.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
async function test(point,name,fn){let t;try{t=await H.context(browser,server.url,point);await t.page.locator('.k-nav button').nth(3).click();await t.page.waitForFunction(()=>!restockStockLoading);await fn(t);assert.deepEqual(t.s.errors,[]);assert.deepEqual(t.s.leaks,[]);rows.push({point,name,status:'PASS'});console.log('PASS',point,name);}catch(e){rows.push({point,name,status:'FAIL',error:e.stack});console.error('FAIL',point,name,e.message.split('\n')[0]);}finally{if(t)await t.ctx.close();fs.writeFileSync(path.join(out,'RESULT.json'),JSON.stringify({rows,productionBusinessCalls:0},null,2));}}
try{for(const point of ['novogodnyaya','sovetskaya']){
 await test(point,'single flight survives redraw and repeated submit',async t=>{
  const {page:p,s}=t;let release;const gate=new Promise(r=>release=r);s.gates.requests=payload=>payload.action==='check'?gate:undefined;
  try{await p.evaluate(()=>setRestockMotiFact('Смородина','exact',0));await p.locator('#restock-submit').click();await p.waitForFunction(()=>!!restockSubmitInFlight);
   const v=await p.evaluate(()=>{renderRestockOptions();updateRestockSubmitState();window.secondSubmit=submitRestock();return {disabled:document.getElementById('restock-submit').disabled,inert:document.getElementById('restock-flavors').inert};});assert.deepEqual(v,{disabled:true,inert:true});
   release();await p.waitForFunction(()=>!restockSubmitInFlight);assert.equal(s.restocks.length,1);assert.equal(s.calls.filter(c=>c.body.action==='check').length,1);
   assert.equal(await p.locator('#restock-flavors').evaluate(el=>el.inert),false);
  }finally{release();}
 });
 await test(point,'lost reply reload and retry preserve original payload and new marks',async t=>{
  const {page:p,s}=t;s.loseRestockOnce=true;await p.evaluate(()=>setRestockMotiFact('Смородина','exact',0));await p.locator('#restock-submit').click();await p.waitForFunction(()=>!restockSubmitInFlight&&!!restockPendingPayload);
  const original=s.calls.find(c=>c.body.action==='check').body;assert.equal(s.restocks.length,1);
  await p.evaluate(()=>{setRestockMotiFact('Клубника','exact',2);document.getElementById('restock-flavors').dispatchEvent(new MouseEvent('click',{bubbles:true}));});await p.reload();await p.waitForFunction(()=>PointsBoot.state==='ready');await p.locator('.k-nav button').nth(3).click();
  assert.equal(await p.evaluate(()=>restockMotiFacts['Клубника'].qty),2);assert.equal(await p.locator('#restock-submit').textContent(),'Повторить отправку');
  await p.locator('#restock-submit').click();await p.waitForFunction(()=>!restockSubmitInFlight&&!restockPendingPayload);
  assert.deepEqual(s.calls.filter(c=>c.body.action==='check')[1].body,original);assert.equal(s.restocks.length,1);
  assert.equal(await p.evaluate(()=>restockMotiFacts['Клубника'].qty),2);assert.equal(await p.evaluate(()=>!!restockMotiFacts['Смородина']),false);
  await p.locator('#restock-submit').click();await p.waitForFunction(()=>!restockSubmitInFlight);assert.equal(s.restocks.length,2);
 });
 await test(point,'late stock response cannot overwrite a newer read',async t=>{
  const {page:p,s}=t;let release;const gate=new Promise(r=>release=r);s.stockQty=1;s.gates.requests=payload=>payload.action==='stock'?gate:undefined;
  try{await p.evaluate(()=>{window.oldStockRead=loadRestockStock();});await p.waitForTimeout(80);s.stockQty=9;s.gates.requests=null;
   await p.evaluate(()=>loadRestockStock());assert.equal(await p.evaluate(()=>restockStockInfo('Смородина').qty),9);
   release();await p.evaluate(()=>oldStockRead);assert.equal(await p.evaluate(()=>restockStockInfo('Смородина').qty),9);
  }finally{release();}
 });
 await test(point,'stock error retry preserves unsent facts',async t=>{
  const {page:p,s}=t;await p.evaluate(()=>setRestockMotiFact('Клубника','exact',2));s.stockError=true;await p.evaluate(()=>loadRestockStock());assert.equal(await p.locator('#restock-stock-status').isVisible(),true);
  assert.equal(await p.evaluate(()=>restockMotiFacts['Клубника'].qty),2);s.stockError=false;await p.locator('#restock-stock-status button').click();await p.waitForFunction(()=>!restockStockLoading);
  assert.equal(await p.locator('#restock-stock-status').isVisible(),false);assert.equal(await p.evaluate(()=>restockMotiFacts['Клубника'].qty),2);
 });
 await test(point,'temporary draft storage failure does not send or trap the form',async t=>{
  const {page:p,s}=t;await p.evaluate(()=>{setRestockMotiFact('Клубника','exact',2);const set=Storage.prototype.setItem;let fail=true;Storage.prototype.setItem=function(k,v){if(k.endsWith('_restock_submission_pending_v1')&&fail){fail=false;throw new DOMException('Fixture quota','QuotaExceededError');}return set.call(this,k,v);};});
  await p.locator('#restock-submit').click();assert.equal(s.calls.filter(c=>c.body.action==='check').length,0);assert.equal(await p.locator('#restock-submit').isEnabled(),true);
  await p.locator('#restock-submit').click();await p.waitForFunction(()=>!restockSubmitInFlight);assert.equal(s.restocks.length,1);
 });
}}finally{await browser.close();await new Promise(r=>server.s.close(r));}
console.log(rows.filter(r=>r.status==='PASS').length+'/'+rows.length+' PASS');if(rows.some(r=>r.status!=='PASS'))process.exitCode=1;
})();
