// SOMNIASCHEDS Service Worker
// Bump this version whenever HTML/CSS/JS/assets change.
const CACHE_VERSION = 'somniascheds-v3-library-librarian';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// Keep this list focused on files that must be available offline.
// Make sure these filenames exactly match GitHub, including capitalization.
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './library.png',
  './librarian1.png',
  './windchimes.mp3',
  './rain.mp3',
  './fire.mp3',
  './thunder.mp3',
  './winterwind.mp3',
  './owls.mp3',
  './raven.mp3',
  './frogs.mp3',
  './crickets.mp3',
  './clock.mp3',
  './cat.mp3',
  './musicbox1.mp3',
  './musicbox2.mp3',
  './musicbox3.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS.map((asset) => new Request(asset, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.warn('[SomniaScheds SW] Precache skipped/partial:', error);
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('somniascheds-') && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Do not cache third-party API calls. Weather/API responses should stay fresh.
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  // HTML/app shell: network-first so GitHub changes show up quickly.
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Images, audio, CSS, JS: stale-while-revalidate.
  if (
    ['image', 'audio', 'style', 'script', 'font'].includes(request.destination) ||
    /\.(png|jpg|jpeg|webp|gif|svg|mp3|wav|ogg|css|js|woff2?)$/i.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  try {
    const fresh = await fetch(request, { cache: 'reload' });
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, fresh.clone());
    return fresh;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.mode === 'navigate') {
      const shell = await caches.match('./index.html');
      if (shell) return shell;
    }

    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((fresh) => {
      cache.put(request, fresh.clone());
      return fresh;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}
