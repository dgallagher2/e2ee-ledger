const CACHE = 'e2ee-pwa-v1';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './sw.js',
  // کتابخانه supabase (اولین بار آنلاین لازم است تا کش شود)
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async()=>{
    const cache = await caches.open(CACHE);

    // برای cross-origin بهتر است Request با no-cors بسازیم
    const reqs = ASSETS.map(url=>{
      try{
        const u = new URL(url, self.location.href);
        const cross = u.origin !== self.location.origin;
        return cross ? new Request(url, { mode:'no-cors' }) : new Request(url);
      }catch{
        return new Request(url);
      }
    });

    await cache.addAll(reqs);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // فقط GET را cache کنیم
  if(req.method !== 'GET') return;

  // cache-first برای فایل‌های خودمان
  if(url.origin === self.location.origin){
    event.respondWith((async()=>{
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      if(cached) return cached;

      const fresh = await fetch(req);
      cache.put(req, fresh.clone());
      return fresh;
    })());
    return;
  }

  // برای فایل CDN: stale-while-revalidate ساده
  if(req.url.includes('cdn.jsdelivr.net')){
    event.respondWith((async()=>{
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const fetchPromise = fetch(req).then(res=>{
        cache.put(req, res.clone());
        return res;
      }).catch(()=>cached);
      return cached || fetchPromise;
    })());
  }
});
