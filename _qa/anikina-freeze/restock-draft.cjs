'use strict';
const H=require('./shift-harness.cjs'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(process.env.QA_OUTPUT||path.join(H.root,'../evidence/restock-draft')),rows=[];
fs.mkdirSync(out,{recursive:true});
const draftInput=p=>p.locator('.restock-exact-input');
const pending=p=>p.waitForFunction(()=>!restockSubmitInFlight&&!!restockPendingPayload);
const acknowledged=p=>p.waitForFunction(()=>!restockSubmitInFlight&&!restockPendingPayload);
async function lost(t,mode='exact',qty=0){
 t.s.loseRestockOnce=true;await t.page.evaluate(({mode,qty})=>setRestockMotiFact('Смородина',mode,qty),{mode,qty});
 await t.page.locator('#restock-submit').click();await pending(t.page);
 return structuredClone(t.s.calls.find(c=>c.body.action==='check').body);
}
async function retry(t,original){
 await t.page.locator('#restock-submit').click();await acknowledged(t.page);
 assert.deepEqual(t.s.calls.filter(c=>c.body.action==='check')[1].body,original,'retry must keep the exact original payload');
 assert.equal(t.s.restocks.length,1,'one unique server event after lost reply and retry');
}
(async()=>{
 const server=await H.server(),browser=await H.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 async function test(point,name,fn){let t;try{
  t=await H.context(browser,server.url,point);await t.page.locator('.k-nav button').nth(3).click();await t.page.waitForFunction(()=>!restockStockLoading);
  await fn(t);assert.deepEqual(t.s.errors,[]);
  // The home-PC antivirus injects this unrelated URL; the fixture router aborts it.
  assert.deepEqual(t.s.leaks.filter(x=>x!=='gc.kis.v2.scr.kaspersky-labs.com'),[]);
  rows.push({point,name,status:'PASS'});console.log('PASS',point,name);
 }catch(e){rows.push({point,name,status:'FAIL',error:e.message});console.error('FAIL',point,name,e.message.split('\n')[0]);}
 finally{if(t)await t.ctx.close();fs.writeFileSync(path.join(out,'RESULT.json'),JSON.stringify({rows,productionBusinessCalls:0},null,2));}}
 try{for(const point of ['novogodnyaya','sovetskaya'].filter(x=>!process.env.QA_POINT||process.env.QA_POINT===x)){
  await test(point,'same-flavor new draft survives old ack, reload and a separate new submission',async t=>{
   const p=t.page,original=await lost(t);
   await p.evaluate(()=>openRestockExactEditor('Смородина'));await draftInput(p).fill('5');await retry(t,original);
   assert.equal(await draftInput(p).inputValue(),'5');assert.equal(await p.evaluate(()=>restockExactDrafts['Смородина']),'5');
   assert.equal(await p.evaluate(()=>!!restockMotiFacts['Смородина']),false,'only old committed mark is acknowledged');
   assert.equal(await p.locator('#restock-submit').isDisabled(),true,'new draft needs explicit Done');
   const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('omoti_'+CASHIER_ACCESS_POINT+'_boot_draft_v1')).restock.drafts['Смородина']);assert.equal(saved,'5');
   await p.reload();await p.waitForFunction(()=>PointsBoot.state==='ready');await p.locator('.k-nav button').nth(3).click();
   assert.equal(await draftInput(p).inputValue(),'5');
   await p.screenshot({path:path.join(out,point+'-preserved.png')});
   await p.locator('.restock-exact-save').click();await p.locator('#restock-submit').click();await acknowledged(p);
   assert.equal(t.s.restocks.length,2);const item=t.s.restocks[1].items.find(i=>i.itemType==='moti');assert.equal(item.qty,5);assert.equal(item.mode,'exact');
   assert.equal(await p.evaluate(()=>Object.hasOwn(restockExactDrafts,'Смородина')),false,'old inactive saved draft clears after its own acknowledgement');
  });
  for(const value of ['0','','bad','05','999'])await test(point,'active editor keeps exact raw draft '+JSON.stringify(value),async t=>{
   const p=t.page,original=await lost(t);await p.evaluate(()=>openRestockExactEditor('Смородина'));await draftInput(p).fill(value);await retry(t,original);
   assert.equal(await draftInput(p).inputValue(),value);assert.equal(await p.evaluate(()=>restockExactDrafts['Смородина']),value);
   assert.equal(await p.evaluate(()=>restockExactEditorFlavor),'Смородина');assert.equal(await p.locator('#restock-submit').isDisabled(),true);
  });
  await test(point,'6+ retry remains qualitative while a new exact draft is retained',async t=>{
   const p=t.page,original=await lost(t,'more_than_5',6);await p.evaluate(()=>openRestockExactEditor('Смородина'));await draftInput(p).fill('12');await retry(t,original);
   assert.equal(original.items[0].mode,'more_than_5');assert.equal(await draftInput(p).inputValue(),'12');
  });
  await test(point,'new committed quantity on same flavor survives acknowledgement of older value',async t=>{
   const p=t.page,original=await lost(t);await p.evaluate(()=>openRestockExactEditor('Смородина'));await draftInput(p).fill('5');await p.locator('.restock-exact-save').click();await retry(t,original);
   assert.equal(await p.evaluate(()=>restockMotiFacts['Смородина'].qty),5);assert.equal(await p.evaluate(()=>restockExactDrafts['Смородина']),'5');assert.equal(await p.locator('#restock-submit').isEnabled(),true);
  });
  await test(point,'other flavor draft and new supply survive older acknowledgement',async t=>{
   const p=t.page,original=await lost(t);const supply=p.locator('#restock-supplies .restock-option').last();await supply.click();const id=await supply.getAttribute('data-restock-value');
   await p.evaluate(()=>openRestockExactEditor('Клубника'));await draftInput(p).fill('8');await retry(t,original);
   assert.equal(await draftInput(p).inputValue(),'8');assert.equal(await p.evaluate(()=>!!restockMotiFacts['Смородина']),false);
   assert.equal(await p.locator('#restock-supplies .restock-option[data-restock-value="'+id+'"]').getAttribute('aria-pressed'),'true');
  });
  await test(point,'another lost reply keeps both original identity and new draft for retry',async t=>{
   const p=t.page,original=await lost(t);await p.evaluate(()=>openRestockExactEditor('Смородина'));await draftInput(p).fill('7');t.s.loseRestockOnce=true;
   await p.locator('#restock-submit').click();await pending(p);assert.equal(await draftInput(p).inputValue(),'7');
   assert.deepEqual(await p.evaluate(()=>restockPendingPayload),original);
   await p.locator('#restock-submit').click();await acknowledged(p);assert.equal(await draftInput(p).inputValue(),'7');
   assert.equal(t.s.restocks.length,1);assert.ok(t.s.calls.filter(c=>c.body.action==='check').every(c=>JSON.stringify(c.body)===JSON.stringify(original)));
  });
 }}finally{await browser.close();await new Promise(r=>server.s.close(r));}
 console.log(rows.filter(r=>r.status==='PASS').length+'/'+rows.length+' PASS');if(rows.some(r=>r.status==='FAIL'))process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
