/**
 * BitForward Enterprise Dashboard JavaScript
 * Funcionalidad para la interfaz empresarial
 */

class BitForwardEnterprise {
    constructor() {
        this.apiClient = null;
        this.realTimeData = new Map();
        this.websocket = null;
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando BitForward Enterprise Dashboard...');
        
        // Inicializar conexiones
        await this.initializeAPI();
        this.initializeWebSocket();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Cargar datos iniciales
        await this.loadInitialData();
        
        // Iniciar actualizaciones en tiempo real
        this.startRealTimeUpdates();
        
        console.log('✅ Dashboard empresarial listo');
    }

    async initializeAPI() {
        // Conexión con el backend
        const apiUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3001/api' 
            : '/api';
        
        this.apiClient = {
            baseURL: apiUrl,
            
            async request(endpoint, options = {}) {
                try {
                    const url = `${this.baseURL}${endpoint}`;
                    const response = await fetch(url, {
                        headers: {
                            'Content-Type': 'application/json',
                            ...options.headers
                        },
                        ...options
                    });
                    
                    if (!response.ok) {
                        throw new Error(`API Error: ${response.status}`);
                    }
                    
                    return await response.json();
                } catch (error) {
                    console.error('API Request failed:', error);
                    throw error;
                }
            }
        };
    }

    initializeWebSocket() {
        // Simulación de WebSocket para datos en tiempo real
        // En producción, esto sería una conexión real a un WebSocket
        this.websocket = {
            connected: false,
            connect: () => {
                console.log('📡 Simulando conexión WebSocket para datos en tiempo real');
                this.websocket.connected = true;
            },
            disconnect: () => {
                this.websocket.connected = false;
            }
        };
        
        this.websocket.connect();
    }

    setupEventListeners() {
        // Navegación
        document.querySelectorAll('.bf-nav-link').forEach(link => {
            link.addEventListener('click', this.handleNavigation.bind(this));
        });

        // Botones de productos
        document.querySelectorAll('.bf-product-card .bf-btn').forEach(btn => {
            btn.addEventListener('click', this.handleProductAction.bind(this));
        });

        // Tarjetas de activos
        document.querySelectorAll('.bf-asset-card').forEach(card => {
            card.addEventListener('click', this.handleAssetSelection.bind(this));
        });

        // Responsive menu toggle
        this.setupMobileMenu();
    }

    setupMobileMenu() {
        // Crear botón de menú móvil si no existe
        const header = document.querySelector('.bf-header-content');
        if (header && !header.querySelector('.bf-mobile-menu-toggle')) {
            const mobileToggle = document.createElement('button');
            mobileToggle.className = 'bf-mobile-menu-toggle';
            mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
            mobileToggle.style.display = 'none';
            
            mobileToggle.addEventListener('click', () => {
                const nav = document.querySelector('.bf-nav');
                nav.classList.toggle('bf-nav-open');
            });
            
            header.appendChild(mobileToggle);
        }
    }

    async loadInitialData() {
        console.log('📊 Cargando datos iniciales del dashboard...');
        
        try {
            // Cargar métricas principales
            await this.loadKPIs();
            
            // Cargar precios de activos
            await this.loadAssetPrices();
            
            // Cargar contratos recientes
            await this.loadRecentContracts();
            
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
            this.showNotification('Error cargando datos', 'error');
        }
    }

    async loadKPIs() {
        // Datos simulados - en producción vendrían del backend
        const kpis = {
            tvl: { value: 24500000, change: 15.2 },
            activeContracts: { value: 1247, change: 8.7 },
            uptime: { value: 98.9, change: 0 },
            dailyRevenue: { value: 156000, change: 23.1 }
        };

        this.updateKPIsDisplay(kpis);
    }

    updateKPIsDisplay(kpis) {
        const metrics = document.querySelectorAll('.bf-metric');
        
        metrics.forEach(metric => {
            const value = metric.querySelector('.bf-metric-value');
            const change = metric.querySelector('.bf-metric-change');
            
            if (value && change) {
                // Animación de conteo
                this.animateCounter(value, value.textContent);
                
                // Actualizar cambio
                this.updateChangeIndicator(change);
            }
        });
    }

