const cashierPages=new Set(['omoti_kassa.html','omoti_sovetskaya.html']);
function cashierUrl(value){
  try{const url=new URL(value,self.location.href);if(url.origin===self.location.origin&&cashierPages.has(url.pathname.split('/').pop()))return url.href;}catch{}
  return self.registration.scope;
}
self.addEventListener('push',event=>{
  let message={};try{message=event.data?event.data.json():{};}catch{}
  event.waitUntil(self.registration.showNotification(String(message.title||'ОМОТИ · касса'),{
    body:String(message.body||'Новое сообщение для кассы'),
    tag:'omoti-cashier-notice-'+String(message.id||Date.now()),
    icon:'./Dark.png',
    data:{url:cashierUrl(message.url)},
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    const url=cashierUrl(event.notification.data?.url);
    const windows=await clients.matchAll({type:'window',includeUncontrolled:true});
    const target=new URL(url);
    const existing=windows.find(windowClient=>{try{const candidate=new URL(windowClient.url);return candidate.origin===target.origin&&candidate.pathname===target.pathname;}catch{return false;}});
    return existing?existing.focus():clients.openWindow(url);
  })());
});

// Only the two points: network-only HTML with the early startup supervisor.
// Natural worker activation; no resource cache, forced reload or storage cleanup.
function startupUnavailable(){
 return new Response('<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>OMOTI · Касса недоступна</title><body style="margin:40px 24px;background:#f6f5f1;color:#171717;font:16px/1.5 system-ui"><h1>Касса не загрузилась</h1><p>Продажи недоступны. Проверьте интернет и повторите загрузку. Не очищайте данные приложения и очередь чеков.</p><button style="padding:14px;border:0;border-radius:14px;background:#ffa21a;font:inherit" onclick="location.reload()">Повторить загрузку</button></body></html>',{status:503,headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store'}});
}
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url),base=new URL(self.registration.scope);
 if(event.request.mode!=='navigate'||url.origin!==base.origin||!cashierPages.has(url.pathname.split('/').pop())||url.pathname.slice(0,url.pathname.lastIndexOf('/')+1)!==base.pathname.slice(0,base.pathname.lastIndexOf('/')+1))return;
 event.respondWith((async()=>{try{
  const response=await fetch(event.request,{cache:'no-store'});
  if(!response.ok||!response.headers.get('content-type')?.includes('text/html'))return startupUnavailable();
  const html=await response.clone().text();
  if(!html.includes('id="points-boot-controller"')||!html.includes('data-cashier-boot="loading"'))return startupUnavailable();
  return response;
 }catch(_){return startupUnavailable();}})());
});
