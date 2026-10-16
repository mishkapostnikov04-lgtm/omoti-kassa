'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),base='4f2294a8d76dc0eeb2cf4824ed0b0ba2889baaed';
const {resource}=require('./resources.cjs');
const old=f=>cp.execFileSync('git',['-C',root,'show',base+':'+f]).toString().replaceAll('\r\n','\n');
const read=f=>(process.argv.includes('--index')?cp.execFileSync('git',['-C',root,'show',':'+f]).toString():fs.readFileSync(path.join(root,f),'utf8')).replaceAll('\r\n','\n');
function program(s,name){const m=new RegExp('^(?:async )?function '+name+'\\(','m').exec(s);if(!m)return null;return s.slice(m.index).split(/\n(?=(?:async )?function |(?:const|let|var) |<\/script>)/)[0].trim();}
let seals=0,functions=0;
for(const file of ['omoti_anikina.html','omoti_kassa.html','omoti_sovetskaya.html']){
 const a=read(file),b=old(file);
 for(const name of ['getPrice','effectivePrice','cartTotal','mixedPaymentBreakdown','mixedPaymentIsValid','buildCloseCheckDraft','closeCheck','sendOperation','retryOperationQueue','confirmDeleteCheck','pinKey','pinDel','pinCancel','showPinFor']){
  if(program(b,name)){assert.ok(program(a,name)===program(b,name),'Protected native function changed: '+file+' '+name);functions++;}
 }
 for(const line of b.split('\n'))if(/^const (?:[A-Z_]*API|[A-Z_]*KEY|PAY_TYPES|PIN_CODE|OWNERS)\s*=/.test(line))assert.ok(a.split('\n').includes(line),'Protected API/storage/config constant changed (value undisclosed): '+file);
 for(const m of a.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
 for(const [tag,name]of a.matchAll(/<(?:script|link)\b[^>]*data-boot-resource="([^"]+)"[^>]*>/g)){
  const expected='sha384-'+crypto.createHash('sha384').update(read(resource(file,name,read))).digest('base64');assert.equal(/integrity="([^"]+)"/.exec(tag)[1],expected,'resource integrity '+name);seals++;
 }
}
const loyalty=read(resource('omoti_anikina.html','anikina-loyalty-v1.js',read)),before=old('anikina-loyalty-v1.js');
assert.equal(loyalty.split('/* Anikina loyalty.')[0],before.split('/* Anikina loyalty.')[0],'receipt/correction coordinator must remain exact');
function nested(s,name){const m=new RegExp('^  (?:async )?function '+name+'\\(','m').exec(s);assert.ok(m,name);return s.slice(m.index).split(/\n(?=  (?:async )?function |  window\.)/)[0].trim();}
for(const name of ['quote','rememberPending','forgetPending','finish','submit','acknowledgeSavedStatus','checkStatus','cancelAttempt']){assert.equal(nested(loyalty,name),nested(before,name),'Financial owner '+name);functions++;}
const files=cp.execFileSync('git',['-C',root,'ls-tree','-r','--name-only',base]).toString().trim().split('\n');
for(const file of files)if(/\.(css|ttf)$/.test(file)||['omoti_anikina-sw.js','omoti_cashier-sw.js','cashier-notices-client.js','cashier-registration-qr-v1.js'].includes(file))assert.equal(read(file),old(file),'Visual/worker/adjacent file changed '+file);
assert.equal(seals,45);
for(const f of ['cashier-loyalty-connection-v1.js','anikina-loyalty-v1.js','anikina-c31/interface.js','points-ui/points-interface.js']){
 assert.equal(read(f),old(f),'Keep original URL compatible with old cached HTML: '+f);
 const file=f.startsWith('points-ui/')?'omoti_kassa.html':'omoti_anikina.html';
 const selected=resource(file,f,read);assert.ok(selected.startsWith('releases/20261016-state-r3/'));
 const audited=cp.execFileSync('git',['-C',root,'show','8b92609763909bf81a15b950d43f3143951d1df6:'+f]).toString().replaceAll('\r\n','\n');
 assert.equal(read(selected),audited,'Release bytes differ from audited fix: '+f);
}
console.log('PASS '+functions+' exact protected financial/PIN functions, 45 resource seals, API/storage constants, correction coordinator, unchanged CSS/fonts/workers');
