self.addEventListener('install',e=>{e.waitUntil(caches.open('pneus-v1').then(c=>c.addAll(['index.html','dashboard.html','script.js','manifest.json','logoPneu.png'])));});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
