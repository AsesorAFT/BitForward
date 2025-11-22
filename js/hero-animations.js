/**
 * 🚀 Hero Animations - BitForward
 * Animaciones modernas para el hero section
 */

(function () {
  'use strict';

  const DEBUG = true;
  const log = (...args) => DEBUG && console.log('[Hero Animations]', ...args);

  /**
   * Typing Animation para el título
   */
  class TypingAnimation {
    constructor(element, texts, options = {}) {
      this.element = element;
      this.texts = texts;
      this.textIndex = 0;
      this.charIndex = 0;
      this.isDeleting = false;
      this.speed = options.speed || 100;
      this.deleteSpeed = options.deleteSpeed || 50;
      this.pauseTime = options.pauseTime || 2000;

      this.type();
    }

    type() {
      const currentText = this.texts[this.textIndex];

      if (this.isDeleting) {
        this.element.textContent = currentText.substring(0, this.charIndex - 1);
        this.charIndex--;
      } else {
        this.element.textContent = currentText.substring(0, this.charIndex + 1);
        this.charIndex++;
      }

      let delay = this.isDeleting ? this.deleteSpeed : this.speed;

      if (!this.isDeleting && this.charIndex === currentText.length) {
        delay = this.pauseTime;
        this.isDeleting = true;
      } else if (this.isDeleting && this.charIndex === 0) {
        this.isDeleting = false;
        this.textIndex = (this.textIndex + 1) % this.texts.length;
      }

      setTimeout(() => this.type(), delay);
    }
  }

  /**
   * Partículas flotantes de crypto
   */
  class CryptoParticles {
    constructor(container) {
      this.container = container;
      this.particles = [];
      this.symbols = ['₿', 'Ξ', '💎', '🚀', '⭐', '💫'];
      this.init();
    }

    init() {
      this.canvas = document.createElement('canvas');
      this.canvas.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1;
            `;
      this.container.appendChild(this.canvas);

      this.ctx = this.canvas.getContext('2d');
      this.resize();

      window.addEventListener('resize', () => this.resize());

      // Crear partículas
      for (let i = 0; i < 20; i++) {
        this.createParticle();
      }

      this.animate();
    }

    resize() {
      this.canvas.width = this.container.offsetWidth;
      this.canvas.height = this.container.offsetHeight;
    }

    createParticle() {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 20 + 10,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        symbol: this.symbols[Math.floor(Math.random() * this.symbols.length)],
        opacity: Math.random() * 0.3 + 0.1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 2,
      });
    }

    animate() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.particles.forEach((particle, index) => {
        // Actualizar posición
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.rotation += particle.rotationSpeed;

        // Wrap around
        if (particle.x < -50) particle.x = this.canvas.width + 50;
        if (particle.x > this.canvas.width + 50) particle.x = -50;
        if (particle.y < -50) particle.y = this.canvas.height + 50;
        if (particle.y > this.canvas.height + 50) particle.y = -50;

        // Dibujar
        this.ctx.save();
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate((particle.rotation * Math.PI) / 180);
        this.ctx.globalAlpha = particle.opacity;
        this.ctx.font = `${particle.size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(particle.symbol, 0, 0);
        this.ctx.restore();
      });

      requestAnimationFrame(() => this.animate());
    }
  }

  /**
   * Stats badges flotantes
   */
  class FloatingStats {
    constructor(container) {
      this.container = container;
      this.stats = [
        { label: 'TVL', value: '$2.5M', color: '#06B6D4' },
        { label: 'Users', value: '10K+', color: '#8B5CF6' },
        { label: 'APY', value: '125%', color: '#EC4899' },
      ];
      this.init();
    }

    init() {
      this.stats.forEach((stat, index) => {
        const badge = document.createElement('div');
        badge.className = 'floating-stat';
        badge.style.cssText = `
                    position: absolute;
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 12px;
                    padding: 12px 20px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    animation: float 3s ease-in-out infinite;
                    animation-delay: ${index * 0.5}s;
                `;

        // Posiciones diferentes
        const positions = [
          { top: '20%', left: '10%' },
          { top: '60%', right: '10%' },
          { bottom: '20%', left: '15%' },
        ];
        Object.assign(badge.style, positions[index]);

        badge.innerHTML = `
                    <div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 4px;">
                        ${stat.label}
                    </div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: ${stat.color};">
                        ${stat.value}
                    </div>
                `;

        this.container.appendChild(badge);
      });
    }
  }

  /**
   * Gradiente animado de fondo
   */
  class AnimatedGradient {
    constructor(element) {
      this.element = element;
      this.hue = 0;
      this.init();
    }

    init() {
      this.animate();
    }

    animate() {
      this.hue = (this.hue + 0.2) % 360;

      const gradient = `
                linear-gradient(
                    ${this.hue}deg,
                    hsl(${this.hue}, 70%, 50%) 0%,
                    hsl(${(this.hue + 60) % 360}, 70%, 50%) 50%,
                    hsl(${(this.hue + 120) % 360}, 70%, 50%) 100%
                )
            `;

      this.element.style.background = gradient;

      requestAnimationFrame(() => this.animate());
    }
  }

  /**
   * Ripple effect para botones
   */
  function addRippleEffect(button) {
    button.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                left: ${x}px;
                top: ${y}px;
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;

      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  }

  /**
   * Scroll reveal con Intersection Observer
   */
  function setupScrollReveal() {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('reveal-active');
            }, index * 100);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px',
      }
    );

    document.querySelectorAll('.reveal').forEach(el => {
      observer.observe(el);
    });
  }

  /**
   * Inicialización
   */
  function init() {
    log('🚀 Inicializando animaciones del hero...');

    // Typing animation para el título
    const heroTitle = document.querySelector('.hero-title-dynamic');
    if (heroTitle) {
      new TypingAnimation(heroTitle, [
        'Despegando en DeFi 🚀',
        'Trading Inteligente 💎',
        'Contratos Forward ⚡',
        'Yield Farming 🌾',
      ]);
      log('✅ Typing animation iniciado');
    }

    // Partículas crypto
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
      new CryptoParticles(heroSection);
      log('✅ Partículas crypto iniciadas');
    }

    // Stats flotantes
    if (heroSection) {
      new FloatingStats(heroSection);
      log('✅ Stats badges creados');
    }

    // Gradiente animado (opcional)
    const gradientBg = document.querySelector('.animated-gradient-bg');
    if (gradientBg) {
      new AnimatedGradient(gradientBg);
      log('✅ Gradiente animado iniciado');
    }

    // Ripple effect en botones CTA
    document.querySelectorAll('.cta-button, .btn-primary').forEach(button => {
      button.style.position = 'relative';
      button.style.overflow = 'hidden';
      addRippleEffect(button);
    });
    log('✅ Ripple effect agregado a botones');

    // Scroll reveal
    setupScrollReveal();
    log('✅ Scroll reveal configurado');

    // Agregar CSS para animaciones
    addAnimationStyles();
    log('✅ Estilos de animación agregados');

    log('🎉 Hero animations inicializadas correctamente!');
  }

  /**
   * Agregar estilos CSS
   */
  function addAnimationStyles() {
    const styleId = 'hero-animation-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
            /* Float animation */
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
            }

            /* Ripple animation */
            @keyframes ripple {
                from {
                    transform: scale(0);
                    opacity: 1;
                }
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }

            /* Scroll reveal */
            .reveal {
                opacity: 0;
                transform: translateY(30px);
                transition: opacity 0.6s ease, transform 0.6s ease;
            }

            .reveal-active {
                opacity: 1;
                transform: translateY(0);
            }

            /* Glow pulse */
            @keyframes glowPulse {
                0%, 100% {
                    filter: drop-shadow(0 0 10px currentColor);
                }
                50% {
                    filter: drop-shadow(0 0 20px currentColor);
                }
            }

            .glow-pulse {
                animation: glowPulse 2s ease-in-out infinite;
            }
        `;

    document.head.appendChild(style);
  }

  // Ejecutar al cargar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exponer para debug
  window.heroAnimations = {
    TypingAnimation,
    CryptoParticles,
    FloatingStats,
    AnimatedGradient,
  };
})();
