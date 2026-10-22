/* Saved and new receipts use the same C3.2 dock, card sheet and camera. */
(()=>{'use strict';
 const $=id=>document.getElementById(id),C=window.CashierLoyaltyCorrections;
 if(!C?.standardAction)throw Error('Несовместимый модуль редактирования');
 const cardButton=$('c31-card'),open=cardButton.onclick;
 cardButton.onclick=()=>{
  if(editNum&&!C.isEditing()){
   const check=journalChecksWithQueue().find(x=>String(x.num)===String(editNum));
   if(!C.beginAttach(check))return;
   updateCart();
  }
  open();
 };
 // Capture only edit events. The original new-sale listeners remain authoritative otherwise.
 function bind(id,event,action,value){$(id).addEventListener(event,e=>{
  if(!C.isEditing())return;
  if(event==='keydown'&&e.key!=='Enter')return;
  e.preventDefault();e.stopImmediatePropagation();C.standardAction(action,value?value(e):undefined);
 },true);}
 bind('loyalty-card','input','input',e=>e.target.value);
 bind('loyalty-card','keydown','select',e=>e.target.value);
 bind('loyalty-card-confirm','click','select',()=>$('loyalty-card').value);
 bind('loyalty-amount','input','redeem',e=>e.target.value);
 bind('loyalty-max','click','max');bind('loyalty-retry','click','retry');bind('loyalty-clear','click','clear');
 $('loyalty-scan').addEventListener('click',e=>{
  if(!C.isEditing())return;e.preventDefault();e.stopImmediatePropagation();
  AnikinaLoyalty.scanForCorrection(code=>C.standardAction('select',code),text=>{$('loyalty-status').textContent=text;$('loyalty-status').hidden=false;});
 },true);
 // Optional correction reason belongs alongside the existing comment, not a second editor.
 const reason=$('loyalty-correction-reason'),label=document.querySelector('label[for="loyalty-correction-reason"]');
 label.textContent='Причина исправления (необязательно)';reason.required=false;
 const box=document.createElement('div');box.className='cashier-edit-reason';box.hidden=true;box.append(label,reason);$('c31-cart-sheet').querySelector('.k-sheet__body').append(box);
 function render(){box.hidden=!C.isEditing();$('loyalty-correction-preview').hidden=true;}
 const update=window.updateCart;window.updateCart=function(...args){const result=update.apply(this,args);render();return result;};
 window.CashierCardEdit=Object.freeze({render});render();
})();
