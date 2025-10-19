/**
 * ✨ Scroll Animations - BitForward
 * Animaciones suaves y reveal effects al hacer scroll
 */

(function() {
    'use strict';

    const DEBUG = true;
    const log = (...args) => DEBUG && console.log('[Scroll Animations]', ...args);

    /**
     * Configuración
     */
    const CONFIG = {
        revealThreshold: 0.15,
        revealRootMargin: '0px 0px -100px 0px',
        staggerDelay: 100, // ms entre cada elemento
        smoothScrollDuration: 800,
        parallaxIntensity: 0.5,
    };

    /**
     * Scroll Reveal con Intersection Observer
     */
    class ScrollReveal {
        constructor() {
            this.elements = [];
            this.observer = null;
            this.init();
        }

        init() {
            // Encontrar todos los elementos con clase .reveal
            this.elements = Array.from(document.querySelectorAll('.reveal'));
            
            if (this.elements.length === 0) {
                // Si no hay elementos con .reveal, agregar la clase automáticamente
                this.autoAddRevealClass();
            }

            // Crear observer
            this.observer = new IntersectionObserver(
                (entries) => this.handleIntersection(entries),
                {
                    threshold: CONFIG.revealThreshold,
                    rootMargin: CONFIG.revealRootMargin,
                }
            );

            // Observar todos los elementos
            this.elements.forEach((el) => this.observer.observe(el));

            log(`✅ Observando ${this.elements.length} elementos para reveal`);
        }

        autoAddRevealClass() {
            // Agregar clase .reveal automáticamente a secciones y cards
            const selectors = [
                '.features-section',
                '.feature-card',
                '.product-card',
                '.stats-card',
                '.info-card',
                'section:not(.hero-section)',
            ];

            selectors.forEach((selector) => {
                document.querySelectorAll(selector).forEach((el) => {
                    if (!el.classList.contains('reveal')) {
                        el.classList.add('reveal');
                        this.elements.push(el);
                    }
                });
            });

            log(`✅ Auto-agregada clase .reveal a ${this.elements.length} elementos`);
        }

        handleIntersection(entries) {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting && !entry.target.classList.contains('reveal-active')) {
                    // Agregar delay para efecto stagger
                    const delay = index * CONFIG.staggerDelay;
                    
                    setTimeout(() => {
                        entry.target.classList.add('reveal-active');
                        
                        // Trigger custom event
                        entry.target.dispatchEvent(new CustomEvent('revealed', {
                            detail: { element: entry.target }
                        }));
                    }, delay);
                }
            });
        }

        destroy() {
            if (this.observer) {
                this.observer.disconnect();
            }
        }
    }

    /**
     * Smooth Scroll para navegación
     */
    class SmoothScroll {
        constructor() {
            this.init();
        }

        init() {
            // Escuchar clicks en links de navegación
            document.querySelectorAll('a[href^="#"]').forEach((link) => {
                link.addEventListener('click', (e) => this.handleClick(e));
            });

            log('✅ Smooth scroll configurado');
        }

        handleClick(e) {
            const href = e.currentTarget.getAttribute('href');
            
            // Ignorar si es solo "#"
            if (href === '#') return;

            const targetId = href.substring(1);
            const target = document.getElementById(targetId);

            if (target) {
                e.preventDefault();
                this.scrollTo(target);
            }
        }

        scrollTo(target, offset = 80) {
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            // Actualizar URL sin scroll
            if (target.id) {
                history.pushState(null, null, `#${target.id}`);
            }
        }
    }

    /**
     * Parallax Effect para secciones
     */
    class ParallaxEffect {
        constructor() {
            this.elements = [];
            this.init();
        }

        init() {
            // Encontrar elementos con clase .parallax
            this.elements = Array.from(document.querySelectorAll('.parallax'));

            if (this.elements.length === 0) {
                log('⚠️ No hay elementos .parallax');
                return;
            }

            // Escuchar scroll
            window.addEventListener('scroll', () => this.handleScroll(), { passive: true });

            log(`✅ Parallax configurado para ${this.elements.length} elementos`);
        }

        handleScroll() {
            const scrolled = window.pageYOffset;

            this.elements.forEach((el) => {
                const speed = parseFloat(el.dataset.parallaxSpeed || CONFIG.parallaxIntensity);
                const yPos = -(scrolled * speed);
                
                el.style.transform = `translateY(${yPos}px)`;
            });
        }
    }

    /**
     * Progress Bar de scroll
     */
    class ScrollProgressBar {
        constructor() {
            this.progressBar = null;
            this.init();
        }

        init() {
            // Crear barra de progreso
            this.progressBar = document.createElement('div');
            this.progressBar.className = 'scroll-progress-bar';
            this.progressBar.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                height: 3px;
                background: linear-gradient(90deg, #06B6D4, #8B5CF6, #EC4899);
                z-index: 9999;
                transition: width 0.1s ease;
                width: 0%;
            `;

            document.body.appendChild(this.progressBar);

            // Escuchar scroll
            window.addEventListener('scroll', () => this.updateProgress(), { passive: true });

            log('✅ Progress bar creada');
        }

        updateProgress() {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
            
            this.progressBar.style.width = `${Math.min(scrollPercent, 100)}%`;
        }
    }

    /**
     * Scroll to Top Button
     */
    class ScrollToTop {
        constructor() {
            this.button = null;
            this.init();
        }

        init() {
            // Crear botón
            this.button = document.createElement('button');
            this.button.className = 'scroll-to-top';
            this.button.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
            `;
            this.button.style.cssText = `
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: linear-gradient(135deg, #06B6D4, #8B5CF6);
                color: white;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 16px rgba(6, 182, 212, 0.4);
                opacity: 0;
                transform: scale(0.8);
                transition: all 0.3s ease;
                z-index: 1000;
                pointer-events: none;
            `;

            document.body.appendChild(this.button);

            // Event listeners
            this.button.addEventListener('click', () => this.scrollToTop());
            window.addEventListener('scroll', () => this.toggleVisibility(), { passive: true });

            log('✅ Scroll to top button creado');
        }

        toggleVisibility() {
            const scrolled = window.pageYOffset;

            if (scrolled > 300) {
                this.button.style.opacity = '1';
                this.button.style.transform = 'scale(1)';
                this.button.style.pointerEvents = 'auto';
            } else {
                this.button.style.opacity = '0';
                this.button.style.transform = 'scale(0.8)';
                this.button.style.pointerEvents = 'none';
            }
        }

        scrollToTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }

    /**
     * Counter Animation para números
     */
    class CounterAnimation {
        constructor() {
            this.counters = [];
            this.init();
        }

        init() {
            // Encontrar elementos con clase .counter
            this.counters = Array.from(document.querySelectorAll('.counter, .stats-value'));

            if (this.counters.length === 0) {
                log('⚠️ No hay elementos .counter');
                return;
            }

            // Crear observer
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting && !entry.target.dataset.counted) {
                            this.animateCounter(entry.target);
                            entry.target.dataset.counted = 'true';
                        }
                    });
                },
                { threshold: 0.5 }
            );

            // Observar counters
            this.counters.forEach((counter) => observer.observe(counter));

            log(`✅ Counter animation para ${this.counters.length} elementos`);
        }

        animateCounter(element) {
            const text = element.textContent;
            const number = parseFloat(text.replace(/[^0-9.]/g, ''));
            
            if (isNaN(number)) return;

            const suffix = text.replace(/[0-9.]/g, '');
            const duration = 2000;
            const steps = 60;
            const increment = number / steps;
            let current = 0;
            let step = 0;

            const timer = setInterval(() => {
                current += increment;
                step++;

                if (step >= steps) {
                    current = number;
                    clearInterval(timer);
                }

                element.textContent = Math.floor(current) + suffix;
            }, duration / steps);
        }
    }

    /**
     * Fade In on Load para hero
     */
    function fadeInHero() {
        const hero = document.querySelector('.hero-section');
        if (hero) {
            hero.style.opacity = '0';
            hero.style.transition = 'opacity 1s ease';
            
            setTimeout(() => {
                hero.style.opacity = '1';
            }, 100);
        }
    }

    /**
     * Add animation styles
     */
    function addAnimationStyles() {
        const styleId = 'scroll-animation-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Scroll reveal base */
            .reveal {
                opacity: 0;
                transform: translateY(30px);
                transition: opacity 0.6s ease, transform 0.6s ease;
            }

            .reveal-active {
                opacity: 1;
                transform: translateY(0);
            }

            /* Reveal variants */
            .reveal-left {
                opacity: 0;
                transform: translateX(-30px);
            }

            .reveal-left.reveal-active {
                opacity: 1;
                transform: translateX(0);
            }

            .reveal-right {
                opacity: 0;
                transform: translateX(30px);
            }

            .reveal-right.reveal-active {
                opacity: 1;
                transform: translateX(0);
            }

            .reveal-scale {
                opacity: 0;
                transform: scale(0.9);
            }

            .reveal-scale.reveal-active {
                opacity: 1;
                transform: scale(1);
            }

            /* Smooth scroll behavior */
            html {
                scroll-behavior: smooth;
            }

            /* Scroll to top button hover */
            .scroll-to-top:hover {
                transform: scale(1.1) !important;
                box-shadow: 0 6px 24px rgba(6, 182, 212, 0.6) !important;
            }

            /* Reduce motion for accessibility */
            @media (prefers-reduced-motion: reduce) {
                html {
                    scroll-behavior: auto;
                }

                .reveal,
                .reveal-left,
                .reveal-right,
                .reveal-scale {
                    transition: none !important;
                    opacity: 1 !important;
                    transform: none !important;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Inicialización
     */
    function init() {
        log('✨ Inicializando scroll animations...');

        // Agregar estilos
        addAnimationStyles();

        // Fade in hero
        fadeInHero();

        // Inicializar componentes
        const scrollReveal = new ScrollReveal();
        const smoothScroll = new SmoothScroll();
        const parallax = new ParallaxEffect();
        const progressBar = new ScrollProgressBar();
        const scrollToTop = new ScrollToTop();
        const counterAnimation = new CounterAnimation();

        log('🎉 Scroll animations inicializadas correctamente!');

        // Exponer para debug
        window.scrollAnimations = {
            scrollReveal,
            smoothScroll,
            parallax,
            progressBar,
            scrollToTop,
            counterAnimation,
        };
    }

    // Ejecutar al cargar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
