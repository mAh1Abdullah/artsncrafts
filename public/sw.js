// WAW-POS Offline-First Service Worker & Background Sync Engine
const CACHE_NAME = 'waw-pos-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/?source=pwa',
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

// 3. Fetch event: Stale-while-revalidate for assets, Network-first for APIs/pages
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-HTTP/HTTPS and Chrome extension requests
  if (!url.protocol.startsWith('http')) return;

  // For API sync or mutations (POST/PUT/DELETE/PATCH), try network directly
  if (request.method !== 'GET') {
    return;
  }

  // Handle Next.js static chunks, images, and fonts: Cache-first / Stale-While-Revalidate
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch update in background (Stale-While-Revalidate)
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse.clone());
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
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
