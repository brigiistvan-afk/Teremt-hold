// Teremtő Hold – service worker
// Az index.html mindig a hálózatról jön (friss verzió), offline esetén a gyorsítótárból.
const CACHE = 'teremto-hold-v2';
const ASSETS = ['manifest.json', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {}));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Oldal (index.html): hálózat először, tartalék másolat offline használatra
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put('offline-index', copy));
        return res;
      }).catch(() => caches.match('offline-index'))
    );
    return;
  }

  // Betűtípusok és ikonok: gyorsítótár először
  if (url.origin.includes('fonts.g') || ASSETS.some(a => url.pathname.endsWith(a))) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }))
    );
  }
});
