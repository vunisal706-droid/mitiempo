// Red primero: siempre la última versión; caché solo si no hay conexión
const CACHE='mitiempo-v20-b2610102004',ASSETS=['./','./index.html','./manifest.json','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(ASSETS.map(a=>fetch(a,{cache:'reload'}).then(r=>c.put(a,r)).catch(()=>{})))))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys()
  .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||!e.request.url.startsWith(self.location.origin))return;
  e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r;})
    .catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});
