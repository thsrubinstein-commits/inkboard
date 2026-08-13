// OneSlate service worker — offline shell, but always prefers fresh content so new
// deploys show up immediately. Same-origin GETs only; never touches API calls.
const CACHE = 'oneslate-v24';

// Cross-origin hosts we're allowed to cache: the MediaPipe eye-control runtime
// (WASM + model), lazy-loaded from a CDN only when the user enables eye control.
// These are versioned/immutable URLs, so cache-first is safe and gives the
// feature offline reuse after the first load.
const GAZE_HOSTS = ['cdn.jsdelivr.net', 'storage.googleapis.com'];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => e.waitUntil((async () => {
  // Purge every old cache so a stale index.html can't linger.
  const keys = await caches.keys();
  await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
  await self.clients.claim();
})()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const u = new URL(req.url);
  if (req.method !== 'GET') return;

  // MediaPipe assets (cross-origin): cache-first for offline eye control.
  if (u.origin !== location.origin) {
    if (GAZE_HOSTS.includes(u.hostname)) {
      e.respondWith((async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        const net = await fetch(req);
        if (net && (net.ok || net.type === 'opaque')) cache.put(req, net.clone());
        return net;
      })());
    }
    return;
  }

  const isDoc = req.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('.html');

  if (isDoc) {
    // Network-first for the app itself: always get the newest deploy, fall back to
    // cache only when truly offline.
    e.respondWith((async () => {
      try {
        const net = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(CACHE);
        cache.put(req, net.clone());
        return net;
      } catch (err) {
        const cached = await caches.match(req);
        return cached || Response.error();
      }
    })());
    return;
  }

  // Static assets (fonts, icons): stale-while-revalidate — fast, but refreshed in bg.
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const net = fetch(req).then((r) => {
      if (r && r.status === 200 && r.type === 'basic') cache.put(req, r.clone());
      return r;
    }).catch(() => cached);
    return cached || net;
  })());
});
