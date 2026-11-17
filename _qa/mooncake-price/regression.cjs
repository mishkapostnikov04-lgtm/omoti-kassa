'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const H=require('../anikina-freeze/shift-harness.cjs');
const pointList=process.env.QA_POINT?[process.env.QA_POINT]:Object.keys(H.files);
const name='Набор Мункейки',id='cat_munkeyki';
const fixture={name,catalogItemId:id,itemType:'mooncake',legacy:true,cashierSeparate:true,cashierBlock:{id:'mooncakes',name:'Мункейки',order:30},prices:{normal:600,yandex:750,self:360}};
const one=(code,prefix)=>{const lines=code.split(/\r?\n/).filter(l=>l.startsWith(prefix));assert.equal(lines.length,1,prefix);return lines[0];};
async function read(src,point){
 if(!process.env.QA_PUBLIC_BASE)return fs.readFileSync(path.join(H.root,H.files[point]),'utf8');
 const r=await fetch(src+'/'+H.files[point],{redirect:'error'});assert.ok(r.ok,point);return r.text();
}
(async()=>{
 const srv=await H.server();let browser;
 try{
  for(const point of pointList){
   const html=await read(srv.url,point);
   const sandbox={cashierKnownAssortment:{[name]:structuredClone(fixture),'Следующее название':{...fixture,prices:{normal:630,yandex:780,self:390}},'Отдельный мункейк':{itemType:'mooncake',legacy:false,prices:{normal:200,yandex:230,self:110}},'Готовый набор':{itemType:'set',legacy:false,prices:{normal:980,yandex:1100,self:720}}},PREMIUM:new Set(['Криспи']),yandexMochiPrice:()=>250};
   const g=vm.runInNewContext(one(html,'function getPrice(')+';getPrice',sandbox);
   for(const [item,pay,value] of [[name,'',600],[name,'Безналичный',600],[name,'Наличный',600],[name,'Перевод',600],[name,'Яндекс',750],[name,'Себе оплачено',360],[name,'Брак',0],['Следующее название','Безналичный',630],['Следующее название','Яндекс',780],['Следующее название','Себе без оплаты',390],['Мункейки','Безналичный',600],['Смородина','Безналичный',180],['Криспи','Безналичный',200],['Отдельный мункейк','Безналичный',200],['Готовый набор','Безналичный',980]])
    assert.equal(g(item,pay),value,point+' '+item+' '+pay);
   sandbox.cashierKnownAssortment[name].prices={normal:null,yandex:0};
   assert.equal(g(name,'Безналичный'),600);assert.equal(g(name,'Яндекс'),750);
   console.log('PASS',point,'published pricing function: regular/request-specific/default tariffs and other product types');
  }
  if(process.env.QA_STATIC_ONLY)return;
  const pw=require(process.env.OMOTI_PLAYWRIGHT_MODULE||path.resolve(path.dirname(process.execPath),'../node_modules/playwright'));
  browser=process.env.QA_ENGINE==='webkit'?await pw.webkit.launch():await H.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const original=H.assortment.findIndex(x=>x.name==='Мункейки');assert.ok(original>=0);
  H.assortment[original]=fixture;
  for(const point of pointList){
   const {ctx,page:p,s}=await H.context(browser,srv.url,point);
   try{
    await H.seller(p);
    await p.locator('[data-name="'+name+'"] .k-tile__hit').click();
    assert.equal(await p.evaluate(()=>cartTotal()),600);
    assert.equal((await p.locator('#total-sum').textContent()).replace(/\s/g,''),'600₽');
    await H.pay(p,'Безналичный');
    assert.equal(await p.evaluate(()=>cartTotal()),600);
    assert.match(await p.locator('#c31-sum').innerText(),/600\s*₽/);
    await p.locator('#c31-cart').click();
    assert.match(await p.locator('#c31-cart-sheet').innerText(),/Набор Мункейки/);
    assert.match(await p.locator('#c31-cart-sheet').innerText(),/600\s*₽/);
    await H.dismiss(p);
    await H.close(p);
    const writes=s.calls.filter(x=>x.action==='save_check');
    assert.equal(writes.length,1);
    assert.deepEqual(writes[0].body.items.map(i=>[i.catalogItemId,i.qty]),[[id,1]]);
    assert.equal(s.checks[0].total,600);
    assert.deepEqual(s.errors,[]);
    assert.deepEqual(s.leaks,[]);
    console.log('PASS',point,'mobile cart 600 ₽ before/after payment, correct product ID, mock receipt 600 ₽');
   }finally{await ctx.close();}
  }
 }finally{if(browser)await browser.close();await new Promise(r=>srv.s.close(r));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
