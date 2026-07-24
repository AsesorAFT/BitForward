/**
 * BitForward service worker.
 * Mantiene la navegación actualizada y ofrece una copia offline del núcleo público.
 */

const CACHE_NAME = 'bitforward-public-v6';
const CRITICAL_RESOURCES = ['./', './index.html'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CRITICAL_RESOURCES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(names =>
        Promise.all(
          names
            .filter(name => name.startsWith('bitforward-') && name !== CACHE_NAME)
            .map(name => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!['http:', 'https:'].includes(url.protocol)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (url.origin !== self.location.origin || isApiRequest(url)) {
    event.respondWith(networkFirst(request, false));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    void fetchAndCache(request);
    return cached;
  }
  return fetchAndCache(request);
}

async function networkFirst(request, useOfflineFallback = true) {
  try {
    return await fetchAndCache(request);
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (useOfflineFallback) {
      const offline = await caches.match('./index.html');
      if (offline) return offline;
    }
    throw error;
  }
}

async function fetchAndCache(request) {
  const response = await fetch(request);
  if (response.ok && response.type !== 'opaque') {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

function isApiRequest(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('coingecko.com') ||
    url.hostname.includes('binance.com')
  );
}

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
