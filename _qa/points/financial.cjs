'use strict';const H=require('./harness.cjs'),assert=require('node:assert/strict');
const cases=[
 ['normal',{earned:780,cashReceived:180,selfPaidCash:100,selfUnpaid:120,payout:380}],
 ['negative',{earned:30,cashReceived:400,selfPaidCash:100,selfUnpaid:120,payout:-590}],
 ['zero',{earned:0,cashReceived:0,selfPaidCash:0,selfUnpaid:0,payout:0}],
 ['fractional',{earned:780.25,cashReceived:180.5,selfPaidCash:100.25,selfUnpaid:120.5,payout:379}],
 ['large',{earned:1234567,cashReceived:12345,selfPaidCash:10000,selfUnpaid:120,payout:1212102}],
 ['field-sentinels',{earned:811,cashReceived:183,selfPaidCash:107,selfUnpaid:129,payout:392}],
 ['post-receipt',{earned:810,cashReceived:180,selfPaidCash:100,selfUnpaid:120,payout:410}],
];
const summary=t=>({ok:true,totals:{...t,checks:7,qty:20,mochiQty:20,mooncakeQty:2,salesAmount:9999,yandexQty:3},staff:[{seller:'Демо А',qty:20,earned:600,selfDeduct:120,payout:480},{seller:'Демо Б',qty:2,earned:180,selfDeduct:0,payout:180}],topFlavors:[{name:'Клубника',qty:16}],defects:[{name:'Криспи',qty:1}],loyaltySummary:{cardChecks:2,spentMinor:12000,earnedMinor:18000,pendingCount:0}});
(async()=>{const s=await H.server(),b=await H.pw.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),rows=[];try{for(const file of ['omoti_kassa.html','omoti_sovetskaya.html']){
 const pages=[];for(const prefix of ['/before/','/']){const t=await H.context(b,s.url,390,{demo:false});await t.page.goto(s.url+prefix+file);await t.page.waitForFunction(()=>typeof promotionConfig!=='undefined'&&promotionConfig);if(prefix==='/')await H.ready(t.page);if(prefix==='/before/'&&file.includes('sovetskaya')){await t.page.evaluate(()=>{pinUnlocked=true;openTab('stats');});await t.page.waitForFunction(()=>document.getElementById('stats-content').style.display==='block');}else await H.stats(t.page,file.includes('sovetskaya'));pages.push(t);}
 for(const [name,totals]of cases){const data=summary(totals),results=[];for(const t of pages){await t.page.evaluate(data=>OMOTI_PREVIEW.summaryOverride=data,data);await t.page.evaluate(()=>loadStats());results.push(await t.page.evaluate(()=>({fields:['p-sales','p-cash','p-self-paid-cash','p-self','p-total','s-qty','s-ya','s-earn','s-cash'].map(id=>document.getElementById(id).textContent),staff:[...document.querySelectorAll('#staff-stat-list .staff-stat-row')].slice(1).map(r=>r.querySelector('.ss-payout').textContent)})));}
 assert.deepEqual(results[1],results[0],'identical API response must yield identical financial values');assert.deepEqual(results[1].fields.slice(0,5),await pages[1].page.evaluate(t=>[t.earned,t.cashReceived,t.selfPaidCash,t.selfUnpaid,t.payout].map(money),totals));assert.deepEqual(results[1].staff,await pages[1].page.evaluate(()=>[480,180].map(money)));rows.push({file,case:name,status:'PASS',before:results[0],after:results[1]});
 }for(const t of pages)await t.done();
 }}finally{await b.close();s.s.close();}H.fs.writeFileSync(H.path.join(H.task,'FINANCIAL_PARITY.json'),JSON.stringify(rows,null,2));console.log(rows.length,'same-response native/UI financial checks PASS; staff amounts remain distinct from point payout');})().catch(e=>{console.error(e.stack);process.exitCode=1;});
