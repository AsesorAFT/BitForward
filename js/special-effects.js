/**
 * 🎊 Special Effects - BitForward
 * Efectos visuales especiales: confetti, cursor trail, easter eggs
 */

(function() {
  'use strict';

  const DEBUG = true;
  const log = (...args) => DEBUG && console.log('[Special FX]', ...args);

  /**
     * 🎉 Confetti System
     * Canvas-based confetti explosion
     */
  class ConfettiSystem {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.particles = [];
      this.animationId = null;
      this.init();
    }

    init() {
      // Crear canvas
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'confetti-canvas';
      this.canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: 9999;
            `;
      document.body.appendChild(this.canvas);

      this.ctx = this.canvas.getContext('2d');
      this.resize();

      // Escuchar resize
      window.addEventListener('resize', () => this.resize());

      log('✅ Confetti system inicializado');
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    /**
         * Crear explosión de confetti
         */
    explode(x = window.innerWidth / 2, y = window.innerHeight / 2, count = 100) {
      const colors = ['#06B6D4', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'];

      for (let i = 0; i < count; i++) {
        this.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15 - 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          gravity: 0.3,
          life: 1,
          decay: Math.random() * 0.01 + 0.01,
        });
      }

      // Iniciar animación si no está corriendo
      if (!this.animationId) {
        this.animate();
      }

      log('🎉 Confetti exploded:', count, 'particles');
    }

    /**
         * Animación de confetti
         */
    animate() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Actualizar y dibujar partículas
      this.particles = this.particles.filter(p => {
        // Física
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.life -= p.decay;

        // Dibujar
        if (p.life > 0) {
          this.ctx.save();
          this.ctx.globalAlpha = p.life;
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate((p.rotation * Math.PI) / 180);
          this.ctx.fillStyle = p.color;
          this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          this.ctx.restore();
          return true;
        }
        return false;
      });

      // Continuar animación si hay partículas
      if (this.particles.length > 0) {
        this.animationId = requestAnimationFrame(() => this.animate());
      } else {
        this.animationId = null;
      }
    }

    /**
         * Limpiar todas las partículas
         */
    clear() {
      this.particles = [];
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }
  }

  /**
     * ✨ Cursor Trail
     * Estrellas que siguen al cursor (solo desktop)
     */
  class CursorTrail {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.stars = [];
      this.mouseX = 0;
      this.mouseY = 0;
      this.enabled = !this.isMobile();

      if (this.enabled) {
        this.init();
      }
    }

    isMobile() {
      return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    init() {
      // Crear canvas
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'cursor-trail-canvas';
      this.canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: 9998;
            `;
      document.body.appendChild(this.canvas);

      this.ctx = this.canvas.getContext('2d');
      this.resize();

      // Event listeners
      window.addEventListener('resize', () => this.resize());
      document.addEventListener('mousemove', (e) => this.onMouseMove(e));

      // Iniciar animación
      this.animate();

      log('✅ Cursor trail inicializado');
    }

    resize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    onMouseMove(e) {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;

      // Crear nueva estrella cada movimiento (throttled by animation frame)
      if (Math.random() > 0.5) {
        this.stars.push({
          x: this.mouseX + (Math.random() - 0.5) * 10,
          y: this.mouseY + (Math.random() - 0.5) * 10,
          size: Math.random() * 3 + 1,
          life: 1,
          decay: Math.random() * 0.02 + 0.02,
          color: ['#06B6D4', '#8B5CF6', '#EC4899', '#F59E0B'][Math.floor(Math.random() * 4)],
        });
      }
    }

    animate() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Actualizar y dibujar estrellas
      this.stars = this.stars.filter(star => {
        star.life -= star.decay;

        if (star.life > 0) {
          this.ctx.save();
          this.ctx.globalAlpha = star.life;
          this.ctx.fillStyle = star.color;

          // Dibujar estrella (4 puntas)
          this.ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            const x = star.x + Math.cos(angle) * star.size;
            const y = star.y + Math.sin(angle) * star.size;
            i === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
          }
          this.ctx.closePath();
          this.ctx.fill();

          this.ctx.restore();
          return true;
        }
        return false;
      });

      requestAnimationFrame(() => this.animate());
    }

    toggle() {
      if (!this.enabled) {return;}

      this.canvas.style.display = this.canvas.style.display === 'none' ? 'block' : 'none';
      log('Cursor trail toggled:', this.canvas.style.display !== 'none');
    }
  }

  /**
     * ✅ Success Animation
     * Checkmark animado para acciones exitosas
     */
  class SuccessAnimation {
    constructor() {
      this.container = null;
      this.init();
    }

    init() {
      // Crear contenedor
      this.container = document.createElement('div');
      this.container.id = 'success-animation-container';
      this.container.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 10000;
                pointer-events: none;
                display: none;
            `;
      document.body.appendChild(this.container);

      log('✅ Success animation inicializado');
    }

    show(message = '¡Éxito!') {
      this.container.innerHTML = `
                <div class="success-checkmark">
                    <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#10B981" stroke-width="4" 
                                class="success-circle" />
                        <path d="M25 50 L40 65 L75 30" fill="none" stroke="#10B981" stroke-width="6" 
                              stroke-linecap="round" stroke-linejoin="round" class="success-check" />
                    </svg>
                    <p style="color: #10B981; font-weight: bold; text-align: center; margin-top: 1rem; 
                              font-size: 1.25rem;">${message}</p>
                </div>
            `;

      this.container.style.display = 'block';

      // Agregar estilos de animación
      const style = document.createElement('style');
      style.textContent = `
                .success-checkmark {
                    animation: successPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
                
                @keyframes successPop {
                    0% { transform: scale(0) rotate(-180deg); opacity: 0; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                
                .success-circle {
                    stroke-dasharray: 283;
                    stroke-dashoffset: 283;
                    animation: successCircle 0.6s ease-out forwards;
                }
                
                @keyframes successCircle {
                    to { stroke-dashoffset: 0; }
                }
                
                .success-check {
                    stroke-dasharray: 100;
                    stroke-dashoffset: 100;
                    animation: successCheck 0.4s 0.3s ease-out forwards;
                }
                
                @keyframes successCheck {
                    to { stroke-dashoffset: 0; }
                }
            `;

      if (!document.getElementById('success-animation-styles')) {
        style.id = 'success-animation-styles';
        document.head.appendChild(style);
      }

      // Auto-hide después de 2 segundos
      setTimeout(() => this.hide(), 2000);

      log('✅ Success animation shown:', message);
    }

    hide() {
      this.container.style.display = 'none';
      this.container.innerHTML = '';
    }
  }

  /**
     * ❌ Error Animation
     * X animada para errores
     */
  class ErrorAnimation {
    constructor() {
      this.container = null;
      this.init();
    }

    init() {
      this.container = document.createElement('div');
      this.container.id = 'error-animation-container';
      this.container.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 10000;
                pointer-events: none;
                display: none;
            `;
      document.body.appendChild(this.container);

      log('❌ Error animation inicializado');
    }

    show(message = 'Error') {
      this.container.innerHTML = `
                <div class="error-x">
                    <svg width="100" height="100" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#EF4444" stroke-width="4" 
                                class="error-circle" />
                        <path d="M35 35 L65 65 M65 35 L35 65" fill="none" stroke="#EF4444" stroke-width="6" 
                              stroke-linecap="round" class="error-x-mark" />
                    </svg>
                    <p style="color: #EF4444; font-weight: bold; text-align: center; margin-top: 1rem; 
                              font-size: 1.25rem;">${message}</p>
                </div>
            `;

      this.container.style.display = 'block';

      // Animación de shake
      const errorDiv = this.container.querySelector('.error-x');
      errorDiv.style.animation = 'errorShake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)';

      const style = document.createElement('style');
      style.textContent = `
                @keyframes errorShake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
                    20%, 40%, 60%, 80% { transform: translateX(10px); }
                }
                
                .error-circle {
                    stroke-dasharray: 283;
                    stroke-dashoffset: 283;
                    animation: errorCircle 0.6s ease-out forwards;
                }
                
                @keyframes errorCircle {
                    to { stroke-dashoffset: 0; }
                }
                
                .error-x-mark {
                    stroke-dasharray: 100;
                    stroke-dashoffset: 100;
                    animation: errorXMark 0.4s 0.3s ease-out forwards;
                }
                
                @keyframes errorXMark {
                    to { stroke-dashoffset: 0; }
                }
            `;

      if (!document.getElementById('error-animation-styles')) {
        style.id = 'error-animation-styles';
        document.head.appendChild(style);
      }

      setTimeout(() => this.hide(), 2000);

      log('❌ Error animation shown:', message);
    }

    hide() {
      this.container.style.display = 'none';
      this.container.innerHTML = '';
    }
  }

  /**
     * 🚀 Loading Rocket
     * Cohete animado para loading states
     */
  class LoadingRocket {
    constructor() {
      this.overlay = null;
      this.init();
    }

    init() {
      this.overlay = document.createElement('div');
      this.overlay.id = 'loading-rocket-overlay';
      this.overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(15, 23, 42, 0.95);
                backdrop-filter: blur(10px);
                z-index: 10001;
                display: none;
                align-items: center;
                justify-content: center;
                flex-direction: column;
            `;
      document.body.appendChild(this.overlay);

      log('🚀 Loading rocket inicializado');
    }

    show(message = 'Cargando...') {
      this.overlay.innerHTML = `
                <div class="loading-rocket-animation">
                    <div class="rocket">🚀</div>
                    <div class="loading-dots">
                        <span>.</span><span>.</span><span>.</span>
                    </div>
                    <p style="color: #06B6D4; font-size: 1.25rem; font-weight: 500; margin-top: 1rem;">${message}</p>
                </div>
            `;

      this.overlay.style.display = 'flex';

      const style = document.createElement('style');
      style.textContent = `
                .loading-rocket-animation {
                    text-align: center;
                }
                
                .rocket {
                    font-size: 4rem;
                    display: inline-block;
                    animation: rocketFly 2s ease-in-out infinite;
                }
                
                @keyframes rocketFly {
                    0%, 100% { transform: translateY(0px) rotate(-45deg); }
                    50% { transform: translateY(-30px) rotate(-35deg); }
                }
                
                .loading-dots {
                    margin-top: 1rem;
                }
                
                .loading-dots span {
                    color: #06B6D4;
                    font-size: 2rem;
                    animation: loadingDots 1.4s infinite;
                    display: inline-block;
                }
                
                .loading-dots span:nth-child(2) {
                    animation-delay: 0.2s;
                }
                
                .loading-dots span:nth-child(3) {
                    animation-delay: 0.4s;
                }
                
                @keyframes loadingDots {
                    0%, 80%, 100% { opacity: 0; }
                    40% { opacity: 1; }
                }
            `;

      if (!document.getElementById('loading-rocket-styles')) {
        style.id = 'loading-rocket-styles';
        document.head.appendChild(style);
      }

      log('🚀 Loading rocket shown:', message);
    }

    hide() {
      this.overlay.style.display = 'none';
      this.overlay.innerHTML = '';
    }
  }

  /**
     * 🥚 Easter Egg - Konami Code
     * Código secreto para efectos especiales
     */
  class EasterEgg {
    constructor() {
      this.konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
      this.userInput = [];
      this.init();
    }

    init() {
      document.addEventListener('keydown', (e) => this.handleKeyPress(e));
      log('🥚 Easter egg listener activado (Konami Code)');
    }

    handleKeyPress(e) {
      this.userInput.push(e.key);

      // Mantener solo los últimos 10 keys
      if (this.userInput.length > 10) {
        this.userInput.shift();
      }

      // Verificar si coincide con el código
      if (this.checkCode()) {
        this.trigger();
      }
    }

    checkCode() {
      return this.konamiCode.every((key, index) => key === this.userInput[index]);
    }

    trigger() {
      log('🎉 ¡KONAMI CODE ACTIVADO!');

      // Explosión de confetti masiva
      if (window.specialEffects?.confetti) {
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight * 0.5;
            window.specialEffects.confetti.explode(x, y, 150);
          }, i * 200);
        }
      }

      // Mostrar mensaje secreto
      if (window.toast) {
        window.toast.success('🎉 ¡KONAMI CODE! ¡Eres un verdadero gamer!');
      }

      // Haptic feedback intenso
      if (window.mobileHaptic) {
        window.mobileHaptic.success();
      }

      // Reset input
      this.userInput = [];
    }
  }

  /**
     * Integración con eventos de la app
     */
  function setupIntegrations() {
    // Confetti al conectar wallet
    document.addEventListener('walletConnected', (e) => {
      log('💰 Wallet conectado, lanzando confetti!');

      if (window.specialEffects?.confetti) {
        // Confetti desde el botón de conectar
        const connectButton = document.querySelector('.cta-button-primary');
        if (connectButton) {
          const rect = connectButton.getBoundingClientRect();
          window.specialEffects.confetti.explode(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            80
          );
        }
      }

      // Success animation
      if (window.specialEffects?.success) {
        window.specialEffects.success.show('¡Wallet Conectada!');
      }

      // Haptic
      if (window.mobileHaptic) {
        window.mobileHaptic.success();
      }
    });

    // Success animation para transacciones exitosas
    document.addEventListener('transactionSuccess', (e) => {
      log('✅ Transacción exitosa');

      if (window.specialEffects?.success) {
        window.specialEffects.success.show('¡Transacción Exitosa!');
      }

      if (window.specialEffects?.confetti) {
        window.specialEffects.confetti.explode(
          window.innerWidth / 2,
          window.innerHeight / 2,
          60
        );
      }
    });

    // Error animation para fallos
    document.addEventListener('transactionError', (e) => {
      log('❌ Error en transacción');

      if (window.specialEffects?.error) {
        window.specialEffects.error.show('Error en Transacción');
      }
    });

    log('✅ Integraciones configuradas');
  }

  /**
     * Inicialización
     */
  function init() {
    log('🎊 Inicializando Special Effects...');

    // Crear instancias
    const confetti = new ConfettiSystem();
    const cursorTrail = new CursorTrail();
    const success = new SuccessAnimation();
    const error = new ErrorAnimation();
    const loadingRocket = new LoadingRocket();
    const easterEgg = new EasterEgg();

    // Exponer globalmente
    window.specialEffects = {
      confetti,
      cursorTrail,
      success,
      error,
      loadingRocket,
      easterEgg,
    };

    // Configurar integraciones
    setupIntegrations();

    // Demo al cargar (opcional, comentar en producción)
    // setTimeout(() => {
    //     confetti.explode(window.innerWidth / 2, window.innerHeight / 2, 50);
    // }, 500);

    log('🎉 Special Effects inicializados!');
    log('💡 Tip: Prueba el Konami Code: ↑↑↓↓←→←→BA');
  }

  // Ejecutar al cargar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
