// Service Worker: cache-first สำหรับ app shell เพื่อให้เปิดใช้งานได้แม้ไม่มีเน็ต (features.md > Offline Support)
const CACHE_NAME = 'kamue-app-v20';
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
  
  // Network-First Strategy: try to fetch from network first, fallback to cache if offline
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        // If fetch is successful, clone and update the cache
        if (res.ok && event.request.url.startsWith(self.location.origin)) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return res;
      })
      .catch(() => {
        // If network fails (offline), return cached version
        return caches.match(event.request);
      })
  );
});
