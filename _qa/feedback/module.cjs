const vm=require('vm'),fs=require('fs'),assert=require('assert/strict');
const source=fs.readFileSync(require('path').resolve(__dirname,'../../kassa-feedback/feedback.js'),'utf8');
function env({ios=false,noAudio=false,noVibrate=false,badStorage=false,badDecode=false,noSwitch=false}={}){
 let time=0;const nodes=[];const log={audio:[],stops:0,vibrate:[],clicks:0,fetch:[],writes:[],gain:0,session:[]},listeners={};
 const el=()=>({style:{},dataset:{},setAttribute(){},append(){},click(){log.clicks++;},...(noSwitch?{}:{switch:false})});
 const document={hidden:false,currentScript:{src:'https://fixture.test/kassa-feedback/feedback.js?v=20261021-r1'},createElement:el,body:el(),addEventListener(n,f){(listeners[n]??=[]).push(f);}};
 const navigator={userAgent:ios?'iPhone':'Android',audioSession:{set type(v){log.session.push(v);this.value=v},get type(){return this.value}}};
 if(!noVibrate)navigator.vibrate=p=>log.vibrate.push(p);
 class Audio{constructor(){this.state='running';this.destination={};}resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}createGain(){const g={connect(){}};Object.defineProperty(g,'gain',{value:{set value(v){log.gain=v}}});return g;}decodeAudioData(){return badDecode?Promise.reject(Error('decode')):Promise.resolve({duration:.2});}createBufferSource(){const s={connect(){},disconnect(){},start(){s.playing=true;s.at=time;log.audio.push(s.buffer)},stop(){log.stops++;s.playing=false;s.onended?.();}};nodes.push(s);return s;}}
 const window={};if(!noAudio)window.AudioContext=Audio;
 const context={window,document,navigator,URL,Map,Promise,AbortController,setTimeout,clearTimeout,performance:{now:()=>time},localStorage:{getItem(){if(badStorage)throw Error();return null},setItem(k,v){if(badStorage)throw Error();log.writes.push([k,v]);}},fetch:async u=>{log.fetch.push(String(u));return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)};}};
 vm.runInNewContext(source,context);const api=window.KassaFeedback;api.init({point:'anikina'});
 return {api,log,document,navigator,listeners,tick:n=>{time+=n;for(const s of nodes)if(s.playing&&time-s.at>=200){s.playing=false;s.onended?.();}},prime:async()=>{listeners.click.forEach(f=>f({isTrusted:true}));for(let i=0;i<8;i++)await Promise.resolve();}};
}
(async()=>{
let count=0;function pass(label){count++;console.log('PASS',label)}
const e=env();await e.prime();assert.equal(e.log.fetch.length,9);assert(!e.log.fetch.some(x=>x.includes('10-')));assert.equal(e.log.gain,.7);assert(e.log.session.every(x=>x==='ambient'));pass('9 exact MP3s, gain .7, ambient');
assert(e.api.signal('sale'));assert(!e.api.signal('cardFound'));assert(e.api.signal('error'));assert.equal(e.log.stops,1);assert(!e.api.signal('error'));e.tick(401);assert(e.api.signal('error'));pass('priority, interruption, 400ms throttle');
e.tick(401);assert(e.api.signal('tap',{fromTouch:true}));assert(!e.api.signal('tap'));e.tick(60);assert(e.api.signal('tap'));pass('silent tap and 60ms throttle');
e.api.setSettings({sound:false,vibration:false});e.log.audio=[];e.log.vibrate=[];e.tick(500);assert(!e.api.test());assert.equal(e.log.audio.length+e.log.vibrate.length,0);assert.equal(e.log.writes.at(-1)[0],'omoti_anikina_feedback_v1');pass('off means no audio or haptics; one scoped key');
const hidden=env();await hidden.prime();hidden.api.signal('sale');hidden.document.hidden=true;hidden.listeners.visibilitychange[0]();hidden.log.audio=[];hidden.log.vibrate=[];hidden.tick(500);assert(!hidden.api.test());assert.equal(hidden.log.audio.length+hidden.log.vibrate.length,0);pass('background stop and suppress');
for(const options of [{noAudio:true,noVibrate:true},{badStorage:true},{badDecode:true},{noAudio:true},{noVibrate:true}]){const f=env(options);await f.prime();assert.deepEqual(JSON.parse(JSON.stringify(f.api.settings())),{sound:true,vibration:true});f.api.signal('sale');f.api.setSettings({sound:false});}pass('missing APIs, decode/storage failures are harmless');
const i=env({ios:true,noVibrate:true});await i.prime();i.api.signal('sale');assert.equal(i.log.clicks,0);i.tick(401);i.api.test();assert.equal(i.log.clicks,1);assert.equal(i.log.vibrate.length,0);i.tick(401);i.api.signal('tap',{fromTouch:true});assert.equal(i.log.clicks,2);pass('iPhone async no haptic, touch synchronous label once');
const old=env({ios:true,noSwitch:true,noVibrate:true});delete old.navigator.audioSession;await old.prime();assert.equal(old.log.fetch.length,0);old.api.test();assert.equal(old.log.clicks,0);pass('unsupported iOS safe silence, no playback fallback');
// Sustained sequence does not accumulate voices.
const seq=env();await seq.prime();for(let n=0;n<30;n++){seq.tick(1000);assert(seq.api.signal('sale'));}assert.equal(seq.log.audio.length,30);pass('30 sequential sales, no queued replay');
console.log(count,'module groups PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
