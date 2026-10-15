const H=require('./harness.cjs');
(async()=>{const s=await H.server(),b=await H.pw.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),rows=[];
try{for(const file of ['omoti_kassa.html','omoti_sovetskaya.html'])for(const missing of ['motion.js','points-itogi.js','points-interface.js','anikina-loyalty-v1.js','init-throw']){
 const t=await H.context(b,s.url,390,{expectedErrors:true,demo:false});
 if(missing==='init-throw')await t.ctx.addInitScript(()=>{window.ResizeObserver=class{constructor(){throw Error('QA deliberate init failure');}};});
 else await t.ctx.route('**/'+missing+'?*',r=>r.abort());
 await t.page.goto(s.url+'/designer/'+file);await t.page.waitForTimeout(500);
 const row=await t.page.evaluate(()=>({active:document.body.classList.contains('c31-active'),oldHeaderVisible:!!document.querySelector('.topbar')?.getClientRects().length,appInert:document.querySelector('.app').inert,loyaltyHidden:document.getElementById('loyalty-panel').hidden}));
 rows.push({file,missing,...row,exceptions:t.errors});await t.page.screenshot({path:H.path.join(H.task,'before-'+file+'-'+missing+'.png')});await t.ctx.close();
}}finally{await b.close();s.s.close();H.fs.writeFileSync(H.path.join(H.task,'REPRODUCED_ORACLE.json'),JSON.stringify({source:'unchanged Claude HTML before startup supervisor',rows},null,2));console.log(rows.map(x=>({file:x.file,missing:x.missing,oldHeaderVisible:x.oldHeaderVisible,appInert:x.appInert,exceptions:x.exceptions})));}})();
