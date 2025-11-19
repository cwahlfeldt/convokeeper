/**
 * ConvoKeep Service Worker
 *
 * Provides offline functionality and faster loading for the ConvoKeep application
 * Optimized for Vite build output with hash-based cache busting
 */

const CACHE_NAME = 'convokeep-v2-cache-v1';
const RUNTIME_CACHE = 'convokeep-v2-runtime';

// Core assets to cache on install
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/convokeeplogo.png',
  '/og-image.jpg'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching core app assets');
        // Use individual cache.add() calls to prevent one failure from stopping all caching
        const cachePromises = CORE_ASSETS.map(url => {
          return cache.add(url).catch(err => {
            console.error('[Service Worker] Error caching ' + url, err);
            // Continue despite error
            return Promise.resolve();
          });
        });

        return Promise.all(cachePromises);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          }).map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - network first for HTML, cache first for assets
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network-first strategy for HTML to ensure freshest content
  if (event.request.mode === 'navigate' || event.request.url.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache the response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache-first strategy for static assets (JS, CSS, images, fonts)
  if (event.request.url.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // Fetch from network and cache
          return fetch(event.request)
            .then((response) => {
              // Don't cache non-successful responses
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              const responseToCache = response.clone();

              caches.open(RUNTIME_CACHE)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                })
                .catch(err => {
                  console.warn('[Service Worker] Failed to cache response for: ' + event.request.url, err);
                });

              return response;
            })
            .catch((error) => {
              console.error('[Service Worker] Fetch failed:', error);
              // For images, return empty response
              if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
                return new Response('', { status: 404 });
              }
              throw error;
            });
        })
    );
    return;
  }

  // For everything else, try network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
