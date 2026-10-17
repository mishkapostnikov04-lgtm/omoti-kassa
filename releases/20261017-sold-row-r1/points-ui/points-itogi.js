/* OMOTI · Новогодняя / Советская · Итоги C3.2 «Отчёт-лента» с расчётом «К выплате».
   Основа — anikina-c31/itogi.js (утверждённые Итоги A Аникиной): те же раскрывающиеся разделы,
   сводки, запоминание на телефоне, лист периода. Отличие точек — раздел «К выплате» и сотрудники с выплатой.
   Значения пишет только renderStatsSummary кода (totals.earned, cashReceived, selfPaidCash, selfUnpaid,
   payout, staff[].payout). Здесь ничего не вычисляется: узлы кода переносятся, сводки читают их готовый текст. */
'use strict';
window.PointsItogi=Object.freeze({init({app,point,pointId,periodBody,periodSheet,defectsBody,openSheet,originals}){
 const $=id=>document.getElementById(id),make=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el;};
 const svg=path=>`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${path}"/></svg>`;
 // Порядок и раскрытие по умолчанию: расчёт и сотрудники — первым экраном для еженедельного скриншота.
 const defaults={payout:true,staff:true,sales:true,attention:false,bonus:true,top:false},key='omoti_'+pointId+'_stats_sections_v1';
 let state={...defaults};try{const saved=JSON.parse(localStorage.getItem(key));if(saved&&typeof saved==='object'&&!Array.isArray(saved))for(const name of Object.keys(defaults))if(typeof saved[name]==='boolean')state[name]=saved[name];}catch(_){state={...defaults};}
 const plural=(n,a,b,c)=>`${n} ${n%100>=11&&n%100<=14?c:n%10===1?a:n%10>=2&&n%10<=4?b:c}`;
 const parse=label=>{const match=/^(.*?)\s*\((.+)\)\s*$/.exec(label||'');return {main:match?match[1]:label||'',status:match?match[2]:''};};
 const short=label=>label.replace(/\.\d{4}/g,'').replace(/ - /g,' – ');
 const stats=$('screen-stats'),content=$('stats-content'),spinner=$('stats-spinner');stats.classList.add('k-stats','k-stats--points');
 const head=make('div','k-head'),title=make('h2','','Итоги'),period=make('button','k-period');period.id='c31-period';period.type='button';
 period.innerHTML='<span class="k-period__txt"><b></b><small></small></span>'+svg('m6 9 6 6 6-6');head.append(title,period);
 const cover=make('div','k-stats__cover'),scroll=make('div','k-stats__scroll');scroll.append(spinner,content);stats.prepend(cover,head);stats.append(scroll);content.className='k-stats__list';
 const secs={};
 function section(name,label,{strong=false,meta=false,chips=false,dot=false}={}){
  const card=make('section','k-sec');card.dataset.sec=name;const button=make('button','k-sec__head');button.type='button';button.setAttribute('aria-controls','c32-itogi-'+name);
  const caption=make('span','k-sec__title');if(dot){const mark=make('i','k-sec__dot');mark.setAttribute('aria-hidden','true');caption.append(mark);}caption.append(document.createTextNode(label));
  const aside=make('span','k-sec__aside'),sum=chips?null:make('span','k-sec__sum'+(strong?' k-sec__sum--strong':'')),info=meta?make('span','k-sec__meta'):null,toggle=make('span','k-sec__tg');toggle.setAttribute('aria-hidden','true');toggle.innerHTML=svg('m6 14 6-6 6 6');if(sum)aside.append(sum);if(info)aside.append(info);aside.append(toggle);button.append(caption,aside);card.append(button);
  const hints=chips?make('div','k-sec__chips'):null,body=make('div','k-sec__body');body.id='c32-itogi-'+name;if(hints)card.append(hints);card.append(body);
  secs[name]={card,button,sum,info,hints,body};card.addEventListener('click',event=>{if(state[name]&&!event.target.closest('.k-sec__head'))return;if(event.target.closest('.k-wide-btn'))return;const oldTop=scroll.scrollTop;state[name]=!state[name];try{localStorage.setItem(key,JSON.stringify(state));}catch(_){state={...defaults};}applyState();scroll.scrollTop=oldTop;updateScrolled();});return body;
 }
 function applyState(){for(const[name,s]of Object.entries(secs)){s.card.classList.toggle('is-open',state[name]);s.card.classList.toggle('is-closed',!state[name]);s.button.setAttribute('aria-expanded',String(state[name]));s.body.inert=!state[name];}}
 const payout=section('payout','К выплате',{strong:true,meta:true}),staff=section('staff','По продавцам'),sales=section('sales','Продажи'),attention=section('attention','Требует внимания',{chips:true,dot:true}),bonus=section('bonus','Бонусы за период'),top=section('top','Топ вкусов',{meta:true});

 /* --- «К выплате»: узлы .payout-card кода в порядке расчёта сервера ---------------------------------
    totals.payout = earned − cashReceived − selfPaidCash − selfUnpaid (docs/FINANCIAL_FIELDS.md, backend). */
 const card=content.querySelector('.payout-card'),rows=[...card.querySelectorAll('.payout-row')],rowById=Object.fromEntries(['p-sales','p-cash','p-self-paid-cash','p-self','p-total'].map(id=>[id,$(id).closest('.payout-row')])),rowOf=id=>rowById[id];
 const periodLine=make('div','k-pay__period'),periodMain=make('b','');periodLine.append(periodMain);
 const sold=make('div','k-pay__row k-pay__row--sold');
 const deductGroup=make('div','k-pay__group','Вычитается');
 const earnRow=rowOf('p-sales');
 for(const r of rows)r.className='k-pay__row';
 earnRow.classList.add('k-pay__row--earn');['p-cash','p-self-paid-cash','p-self'].forEach(id=>{rowOf(id).classList.add('k-pay__row--minus');$(id).classList.add('k-pay__val');});$('p-sales').classList.add('k-pay__val');
 const totalRow=rowOf('p-total');totalRow.className='k-pay__total';
 const payoutPeriod=$('payout-period');payoutPeriod.hidden=true;   // range.label кода; ниже — тот же текст без скобок
 payout.append(periodLine,sold,earnRow,deductGroup,rowOf('p-cash'),rowOf('p-self-paid-cash'),rowOf('p-self'),totalRow,payoutPeriod);card.remove();

 /* --- По сотрудникам: имя · продано · «К выплате» (staff[].payout — без вычета наличных точки) --- */
 const staffList=$('staff-stat-list');staff.append(staffList);staffList.classList.add('k-staffpay');
 // staff[].payout = earned − selfDeduct («Себе без оплаты» этого сотрудника). Наличные в кассе (от клиентов и «Себе оплачено
 // наличными») здесь не вычитаются — поэтому сумма по сотрудникам не равна totals.payout. Подпись и пояснение — только текст.
 const staffNote=make('p','k-note k-staffpay__note','Вознаграждение за продажи с учётом «Себе без оплаты». Наличные здесь не вычтены. Сумма перевода — выше, в блоке «К выплате».');staff.append(staffNote);

 /* --- Продажи: «Продано моти» и «Яндекс, шт» кода; «Заработано» и «Наличные» уже есть в расчёте ---- */
 const metrics=content.querySelector('.metrics-grid'),kpis=make('dl','k-kpis k-kpis--flat k-kpis--two');
 [['s-qty','Продано моти'],['s-ya','Яндекс, шт']].forEach(([id,label],i)=>{const cell=make('div','k-kpi'),value=make('dd',''),original=$(id);original.className='';value.append(original);cell.append(make('dt','',label),value);if(i===0){const extra=make('small',''),existing=$('s-extra-qty');existing.className='';extra.append(existing);cell.append(extra);}kpis.append(cell);});
 const keep=make('div','k-native-keep');keep.hidden=true;keep.append($('s-earn'),$('s-cash'),$('s-sub'));   // элементы, которые пишет renderStatsSummary, остаются в DOM
 sales.append(kpis);metrics.remove();

 /* --- Требует внимания: у точек только брак (долга «Взяли без оплаты» нет) ------------------------- */
 const defects=$('brak-section');defects.querySelectorAll('.sec-label').forEach(label=>label.remove());attention.append(defects);
 const defectHead=make('div','k-subhead');defectHead.append(make('span','','Брак · списано'),make('small',''));defects.prepend(defectHead);
 const defectButton=make('button','k-wide-btn');defectButton.type='button';defectButton.id='c31-all-defects';defectButton.onclick=()=>openSheet('defects');defects.append(defectButton);

 const bonusList=$('loyalty-stat-list'),bonusTitle=$('loyalty-stat-title'),topList=$('flavor-stat-list');bonus.append(bonusList);top.append(topList);topList.classList.add('k-bars');secs.top.info.textContent='за период, шт';
 const bonusShell=bonusTitle.closest('.loyalty-summary');bonusTitle.hidden=true;
 content.querySelectorAll(':scope>.sec-label').forEach(el=>el.remove());
 content.replaceChildren(...Object.values(secs).map(s=>s.card),keep,bonusShell);bonusShell.hidden=true;applyState();
 function updateScrolled(){stats.classList.toggle('is-scrolled',scroll.scrollTop>2);}scroll.addEventListener('scroll',updateScrolled,{passive:true});

 /* --- Лист периода — как у Аникиной --------------------------------------------------------------- */
 let segType=activePeriodType;
 const row=periodBody.querySelector('.period-row'),ddWeek=$('dd-week'),ddMonth=$('dd-month'),menus=make('div','k-itogi-options');row.classList.add('k-seg3');row.replaceChildren($('btn-week'),$('btn-month'),$('btn-all'));ddWeek.replaceChildren($('menu-week'));ddMonth.replaceChildren($('menu-month'));menus.append(ddWeek,ddMonth);periodBody.replaceChildren(row,menus);periodSheet.classList.add('k-itogi-period');periodSheet.querySelector('.k-x')?.remove();periodSheet.querySelector('.k-sheet__head').append(make('small','','отчёт обновится сразу'));
 function view(type){segType=type;ddWeek.hidden=type!=='week';ddMonth.hidden=type!=='month';$('menu-week').hidden=type!=='week';$('menu-month').hidden=type!=='month';for(const name of ['week','month','all'])$('btn-'+name).setAttribute('aria-pressed',String(name===type));}
 $('btn-week').onclick=()=>view('week');$('btn-month').onclick=()=>view('month');period.onclick=()=>{view(activePeriodType);syncPeriod();openSheet('period');};
 function syncPeriod(){
  const parsed=parse(currentPeriodRange?.label||''),all=activePeriodType==='all';period.querySelector('b').textContent=all?'Всё время':activePeriodType==='month'?'Месяц':'Неделя';period.querySelector('small').textContent=short(parsed.main);period.querySelector('small').hidden=all;
  secs.payout.info.replaceChildren();if(parsed.status){const pill=make('span','k-status-pill'+(/текущ/.test(parsed.status)?' k-status-pill--now':''),parsed.status);secs.payout.info.append(pill);}
  for(const type of ['week','month'])for(const item of $('menu-'+type).querySelectorAll('.period-dropdown-item')){if(!item.dataset.itogi){const p=parse(item.textContent),text=make('span','');text.append(make('b','',short(p.main)));if(p.status)text.append(make('small','',p.status));item.replaceChildren(text,make('i',''));item.dataset.itogi='true';item.classList.add('k-popt');}const selected=activePeriodType===type&&item.classList.contains('selected');item.setAttribute('aria-current',String(selected));item.querySelector('i').innerHTML=selected?svg('m5 12 4 4L19 6'):'';}
  for(const[type,label]of [['week','Неделя'],['month','Месяц'],['all','Всё время']])$('btn-'+type).textContent=label;view(segType);
 }
 function empty(list){if(!list.querySelector('.staff-stat-row,.flavor-stat-row'))for(const child of list.children){child.removeAttribute('style');child.classList.add('k-empty-row');}}
 function decorate(){
  // «К выплате»: период — range.label кода без скобок; статус из скобок — метка в заголовке раздела.
  const label=parse(payoutPeriod.textContent);periodMain.textContent=label.main.replace(/ - /g,' – ');
  const extra=$('s-extra-qty').textContent,soldValues=make('span','k-pay__val');
  soldValues.append(make('span','k-pay__quantity',$('s-qty').textContent+' моти'));
  if(extra)for(const quantity of extra.split(' · '))soldValues.append(make('span','k-pay__quantity k-pay__hint',quantity));
  sold.replaceChildren(make('span','','Продано'),soldValues);
  secs.payout.sum.textContent=$('p-total').textContent;
  secs.sales.sum.textContent=$('s-qty').textContent+' моти · Яндекс '+$('s-ya').textContent;$('s-extra-qty').parentElement.hidden=!extra;
  const allDefects=[...$('brak-stat-list').querySelectorAll('.staff-stat-row')],defectRows=allDefects.slice(1,-1),total=allDefects.at(-1)?.querySelector('.ss-qty')?.textContent||'';
  secs.attention.card.hidden=defects.style.display!=='block';secs.attention.hints.replaceChildren();
  if(defects.style.display==='block'){const chip=make('span','k-problem');chip.append(document.createTextNode('Брак '),make('i','','·'),document.createTextNode(' '+total));secs.attention.hints.append(chip);}
  defectHead.querySelector('small').textContent=total+' · '+plural(defectRows.length,'вкус','вкуса','вкусов');
  defectsBody.replaceChildren(...allDefects.map(r=>r.cloneNode(true)));allDefects.forEach((r,i)=>r.hidden=i===0||i===allDefects.length-1||i>3);
  for(const r of defectRows){r.classList.add('k-srow');r.querySelector('.ss-name')?.classList.add('k-srow__name');const qty=r.querySelector('.ss-qty');qty.classList.add('k-srow__val','k-srow__val--problem');qty.before(make('span',''));}
  defectButton.hidden=defectRows.length<=3;defectButton.innerHTML=escHtml('Весь брак · '+plural(defectRows.length,'вкус','вкуса','вкусов'))+' '+svg('m9 6 6 6-6 6');
  const dl=bonusList.querySelector('.loyalty-summary-values');if(dl){dl.classList.add('k-kpis','k-kpis--flat');for(const item of dl.children)item.classList.add('k-kpi');}
  bonusList.querySelectorAll('.ji-bonus-note').forEach(el=>{el.classList.add('k-note');el.classList.toggle('k-note--warn',el.textContent.startsWith('Ожидают'));});const checks=dl?.querySelector('dd')?.textContent.trim()||'—';secs.bonus.sum.textContent=checks==='—'?'чеки с картой · —':plural(Number(checks.replace(/\s/g,'')),'чек','чека','чеков')+' с картой';
  // Сотрудники: строка-заголовок кода («Имя · Продано · К выплате») остаётся подписью колонок.
  const staffRows=[...staffList.querySelectorAll('.staff-stat-row')],staffHead=staffRows.shift();if(staffHead){staffHead.classList.add('k-staffpay__head');staffHead.querySelectorAll('span').forEach(el=>el.removeAttribute('style'));const payHead=staffHead.querySelector('.ss-payout');if(payHead)payHead.textContent='Итого';staffHead.removeAttribute('style');}
  staffRows.forEach(r=>r.classList.add('k-staffpay__row'));secs.staff.sum.textContent=staffRows.length?plural(staffRows.length,'продавец','продавца','продавцов'):'нет данных';empty(staffList);staffNote.hidden=!staffRows.length;
  const topRows=[...topList.querySelectorAll('.flavor-stat-row')];topRows.forEach((r,i)=>{r.classList.add('k-barrow','k-barrow--rank');r.prepend(make('span','k-barrow__rank',String(i+1)));r.querySelector('.fs-name').classList.add('k-barrow__name');r.querySelector('.fs-bar-wrap').classList.add('k-bar');r.querySelector('.fs-qty').classList.add('k-barrow__val');});secs.top.sum.textContent=topRows.length?plural(topRows.length,'вкус','вкуса','вкусов'):'нет данных';empty(topList);syncPeriod();applyState();updateScrolled();
 }
 window.renderStatsSummary=function(json,range){originals.renderStatsSummary(json,range);decorate();};
 function loading(){if(spinner.textContent.includes('Загружаю')&&!spinner.querySelector('.k-itogi-skeleton')){const skeleton=make('div','k-itogi-skeleton');skeleton.setAttribute('aria-label',spinner.textContent);for(let i=0;i<3;i++)skeleton.append(make('div',''));spinner.replaceChildren(skeleton);}else if(spinner.textContent.includes('Нет связи')&&!spinner.querySelector('.k-itogi-error')){const retry=spinner.querySelector('button[onclick]');if(retry){const error=make('div','k-itogi-error'),text=make('b','','Нет связи');retry.className='k-btn';retry.removeAttribute('style');error.append(text,retry);spinner.replaceChildren(error);}}}
 new MutationObserver(loading).observe(spinner,{childList:true});loading();syncPeriod();
 return Object.freeze({syncPeriod,periodSelected(){segType=activePeriodType;syncPeriod();scroll.scrollTop=0;updateScrolled();}});
}});
