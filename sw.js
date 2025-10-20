self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('pneus-souza-v2').then(cache => {
      return cache.addAll(['/', '/index.html', '/dashboard.html', '/manifest.json', '/script.js', '/logoPneu.png']);
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});