'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const H=require(process.env.FREEZE_BASELINE_ROOT?path.join(process.env.FREEZE_BASELINE_ROOT,'_qa/c31/harness.cjs'):'../c31/harness.cjs');
const out=path.resolve(process.env.QA_OUTPUT||path.join(H.root,'../evidence/anikina-freeze'));
fs.mkdirSync(out,{recursive:true});
const rows=[];
let browser,server,url;
async function fresh(mode=''){
 const t=await H.context(browser,url,390,844,{mode});
 t.page.setDefaultTimeout(5000);
 await t.page.goto(url);await t.page.waitForFunction(()=>AnikinaBoot.state==='ready'&&promotionConfig);
 return t;
}
async function add(p){await p.locator('[data-name="Смородина"] .k-tile__hit').click();}
async function pay(p,type){
 if(['Безналичный','Наличный','Перевод'].includes(type))await p.locator('.k-dock__r2 [data-pay="'+type+'"]').click();
 else{await p.getByRole('button',{name:'Ещё',exact:true}).click();await p.locator('#c31-more-sheet [data-pay="'+type+'"]').click();}
}
async function lookup(p){
 if(await p.evaluate(()=>C31UI.state.opened!=='card'))await p.locator('#c31-card').click();
 if(await p.locator('#loyalty-manual').evaluate(el=>el.hidden))await p.locator('#loyalty-manual-toggle').click();
 await p.locator('#loyalty-card').fill('1234567');await p.locator('#loyalty-card-confirm').click();
 await p.waitForFunction(()=>document.getElementById('loyalty-panel').matches('.is-selected,.is-unconfirmed'));
}
async function dismiss(p){await p.keyboard.press('Escape');}
async function ready(p){await p.waitForFunction(()=>!document.getElementById('close-btn').disabled);}
async function settled(p){await p.waitForFunction(()=>!AnikinaLoyalty.isPending()&&!C31UI.state.busy&&!Object.values(cart).some(q=>q>0));await p.waitForTimeout(300);}
async function writableCard(p){
 await p.locator('#c31-card').click();
 assert.equal(await p.locator('#loyalty-manual-toggle').isEnabled(),true);
 await p.locator('#loyalty-manual-toggle').click();
 assert.equal(await p.locator('#loyalty-card').isEnabled(),true);
 await p.locator('#loyalty-card').fill('7654321');
 await p.locator('#loyalty-clear').click();await dismiss(p);
}
async function check(name,fn){let t;try{t=await fresh();await fn(t);assert.deepEqual(t.errors,[]);assert.deepEqual(t.missing,[]);rows.push({name,status:'PASS',mockCalls:t.requests});console.log('PASS',name);}catch(e){rows.push({name,status:'FAIL',error:e.message});console.error('FAIL',name,e.message.split('\n')[0]);if(t)await t.page.screenshot({path:path.join(out,name.replace(/[^a-z0-9]/gi,'-')+'.png')}).catch(()=>{});}finally{if(t)await t.ctx.close();fs.writeFileSync(path.join(out,'RESULT.json'),JSON.stringify({rows,productionBusinessCalls:0},null,2));}}
(async()=>{server=await H.server();url=process.env.BASE_URL||server.url+'/omoti_anikina.html';browser=await H.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 await check('confirmed card sale then real defect selection and next card three times',async t=>{
  const p=t.page;
  for(let i=0;i<3;i++){
   await add(p);await pay(p,'Безналичный');await lookup(p);await ready(p);await dismiss(p);
   await p.locator('#close-btn').click();await settled(p);
   await add(p);await writableCard(p);await pay(p,'Брак');
   assert.equal(await p.evaluate(()=>payType),'Брак');assert.equal(await p.locator('#close-btn').isEnabled(),true);
   await p.locator('#close-btn').click();await settled(p);
  }
  assert.equal(t.requests.filter(r=>r.path.endsWith('/checkout')).length,3);
  assert.equal(t.requests.filter(r=>r.path.endsWith('/save_check')).length,3);
 });
 await check('unknown bonus result stays locked until explicit confirmed status',async t=>{
  const p=t.page;await add(p);await pay(p,'Безналичный');await lookup(p);await ready(p);await dismiss(p);t.setMode('loss');
  await p.locator('#close-btn').click();await p.waitForFunction(()=>AnikinaLoyalty.isPending()&&!C31UI.state.busy);
  assert.equal(await p.locator('#c31-card').isDisabled(),true);
  assert.equal(await p.locator('#loyalty-check-status').evaluate(el=>el.inert||el.disabled),false);
  await p.evaluate(()=>closeCheck());assert.equal(t.requests.filter(r=>r.path.endsWith('/checkout')).length,1);
  t.setMode('completed');await p.locator('#loyalty-check-status').click();await settled(p);
  await add(p);await writableCard(p);await pay(p,'Брак');assert.equal(await p.evaluate(()=>payType),'Брак');
  assert.equal(t.requests.filter(r=>r.path.endsWith('/checkout')).length,1);
 });
 await check('rejected unregistered card leaves basket and unlocks service actions',async t=>{
  const p=t.page;await add(p);await pay(p,'Безналичный');await lookup(p);await ready(p);await dismiss(p);t.setMode('not-registered');
  await p.locator('#close-btn').click();await p.waitForFunction(()=>!C31UI.state.busy&&!AnikinaLoyalty.isPending());
  assert.equal(await p.evaluate(()=>cart['Смородина']),1);
  await p.locator('.k-chosen').click();await pay(p,'Брак');assert.equal(await p.evaluate(()=>payType),'Брак');
 });
 for(const type of ['Брак','Яндекс','Себе оплачено','Себе без оплаты'])await check('late card cannot replace '+type,async t=>{
  const p=t.page;let release,seen;const gate=new Promise(r=>release=r),started=new Promise(r=>seen=r);
  await t.ctx.route('**/loyalty/card',async r=>{seen();await gate;await r.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,balanceMinor:0,registrationUnconfirmed:true})}).catch(()=>{});});
  try{await add(p);await p.locator('#c31-card').click();await p.locator('#loyalty-manual-toggle').click();await p.locator('#loyalty-card').fill('1234567');await p.locator('#loyalty-card-confirm').click();await started;
   await dismiss(p);await pay(p,type);assert.equal(await p.evaluate(()=>payType),type);release();await p.waitForTimeout(250);
   assert.equal(await p.evaluate(()=>payType),type);assert.equal(await p.evaluate(()=>AnikinaLoyalty.isActive()),false);assert.equal(await p.evaluate(()=>cart['Смородина']),1);
  }finally{release();}
 });
 await check('recovered first purchase requires explicit card then succeeds and releases choice',async t=>{
  const p=t.page;t.setMode('unconfirmed');await add(p);await pay(p,'Безналичный');await lookup(p);await ready(p);await dismiss(p);
  await p.reload();await p.waitForFunction(()=>AnikinaBoot.state==='ready'&&promotionConfig);
  await p.locator('#close-btn').click();assert.equal(t.requests.filter(r=>/checkout|save_check/.test(r.path)).length,0);
  assert.equal(await p.evaluate(()=>C31UI.state.opened),'card');await lookup(p);await ready(p);await dismiss(p);
  await p.locator('#close-btn').click();await settled(p);
  assert.equal(t.requests.filter(r=>r.path.endsWith('/checkout')).length,1);
  assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('omoti_anikina_boot_draft_v1')).requiresCard),false);
  await add(p);await pay(p,'Брак');await p.locator('#close-btn').click();await settled(p);
  assert.equal(t.requests.filter(r=>r.path.endsWith('/save_check')).length,1);
 });
 await check('ordinary save barrier is inert without changing native disabled state',async t=>{
  const p=t.page;let release,seen;const gate=new Promise(r=>release=r),started=new Promise(r=>seen=r);
  await t.ctx.route('**/cashier/save_check',async r=>{seen();await gate;await r.fulfill({contentType:'application/json',body:'{"ok":true}'}).catch(()=>{});});
  try{await add(p);await pay(p,'Безналичный');await p.locator('#close-btn').click();await started;
   const state=await p.locator('#loyalty-card').evaluate(el=>({disabled:el.disabled,inert:el.inert}));assert.deepEqual(state,{disabled:false,inert:true});
   await p.evaluate(()=>closeCheck());assert.equal(await p.evaluate(()=>C31UI.state.busy),true);release();await settled(p);await add(p);await writableCard(p);
  }finally{release();}
 });
 await check('resource failure blocks native checkout before any operation',async t=>{
  await t.ctx.route('**/anikina-c31/interface.js?*',r=>r.abort());await t.page.reload();await t.page.waitForFunction(()=>AnikinaBoot.state==='error');
  await t.page.evaluate(()=>window.closeCheck?.());assert.equal(t.requests.filter(r=>/checkout|save_check/.test(r.path)).length,0);
 });
}finally{await browser.close();await new Promise(r=>server.s.close(r));}
console.log(rows.filter(x=>x.status==='PASS').length+'/'+rows.length+' PASS');if(rows.some(x=>x.status!=='PASS'))process.exitCode=1;
})();
