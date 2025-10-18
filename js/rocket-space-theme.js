/**
 * BitForward Rocket Space Theme Integrator
 * Este archivo se encarga de aplicar el tema espacial a todas las páginas de BitForward
 */

(function() {
  // Variables de configuración
  const CONFIG = {
    enableStars: true,
    enableRocketEffects: true,
    enableMeteors: true,
    enableParallaxScroll: true,
    darkMode: true,
    animatedLogo: true
  };

  // Inicializar cuando el DOM está listo
  document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 BitForward Space Theme Initializing...');
    
    // Inicializar tema
    initSpaceTheme();
    
    // Inicializar efectos
    if (CONFIG.enableStars && window.BitForwardSpace) {
      window.BitForwardSpace.initSpaceBackground();
    }
    
    if (CONFIG.enableRocketEffects) {
      initRocketElements();
    }
    
    if (CONFIG.enableMeteors) {
      setupRandomMeteors();
    }
    
    // Inicializar logo animado
    if (CONFIG.animatedLogo) {
      replaceStaticLogoWithAnimated();
    }
    
    console.log('🚀 BitForward Space Theme Ready');
  });

  /**
   * Inicializa el tema espacial
   */
  function initSpaceTheme() {
    // Añadir clase al body
    document.body.classList.add('space-theme');
    
    // Añadir clases de tema espacial a elementos comunes
    applySpaceClassesToElements();
    
    // Configurar modo oscuro
    if (CONFIG.darkMode) {
      document.documentElement.classList.add('dark-mode');
    }
    
    // Escuchar scroll para efectos de paralaje
    if (CONFIG.enableParallaxScroll) {
      window.addEventListener('scroll', handleParallaxScroll);
    }
    
    // Añadir el cohete en la esquina inferior derecha
    addLaunchRocket();
  }

  /**
   * Aplica clases de tema espacial a elementos comunes en todas las páginas
   */
  function applySpaceClassesToElements() {
    // Convertir botones normales a botones espaciales
    document.querySelectorAll('.btn, .button, button:not(.space-button):not(.rocket-button)').forEach(button => {
      if (!button.classList.contains('no-theme') && !button.closest('.no-theme')) {
        button.classList.add('space-button');
      }
    });
    
    // Tarjetas
    document.querySelectorAll('.card, .box, .panel, .dashboard-card').forEach(card => {
      if (!card.classList.contains('no-theme') && !card.closest('.no-theme')) {
        card.classList.add('space-card');
      }
    });
    
    // Navegación
    const mainNav = document.querySelector('nav:not(.space-nav):not(.no-theme)');
    if (mainNav) {
      mainNav.classList.add('space-nav');
      
      // Enlaces de navegación
      mainNav.querySelectorAll('a:not(.space-nav-link):not(.no-theme)').forEach(link => {
        link.classList.add('space-nav-link');
      });
    }
    
    // Tablas
    document.querySelectorAll('table:not(.space-table):not(.no-theme)').forEach(table => {
      if (!table.closest('.no-theme')) {
        table.classList.add('space-table');
      }
    });
    
    // Inputs
    document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea, select').forEach(input => {
      if (!input.classList.contains('no-theme') && !input.closest('.no-theme')) {
        input.classList.add('space-input');
      }
    });
    
    // Dashboard específicos
    if (isPageType('dashboard')) {
      applyDashboardSpaceTheme();
    }
    
    // Autenticación específica
    if (isPageType('auth')) {
      applyAuthSpaceTheme();
    }
    
    // Lending específico
    if (isPageType('lending')) {
      applyLendingSpaceTheme();
    }
  }
  
  /**
   * Verifica qué tipo de página estamos viendo actualmente
   * @param {string} type - Tipo de página: 'dashboard', 'auth', 'lending', etc.
   * @returns {boolean} - Si la página actual es del tipo especificado
   */
  function isPageType(type) {
    const url = window.location.pathname;
    const filename = url.substring(url.lastIndexOf('/') + 1);
    
    switch (type) {
      case 'dashboard':
        return filename.includes('dashboard') || filename.includes('enterprise');
      case 'auth':
        return filename.includes('login') || filename.includes('register') || filename.includes('auth');
      case 'lending':
        return filename.includes('lending');
      default:
        return false;
    }
  }
  
  /**
   * Aplica tema espacial específico al dashboard
   */
  function applyDashboardSpaceTheme() {
    // Tarjetas de dashboard
    document.querySelectorAll('.dashboard-card, .chart-container, .stat-card').forEach(card => {
      card.classList.add('space-dashboard-card');
      
      // Encabezado de tarjeta
      const header = card.querySelector('.card-header, .dashboard-card-header, h3');
      if (header) {
        header.classList.add('space-dashboard-card-header');
      }
      
      // Cuerpo de tarjeta
      const body = card.querySelector('.card-body, .dashboard-card-body, .card-content');
      if (body) {
        body.classList.add('space-dashboard-card-body');
      }
    });
    
    // Gráficos
    document.querySelectorAll('.chart, canvas').forEach(chart => {
      chart.closest('div').classList.add('space-chart');
    });
    
    // Indicadores
    document.querySelectorAll('.indicator, .status, .trend').forEach(indicator => {
      indicator.classList.add('space-indicator');
      
      // Determinar el tipo de indicador
      if (indicator.classList.contains('up') || indicator.classList.contains('positive')) {
        indicator.classList.add('space-indicator-up');
      } else if (indicator.classList.contains('down') || indicator.classList.contains('negative')) {
        indicator.classList.add('space-indicator-down');
      } else {
        indicator.classList.add('space-indicator-neutral');
      }
    });
  }
  
  /**
   * Aplica tema espacial específico a páginas de autenticación
   */
  function applyAuthSpaceTheme() {
    // Contenedor de formulario de autenticación
    const authForm = document.querySelector('form');
    if (authForm) {
      const authContainer = authForm.closest('div');
      if (authContainer) {
        authContainer.classList.add('space-container');
        authContainer.style.maxWidth = '450px';
        authContainer.style.margin = '2rem auto';
        authContainer.style.padding = '2rem';
      }
    }
  }
  
  /**
   * Aplica tema espacial específico a páginas de préstamo
   */
  function applyLendingSpaceTheme() {
    // Tarjetas de préstamo
    document.querySelectorAll('.lending-card, .loan-card, .finance-card').forEach(card => {
      card.classList.add('space-dashboard-card');
    });
    
    // Tasas de interés
    document.querySelectorAll('.interest-rate, .apy').forEach(rate => {
      rate.classList.add('space-badge');
      rate.classList.add('space-badge-primary');
    });
  }
  
  /**
   * Inicializa elementos relacionados con cohetes
   */
  function initRocketElements() {
    // Buscar todos los íconos de cohete
    document.querySelectorAll('img[src*="rocket"], .rocket-icon, [data-icon="rocket"]').forEach(element => {
      element.classList.add('rocket-icon');
      
      // Agregar motor de cohete
      const engine = document.createElement('div');
      engine.className = 'rocket-engine';
      element.appendChild(engine);
      
      // Agregar hover
      element.addEventListener('mouseenter', function() {
        this.classList.add('rocket-hover');
      });
      
      element.addEventListener('mouseleave', function() {
        this.classList.remove('rocket-hover');
      });
    });
    
    // Convertir botones con cohetes
    document.querySelectorAll('button:has(i[class*="rocket"]), a.btn:has(i[class*="rocket"])').forEach(button => {
      button.classList.add('rocket-button');
    });
  }
  
  /**
   * Configura meteoros aleatorios que cruzan la pantalla
   */
  function setupRandomMeteors() {
    // Crear un meteoro cada 10-30 segundos
    setInterval(() => {
      createMeteor();
    }, Math.random() * 20000 + 10000);
    
    // Crear un meteoro inicial después de 5 segundos
    setTimeout(createMeteor, 5000);
  }
  
  /**
   * Crea un meteoro aleatorio que cruza la pantalla
   */
  function createMeteor() {
    const meteor = document.createElement('div');
    meteor.className = 'meteor';
    
    // Posición y rotación aleatoria
    const startX = Math.random() * 20;
    const startY = Math.random() * 20;
    const rotation = Math.random() * 45;
    
    meteor.style.top = `${startY}%`;
    meteor.style.left = `${startX}%`;
    meteor.style.transform = `rotate(${rotation}deg)`;
    
    document.body.appendChild(meteor);
    
    // Eliminar después de la animación
    meteor.addEventListener('animationend', () => {
      meteor.remove();
    });
  }
  
  /**
   * Maneja el efecto de paralaje al hacer scroll
   */
  function handleParallaxScroll() {
    if (window.BitForwardSpace && window.BitForwardSpace.createParallaxEffect) {
      window.BitForwardSpace.createParallaxEffect();
    }
  }
  
  /**
   * Reemplaza el logo estático por el logo animado
   */
  function replaceStaticLogoWithAnimated() {
    document.querySelectorAll('img[src*="logo"], .logo').forEach(logo => {
      // No reemplazar si ya es el logo animado
      if (logo.src && logo.src.includes('logo-rocket-animated')) {
        return;
      }
      
      // No reemplazar si tiene clase específica
      if (logo.classList.contains('no-replace')) {
        return;
      }
      
      // Crear nueva imagen
      const animatedLogo = document.createElement('img');
      animatedLogo.className = logo.className + ' logo-rocket';
      animatedLogo.alt = logo.alt || 'BitForward';
      animatedLogo.src = '/assets/logo-rocket-animated.svg';
      animatedLogo.style.width = logo.offsetWidth ? logo.offsetWidth + 'px' : 'auto';
      
      // Reemplazar logo
      logo.parentNode.replaceChild(animatedLogo, logo);
    });
  }
  
  /**
   * Añade el cohete en la esquina inferior derecha que despega al hacer clic
   */
  function addLaunchRocket() {
    // Crear contenedor del cohete
    const rocketContainer = document.createElement('div');
    rocketContainer.id = 'launch-rocket-container';
    rocketContainer.className = 'launch-rocket-container';
    rocketContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      z-index: 1000;
      cursor: pointer;
      transition: transform 0.3s ease;
    `;
    
    // Crear cohete
    const rocket = document.createElement('div');
    rocket.className = 'launch-rocket';
    rocket.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      transform-origin: center bottom;
      transition: transform 0.3s ease;
      filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.7));
    `;
    
    // Cuerpo del cohete
    rocket.innerHTML = `
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L8 7H16L12 2Z" fill="#3B82F6"/>
        <path d="M8 7V18C8 19.1046 8.89543 20 10 20H14C15.1046 20 16 19.1046 16 18V7H8Z" fill="#E2E8F0"/>
        <path d="M9 11H15V14H9V11Z" fill="#06B6D4"/>
        <path d="M8 18L6 22H10L8 18Z" fill="#EF4444"/>
        <path d="M16 18L18 22H14L16 18Z" fill="#EF4444"/>
      </svg>
      <div class="launch-flames" style="
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        width: 20px;
        height: 0;
        transition: height 0.3s ease;
        overflow: hidden;
      ">
        <div class="launch-flame" style="
          background: linear-gradient(to bottom, #EF4444, #F59E0B);
          width: 20px;
          height: 25px;
          border-radius: 50% 50% 20% 20%;
        "></div>
      </div>
    `;
    
    rocketContainer.appendChild(rocket);
    document.body.appendChild(rocketContainer);
    
    // Añadir tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'launch-rocket-tooltip';
    tooltip.textContent = '¡Haz clic para lanzar!';
    tooltip.style.cssText = `
      position: absolute;
      top: -40px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.8);
      color: white;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 12px;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    `;
    rocketContainer.appendChild(tooltip);
    
    // Mostrar tooltip al hover
    rocketContainer.addEventListener('mouseenter', () => {
      tooltip.style.opacity = '1';
      rocketContainer.style.transform = 'scale(1.1)';
      
      // Mostrar llamas
      const flames = rocketContainer.querySelector('.launch-flames');
      flames.style.height = '25px';
    });
    
    rocketContainer.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
      rocketContainer.style.transform = 'scale(1)';
      
      // Ocultar llamas
      const flames = rocketContainer.querySelector('.launch-flames');
      flames.style.height = '0';
    });
    
    // Animación de lanzamiento al hacer clic
    rocketContainer.addEventListener('click', () => {
      const rocket = rocketContainer.querySelector('.launch-rocket');
      
      // Añadir clase para animación de lanzamiento
      rocket.style.animation = 'rocketLaunch 1.5s ease-in forwards';
      
      // Crear partículas de humo/propulsión
      createRocketLaunchParticles(rocketContainer);
      
      // Desactivar eventos del contenedor
      rocketContainer.style.pointerEvents = 'none';
      
      // Restaurar el cohete después de la animación
      setTimeout(() => {
        // Eliminar el cohete actual
        rocketContainer.innerHTML = '';
        
        // Recrear el cohete
        const newRocket = document.createElement('div');
        newRocket.className = 'launch-rocket';
        newRocket.style.cssText = `
          position: relative;
          width: 100%;
          height: 100%;
          transform-origin: center bottom;
          transition: transform 0.3s ease;
          filter: drop-shadow(0 0 10px rgba(6, 182, 212, 0.7));
          opacity: 0;
          transform: translateY(50px);
        `;
        
        // Mismo contenido HTML que el cohete original
        newRocket.innerHTML = rocket.innerHTML;
        rocketContainer.appendChild(newRocket);
        
        // Restaurar tooltip
        rocketContainer.appendChild(tooltip);
        
        // Animar entrada del nuevo cohete
        setTimeout(() => {
          newRocket.style.opacity = '1';
          newRocket.style.transform = 'translateY(0)';
          rocketContainer.style.pointerEvents = 'auto';
        }, 100);
      }, 2000);
    });
    
    // Añadir la animación de lanzamiento si no existe
    if (!document.getElementById('rocket-launch-animation')) {
      const style = document.createElement('style');
      style.id = 'rocket-launch-animation';
      style.textContent = `
        @keyframes rocketLaunch {
          0% { transform: translateY(0) scale(1); }
          20% { transform: translateY(-30px) scale(1.1); }
          100% { transform: translateY(-1000px) scale(0.2); opacity: 0; }
        }
        
        @keyframes particleFall {
          0% { transform: translate(0, 0) scale(1); opacity: var(--initial-opacity); }
          100% { transform: translate(var(--offset-x), var(--offset-y)) scale(0); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  /**
   * Crea partículas para el lanzamiento del cohete
   * @param {HTMLElement} container - El contenedor del cohete
   */
  function createRocketLaunchParticles(container) {
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const bottom = rect.bottom;
    
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'rocket-particles';
    particlesContainer.style.cssText = `
      position: fixed;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 999;
    `;
    document.body.appendChild(particlesContainer);
    
    // Crear partículas
    for (let i = 0; i < 30; i++) {
      const particle = document.createElement('div');
      
      const size = Math.random() * 6 + 2;
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 3 + 1;
      const offsetX = Math.cos(angle) * velocity * 100;
      const offsetY = Math.sin(angle) * velocity * 100 + 50; // Más hacia abajo
      const initialOpacity = Math.random() * 0.5 + 0.3;
      const duration = Math.random() * 1 + 0.5;
      
      const isSmoke = Math.random() > 0.6;
      const color = isSmoke 
        ? `rgba(226, 232, 240, ${initialOpacity})` 
        : `rgba(${Math.random() > 0.5 ? '239, 68, 68' : '245, 158, 11'}, ${initialOpacity})`;
        
      particle.style.cssText = `
        position: absolute;
        left: ${centerX}px;
        top: ${bottom - 10}px;
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: 50%;
        --offset-x: ${offsetX}px;
        --offset-y: ${offsetY}px;
        --initial-opacity: ${initialOpacity};
        animation: particleFall ${duration}s ease-out forwards;
      `;
      
      particlesContainer.appendChild(particle);
    }
    
    // Eliminar el contenedor después de que todas las animaciones terminen
    setTimeout(() => {
      particlesContainer.remove();
    }, 2000);
  }

  // Exportar funcionalidades
  window.BitForwardTheme = {
    init: initSpaceTheme,
    applyToElement: function(element) {
      element.classList.add('space-theme');
      if (element.querySelectorAll) {
        applySpaceClassesToElements.call(element);
      }
    },
    createMeteor: createMeteor,
    CONFIG: CONFIG
  };
})();
