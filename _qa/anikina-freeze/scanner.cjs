'use strict';
const H=require('./shift-harness.cjs'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const pw=require(path.resolve(path.dirname(process.execPath),'../node_modules/playwright')),engine=process.env.QA_ENGINE||'chromium';
const out=path.resolve(process.env.QA_OUTPUT||path.join(H.root,'../evidence/scanner-'+engine));fs.mkdirSync(out,{recursive:true});
function drawFixture(spec){
 const Z=window.ZXing,codes=[104,...[...spec.number].map(x=>x.charCodeAt(0)-32)];codes.push((codes.reduce((n,x,i)=>n+x*(i||1),0)+(spec.invalid?1:0))%103,106);
 const patterns=codes.map(x=>Z.Code128Reader.CODE_PATTERNS[x]),modules=patterns.flatMap(x=>[...x]).reduce((a,b)=>a+b,0)+20;
 const code=document.createElement('canvas');code.width=modules*3;code.height=70;const c=code.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,code.width,code.height);c.fillStyle='#111';
 let cursor=30;for(const pattern of patterns)for(let i=0;i<pattern.length;i++){if(i%2===0)c.fillRect(cursor,0,pattern[i]*3,70);cursor+=pattern[i]*3;}
 const frame=document.createElement('canvas');frame.width=1080;frame.height=1920;const ctx=frame.getContext('2d');ctx.fillStyle='#aaa';ctx.fillRect(0,0,1080,1920);ctx.translate(540,960);ctx.rotate(spec.angle*Math.PI/180);ctx.fillStyle='#fff';ctx.fillRect(-spec.width/2-15,-50,spec.width+30,100);ctx.drawImage(code,-spec.width/2,-35,spec.width,70);return frame;
}
(async()=>{const server=await H.server(),browser=await pw[engine].launch(engine==='chromium'?{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}:{}),rows=[];
try{for(const point of Object.keys(H.files).filter(p=>!process.env.QA_POINT||p===process.env.QA_POINT)){
 const t=await H.context(browser,server.url,point),p=t.page;try{
  if(process.env.QA_PUBLIC_BASE)assert.match(await p.evaluate(()=>(window.AnikinaBoot||window.PointsBoot).build),/scanner-20261020-r1/);
  await p.evaluate(()=>AnikinaLoyalty.loadDecoder());await p.evaluate('window.drawScannerFixture='+drawFixture.toString());
  const result=await p.evaluate(()=>{
   const modes=[[false,true,0],[true,true,0],[false,false,0],[true,false,0],[false,true,-12],[true,true,-12],[false,true,12],[true,true,12],[false,true,-24],[true,true,-24],[false,true,24],[true,true,24]],cases=[];
   for(const number of ['1234567','2345678','7654321','8000522','123456','12345678'])for(const orientation of [0,90])for(const tilt of [0,16,24,-16]){
    const frame=drawScannerFixture({number,angle:orientation+tilt,width:360}),started=performance.now();let decoded=null;
    for(const mode of modes){decoded=AnikinaLoyalty.decodeFrame(frame,...mode);if(decoded)break;}
    cases.push({number,orientation,tilt,decoded,ms:Math.round(performance.now()-started)});
   }
   for(const angle of [0,90,16,106]){
    const frame=drawScannerFixture({number:'1234567',angle,width:360,invalid:true});let decoded=null;
    for(const mode of modes){decoded=AnikinaLoyalty.decodeFrame(frame,...mode);if(decoded)break;}cases.push({invalid:true,decoded});
   }
   const blank=document.createElement('canvas');blank.width=1080;blank.height=1920;blank.getContext('2d').fillRect(0,0,1080,1920);
   cases.push({invalid:true,decoded:modes.map(mode=>AnikinaLoyalty.decodeFrame(blank,...mode)).find(Boolean)||null});return cases;
  });
  assert.ok(result.filter(r=>!r.invalid).every(r=>r.decoded===r.number));assert.ok(result.filter(r=>r.invalid).every(r=>!r.decoded));
  rows.push({point,name:'48 valid tilted codes and 5 invalid/blank frames',status:'PASS',cases:result});console.log('PASS',point,'53 decoder frames',engine);
  if(engine==='chromium'){
   await H.add(p);await p.locator('#c31-card').click();
   await p.evaluate(()=>{navigator.mediaDevices.getUserMedia=async()=>{const c=drawScannerFixture({number:'1234567',angle:106,width:360});window.scannerTestStream=c.captureStream(15);let n=0;window.scannerTestTimer=setInterval(()=>{const x=c.getContext('2d');x.fillStyle=n++%2?'#888':'#999';x.fillRect(0,0,2,2);},70);return scannerTestStream;};});
   await p.locator('#loyalty-scan').click();await p.waitForFunction(()=>document.getElementById('loyalty-panel').classList.contains('is-selected'),{},{timeout:12000});
   assert.equal(await p.locator('#loyalty-card').inputValue(),'1234567');assert.equal(await p.evaluate(()=>document.getElementById('loyalty-camera').open),false);
   assert.equal(await p.evaluate(()=>scannerTestStream.getTracks().every(t=>t.readyState==='ended')),true);
   assert.equal(t.s.calls.filter(c=>c.action==='card').length,1);assert.equal(t.s.calls.filter(c=>['checkout','save_check'].includes(c.action)).length,0);
   await p.evaluate(()=>clearInterval(scannerTestTimer));rows.push({point,name:'camera stream tilt two-read confirmation and track cleanup',status:'PASS'});console.log('PASS',point,'camera flow and cleanup');
  }
  assert.deepEqual(t.s.errors,[]);assert.deepEqual(t.s.leaks,[]);
 }finally{await t.ctx.close();}
}}finally{await browser.close();await new Promise(r=>server.s.close(r));fs.writeFileSync(path.join(out,'RESULT.json'),JSON.stringify({engine,rows,productionBusinessCalls:0},null,2));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
