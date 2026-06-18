const CACHE = 'att-sm-v4';
const HTML  = './index.html';
const ASSETS = [HTML, './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  const isSB   = url.hostname.endsWith('.supabase.co');

  // Supabase API: network-only; si falla, la app usa localStorage como caché
  if (isSB) return;

  if (isHTML) {
    // HTML: network-first para recibir actualizaciones al instante
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(HTML))
    );
  } else {
    // Assets (fuentes, imágenes): cache-first
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});
