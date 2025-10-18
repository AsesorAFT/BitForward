/**
 * BitForward Space Theme Loader
 * Este archivo se encarga de cargar dinámicamente todos los recursos del tema espacial
 * Debe ser incluido en todas las páginas antes que cualquier otro script
 */

(function() {
  console.log('🚀 BitForward Space Theme Loader Initializing...');
  
  // Función para determinar el tipo de página actual
  function getCurrentPageType() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1).toLowerCase();
    
    if (!filename || filename === '' || filename === 'index.html') {
      return 'home';
    } else if (filename.includes('dashboard') || filename.includes('enterprise')) {
      return 'dashboard';
    } else if (filename.includes('lending')) {
      return 'lending';
    } else if (filename.includes('login') || filename.includes('register') || filename.includes('auth')) {
      return 'auth';
    } else {
      return 'other';
    }
  }
  
  // Cargar configuración
  function loadConfig() {
    return new Promise((resolve) => {
      // Si la configuración ya está disponible, usarla directamente
      if (window.SPACE_THEME_CONFIG) {
        resolve(window.SPACE_THEME_CONFIG);
        return;
      }
      
      // Cargar el script de configuración
      const script = document.createElement('script');
      script.src = '/js/space-theme-config.js';
      script.onload = function() {
        resolve(window.SPACE_THEME_CONFIG);
      };
      script.onerror = function() {
        console.error('Error al cargar la configuración del tema espacial');
        resolve({
          enabled: true,
          resources: {
            css: ['/css/space-background.css', '/css/rocket-theme.css'],
            js: ['/js/space-animations.js', '/js/rocket-space-theme.js']
          }
        });
      };
      document.head.appendChild(script);
    });
  }
  
  // Cargar CSS
  function loadStylesheet(href) {
    return new Promise((resolve) => {
      // Verificar si ya está cargado
      const existingLinks = document.querySelectorAll('link[rel="stylesheet"]');
      for (let i = 0; i < existingLinks.length; i++) {
        if (existingLinks[i].href.includes(href)) {
          resolve();
          return;
        }
      }
      
      // Cargar el CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = () => {
        console.error(`Error al cargar el CSS: ${href}`);
        resolve();
      };
      document.head.appendChild(link);
    });
  }
  
  // Cargar JavaScript
  function loadScript(src) {
    return new Promise((resolve) => {
      // Verificar si ya está cargado
      const existingScripts = document.querySelectorAll('script');
      for (let i = 0; i < existingScripts.length; i++) {
        if (existingScripts[i].src.includes(src)) {
          resolve();
          return;
        }
      }
      
      // Cargar el script
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => {
        console.error(`Error al cargar el script: ${src}`);
        resolve();
      };
      document.body.appendChild(script);
    });
  }
  
  // Cargar recursos en paralelo
  async function loadResources(config) {
    const pageType = getCurrentPageType();
    console.log(`🚀 BitForward Space Theme: Detectada página de tipo "${pageType}"`);
    
    // Cargar todos los CSS en paralelo
    const cssPromises = config.resources.css.map(href => loadStylesheet(href));
    await Promise.all(cssPromises);
    
    // Cargar todos los scripts en orden
    for (const src of config.resources.js) {
      await loadScript(src);
    }
    
    // Indicar que todo está cargado
    document.documentElement.classList.add('space-theme-loaded');
    console.log('🚀 BitForward Space Theme: Todos los recursos cargados');
    
    // Disparar evento para que otros scripts puedan saber que el tema está listo
    const event = new Event('spaceThemeLoaded');
    document.dispatchEvent(event);
  }
  
  // Verificar si el usuario prefiere reducir el movimiento
  function checkReduceMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  // Reducir efectos si el usuario prefiere reducir el movimiento
  function adjustForAccessibility(config) {
    if (config.performance.reduceMotion === 'auto' && checkReduceMotion()) {
      console.log('🚀 BitForward Space Theme: Reduciendo efectos de movimiento por accesibilidad');
      
      // Modificar la configuración para reducir el movimiento
      config.effects.stars.twinkle = false;
      config.effects.meteors.enabled = false;
      config.effects.parallax.enabled = false;
      config.rocketElements.flyingRockets = false;
      
      // Añadir clase para reducción de movimiento
      document.documentElement.classList.add('reduce-motion');
    }
    
    return config;
  }
  
  // Inicializar
  async function init() {
    try {
      // Cargar configuración
      const config = await loadConfig();
      
      // Verificar si está habilitado
      if (!config.enabled) {
        console.log('🚀 BitForward Space Theme: Deshabilitado por configuración');
        return;
      }
      
      // Ajustar configuración para accesibilidad
      const adjustedConfig = adjustForAccessibility(config);
      
      // Cargar recursos
      await loadResources(adjustedConfig);
      
      console.log('🚀 BitForward Space Theme: Inicialización completa');
    } catch (error) {
      console.error('Error al inicializar el tema espacial:', error);
    }
  }
  
  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
