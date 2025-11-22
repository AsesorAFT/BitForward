/**
 * 🚀 Landing Page Fix - Asegura visibilidad del cohete animado
 * Soluciona problemas de visualización en el landing page
 */

(function () {
  'use strict';

  // Configuración de debug
  const DEBUG = true;
  const log = (...args) => DEBUG && console.log('[Landing Fix]', ...args);

  /**
   * Forzar visibilidad del landing page
   */
  function showLandingPage() {
    const landingPage = document.querySelector('.landing-page');

    if (landingPage) {
      landingPage.style.cssText = `
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
                position: relative;
                z-index: 1;
            `;
      log('✅ Landing page visible');
    } else {
      log('⚠️ Landing page no encontrado');
    }
  }

  /**
   * Forzar visibilidad del logo del cohete
   */
  function showRocketLogo() {
    const logo = document.querySelector('.animated-logo');

    if (logo) {
      logo.style.cssText = `
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
                width: 48px !important;
                height: 48px !important;
                filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.5));
                transition: all 0.3s ease;
            `;

      // Verificar que el SVG se cargó
      if (logo.complete) {
        log('✅ Logo del cohete visible y cargado');
      } else {
        logo.addEventListener('load', () => {
          log('✅ Logo del cohete cargado');
        });
        logo.addEventListener('error', e => {
          log('❌ Error cargando logo:', e);
          // Intentar con logo alternativo
          logo.src = 'assets/logo-astronaut-rocket.svg';
        });
      }

      // Agregar animación de entrada
      logo.style.animation = 'rocketEntrance 0.6s ease-out';
    } else {
      log('⚠️ Logo del cohete no encontrado');
    }
  }

  /**
   * Agregar estilos de animación si no existen
   */
  function addAnimationStyles() {
    const styleId = 'landing-fix-styles';

    // No agregar si ya existe
    if (document.getElementById(styleId)) {
      return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
            /* Animación de entrada del cohete */
            @keyframes rocketEntrance {
                0% {
                    opacity: 0;
                    transform: translateY(-20px) scale(0.8);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            /* Asegurar visibilidad del logo */
            .animated-logo {
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
            }

            /* Hover mejorado */
            .animated-logo:hover {
                filter: drop-shadow(0 0 20px rgba(6, 182, 212, 0.8)) !important;
                transform: scale(1.1) translateY(-2px) !important;
            }

            /* Header siempre visible */
            header {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 1000 !important;
                display: block !important;
            }

            /* Landing page siempre visible */
            .landing-page {
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
            }

            /* Ocultar dashboard inicialmente */
            .dashboard-container {
                display: none;
            }

            /* Mostrar dashboard solo cuando se conecta wallet */
            body.wallet-connected .landing-page {
                display: none;
            }

            body.wallet-connected .dashboard-container {
                display: block;
            }
        `;

    document.head.appendChild(style);
    log('✅ Estilos de animación agregados');
  }

  /**
   * Verificar y reparar estructura
   */
  function verifyStructure() {
    const checks = {
      header: !!document.querySelector('header'),
      logo: !!document.querySelector('.animated-logo'),
      landing: !!document.querySelector('.landing-page'),
      hero: !!document.querySelector('.hero-section'),
    };

    log('🔍 Verificación de estructura:', checks);

    // Si falta algo, mostrar advertencia
    Object.entries(checks).forEach(([key, exists]) => {
      if (!exists) {
        log(`⚠️ Falta elemento: ${key}`);
      }
    });

    return checks;
  }

  /**
   * Configurar observer para monitorear cambios
   */
  function setupMutationObserver() {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        // Si se oculta el landing, mostrarlo de nuevo
        if (mutation.target.classList && mutation.target.classList.contains('landing-page')) {
          const display = window.getComputedStyle(mutation.target).display;
          if (display === 'none' && !document.body.classList.contains('wallet-connected')) {
            log('⚠️ Landing page oculto detectado, restaurando...');
            showLandingPage();
          }
        }
      });
    });

    // Observar cambios en el body
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'style'],
      subtree: true,
      childList: true,
    });

    log('✅ Observer configurado');
  }

  /**
   * Test visual del logo
   */
  function testLogoVisibility() {
    const logo = document.querySelector('.animated-logo');
    if (!logo) {
      log('❌ Logo no encontrado');
      return false;
    }

    const styles = window.getComputedStyle(logo);
    const isVisible =
      styles.display !== 'none' &&
      styles.visibility !== 'hidden' &&
      parseFloat(styles.opacity) > 0 &&
      logo.offsetWidth > 0 &&
      logo.offsetHeight > 0;

    log('🧪 Test de visibilidad del logo:', {
      display: styles.display,
      visibility: styles.visibility,
      opacity: styles.opacity,
      width: logo.offsetWidth,
      height: logo.offsetHeight,
      visible: isVisible,
      src: logo.src,
    });

    return isVisible;
  }

  /**
   * Agregar helpers de debug al window
   */
  function addDebugHelpers() {
    window.landingDebug = {
      showLanding: showLandingPage,
      showLogo: showRocketLogo,
      testLogo: testLogoVisibility,
      verify: verifyStructure,
    };
    log('🔧 Debug helpers agregados a window.landingDebug');
  }

  /**
   * Inicialización principal
   */
  function init() {
    log('🚀 Inicializando Landing Page Fix...');

    // 1. Agregar estilos
    addAnimationStyles();

    // 2. Verificar estructura
    verifyStructure();

    // 3. Mostrar elementos
    showLandingPage();
    showRocketLogo();

    // 4. Test de visibilidad
    setTimeout(() => {
      testLogoVisibility();
    }, 500);

    // 5. Configurar observer
    setupMutationObserver();

    // 6. Agregar debug helpers
    addDebugHelpers();

    log('✅ Landing Page Fix inicializado correctamente');
  }

  // Ejecutar al cargar DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // También ejecutar inmediatamente por si el DOM ya está listo
  if (document.body) {
    init();
  }
})();
