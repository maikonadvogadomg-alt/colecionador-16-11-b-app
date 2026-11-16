/* Colecionador — funciona sem internet depois da primeira vez */
const CACHE = 'colecionador-v1611b';
const ARQS = ['./', './index.html', './css/app.css', './js/app.js', './js/pacote-claude.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((resp) => {
    if (resp.ok && (e.request.url.startsWith(self.location.origin) || /cdnjs|jsdelivr/.test(e.request.url))) { const cp = resp.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); }
    return resp;
  })));
});
