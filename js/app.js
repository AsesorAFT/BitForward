/**
 * BitForward App Manager v2.0
 * Gestión centralizada de la aplicación frontend
 */

class BitForwardApp {
    constructor() {
        this.currentScreen = 'loading';
        this.dashboard = null;
        this.blockchain = null;
        this.oracle = null;
        this.user = null;
        this.config = {
            apiBaseUrl: 'http://localhost:3001/api',
            retryAttempts: 3,
            requestTimeout: 10000
        };
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Initializing BitForward App v2.0');
        
        try {
            // Cargar servicios principales
            await this.loadServices();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Verificar autenticación existente
            await this.checkExistingAuth();
            
            // Mostrar pantalla de login después de loading
            setTimeout(() => {
                this.showLogin();
            }, 2000);
            
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Error al inicializar la aplicación');
        }
    }

    async loadServices() {
        // Inicializar servicios blockchain
        if (typeof BlockchainIntegration !== 'undefined') {
            this.blockchain = new BlockchainIntegration();
        }
        
        // Inicializar oracle de precios
        if (typeof BitForwardOracle !== 'undefined') {
            this.oracle = new BitForwardOracle();
        }
    }

    async checkExistingAuth() {
        const token = localStorage.getItem('bitforward_token');
        const userData = localStorage.getItem('bitforward_user');
        
        if (token && userData) {
            try {
                // Para demo, simplemente verificar que los datos existen localmente
                this.user = JSON.parse(userData);
                
                // Verificar que el token no haya expirado (24 horas)
                const tokenTime = parseInt(token.split('_')[2]);
                const currentTime = Date.now();
                const tokenAge = currentTime - tokenTime;
                const twentyFourHours = 24 * 60 * 60 * 1000;
                
                if (tokenAge < twentyFourHours) {
                    console.log('✅ Sesión válida encontrada para:', this.user.username);
                    this.showDashboard();
                    return;
                }
            } catch (error) {
                console.log('⚠️ Error al verificar sesión:', error);
            }
        }
        
        // Limpiar datos inválidos
        localStorage.removeItem('bitforward_token');
        localStorage.removeItem('bitforward_user');
        localStorage.removeItem('bitforward_refresh_token');
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Wallet connection buttons
        document.querySelectorAll('.wallet-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleWalletConnect(e.target.dataset.wallet);
            });
        });

        // FAB menu
        const fabMain = document.querySelector('.fab-main');
        if (fabMain) {
            fabMain.addEventListener('click', () => this.toggleFABMenu());
        }

        document.querySelectorAll('.fab-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.handleFABAction(e.target.closest('.fab-option').dataset.action);
            });
        });

        // Contract form
        const contractForm = document.getElementById('advanced-contract-form');
        if (contractForm) {
            contractForm.addEventListener('submit', (e) => this.handleAdvancedContractSubmission(e));
        }

        // Preview button
        const previewBtn = document.getElementById('preview-btn');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.previewContract());
        }

        // Modal handlers
        document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-close') || 
                    e.target.classList.contains('modal-backdrop')) {
                    this.closeModal();
                }
            });
        });

        // Real-time form updates
        const blockchainSelect = document.getElementById('contract-blockchain');
        if (blockchainSelect) {
            blockchainSelect.addEventListener('change', () => this.updateContractForm());
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const username = formData.get('username');
        const password = formData.get('password');

        const loginBtn = event.target.querySelector('.login-btn');
        const btnText = loginBtn.querySelector('.btn-text');
        const btnSpinner = loginBtn.querySelector('.btn-spinner');

        // Show loading
        btnText.style.display = 'none';
        btnSpinner.style.display = 'inline-block';
        loginBtn.disabled = true;

        try {
            // Simular autenticación local para demo
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
            
            // Validar credenciales de demo
            if ((username === 'demo' && password === 'password123') || 
                (username === 'admin' && password === 'admin123') ||
                (username.length >= 3 && password.length >= 6)) {
                
                // Simular datos de usuario
                this.user = {
                    username: username,
                    id: `user_${Date.now()}`,
                    wallets: {},
                    permissions: ['basic'],
                    loginTime: new Date().toISOString()
                };
                
                // Guardar en localStorage
                localStorage.setItem('bitforward_user', JSON.stringify(this.user));
                localStorage.setItem('bitforward_token', 'demo_token_' + Date.now());
                
                const message = window.i18n ? 
                    window.i18n.t('notification.login.success') : 
                    '¡Inicio de sesión exitoso! Bienvenido al Panel de BitForward';
                this.showNotification(message, 'success');
                
                setTimeout(() => {
                    this.showDashboard();
                }, 1000);
            } else {
                throw new Error('Credenciales incorrectas. Usa: demo/password123');
            }
        } catch (error) {
            const message = window.i18n ? 
                window.i18n.t('notification.login.failed') : 
                'Error en el inicio de sesión';
            this.showNotification(`${message}: ${error.message}`, 'error');
        } finally {
            btnText.style.display = 'inline';
            btnSpinner.style.display = 'none';
            loginBtn.disabled = false;
        }
    }

    async handleWalletConnect(walletType) {
        try {
            const message = window.i18n ? 
                window.i18n.t('notification.wallet.connecting') : 
                'Conectando a';
            this.showNotification(`${message} ${walletType}...`, 'info');
            
            // Simular conexión de wallet para demo
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Simular wallet conectada exitosamente
            this.user = {
                username: `wallet_${walletType}`,
                id: `wallet_${Date.now()}`,
                wallets: {
                    [walletType]: {
                        address: '0x' + Math.random().toString(16).substr(2, 40),
                        connected: true
                    }
                },
                permissions: ['basic', 'wallet'],
                loginTime: new Date().toISOString()
            };
            
            // Guardar en localStorage
            localStorage.setItem('bitforward_user', JSON.stringify(this.user));
            localStorage.setItem('bitforward_token', 'wallet_token_' + Date.now());
            
            const successMessage = window.i18n ? 
                window.i18n.t('notification.wallet.connected') : 
                'conectado exitosamente';
            this.showNotification(`${walletType} ${successMessage}!`, 'success');
            
            setTimeout(() => {
                this.showDashboard();
            }, 1000);
            
        } catch (error) {
            const errorMessage = window.i18n ? 
                window.i18n.t('notification.wallet.failed') : 
                'Error al conectar';
            this.showNotification(`${errorMessage} ${walletType}: ${error.message}`, 'error');
        }
    }

    getBlockchainFromWallet(walletType) {
        const mapping = {
            'metamask': 'ethereum',
            'phantom': 'solana',
            'bitcoin': 'bitcoin'
        };
        return mapping[walletType] || 'ethereum';
    }

    showDashboard() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('main-dashboard').style.display = 'block';
        document.getElementById('fab-menu').style.display = 'block';
        
        // Renderizar el dashboard completo directamente
        this.renderModernDashboard();
        
        this.currentScreen = 'dashboard';
    }

    renderModernDashboard() {
        const dashboardContainer = document.getElementById('main-dashboard');
        
        // Dashboard HTML completo con diseño moderno
        dashboardContainer.innerHTML = `
            <!-- Dashboard Header -->
            <div class="dashboard-header">
                <div class="dashboard-header-content">
                    <div class="user-info">
                        <div class="user-avatar">
                            <img src="assets/logo.svg" alt="User" class="avatar-img">
                        </div>
                        <div class="user-details">
                            <h2 class="bitforward-brand animated size-lg">BitForward</h2>
                            <p class="user-status">Bienvenido, ${this.user.username} • <span class="status-indicator">Activo</span></p>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn-header" onclick="window.bitForwardApp.logout()">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                            </svg>
                            Salir
                        </button>
                    </div>
                </div>
            </div>

            <!-- Portfolio Overview -->
            <div class="portfolio-overview">
                <div class="portfolio-card">
                    <div class="portfolio-header">
                        <h3>Resumen de Cartera</h3>
                        <span class="portfolio-time">Actualizado hace 2 min</span>
                    </div>
                    <div class="portfolio-stats">
                        <div class="stat-item">
                            <span class="stat-label">Valor Total</span>
                            <span class="stat-value">$47,583.20</span>
                            <span class="stat-change positive">+12.3%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">P&L 24h</span>
                            <span class="stat-value">+$2,341.50</span>
                            <span class="stat-change positive">+5.2%</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Contratos Activos</span>
                            <span class="stat-value">8</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Products Grid -->
            <div class="products-grid">
                <!-- Forward Contracts -->
                <div class="product-card gradient-primary" data-product="forward-contracts">
                    <div class="product-header">
                        <div class="product-icon">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/>
                            </svg>
                        </div>
                        <h3>Forward Contracts</h3>
                        <span class="product-badge">Principal</span>
                    </div>
                    <div class="product-stats">
                        <div class="stat-row">
                            <span>Contratos Activos:</span>
                            <span>5</span>
                        </div>
                        <div class="stat-row">
                            <span>Valor Nocional:</span>
                            <span>$23,450</span>
                        </div>
                        <div class="stat-row">
                            <span>P&L:</span>
                            <span class="positive">+$1,234</span>
                        </div>
                    </div>
                    <div class="product-actions">
                        <button class="btn-action primary">Crear Contrato</button>
                        <button class="btn-action secondary">Ver Historial</button>
                    </div>
                </div>

                <!-- DeFi Lending -->
                <div class="product-card gradient-secondary" data-product="defi-lending">
                    <div class="product-header">
                        <div class="product-icon">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                            </svg>
                        </div>
                        <h3>DeFi Lending</h3>
                        <span class="product-badge">Activo</span>
                    </div>
                    <div class="product-stats">
                        <div class="stat-row">
                            <span>Total Prestado:</span>
                            <span>$12,500</span>
                        </div>
                        <div class="stat-row">
                            <span>APY Promedio:</span>
                            <span>8.24%</span>
                        </div>
                        <div class="stat-row">
                            <span>Intereses:</span>
                            <span class="positive">+$89.34</span>
                        </div>
                    </div>
                    <div class="product-actions">
                        <button class="btn-action primary">Prestar</button>
                        <button class="btn-action secondary">Retirar</button>
                    </div>
                </div>

                <!-- Yield Farming -->
                <div class="product-card gradient-accent" data-product="yield-farming">
                    <div class="product-header">
                        <div class="product-icon">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                            </svg>
                        </div>
                        <h3>Yield Farming</h3>
                        <span class="product-badge">Nuevo</span>
                    </div>
                    <div class="product-stats">
                        <div class="stat-row">
                            <span>LP Tokens:</span>
                            <span>$5,670</span>
                        </div>
                        <div class="stat-row">
                            <span>APY:</span>
                            <span>15.67%</span>
                        </div>
                        <div class="stat-row">
                            <span>Rewards:</span>
                            <span class="positive">+$234.12</span>
                        </div>
                    </div>
                    <div class="product-actions">
                        <button class="btn-action primary">Farm</button>
                        <button class="btn-action secondary">Harvest</button>
                    </div>
                </div>

                <!-- Cross-Chain Bridge -->
                <div class="product-card gradient-quaternary" data-product="cross-chain">
                    <div class="product-header">
                        <div class="product-icon">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                            </svg>
                        </div>
                        <h3>Cross-Chain Bridge</h3>
                        <span class="product-badge">Beta</span>
                    </div>
                    <div class="product-stats">
                        <div class="stat-row">
                            <span>Bridges:</span>
                            <span>3 activos</span>
                        </div>
                        <div class="stat-row">
                            <span>Fee promedio:</span>
                            <span>0.05%</span>
                        </div>
                        <div class="stat-row">
                            <span>Tiempo:</span>
                            <span>~2 min</span>
                        </div>
                    </div>
                    <div class="product-actions">
                        <button class="btn-action primary">Bridge</button>
                        <button class="btn-action secondary">Historial</button>
                    </div>
                </div>

                <!-- Analytics Pro -->
                <div class="product-card gradient-dark" data-product="analytics">
                    <div class="product-header">
                        <div class="product-icon">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                            </svg>
                        </div>
                        <h3>Analytics Pro</h3>
                        <span class="product-badge">Premium</span>
                    </div>
                    <div class="product-stats">
                        <div class="stat-row">
                            <span>Reportes:</span>
                            <span>12 disponibles</span>
                        </div>
                        <div class="stat-row">
                            <span>Métricas:</span>
                            <span>Real-time</span>
                        </div>
                        <div class="stat-row">
                            <span>Alertas:</span>
                            <span>5 activas</span>
                        </div>
                    </div>
                    <div class="product-actions">
                        <button class="btn-action primary">Analizar</button>
                        <button class="btn-action secondary">Configurar</button>
                    </div>
                </div>

                <!-- Insurance Protocol -->
                <div class="product-card gradient-success" data-product="insurance">
                    <div class="product-header">
                        <div class="product-icon">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                            </svg>
                        </div>
                        <h3>Insurance Protocol</h3>
                        <span class="product-badge">Próximo</span>
                    </div>
                    <div class="product-stats">
                        <div class="stat-row">
                            <span>Cobertura:</span>
                            <span>$50,000</span>
                        </div>
                        <div class="stat-row">
                            <span>Prima:</span>
                            <span>2.1% anual</span>
                        </div>
                        <div class="stat-row">
                            <span>Estado:</span>
                            <span>Protegido</span>
                        </div>
                    </div>
                    <div class="product-actions">
                        <button class="btn-action primary">Asegurar</button>
                        <button class="btn-action secondary">Claim</button>
                    </div>
                </div>
            </div>

            <!-- Market Data -->
            <div class="market-section">
                <h3>Datos del Mercado</h3>
                <div class="market-grid">
                    <div class="market-item">
                        <span class="market-symbol">BTC/USD</span>
                        <span class="market-price">$43,250.50</span>
                        <span class="market-change positive">+2.45%</span>
                    </div>
                    <div class="market-item">
                        <span class="market-symbol">ETH/USD</span>
                        <span class="market-price">$2,678.90</span>
                        <span class="market-change positive">+1.87%</span>
                    </div>
                    <div class="market-item">
                        <span class="market-symbol">SOL/USD</span>
                        <span class="market-price">$89.45</span>
                        <span class="market-change negative">-0.92%</span>
                    </div>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="activity-section">
                <h3>Actividad Reciente</h3>
                <div class="activity-list">
                    <div class="activity-item">
                        <div class="activity-icon">📄</div>
                        <div class="activity-text">
                            <span>Contrato Forward ETH/USD creado</span>
                            <small>Valor: $5,000 • Vencimiento: 30 días</small>
                        </div>
                        <div class="activity-time">hace 2h</div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-icon">💰</div>
                        <div class="activity-text">
                            <span>Lending USDC ejecutado</span>
                            <small>Cantidad: $10,000 • APY: 8.5%</small>
                        </div>
                        <div class="activity-time">hace 5h</div>
                    </div>
                    <div class="activity-item">
                        <div class="activity-icon">🌱</div>
                        <div class="activity-text">
                            <span>Yield farming iniciado</span>
                            <small>Pool: BTC-ETH • LP: $3,000</small>
                        </div>
                        <div class="activity-time">hace 1d</div>
                    </div>
                </div>
            </div>
        `;

        // Aplicar estilos del dashboard
        this.applyDashboardStyles();
        
        // Configurar event listeners para las acciones
        this.setupDashboardEventListeners();
    }

    applyDashboardStyles() {
        // Verificar si los estilos ya existen
        if (document.getElementById('dashboard-styles')) return;

        const style = document.createElement('style');
        style.id = 'dashboard-styles';
        style.textContent = `
            /* Dashboard Styles */
            .dashboard-header {
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                padding: 2rem;
                border-radius: 16px;
                margin-bottom: 2rem;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }

            .dashboard-header-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: white;
            }

            .user-info {
                display: flex;
                align-items: center;
                gap: 1rem;
            }

            .user-avatar {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: rgba(255,255,255,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                border: 3px solid #FFD700;
            }

            .avatar-img {
                width: 30px;
                height: 30px;
                filter: brightness(0) invert(1);
            }

            .user-details h2 {
                margin: 0;
                font-size: 1.5rem;
            }

            .user-status {
                margin: 0;
                opacity: 0.8;
                font-size: 0.9rem;
            }

            .status-indicator {
                color: #4ade80;
                font-weight: 600;
            }

            .btn-header {
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .btn-header:hover {
                background: rgba(255,255,255,0.3);
                transform: translateY(-2px);
            }

            .portfolio-overview {
                margin-bottom: 2rem;
            }

            .portfolio-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 2rem;
                border-radius: 16px;
                color: white;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }

            .portfolio-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
            }

            .portfolio-header h3 {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
            }

            .portfolio-time {
                opacity: 0.8;
                font-size: 0.9rem;
            }

            .portfolio-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 2rem;
            }

            .stat-item {
                text-align: left;
            }

            .stat-label {
                display: block;
                font-size: 0.875rem;
                opacity: 0.8;
                margin-bottom: 0.5rem;
            }

            .stat-value {
                display: block;
                font-size: 1.75rem;
                font-weight: 700;
                margin-bottom: 0.25rem;
            }

            .stat-change {
                font-size: 0.875rem;
                font-weight: 600;
            }

            .stat-change.positive { color: #4ade80; }
            .stat-change.negative { color: #f87171; }

            .products-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }

            .product-card {
                border-radius: 16px;
                padding: 1.5rem;
                color: white;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
                cursor: pointer;
            }

            .product-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            }

            .gradient-primary { background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%); }
            .gradient-secondary { background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); }
            .gradient-accent { background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); }
            .gradient-quaternary { background: linear-gradient(135deg, #10B981 0%, #059669 100%); }
            .gradient-dark { background: linear-gradient(135deg, #374151 0%, #1F2937 100%); }
            .gradient-success { background: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%); }

            .product-header {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 1.5rem;
            }

            .product-icon {
                width: 50px;
                height: 50px;
                background: rgba(255,255,255,0.2);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .product-header h3 {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
                flex: 1;
            }

            .product-badge {
                background: rgba(255,255,255,0.3);
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.75rem;
                font-weight: 600;
            }

            .product-stats {
                margin-bottom: 1.5rem;
            }

            .stat-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.75rem;
                font-size: 0.9rem;
            }

            .stat-row .positive { color: #4ade80; }
            .stat-row .negative { color: #f87171; }

            .product-actions {
                display: flex;
                gap: 0.75rem;
            }

            .btn-action {
                flex: 1;
                padding: 0.75rem;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .btn-action.primary {
                background: rgba(255,255,255,0.9);
                color: #1e3c72;
            }

            .btn-action.secondary {
                background: rgba(255,255,255,0.2);
                color: white;
            }

            .btn-action:hover {
                transform: translateY(-2px);
            }

            .market-section, .activity-section {
                background: white;
                padding: 1.5rem;
                border-radius: 16px;
                margin-bottom: 1.5rem;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }

            .market-section h3, .activity-section h3 {
                margin: 0 0 1rem 0;
                color: #1e3c72;
                font-weight: 600;
            }

            .market-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }

            .market-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                background: #f8fafc;
                border-radius: 8px;
            }

            .market-symbol {
                font-weight: 600;
                color: #1e3c72;
            }

            .market-price {
                font-weight: 600;
            }

            .market-change.positive { color: #10b981; }
            .market-change.negative { color: #ef4444; }

            .activity-list {
                space-y: 1rem;
            }

            .activity-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                background: #f8fafc;
                border-radius: 8px;
                margin-bottom: 0.75rem;
            }

            .activity-icon {
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #4A90E2, #FFD700);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
            }

            .activity-text {
                flex: 1;
            }

            .activity-text span {
                display: block;
                font-weight: 600;
                color: #1e3c72;
                margin-bottom: 0.25rem;
            }

            .activity-text small {
                color: #6b7280;
            }

            .activity-time {
                color: #9ca3af;
                font-size: 0.875rem;
            }

            @media (max-width: 768px) {
                .dashboard-header-content {
                    flex-direction: column;
                    gap: 1rem;
                    text-align: center;
                }

                .products-grid {
                    grid-template-columns: 1fr;
                }

                .portfolio-stats {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }

                .market-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupDashboardEventListeners() {
        // Event listeners para las tarjetas de productos
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-action')) {
                    const product = card.dataset.product;
                    this.handleProductClick(product);
                }
            });
        });

        // Event listeners para botones de acción
        document.querySelectorAll('.btn-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = e.target.textContent.trim();
                const productCard = e.target.closest('.product-card');
                const product = productCard.dataset.product;
                this.handleProductAction(product, action);
            });
        });
    }

    handleProductClick(product) {
        const messages = {
            'forward-contracts': '📄 Accediendo a Forward Contracts...',
            'defi-lending': '💰 Abriendo DeFi Lending...',
            'yield-farming': '🌱 Iniciando Yield Farming...',
            'cross-chain': '🌉 Conectando Cross-Chain Bridge...',
            'analytics': '📊 Cargando Analytics Pro...',
            'insurance': '🛡️ Accediendo a Insurance Protocol...'
        };
        
        this.showNotification(messages[product] || `Abriendo ${product}...`, 'info');
        
        // Simular navegación
        setTimeout(() => {
            this.showNotification(`${product} estará disponible próximamente`, 'info');
        }, 1500);
    }

    handleProductAction(product, action) {
        this.showNotification(`${action} en ${product} - Funcionalidad próximamente`, 'info');
    }

    showLogin() {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('login-screen').style.display = 'flex';
        this.currentScreen = 'login';
    }

    showError(message) {
        console.error(message);
        this.showNotification(message, 'error');
    }

    // API utilities - simplified for demo mode
    async apiCall(endpoint, method = 'GET', data = null, headers = {}) {
        // Para modo demo, evitar llamadas reales a API
        console.log(`🚫 API call blocked (demo mode): ${method} ${endpoint}`);
        
        // Simular respuestas según el endpoint
        if (endpoint.includes('/auth/verify')) {
            throw new Error('Demo mode - no API verification needed');
        }
        
        if (endpoint.includes('/auth/refresh')) {
            throw new Error('Demo mode - token refresh not needed');
        }
        
        // Respuesta por defecto para otros endpoints
        return {
            success: false,
            error: 'Demo mode - API not available'
        };
    }

    async handleTokenExpiration() {
        const refreshToken = localStorage.getItem('bitforward_refresh_token');
        
        if (refreshToken) {
            try {
                const response = await this.apiCall('/auth/refresh', 'POST', {
                    refreshToken
                });
                
                if (response.success) {
                    localStorage.setItem('bitforward_token', response.data.accessToken);
                    return;
                }
            } catch (error) {
                console.error('Token refresh failed:', error);
            }
        }
        
        // Redirect to login
        this.logout();
    }

    logout() {
        localStorage.removeItem('bitforward_token');
        localStorage.removeItem('bitforward_refresh_token');
        this.user = null;
        this.showLogin();
        this.showNotification('Session expired. Please login again.', 'info');
    }

    // Notification system
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container') || this.createNotificationContainer();
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    // Additional utility methods
    toggleFABMenu() {
        const fabMenu = document.getElementById('fab-menu');
        if (fabMenu) {
            fabMenu.classList.toggle('active');
        }
    }

    handleFABAction(action) {
        switch (action) {
            case 'new-contract':
                this.openContractModal();
                break;
            case 'connect-wallet':
                this.showWalletOptions();
                break;
            case 'analytics':
                this.showAnalytics();
                break;
        }
        this.toggleFABMenu();
    }

    openContractModal() {
        const modal = document.getElementById('contract-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.updateMinDate();
        }
    }

    closeModal() {
        document.querySelectorAll('.bitforward-modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    updateMinDate() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dateInput = document.getElementById('contract-execution-date');
        if (dateInput) {
            dateInput.min = tomorrow.toISOString().split('T')[0];
        }
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.bitForwardApp = new BitForwardApp();
});
