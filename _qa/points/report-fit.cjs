'use strict';
if(process.env.POINTS_BROWSER==='webkit')process.env.PLAYWRIGHT_BROWSERS_PATH=require('path').resolve(__dirname,'../../../_local_artifacts/cashier-anikina-c32-20261014/browsers');
const H=require('./harness.cjs'),assert=require('assert/strict');
(async()=>{const s=await H.server(),kind=process.env.POINTS_BROWSER||'chromium',b=await H.pw[kind].launch(kind==='chromium'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{}),rows=[];try{
 for(const file of ['omoti_kassa.html','omoti_sovetskaya.html'])for(const width of [360,390,430]){
  const t=await H.context(b,s.url,width,{demo:false}),p=t.page;try{
   await p.goto(s.url+'/'+file);await H.ready(p);await p.waitForFunction(()=>PointsBoot.state==='ready');await H.stats(p,file.includes('sovetskaya'));
   const texts=await p.locator('#stats-content').innerText();
   if(width<=400){const m=await p.evaluate(()=>{const a=document.querySelector('[data-sec="payout"]').getBoundingClientRect(),z=document.querySelector('[data-sec="staff"]').getBoundingClientRect(),sc=document.querySelector('.k-stats__scroll').getBoundingClientRect();return {first:a.top,last:z.bottom,top:sc.top,bottom:sc.bottom};});assert.ok(m.first>=m.top&&m.last<=m.bottom-24,'whole two-employee report fits');}
   else assert.equal(await p.locator('[data-sec="payout"]').evaluate(e=>getComputedStyle(e).paddingTop),'14px','large-phone design unchanged');
   for(const el of await p.locator('.k-sec__head').all()){const hit=await el.evaluate(e=>{const s=getComputedStyle(e,'::after');return e.getBoundingClientRect().height-parseFloat(s.top)-parseFloat(s.bottom);});assert.ok(hit>=48,'disclosure touch target remains 48px');}
   await p.locator('[data-sec="payout"] .k-sec__head').click();assert.equal(await p.locator('[data-sec="payout"] .k-sec__head').getAttribute('aria-expanded'),'false');await p.locator('[data-sec="payout"] .k-sec__head').click();assert.equal(await p.locator('#stats-content').innerText(),texts);
   // Long reports must remain scrollable, never truncated to make a screenshot fit.
   await p.evaluate(()=>{const data={ok:true,totals:{mochiQty:78,mooncakeQty:0,earned:12346078,payout:12345678,cashReceived:180,selfPaidCash:100,selfUnpaid:120,yandexQty:3},staff:Array.from({length:12},(_,i)=>({seller:'Тестовый сотрудник '+i,qty:12-i,earned:360,selfDeduct:0,payout:360})),payments:[],topFlavors:[],defects:[],loyaltySummary:{cardChecks:0,spentMinor:0,earnedMinor:0,pendingCount:0}};OMOTI_PREVIEW.summaryOverride=data;loadStats();});
   await p.waitForFunction(()=>document.querySelectorAll('.k-staffpay__row').length===12);
   for(const ios of [false,true]){if(ios)await p.addStyleTag({content:':root{--k-safe-t:59px!important;--k-safe-b:34px!important}'});await p.evaluate(()=>{const sc=document.querySelector('.k-stats__scroll'),last=document.querySelector('.k-staffpay__note');sc.scrollTop+=last.getBoundingClientRect().bottom-sc.getBoundingClientRect().bottom+20;});const m=await p.evaluate(()=>{const note=document.querySelector('.k-staffpay__note').getBoundingClientRect(),sc=document.querySelector('.k-stats__scroll').getBoundingClientRect();return {noteBottom:note.bottom,scrollBottom:sc.bottom,overflow:document.documentElement.scrollWidth>innerWidth,employees:document.querySelectorAll('.k-staffpay__row').length};});assert.ok(m.noteBottom<=m.scrollBottom);assert.equal(m.overflow,false);assert.equal(m.employees,12);}
   rows.push({file,width,status:'PASS',allTextPreserved:true,touchTarget:48,longReportReachable:true});
  }finally{await t.done();}
 }
}finally{await b.close();s.s.close();}H.fs.writeFileSync(H.path.join(H.task,'REPORT_FIT-'+kind+'.json'),JSON.stringify(rows,null,2));console.log(rows.length,'weekly report fit/scroll/disclosure checks PASS',kind);})().catch(e=>{console.error(e.stack);process.exitCode=1;});
