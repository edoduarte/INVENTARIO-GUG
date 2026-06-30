const CACHE='gug-inventory-v1';
const ASSETS=['./','./index.html','./style.css','./app.js','./manifest.webmanifest','./assets/gug-logo.svg','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
