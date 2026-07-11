// Service Worker: cache-first สำหรับ app shell เพื่อให้เปิดใช้งานได้แม้ไม่มีเน็ต (features.md > Offline Support)
const CACHE_NAME = 'kamue-app-v7';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './views.js',
  './data/catalog.js',
  './data/store.js',
  './data/calc.js',
  './manifest.json',
  './icons/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        if (res.ok && event.request.url.startsWith(self.location.origin)) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
