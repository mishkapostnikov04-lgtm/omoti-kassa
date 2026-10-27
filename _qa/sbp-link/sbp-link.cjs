'use strict';
// «Оплата» в кассе Аникиной: только заглушки orders.omoti.ru, Service Worker заблокирован,
// никаких настоящих чеков, ссылок или платежей.
const H=require('../anikina-freeze/shift-harness.cjs'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(process.env.QA_OUTPUT||path.join(H.root,'_qa/sbp-link/evidence'));fs.mkdirSync(out,{recursive:true});
const URL1='https://qr.nspk.ru/AD10TESTFIXTURE0000000000000000000?type=02&bank=100000000004&sum=125050&cur=RUB&crc=AB12';
const rows=[];
function sbp(page){
 const st={calls:[],links:[],failCreate:0,nextStatus:'waiting'};
 return page.route('**/b2c-api/cashier-sbp/**',async r=>{
  const req=r.request(),u=new URL(req.url()),action=u.pathname.split('/').at(-1),body=req.postData()?JSON.parse(req.postData()):{};
  st.calls.push({action,method:req.method(),body,auth:req.headers().authorization||''});
  if(action==='links'&&req.method()==='POST'&&st.failCreate>0){st.failCreate--;return r.abort('connectionreset');}
  let res;
  if(action==='links'&&req.method()==='GET')res={ok:true,links:st.links};
  else if(action==='links'){
   let link=st.links.find(l=>l.requestId===body.requestId);
   if(!link){link={id:st.links.length+1,requestId:body.requestId,amount:body.amount,comment:body.comment,status:'waiting',url:URL1,createdAt:new Date().toISOString(),paidAt:null,activeUntil:null,message:''};st.links.unshift(link);}
   res={ok:true,link};
  }else if(action==='status'){const link=st.links.find(l=>l.id===body.id);link.status=st.nextStatus;if(link.status==='paid')link.paidAt=new Date().toISOString();res={ok:true,link};}
  return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(res)});
 }).then(()=>st);
}
(async()=>{
 const server=await H.server(),browser=await H.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 async function test(name,fn,opts={}){let t;try{t=await H.context(browser,server.url,'anikina');if(opts.width)await t.page.setViewportSize({width:opts.width,height:780});await fn(t);assert.deepEqual(t.s.errors,[]);assert.deepEqual(t.s.leaks.filter(h=>!/kaspersky-labs.com$/.test(h)),[]);rows.push({name,status:'PASS'});console.log('PASS',name);}
  catch(e){console.error('FAIL',name,e.message.split('\n')[0]);rows.push({name,status:'FAIL',error:e.stack});if(t)await t.page.screenshot({path:path.join(out,'FAIL-'+name.replace(/[^a-z0-9]/gi,'-')+'.png')}).catch(()=>{});}
  finally{if(t)await t.ctx.close();fs.writeFileSync(path.join(out,'RESULT.json'),JSON.stringify({rows,productionBusinessCalls:0},null,2));}}
 const shot=(p,n)=>p.screenshot({path:path.join(out,n+'.png')});
 try{
  for(const width of [360,390,430])await test('tab, create, copy, paid '+width,async t=>{
   const p=t.page,st=await sbp(p);await t.ctx.grantPermissions(['clipboard-read','clipboard-write']);
   const nav=await p.evaluate(()=>({n:document.querySelectorAll('.k-nav button').length,four:document.querySelector('.k-nav').classList.contains('k-nav--4'),pay:document.getElementById('tab-pay').closest('.k-nav')!==null,icon:!!document.querySelector('#tab-pay svg path'),text:document.getElementById('tab-pay').textContent.trim()}));
   assert.deepEqual(nav,{n:4,four:true,pay:true,icon:true,text:'Оплата'});
   await shot(p,width+'-01-kassa-nav');
   await p.locator('#tab-pay').click();await p.waitForFunction(()=>document.getElementById('screen-pay').classList.contains('active'));
   assert.equal(await p.locator('#tab-pay').getAttribute('aria-current'),'page');
   assert.equal(await p.locator('.k-nav button').nth(0).getAttribute('aria-current'),'false');
   await p.waitForFunction(()=>true);await p.waitForTimeout(150);assert.equal(st.calls.filter(c=>c.method==='GET').length,1);
   assert.equal(st.calls[0].auth,'Bearer fixture-token');
   await shot(p,width+'-02-empty');
   await p.locator('#sbp-amount').fill('5');await p.locator('#sbp-create').click();
   assert.equal(await p.locator('#sbp-form-error').isVisible(),true);assert.equal(st.calls.filter(c=>c.method==='POST').length,0);
   await p.locator('#sbp-amount').fill('1 250,50');await p.locator('#sbp-comment').fill('Анна, доставка');await p.locator('#sbp-create').click();
   await p.waitForFunction(()=>!document.getElementById('sbp-result').hidden);
   const post=st.calls.find(c=>c.method==='POST');assert.equal(post.body.amount,1250.5);assert.equal(post.body.point,'anikina');assert.equal(post.body.comment,'Анна, доставка');assert.match(post.body.requestId,/^[0-9a-f-]{36}$/);
   assert.equal(await p.locator('#sbp-result-link').inputValue(),URL1);assert.equal(await p.locator('#sbp-result-status').textContent(),'Ждём оплату');
   assert.equal(await p.locator('#sbp-qr svg').count(),1);
   const box=await p.locator('#screen-pay .k-list').boundingBox(),vp=p.viewportSize();assert.ok(box.x>=0&&box.x+box.width<=vp.width,'no horizontal overflow');
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
   await shot(p,width+'-03-waiting');
   await p.locator('#sbp-copy').click();assert.equal(await p.evaluate(()=>navigator.clipboard.readText()),URL1);assert.equal(await p.locator('#sbp-copy').textContent(),'Скопировано ✓');
   await p.locator('#sbp-result').evaluate(el=>el.scrollIntoView({block:'end'}));await shot(p,width+'-04-waiting-bottom');
   st.nextStatus='paid';await p.locator('#sbp-check').click();await p.waitForFunction(()=>document.getElementById('sbp-result-status').textContent==='Оплачено');
   assert.equal(await p.locator('#sbp-check').isVisible(),false);await p.locator('#screen-pay .k-list').evaluate(el=>el.scrollTop=0);await shot(p,width+'-05-paid');
   await p.locator('#sbp-new').click();assert.equal(await p.locator('#sbp-form').isVisible(),true);assert.equal(await p.locator('#sbp-history .sbp-row').count(),1);await shot(p,width+'-06-history');
  },{width});
  await test('automatic status polling',async t=>{
   const p=t.page,st=await sbp(p);await p.locator('#tab-pay').click();await p.locator('#sbp-amount').fill('300');await p.locator('#sbp-create').click();await p.waitForFunction(()=>!document.getElementById('sbp-result').hidden);
   st.nextStatus='paid';await p.waitForFunction(()=>document.getElementById('sbp-result-status').textContent==='Оплачено',null,{timeout:9000});
   const n=st.calls.filter(c=>c.action==='status').length;await p.waitForTimeout(6000);assert.equal(st.calls.filter(c=>c.action==='status').length,n,'no polling after paid');
  });
  await test('network failure retries same request',async t=>{
   const p=t.page,st=await sbp(p);st.failCreate=1;await p.locator('#tab-pay').click();await p.locator('#sbp-amount').fill('700');await p.locator('#sbp-create').click();
   await p.waitForFunction(()=>document.getElementById('sbp-create').textContent==='Повторить');assert.equal(await p.locator('#sbp-form-error').isVisible(),true);
   await p.locator('#sbp-create').click();await p.waitForFunction(()=>!document.getElementById('sbp-result').hidden);
   const ids=st.calls.filter(c=>c.method==='POST').map(c=>c.body.requestId);assert.equal(ids.length,2);assert.equal(ids[0],ids[1]);assert.equal(st.links.length,1);
  });
  await test('kassa still sells after visiting Оплата',async t=>{
   const p=t.page,s=t.s;await sbp(p);await p.locator('#tab-pay').click();await p.locator('.k-nav button').nth(0).click();
   await p.waitForFunction(()=>document.getElementById('screen-kassa').classList.contains('active'));assert.equal(await p.locator('#tab-pay').getAttribute('aria-current'),'false');
   await H.add(p);await H.pay(p,'Безналичный');await H.close(p);assert.equal(s.checks.length,1);
   await p.locator('.k-nav button').nth(1).click();await p.waitForFunction(()=>allChecks.length>0);await p.locator('.k-nav button').nth(2).click();await p.locator('#tab-pay').click();
   assert.equal(await p.evaluate(()=>document.querySelectorAll('.screen.active').length),1);
  });
  await test('module failure keeps tab hidden and kassa working',async t=>{
   const p=t.page,s=t.s;await p.route('**/releases/20261027-sbp-link-r1/sbp-link.js*',r=>r.fulfill({status:404,body:''}));
   await p.reload();await p.waitForFunction(()=>window.AnikinaBoot.state==='ready'&&promotionConfig);
   assert.equal(await p.locator('#tab-pay').isVisible(),false);assert.equal(await p.locator('.k-nav button:visible').count(),3);
   await H.add(p);await H.pay(p,'Наличный');await H.close(p);assert.equal(s.checks.length,1);
   s.errors=s.errors.filter(e=>!/integrity|sbp-link/i.test(e));await shot(p,'07-module-missing');
  });
 }finally{await browser.close();server.s.close();}
 const failed=rows.filter(r=>r.status!=='PASS').length;console.log(failed?failed+' FAILED':'ALL PASS',rows.length);process.exitCode=failed?1:0;
})();
