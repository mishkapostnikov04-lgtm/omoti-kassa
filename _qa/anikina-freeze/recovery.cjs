'use strict';
const H=require('./shift-harness.cjs'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const pw=require(path.resolve(path.dirname(process.execPath),'../node_modules/playwright')),engine=process.env.QA_ENGINE||'chromium';
const out=path.resolve(process.env.QA_OUTPUT||path.join(H.root,'../evidence/recovery-'+engine));fs.mkdirSync(out,{recursive:true});
(async()=>{const server=await H.server(),browser=await pw[engine].launch(engine==='chromium'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{}),rows=[];
async function test(point,name,fn){const t=await H.context(browser,server.url,point);try{await fn(t);assert.deepEqual(t.s.errors,[]);assert.deepEqual(t.s.leaks,[]);rows.push({point,name,status:'PASS'});console.log('PASS',point,name);}catch(e){rows.push({point,name,status:'FAIL',error:e.stack});console.error('FAIL',point,name,e.message);await t.page.screenshot({path:path.join(out,point+'-'+name+'.png')}).catch(()=>{});}finally{await t.ctx.close();fs.writeFileSync(path.join(out,'RESULT.json'),JSON.stringify({engine,rows,productionBusinessCalls:0},null,2));}}
const boot=()=>window.AnikinaBoot||window.PointsBoot;
const financial=s=>s.calls.filter(c=>['checkout','save_check','cancel'].includes(c.action)).length;
try{for(const point of Object.keys(H.files).filter(p=>!process.env.QA_POINT||process.env.QA_POINT===p)){
 for(const newCard of [false,true])await test(point,'modal-'+newCard,async({page:p,s})=>{
  s.newCard=newCard;await H.add(p);await H.pay(p,'Безналичный');await H.card(p);await H.ready(p);
  assert.equal(await p.locator('#c31-card-sheet > .k-done').isVisible(),true);
  assert.equal(await p.locator('[aria-label="Закрыть карту"]').isVisible(),true);
  const r=await p.locator('#close-btn').boundingBox();await p.mouse.click(r.x+r.width/2,r.y+r.height/2);await p.waitForTimeout(200);
  assert.equal(financial(s),0);assert.equal(await p.evaluate(()=>C31UI.state.opened),'');
  await p.locator('#c31-card').click();await p.locator('#c31-card-sheet > .k-done').click();
  await H.close(p);assert.equal(s.checks.length,1);assert.equal(financial(s),1);
 });
 await test(point,'card-draft',async({page:p,s})=>{
  await H.add(p);await H.pay(p,'Безналичный');await H.card(p,'1234567');await p.locator('#loyalty-amount').fill('10');await H.dismiss(p);
  await p.reload();await p.waitForFunction(()=>(window.AnikinaBoot||window.PointsBoot).state==='ready'&&document.getElementById('loyalty-panel').classList.contains('is-selected'));
  assert.equal(await p.locator('#loyalty-card').inputValue(),'1234567');assert.equal(await p.locator('#loyalty-amount').inputValue(),'10');
  assert.equal(financial(s),0);assert.ok(s.calls.filter(c=>c.action==='card').length>=2);
  await H.close(p);assert.equal(s.checks[0].loyalty.cardCode,'1234567');assert.equal(s.checks[0].loyalty.redeemMinor,1000);
 });
 await test(point,'draft-before-read',async({page:p,s})=>{
  await H.add(p);let release;s.gates.card=new Promise(r=>release=r);
  try{await p.locator('#c31-card').click();await p.locator('#loyalty-manual-toggle').click();await p.locator('#loyalty-card').fill('2345678');await p.locator('#loyalty-card-confirm').click();
   assert.equal(await p.evaluate(point=>JSON.parse(localStorage.getItem('omoti_'+point+'_boot_draft_v1')).loyaltyInput.number,point),'2345678');
  }finally{release();}
 });
 await test(point,'quote-error-retry',async({page:p,s})=>{
  await H.add(p);await H.pay(p,'Безналичный');await H.card(p);await H.close(p);
  await H.add(p);await H.pay(p,'Наличный');await H.close(p);
  await H.add(p);s.fail.quote=true;await H.pay(p,'Безналичный');await H.card(p);await H.dismiss(p);
  await p.waitForFunction(()=>!document.getElementById('c31-read-error').hidden);
  assert.match(await p.locator('#close-btn').textContent(),/Не удалось/);assert.equal(await p.locator('#close-btn').isDisabled(),true);assert.equal(s.checks.length,2);
  s.fail.quote=false;await p.locator('#c31-read-error button').click();await H.ready(p);assert.equal(await p.locator('#c31-read-error').isVisible(),false);
  await H.close(p);assert.equal(s.checks.length,3);
 });
 await test(point,'discard-cancel-confirm',async({page:p,s})=>{
  await H.add(p);await H.pay(p,'Безналичный');await H.card(p);await H.dismiss(p);await p.reload();await p.waitForFunction(()=>(window.AnikinaBoot||window.PointsBoot).state==='ready');
  const action=p.locator('#cashier-draft-notice button').filter({hasText:'Сбросить черновик'});assert.equal(await action.isVisible(),true);
  p.once('dialog',d=>d.dismiss());await action.click();assert.equal(await p.evaluate(()=>Object.values(cart).reduce((a,b)=>a+b,0)),1);
  p.once('dialog',d=>d.accept());await action.click();assert.equal(await p.evaluate(()=>Object.values(cart).some(q=>q>0)),false);
  await p.reload();await p.waitForFunction(()=>(window.AnikinaBoot||window.PointsBoot).state==='ready');
  assert.equal(await p.evaluate(()=>Object.values(cart).some(q=>q>0)),false);assert.equal(await p.locator('#loyalty-card').inputValue(),'');assert.equal(financial(s),0);
  await H.add(p);await p.locator('#c31-cart').click();p.once('dialog',d=>d.accept());await p.locator('#c31-discard-draft').click();assert.equal(await p.evaluate(()=>Object.values(cart).some(q=>q>0)),false);
 });
 await test(point,'pending-cannot-discard',async({page:p,s})=>{
  await H.add(p);await H.pay(p,'Безналичный');await H.card(p);await H.dismiss(p);await H.ready(p);s.unknown=true;await p.locator('#close-btn').click();
  await p.waitForFunction(()=>AnikinaLoyalty.isPending()&&!C31UI.state.busy);
  assert.equal(await p.evaluate(()=>(window.AnikinaBoot||window.PointsBoot).discardDraft()),false);
  assert.equal(await p.evaluate(()=>AnikinaLoyalty.isPending()),true);assert.equal(financial(s),1);
 });
 await test(point,'restore-read-failure-keeps-number',async({page:p,s})=>{
  await H.add(p);await H.pay(p,'Безналичный');await H.card(p,'3456789');await H.ready(p);await H.dismiss(p);s.fail.card=true;
  await p.reload();await p.waitForFunction(()=>(window.AnikinaBoot||window.PointsBoot).state==='ready'&&!document.getElementById('c31-read-error').hidden);
  assert.equal(await p.locator('#loyalty-card').inputValue(),'3456789');assert.equal(await p.locator('#close-btn').isDisabled(),true);assert.equal(financial(s),0);
  s.fail.card=false;await p.locator('#c31-read-error button').click();await H.ready(p);assert.equal(await p.locator('#loyalty-card').inputValue(),'3456789');
 });
 await test(point,'discard-cancels-late-read',async({page:p,s})=>{
  await H.add(p);let release;s.gates.card=new Promise(r=>release=r);
  try{await p.locator('#c31-card').click();await p.locator('#loyalty-manual-toggle').click();await p.locator('#loyalty-card').fill('4567890');await p.locator('#loyalty-card-confirm').click();
   await p.locator('#c31-card-sheet > .k-done').click();await p.locator('#c31-cart').click();p.once('dialog',d=>d.accept());await p.locator('#c31-discard-draft').click();
   release();await p.waitForTimeout(400);assert.equal(await p.locator('#loyalty-card').inputValue(),'');assert.equal(await p.evaluate(()=>AnikinaLoyalty.isActive()),false);assert.equal(financial(s),0);
  }finally{release();}
 });
 await test(point,'discard-storage-failure-and-queue-protection',async({page:p,s})=>{
  await H.add(p);
  assert.equal(await p.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw Error('fixture quota');};try{return (window.AnikinaBoot||window.PointsBoot).discardDraft();}finally{Storage.prototype.setItem=original;}}),false);
  assert.equal(await p.evaluate(()=>cart['Смородина']),1);
  assert.equal(await p.evaluate(()=>{const original=readOperationQueue;readOperationQueue=()=>[{key:'fixture'}];try{return (window.AnikinaBoot||window.PointsBoot).discardDraft();}finally{readOperationQueue=original;}}),false);
  assert.equal(await p.evaluate(()=>cart['Смородина']),1);assert.equal(financial(s),0);
 });
 }}finally{await browser.close();await new Promise(r=>server.s.close(r));}
if(rows.some(r=>r.status==='FAIL'))process.exitCode=1;
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
