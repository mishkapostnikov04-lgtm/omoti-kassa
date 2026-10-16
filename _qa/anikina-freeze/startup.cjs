'use strict';
const H=require('../c31/harness.cjs'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(H.root,'../evidence/anikina-startup');fs.mkdirSync(out,{recursive:true});
(async()=>{const server=await H.server(),url=server.url+'/omoti_anikina.html',b=await H.chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),rows=[];
async function blocked(t){await t.page.waitForFunction(()=>AnikinaBoot.state==='error');assert.equal(await t.page.locator('.app').isVisible(),false);assert.equal(await t.page.locator('.app').evaluate(el=>el.inert),true);await t.page.evaluate(()=>window.closeCheck?.());assert.equal(t.requests.filter(r=>/save_check|checkout/.test(r.path)).length,0);}
try{
 const assets=[...fs.readFileSync(path.join(H.root,'omoti_anikina.html'),'utf8').matchAll(/data-boot-resource="([^"]+)"/g)].map(m=>m[1]);assert.equal(assets.length,13);
 for(const asset of assets){const t=await H.context(b,url);try{await t.ctx.route('**/'+asset+'?*',r=>r.abort());await t.page.goto(url);await blocked(t);rows.push({name:'missing '+asset,status:'PASS'});}finally{await t.ctx.close();}}
 for(const asset of ['anikina-c31/interface.js','anikina-loyalty-v1.js']){const t=await H.context(b,url);try{await t.ctx.route('**/'+asset+'?*',r=>r.fulfill({contentType:'text/javascript',body:'/* incompatible fixture bytes */'}));await t.page.goto(url);await blocked(t);rows.push({name:'wrong integrity '+asset,status:'PASS'});}finally{await t.ctx.close();}}
 const t=await H.context(b,url);let abort=true;try{
  await t.ctx.route('**/anikina-c31/itogi.js?*',r=>abort?r.abort():r.continue());await t.page.goto(url);await blocked(t);const saved=await t.page.evaluate(()=>localStorage.getItem('omoti_sellers_anikina'));abort=false;await t.page.locator('#cashier-boot-retry').click();await t.page.waitForFunction(()=>AnikinaBoot.state==='ready');assert.equal(await t.page.evaluate(()=>localStorage.getItem('omoti_sellers_anikina')),saved);
  await t.page.evaluate(()=>{changeQty('Смородина',2);window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await t.page.evaluate(()=>cart['Смородина']),2);assert.equal(await t.page.evaluate(()=>AnikinaBoot.state),'ready');rows.push({name:'explicit safe retry plus lifecycle continuity',status:'PASS'});
 }finally{await t.ctx.close();}
}finally{await b.close();await new Promise(r=>server.s.close(r));fs.writeFileSync(path.join(out,'RESULT.json'),JSON.stringify(rows,null,2));}console.log(rows.length+'/'+rows.length+' startup checks PASS');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
