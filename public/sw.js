/**
 * EXHALE — Production Progressive Web App Service Worker
 * 
 * Strategy:
 * 1. Audio Streaming Pass-Through:
 *    Audio requests ('/audio/Meanwhile.mp3') pass directly to the browser's native
 *    network stack to ensure native RFC 7233 HTTP byte-range streaming, hardware-accelerated
 *    decoding, and zero service worker interception issues across all browsers and devices.
 * 
 * 2. Navigation / App Shell:
 *    Network-First with offline cache fallback. Guarantees fresh updates when online
 *    and instant loading of the core app shell when disconnected.
 * 
 * 3. Hashed Bundles (JS/CSS/Assets):
 *    Cache-First with network fallback. Automatically precaches bundles found in
 *    index.html during installation for instant offline availability.
 * 
 * 4. Privacy & Security:
 *    Strictly zero persistence of user thoughts or sensitive data.
 */

const CACHE_NAME = 'exhale-pwa-v1.3.0';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192.svg',
  '/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Precache critical static shell files
      try {
        await cache.addAll(PRECACHE_ASSETS);
      } catch (err) {
        console.warn('[SW] Precache notice:', err);
      }

      // Automatically discover and precache hashed JS & CSS from index.html
      try {
        const indexResponse = await fetch('/index.html');
        if (indexResponse && indexResponse.status === 200) {
          const html = await indexResponse.clone().text();
          const assetMatches = html.matchAll(/(?:href|src)="(\/assets\/[^"]+)"/g);
          const dynamicAssets = Array.from(assetMatches, (m) => m[1]);
          if (dynamicAssets.length > 0) {
            await cache.addAll(dynamicAssets);
          }
        }
      } catch {
        // Safe to continue; runtime cache will capture bundles on first fetch
      }

      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept GET requests over http/https
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // 1. Audio stream requests: Pass directly to native network stack
  // Bypasses Service Worker to avoid media demuxer stalls and preserve native Range streaming
  if (request.destination === 'audio' || request.url.includes('/audio/')) {
    return;
  }

  // 2. Navigation requests (HTML page loads): Network-First
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const netRes = await fetch(request);
          if (netRes && netRes.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, netRes.clone());
          }
          return netRes;
        } catch {
          const cachedIndex = await caches.match('/index.html');
          if (cachedIndex) return cachedIndex;
          const cachedRoot = await caches.match('/');
          if (cachedRoot) return cachedRoot;
          return new Response('Offline - EXHALE', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }
      })()
    );
    return;
  }

  // 3. Google Fonts (Cache-First)
  if (request.url.includes('fonts.googleapis.com') || request.url.includes('fonts.gstatic.com')) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const netRes = await fetch(request);
          if (netRes && (netRes.status === 200 || netRes.type === 'opaque')) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, netRes.clone());
          }
          return netRes;
        } catch {
          return new Response('', { status: 200, headers: { 'Content-Type': 'text/css' } });
        }
      })()
    );
    return;
  }

  // 4. Static assets (/assets/, images, icons): Cache-First
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;

      try {
        const netRes = await fetch(request);
        if (netRes && netRes.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, netRes.clone());
        }
        return netRes;
      } catch {
        return new Response('Asset unavailable offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    })()
  );
});
