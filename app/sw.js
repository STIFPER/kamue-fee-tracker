// Service Worker: cache-first สำหรับ app shell เพื่อให้เปิดใช้งานได้ไวและใช้งานได้แม้ไม่มีเน็ต (features.md > Offline Support)
const CACHE_NAME = 'kamue-app-v22';
const SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './views.js',
  './data/config.js',
  './data/catalog.js',
  './data/store.js',
  './data/calc.js',
  './manifest.json',
  './icons/icon.svg',
];

// CDN ที่รู้จักและปลอดภัยจะ cache (ไฟล์ static นิ่งๆ ไม่ใช่ endpoint ข้อมูลของผู้ใช้)
const CACHEABLE_HOSTS = ['www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

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

// Cache-first + stale-while-revalidate: ตอบจากแคชทันทีถ้ามี (เปิดแอปไวไม่ต้องรอเน็ตทุกครั้ง) แล้วค่อยยิงไปเช็คของใหม่
// อัปเดตแคชเงียบๆ อยู่เบื้องหลังให้ครั้งต่อไปได้ของสด — จำกัดเฉพาะ asset นิ่งของแอปเองกับ CDN ที่รู้จัก (Firebase SDK, Google Fonts)
// ไม่แตะคำขอไปหา Firestore/Auth ของจริง กันไม่ให้ได้ข้อมูลผู้ใช้เก่าค้างแคช
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin && !CACHEABLE_HOSTS.includes(url.host)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const revalidate = fetch(event.request)
        .then((res) => {
          if (res.ok) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, res.clone()));
          return res;
        })
        .catch(() => cached);
      event.waitUntil(revalidate);
      return cached || revalidate;
    })
  );
});
