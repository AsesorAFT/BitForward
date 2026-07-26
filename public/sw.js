/**
 * Retiro del service worker público anterior.
 * La réplica de Mission Control no debe ocultar su URL ni aparentar una app operativa.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then(names =>
          Promise.all(
            names
              .filter(name => name.startsWith('bitforward-public-'))
              .map(name => caches.delete(name))
          )
        ),
      self.registration.unregister(),
    ])
  );
});
