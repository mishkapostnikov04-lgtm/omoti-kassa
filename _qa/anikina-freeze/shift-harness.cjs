'use strict';
const H=require('../c31/harness.cjs');
const catalog=H.assortment;
const files={anikina:'omoti_anikina.html',novogodnyaya:'omoti_kassa.html',sovetskaya:'omoti_sovetskaya.html'};
const labels={anikina:'Аникина',novogodnyaya:'Новогодняя',sovetskaya:'Советская'};
async function context(browser,base,point){
 const ctx=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,locale:'ru-RU',timezoneId:'Asia/Novosibirsk',serviceWorkers:'block',reducedMotion:'reduce'});
 const s={point,calls:[],errors:[],leaks:[],checks:[],restocks:[],cards:[],gates:{},fail:{},delay:0,last:null,seq:100,unknown:false,newCard:false,stockQty:10,restockEvents:new Set()};
 function responseCheck(p){const items=p.items.map(x=>({...x,price:p.pay==='Брак'?0:catalog.find(i=>i.name===x.name)?.prices[p.pay?.startsWith('Себе')?'self':p.pay==='Яндекс'?'yandex':'normal']||180}));return {...p,receiptNumber:String(++s.seq),revision:1,point:labels[point],date:'16.10.2026',time:'15:00',items,total:p.expectedTotalMinor!=null?(p.expectedTotalMinor-(p.redeemMinor||0))/100:items.reduce((a,x)=>a+x.price*x.qty,0)};}
 await ctx.route('**/*',async r=>{
  const req=r.request(),u=new URL(req.url());if(u.origin===base)return r.continue();
  if(u.hostname!=='orders.omoti.ru'){s.leaks.push(u.hostname);return r.abort();}
  const p=req.postData()?JSON.parse(req.postData()):{},action=u.pathname.split('/').at(-1),stockQty=s.stockQty;s.calls.push({path:u.pathname,action,method:req.method(),body:p});
  if(s.gates[action])await (typeof s.gates[action]==='function'?s.gates[action](p):s.gates[action]);if(s.delay)await new Promise(resolve=>setTimeout(resolve,s.delay));
  if(s.fail[action])return r.abort('connectionreset');
  let body,status=200;
  if(action==='status'&&u.pathname.includes('/cashier-access/'))body={ok:true,device:{status:'approved'}};
  else if(action==='config')body={ok:true,vapidPublicKey:''};
  else if(action==='messages')body={ok:true,notices:[]};
  else if(action==='promotion')body={ok:true,serverNow:new Date().toISOString(),assortment:catalog,promotions:[]};
  else if(action==='checks')body={ok:true,checks:s.checks};
  else if(action==='summary')body=H.summary;
  else if(u.pathname.includes('/point-restock/')){
   if(p.action==='stock')body=s.stockError?{ok:false,error:'Fixture stock unavailable'}:{ok:true,items:catalog.map(x=>({catalogItemId:x.catalogItemId,legacyFlavorName:x.name,qty:stockQty}))};
   else if(p.action==='check'){
    const key=JSON.stringify(p);if(!s.restockEvents.has(key)){s.restockEvents.add(key);s.restocks.push(p);}
    if(s.loseRestockOnce){s.loseRestockOnce=false;return r.abort('connectionreset');}
    body={ok:true,requestId:'fixture-restock-'+s.restocks.length};
   }
  }else if(action==='save_check'){
   if(p.action==='delete_check')s.checks=s.checks.filter(c=>String(c.num)!==String(p.num));
   else{const old=s.checks.find(c=>String(c.num)===String(p.num)),c=responseCheck(p);if(old)c.receiptNumber=old.receiptNumber;s.checks=s.checks.filter(c=>String(c.num)!==String(p.num));s.checks.unshift(c);}
   body={ok:true};
  }else if(u.pathname.includes('/loyalty/')){
   if(action==='card')body={ok:true,cardHolderName:'Тестовый клиент',balanceMinor:s.newCard?0:95000,registrationUnconfirmed:s.newCard};
   else if(action==='quote'){
    const total=p.items.reduce((a,x)=>a+(catalog.find(i=>i.name===x.name)?.prices.normal||180)*100*x.qty,0),redeem=p.redeemMinor||0;
    body={ok:true,totalMinor:total,dueMinor:total-redeem,redeemMinor:redeem,earnMinor:Math.ceil((total-redeem)*.05/100)*100,balanceMinor:s.newCard?0:95000,maximumMinor:s.newCard?0:Math.floor(total*.3/100)*100,accrualPercent:5,settlementEnabled:true,expectedRevision:1};
   }else if(action==='checkout'){
    const c=responseCheck(p);c.loyalty={cardCode:p.cardCode||'1234567',redeemMinor:p.redeemMinor||0,earnMinor:1000};s.last={ok:true,state:'completed',check:c};
    if(!s.unknown){s.checks=s.checks.filter(c=>String(c.num)!==String(p.num));if(p.kind!=='delete')s.checks.unshift(c);}body=s.unknown?{ok:true,state:'unknown'}:s.last;
   }else if(action==='status'){
    body=s.unknown?{ok:true,state:'unknown',readOnly:!!p.readOnly}:{...s.last,readOnly:!!p.readOnly};
    if(!s.unknown&&s.last&&!s.checks.some(c=>String(c.num)===String(s.last.check.num)))s.checks.unshift(s.last.check);
   }else if(action==='cancel')body={ok:true,state:'cancelled'};
  }
  if(!body){s.leaks.push('missing fixture '+req.method()+' '+u.pathname);return r.fulfill({status:503,contentType:'application/json',body:'{"ok":false}'});}
  return r.fulfill({status,contentType:'application/json',body:JSON.stringify(body)}).catch(()=>{});
 });
 await ctx.addInitScript(()=>{
  for(const [k,v]of Object.entries({omoti_sellers:['Евгений','Анна','Марина'],omoti_sellers_sovetskaya:['Евгений','Анна','Марина'],omoti_sellers_anikina:['Евгений','Анна','Марина'],omoti_last_seller_anikina_v1:'Евгений',omoti_anikina_count_hint_v1:{shown:3,done:true}}))localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));
  for(const id of ['anikina','sovetskaya','novogodnyaya'])localStorage.setItem('omoti_cashier_device_token_'+id,'fixture-token');
 });
 const page=await ctx.newPage();page.on('pageerror',e=>s.errors.push(e.message));
 await page.goto(base+'/'+files[point]);await page.waitForFunction(()=>(window.AnikinaBoot||window.PointsBoot)?.state==='ready'&&promotionConfig);
 page.setDefaultTimeout(6000);return {ctx,page,s};
}
async function seller(p){if(!await p.evaluate(()=>Boolean(seller))){await p.locator('#c31-staff').click();await p.getByRole('button',{name:'Евгений',exact:true}).click();}}
async function add(p){await seller(p);await p.locator('[data-name="Смородина"] .k-tile__hit').click();}
async function pay(p,type){if(['Безналичный','Наличный','Перевод'].includes(type))await p.locator('.k-dock__r2 [data-pay="'+type+'"]').click();else{await p.getByRole('button',{name:'Ещё',exact:true}).click();await p.locator('#c31-more-sheet [data-pay="'+type+'"]').click();}}
async function dismiss(p){await p.keyboard.press('Escape');}
async function card(p,number='1234567'){
 if(await p.evaluate(()=>C31UI.state.opened!=='card'))await p.locator('#c31-card').click();
 if(await p.locator('#loyalty-manual').evaluate(el=>el.hidden))await p.locator('#loyalty-manual-toggle').click();
 await p.locator('#loyalty-card').fill(number);await p.locator('#loyalty-card-confirm').click();
 await p.waitForFunction(()=>document.getElementById('loyalty-panel').matches('.is-selected,.is-unconfirmed'));
}
async function ready(p){await p.waitForFunction(()=>!document.getElementById('close-btn').disabled);}
async function close(p){await dismiss(p);await ready(p);await p.locator('#close-btn').click();await p.waitForFunction(()=>!Object.values(cart).some(q=>q>0)&&!AnikinaLoyalty.isPending());await p.waitForTimeout(300);}
module.exports={...H,files,labels,context,seller,add,pay,card,ready,close,dismiss};
