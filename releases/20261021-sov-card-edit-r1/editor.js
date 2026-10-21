/* Sovetskaya only. Existing receipt owners and C3.2 components remain in charge. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),C=window.CashierLoyaltyCorrections,kassa=$('screen-kassa');
 if(CASHIER_ACCESS_POINT!=='sovetskaya'||!C?.view)throw Error('Несовместимый модуль редактирования');
 const make=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 const screen=make('section','sov-editor');screen.hidden=true;screen.setAttribute('aria-label','Редактирование чека');
 const head=make('header','sov-editor__head'),title=make('h2','','Редактирование'),cancel=make('button','k-btn k-btn--light','Отмена правки');cancel.type='button';head.append(title,cancel);
 const scroll=make('div','sov-editor__scroll'),summary=make('section','sov-editor__card'),items=make('div','sov-editor__items'),payment=make('p','sov-editor__muted'),itemsButton=make('button','k-btn k-btn--light','Изменить состав и оплату');itemsButton.type='button';summary.append(make('h3','','Состав и оплата'),items,payment,itemsButton);
 const card=make('section','sov-editor__card'),cardTitle=make('h3','','Бонусная карта'),current=make('p','sov-editor__number'),change=make('button','k-btn k-btn--light','Изменить карту');change.type='button';card.append(cardTitle,current,change);
 const targetBox=make('div','sov-editor__target'),targetLabel=make('label','','Правильная карта'),target=make('input',''),scan=make('button','k-btn k-btn--light','Сканировать карту'),keep=make('button','k-link','Оставить прежнюю карту');
 target.id='sov-target-card';targetLabel.htmlFor=target.id;target.inputMode='numeric';target.autocomplete='off';target.maxLength=16;target.placeholder='Номер под штрихкодом';scan.type=keep.type='button';targetBox.append(targetLabel,target,scan,keep,make('p','sov-editor__muted','Номер, дата, состав и оплаченная сумма чека сохранятся. Условия начисления остаются как в исходной покупке.'));card.append(targetBox);
 const reasonCard=make('section','sov-editor__card'),reason=$('loyalty-correction-reason'),reasonLabel=document.querySelector('label[for="loyalty-correction-reason"]');reasonLabel.textContent='Причина исправления (необязательно)';reason.required=false;reasonCard.append(reasonLabel,reason);
 const preview=make('section','sov-editor__card sov-editor__preview'),message=make('p','sov-editor__message');message.setAttribute('role','status');const values=make('div','sov-editor__values');preview.append(message,values);
 const pendingBox=make('div','sov-editor__pending'),pending=$('loyalty-correction-pending'),home=document.createComment('correction pending home');pending.before(home);
 const actions=make('footer','sov-editor__actions'),primary=make('button','k-btn','Проверить изменения');primary.type='button';actions.append(primary);scroll.append(summary,card,reasonCard,preview,pendingBox);screen.append(head,scroll,actions);kassa.append(screen);
 const returnButton=make('button','k-btn k-btn--light sov-editor-return','К проверке изменений');returnButton.type='button';returnButton.hidden=true;kassa.prepend(returnButton);
 let mode='review',lastCheck='',drawing=false,lastModel='';
 function exit(){if(C.view().busy||C.view().pending)return;C.cancelEdit();}
 cancel.onclick=exit;returnButton.onclick=()=>{C31UI.openSheet('');mode='review';render();};
 itemsButton.onclick=()=>{C.cancelCardChange();mode='items';C31UI.openSheet('');render();};
 change.onclick=()=>{C.setCardTarget('');mode='review';render();target.focus();};
 keep.onclick=()=>{C.cancelCardChange();target.value='';render();};
 target.oninput=()=>C.setCardTarget(target.value);
 scan.onclick=()=>AnikinaLoyalty.scanForCorrection(number=>{if(!C.view().editing||C.view().pending)return;target.value=number;C.setCardTarget(number);},text=>{message.classList.add('is-error');message.textContent=text;target.focus();});
 primary.onclick=()=>{
  const v=C.view();if(v.busy||v.pending)return;
  if(v.cardChanging&&!AnikinaLoyalty.cardNumber(target.value)){target.focus();message.textContent='Проверьте номер правильной карты.';return;}
  if(!v.quote){$('loyalty-correction-retry').click();return;}
  $('close-btn').click();
 };
 function render(){if(drawing)return;drawing=true;try{
  const v=C.view(),editing=Boolean(v.editing),active=editing||v.pending;
  if(editing&&String(v.editing.num)!==lastCheck){lastCheck=String(v.editing.num);mode='review';}
  if(!active){lastCheck='';mode='review';}
  const review=active&&(mode==='review'||v.pending);screen.hidden=!review;returnButton.hidden=!editing||review;
  kassa.classList.toggle('sov-edit-review',review);kassa.classList.toggle('sov-edit-items',editing&&!review);
  if(!active)return;
  title.textContent=v.pending?'Проверяем исправление':'Редактирование '+CashierReceiptDetails.receiptLabel(v.editing);
  cancel.disabled=v.busy||v.pending;primary.disabled=v.busy||v.pending||v.reading;
  if(v.pending){if(pending.parentElement!==pendingBox)pendingBox.append(pending);summary.hidden=card.hidden=reasonCard.hidden=preview.hidden=true;actions.hidden=true;return;}
  if(pending.parentElement===pendingBox)home.after(pending);
  summary.hidden=card.hidden=reasonCard.hidden=preview.hidden=false;actions.hidden=false;
  if(!review){$('close-btn').textContent=v.busy?'Сохраняем исправление…':'Проверить изменения';return;}
  const model=JSON.stringify({cart,payType,seller,target:v.targetCardCode,changing:v.cardChanging,quote:v.quote,error:v.error,reading:v.reading,busy:v.busy,reason:reason.value,check:v.editing.num});
  if(model===lastModel)return;lastModel=model;
  const rows=Object.entries(cart).filter(([,q])=>q>0).map(([name,q])=>{const row=make('div','sov-editor__item');row.append(make('span','',name),make('b','',q+' шт'));return row;});items.replaceChildren(...rows);
  payment.textContent=String(payType)+' · '+String(seller)+' · '+String(v.editing.date)+' '+String(v.editing.time);
  current.textContent='Текущая карта: '+String(v.editing.loyalty.cardCode||v.editing.loyalty.cardSuffix||'номер не получен');
  targetBox.hidden=!v.cardChanging;change.hidden=v.cardChanging;
  if(document.activeElement!==target)target.value=v.targetCardCode;
  message.classList.toggle('is-error',Boolean(v.error));
  message.textContent=v.error|| (v.reading?'Проверяем изменения…':v.cardChanging&&!AnikinaLoyalty.cardNumber(v.targetCardCode)?'Введите или отсканируйте правильную карту.':v.quote?(v.cardChanging?'Перенос бонусов по этому чеку:':'Изменения проверены.'):'Проверьте данные и повторите расчёт.');
  values.replaceChildren();if(v.quote){const money=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n/100)+' ₽';const q=v.quote;
   for(const [label,value] of (v.cardChanging?[
    ['С карты '+String(v.editing.loyalty.cardCode||v.editing.loyalty.cardSuffix),'−'+money(q.earnMinor)+' начисления'],
    ['На карту '+v.targetCardCode,'+'+money(q.earnMinor)+' начисления'],
    ...(q.redeemMinor?[['Возврат списания прежней карте','+'+money(q.redeemMinor)],['Списание с правильной карты','−'+money(q.redeemMinor)]]:[]),
    ['Оплачено — без изменений',money(q.dueMinor)]]:[['К оплате',money(q.dueMinor)],['Начисление бонусов',money(q.earnMinor)]])){
     const row=make('div','sov-editor__item');row.append(make('span','',label),make('b','',value));values.append(row);
   }
  }
  primary.textContent=v.busy?'Сохраняем исправление…':v.reading?'Проверяем изменения…':v.error?'Повторить проверку':'Проверить изменения';
 }finally{drawing=false;}}
 const update=window.updateCart;window.updateCart=function(...args){const result=update.apply(this,args);render();return result;};
 window.SovCardEdit=Object.freeze({render});render();
})();
