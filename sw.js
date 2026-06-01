const CACHE_NAME = 'somniascheds-v1';
const assets = [
  'index.html',
  'the_wilds(1).png',
  'fire.mp3',
  'thumbnail1.jpg',
  'manifest.json'
];

// Cache on install
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(assets))
  );
});

// Serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
