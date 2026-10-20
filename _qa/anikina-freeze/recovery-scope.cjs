'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),base='cf4cb53c5accbc6f2908fbe373038664618d3744',read=f=>fs.readFileSync(path.join(root,f),'utf8').replaceAll('\r\n','\n');
const old=f=>cp.execFileSync('git',['-C',root,'show',base+':'+f]).toString().replaceAll('\r\n','\n');
function program(s,name){const m=new RegExp('^(?:async )?function '+name+'\\(','m').exec(s);if(!m)return null;return s.slice(m.index).split(/\n(?=(?:async )?function |(?:const|let|var) |<\/script>)/)[0].trim();}
let seals=0,functions=0;
for(const file of ['omoti_anikina.html','omoti_kassa.html','omoti_sovetskaya.html']){
 const a=read(file),b=old(file);
 for(const name of ['getPrice','effectivePrice','cartTotal','mixedPaymentBreakdown','mixedPaymentIsValid','buildCloseCheckDraft','closeCheck','sendOperation','retryOperationQueue','confirmDeleteCheck','pinKey','pinDel','pinCancel','showPinFor','submitRestock']){
  if(program(b,name)){assert.equal(program(a,name),program(b,name),'Protected native handler changed: '+file+' '+name);functions++;}
 }
 for(const line of b.split('\n'))if(/^const (?:[A-Z_]*API|[A-Z_]*KEY|PAY_TYPES|PIN_CODE|OWNERS)\s*=/.test(line))assert.ok(a.split('\n').includes(line),'Protected constant changed (value undisclosed): '+file);
 for(const m of a.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
 for(const [tag] of a.matchAll(/<(?:script|link)\b[^>]*data-boot-resource="[^"]+"[^>]*>/g)){
  const addr=/(?:src|href)="([^"]+)"/.exec(tag)[1].split('?')[0].replace(/^\.\//,'');
  assert.equal(/integrity="([^"]+)"/.exec(tag)[1],'sha384-'+crypto.createHash('sha384').update(read(addr)).digest('base64'));seals++;
 }
}
const loyalty=read('releases/20261020-recovery-r1/anikina-loyalty-v1.js'),before=old('releases/20261016-state-r3/anikina-loyalty-v1.js');
assert.equal(loyalty.split('/* Anikina loyalty.')[0],before.split('/* Anikina loyalty.')[0]);
function nested(s,name){const m=new RegExp('^  (?:async )?function '+name+'\\(','m').exec(s);assert.ok(m,name);return s.slice(m.index).split(/\n(?=  (?:async )?function |  window\.)/)[0].trim();}
for(const name of ['quote','rememberPending','forgetPending','finish','submit','acknowledgeSavedStatus','checkStatus','cancelAttempt']){assert.equal(nested(loyalty,name),nested(before,name),'Financial owner '+name);functions++;}
for(const f of cp.execFileSync('git',['-C',root,'ls-tree','-r','--name-only',base]).toString().trim().split('\n')){
 if(/\.(css|ttf)$/.test(f)||/^(omoti_anikina-sw.js|omoti_cashier-sw.js|cashier-notices-client.js|cashier-registration-qr-v1.js)$/.test(f)||f.startsWith('releases/'))assert.equal(read(f),old(f),'Old immutable asset changed '+f);
}
assert.equal(seals,48);console.log('PASS',functions,'protected native/financial handlers; 48 SRI seals; original release assets, CSS, fonts, workers and constants unchanged');
