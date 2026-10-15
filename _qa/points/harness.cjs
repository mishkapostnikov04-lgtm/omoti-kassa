'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'../..'),task=path.resolve(root,'../_local_artifacts/cashier-points-c32-integration-20261015'),pack=path.join(task,'input/omoti-points-c32-handoff-20261015');fs.mkdirSync(task,{recursive:true});
const pw=require(path.resolve(path.dirname(process.execPath),'../node_modules/playwright'));
function fixtureScript(demo=true){let guard=fs.readFileSync(path.join(__dirname,'guard.js'),'utf8');
 guard=guard.replace("const point=",'const staticFetch=window.fetch.bind(window);\nconst point=');
 guard=guard.replace("const path=u.pathname;state.calls.push", "const path=u.pathname;if(u.origin===location.origin&&!path.includes('/b2c-api/'))return staticFetch(input,opts);state.calls.push");
 guard=guard.replace("['offline.invalid',location.hostname]","['offline.invalid','orders.omoti.ru',location.hostname]");
 guard=guard.replace("if(path.endsWith('/summary'))return", "if(path.endsWith('/summary')&&state.summaryOverride)return response(state.summaryOverride);if(path.endsWith('/summary'))return");
 guard=guard.replace("if(state.mode==='offline'||", "if(state.failPaths?.includes(path))throw new TypeError('QA forced transport loss');if(state.responses?.[path])return response(state.responses[path].body,state.responses[path].status||200);if(state.mode==='offline'||");
 // Demo unlock is a test-only overlay; native PIN is exercised separately, never exported.
 if(!demo)guard=guard.replace("if(overlay){const demo=", "if(false&&overlay){const demo=");
 return fs.readFileSync(path.join(__dirname,'fixtures.js'),'utf8')+'\n'+guard;
}
async function server(port=0){const s=http.createServer((req,res)=>{try{if(req.method!=='GET')throw Error('read only');const u=new URL(req.url,'http://localhost');let base=root,p=u.pathname.replace(/^\/src\//,'/');if(p.startsWith('/designer/')){p=p.slice(9);base=path.join(pack,'files/src');if(p.startsWith('/preview/')){base=__dirname;p=p.replace('/preview/','/');}else if(!fs.existsSync(path.resolve(base,'.'+p)))base=root;}if(p.startsWith('/reference/')){base=pack;p=p.slice(10);}if(p.startsWith('/before/')){base=path.join(task,'before');p=p.slice(7);if(!p.endsWith('.html'))base=root;}const f=path.resolve(base,'.'+p);if(!f.startsWith(base+path.sep)||p.includes('.git'))throw Error('scope');let raw;if(base===path.join(task,'before')){if(!['/omoti_kassa.html','/omoti_sovetskaya.html'].includes(p))throw Error('baseline scope');raw=require('node:child_process').execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'-C',root,'show','04ab7e92b98ce0e437ebb545b2c2f8dc902288af:'+p.slice(1)],{maxBuffer:1024*1024});raw=Buffer.from(raw.toString().replace(/const PIN_CODE\s*=\s*'[^']*'/,"const PIN_CODE = '__PIN_NOT_EXPORTED__'"));}else raw=fs.readFileSync(f);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html;charset=utf-8','.ttf':'font/ttf','.svg':'image/svg+xml'})[path.extname(f)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(/\.(js|css)$/.test(f)?raw.toString().replaceAll('\r\n','\n'):raw);}catch(_){res.statusCode=404;res.end('Not found');}});await new Promise(r=>s.listen(port,'127.0.0.1',r));return{s,url:'http://127.0.0.1:'+s.address().port};}
async function context(browser,url,width=390,options={}){const ctx=await browser.newContext({viewport:{width,height:({360:780,390:844,430:932})[width]||844},deviceScaleFactor:2,locale:'ru-RU',timezoneId:'Asia/Novosibirsk',serviceWorkers:'block',reducedMotion:options.motion||'reduce',hasTouch:true});const leaks=[],errors=[];
 await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin===new URL(url).origin)return r.continue();if(!u.hostname.endsWith('.kaspersky-labs.com'))leaks.push(u.hostname+u.pathname);return r.abort();});
 await ctx.addInitScript({content:fixtureScript(options.demo!==false)});if(options.init)await ctx.addInitScript(options.init);
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
 return {ctx,page,leaks,errors,async done(){if(!options.expectedErrors)require('node:assert/strict').deepEqual(errors,[]);require('node:assert/strict').deepEqual(leaks,[]);require('node:assert/strict').deepEqual(await page.evaluate(()=>OMOTI_PREVIEW.violations),[]);await ctx.close();}};
}
async function ready(p){await p.waitForFunction(()=>typeof promotionConfig!=='undefined'&&promotionConfig&&window.C31UI);await p.evaluate(()=>document.fonts.ready);}
async function stats(p,sov=false){await p.evaluate(()=>switchTab('stats'));if(sov)await p.evaluate(()=>{for(const digit of PIN_CODE)pinKey(digit);});await p.waitForFunction(()=>document.getElementById('stats-content').style.display==='block');}
module.exports={fs,path,root,task,pack,pw,fixtureScript,server,context,ready,stats};
if(require.main===module)server(Number(process.argv[2]||8910)).then(x=>console.log(x.url));
