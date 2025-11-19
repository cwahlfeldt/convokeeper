/**
 * ConvoKeep Service Worker
 * 
 * Provides offline functionality and faster loading for the ConvoKeep application
 */

const CACHE_NAME = 'convokeep-cache-v7';
// All dependencies are now self-hosted for true offline-first functionality
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './css/main.css',
  './css/base.css',
  './css/variables.css',
  './css/utilities.css',
  './css/components.css',
  './css/layout.css',
  './css/messages.css',
  './css/responsive.css',
  './css/mobile-menu.css',
  './css/fuzzy-search.css',
  './js/app.js',
  './js/theme.js',
  './js/index.js',
  './js/menu.js',
  './js/hljs-theme.js',
  './js/sw-register.js',
  './assets/icons/favicon.ico',
  // Self-hosted libraries for offline functionality
  './lib/jszip/jszip.min.js',
  './lib/markdown-it/markdown-it.min.js',
  './lib/highlight.js/highlight.min.js',
  './lib/catppuccin/catppuccin-latte.css',
  './lib/catppuccin/catppuccin-mocha.css'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Cache what we can, but don't fail if some assets can't be cached
        console.log('Caching app assets');
        // Use individual cache.add() calls to prevent one failure from stopping all caching
        const cachePromises = ASSETS_TO_CACHE.map(url => {
          return cache.add(url).catch(err => {
            console.error('Error caching ' + url, err);
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
            return cacheName !== CACHE_NAME;
          }).map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Since all dependencies are self-hosted, only handle same-origin requests
  const url = new URL(event.request.url);

  // Skip non-same-origin requests (shouldn't be any, but defensive programming)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network-first strategy for HTML and app shell resources to ensure freshest content
  if (event.request.mode === 'navigate' || event.request.url.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Cache-first strategy for other assets
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses or non-basic responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response to cache it
            const responseToCache = response.clone();

            // Store in cache asynchronously
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch(err => {
                console.warn('Failed to cache response for: ' + event.request.url, err);
              });

            return response;
          })
          .catch((error) => {
            console.error('Fetch failed:', error);
            // For images or other non-critical resources, return a fallback
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
              return new Response('');
            }
            
            throw error;
          });
      })
  );
});
