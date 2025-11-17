/**
 * BitForward Rocket Animation
 * Maneja animaciones específicas de cohetes para la página principal
 */

(function() {
  // Configuración de la animación
  const CONFIG = {
    rocketSize: {
      small: 30,
      medium: 50,
      large: 80
    },
    paths: [
      { start: { x: -5, y: 70 }, end: { x: 105, y: 20 }, duration: 7 },
      { start: { x: -5, y: 30 }, end: { x: 105, y: 60 }, duration: 8 },
      { start: { x: -5, y: 50 }, end: { x: 105, y: 10 }, duration: 6 }
    ],
    initialDelay: 2000,
    rocketFrequency: {
      min: 5000,  // Tiempo mínimo entre cohetes
      max: 15000  // Tiempo máximo entre cohetes
    }
  };

  // Elementos DOM a animar
  let heroSection;
  let launchButton;

  // Inicializar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 BitForward Rocket Animation Initializing...');

    // Buscar sección hero
    heroSection = document.querySelector('.hero, header, .header-section, .banner');

    // Buscar botón de lanzamiento/inicio
    launchButton = document.querySelector('.launch-button, .cta-button, .primary-button, button.primary');

    // Inicializar animaciones
    initRocketAnimations();

    console.log('🚀 BitForward Rocket Animation Ready');
  });

  /**
   * Inicializa todas las animaciones de cohetes
   */
  function initRocketAnimations() {
    // Si tenemos la sección hero, añadimos efecto de cohetes
    if (heroSection) {
      // Añadir clase para estilos
      heroSection.classList.add('rocket-hero');

      // Configurar cohetes aleatorios volando por la sección hero
      setTimeout(() => {
        launchRandomRocket();
      }, CONFIG.initialDelay);
    }

    // Si tenemos el botón de lanzamiento, añadimos efectos
    if (launchButton) {
      setupLaunchButton(launchButton);
    }

    // Añadir efecto de despegue al hacer scroll
    setupScrollLaunchEffect();
  }

  /**
   * Lanza un cohete con ruta aleatoria
   */
  function launchRandomRocket() {
    // Seleccionar tamaño aleatorio
    const sizes = Object.values(CONFIG.rocketSize);
    const size = sizes[Math.floor(Math.random() * sizes.length)];

    // Seleccionar ruta aleatoria
    const path = CONFIG.paths[Math.floor(Math.random() * CONFIG.paths.length)];

    // Configurar cohete
    const rocketConfig = {
      size: size,
      duration: path.duration,
      startPosition: path.start,
      endPosition: path.end,
      delay: 0
    };

    // Lanzar cohete usando la función global
    if (window.BitForwardSpace && window.BitForwardSpace.addFlyingRocket) {
      window.BitForwardSpace.addFlyingRocket(rocketConfig);
    }

    // Programar el siguiente cohete
    const nextRocketDelay = Math.random() *
      (CONFIG.rocketFrequency.max - CONFIG.rocketFrequency.min) +
      CONFIG.rocketFrequency.min;

    setTimeout(launchRandomRocket, nextRocketDelay);
  }

  /**
   * Configura el botón de lanzamiento con efectos especiales
   * @param {HTMLElement} button - El botón a configurar
   */
  function setupLaunchButton(button) {
    // Añadir clases
    button.classList.add('rocket-launch-button');

    // Añadir ícono de cohete si no tiene uno
    if (!button.querySelector('i[class*="rocket"]')) {
      const rocketIcon = document.createElement('i');
      rocketIcon.className = 'rocket-icon';
      button.prepend(rocketIcon);
    }

    // Añadir efecto de lanzamiento al hacer clic
    button.addEventListener('click', function(e) {
      // No lanzar si se hace clic en un enlace interno (prevenir comportamiento por defecto)
      if (this.tagName === 'A' && this.getAttribute('href').startsWith('#')) {
        e.preventDefault();
      }

      // Añadir clase de animación
      this.classList.add('launching');

      // Lanzar 3 cohetes en secuencia
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const config = {
            size: 40,
            duration: 4,
            startPosition: { x: 50, y: 100 },
            endPosition: { x: 20 + i * 30, y: -10 },
            delay: 0
          };

          if (window.BitForwardSpace && window.BitForwardSpace.addFlyingRocket) {
            window.BitForwardSpace.addFlyingRocket(config);
          }
        }, i * 200);
      }

      // Restablecer clase después de la animación
      setTimeout(() => {
        this.classList.remove('launching');
      }, 1000);

      // Si era un enlace interno, hacer scroll suave después de un pequeño retraso
      if (this.tagName === 'A' && this.getAttribute('href').startsWith('#')) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth' });
          }, 500);
        }
      }
    });
  }

  /**
   * Configura efecto de lanzamiento al hacer scroll
   */
  function setupScrollLaunchEffect() {
    let lastScrollTop = 0;
    let scrollingUp = false;
    const scrollThreshold = 300; // Umbral de scroll rápido
    let lastScrollTime = Date.now();
    let scrollSpeed = 0;

    window.addEventListener('scroll', () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const now = Date.now();
      const timeDiff = now - lastScrollTime;

      // Calcular velocidad de scroll
      if (timeDiff > 0) {
        scrollSpeed = Math.abs(scrollTop - lastScrollTop) / timeDiff * 1000;
      }

      // Determinar dirección de scroll
      const currentScrollingUp = scrollTop < lastScrollTop;

      // Lanzar cohete en cambio de dirección con scroll rápido
      if (currentScrollingUp !== scrollingUp && scrollSpeed > scrollThreshold) {
        const config = {
          size: 30 + scrollSpeed / 20,
          duration: 3,
          startPosition: {
            x: Math.random() * 30 + 35,
            y: 110
          },
          endPosition: {
            x: Math.random() * 30 + 35,
            y: -10
          },
          delay: 0
        };

        if (window.BitForwardSpace && window.BitForwardSpace.addFlyingRocket) {
          window.BitForwardSpace.addFlyingRocket(config);
        }
      }

      // Actualizar valores
      scrollingUp = currentScrollingUp;
      lastScrollTop = scrollTop;
      lastScrollTime = now;
    });
  }

})();
