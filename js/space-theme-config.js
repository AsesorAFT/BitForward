/**
 * BitForward Space Theme Integration Configuration
 * Archivo de configuración para la integración del tema espacial en todas las páginas
 */

const SPACE_THEME_CONFIG = {
  // Configuración básica
  enabled: true,
  version: '1.0.0',

  // Recursos y dependencias
  resources: {
    css: ['/css/space-background.css', '/css/rocket-theme.css'],
    js: ['/js/space-animations.js', '/js/rocket-animations.js', '/js/rocket-space-theme.js'],
  },

  // Efectos visuales
  effects: {
    stars: {
      enabled: true,
      count: 100,
      layers: 3,
      twinkle: true,
    },
    nebulas: {
      enabled: true,
      count: 2,
    },
    meteors: {
      enabled: true,
      frequency: 15000, // ms entre meteoros
      minSize: 100,
      maxSize: 200,
    },
    parallax: {
      enabled: true,
      intensity: 0.5,
    },
  },

  // Elementos específicos de cohetes
  rocketElements: {
    logoAnimation: true,
    buttons: true,
    flyingRockets: true,
    rocketFrequency: 10000, // ms entre cohetes voladores
  },

  // Modo oscuro / claro
  darkMode: true,

  // Configuraciones específicas por página
  pageSpecific: {
    home: {
      animatedHero: true,
      meteorShowers: true,
      rocketLaunchEffect: true,
    },
    dashboard: {
      animateCharts: true,
      spaceBackground: true,
      cardHoverEffects: true,
      rocketProgressBars: true,
    },
    lending: {
      animateRates: true,
      starfieldBackground: true,
      rocketProgressBars: true,
    },
    auth: {
      simplifiedStars: true,
      subtleEffects: true,
    },
  },

  // Rendimiento y accesibilidad
  performance: {
    reduceMotion: 'auto', // 'auto', 'always', 'never'
    lowPowerMode: false,
    optimizeForMobile: true,
  },

  // Gestión de color
  colors: {
    primary: '#3b82f6',
    secondary: '#06b6d4',
    accent: '#8b5cf6',
    dark: '#0f172a',
    darker: '#080e1d',
    light: '#e2e8f0',
    stars: '#ffffff',
    nebula1: 'rgba(59, 130, 246, 0.1)',
    nebula2: 'rgba(139, 92, 246, 0.1)',
  },
};

// Exportar la configuración para su uso en otras partes de la aplicación
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SPACE_THEME_CONFIG;
} else {
  window.SPACE_THEME_CONFIG = SPACE_THEME_CONFIG;
}
