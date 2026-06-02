const CACHE_NAME = 'somniascheds-v1';

// Add the names of your HTML file and any default assets here.
// Make sure your main HTML file is named index.html, or update the list below.
const ASSETS_TO_CACHE = [
    './',
    './index.html', 
    './manifest.json',
    './SomniaScheds.png',
    
    // Default audio library assets referenced in your HTML
    './rain.mp3', 
    './thunder.mp3', 
    './winterwind.mp3', 
    './owls.mp3',
    './raven.mp3', 
    './frogs.mp3', 
    './crickets.mp3', 
    './fire.mp3',
    './simmeringpot.mp3', 
    './teacup.mp3', 
    './clock.mp3', 
    './cat.mp3',
    './windchimes.mp3', 
    './musicbox1.mp3'
];

// 1. INSTALL STAGE: Cache the essential files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching core assets');
                // We use Promise.allSettled so if an mp3 is missing, the service worker still installs
                return Promise.allSettled(
                    ASSETS_TO_CACHE.map(asset => cache.add(asset))
                );
            })
            .then(() => self.skipWaiting())
    );
});

// 2. FETCH STAGE: Serve from cache first, then network fallback
self.addEventListener('fetch', (event) => {
    // Only intercept GET requests
    if (event.request.method !== 'GET') return;

    // Skip caching external API calls (like the Gemini API)
    if (event.request.url.includes('googleapis.com')) return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse; // Return the offline cached version
                }

                // If not in cache, fetch from the network
                return fetch(event.request).then((networkResponse) => {
                    // Cache the new network response for future offline use
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
            .catch(() => {
                // If both cache and network fail, just fail gracefully
                return new Response('Offline and resource not found in cache.', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            })
    );
});

// 3. ACTIVATE STAGE: Clean up old caches if the version changes
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});
