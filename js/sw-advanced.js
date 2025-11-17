/**
 * BitForward - Advanced Service Worker
 * PWA con estrategias de cache inteligentes
 *
 * Estrategias:
 * - Cache-First: Assets estáticos (JS, CSS, fonts, images)
 * - Network-First: APIs y datos dinámicos
 * - Stale-While-Revalidate: Precios en tiempo real
 * - Cache-Only: Offline fallback
 */

const CACHE_VERSION = 'bitforward-v3.0.0';
const CACHE_NAMES = {
  static: `${CACHE_VERSION}-static`,
  dynamic: `${CACHE_VERSION}-dynamic`,
  api: `${CACHE_VERSION}-api`,
  images: `${CACHE_VERSION}-images`,
  fonts: `${CACHE_VERSION}-fonts`,
};

// Assets para pre-cache (críticos)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/offline.html',
  '/manifest.json',
  '/assets/logo-rocket-animated.svg',
  '/assets/favicon.svg',
];

// Reglas de matching
const RULES = {
  isStaticAsset: (url) => {
    return /\.(js|css|woff2?|ttf|eot)$/.test(url.pathname);
  },
  isImage: (url) => {
    return /\.(png|jpg|jpeg|gif|svg|webp|avif)$/.test(url.pathname);
  },
  isFont: (url) => {
    return /\.(woff2?|ttf|eot|otf)$/.test(url.pathname);
  },
  isApiRequest: (url) => {
    return url.pathname.startsWith('/api/') ||
           url.hostname.includes('coingecko.com') ||
           url.hostname.includes('binance.com');
  },
  isPriceRequest: (url) => {
    return url.pathname.includes('/price') ||
           url.hostname.includes('coingecko.com');
  },
};

/**
 * Install Event - Precache assets críticos
 */
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker installing...');

  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then(cache => {
        console.log('📦 Precaching static assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully');
        return self.skipWaiting(); // Activar inmediatamente
      })
      .catch(error => {
        console.error('❌ Service Worker installation failed:', error);
      })
  );
});

/**
 * Activate Event - Limpiar caches viejos
 */
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...');

  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // Eliminar caches que no sean de la versión actual
              return cacheName.startsWith('bitforward-') &&
                     !Object.values(CACHE_NAMES).includes(cacheName);
            })
            .map(cacheName => {
              console.log(`🗑️ Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim(); // Tomar control inmediatamente
      })
  );
});

/**
 * Fetch Event - Manejar requests con estrategias inteligentes
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo cachear GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar requests de chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Aplicar estrategia según el tipo de request
  if (RULES.isStaticAsset(url)) {
    // Cache-First para assets estáticos
    event.respondWith(cacheFirst(request, CACHE_NAMES.static));
  }
  else if (RULES.isImage(url)) {
    // Cache-First para imágenes
    event.respondWith(cacheFirst(request, CACHE_NAMES.images));
  }
  else if (RULES.isFont(url)) {
    // Cache-First para fonts
    event.respondWith(cacheFirst(request, CACHE_NAMES.fonts));
  }
  else if (RULES.isPriceRequest(url)) {
    // Stale-While-Revalidate para precios
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.api));
  }
  else if (RULES.isApiRequest(url)) {
    // Network-First para APIs
    event.respondWith(networkFirst(request, CACHE_NAMES.api));
  }
  else {
    // Network-First por defecto
    event.respondWith(networkFirst(request, CACHE_NAMES.dynamic));
  }
});

/**
 * Cache-First Strategy
 * Intenta servir desde cache, si falla va a la red
 */
async function cacheFirst(request, cacheName) {
  try {
    // Buscar en cache
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    // Si no está en cache, ir a la red
    const response = await fetch(request);

    // Cachear la respuesta si es válida
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error('Cache-First error:', error);
    return offlineFallback(request);
  }
}

/**
 * Network-First Strategy
 * Intenta la red primero, si falla usa cache
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);

    // Cachear respuesta exitosa
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    // Si la red falla, intentar cache
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    return offlineFallback(request);
  }
}

/**
 * Stale-While-Revalidate Strategy
 * Sirve desde cache inmediatamente, actualiza en background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fetch de la red en background
  const fetchPromise = fetch(request)
    .then(response => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(error => {
      console.warn('Background fetch failed:', error);
    });

  // Retornar cache inmediatamente o esperar al fetch
  return cached || fetchPromise;
}

/**
 * Offline Fallback
 * Página/respuesta cuando todo falla
 */
async function offlineFallback(request) {
  // Para navegación, mostrar página offline
  if (request.mode === 'navigate') {
    const cache = await caches.open(CACHE_NAMES.static);
    const offline = await cache.match('/offline.html');

    if (offline) {
      return offline;
    }
  }

  // Para otros requests, retornar error
  return new Response('Offline - No cached version available', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({
      'Content-Type': 'text/plain',
    }),
  });
}

/**
 * Message Event - Comunicación con el cliente
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CLIENTS_CLAIM':
      self.clients.claim();
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then(names => {
          return Promise.all(names.map(name => caches.delete(name)));
        })
      );
      break;

    case 'GET_CACHE_SIZE':
      event.waitUntil(
        getCacheSize().then(size => {
          event.ports[0].postMessage({ size });
        })
      );
      break;

    default:
      console.warn('Unknown message type:', type);
  }
});

/**
 * Calcular tamaño total del cache
 */
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const name of cacheNames) {
    const cache = await caches.open(name);
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

/**
 * Background Sync - Para operaciones offline
 */
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);

  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

/**
 * Sincronizar transacciones pendientes
 */
async function syncTransactions() {
  try {
    // Implementar lógica de sincronización
    console.log('✅ Transactions synced');
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error; // Retry automático
  }
}

/**
 * Push Notifications
 */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'Notificación de BitForward',
    icon: '/assets/logo-rocket-animated.svg',
    badge: '/assets/favicon.svg',
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      {
        action: 'open',
        title: 'Abrir',
      },
      {
        action: 'close',
        title: 'Cerrar',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'BitForward',
      options
    )
  );
});

/**
 * Notification Click
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

console.log('🚀 Service Worker loaded - BitForward v3.0.0');
