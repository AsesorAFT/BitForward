/**
 * BitForward Service Worker
 * PWA con caching estratégico para performance óptima
 *
 * @version 1.0.0
 * @date 2025-10-19
 */

const CACHE_NAME = 'bitforward-v1.0.0';
const RUNTIME_CACHE = 'bitforward-runtime';

// Recursos críticos para precache (cargan instantáneamente)
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/css/style.css',
  '/css/main.css',
  '/css/dashboard.css',
  '/js/wallet-manager-real.js',
  '/js/price-feeds.js',
  '/assets/logo-astronaut-rocket.svg',
  '/assets/favicon.svg'
];

// APIs externas (cache con network fallback)
const API_URLS = [
  'https://api.coingecko.com',
  'wss://stream.binance.com'
];

// CDNs (cache first, luego network)
const CDN_URLS = [
  'https://cdn.jsdelivr.net',
  'https://cdn.tailwindcss.com'
];

/**
 * Install Event - Precache recursos críticos
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching critical resources');
        return cache.addAll(CRITICAL_RESOURCES);
      })
      .then(() => {
        console.log('[SW] Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error during install:', error);
      })
  );
});

/**
 * Activate Event - Limpiar caches antiguos
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch Event - Estrategias de caching inteligentes
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests de extensiones del browser
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
    return;
  }

  // Ignorar WebSocket requests
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Estrategia según tipo de recurso
  if (isCDNRequest(url)) {
    // CDN: Cache First, luego Network
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(url)) {
    // API: Network First, luego Cache (stale-while-revalidate)
    event.respondWith(networkFirst(request));
  } else if (isStaticAsset(request)) {
    // Assets estáticos: Cache First
    event.respondWith(cacheFirst(request));
  } else {
    // Otros: Network First con cache fallback
    event.respondWith(networkFirst(request));
  }
});

/**
 * Estrategia: Cache First
 * Intenta cache primero, luego network si no está
 */
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[SW] Cache hit:', request.url);
      return cachedResponse;
    }

    console.log('[SW] Cache miss, fetching:', request.url);
    const networkResponse = await fetch(request);

    // Cachear la respuesta si es exitosa
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;

  } catch (error) {
    console.error('[SW] Fetch failed:', error);

    // Intentar cache como fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Retornar página offline si existe
    return caches.match('/offline.html');
  }
}

/**
 * Estrategia: Network First
 * Intenta network primero, cache como fallback
 */
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // Cachear respuestas exitosas
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;

  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);

    // Fallback a cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Si es una página HTML, retornar offline page
    if (request.headers.get('accept').includes('text/html')) {
      return caches.match('/offline.html');
    }

    throw error;
  }
}

/**
 * Verificar si es request a CDN
 */
function isCDNRequest(url) {
  return CDN_URLS.some(cdn => url.href.startsWith(cdn));
}

/**
 * Verificar si es request a API
 */
function isAPIRequest(url) {
  return API_URLS.some(api => url.href.startsWith(api)) ||
           url.pathname.startsWith('/api/');
}

/**
 * Verificar si es asset estático
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(css|js|jpg|jpeg|png|gif|svg|webp|woff|woff2|ttf|eot)$/);
}

/**
 * Message Event - Comandos desde el cliente
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }

  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then((size) => {
      event.ports[0].postMessage({ size });
    });
  }
});

/**
 * Obtener tamaño total del cache
 */
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}

console.log('[SW] Service Worker loaded');
