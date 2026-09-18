(()=>{
  'use strict';
  const script=document.currentScript;
  const point=script?.dataset.point;
  const page=script?.dataset.page;
  if(!['novogodnyaya','sovetskaya'].includes(point)||!['omoti_kassa.html','omoti_sovetskaya.html'].includes(page))return;
  const base='https://orders.omoti.ru/b2c-api/cashier-notices';
  const ackKey='omoti_cashier_notice_ack_'+point;
  const styles=document.createElement('style');
  styles.textContent='.cashier-notice{display:none;margin:10px 14px 0;padding:12px;border:1px solid #b6c9e8;border-radius:14px;background:#edf4ff;color:#183354;font-size:13px;line-height:1.45}.cashier-notice.visible{display:block}.cashier-notice strong{display:block;margin-bottom:4px}.cashier-notice button,.push-setup button{border:1px solid #8ea7cf;background:#fff;color:#183354;border-radius:9px;padding:7px 10px;font-family:inherit;font-size:12px;font-weight:600;line-height:1.2;cursor:pointer;margin-top:8px}.push-setup{margin:8px 14px 0;font-size:12px;color:#526067}.push-setup:empty{display:none}';
  document.head.append(styles);
  const banner=document.createElement('div');
  banner.className='cashier-notice';banner.setAttribute('role','status');banner.setAttribute('aria-live','polite');
  const title=document.createElement('strong');title.textContent='Сообщение для кассы';
  const message=document.createElement('span');
  const dismiss=document.createElement('button');dismiss.type='button';dismiss.textContent='Понятно';
  banner.append(title,message,document.createElement('br'),dismiss);
  const setup=document.createElement('div');setup.className='push-setup';
  document.querySelector('.promotion-status')?.after(banner,setup);
  let currentId=0;
  dismiss.onclick=()=>{if(currentId)localStorage.setItem(ackKey,String(currentId));banner.classList.remove('visible');};
  async function request(path,options){const token=await cashierToken();const response=await fetch(base+path,Object.assign({cache:'no-store'},options||{},{headers:Object.assign({'Authorization':'Bearer '+token},options?.headers||{})}));const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||'Не удалось получить сообщения');return result;}
  async function check(){try{const result=await request('/messages?point='+point);const notices=result.notices||[];const newest=notices[notices.length-1];if(!newest)return;const id=Number(newest.id);if(id<=Number(localStorage.getItem(ackKey)||0))return;currentId=id;message.textContent=newest.message;banner.classList.add('visible');}catch{/* Сбой сообщений не мешает продажам. */}}
  function publicKeyBytes(base64){const padded=base64+'='.repeat((4-base64.length%4)%4);const binary=atob(padded.replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(binary,c=>c.charCodeAt(0));}
  async function enable(){if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window)){setup.textContent='Фоновые уведомления в этом браузере недоступны. Сообщения появятся при открытой кассе.';return;}try{const permission=await Notification.requestPermission();if(permission!=='granted'){setup.textContent='Уведомления не разрешены. Сообщения появятся при открытой кассе.';return;}const config=await request('/config?point='+point);if(!config.vapidPublicKey)throw new Error('Фоновые уведомления ещё не настроены');const registration=await navigator.serviceWorker.register('./omoti_cashier-sw.js',{scope:'./'+page});let subscription=await registration.pushManager.getSubscription();if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:publicKeyBytes(config.vapidPublicKey)});await request('/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({point,subscription:subscription.toJSON()})});setup.textContent='Уведомления включены для этого устройства.';}catch(error){setup.textContent='Не удалось включить фоновые уведомления: '+error.message+' Сообщения будут видны в кассе.';}}
  async function start(){try{const config=await request('/config?point='+point);if(!config.vapidPublicKey)return;const iphone=/iPhone|iPad|iPod/.test(navigator.userAgent);const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;if(iphone&&!standalone){setup.textContent='На iPhone фоновые уведомления работают, когда касса добавлена на экран «Домой» и открыта через её иконку. Пока сообщения будут видны внутри кассы.';return;}if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window)){setup.textContent='В этом браузере доступны только сообщения внутри кассы.';return;}const registration=await navigator.serviceWorker.register('./omoti_cashier-sw.js',{scope:'./'+page});const existing=await registration.pushManager.getSubscription();if(existing&&Notification.permission==='granted'){await request('/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({point,subscription:existing.toJSON()})});setup.textContent='Уведомления включены для этого устройства.';return;}const button=document.createElement('button');button.type='button';button.textContent='Включить уведомления о сообщениях';button.onclick=enable;setup.replaceChildren(button);}catch{/* Сбой уведомлений не мешает продажам. */}}
  check();start();
  setInterval(check,30000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
})();