    async loadAssetPrices() {
        // Simulación de precios en tiempo real
        const assets = [
            { symbol: 'BTC', price: 67234.56, change: 2.34 },
            { symbol: 'ETH', price: 3456.78, change: 1.23 },
            { symbol: 'SOL', price: 156.78, change: -0.45 },
            { symbol: 'USDT', price: 1.00, change: 0.00 }
        ];

        this.updateAssetPrices(assets);
        this.updatePriceTicker(assets.slice(0, 3)); // Solo mostrar 3 en el ticker
    }

    updateAssetPrices(assets) {
        assets.forEach(asset => {
            const assetCard = document.querySelector(`.bf-asset-icon.${asset.symbol.toLowerCase()}`);
            if (assetCard) {
                const card = assetCard.closest('.bf-asset-card');
                const priceElement = card.querySelector('.bf-price');
                const changeElement = card.querySelector('.bf-change');
                
                if (priceElement) {
                    priceElement.textContent = `$${asset.price.toLocaleString()}`;
                }
                
                if (changeElement) {
                    this.updatePriceChange(changeElement, asset.change);
                }
            }
        });
    }

    updatePriceTicker(assets) {
        const ticker = document.querySelector('.bf-price-ticker');
        if (ticker) {
            ticker.innerHTML = assets.map(asset => `
                <div class="bf-price-item">
                    <span class="bf-asset">${asset.symbol}/USD</span>
                    <span class="bf-price">${this.formatPrice(asset.price)}</span>
                    <span class="bf-change ${asset.change >= 0 ? 'positive' : 'negative'}">
                        ${asset.change >= 0 ? '+' : ''}${asset.change.toFixed(2)}%
                    </span>
                </div>
            `).join('');
        }
    }

    async loadRecentContracts() {
        // Datos simulados de contratos recientes
        const contracts = [
            { id: 'ct_001', type: 'forward', amount: 1.5, asset: 'BTC', status: 'active' },
            { id: 'ct_002', type: 'loan', amount: 50000, asset: 'USDT', status: 'pending' },
            { id: 'ct_003', type: 'insurance', amount: 10, asset: 'ETH', status: 'active' }
        ];

        this.displayRecentActivity(contracts);
    }

    displayRecentActivity(contracts) {
        // Esta función podría mostrar una sección de actividad reciente
        console.log('📋 Contratos recientes:', contracts);
    }

    startRealTimeUpdates() {
        // Actualizar precios cada 5 segundos
        setInterval(() => {
            if (this.websocket.connected) {
                this.updateRealTimePrices();
            }
        }, 5000);

        // Actualizar KPIs cada 30 segundos
        setInterval(() => {
            this.updateRealTimeKPIs();
        }, 30000);
    }

    updateRealTimePrices() {
        // Simulación de fluctuaciones de precios
        const priceElements = document.querySelectorAll('.bf-price-item .bf-price');
        priceElements.forEach(element => {
            const currentPrice = parseFloat(element.textContent.replace(/[$,]/g, ''));
            const fluctuation = (Math.random() - 0.5) * 0.02; // ±1% máximo
            const newPrice = currentPrice * (1 + fluctuation);
            
            element.textContent = this.formatPrice(newPrice);
            
            // Efecto visual de actualización
            element.style.background = fluctuation > 0 ? 'rgba(0, 212, 170, 0.1)' : 'rgba(232, 67, 147, 0.1)';
            setTimeout(() => {
                element.style.background = '';
            }, 1000);
        });
    }

