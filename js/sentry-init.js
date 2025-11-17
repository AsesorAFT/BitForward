// js/sentry-init.js

import * as Sentry from '@sentry/browser';

/**
 * Inicializa Sentry para el monitoreo de errores del frontend.
 *
 * Esta función debe ser llamada lo antes posible en el ciclo de vida de la aplicación.
 * Utiliza una variable de entorno para el DSN, que debe ser inyectada durante el build.
 */
export function initializeSentry() {
  // Obtener el DSN de una variable de entorno inyectada por Vite
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

  if (!sentryDsn) {
    console.warn('Sentry DSN no encontrado. El monitoreo de errores del frontend está deshabilitado.');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      // Habilita la captura de errores no manejados y promesas rechazadas
      Sentry.browserTracingIntegration(),
      // Habilita la repetición de sesiones para ver cómo los usuarios interactúan con la app
      Sentry.replayIntegration({
        // Opcional: enmascara todos los campos de texto y entrada para privacidad
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Tasa de muestreo para el monitoreo de rendimiento (performance monitoring)
    // Captura el 20% de las transacciones para monitorear el rendimiento.
    // Ajusta este valor en producción según tus necesidades.
    tracesSampleRate: 0.2,

    // Tasa de muestreo para la repetición de sesiones (session replay)
    // Captura el 10% de las sesiones para repetición.
    // Esto es útil para depurar problemas sin capturar cada sesión.
    replaysSessionSampleRate: 0.1,

    // Si una sesión tiene un error, siempre captura la repetición.
    replaysOnErrorSampleRate: 1.0,

    // Entorno de la aplicación (development, staging, production)
    environment: import.meta.env.MODE || 'development',

    // Versión de la aplicación
    release: `bitforward-frontend@${import.meta.env.VITE_APP_VERSION}`,
  });

  console.log('📈 Sentry for frontend monitoring initialized.');
}
