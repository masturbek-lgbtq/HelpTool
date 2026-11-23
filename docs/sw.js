const APP_VERSION = '3.0.1';
const CORE_CACHE = `helptool-ios-core-${APP_VERSION}`;
const MEDIA_CACHE = 'helptool-ios-media-v2';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/crypto.js',
  './js/storage.js',
  './js/parser.js',
  './js/calendar.js',
  './js/themes.js',
  './js/app.js',
  './assets/icon-180.png',
  './assets/icon-192.png',
  './assets/gallery/art-02.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CORE_CACHE).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CORE_CACHE && k !== MEDIA_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports?.[0]?.postMessage({ version: APP_VERSION });
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Обои и иконки: Cache-First (грузим один раз по запросу, дальше мгновенно офлайн)
  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then(async (cache) => {
        const cached = await cache.match(req, { ignoreSearch: true });
        if (cached) return cached;
        try {
          const fresh = await fetch(req);
          if (fresh && fresh.ok) {
            cache.put(req, fresh.clone());
          }
          return fresh;
        } catch {
          return cached || new Response('', { status: 503 });
        }
      })
    );
    return;
  }

  // Код приложения и index.html: Network-First с мгновенным фоллбэком в кэш при офлайне
  event.respondWith(
    fetch(req)
      .then((fresh) => {
        if (fresh && fresh.ok) {
          const copy = fresh.clone();
          caches.open(CORE_CACHE).then((cache) => cache.put(req, copy));
        }
        return fresh;
      })
      .catch(async () => {
        const cached = await caches.match(req, { ignoreSearch: true });
        if (cached) return cached;
        if (req.mode === 'navigate') {
          return (await caches.match('./index.html')) || new Response('Offline', { status: 503 });
        }
        return new Response('', { status: 503 });
      })
  );
});
