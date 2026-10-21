/* Optional UI feedback r2. No business state, API or operation storage. */
(() => {
 'use strict';
 if(window.KassaFeedback)return;
 const base=new URL('../',document.currentScript.src);
 const files={sale:'01-sale-done',savedOffline:'02-saved-offline',queueSent:'03-queue-sent',service:'04-service-saved',cardFound:'05-card-found',needInput:'06-need-input',error:'07-error',restockSent:'08-restock-sent',notice:'09-notice'};
 const priorities={error:8,needInput:7,sale:6,savedOffline:6,service:6,restockSent:5,notice:5,cardFound:4,queueSent:3,tap:2};
 const patterns={sale:[12,60,12],savedOffline:[30],service:[12],cardFound:[10],needInput:[10,40,10],error:[40,60,40],restockSent:[12,60,12],notice:[30,80,30],tap:[8]};
 const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
 const safe=fn=>{try{return fn();}catch(_){}};
 let point='',prefs={sound:true,vibration:true},ctx,gain,loading=null,active=null,input,label,testEpoch=0;
 const buffers=new Map(),last=new Map();
 const diagnostic={audioSession:'default',lastError:'',unlockAttempts:0};
 function status(){return {build:'20261021-r2',sound:prefs.sound,vibration:prefs.vibration,context:ctx?.state||'not-created',loaded:buffers.size,total:9,audioSession:diagnostic.audioSession,lastError:diagnostic.lastError,unlockAttempts:diagnostic.unlockAttempts,haptic:!ios&&typeof navigator.vibrate==='function'?'vibrate':ios&&input&&'switch' in input?'switch-gesture':'unavailable'};}
 function settings(){return {...prefs};}
 function stop(){if(active?.source)safe(()=>active.source.stop());if(active?.android)safe(()=>navigator.vibrate?.(0));active=null;}
 function setSettings(value){
  testEpoch++;
  for(const k of ['sound','vibration'])if(typeof value?.[k]==='boolean')prefs[k]=value[k];
  safe(()=>localStorage.setItem('omoti_'+point+'_feedback_v1',JSON.stringify(prefs)));
  if(!prefs.sound&&active?.source){safe(()=>active.source.stop());active.source=null;}
  if(!prefs.vibration)safe(()=>navigator.vibrate?.(0));return settings();
 }
 function deadline(promise,ms,stage){let timer;return Promise.race([Promise.resolve(promise),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(stage)),ms);})]).finally(()=>clearTimeout(timer));}
 function session(){
  // The experimental AudioSession API is optional. Native Web Audio on iOS
  // already uses the ambient/ringer channel; never switch to media playback.
  try{if(navigator.audioSession){navigator.audioSession.type='ambient';diagnostic.audioSession=navigator.audioSession.type==='ambient'?'ambient':'default';}else diagnostic.audioSession='default';}catch(_){diagnostic.audioSession='default';}
 }
 function prime(){
  if(document.hidden||!prefs.sound)return Promise.resolve();
  try{
   session();let unlock=false;
   if(!ctx||ctx.state==='closed'){
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){diagnostic.lastError='audio-unavailable';return Promise.resolve();}
    ctx=new Audio();gain=ctx.createGain();gain.gain.value=0.7;gain.connect(ctx.destination);unlock=true;
   }
   let resumed=Promise.resolve();
   if(ctx.state!=='running'){unlock=true;resumed=deadline(ctx.resume(),8000,'resume-timeout').catch(()=>{diagnostic.lastError='audio-locked';});}
   // Submit a zero-valued frame synchronously in the gesture, as well as resume.
   // This is Web Audio, not an HTML media element or a mute-switch workaround.
   if(unlock&&typeof ctx.createBuffer==='function')safe(()=>{const source=ctx.createBufferSource();source.buffer=ctx.createBuffer(1,1,ctx.sampleRate||44100);source.connect(gain);source.onended=()=>safe(()=>source.disconnect());source.start();diagnostic.unlockAttempts++;});
   if(!loading&&buffers.size<9){
    loading=Promise.all(Object.entries(files).map(async([name,file])=>{
     if(buffers.has(name))return;
     const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
     try{const response=await fetch(new URL('sounds/'+file+'.mp3?v=20261021-r1',base),{credentials:'same-origin',signal:controller.signal});if(!response.ok)throw Error('http');const bytes=await response.arrayBuffer();const buffer=await deadline(ctx.decodeAudioData(bytes),8000,'decode-timeout');buffers.set(name,buffer);}catch(_){diagnostic.lastError='sound-load';}finally{clearTimeout(timer);}
    })).finally(()=>{loading=null;});
   }
   return Promise.all([resumed,loading]).then(()=>{});
  }catch(_){diagnostic.lastError='audio-init';return Promise.resolve();}
 }
 function haptic(fromTouch,pattern){
  if(!prefs.vibration||!pattern)return {attempted:false,android:false};
  try{
   if(!ios&&typeof navigator.vibrate==='function')return {attempted:navigator.vibrate(pattern)!==false,android:true};
   if(ios&&fromTouch&&input&&'switch' in input){label.click();return {attempted:true,android:false};}
  }catch(_){}
  return {attempted:false,android:false};
 }
 function play(name,{fromTouch=false,withoutHaptic=false}={}){
  const result={accepted:false,audioStarted:false,hapticAttempted:false};
  try{
   if(!point||document.hidden||!(name in priorities)||!prefs.sound&&!prefs.vibration)return result;
   const now=performance.now();if(now-(last.get(name)??-Infinity)<(name==='tap'?60:400))return result;
   if(active&&!active.source&&now>=active.until)active=null;
   if(active&&priorities[name]<active.priority)return result;
   if(fromTouch)prime();
   const buffer=prefs.sound&&ctx?.state==='running'?buffers.get(name):null;
   const pattern=withoutHaptic?null:patterns[name];
   const canHaptic=prefs.vibration&&pattern&&(!ios&&typeof navigator.vibrate==='function'||ios&&fromTouch&&input&&'switch' in input);
   if(!buffer&&!canHaptic)return result;
   stop();last.set(name,now);
   const current={priority:priorities[name],until:now+Math.max(buffer?buffer.duration*1000:0,canHaptic?pattern.reduce((a,b)=>a+b,0):0),source:null,android:false};active=current;
   if(buffer){
    const source=ctx.createBufferSource();source.buffer=buffer;source.connect(gain);current.source=source;
    source.onended=()=>{safe(()=>source.disconnect());current.source=null;if(active===current&&performance.now()>=current.until)active=null;};
    try{source.start();result.audioStarted=true;}catch(_){current.source=null;safe(()=>source.disconnect());diagnostic.lastError='sound-start';}
   }
   const pulse=haptic(fromTouch,pattern);current.android=pulse.android;result.hapticAttempted=pulse.attempted;result.accepted=result.audioStarted||result.hapticAttempted;
  }catch(_){diagnostic.lastError='signal';}
  return result;
 }
 function signal(name,options){return play(name,options).accepted;}
 function test(){
  if(!point||document.hidden)return Promise.resolve({accepted:false,audioStarted:false,hapticAttempted:false,...status()});
  const epoch=++testEpoch;
  // Normal outcomes are never queued. Only this explicit diagnostic command can
  // wait for decode; the cashier and its touch handlers remain synchronous.
  const preparation=prime();
  if(ctx?.state==='running'&&buffers.has('sale'))return Promise.resolve({...play('sale',{fromTouch:true}),...status()});
  const pulse=haptic(true,patterns.sale); // iPhone needs this before any await.
  return deadline(preparation,8500,'test-timeout').catch(()=>{diagnostic.lastError='test-timeout';}).then(()=>{
   const result=epoch===testEpoch&&!document.hidden?play('sale',{withoutHaptic:true}):{accepted:false,audioStarted:false,hapticAttempted:false};
   return {...result,hapticAttempted:pulse.attempted,...status()};
  });
 }
 function init({point:next}={}){
  if(!['anikina','novogodnyaya','sovetskaya'].includes(next))return;
  if(point)return settings();point=next;
  safe(()=>{const stored=JSON.parse(localStorage.getItem('omoti_'+point+'_feedback_v1'));for(const k of ['sound','vibration'])if(typeof stored?.[k]==='boolean')prefs[k]=stored[k];});
  const box=document.createElement('span');box.dataset.kassaFeedbackHaptic='';box.setAttribute('aria-hidden','true');box.style.cssText='position:fixed;left:-100px;top:-100px;width:1px;height:1px;overflow:hidden;pointer-events:none';
  input=document.createElement('input');input.type='checkbox';input.setAttribute('switch','');input.tabIndex=-1;input.id='kassa-feedback-haptic';label=document.createElement('label');label.htmlFor=input.id;label.tabIndex=-1;box.append(input,label);document.body.append(box);
  for(const event of ['pointerdown','touchend','click','keydown'])document.addEventListener(event,e=>{if(e.isTrusted)prime();},{capture:true,passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){testEpoch++;stop();safe(()=>ctx?.suspend()?.catch(()=>{}));}});
  return settings();
 }
 window.KassaFeedback=Object.freeze({init,signal,settings,setSettings,test,status});
})();
