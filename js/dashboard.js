/**
 * BitForward Enterprise Dashboard JavaScript
 * Funcionalidad para la interfaz empresarial con integración de contratos y autenticación
 */

class BitForwardEnterprise {
    constructor() {
        this.apiClient = null;
        this.contractsData = [];
        this.currentContract = null;
        this.realTimeData = new Map();
        this.websocket = null;
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando BitForward Enterprise Dashboard...');
        
        // Verificar autenticación
        if (window.BitForwardAuth && window.BitForwardAuth.isAuthenticated()) {
            console.log('✅ Usuario autenticado, cargando dashboard completo');
        } else {
            console.log('ℹ️ Usuario no autenticado, funcionalidad limitada');
        }
        
        // Esperar a que el sistema de i18n esté listo
        if (window.i18n) {
            window.i18n.translatePage();
        }
        
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
            ? 'http://localhost:3000/api' 
            : '/api';
        
        this.apiClient = {
            baseURL: apiUrl,
            
            async request(endpoint, options = {}) {
                try {
                    const url = `${this.baseURL}${endpoint}`;
                    
                    // Agregar token de autenticación si está disponible
                    const headers = {
                        'Content-Type': 'application/json',
                        ...options.headers
                    };
                    
                    if (window.BitForwardAuth && window.BitForwardAuth.isAuthenticated()) {
                        const token = localStorage.getItem('bitforward_token');
                        if (token) {
                            headers['x-auth-token'] = token;
                        }
                    }
                    
                    const response = await fetch(url, {
                        headers,
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

        // Event listeners para contratos
        this.setupContractListeners();

        // Responsive menu toggle
        this.setupMobileMenu();
    }

    setupContractListeners() {
        // Botón de actualizar contratos
        const refreshButton = document.getElementById('refresh-contracts-btn');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.loadUserContracts();
                this.showNotification('Contratos actualizados', 'success');
            });
        }

        // Botón de cerrar detalles
        const closeDetailsBtn = document.getElementById('close-details-btn');
        if (closeDetailsBtn) {
            closeDetailsBtn.addEventListener('click', () => {
                this.hideContractDetailsSection();
            });
        }

        // Botones de acciones del contrato
        const shareContractBtn = document.getElementById('share-contract-btn');
        const modifyContractBtn = document.getElementById('modify-contract-btn');
        const cancelContractBtn = document.getElementById('cancel-contract-btn');

        if (shareContractBtn) {
            shareContractBtn.addEventListener('click', () => {
                if (this.currentContract) {
                    this.shareContract(this.currentContract.id);
                }
            });
        }

        if (modifyContractBtn) {
            modifyContractBtn.addEventListener('click', () => {
                if (this.currentContract) {
                    this.showNotification('Funcionalidad de modificación próximamente', 'info');
                }
            });
        }

        if (cancelContractBtn) {
            cancelContractBtn.addEventListener('click', () => {
                if (this.currentContract) {
                    this.confirmCancelContract(this.currentContract.id);
                }
            });
        }
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
            
            // Cargar contratos del usuario si está autenticado
            if (window.BitForwardAuth && window.BitForwardAuth.isAuthenticated()) {
                await this.loadUserContracts();
            }
            
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
        
        // Verificar autenticación
        if (!this.isUserAuthenticated()) {
            const message = window.i18n ? window.i18n.t('notification.login.required') : 'Debes iniciar sesión para acceder a este producto';
            this.showNotification(message, 'warning');
            // Trigger login modal if auth system is available
            if (window.BitForwardAuth) {
                window.BitForwardAuth.openModal('login-modal');
            }
            return;
        }
        
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
        if (!this.isUserAuthenticated()) {
            this.showNotification('Inicia sesión para crear contratos forward', 'warning');
            return;
        }
        this.showNotification('Abriendo creador de contratos forward...', 'info');
        // Aquí se abriría el modal para crear un contrato forward
    }

    openLoanModal() {
        if (!this.isUserAuthenticated()) {
            this.showNotification('Inicia sesión para acceder a préstamos', 'warning');
            return;
        }
        // Redirigir a la página de préstamos
        window.location.href = '/lending.html';
    }

    openInsuranceModal() {
        if (!this.isUserAuthenticated()) {
            this.showNotification('Inicia sesión para contratar seguros', 'warning');
            return;
        }
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

    // Verificar si el usuario está autenticado
    isUserAuthenticated() {
        return window.BitForwardAuth && window.BitForwardAuth.isAuthenticated();
    }

    // Obtener datos del usuario actual
    getCurrentUser() {
        return window.BitForwardAuth ? window.BitForwardAuth.getCurrentUser() : null;
    }

    // --- MÉTODOS DE GESTIÓN DE CONTRATOS ---

    async loadUserContracts() {
        try {
            if (!window.BitForwardAuth || !window.BitForwardAuth.isAuthenticated()) {
                this.showNoContracts();
                return;
            }

            const response = await this.apiClient.request('/contracts');
            if (response.success) {
                this.contractsData = response.contracts || [];
                this.renderContractsTable();
            } else {
                console.error('Error cargando contratos:', response.msg);
                this.showNoContracts();
            }
        } catch (error) {
            console.error('Error cargando contratos del usuario:', error);
            this.showNoContracts();
        }
    }

    renderContractsTable() {
        const tableBody = document.getElementById('contracts-table-body');
        const noContractsMessage = document.getElementById('no-contracts-message');
        const contractsTable = document.getElementById('contracts-table');

        if (!tableBody) return;

        if (this.contractsData.length === 0) {
            this.showNoContracts();
            return;
        }

        // Mostrar tabla y ocultar mensaje de "no contratos"
        if (contractsTable) contractsTable.style.display = 'table';
        if (noContractsMessage) noContractsMessage.style.display = 'none';

        tableBody.innerHTML = this.contractsData.map(contract => `
            <tr class="contract-row" data-contract-id="${contract.id}" onclick="window.bitForwardDashboard.showContractDetails('${contract.id}')">
                <td>
                    <span class="bf-contract-id">${contract.id.substring(0, 12)}...</span>
                </td>
                <td>
                    <div class="bf-contract-asset">
                        <strong>${contract.asset}</strong>
                    </div>
                </td>
                <td>
                    <span class="bf-contract-amount">${contract.amount} ${contract.asset}</span>
                </td>
                <td>
                    <span class="bf-contract-price">$${contract.strikePrice.toLocaleString()}</span>
                </td>
                <td>
                    ${new Date(contract.expirationDate).toLocaleDateString()}
                </td>
                <td>
                    <span class="bf-contract-status ${contract.status.toLowerCase()}">
                        <i class="fas fa-circle"></i>
                        ${this.getStatusText(contract.status)}
                    </span>
                </td>
                <td>
                    <div class="bf-contract-actions">
                        <button class="bf-btn bf-btn-table bf-btn-primary" onclick="event.stopPropagation(); window.bitForwardDashboard.showContractDetails('${contract.id}')">
                            <i class="fas fa-eye"></i>
                            Ver
                        </button>
                        <button class="bf-btn bf-btn-table bf-btn-secondary" onclick="event.stopPropagation(); window.bitForwardDashboard.shareContract('${contract.id}')">
                            <i class="fas fa-share-alt"></i>
                            Compartir
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    showNoContracts() {
        const tableBody = document.getElementById('contracts-table-body');
        const noContractsMessage = document.getElementById('no-contracts-message');
        const contractsTable = document.getElementById('contracts-table');

        if (tableBody) tableBody.innerHTML = '';
        if (contractsTable) contractsTable.style.display = 'none';
        if (noContractsMessage) noContractsMessage.style.display = 'block';
    }

    async showContractDetails(contractId) {
        try {
            const response = await this.apiClient.request(`/contracts/${contractId}`);
            if (response.success) {
                this.currentContract = response.contract;
                this.renderContractDetails(response.contract);
                this.showContractDetailsSection();
            } else {
                console.error('Error cargando detalles del contrato:', response.msg);
                this.showNotification('Error al cargar los detalles del contrato', 'error');
            }
        } catch (error) {
            console.error('Error obteniendo detalles del contrato:', error);
            this.showNotification('Error de conexión al cargar el contrato', 'error');
        }
    }

    renderContractDetails(contract) {
        const detailsContent = document.getElementById('contract-details-content');
        const contractIdElement = document.getElementById('detail-contract-id');

        if (!detailsContent || !contractIdElement) return;

        contractIdElement.textContent = contract.id;

        const createdDate = new Date(contract.createdAt).toLocaleString();
        const expirationDate = new Date(contract.expirationDate).toLocaleString();
        const daysUntilExpiration = Math.ceil((new Date(contract.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));

        detailsContent.innerHTML = `
            <div class="bf-detail-item large-value">
                <h4>ID del Contrato</h4>
                <p>${contract.id}</p>
            </div>
            <div class="bf-detail-item status">
                <h4>Estado</h4>
                <p class="${contract.status.toLowerCase()}">${this.getStatusText(contract.status)}</p>
            </div>
            <div class="bf-detail-item amount">
                <h4>Monto del Contrato</h4>
                <p>${contract.amount} ${contract.asset}</p>
            </div>
            <div class="bf-detail-item price">
                <h4>Precio de Ejercicio</h4>
                <p>$${contract.strikePrice.toLocaleString()}</p>
            </div>
            <div class="bf-detail-item">
                <h4>Activo Base</h4>
                <p>${contract.asset}</p>
            </div>
            <div class="bf-detail-item">
                <h4>Tipo de Contrato</h4>
                <p>${contract.type || 'Forward'}</p>
            </div>
            <div class="bf-detail-item">
                <h4>Fecha de Creación</h4>
                <p>${createdDate}</p>
            </div>
            <div class="bf-detail-item">
                <h4>Fecha de Vencimiento</h4>
                <p>${expirationDate}</p>
            </div>
            <div class="bf-detail-item">
                <h4>Días hasta Vencimiento</h4>
                <p>${daysUntilExpiration > 0 ? daysUntilExpiration : 'Expirado'}</p>
            </div>
            <div class="bf-detail-item">
                <h4>Valor Actual del Activo</h4>
                <p id="current-asset-price">Cargando...</p>
            </div>
            <div class="bf-detail-item">
                <h4>P&L Estimado</h4>
                <p id="estimated-pnl">Calculando...</p>
            </div>
            <div class="bf-detail-item">
                <h4>Usuario Creador</h4>
                <p>${contract.createdBy || 'Sistema'}</p>
            </div>
        `;

        // Cargar precio actual del activo y calcular P&L
        this.updateContractMetrics(contract);
    }

    async updateContractMetrics(contract) {
        try {
            // Simular obtención del precio actual (en producción, llamaría a una API de precios)
            const currentPrices = {
                'BTC': 67234.56,
                'ETH': 3456.78,
                'SOL': 156.78
            };

            const currentPrice = currentPrices[contract.asset] || contract.strikePrice;
            const pnl = (currentPrice - contract.strikePrice) * contract.amount;
            const pnlPercentage = ((currentPrice - contract.strikePrice) / contract.strikePrice * 100);

            // Actualizar UI
            const currentPriceElement = document.getElementById('current-asset-price');
            const pnlElement = document.getElementById('estimated-pnl');

            if (currentPriceElement) {
                currentPriceElement.textContent = `$${currentPrice.toLocaleString()}`;
            }

            if (pnlElement) {
                const pnlClass = pnl >= 0 ? 'positive' : 'negative';
                const pnlSign = pnl >= 0 ? '+' : '';
                pnlElement.innerHTML = `
                    <span class="${pnlClass}">
                        ${pnlSign}$${pnl.toLocaleString()} 
                        (${pnlSign}${pnlPercentage.toFixed(2)}%)
                    </span>
                `;
            }
        } catch (error) {
            console.error('Error actualizando métricas del contrato:', error);
        }
    }

    showContractDetailsSection() {
        const detailsSection = document.getElementById('contract-details-section');
        if (detailsSection) {
            detailsSection.style.display = 'block';
            detailsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    hideContractDetailsSection() {
        const detailsSection = document.getElementById('contract-details-section');
        if (detailsSection) {
            detailsSection.style.display = 'none';
        }
    }

    getStatusText(status) {
        if (window.i18n) {
            return window.i18n.t(`status.${status}`) || status;
        }
        
        const statusMap = {
            'active': 'Activo',
            'pending': 'Pendiente',
            'expired': 'Expirado',
            'completed': 'Completado',
            'cancelled': 'Cancelado'
        };
        return statusMap[status] || status;
    }

    async shareContract(contractId) {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Contrato BitForward',
                    text: `Ver detalles del contrato ${contractId}`,
                    url: `${window.location.origin}/contract/${contractId}`
                });
            } else {
                // Fallback: copiar al portapapeles
                const url = `${window.location.origin}/contract/${contractId}`;
                await navigator.clipboard.writeText(url);
                this.showNotification('Enlace del contrato copiado al portapapeles', 'success');
            }
        } catch (error) {
            console.error('Error compartiendo contrato:', error);
            this.showNotification('Error al compartir el contrato', 'error');
        }
    }

    // --- FUNCIONES DE CREACIÓN DE FORWARD CONTRACTS ---

    openForwardModal() {
        const modal = this.createForwardModal();
        document.body.appendChild(modal);
        
        // Inicializar Web3 si está disponible
        if (window.web3Instance) {
            console.log('🔗 Web3 disponible para transacciones');
        } else {
            console.log('⚠️ Web3 no disponible, usando simulación');
        }
    }

    createForwardModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-gradient-to-br from-bf-dark via-blue-900 to-bf-primary rounded-2xl p-8 max-w-2xl w-full mx-4 border border-white/20">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-white">Crear Forward Contract</h2>
                    <button onclick="this.closest('.fixed').remove()" class="text-white hover:text-bf-secondary transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <form id="forward-form" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="collateral" class="block text-sm font-medium text-blue-200 mb-2">
                                Colateral (BTC)
                            </label>
                            <input 
                                type="number" 
                                id="collateral" 
                                step="0.001" 
                                min="0.001"
                                class="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:border-bf-secondary focus:outline-none"
                                placeholder="0.1"
                                required
                            >
                        </div>
                        
                        <div>
                            <label for="notional" class="block text-sm font-medium text-blue-200 mb-2">
                                Valor Nocional (USD)
                            </label>
                            <input 
                                type="number" 
                                id="notional" 
                                step="100" 
                                min="1000"
                                class="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:border-bf-secondary focus:outline-none"
                                placeholder="10000"
                                required
                            >
                        </div>
                        
                        <div>
                            <label for="leverage" class="block text-sm font-medium text-blue-200 mb-2">
                                Apalancamiento
                            </label>
                            <select 
                                id="leverage" 
                                class="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white focus:border-bf-secondary focus:outline-none"
                            >
                                <option value="1">1x - Sin apalancamiento</option>
                                <option value="2">2x - Apalancamiento moderado</option>
                                <option value="5">5x - Apalancamiento alto</option>
                                <option value="10">10x - Apalancamiento extremo</option>
                            </select>
                        </div>
                        
                        <div>
                            <label for="direction" class="block text-sm font-medium text-blue-200 mb-2">
                                Dirección
                            </label>
                            <select 
                                id="direction" 
                                class="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white focus:border-bf-secondary focus:outline-none"
                            >
                                <option value="true">Long (Compra a futuro)</option>
                                <option value="false">Short (Venta a futuro)</option>
                            </select>
                        </div>
                        
                        <div class="md:col-span-2">
                            <label for="expiry" class="block text-sm font-medium text-blue-200 mb-2">
                                Días hasta vencimiento
                            </label>
                            <select 
                                id="expiry" 
                                class="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white focus:border-bf-secondary focus:outline-none"
                            >
                                <option value="7">7 días</option>
                                <option value="14">14 días</option>
                                <option value="30" selected>30 días</option>
                                <option value="60">60 días</option>
                                <option value="90">90 días</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
                        <h3 class="text-lg font-semibold text-white mb-3">Resumen del Contrato</h3>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-blue-200">Precio actual BTC:</span>
                                <span class="text-white font-medium ml-2">$67,234.56</span>
                            </div>
                            <div>
                                <span class="text-blue-200">Margen requerido:</span>
                                <span class="text-white font-medium ml-2" id="required-margin">Calculando...</span>
                            </div>
                            <div>
                                <span class="text-blue-200">Liquidación estimada:</span>
                                <span class="text-white font-medium ml-2" id="liquidation-price">Calculando...</span>
                            </div>
                            <div>
                                <span class="text-blue-200">Comisión:</span>
                                <span class="text-white font-medium ml-2">0.1%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex space-x-4">
                        <button 
                            type="button" 
                            onclick="this.closest('.fixed').remove()"
                            class="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            class="flex-1 px-6 py-3 bg-gradient-to-r from-bf-secondary to-yellow-400 text-black font-medium rounded-lg hover:shadow-crypto-glow transition-all duration-300"
                        >
                            Crear Forward Contract
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Agregar event listener al formulario
        modal.querySelector('#forward-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitForward();
        });
        
        // Agregar listeners para cálculos en tiempo real
        this.setupForwardCalculations(modal);
        
        return modal;
    }

    setupForwardCalculations(modal) {
        const inputs = modal.querySelectorAll('#collateral, #notional, #leverage');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateForwardCalculations(modal);
            });
        });
        
        // Cálculo inicial
        setTimeout(() => this.updateForwardCalculations(modal), 100);
    }

    updateForwardCalculations(modal) {
        const collateral = parseFloat(modal.querySelector('#collateral').value) || 0;
        const notional = parseFloat(modal.querySelector('#notional').value) || 0;
        const leverage = parseFloat(modal.querySelector('#leverage').value) || 1;
        
        const btcPrice = 67234.56; // En producción vendría de un oráculo
        const requiredMargin = (notional / leverage) / btcPrice;
        const liquidationPrice = btcPrice * (1 - (1 / leverage) * 0.8); // 80% del margen
        
        const marginElement = modal.querySelector('#required-margin');
        const liquidationElement = modal.querySelector('#liquidation-price');
        
        if (marginElement) {
            marginElement.textContent = `${requiredMargin.toFixed(4)} BTC`;
        }
        
        if (liquidationElement) {
            liquidationElement.textContent = `$${liquidationPrice.toLocaleString()}`;
        }
    }

    async submitForward() {
        const collateral = document.getElementById('collateral').value;
        const notional = document.getElementById('notional').value;
        const leverage = document.getElementById('leverage').value;
        const isLong = document.getElementById('direction').value === 'true';
        const expiry = document.getElementById('expiry').value;
        
        if (!collateral || !notional || !expiry) {
            this.showNotification('Por favor completa todos los campos', 'error');
            return;
        }
        
        try {
            this.showNotification('Creando forward contract...', 'info');
            
            let result;
            
            // Intentar usar Web3 si está disponible
            if (window.web3Instance && window.web3Instance.createForward) {
                result = await window.web3Instance.createForward({
                    collateral: parseFloat(collateral),
                    notionalUSD: parseFloat(notional),
                    expiryDays: parseInt(expiry),
                    leverage: parseFloat(leverage),
                    isLong: isLong
                });
            } else {
                // Fallback: simulación para desarrollo
                result = await this.simulateForwardCreation({
                    collateral: parseFloat(collateral),
                    notionalUSD: parseFloat(notional),
                    expiryDays: parseInt(expiry),
                    leverage: parseFloat(leverage),
                    isLong: isLong
                });
            }
            
            if (result.success) {
                this.showNotification(`Forward creado exitosamente! ID: ${result.forwardId}`, 'success');
                document.querySelector('.fixed').remove();
                this.loadUserContracts(); // Actualizar la lista de contratos
            } else {
                this.showNotification('Error creando forward: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error en submitForward:', error);
            this.showNotification('Error: ' + error.message, 'error');
        }
    }

    async simulateForwardCreation(params) {
        // Simulación para desarrollo y testing
        return new Promise((resolve) => {
            setTimeout(() => {
                const forwardId = 'FWD_' + Date.now().toString(36).toUpperCase();
                resolve({
                    success: true,
                    forwardId: forwardId,
                    txHash: '0x' + Math.random().toString(16).substr(2, 64)
                });
            }, 2000); // Simular delay de transacción
        });
    }

    // Sobrescribir la función openForwardContractModal para usar el nuevo modal
    openForwardContractModal() {
        if (!this.isUserAuthenticated()) {
            this.showNotification('Inicia sesión para crear contratos forward', 'warning');
            return;
        }
        this.openForwardModal();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.bitForwardDashboard = new BitForwardEnterprise();
    window.BitForwardEnterprise = new BitForwardEnterprise();
});

// Funciones globales para el dashboard
window.submitForward = async function() {
    if (window.bitForwardDashboard) {
        return await window.bitForwardDashboard.submitForward();
    } else {
        console.error('Dashboard no inicializado');
    }
};

window.showForwardModal = function() {
    if (window.bitForwardDashboard) {
        window.bitForwardDashboard.openForwardModal();
    }
};

window.loadRealTimeData = function() {
    if (window.bitForwardDashboard) {
        window.bitForwardDashboard.loadUserContracts();
        window.bitForwardDashboard.loadAssetPrices();
    }
};

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BitForwardEnterprise;
}
