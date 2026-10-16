'use strict';
const path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
function resource(file,logical,read=f=>fs.readFileSync(path.join(root,f),'utf8')){
 const tag=[...read(file).matchAll(/<(?:script|link)\b[^>]*data-boot-resource="([^"]+)"[^>]*>/g)].find(m=>m[1]===logical)?.[0];
 assert.ok(tag,'Missing resource '+logical);
 const raw=/(?:src|href)="([^"]+)"/.exec(tag)[1].replaceAll('&amp;','&');
 const url=new URL(raw,'https://fixture.invalid/'+file);
 assert.equal(url.origin,'https://fixture.invalid');
 const name=decodeURIComponent(url.pathname.slice(1));
 assert.ok(path.resolve(root,name).startsWith(root+path.sep));
 return name;
}
module.exports={resource};
