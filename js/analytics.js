/**
 * BitForward - Google Analytics 4 Integration
 * Quick Win #2: Visibilidad de usuarios y comportamiento
 * 
 * Features:
 * - Page view tracking
 * - Event tracking (wallet connections, forwards, etc)
 * - User engagement metrics
 * - Conversion tracking
 */

class BitForwardAnalytics {
    constructor() {
        this.ga4MeasurementId = 'G-XXXXXXXXXX'; // Reemplazar con tu ID real
        this.initialized = false;
        this.queue = [];
        
        this.init();
    }

    /**
     * Inicializar Google Analytics 4
     */
    init() {
        // Verificar si ya está cargado
        if (window.gtag) {
            this.initialized = true;
            console.log('✅ Google Analytics ya inicializado');
            return;
        }

        // Cargar Google Analytics 4 de forma asíncrona
        this.loadGA4Script();
    }

    /**
     * Cargar script de GA4
     */
    loadGA4Script() {
        // Crear script tag
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${this.ga4MeasurementId}`;
        
        script.onload = () => {
            // Inicializar gtag
            window.dataLayer = window.dataLayer || [];
            window.gtag = function() {
                window.dataLayer.push(arguments);
            };
            
            gtag('js', new Date());
            gtag('config', this.ga4MeasurementId, {
                'send_page_view': true,
                'anonymize_ip': true,
                'cookie_flags': 'SameSite=None;Secure'
            });
            
            this.initialized = true;
            console.log('✅ Google Analytics 4 inicializado');
            
            // Procesar eventos en queue
            this.processQueue();
            
            // Setup automatic tracking
            this.setupAutomaticTracking();
        };
        
        script.onerror = () => {
            console.error('❌ Error cargando Google Analytics');
        };
        
        document.head.appendChild(script);
    }

    /**
     * Procesar eventos que llegaron antes de inicializar
     */
    processQueue() {
        if (this.queue.length > 0) {
            console.log(`📊 Procesando ${this.queue.length} eventos pendientes...`);
            this.queue.forEach(event => {
                this.trackEvent(event.name, event.params);
            });
            this.queue = [];
        }
    }

    /**
     * Setup de tracking automático
     */
    setupAutomaticTracking() {
        // Track page views en SPAs
        this.trackPageViews();
        
        // Track clicks en botones importantes
        this.trackButtonClicks();
        
        // Track errores
        this.trackErrors();
    }

    /**
     * Track page views (para SPAs)
     */
    trackPageViews() {
        // Observar cambios en la URL
        let lastPath = location.pathname;
        
        const observer = new MutationObserver(() => {
            if (location.pathname !== lastPath) {
                lastPath = location.pathname;
                this.pageView(location.pathname);
            }
        });
        
        observer.observe(document.querySelector('title'), {
            childList: true
        });
    }

    /**
     * Track clicks en botones importantes
     */
    trackButtonClicks() {
        // Wallet connection buttons
        document.addEventListener('click', (e) => {
            const target = e.target.closest('button, a');
            if (!target) return;
            
            const text = target.textContent.trim();
            
            // Wallet buttons
            if (text.includes('Conectar') || text.includes('Connect Wallet')) {
                this.trackEvent('wallet_connect_clicked', {
                    button_text: text,
                    button_location: this.getElementLocation(target)
                });
            }
            
            // Forward contract buttons
            if (text.includes('Forward') || text.includes('Contrato')) {
                this.trackEvent('forward_button_clicked', {
                    button_text: text,
                    button_location: this.getElementLocation(target)
                });
            }
            
            // Lending buttons
            if (text.includes('Lending') || text.includes('Préstamo')) {
                this.trackEvent('lending_button_clicked', {
                    button_text: text,
                    button_location: this.getElementLocation(target)
                });
            }
        });
    }

    /**
     * Track errores de JavaScript
     */
    trackErrors() {
        window.addEventListener('error', (event) => {
            this.trackEvent('javascript_error', {
                error_message: event.message,
                error_file: event.filename,
                error_line: event.lineno,
                error_column: event.colno
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.trackEvent('promise_rejection', {
                reason: event.reason?.message || String(event.reason)
            });
        });
    }

    /**
     * Track page view
     * @param {string} path - URL path
     */
    pageView(path) {
        if (!this.initialized) {
            this.queue.push({ name: 'page_view', params: { page_path: path } });
            return;
        }

        gtag('event', 'page_view', {
            page_path: path,
            page_title: document.title,
            page_location: window.location.href
        });
        
        console.log(`📊 Page view: ${path}`);
    }

    /**
     * Track evento personalizado
     * @param {string} eventName - Nombre del evento
     * @param {Object} params - Parámetros del evento
     */
    trackEvent(eventName, params = {}) {
        if (!this.initialized) {
            this.queue.push({ name: eventName, params });
            return;
        }

        gtag('event', eventName, {
            ...params,
            timestamp: new Date().toISOString()
        });
        
        console.log(`📊 Event: ${eventName}`, params);
    }

    /**
     * Track wallet connection
     * @param {string} address - Wallet address
     * @param {string} provider - Wallet provider (MetaMask, etc)
     */
    trackWalletConnection(address, provider = 'unknown') {
        this.trackEvent('wallet_connected', {
            wallet_provider: provider,
            wallet_address: address.slice(0, 6) + '...' + address.slice(-4) // Privacy-friendly
        });
    }

    /**
     * Track forward contract creation
     * @param {Object} contractData - Contract details
     */
    trackForwardCreation(contractData) {
        this.trackEvent('forward_contract_created', {
            asset: contractData.asset,
            leverage: contractData.leverage,
            direction: contractData.isLong ? 'long' : 'short',
            notional_value: contractData.notionalValue
        });
    }

    /**
     * Track lending operation
     * @param {string} action - 'deposit' or 'withdraw'
     * @param {Object} data - Operation details
     */
    trackLending(action, data) {
        this.trackEvent(`lending_${action}`, {
            amount: data.amount,
            asset: data.asset,
            apy: data.apy
        });
    }

    /**
     * Track conversion (goal completion)
     * @param {string} goalName - Name of the goal
     * @param {number} value - Value of conversion
     */
    trackConversion(goalName, value = 0) {
        this.trackEvent('conversion', {
            goal_name: goalName,
            value: value,
            currency: 'USD'
        });
    }

    /**
     * Track user timing (performance)
     * @param {string} category - Category (e.g., 'Load Time')
     * @param {string} variable - Variable name
     * @param {number} time - Time in milliseconds
     */
    trackTiming(category, variable, time) {
        this.trackEvent('timing_complete', {
            name: variable,
            value: time,
            event_category: category
        });
    }

    /**
     * Get element location in page
     * @param {HTMLElement} element
     * @returns {string}
     */
    getElementLocation(element) {
        const rect = element.getBoundingClientRect();
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        if (rect.top + scrollY < window.innerHeight) {
            return 'above_fold';
        } else if (rect.top + scrollY < window.innerHeight * 2) {
            return 'below_fold_1';
        } else {
            return 'below_fold_2';
        }
    }

    /**
     * Track page load performance
     */
    trackPerformance() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    
                    if (perfData) {
                        this.trackTiming('Page Load', 'dom_content_loaded', perfData.domContentLoadedEventEnd);
                        this.trackTiming('Page Load', 'load_complete', perfData.loadEventEnd);
                        this.trackTiming('Page Load', 'dns_lookup', perfData.domainLookupEnd - perfData.domainLookupStart);
                    }
                }, 0);
            });
        }
    }
}

// Crear instancia global
window.bitForwardAnalytics = new BitForwardAnalytics();

// Auto-track performance
window.bitForwardAnalytics.trackPerformance();

// Track initial page view
if (document.readyState === 'complete') {
    window.bitForwardAnalytics.pageView(location.pathname);
} else {
    window.addEventListener('load', () => {
        window.bitForwardAnalytics.pageView(location.pathname);
    });
}

console.log('📊 BitForward Analytics initialized - Quick Win #2');

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BitForwardAnalytics;
}
