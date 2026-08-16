const CACHE_NAME = 'e2ee-pwa-v1';
const ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'sw.js'
  // 'icon-192.png',
  // 'icon-512.png'
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
  evt.respondWith(
    caches.match(evt.request).then(cached => {
      if (cached) return cached;
      return fetch(evt.request)
        .then(res => {
          if (evt.request.method === 'GET' &&
              evt.request.url.startsWith(self.location.origin)) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(evt.request, copy));
          }
          return res;
        })
        .catch(_ => {
          if (evt.request.mode === 'navigate') {
            return caches.match('index.html');
          }
        });
    })
  );
});
