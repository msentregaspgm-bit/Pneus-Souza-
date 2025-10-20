self.addEventListener("install", e => {
  e.waitUntil(
    caches.open("pneus-souza-v1").then(cache => {
      return cache.addAll([
        "./index.html",
        "./dashboard.html",
        "./script.js",
        "./logoPneu.png",
        "./manifest.json"
      ]);
    })
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
