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
    const existing=windows.find(windowClient=>windowClient.url===url);
    if(existing)return existing.focus();
    return clients.openWindow(url);
  })());
});
