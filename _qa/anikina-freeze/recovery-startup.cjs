'use strict';const H=require('./shift-harness.cjs'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(process.env.QA_OUTPUT||path.join(H.root,'../evidence/recovery-startup'));fs.mkdirSync(out,{recursive:true});
(async()=>{const server=await H.server(),browser=await H.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),rows=[];try{for(const point of Object.keys(H.files)){
 for(const asset of ['anikina-loyalty-v1.js',point==='anikina'?'anikina-c31/interface.js':'points-ui/points-interface.js','recovery.css'])for(const mode of ['missing','integrity']){
  const t=await H.context(browser,server.url,point);try{
   await t.ctx.route('**/releases/20261020-recovery-r1/'+asset+'?*',r=>mode==='missing'?r.abort():r.fulfill({contentType:asset.endsWith('.css')?'text/css':'text/javascript',body:'/* fixture invalid bytes */'}));
   await t.page.reload();await t.page.waitForFunction(()=>(window.AnikinaBoot||window.PointsBoot).state==='error');
   await t.page.evaluate(()=>closeCheck());assert.equal(t.s.calls.filter(c=>['checkout','save_check'].includes(c.action)).length,0);assert.equal(await t.page.locator('.app').evaluate(el=>el.inert),true);
   rows.push({point,asset,mode,status:'PASS'});
  }finally{await t.ctx.close();}
 }
 const t=await H.context(browser,server.url,point);try{
  await H.add(t.page);await H.pay(t.page,'Безналичный');await H.card(t.page);await H.ready(t.page);await H.dismiss(t.page);
  await t.ctx.addInitScript(point=>{const key='omoti_'+point+'_boot_draft_v1',s=JSON.parse(localStorage.getItem(key)||'null');if(s){delete s.loyaltyInput;localStorage.setItem(key,JSON.stringify(s));}},point);
  await t.page.reload();await t.page.waitForFunction(()=>(window.AnikinaBoot||window.PointsBoot).state==='ready');
  await t.page.locator('#close-btn').click();assert.equal(await t.page.evaluate(()=>C31UI.state.opened),'card');assert.equal(t.s.calls.filter(c=>['checkout','save_check'].includes(c.action)).length,0);
  await H.dismiss(t.page);t.page.once('dialog',d=>d.accept());await t.page.getByRole('button',{name:'Сбросить черновик',exact:true}).filter({visible:true}).first().click();
  assert.equal(await t.page.evaluate(()=>Object.values(cart).some(q=>q>0)),false);rows.push({point,scenario:'legacy draft explicit card guard and discard',status:'PASS'});
 }finally{await t.ctx.close();}
}}finally{await browser.close();await new Promise(r=>server.s.close(r));fs.writeFileSync(path.join(out,'RESULT.json'),JSON.stringify(rows,null,2));}console.log(rows.length,'startup/legacy-draft checks PASS');})().catch(e=>{console.error(e.stack);process.exitCode=1;});
