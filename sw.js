const CACHE_NAME = 'nxt-tunes-v8';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './playlist.json', './beach.json', './songs-db.json', './icon-glass.svg', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  if (url.hostname === 'api.deezer.com') return;

  if (url.pathname.endsWith('.mp3') || event.request.destination === 'audio') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          const clone = res.clone();
          caches.open('nxt-audio-v8').then((c) => c.put(event.request, clone));
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        return res;
      }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
