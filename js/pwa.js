const supported = 'serviceWorker' in navigator && window.isSecureContext;

if (supported) {
  const scopeUrl = new URL('./', window.location.href);
  const workerUrl = new URL('sw.js', scopeUrl);

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(workerUrl, {
        scope: scopeUrl.pathname,
        updateViaCache: 'none',
      });
      await registration.update();
    } catch (error) {
      console.warn('BitForward seguirá disponible sin modo offline.', error);
    }
  });
}
