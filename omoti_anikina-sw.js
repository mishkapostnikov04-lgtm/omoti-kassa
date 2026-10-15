self.addEventListener('push',event=>{
  let message={};
  try{message=event.data?event.data.json():{};}catch{message={};}
  event.waitUntil(self.registration.showNotification('ОМОТИ · Аникина',{
    body:String(message.body||'Новое сообщение для кассы'),
    tag:'omoti-anikina-notice-'+String(message.id||Date.now()),
    icon:'./Dark.png',
    data:{url:'./omoti_anikina.html'},
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    const url=new URL('./omoti_anikina.html',self.location.href).href;
    const windows=await clients.matchAll({type:'window',includeUncontrolled:true});
    const existing=windows.find(windowClient=>{const current=new URL(windowClient.url);return current.origin===new URL(url).origin&&current.pathname===new URL(url).pathname;});
    if(existing)return existing.focus();
    return clients.openWindow(url);
  })());
});

// Anikina navigation is network-only: never resume an unchecked legacy HTML shell.
// No precache, Cache Storage, client reload, skipWaiting or data cleanup.
const cashierDocument=new URL('./omoti_anikina.html',self.location.href);
function startupUnavailable(){
 return new Response('<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OMOTI · Касса недоступна</title><body style="margin:40px 24px;background:#f6f5f1;color:#171717;font:16px/1.5 system-ui"><h1>Касса не загрузилась</h1><p>Продажи недоступны. Проверьте интернет и повторите загрузку. Не очищайте данные приложения и очередь чеков.</p><button style="padding:14px;border:0;border-radius:14px;background:#ffa21a;font:inherit" onclick="location.reload()">Повторить загрузку</button></body></html>',{status:503,headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store'}});
}
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.mode!=='navigate'||url.origin!==cashierDocument.origin||url.pathname!==cashierDocument.pathname)return;
 event.respondWith((async()=>{try{
  const response=await fetch(event.request,{cache:'no-store'});
  if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))return startupUnavailable();
  const html=await response.clone().text();
  if(!html.includes('id="anikina-boot-controller"')||!html.includes('data-cashier-boot="loading"'))return startupUnavailable();
  return response;
 }catch(_){return startupUnavailable();}})());
});