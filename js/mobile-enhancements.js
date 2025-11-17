/**
 * 📱 Mobile Enhancements - BitForward
 * Optimizaciones y features específicas para dispositivos móviles
 */

(function() {
  'use strict';

  const DEBUG = true;
  const log = (...args) => DEBUG && console.log('[Mobile]', ...args);

  /**
     * Detectar si es dispositivo móvil
     */
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const isTouch = () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  };

  /**
     * Touch Gestures Handler
     */
  class TouchGestures {
    constructor() {
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.touchEndX = 0;
      this.touchEndY = 0;
      this.minSwipeDistance = 50;
      this.init();
    }

    init() {
      if (!isTouch()) {
        log('⚠️ No es dispositivo táctil');
        return;
      }

      document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
      document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });

      log('✅ Touch gestures configurados');
    }

    handleTouchStart(e) {
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
    }

    handleTouchEnd(e) {
      this.touchEndX = e.changedTouches[0].screenX;
      this.touchEndY = e.changedTouches[0].screenY;
      this.handleGesture();
    }

    handleGesture() {
      const diffX = this.touchEndX - this.touchStartX;
      const diffY = this.touchEndY - this.touchStartY;

      // Swipe horizontal
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > this.minSwipeDistance) {
        if (diffX > 0) {
          this.onSwipeRight();
        } else {
          this.onSwipeLeft();
        }
      }

      // Swipe vertical
      if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > this.minSwipeDistance) {
        if (diffY > 0) {
          this.onSwipeDown();
        } else {
          this.onSwipeUp();
        }
      }
    }

    onSwipeLeft() {
      document.dispatchEvent(new CustomEvent('swipeLeft'));
      log('👉 Swipe left');
    }

    onSwipeRight() {
      document.dispatchEvent(new CustomEvent('swipeRight'));
      log('👈 Swipe right');
    }

    onSwipeUp() {
      document.dispatchEvent(new CustomEvent('swipeUp'));
      log('👆 Swipe up');
    }

    onSwipeDown() {
      document.dispatchEvent(new CustomEvent('swipeDown'));
      log('👇 Swipe down');
    }
  }

  /**
     * Haptic Feedback Simulation
     */
  class HapticFeedback {
    constructor() {
      this.init();
    }

    init() {
      if (!navigator.vibrate) {
        log('⚠️ Vibration API no soportada');
        return;
      }

      // Agregar haptic feedback a botones
      document.querySelectorAll('button, .btn, .cta-button-primary, .cta-button-secondary').forEach(button => {
        button.addEventListener('click', () => this.light(), { passive: true });
      });

      log('✅ Haptic feedback configurado');
    }

    light() {
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }

    medium() {
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
    }

    heavy() {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }

    success() {
      if (navigator.vibrate) {
        navigator.vibrate([10, 50, 10]);
      }
    }

    error() {
      if (navigator.vibrate) {
        navigator.vibrate([50, 100, 50]);
      }
    }
  }

  /**
     * Bottom Navigation para móvil
     */
  class BottomNavigation {
    constructor() {
      this.nav = null;
      this.lastScrollY = 0;
      this.init();
    }

    init() {
      if (!isMobile()) {
        log('⚠️ No es móvil, bottom nav no necesaria');
        return;
      }

      this.createBottomNav();
      this.setupScrollBehavior();

      log('✅ Bottom navigation creada');
    }

    createBottomNav() {
      this.nav = document.createElement('nav');
      this.nav.className = 'bottom-nav';
      this.nav.innerHTML = `
                <button class="bottom-nav-item" data-action="home">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                    </svg>
                    <span>Inicio</span>
                </button>
                <button class="bottom-nav-item" data-action="products">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                    <span>Productos</span>
                </button>
                <button class="bottom-nav-item bottom-nav-item-primary" data-action="connect">
                    <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                </button>
                <button class="bottom-nav-item" data-action="about">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span>Info</span>
                </button>
                <button class="bottom-nav-item" data-action="menu">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                    </svg>
                    <span>Menú</span>
                </button>
            `;

      document.body.appendChild(this.nav);

      // Event listeners
      this.nav.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.addEventListener('click', (e) => this.handleNavClick(e));
      });
    }

    handleNavClick(e) {
      const action = e.currentTarget.dataset.action;

      // Haptic feedback
      if (window.mobileHaptic) {
        window.mobileHaptic.light();
      }

      // Acciones
      switch (action) {
        case 'home':
          window.scrollTo({ top: 0, behavior: 'smooth' });
          break;
        case 'products':
          document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
          break;
        case 'connect':
          const connectBtn = document.querySelector('.cta-button-primary');
          if (connectBtn) {connectBtn.click();}
          break;
        case 'about':
          // Scroll a sección about o footer
          const footer = document.querySelector('footer');
          if (footer) {footer.scrollIntoView({ behavior: 'smooth' });}
          break;
        case 'menu':
          // Toggle mobile menu
          this.toggleMobileMenu();
          break;
      }

      log(`📱 Bottom nav: ${action}`);
    }

    setupScrollBehavior() {
      let ticking = false;

      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            this.handleScroll();
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }

    handleScroll() {
      const currentScrollY = window.pageYOffset;

      // Ocultar al hacer scroll down, mostrar al hacer scroll up
      if (currentScrollY > this.lastScrollY && currentScrollY > 100) {
        this.nav.style.transform = 'translateY(100%)';
      } else {
        this.nav.style.transform = 'translateY(0)';
      }

      this.lastScrollY = currentScrollY;
    }

    toggleMobileMenu() {
      // Implementar toggle de menú móvil
      log('📱 Toggle mobile menu');
      // TODO: Implementar menú hamburguesa
    }
  }

  /**
     * Pull to Refresh
     */
  class PullToRefresh {
    constructor() {
      this.startY = 0;
      this.currentY = 0;
      this.isPulling = false;
      this.threshold = 80;
      this.indicator = null;
      this.init();
    }

    init() {
      if (!isTouch()) {return;}

      this.createIndicator();

      document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
      document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
      document.addEventListener('touchend', () => this.handleTouchEnd(), { passive: true });

      log('✅ Pull to refresh configurado');
    }

    createIndicator() {
      this.indicator = document.createElement('div');
      this.indicator.className = 'pull-refresh-indicator';
      this.indicator.innerHTML = `
                <div class="spinner"></div>
                <span>Desliza para actualizar</span>
            `;
      this.indicator.style.cssText = `
                position: fixed;
                top: -80px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--glass-bg);
                backdrop-filter: blur(10px);
                border-radius: 12px;
                padding: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: white;
                z-index: 9999;
                transition: top 0.3s ease;
            `;
      document.body.appendChild(this.indicator);
    }

    handleTouchStart(e) {
      if (window.pageYOffset === 0) {
        this.startY = e.touches[0].clientY;
        this.isPulling = true;
      }
    }

    handleTouchMove(e) {
      if (!this.isPulling) {return;}

      this.currentY = e.touches[0].clientY;
      const diff = this.currentY - this.startY;

      if (diff > 0 && window.pageYOffset === 0) {
        e.preventDefault();
        const progress = Math.min(diff / this.threshold, 1);
        this.indicator.style.top = `${-80 + (progress * 80)}px`;
      }
    }

    handleTouchEnd() {
      if (!this.isPulling) {return;}

      const diff = this.currentY - this.startY;

      if (diff > this.threshold) {
        this.refresh();
      } else {
        this.indicator.style.top = '-80px';
      }

      this.isPulling = false;
    }

    refresh() {
      this.indicator.style.top = '20px';
      this.indicator.querySelector('span').textContent = 'Actualizando...';

      // Simular refresh
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  /**
     * Viewport Height Fix para iOS
     */
  function fixIOSViewportHeight() {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    log('✅ iOS viewport height fixed');
  }

  /**
     * Prevent zoom on double tap
     */
  function preventDoubleTabZoom() {
    let lastTouchEnd = 0;

    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });

    log('✅ Double tap zoom prevenido');
  }

  /**
     * Optimize animations for mobile
     */
  function optimizeAnimationsForMobile() {
    if (isMobile()) {
      // Reducir complejidad de animaciones en móvil
      document.body.classList.add('mobile-device');

      // Desactivar parallax en móvil
      document.querySelectorAll('.parallax').forEach(el => {
        el.style.transform = 'none';
      });

      log('✅ Animaciones optimizadas para móvil');
    }
  }

  /**
     * Safe Area Insets para notch/island
     */
  function applySafeAreaInsets() {
    const style = document.createElement('style');
    style.textContent = `
            .safe-area-top {
                padding-top: env(safe-area-inset-top);
            }

            .safe-area-bottom {
                padding-bottom: env(safe-area-inset-bottom);
            }

            .bottom-nav {
                padding-bottom: calc(1rem + env(safe-area-inset-bottom));
            }

            header {
                padding-top: env(safe-area-inset-top);
            }
        `;
    document.head.appendChild(style);

    log('✅ Safe area insets aplicados');
  }

  /**
     * Add mobile-specific styles
     */
  function addMobileStyles() {
    const styleId = 'mobile-enhancement-styles';
    if (document.getElementById(styleId)) {return;}

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
            /* Bottom Navigation */
            .bottom-nav {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                height: 70px;
                background: rgba(15, 23, 42, 0.95);
                backdrop-filter: blur(20px);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-around;
                align-items: center;
                padding: 0.5rem 0;
                z-index: 1000;
                transition: transform 0.3s ease;
            }

            .bottom-nav-item {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.25rem;
                padding: 0.5rem 1rem;
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.6);
                font-size: 0.75rem;
                transition: all 0.3s ease;
                cursor: pointer;
            }

            .bottom-nav-item:active {
                transform: scale(0.9);
            }

            .bottom-nav-item svg {
                width: 24px;
                height: 24px;
            }

            .bottom-nav-item-primary {
                background: var(--gradient-main);
                border-radius: 50%;
                width: 56px;
                height: 56px;
                margin-top: -20px;
                box-shadow: 0 4px 16px rgba(6, 182, 212, 0.4);
            }

            .bottom-nav-item-primary svg {
                width: 28px;
                height: 28px;
            }

            .bottom-nav-item-primary span {
                display: none;
            }

            /* Mobile optimizations */
            @media (max-width: 768px) {
                body {
                    padding-bottom: 80px;
                }

                .hero-section {
                    min-height: calc(100vh - 80px);
                    padding-top: 80px;
                }

                .feature-card,
                .product-card {
                    padding: 1.5rem;
                }

                .cta-button-primary,
                .cta-button-secondary {
                    min-height: 48px;
                    font-size: 1rem;
                }

                /* Touch-friendly spacing */
                button,
                a {
                    min-height: 44px;
                    min-width: 44px;
                }
            }

            /* Hide bottom nav on desktop */
            @media (min-width: 769px) {
                .bottom-nav {
                    display: none;
                }
            }

            /* Pull to refresh indicator */
            .pull-refresh-indicator .spinner {
                width: 20px;
                height: 20px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }

            /* Mobile device specific */
            .mobile-device * {
                -webkit-tap-highlight-color: rgba(6, 182, 212, 0.2);
            }

            .mobile-device .parallax {
                transform: none !important;
            }

            /* Landscape mode */
            @media (max-height: 500px) and (orientation: landscape) {
                .hero-section {
                    min-height: auto;
                    padding: 3rem 1rem;
                }

                .bottom-nav {
                    display: none;
                }
            }
        `;

    document.head.appendChild(style);
  }

  /**
     * Inicialización
     */
  function init() {
    log('📱 Inicializando mobile enhancements...');

    // Agregar estilos
    addMobileStyles();

    // Aplicar safe area insets
    applySafeAreaInsets();

    // Fix iOS viewport
    fixIOSViewportHeight();

    // Prevent double tap zoom
    preventDoubleTabZoom();

    // Optimize animations
    optimizeAnimationsForMobile();

    if (isMobile() || isTouch()) {
      // Inicializar componentes móviles
      const touchGestures = new TouchGestures();
      const hapticFeedback = new HapticFeedback();
      const bottomNav = new BottomNavigation();
      const pullToRefresh = new PullToRefresh();

      // Exponer para uso global
      window.mobileHaptic = hapticFeedback;
      window.mobileTouchGestures = touchGestures;

      log('🎉 Mobile enhancements inicializados!');
    } else {
      log('⚠️ No es dispositivo móvil');
    }
  }

  // Ejecutar al cargar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
