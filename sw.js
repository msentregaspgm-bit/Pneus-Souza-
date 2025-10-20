self.addEventListener('install', event=>{
  event.waitUntil(caches.open('pneus-souza-v3').then(cache=>cache.addAll(['/','/index.html','/dashboard.html','/manifest.json','/script.js','/logoPneu.png'])));
  self.skipWaiting();
});
self.addEventListener('fetch', event=>{
  event.respondWith(caches.match(event.request).then(r=>r||fetch(event.request)));
});