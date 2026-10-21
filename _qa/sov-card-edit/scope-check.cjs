const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto'),assert=require('assert/strict'),vm=require('vm');
const repo=path.resolve(__dirname,'../..'),base='2ca6d39364270947a7054a6125e519d6bf28c227',old=f=>Buffer.from(cp.execFileSync('git',['-C',repo,'show',base+':'+f]).toString().replaceAll('\r\n','\n')),read=f=>Buffer.from(fs.readFileSync(path.join(repo,f),'utf8').replaceAll('\r\n','\n'));
for(const f of ['omoti_kassa.html','omoti_anikina.html'])assert.ok(read(f).equals(old(f)),'Other cashier changed (source withheld): '+f);
let seals=0;for(const f of ['omoti_kassa.html','omoti_anikina.html','omoti_sovetskaya.html']){const html=read(f).toString();for(const [tag]of html.matchAll(/<(?:script|link)\b[^>]*data-boot-resource="[^"]+"[^>]*>/g)){const addr=/(?:src|href)="([^"]+)"/.exec(tag)[1].split('?')[0].replace(/^\.\//,'');assert.equal(/integrity="([^"]+)"/.exec(tag)[1],'sha384-'+crypto.createHash('sha384').update(read(addr)).digest('base64'));seals++;}for(const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);}
assert.equal(seals,50);
// All native scripts other than the reviewed startup/draft controller are identical.
const inline=html=>[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);assert.ok(JSON.stringify(inline(read('omoti_sovetskaya.html').toString()).slice(1))===JSON.stringify(inline(old('omoti_sovetskaya.html').toString()).slice(1)),'Protected native script changed (values withheld)');
const allowed=new Set(['omoti_sovetskaya.html',...['anikina-loyalty-v1.js','points-interface.js','editor.css','editor.js'].map(x=>'releases/20261021-sov-card-edit-r1/'+x)]);for(const f of cp.execFileSync('git',['-C',repo,'diff','--name-only',base]).toString().trim().split('\n'))if(!f.startsWith('_qa/'))assert.ok(allowed.has(f),'Out-of-scope change '+f);
const original=old('releases/20261020-recovery-r1/anikina-loyalty-v1.js').toString(),candidate=read('releases/20261021-sov-card-edit-r1/anikina-loyalty-v1.js').toString();
function fn(s,name){const m=new RegExp('^  (?:async )?function '+name+'\\(','m').exec(s);assert.ok(m,name);return s.slice(m.index).split(/\n(?=  (?:async )?function |  (?:let|const) |  window\.)/)[0].trim();}
for(const name of ['decodeFrame','loadDecoder','quote','rememberPending','forgetPending','submit','acknowledgeSavedStatus','checkStatus','cancelAttempt']){
 // The names occur in the purchase IIFE, except checkStatus which also occurs in corrections.
 const section=s=>s.slice(s.indexOf('/* Anikina loyalty.'));assert.equal(fn(section(candidate),name),fn(section(original),name),name);
}
for(const f of ['anikina-loyalty-v1.js','points-interface.js','editor.js'])new vm.Script(read('releases/20261021-sov-card-edit-r1/'+f).toString());
console.log('PASS 50 SRI; both other cashiers and all preexisting assets identical; native business/PIN scripts unchanged; sale coordinator and barcode decoder unchanged');
