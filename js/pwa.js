/**
 * La demo pública funciona en el navegador y conserva visible su URL.
 * Limpia registros PWA heredados para evitar que una instalación anterior
 * aparente ser una aplicación operativa.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const appScopePath = new URL('./', window.location.href).pathname;
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations
          .filter(registration => {
            const registrationPath = new URL(registration.scope).pathname;
            return registrationPath.startsWith(appScopePath);
          })
          .map(registration => registration.unregister())
      );
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(
          names
            .filter(name => name.startsWith('bitforward-public-'))
            .map(name => caches.delete(name))
        );
      }
    } catch {
      // La limpieza es defensiva; la demo no depende de service workers.
    }
  });
}
