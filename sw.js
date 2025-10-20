self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('pneus-souza-cache').then(cache => {
      return cache.addAll(['/', '/index.html', '/manifest.json', '/script.js', '/logoPneu.png']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});