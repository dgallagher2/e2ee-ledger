const CACHE_NAME = 'e2ee-pwa-v1';
const ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'sw.js',
  // اگر آیکون دارید اضافه کنید:
  //'icon-192.png',
  //'icon-512.png'
];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evt => {
  // Cache-first برای فایل‌های static
  evt.respondWith(
    caches.match(evt.request).then(cached => {
      if (cached) return cached;
      return fetch(evt.request)
        .then(res => {
          // فقط GET و از همان اوریجین
          if (
            evt.request.method === 'GET' &&
            evt.request.url.startsWith(self.location.origin)
          ) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(evt.request, copy));
          }
          return res;
        })
        .catch(_=> {
          // آفلاین و فایل کش نشده: اگر HTML درخواست شده برگردان index.html
          if (evt.request.mode === 'navigate') {
            return caches.match('index.html');
          }
        });
    })
  );
});
