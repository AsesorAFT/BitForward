/**
 * 🌙 Dark Mode Premium - BitForward
 * Sistema completo de temas oscuro/claro con animaciones
 */

(function() {
  'use strict';

  const DEBUG = true;
  const log = (...args) => DEBUG && console.log('[Dark Mode]', ...args);

  // Configuración
  const STORAGE_KEY = 'bitforward-theme';
  const THEMES = {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto',
  };

  /**
     * Dark Mode Manager
     */
  class DarkModeManager {
    constructor() {
      this.currentTheme = THEMES.AUTO;
      this.systemPreference = null;
      this.toggle = null;
      this.init();
    }

    init() {
      log('🌙 Inicializando Dark Mode...');

      // Detectar preferencia del sistema
      this.detectSystemPreference();

      // Cargar tema guardado
      this.loadSavedTheme();

      // Crear toggle button
      this.createToggle();

      // Escuchar cambios del sistema
      this.watchSystemPreference();

      // Aplicar tema inicial
      this.applyTheme(this.currentTheme);

      log('✅ Dark Mode inicializado:', this.currentTheme);
    }

    /**
         * Detectar preferencia del sistema
         */
    detectSystemPreference() {
      if (window.matchMedia) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
        this.systemPreference = prefersDark.matches ? THEMES.DARK : THEMES.LIGHT;
        log('🖥️ System preference:', this.systemPreference);
      }
    }

    /**
         * Cargar tema guardado de localStorage
         */
    loadSavedTheme() {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && Object.values(THEMES).includes(saved)) {
        this.currentTheme = saved;
        log('💾 Tema cargado de localStorage:', saved);
      } else {
        this.currentTheme = THEMES.AUTO;
      }
    }

    /**
         * Guardar tema en localStorage
         */
    saveTheme(theme) {
      localStorage.setItem(STORAGE_KEY, theme);
      log('💾 Tema guardado:', theme);
    }

    /**
         * Crear toggle button
         */
    createToggle() {
      // Crear container
      const container = document.createElement('div');
      container.className = 'theme-toggle-container';

      // Crear button
      this.toggle = document.createElement('button');
      this.toggle.className = 'theme-toggle';
      this.toggle.setAttribute('aria-label', 'Toggle theme');
      this.toggle.innerHTML = `
                <svg class="theme-icon sun-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
                    <path d="M10 1v2m0 14v2M4.22 4.22l1.42 1.42m8.72 8.72l1.42 1.42M1 10h2m14 0h2M4.22 15.78l1.42-1.42m8.72-8.72l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <svg class="theme-icon moon-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                </svg>
            `;

      container.appendChild(this.toggle);

      // Agregar al header
      const header = document.querySelector('header') || document.querySelector('.landing-header');
      if (header) {
        const nav = header.querySelector('nav') || header.querySelector('.landing-nav');
        if (nav) {
          nav.appendChild(container);
        }
      }

      // Event listener
      this.toggle.addEventListener('click', () => this.cycleTheme());

      log('✅ Toggle button creado');
    }

    /**
         * Ciclar entre temas
         */
    cycleTheme() {
      const themes = [THEMES.LIGHT, THEMES.DARK, THEMES.AUTO];
      const currentIndex = themes.indexOf(this.currentTheme);
      const nextIndex = (currentIndex + 1) % themes.length;
      const nextTheme = themes[nextIndex];

      this.setTheme(nextTheme);

      // Haptic feedback
      if (window.mobileHaptic) {
        window.mobileHaptic.light();
      }

      log('🔄 Theme cycled:', nextTheme);
    }

    /**
         * Establecer tema
         */
    setTheme(theme) {
      this.currentTheme = theme;
      this.saveTheme(theme);
      this.applyTheme(theme);
      this.updateToggleIcon();
    }

    /**
         * Aplicar tema
         */
    applyTheme(theme) {
      const effectiveTheme = theme === THEMES.AUTO ? this.systemPreference : theme;

      // Agregar clase con animación
      document.documentElement.classList.add('theme-transitioning');

      // Remover clases anteriores
      document.documentElement.classList.remove('theme-light', 'theme-dark');

      // Agregar nueva clase
      document.documentElement.classList.add(`theme-${effectiveTheme}`);

      // Remover clase de transición después de completar
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 300);

      // Actualizar meta theme-color
      this.updateThemeColor(effectiveTheme);

      // Dispatch event
      document.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: effectiveTheme, mode: theme }
      }));

      log('🎨 Tema aplicado:', effectiveTheme);
    }

    /**
         * Actualizar theme-color meta tag
         */
    updateThemeColor(theme) {
      let metaTheme = document.querySelector('meta[name="theme-color"]');

      if (!metaTheme) {
        metaTheme = document.createElement('meta');
        metaTheme.name = 'theme-color';
        document.head.appendChild(metaTheme);
      }

      const color = theme === THEMES.DARK ? '#0f172a' : '#667eea';
      metaTheme.content = color;
    }

    /**
         * Actualizar icono del toggle
         */
    updateToggleIcon() {
      if (!this.toggle) {return;}

      const effectiveTheme = this.currentTheme === THEMES.AUTO ? this.systemPreference : this.currentTheme;

      // Rotar el toggle
      this.toggle.style.transform = 'rotate(360deg)';
      setTimeout(() => {
        this.toggle.style.transform = 'rotate(0deg)';
      }, 300);

      // Actualizar aria-label
      const labels = {
        [THEMES.LIGHT]: 'Switch to dark mode',
        [THEMES.DARK]: 'Switch to auto mode',
        [THEMES.AUTO]: 'Switch to light mode',
      };
      this.toggle.setAttribute('aria-label', labels[this.currentTheme]);
    }

    /**
         * Observar cambios en la preferencia del sistema
         */
    watchSystemPreference() {
      if (!window.matchMedia) {return;}

      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

      darkModeQuery.addEventListener('change', (e) => {
        this.systemPreference = e.matches ? THEMES.DARK : THEMES.LIGHT;
        log('🖥️ System preference changed:', this.systemPreference);

        // Si está en modo AUTO, aplicar el nuevo tema
        if (this.currentTheme === THEMES.AUTO) {
          this.applyTheme(THEMES.AUTO);
        }
      });
    }

    /**
         * Obtener tema actual efectivo
         */
    getEffectiveTheme() {
      return this.currentTheme === THEMES.AUTO ? this.systemPreference : this.currentTheme;
    }
  }

  /**
     * Agregar estilos CSS para dark mode
     */
  function addDarkModeStyles() {
    const styleId = 'dark-mode-styles';
    if (document.getElementById(styleId)) {return;}

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
            /* ===================================
               DARK MODE VARIABLES
               =================================== */

            :root {
                /* Light theme (default) */
                --bg-primary: #ffffff;
                --bg-secondary: #f8fafc;
                --bg-tertiary: #f1f5f9;
                
                --text-primary: #0f172a;
                --text-secondary: #475569;
                --text-tertiary: #94a3b8;
                
                --border-color: rgba(0, 0, 0, 0.1);
                --shadow-color: rgba(0, 0, 0, 0.1);
                
                --glass-bg-light: rgba(255, 255, 255, 0.1);
                --glass-border-light: rgba(255, 255, 255, 0.2);
            }

            .theme-dark {
                /* Dark theme */
                --bg-primary: #0f172a;
                --bg-secondary: #1e293b;
                --bg-tertiary: #334155;
                
                --text-primary: #f8fafc;
                --text-secondary: #cbd5e1;
                --text-tertiary: #94a3b8;
                
                --border-color: rgba(255, 255, 255, 0.1);
                --shadow-color: rgba(0, 0, 0, 0.5);
                
                --glass-bg-light: rgba(0, 0, 0, 0.2);
                --glass-border-light: rgba(255, 255, 255, 0.1);
            }

            /* ===================================
               THEME TRANSITION
               =================================== */

            .theme-transitioning,
            .theme-transitioning * {
                transition: background-color 0.3s ease,
                            color 0.3s ease,
                            border-color 0.3s ease,
                            box-shadow 0.3s ease !important;
            }

            /* ===================================
               TOGGLE BUTTON
               =================================== */

            .theme-toggle-container {
                display: flex;
                align-items: center;
                margin-left: 1rem;
            }

            .theme-toggle {
                position: relative;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: var(--glass-bg);
                backdrop-filter: blur(10px);
                border: 1px solid var(--glass-border);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                overflow: hidden;
            }

            .theme-toggle:hover {
                background: var(--glass-bg-hover);
                transform: scale(1.1);
                box-shadow: 0 4px 16px rgba(6, 182, 212, 0.3);
            }

            .theme-toggle:active {
                transform: scale(0.95);
            }

            .theme-icon {
                position: absolute;
                transition: all 0.3s ease;
                color: white;
            }

            .sun-icon {
                opacity: 1;
                transform: rotate(0deg) scale(1);
            }

            .moon-icon {
                opacity: 0;
                transform: rotate(180deg) scale(0);
            }

            .theme-dark .sun-icon {
                opacity: 0;
                transform: rotate(-180deg) scale(0);
            }

            .theme-dark .moon-icon {
                opacity: 1;
                transform: rotate(0deg) scale(1);
            }

            /* ===================================
               DARK THEME STYLES
               =================================== */

            .theme-dark body {
                background: var(--bg-primary);
                color: var(--text-primary);
            }

            .theme-dark .hero-section {
                background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            }

            .theme-dark .feature-card,
            .theme-dark .product-card,
            .theme-dark .glass-card {
                background: rgba(30, 41, 59, 0.5);
                border-color: rgba(255, 255, 255, 0.1);
            }

            .theme-dark .feature-card:hover,
            .theme-dark .product-card:hover {
                background: rgba(30, 41, 59, 0.7);
            }

            .theme-dark .landing-header {
                background: rgba(15, 23, 42, 0.95);
                border-bottom-color: rgba(255, 255, 255, 0.1);
            }

            .theme-dark .bottom-nav {
                background: rgba(15, 23, 42, 0.95);
                border-top-color: rgba(255, 255, 255, 0.1);
            }

            .theme-dark .scroll-to-top {
                box-shadow: 0 4px 16px rgba(6, 182, 212, 0.6);
            }

            .theme-dark .hero-subtitle,
            .theme-dark .feature-description {
                color: var(--text-secondary);
            }

            /* Ajustar sombras en dark mode */
            .theme-dark .feature-card:hover,
            .theme-dark .product-card:hover {
                box-shadow: 0 0 30px rgba(6, 182, 212, 0.4),
                            0 8px 32px rgba(0, 0, 0, 0.6);
            }

            /* Trust badges */
            .theme-dark .trust-badge {
                color: var(--text-tertiary);
            }

            /* Mejorar contraste de iconos */
            .theme-dark .feature-icon {
                box-shadow: 0 0 20px rgba(6, 182, 212, 0.8);
            }

            /* ===================================
               RESPONSIVE
               =================================== */

            @media (max-width: 768px) {
                .theme-toggle {
                    width: 40px;
                    height: 40px;
                }

                .theme-icon {
                    width: 18px;
                    height: 18px;
                }
            }

            /* ===================================
               ACCESSIBILITY
               =================================== */

            @media (prefers-reduced-motion: reduce) {
                .theme-transitioning,
                .theme-transitioning * {
                    transition: none !important;
                }
            }

            /* Focus visible */
            .theme-toggle:focus-visible {
                outline: 2px solid var(--cyan-500);
                outline-offset: 2px;
            }
        `;

    document.head.appendChild(style);
    log('✅ Dark mode styles agregados');
  }

  /**
     * Inicialización
     */
  function init() {
    log('🌙 Inicializando Dark Mode Premium...');

    // Agregar estilos
    addDarkModeStyles();

    // Crear manager
    const darkMode = new DarkModeManager();

    // Exponer globalmente
    window.darkMode = darkMode;

    // Keyboard shortcut: Ctrl/Cmd + Shift + D
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        darkMode.cycleTheme();

        // Mostrar toast
        if (window.toast) {
          const theme = darkMode.getEffectiveTheme();
          window.toast.info(`Theme: ${theme === 'dark' ? '🌙 Dark' : '☀️ Light'}`);
        }
      }
    });

    log('🎉 Dark Mode Premium inicializado!');
  }

  // Ejecutar al cargar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
