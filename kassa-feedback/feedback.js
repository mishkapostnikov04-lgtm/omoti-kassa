/* Optional presentation feedback. No business state, transport or operation ownership. */
(() => {
 'use strict';
 if(window.KassaFeedback)return;
 const base=new URL('./',document.currentScript.src);
 const files={sale:'01-sale-done',savedOffline:'02-saved-offline',queueSent:'03-queue-sent',service:'04-service-saved',cardFound:'05-card-found',needInput:'06-need-input',error:'07-error',restockSent:'08-restock-sent',notice:'09-notice'};
 const priorities={error:8,needInput:7,sale:6,savedOffline:6,service:6,restockSent:5,notice:5,cardFound:4,queueSent:3,tap:2};
 const patterns={sale:[12,60,12],savedOffline:[30],service:[12],cardFound:[10],needInput:[10,40,10],error:[40,60,40],restockSent:[12,60,12],notice:[30,80,30],tap:[8]};
 const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
 let point='',prefs={sound:true,vibration:true},ctx,gain,loading=false,active=null,ambient=false,switchInput,switchLabel;
 const buffers=new Map(),last=new Map();
 const safe=fn=>{try{return fn();}catch(_){}};
 function settings(){return {...prefs};}
 function setSettings(value){
  for(const k of ['sound','vibration'])if(typeof value?.[k]==='boolean')prefs[k]=value[k];
  safe(()=>localStorage.setItem('omoti_'+point+'_feedback_v1',JSON.stringify(prefs)));
  if(!prefs.sound&&active?.source){safe(()=>active.source.stop());active.source=null;}
  if(!prefs.vibration)safe(()=>navigator.vibrate?.(0));
  return settings();
 }
 function stop(){
  if(active?.source)safe(()=>active.source.stop());
  if(active?.vibration)safe(()=>navigator.vibrate?.(0));
  active=null;
 }
 function prime(){
  if(document.hidden||!prefs.sound)return;
  safe(()=>{
   // Never promote an iPhone to playback: older iOS without ambient stays silent.
   if(navigator.audioSession){navigator.audioSession.type='ambient';ambient=navigator.audioSession.type==='ambient';}
   if(ios&&!ambient)return;
   if(!ctx){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;ctx=new Audio();gain=ctx.createGain();gain.gain.value=0.7;gain.connect(ctx.destination);}
   if(ctx.state==='suspended'||ctx.state==='interrupted')Promise.resolve(ctx.resume()).catch(()=>{});
   if(loading)return;loading=true;
   // Decode on the first gesture; never await on the cashier's touch path.
   Promise.all(Object.entries(files).map(async([name,file])=>{
    if(buffers.has(name))return;
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
    try{const response=await fetch(new URL('sounds/'+file+'.mp3?v=20261021-r1',base),{credentials:'same-origin',signal:controller.signal});if(!response.ok)return;const data=await response.arrayBuffer();const decoded=await ctx.decodeAudioData(data);buffers.set(name,decoded);}catch(_){}finally{clearTimeout(timer);}
   })).finally(()=>{loading=false;});
  });
 }
 function haptic(fromTouch,pattern){
  if(!prefs.vibration||!pattern)return false;
  if(!ios&&typeof navigator.vibrate==='function'){safe(()=>navigator.vibrate(pattern));return true;}
  // Called synchronously from a trusted click handler, never a deferred result.
  if(ios&&fromTouch&&switchInput&&'switch' in switchInput){safe(()=>switchLabel.click());}
  return false;
 }
 function signal(name,{fromTouch=false}={}){
  try{
   if(!point||document.hidden||!(name in priorities)||!prefs.sound&&!prefs.vibration)return false;
   const now=performance.now();if(now-(last.get(name)??-Infinity)<(name==='tap'?60:400))return false;
   if(active&&!active.source&&now>=active.until)active=null;
   if(active&&priorities[name]<active.priority)return false;
   // No replay of stale outcomes when a sound finishes loading.
   if(fromTouch)prime();
   const buffer=prefs.sound&&ctx?.state==='running'?buffers.get(name):null;
   const pattern=patterns[name];
   const canHaptic=prefs.vibration&&pattern&&(!ios&&typeof navigator.vibrate==='function'||ios&&fromTouch&&switchInput&&'switch' in switchInput);
   if(!buffer&&!canHaptic)return false;
   stop();last.set(name,now);
   const current={priority:priorities[name],until:now+Math.max(buffer?buffer.duration*1000:0,canHaptic?pattern.reduce((a,b)=>a+b,0):0),source:null,vibration:false};active=current;
   if(buffer){const source=ctx.createBufferSource();source.buffer=buffer;source.connect(gain);current.source=source;source.onended=()=>{safe(()=>source.disconnect());current.source=null;if(active===current&&performance.now()>=current.until)active=null;};safe(()=>source.start());}
   current.vibration=haptic(fromTouch,pattern);return true;
  }catch(_){return false;}
 }
 function init({point:next}={}){
  if(!['anikina','novogodnyaya','sovetskaya'].includes(next))return;
  if(point===next)return settings();if(point)return settings();point=next;
  safe(()=>{const stored=JSON.parse(localStorage.getItem('omoti_'+point+'_feedback_v1'));for(const k of ['sound','vibration'])if(typeof stored?.[k]==='boolean')prefs[k]=stored[k];});
  const box=document.createElement('span');box.dataset.kassaFeedbackHaptic='';box.setAttribute('aria-hidden','true');box.style.cssText='position:fixed;left:-100px;top:-100px;width:1px;height:1px;overflow:hidden;pointer-events:none';
  switchInput=document.createElement('input');switchInput.type='checkbox';switchInput.setAttribute('switch','');switchInput.tabIndex=-1;switchInput.id='kassa-feedback-haptic';switchLabel=document.createElement('label');switchLabel.htmlFor=switchInput.id;switchLabel.tabIndex=-1;box.append(switchInput,switchLabel);document.body.append(box);
  for(const event of ['pointerdown','touchend','click','keydown'])document.addEventListener(event,e=>{if(e.isTrusted)prime();},{capture:true,passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();safe(()=>ctx?.suspend()?.catch(()=>{}));}});
  return settings();
 }
 window.KassaFeedback=Object.freeze({init,signal,settings,setSettings,test:()=>signal('sale',{fromTouch:true})});
})();
