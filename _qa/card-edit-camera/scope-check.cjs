const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert/strict'),crypto=require('crypto'),vm=require('vm');
const repo=path.resolve(__dirname,'../..'),base='9a6efc7d81c7d4deaf6fe3aaca5fb78bdb7238d0',norm=s=>s.replaceAll('\r\n','\n'),old=f=>norm(cp.execFileSync('git',['-C',repo,'show',base+':'+f]).toString()),read=f=>norm(fs.readFileSync(path.join(repo,f),'utf8'));
const prefix='releases/20261021-card-edit-camera-r1/',allowed=new Set(['omoti_anikina.html','omoti_kassa.html','omoti_sovetskaya.html',...['loyalty.js','editor.css','editor.js','points-interface.js','anikina-interface.js'].map(x=>prefix+x)]);let seals=0;
const inline=s=>[...s.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(x=>norm(x[1]));
for(const file of ['omoti_anikina.html','omoti_kassa.html','omoti_sovetskaya.html']){
 const a=read(file),b=old(file);assert.ok(JSON.stringify(inline(a).slice(1))===JSON.stringify(inline(b).slice(1)),'Protected native/PIN scripts changed (values withheld)');
 for(const m of inline(a))new vm.Script(m);
 for(const [tag]of a.matchAll(/<(?:script|link)\b[^>]*data-boot-resource="[^"]+"[^>]*>/g)){const f=/(?:src|href)="([^"]+)"/.exec(tag)[1].split('?')[0].replace(/^\.\//,'');assert.equal(/integrity="([^"]+)"/.exec(tag)[1],'sha384-'+crypto.createHash('sha384').update(read(f)).digest('base64'),f);seals++;}
 assert.equal((a.match(/class="tab-btn/g)||[]).length,(b.match(/class="tab-btn/g)||[]).length);
 assert.equal(/id="screen-restock"/.test(a),file!=='omoti_anikina.html');
}
assert.equal(seals,54);
for(const f of cp.execFileSync('git',['-C',repo,'diff','--name-only',base]).toString().trim().split('\n'))if(!f.startsWith('_qa/'))assert.ok(allowed.has(f),'Out of scope '+f);
function fn(s,name){const m=new RegExp('^  (?:async )?function '+name+'\\(','m').exec(s);assert.ok(m,name);return s.slice(m.index).split(/\n(?=  (?:async )?function |  (?:let|const) |  window\.)/)[0].trim();}
const common=read(prefix+'loyalty.js'),sov=old('releases/20261021-sov-card-edit-r1/anikina-loyalty-v1.js'),scanner=old('releases/20261020-scanner-r1/anikina-loyalty-v1.js'),purchase=s=>s.slice(s.indexOf('/* Anikina loyalty.'));
for(const name of ['quote','rememberPending','forgetPending','finish','submit','acknowledgeSavedStatus','checkStatus','cancelAttempt'])assert.equal(fn(purchase(common),name),fn(purchase(sov),name),name+' financial coordinator');
for(const name of ['loadDecoder','decodeRows','decodeFrame'])assert.equal(fn(purchase(common),name),fn(purchase(scanner),name),'Exact Anikina scanner '+name);
assert.equal(common.slice(0,common.indexOf('  // Rotation is explicit:')),sov.slice(0,sov.indexOf('  // Rotation is explicit:')));
assert.equal(read(prefix+'points-interface.js'),old('releases/20261021-sov-card-edit-r1/points-interface.js'));
console.log('PASS 54 SRI; native business/PIN scripts, tabs, point-specific logic unchanged; financial coordinator retained; decoder byte-equivalent to current Anikina');
