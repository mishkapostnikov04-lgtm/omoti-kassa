'use strict';
const H=require('./shift-harness.cjs'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(process.env.QA_OUTPUT||path.join(H.root,'../evidence/full-shift'));fs.mkdirSync(out,{recursive:true});
const rows=[];
async function idle(p,point){
 const s=await p.evaluate(()=>({pending:AnikinaLoyalty.isPending()||CashierLoyaltyCorrections.isPending(),busy:!!C31UI.state.busy,blocked:document.querySelectorAll('[data-loyalty-locked],[data-correction-locked],[data-c31-saving-inert]').length,nav:[...document.querySelectorAll('.k-nav button')].some(b=>b.disabled),seller}));
 assert.equal(s.pending,false);assert.equal(s.busy,false);assert.equal(s.blocked,0);assert.equal(s.nav,false);if(point!=='anikina')assert.equal(s.seller,'');
}
(async()=>{const server=await H.server(),browser=await H.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
async function test(point,name,fn){let t;try{t=await H.context(browser,server.url,point);await fn(t);assert.deepEqual(t.s.errors,[]);assert.deepEqual(t.s.leaks,[]);rows.push({point,name,status:'PASS'});console.log('PASS',point,name);}catch(e){console.error('FAIL',point,name,e.message.split('\n')[0]);rows.push({point,name,status:'FAIL',error:e.stack});if(t)await t.page.screenshot({path:path.join(out,point+'-'+name.replace(/[^a-z0-9]/gi,'-')+'.png')}).catch(()=>{});}finally{if(t)await t.ctx.close();fs.writeFileSync(path.join(out,'RESULT.json'),JSON.stringify({rows,productionBusinessCalls:0},null,2));}}
try{for(const point of Object.keys(H.files).filter(p=>!process.env.QA_POINT||process.env.QA_POINT===p)){
 for(const delay of [0,80])await test(point,'continuous shift '+delay,async t=>{
  const {page:p,s}=t;s.delay=delay;
  await H.add(p);await H.pay(p,'Безналичный');await H.card(p);await H.ready(p);await H.close(p);await idle(p,point);
  await H.add(p);await H.pay(p,'Наличный');await H.close(p);await idle(p,point);const ordinary=s.checks[0];
  await H.add(p);await H.pay(p,'Брак');await H.close(p);await idle(p,point);
  s.newCard=true;await H.add(p);await H.pay(p,'Смешанная');await p.locator('#mixed-cash-input').fill('100');await p.locator('#mixed-transfer-input').fill('80');await H.dismiss(p);await H.card(p);await H.ready(p);assert.equal(await p.locator('#loyalty-max').isDisabled(),true);await H.close(p);await idle(p,point);s.newCard=false;
  await p.locator('.k-nav button').nth(1).click();await p.waitForFunction(()=>allChecks.length>0);await p.locator('[data-check="'+ordinary.num+'"]').click();await p.locator('#c31-edit').click();await p.locator('[data-name="Смородина"] .k-tile__hit').click();await H.close(p);await idle(p,point);
  assert.equal(s.checks.filter(c=>String(c.num)===String(ordinary.num)).length,1);assert.equal(s.checks.find(c=>String(c.num)===String(ordinary.num)).items[0].qty,2);
  await H.add(p);await H.pay(p,'Перевод');await H.close(p);await idle(p,point);
  await H.add(p);await H.pay(p,'Себе без оплаты');await H.close(p);await idle(p,point);
  await H.add(p);await H.pay(p,'Безналичный');await H.card(p,'7654321');await H.ready(p);await H.close(p);await idle(p,point);
  assert.equal(s.checks.length,7);assert.equal(new Set(s.checks.map(c=>c.saleKey)).size,7);
  assert.equal(s.calls.filter(c=>c.action==='checkout').length,3);assert.equal(s.calls.filter(c=>c.action==='save_check').length,5);
  for(const c of s.checks)assert.equal(c.point,H.labels[point]);
 });
 await test(point,'newer card wins and close cancels old read',async t=>{
  const {page:p,s}=t;let release,seen;const gate=new Promise(r=>release=r),started=new Promise(r=>seen=r);
  s.gates.card=async payload=>{if(payload.cardCode==='1111111'){seen();await gate;}};
  try{await H.add(p);await H.pay(p,'Безналичный');await p.locator('#c31-card').click();await p.locator('#loyalty-manual-toggle').click();await p.locator('#loyalty-card').fill('1111111');await p.locator('#loyalty-card-confirm').click();await started;
   await p.locator('#loyalty-card').fill('2222222');await p.locator('#loyalty-card-confirm').click();await p.waitForFunction(()=>document.getElementById('loyalty-panel').classList.contains('is-selected'));release();await p.waitForTimeout(120);
   assert.equal(await p.locator('#loyalty-card').inputValue(),'2222222');await H.ready(p);await H.close(p);await idle(p,point);
  }finally{release();}
 });
 await test(point,'cancel lookup background resume then defect',async t=>{
  const {page:p,s}=t;let release;const gate=new Promise(r=>release=r);s.gates.card=gate;
  try{await H.add(p);await p.locator('#c31-card').click();await p.locator('#loyalty-manual-toggle').click();await p.locator('#loyalty-card').fill('1234567');await p.locator('#loyalty-card-confirm').click();await H.dismiss(p);
   await p.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));document.dispatchEvent(new Event('visibilitychange'));});
   assert.notEqual(await p.locator('#loyalty-card-confirm').textContent(),'Проверяем…');await H.pay(p,'Брак');release();await p.waitForTimeout(120);assert.equal(await p.evaluate(()=>payType),'Брак');await H.close(p);await idle(p,point);
  }finally{release();}
 });
 await test(point,'read transport failure retry then recover without restart',async t=>{
  const {page:p,s}=t;s.fail.card=true;await H.add(p);await p.locator('#c31-card').click();await p.locator('#loyalty-manual-toggle').click();await p.locator('#loyalty-card').fill('1234567');await p.locator('#loyalty-card-confirm').click();await p.waitForFunction(()=>document.getElementById('loyalty-card-confirm').textContent==='Повторить поиск');
  assert.equal(await p.locator('#loyalty-card-confirm').isEnabled(),true);assert.equal(s.calls.filter(c=>c.action==='card').length,2);s.fail.card=false;
  await p.locator('#loyalty-card-confirm').click();await p.waitForFunction(()=>document.getElementById('loyalty-panel').classList.contains('is-selected'));await H.dismiss(p);await H.pay(p,'Безналичный');await H.ready(p);await H.close(p);await idle(p,point);
 });
 await test(point,'unknown financial result remains pending across resume and reload',async t=>{
  const {page:p,s}=t;await H.add(p);await H.pay(p,'Безналичный');await H.card(p);await H.ready(p);await H.dismiss(p);s.unknown=true;await p.locator('#close-btn').click();await p.waitForFunction(()=>AnikinaLoyalty.isPending()&&!C31UI.state.busy);
  const identity=await p.evaluate(()=>localStorage.getItem('omoti_'+CASHIER_ACCESS_POINT+'_loyalty_pending_v1'));
  await p.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));document.dispatchEvent(new Event('visibilitychange'));});await p.reload();await p.waitForFunction(()=>AnikinaLoyalty.isPending()&&(window.AnikinaBoot||PointsBoot).state==='ready');
  assert.equal(await p.evaluate(()=>localStorage.getItem('omoti_'+CASHIER_ACCESS_POINT+'_loyalty_pending_v1')),identity);await p.evaluate(()=>closeCheck());assert.equal(s.calls.filter(c=>c.action==='checkout').length,1);
  s.unknown=false;await p.waitForFunction(()=>!document.getElementById('loyalty-check-status').disabled);await p.locator('#loyalty-check-status').click();await p.waitForFunction(()=>!AnikinaLoyalty.isPending());await p.waitForTimeout(300);await idle(p,point);
  await H.add(p);await H.pay(p,'Брак');await H.close(p);await idle(p,point);
 });
 await test(point,'explicit continue without card clears a restored candidate safely',async t=>{
  const {page:p,s}=t;await H.add(p);await H.pay(p,'Безналичный');await H.card(p);await H.ready(p);await H.dismiss(p);await p.reload();await p.waitForFunction(()=>(window.AnikinaBoot||PointsBoot).state==='ready'&&promotionConfig);
  // The recovered card is now revalidated automatically. Edit its candidate explicitly.
  await p.locator('#c31-card').click();await p.waitForFunction(()=>document.getElementById('loyalty-panel').classList.contains('is-selected'));await p.locator('#loyalty-clear').click();await p.locator('#loyalty-manual-toggle').click();await p.locator('#loyalty-card').fill('7654321');await H.dismiss(p);
  await p.locator('#cashier-draft-notice').getByRole('button',{name:'Продолжить без карты',exact:true}).click();assert.equal(await p.evaluate(()=>AnikinaLoyalty.isActive()),false);await H.close(p);await idle(p,point);
  assert.equal(s.calls.filter(c=>c.action==='checkout').length,0);assert.equal(s.calls.filter(c=>c.action==='save_check').length,1);
 });
 await test(point,'self paid and mixed refund do not leak into the next sale',async t=>{
  const {page:p,s}=t;await H.add(p);await H.pay(p,'Себе оплачено');await H.close(p);await idle(p,point);
  await H.add(p);await H.pay(p,'Смешанная');await p.locator('#mixed-mode-refund').click();await p.locator('#mixed-cash-input').fill('500');await p.locator('#mixed-transfer-input').fill('320');await H.close(p);await idle(p,point);
  const mixed=s.calls.filter(c=>c.action==='save_check').at(-1).body;assert.equal(mixed.paymentBreakdown.transferRefund,320);
  await H.add(p);await H.pay(p,'Безналичный');await H.card(p);await H.ready(p);await H.close(p);await idle(p,point);assert.equal(s.checks.length,3);
 });
 await test(point,'bonus correction cancel and confirm leave next check usable',async t=>{
  const {page:p,s}=t;await H.add(p);await H.pay(p,'Безналичный');await H.card(p);await H.ready(p);await H.close(p);const receipt=s.checks[0];
  await p.locator('.k-nav button').nth(1).click();await p.locator('[data-check="'+receipt.num+'"]').click();await p.locator('#c31-edit').click();await p.getByRole('button',{name:'Изменить состав и оплату',exact:true}).click();await p.locator('[data-name="Смородина"] .k-tile__hit').click();await H.ready(p);
  await p.locator('#close-btn').click();await p.locator('.c31-confirm-actions button').nth(0).click();await p.waitForFunction(()=>!C31UI.state.busy);
  assert.equal(s.calls.filter(c=>c.action==='checkout').length,1);
  await p.locator('#close-btn').click();await p.locator('.c31-confirm-actions button').nth(1).click();
  await p.waitForFunction(()=>!CashierLoyaltyCorrections.isPending()&&!Object.values(cart).some(q=>q>0));await p.waitForTimeout(300);await idle(p,point);
  assert.equal(s.calls.filter(c=>c.action==='checkout').length,2);assert.equal(s.checks.length,1);
  await H.add(p);await H.pay(p,'Брак');await H.close(p);await idle(p,point);
 });
}}finally{await browser.close();await new Promise(r=>server.s.close(r));}
console.log(rows.filter(r=>r.status==='PASS').length+'/'+rows.length+' PASS');if(rows.some(r=>r.status!=='PASS'))process.exitCode=1;
})();