    updateRealTimeKPIs() {
        // Simulación de cambios en KPIs
        const metrics = document.querySelectorAll('.bf-metric-value');
        metrics.forEach(metric => {
            // Pequeñas fluctuaciones realistas
            const currentValue = parseFloat(metric.textContent.replace(/[$,M]/g, ''));
            const change = (Math.random() - 0.5) * 0.001; // Cambio muy pequeño
            
            // Aplicar efecto de actualización sutil
            metric.style.transition = 'all 0.3s ease';
            metric.style.transform = 'scale(1.02)';
            setTimeout(() => {
                metric.style.transform = 'scale(1)';
            }, 300);
        });
    }

    handleNavigation(event) {
        event.preventDefault();
        const link = event.currentTarget;
        const target = link.getAttribute('href');
        
        // Remover clase activa de todos los links
        document.querySelectorAll('.bf-nav-link').forEach(l => l.classList.remove('active'));
        
        // Agregar clase activa al link clickeado
        link.classList.add('active');
        
        // Simular navegación (en una SPA real, esto cambiaría la vista)
        console.log(`🧭 Navegando a: ${target}`);
        this.showNotification(`Navegando a ${link.textContent.trim()}`, 'info');
    }

    handleProductAction(event) {
        const btn = event.currentTarget;
        const productCard = btn.closest('.bf-product-card');
        const productTitle = productCard.querySelector('h3').textContent;
        
        console.log(`💼 Acción de producto: ${productTitle}`);
        
        // Mostrar modal o redirigir según el producto
        if (btn.textContent.includes('Crear Forward')) {
            this.openForwardContractModal();
        } else if (btn.textContent.includes('Préstamo')) {
            this.openLoanModal();
        } else if (btn.textContent.includes('Asegurar')) {
            this.openInsuranceModal();
        }
    }

    handleAssetSelection(event) {
        const card = event.currentTarget;
        const symbol = card.querySelector('.bf-asset-symbol').textContent;
        
        console.log(`🪙 Activo seleccionado: ${symbol}`);
        this.showAssetDetails(symbol);
    }

    openForwardContractModal() {
        this.showNotification('Abriendo creador de contratos forward...', 'info');
        // Aquí se abriría el modal para crear un contrato forward
    }

    openLoanModal() {
        this.showNotification('Abriendo solicitud de préstamo...', 'info');
        // Aquí se abriría el modal para solicitar un préstamo
    }

    openInsuranceModal() {
        this.showNotification('Abriendo cobertura de seguros...', 'info');
        // Aquí se abriría el modal para contratar seguro
    }

    showAssetDetails(symbol) {
        this.showNotification(`Mostrando detalles de ${symbol}`, 'info');
        // Aquí se mostrarían detalles del activo
    }

    showNotification(message, type = 'info') {
        // Crear notificación toast
        const notification = document.createElement('div');
        notification.className = `bf-notification bf-notification-${type}`;
        notification.innerHTML = `
            <div class="bf-notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Estilos para la notificación
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 24px',
            borderRadius: '12px',
            backgroundColor: this.getNotificationColor(type),
            color: 'white',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            zIndex: '9999',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        // Animar entrada
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });
        
        // Auto-remover después de 3 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationColor(type) {
        const colors = {
            success: '#00d4aa',
            error: '#e84393',
            warning: '#fdcb6e',
            info: '#74b9ff'
        };
        return colors[type] || '#74b9ff';
    }

    formatPrice(price) {
        if (price >= 1000) {
            return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
        } else {
            return `$${price.toFixed(4)}`;
        }
    }

    updatePriceChange(element, change) {
        element.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
        element.className = `bf-change ${change >= 0 ? 'positive' : change === 0 ? 'neutral' : 'negative'}`;
    }

    updateChangeIndicator(element) {
        // Animación sutil para indicadores de cambio
        element.style.transform = 'scale(1.05)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
    }

    animateCounter(element, targetValue) {
        // Animación de contador para valores numéricos
        const startValue = 0;
        const duration = 1000;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Función de easing
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            if (element && typeof targetValue === 'string') {
                // Para valores de texto, simplemente establecer al final
                if (progress === 1) {
                    element.textContent = targetValue;
                }
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.BitForwardEnterprise = new BitForwardEnterprise();
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BitForwardEnterprise;
}
