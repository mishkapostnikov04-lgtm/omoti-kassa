'use strict';
// «Оплата» в кассе Аникиной (r2): только заглушки orders.omoti.ru, Service Worker заблокирован,
// никаких настоящих чеков, ссылок или платежей.
const H=require('../anikina-freeze/shift-harness.cjs'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(process.env.QA_OUTPUT||path.join(H.root,'_qa/sbp-link/evidence'));fs.mkdirSync(out,{recursive:true});
const URL1='https://qr.nspk.ru/AD10TESTFIXTURE0000000000000000000?type=02&bank=100000000004&sum=125050&cur=RUB&crc=AB12';
const rows=[];
const fixtureLink=(id,over)=>Object.assign({id,amount:500,comment:'',status:'waiting',url:URL1,createdAt:new Date(Date.now()-id*60000).toISOString(),paidAt:null,cancelledAt:null,activeUntil:null,message:''},over);
function sbp(page,init){
 const st=Object.assign({calls:[],links:[],failCreate:0,failList:0,nextStatus:'waiting',cancelPaid:false},init||{});
 return page.route('**/b2c-api/cashier-sbp/**',async r=>{
  const req=r.request(),u=new URL(req.url()),action=u.pathname.split('/').at(-1),body=req.postData()?JSON.parse(req.postData()):{};
  st.calls.push({action,method:req.method(),body,auth:req.headers().authorization||''});
  if(action==='links'&&req.method()==='POST'&&st.failCreate>0){st.failCreate--;return r.abort('connectionreset');}
  if(action==='links'&&req.method()==='GET'&&st.failList>0){st.failList--;return r.abort('connectionreset');}
  let res;const find=id=>st.links.find(l=>l.id===id);
  const today=()=>{const p=st.links.filter(l=>l.status==='paid');return {count:p.length,amount:p.reduce((a,l)=>a+l.amount,0)};};
  if(action==='links'&&req.method()==='GET')res={ok:true,links:st.links,today:today()};
  else if(action==='links'){
   let link=st.links.find(l=>l.requestId===body.requestId);
   if(!link){link=fixtureLink(100+st.links.length,{requestId:body.requestId,amount:body.amount,comment:body.comment,createdAt:new Date().toISOString()});st.links.unshift(link);}
   res={ok:true,link};
  }else if(action==='status'){const link=find(body.id);link.status=st.nextStatus;if(link.status==='paid')link.paidAt=new Date().toISOString();res={ok:true,link};}
  else if(action==='cancel'){const link=find(body.id);if(st.cancelPaid){link.status='paid';link.paidAt=new Date().toISOString();res={ok:true,link,cancelled:false};}else{link.status='cancelled';link.url=null;res={ok:true,link,cancelled:true};}}
  else if(action==='hide'){st.links=st.links.filter(l=>l.id!==body.id);res={ok:true,hidden:body.id};}
  return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(res)});
 }).then(()=>st);
}
(async()=>{
 const server=await H.server(),browser=await H.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 async function test(name,fn,opts={}){let t;try{t=await H.context(browser,server.url,'anikina');if(opts.width)await t.page.setViewportSize({width:opts.width,height:780});await fn(t);assert.deepEqual(t.s.errors,[]);assert.deepEqual(t.s.leaks.filter(h=>!/kaspersky-labs\.com$/.test(h)),[]);rows.push({name,status:'PASS'});console.log('PASS',name);}
  catch(e){console.error('FAIL',name,e.message.split('\n')[0]);rows.push({name,status:'FAIL',error:e.stack});if(t)await t.page.screenshot({path:path.join(out,'FAIL-'+name.replace(/[^a-z0-9]/gi,'-')+'.png')}).catch(()=>{});}
  finally{if(t)await t.ctx.close();fs.writeFileSync(path.join(out,'RESULT.json'),JSON.stringify({rows,productionBusinessCalls:0},null,2));}}
 const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')});
 const open=async p=>{await p.locator('#tab-pay').click();await p.waitForFunction(()=>document.getElementById('screen-pay').classList.contains('active'));};
 try{
  for(const width of [360,390,430])await test('tab, create, copy text, paid, receipt '+width,async t=>{
   const p=t.page,st=await sbp(p);await t.ctx.grantPermissions(['clipboard-read','clipboard-write']);
   const nav=await p.evaluate(()=>({n:document.querySelectorAll('.k-nav button').length,four:document.querySelector('.k-nav').classList.contains('k-nav--4'),icon:!!document.querySelector('#tab-pay svg path'),text:document.getElementById('tab-pay').textContent.trim()}));
   assert.deepEqual(nav,{n:4,four:true,icon:true,text:'Оплата'});
   await open(p);assert.equal(await p.locator('#tab-pay').getAttribute('aria-current'),'page');
   await p.waitForFunction(()=>!document.getElementById('sbp-today').hidden);assert.equal(await p.locator('#sbp-today').textContent(),'Сегодня оплат по ссылкам ещё не было');
   assert.equal(st.calls[0].auth,'Bearer fixture-token');
   await p.locator('#sbp-amount').fill('5');await p.locator('#sbp-create').click();
   assert.equal(await p.locator('#sbp-form-error').isVisible(),true);assert.equal(st.calls.filter(c=>c.method==='POST').length,0);
   await p.locator('#sbp-amount').fill('1 250,50');await p.locator('#sbp-comment').fill('Анна, доставка');await p.locator('#sbp-create').click();
   await p.waitForFunction(()=>!document.getElementById('sbp-result').hidden);
   const post=st.calls.find(c=>c.method==='POST');assert.equal(post.body.amount,1250.5);assert.match(post.body.requestId,/^[0-9a-f-]{36}$/);
   assert.equal(await p.locator('#sbp-result-status').textContent(),'Ждём оплату');assert.equal(await p.locator('#sbp-qr svg').count(),1);
   assert.equal(await p.locator('#sbp-cancel').isVisible(),true);assert.equal(await p.locator('#sbp-hide').isVisible(),false);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
   await shot(p,width+'-01-waiting');
   await p.locator('#sbp-copy').click();assert.equal((await p.evaluate(()=>navigator.clipboard.readText())).replace(/[  ]/g,' '),'Оплата заказа ОМОТИ — 1 250,50 ₽: '+URL1);
   await p.locator('#sbp-result').evaluate(el=>el.scrollIntoView({block:'end'}));await shot(p,width+'-02-waiting-bottom');
   st.nextStatus='paid';await p.locator('#sbp-check').click();await p.waitForFunction(()=>document.getElementById('sbp-result-status').textContent==='Оплачено');
   assert.equal(await p.locator('#sbp-receipt').isVisible(),true);assert.equal(await p.locator('#sbp-cancel').isVisible(),false);assert.equal(await p.locator('#sbp-hide').isVisible(),true);
   await p.locator('#screen-pay .k-list').evaluate(el=>el.scrollTop=0);await shot(p,width+'-03-paid');
   await p.locator('#sbp-receipt').click();await p.waitForFunction(()=>document.getElementById('screen-kassa').classList.contains('active'));
   assert.equal(await p.evaluate(()=>payType),'Безналичный');assert.equal((await p.locator('#comment-input').inputValue()).replace(/[  ]/g,' '),'Оплата по ссылке 1 250,50 ₽');
   await H.add(p);await H.close(p);assert.equal(t.s.checks.length,1);assert.match(JSON.stringify(t.s.checks[0]).replace(/[  ]/g,' '),/Оплата по ссылке 1 250,50 ₽/);
   await shot(p,width+'-04-receipt-saved');
  },{width});
  await test('list failure shows cached list, retries, refresh button',async t=>{
   const p=t.page,st=await sbp(p,{links:[fixtureLink(1,{status:'paid',paidAt:new Date().toISOString(),comment:'Иван'}),fixtureLink(2,{status:'failed',url:null,message:'Банк не принял подпись запроса'})]});
   await open(p);await p.waitForFunction(()=>document.querySelectorAll('#sbp-history .sbp-row').length===2);
   assert.equal(await p.locator('#sbp-today').textContent(),'Сегодня оплачено по ссылкам: 1 · 500 ₽'.replace(/ ₽/,' ₽'));
   await p.reload();await p.waitForFunction(()=>window.AnikinaBoot.state==='ready'&&promotionConfig);
   st.failList=1;await open(p);
   await p.waitForFunction(()=>!document.getElementById('sbp-list-error').hidden);
   assert.match(await p.locator('#sbp-list-error').textContent(),/^Нет связи с сервером. Проверьте интернет. Показан список от .*Повторим через 3 с/);
   assert.equal(await p.locator('#sbp-history .sbp-row').count(),2,'cached list visible');await shot(p,'05-offline-cached');
   await p.waitForFunction(()=>document.getElementById('sbp-list-error').hidden,null,{timeout:8000});
   const before=st.calls.filter(c=>c.action==='links').length;await p.locator('#sbp-refresh').click();await p.waitForTimeout(400);assert.equal(st.calls.filter(c=>c.action==='links').length,before+1);
  });
  await test('waiting link in history updates by itself',async t=>{
   const p=t.page,st=await sbp(p,{links:[fixtureLink(1,{comment:'старая'})]});await open(p);
   await p.waitForFunction(()=>document.querySelector('#sbp-history .sbp-badge')?.textContent==='Ждём оплату');
   st.links[0].status='paid';st.links[0].paidAt=new Date().toISOString();
   await p.waitForFunction(()=>document.querySelector('#sbp-history .sbp-badge')?.textContent==='Оплачено',null,{timeout:20000});
   const n=st.calls.filter(c=>c.action==='links').length;await p.waitForTimeout(16000);assert.equal(st.calls.filter(c=>c.action==='links').length,n,'stops when nothing waits');
  });
  await test('cancel needs two taps; paid-race keeps paid',async t=>{
   const p=t.page,st=await sbp(p);await open(p);await p.locator('#sbp-amount').fill('700');await p.locator('#sbp-create').click();await p.waitForFunction(()=>!document.getElementById('sbp-result').hidden);
   await p.locator('#sbp-cancel').click();assert.equal(st.calls.filter(c=>c.action==='cancel').length,0);assert.match(await p.locator('#sbp-cancel').textContent(),/Нажмите ещё раз/);
   await p.locator('#sbp-result').evaluate(el=>el.scrollIntoView({block:'end'}));await shot(p,'06-cancel-confirm');
   await p.locator('#sbp-cancel').click();await p.waitForFunction(()=>document.getElementById('sbp-result-status').textContent==='Отменена');
   assert.equal(await p.locator('#sbp-result-link-box').isVisible(),false);await shot(p,'07-cancelled');
   await p.locator('#sbp-new').click();await p.locator('#sbp-amount').fill('800');await p.locator('#sbp-create').click();await p.waitForFunction(()=>document.getElementById('sbp-result-status').textContent==='Ждём оплату');
   st.cancelPaid=true;await p.locator('#sbp-cancel').click();await p.locator('#sbp-cancel').click();
   await p.waitForFunction(()=>document.getElementById('sbp-result-status').textContent==='Оплачено');assert.match(await p.locator('#sbp-result-error').textContent(),/уже оплатил/);
  });
  await test('hide finished link with confirmation',async t=>{
   const p=t.page,st=await sbp(p,{links:[fixtureLink(1,{status:'paid',paidAt:new Date().toISOString()}),fixtureLink(2,{status:'failed',url:null,message:'Банк не принял подпись запроса'})]});
   await open(p);await p.waitForFunction(()=>document.querySelectorAll('#sbp-history .sbp-row').length===2);
   await p.locator('#sbp-history .sbp-row[data-id="2"]').click();assert.equal(await p.locator('#sbp-hide').isVisible(),true);
   await p.locator('#sbp-hide').click();assert.equal(st.calls.filter(c=>c.action==='hide').length,0);await p.locator('#sbp-hide').click();
   await p.waitForFunction(()=>document.querySelectorAll('#sbp-history .sbp-row').length===1&&!document.getElementById('sbp-form').hidden);
   await p.locator('#sbp-history .sbp-row[data-id="1"]').click();await p.locator('#sbp-hide').click();assert.match(await p.locator('#sbp-hide').textContent(),/Оплаченная ссылка/);
   await shot(p,'08-hide-paid-confirm');await p.locator('#sbp-hide').click();await p.waitForFunction(()=>document.querySelectorAll('#sbp-history .sbp-row').length===0);
  });
  await test('network failure retries same request',async t=>{
   const p=t.page,st=await sbp(p);st.failCreate=1;await open(p);await p.locator('#sbp-amount').fill('700');await p.locator('#sbp-create').click();
   await p.waitForFunction(()=>document.getElementById('sbp-create').textContent==='Повторить');
   await p.locator('#sbp-create').click();await p.waitForFunction(()=>!document.getElementById('sbp-result').hidden);
   const ids=st.calls.filter(c=>c.method==='POST'&&c.action==='links').map(c=>c.body.requestId);assert.equal(ids.length,2);assert.equal(ids[0],ids[1]);
  });
  await test('kassa still sells after visiting Оплата',async t=>{
   const p=t.page,s=t.s;await sbp(p);await open(p);await p.locator('.k-nav button').nth(0).click();
   await p.waitForFunction(()=>document.getElementById('screen-kassa').classList.contains('active'));assert.equal(await p.locator('#tab-pay').getAttribute('aria-current'),'false');
   await H.add(p);await H.pay(p,'Наличный');await H.close(p);assert.equal(s.checks.length,1);
   await p.locator('.k-nav button').nth(1).click();await p.waitForFunction(()=>allChecks.length>0);await p.locator('.k-nav button').nth(2).click();await open(p);
   assert.equal(await p.evaluate(()=>document.querySelectorAll('.screen.active').length),1);
  });
  await test('module failure keeps tab hidden and kassa working',async t=>{
   const p=t.page,s=t.s;await p.route('**/releases/20261028-sbp-link-r2/sbp-link.js*',r=>r.fulfill({status:404,body:''}));
   await p.reload();await p.waitForFunction(()=>window.AnikinaBoot.state==='ready'&&promotionConfig);
   assert.equal(await p.locator('#tab-pay').isVisible(),false);assert.equal(await p.locator('.k-nav button:visible').count(),3);
   await H.add(p);await H.pay(p,'Наличный');await H.close(p);assert.equal(s.checks.length,1);
   s.errors=s.errors.filter(e=>!/integrity|sbp-link/i.test(e));
  });
 }finally{await browser.close();server.s.close();}
 const failed=rows.filter(r=>r.status!=='PASS').length;console.log(failed?failed+' FAILED':'ALL PASS',rows.length);process.exitCode=failed?1:0;
})();
