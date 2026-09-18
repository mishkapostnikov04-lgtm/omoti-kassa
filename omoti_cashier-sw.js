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
    const existing=windows.find(windowClient=>windowClient.url===url);
    return existing?existing.focus():clients.openWindow(url);
  })());
});
