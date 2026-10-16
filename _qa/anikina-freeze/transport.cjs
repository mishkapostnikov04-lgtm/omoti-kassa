'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
function fixture(){
 let time=0,id=0,calls=0;const timers=new Map();
 const w={console:{warn(){}}};
 const ctx={window:w,AbortController,Error,Object,JSON,Promise,Date:{now:()=>time},setTimeout(fn,ms){timers.set(++id,{at:time+ms,fn});return id;},clearTimeout(k){timers.delete(k);},fetch(url,opts){calls++;return new Promise((resolve,reject)=>opts.signal.addEventListener('abort',()=>reject(Object.assign(Error('aborted'),{name:'AbortError'})),{once:true}));}};
 vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../../cashier-loyalty-connection-v1.js'),'utf8'),ctx);
 const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
 return {api:w.CashierConnection,get calls(){return calls;},get timers(){return timers.size;},flush,async tick(ms){time+=ms;for(const[k,t]of [...timers])if(t.at<=time){timers.delete(k);t.fn();}await flush();}};
}
(async()=>{
 let cases=0;
 for(const action of ['card','quote']){
  const f=fixture();let done=false,error;
  f.api.loyalty('https://offline.invalid/',action,{},async()=> 'fixture-token').catch(e=>error=e).finally(()=>done=true);await f.flush();assert.equal(f.calls,1);
  await f.tick(12000);assert.equal(done,false);await f.tick(600);assert.equal(f.calls,2);await f.tick(12000);
  assert.equal(done,true);assert.equal(error.code,'CASHIER_TIMEOUT');assert.equal(f.timers,0);cases++;console.log('PASS bounded read',action,'24600ms, two attempts, no leaked timer');
 }
 for(const action of ['checkout','status','cancel']){
  const f=fixture(),abort=new AbortController();abort.abort();let done=false,error;
  f.api.loyalty('https://offline.invalid/',action,{},async()=> 'fixture-token',{signal:abort.signal}).catch(e=>error=e).finally(()=>done=true);await f.flush();
  assert.equal(f.calls,1);await f.tick(29999);assert.equal(done,false);await f.tick(1);assert.equal(done,true);assert.equal(error.code,'CASHIER_TIMEOUT');assert.equal(f.calls,1);assert.equal(f.timers,0);cases++;console.log('PASS financial transport unchanged',action,'30000ms, one attempt, caller cancellation ignored');
 }
 const f=fixture(),abort=new AbortController();let cancelled;
 f.api.loyalty('https://offline.invalid/','card',{},async()=> 'fixture-token',{signal:abort.signal}).catch(e=>cancelled=e);await f.flush();abort.abort();await f.flush();assert.equal(cancelled.code,'CASHIER_READ_CANCELLED');assert.equal(f.calls,1);assert.equal(f.timers,0);cases++;console.log('PASS explicit read cancellation does not retry');
 console.log(cases+'/'+cases+' PASS');
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
