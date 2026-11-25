// WAW-POS Offline-First Service Worker & Background Sync Engine
const CACHE_NAME = 'waw-pos-cache-v5';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon.svg',
  '/favicon.ico',
];

// 1. Install event: Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Non-blocking asset cache warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate event: Clean up legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch event: Network-first with safe content-type checks for chunks/assets and pages
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-HTTP/HTTPS and cross-origin requests
  if (!url.protocol.startsWith('http') || url.origin !== self.location.origin) return;

  // For API sync or mutations (POST/PUT/DELETE/PATCH), try network directly
  if (request.method !== 'GET') {
    return;
  }

  // Never intercept Astro storefront routes, Next.js RSC payloads, HMR streams, or AI Studio bridge assets
  if (
    url.pathname === '/' ||
    url.pathname === '/raw-materials' ||
    url.pathname === '/account' ||
    url.pathname === '/sell' ||
    url.pathname.startsWith('/products/') ||
    url.pathname.startsWith('/shops/') ||
    url.pathname === '/storefront' ||
    url.pathname.startsWith('/storefront/') ||
    url.pathname.startsWith('/_astro/') ||
    url.pathname.startsWith('/@vite/') ||
    url.pathname.startsWith('/@id/') ||
    url.pathname.startsWith('/@fs/') ||
    url.pathname === '/@react-refresh' ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    request.headers.get('RSC') === '1' ||
    request.headers.get('Next-Router-Prefetch') === '1' ||
    url.searchParams.has('_rsc') ||
    url.pathname.startsWith('/_next/hmr') ||
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.pathname.startsWith('/__nextjs') ||
    url.pathname.startsWith('/_aistudio-')
  ) {
    return;
  }

  // Handle Next.js static chunks, JS, CSS, images, and fonts: Network-first with Content-Type guard
  const isCodeAsset =
    url.pathname.startsWith('/_next/static') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css');
  const isMediaAsset =
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2');

  if (isCodeAsset || isMediaAsset) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const contentType = (networkResponse.headers.get('content-type') || '').toLowerCase();
          // Never cache HTML error pages under JS/CSS/static asset URLs
          if (networkResponse.ok && !(isCodeAsset && contentType.includes('text/html'))) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            const contentType = (cachedResponse.headers.get('content-type') || '').toLowerCase();
            if (!(isCodeAsset && contentType.includes('text/html'))) {
              return cachedResponse;
            }
          }
          return new Response('', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  // Handle Page navigation and API GETs: Network-first with Cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // If navigation request fails completely and not in cache, fallback to root
        if (request.mode === 'navigate') {
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;
        }
        return new Response(
          JSON.stringify({
            offline: true,
            message: 'You are currently offline. WAW-POS local register mode is active.',
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 503,
          }
        );
      })
  );
});

// 4. Background Sync API Event Handler
self.addEventListener('sync', (event) => {
  if (
    event.tag === 'waw-pos-sync' ||
    event.tag === 'waw-pos-sync-queue' ||
    event.tag === 'sync-sales-queue'
  ) {
    event.waitUntil(
      broadcastToClients({ type: 'BACKGROUND_SYNC_TRIGGERED', tag: event.tag })
    );
  }
});

// 5. Periodic Background Sync Event Handler
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'waw-pos-periodic-sync') {
    event.waitUntil(
      broadcastToClients({ type: 'PERIODIC_SYNC_TRIGGERED', tag: event.tag })
    );
  }
});

// 6. Client message listener
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CHECK_OFFLINE_READY') {
    event.ports[0].postMessage({ ready: true, cacheVersion: CACHE_NAME });
  }
});

// Helper: Broadcast messages to all active browser windows/tabs
async function broadcastToClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const client of clients) {
    client.postMessage(message);
  }
}
