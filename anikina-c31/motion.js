/* ==========================================================================
   OMOTI · Касса · ред. 3.2 — движение (JS-часть). Эталон: прототип «Касса · живой прототип».
   Подключается ПОСЛЕ tokens.css и motion.css. Ничего не знает о чеке, ценах и API:
   кассовый код вызывает функции ниже в нужные моменты (MOTION.md, INTERACTIONS.md).
   Правила:
   • ни одна функция не ждёт окончания анимации и не блокирует касания (pointer-events: none);
   • при prefers-reduced-motion: reduce функции ничего не делают, класс .k-fx снят;
   • повторный вызов на том же элементе перезапускает эффект (pop, bump, tick, flash)
     или игнорируется, пока эффект идёт (shake).
   ========================================================================== */
(function(){
  'use strict';
  var EASE='cubic-bezier(.2,.8,.2,1)';
  var T={press:110,fly:420,pop:260,bump:240,tick:260,flash:360,out:240,outStep:25,outMax:10,shake:300,vibrate:8,flyMax:6};
  var media=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
  var app=null, wanted=true, flying=0;

  function enabled(){return wanted&&!(media&&media.matches)&&typeof Element!=='undefined'&&!!Element.prototype.animate;}
  function sync(){if(app)app.classList.toggle('k-fx',enabled());}
  function cancelOwn(el){if(el&&el.__kAnim){try{el.__kAnim.cancel();}catch(_){}el.__kAnim=null;}}
  function run(el,frames,ms,extra){
    if(!el||!enabled())return null;
    cancelOwn(el);
    var opts={duration:ms,easing:'linear'};for(var k in extra||{})opts[k]=extra[k];
    var a=el.animate(frames,opts);el.__kAnim=a;
    a.onfinish=a.oncancel=function(){if(el.__kAnim===a)el.__kAnim=null;};
    return a;
  }

  /* 3. Число на плитке «подпрыгивает»: .6 → 1.18 → 1, 260 мс */
  function pop(el){return run(el,[{transform:'scale(.6)',easing:EASE},{transform:'scale(1.18)',offset:.55,easing:EASE},{transform:'scale(1)'}],T.pop);}
  /* 4. Число в кнопке «Чек · N» — тот же характер, 240 мс (элемент должен быть inline-block) */
  function bump(el){return run(el,[{transform:'scale(.6)',easing:EASE},{transform:'scale(1.18)',offset:.55,easing:EASE},{transform:'scale(1)'}],T.bump);}
  /* 4. Сумма: янтарная подложка гаснет за 260 мс */
  function tick(el){return run(el,[{backgroundColor:'rgba(255,162,26,.28)',easing:EASE},{backgroundColor:'rgba(255,162,26,0)'}],T.tick);}

  /* 2. «+1» поднимается на 28 px и тает, 420 мс. x, y — координаты касания внутри root */
  function fly(root,x,y){
    if(!root||!enabled()||flying>=T.flyMax)return;
    var el=document.createElement('span');el.className='k-fly';el.textContent='+1';el.setAttribute('aria-hidden','true');
    el.style.left=x+'px';el.style.top=(y-24)+'px';root.appendChild(el);flying++;
    var a=el.animate([{transform:'translate(-50%,0)',opacity:0,easing:EASE},{opacity:1,offset:.2,easing:EASE},{transform:'translate(-50%,-28px)',opacity:0}],{duration:T.fly,easing:'linear',fill:'forwards'});
    var done=function(){flying--;el.remove();};a.onfinish=done;a.oncancel=done;
  }
  /* Точка «+1» для касания пальцем / мышью / клавиатурой */
  function flyFromEvent(root,ev,tile){
    var r=root.getBoundingClientRect(),x,y;
    if(ev&&ev.clientX){x=ev.clientX-r.left;y=ev.clientY-r.top;}
    else if(tile){var t=tile.getBoundingClientRect();x=t.left-r.left+t.width/2;y=t.top-r.top+t.height/2;}
    else return;
    fly(root,x,y);
  }

  /* 8. Встряхнуть (плашка «Кто продаёт?»). Пока идёт — повтор игнорируется */
  function shake(el){
    if(!el||!enabled()||el.__kAnim)return;
    var E='ease';run(el,[{transform:'translateX(0)',easing:E},{transform:'translateX(-5px)',offset:.2,easing:E},{transform:'translateX(5px)',offset:.4,easing:E},{transform:'translateX(-5px)',offset:.6,easing:E},{transform:'translateX(5px)',offset:.8,easing:E},{transform:'translateX(0)'}],T.shake);
  }

  /* 7а. Вспышка на кнопке после ПОДТВЕРЖДЁННОГО сохранения, 360 мс */
  function flash(btn){
    if(!btn||!enabled())return;
    var old=btn.querySelector('.k-flash');if(old)old.remove();
    var s=document.createElement('span');s.className='k-flash';s.setAttribute('aria-hidden','true');
    s.style.cssText='position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:radial-gradient(circle at 50% 50%,rgba(255,255,255,.55),transparent 60%)';
    btn.appendChild(s);
    var a=s.animate([{transform:'scale(.2)',opacity:1},{transform:'scale(2.2)',opacity:0}],{duration:T.flash,easing:'ease-out',fill:'forwards'});
    a.onfinish=a.oncancel=function(){s.remove();};
  }
  /* 7б. Плитки, которые были в чеке, «гаснут» из выбранного вида в обычный.
     Вызывается ПОСЛЕ того, как касса уже сбросила чек и перерисовала сетку:
     плитки сразу принимают касания, анимируется только фон и рамка. */
  function tilesOut(tiles,opts){
    if(!enabled())return;
    var brak=opts&&opts.brak;
    var from=brak?{bg:'#FBEDE7',ln:'#E7A88A'}:{bg:'#FFF3DC',ln:'#F59300'};
    Array.prototype.slice.call(tiles||[]).forEach(function(t,i){
      t.animate([{backgroundColor:from.bg,boxShadow:'inset 0 0 0 2px '+from.ln,easing:EASE},{backgroundColor:'#EBE9E3',boxShadow:'inset 0 0 0 2px rgba(245,147,0,0)'}],
        {duration:T.out,delay:Math.min(i,T.outMax)*T.outStep,easing:'linear',fill:'backwards'});
    });
  }

  /* 9. Короткая вибрация на +1 — только где есть navigator.vibrate (Android Chrome). iPhone: нет */
  function vibrate(){if(!enabled()||!navigator.vibrate)return;try{navigator.vibrate(T.vibrate);}catch(_){}}

  /* 1. Проседание плитки: класс .is-pressed на .k-tile, пока палец на .k-tile__hit */
  function onDown(e){var hit=e.target.closest&&e.target.closest('.k-tile__hit');if(hit&&!hit.disabled&&enabled()){var t=hit.closest('.k-tile');if(t)t.classList.add('is-pressed');}}
  function onUp(){if(!app)return;var p=app.querySelectorAll('.k-tile.is-pressed');for(var i=0;i<p.length;i++)p[i].classList.remove('is-pressed');}

  function init(root){
    app=root;sync();
    if(media){if(media.addEventListener)media.addEventListener('change',sync);else if(media.addListener)media.addListener(sync);}
    root.addEventListener('pointerdown',onDown,{passive:true});
    ['pointerup','pointercancel','pointerleave'].forEach(function(t){root.addEventListener(t,onUp,{passive:true});});
    return api;
  }
  /* Только для прототипа (переключатель «Эффекты»). В кассе не используется. */
  function setEnabled(v){wanted=!!v;sync();}

  var api={init:init,enabled:enabled,setEnabled:setEnabled,pop:pop,bump:bump,tick:tick,fly:fly,flyFromEvent:flyFromEvent,shake:shake,flash:flash,tilesOut:tilesOut,vibrate:vibrate,TIMING:T,EASE:EASE};
  window.KMotion=api;
})();
