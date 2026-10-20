'use strict';const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),normalize=s=>s.replaceAll('\r\n','\n'),old=normalize(cp.execFileSync('git',['-C',root,'show','2e6d5a6:releases/20261020-recovery-r1/anikina-loyalty-v1.js']).toString()),next=normalize(fs.readFileSync(path.join(root,'releases/20261020-scanner-r1/anikina-loyalty-v1.js'),'utf8'));
assert.equal(next.split('  // Rotation is explicit:')[0],old.split('  // Rotation is explicit:')[0],'Non-scanner financial/card/draft code must remain identical');
assert.ok(next.slice(next.lastIndexOf('  function init(options) {'))===old.slice(old.lastIndexOf('  function init(options) {')),'Initializers, listeners and exported API unchanged');
for(const file of ['omoti_anikina.html','omoti_kassa.html','omoti_sovetskaya.html']){
 const before=normalize(cp.execFileSync('git',['-C',root,'show','2e6d5a6:'+file]).toString()),after=normalize(fs.readFileSync(path.join(root,file),'utf8'));
 const clean=s=>s.replace(/(recovery|scanner)-20261020-r1/g,'BUILD').replace(/releases\/20261020-(recovery|scanner)-r1\/anikina-loyalty-v1.js/g,'LOYALTY').replace(/(<script[^>]*data-boot-resource="anikina-loyalty-v1.js"[^>]*integrity=")[^"]+/, '$1SEAL');
 assert.equal(clean(after),clean(before),'HTML only resource path/version/seal '+file);
}
console.log('PASS scanner-only scope; all financial/card/draft/PIN code and APIs unchanged');
