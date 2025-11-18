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
      requestTimeout: 10000,
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
      loginForm.addEventListener('submit', e => this.handleLogin(e));
    }

    // Wallet connection buttons
    document.querySelectorAll('.wallet-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        this.handleWalletConnect(e.target.dataset.wallet);
      });
    });

    // FAB menu
    const fabMain = document.querySelector('.fab-main');
    if (fabMain) {
      fabMain.addEventListener('click', () => this.toggleFABMenu());
    }

    document.querySelectorAll('.fab-option').forEach(option => {
      option.addEventListener('click', e => {
        this.handleFABAction(e.target.closest('.fab-option').dataset.action);
      });
    });

    // Contract form
    const contractForm = document.getElementById('advanced-contract-form');
    if (contractForm) {
      contractForm.addEventListener('submit', e => this.handleAdvancedContractSubmission(e));
    }

    // Preview button
    const previewBtn = document.getElementById('preview-btn');
    if (previewBtn) {
      previewBtn.addEventListener('click', () => this.previewContract());
    }

    // Modal handlers
    document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
      el.addEventListener('click', e => {
        if (
          e.target.classList.contains('modal-close') ||
          e.target.classList.contains('modal-backdrop')
        ) {
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
      if (
        (username === 'demo' && password === 'password123') ||
        (username === 'admin' && password === 'admin123') ||
        (username.length >= 3 && password.length >= 6)
      ) {
        // Simular datos de usuario
        this.user = {
          username: username,
          id: `user_${Date.now()}`,
          wallets: {},
          permissions: ['basic'],
          loginTime: new Date().toISOString(),
        };

        // Guardar en localStorage
        localStorage.setItem('bitforward_user', JSON.stringify(this.user));
        localStorage.setItem('bitforward_token', 'demo_token_' + Date.now());

        const message = window.i18n
          ? window.i18n.t('notification.login.success')
          : '¡Inicio de sesión exitoso! Bienvenido al Panel de BitForward';
        this.showNotification(message, 'success');

        setTimeout(() => {
          this.showDashboard();
        }, 1000);
      } else {
        throw new Error('Credenciales incorrectas. Usa: demo/password123');
      }
    } catch (error) {
      const message = window.i18n
        ? window.i18n.t('notification.login.failed')
        : 'Error en el inicio de sesión';
      this.showNotification(`${message}: ${error.message}`, 'error');
    } finally {
      btnText.style.display = 'inline';
      btnSpinner.style.display = 'none';
      loginBtn.disabled = false;
    }
  }

  async handleWalletConnect(walletType) {
    try {
      const message = window.i18n
        ? window.i18n.t('notification.wallet.connecting')
        : 'Conectando a';
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
            connected: true,
          },
        },
        permissions: ['basic', 'wallet'],
        loginTime: new Date().toISOString(),
      };

      // Guardar en localStorage
      localStorage.setItem('bitforward_user', JSON.stringify(this.user));
      localStorage.setItem('bitforward_token', 'wallet_token_' + Date.now());

      const successMessage = window.i18n
        ? window.i18n.t('notification.wallet.connected')
        : 'conectado exitosamente';
      this.showNotification(`${walletType} ${successMessage}!`, 'success');

      setTimeout(() => {
        this.showDashboard();
      }, 1000);
    } catch (error) {
      const errorMessage = window.i18n
        ? window.i18n.t('notification.wallet.failed')
        : 'Error al conectar';
      this.showNotification(`${errorMessage} ${walletType}: ${error.message}`, 'error');
    }
  }

  getBlockchainFromWallet(walletType) {
    const mapping = {
      metamask: 'ethereum',
      phantom: 'solana',
      bitcoin: 'bitcoin',
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

    // Dashboard HTML completo con diseño moderno y funcionalidades avanzadas
    dashboardContainer.innerHTML = `
            <!-- Advanced Dashboard Header -->
            <div class="dashboard-header">
                <div class="dashboard-header-content">
                    <div class="user-info">
                        <div class="user-avatar">
                            <img src="assets/logo.svg" alt="User" class="avatar-img">
                        </div>
                        <div class="user-details">
                            <h2 class="bitforward-brand animated size-lg">BitForward Enterprise</h2>
                            <p class="user-status">Bienvenido, ${this.user.username} • <span class="status-indicator">Conectado</span></p>
                            <div class="connection-status">
                                <span class="blockchain-status btc">₿ Bitcoin</span>
                                <span class="blockchain-status eth">Ξ Ethereum</span>
                                <span class="blockchain-status sol">◎ Solana</span>
                            </div>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn-header notifications" onclick="window.bitForwardApp.showNotifications()">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2z"/>
                            </svg>
                            <span class="notification-count">3</span>
                        </button>
                        <button class="btn-header settings" onclick="window.bitForwardApp.showSettings()">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                        </button>
                        <button class="btn-header logout" onclick="window.bitForwardApp.logout()">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                            </svg>
                            Salir
                        </button>
                    </div>
                </div>
            </div>

            <!-- Advanced Portfolio Overview -->
            <div class="portfolio-overview-advanced">
                <div class="portfolio-grid">
                    <div class="portfolio-card main-portfolio">
                        <div class="portfolio-header">
                            <h3>🏦 Resumen de Cartera Completo</h3>
                            <div class="portfolio-actions">
                                <button class="btn-action mini" onclick="window.bitForwardApp.refreshPortfolio()">🔄</button>
                                <button class="btn-action mini" onclick="window.bitForwardApp.exportPortfolio()">📊</button>
                            </div>
                        </div>
                        <div class="portfolio-stats-grid">
                            <div class="stat-card total-value">
                                <div class="stat-icon">💼</div>
                                <div class="stat-content">
                                    <span class="stat-label">Valor Total de Cartera</span>
                                    <span class="stat-value">$47,583.20</span>
                                    <span class="stat-change positive">+12.3% (+$5,234)</span>
                                </div>
                            </div>
                            <div class="stat-card daily-pnl">
                                <div class="stat-icon">📈</div>
                                <div class="stat-content">
                                    <span class="stat-label">P&L Diario</span>
                                    <span class="stat-value positive">+$2,341.50</span>
                                    <span class="stat-change positive">+5.2% (24h)</span>
                                </div>
                            </div>
                            <div class="stat-card active-contracts">
                                <div class="stat-icon">⚡</div>
                                <div class="stat-content">
                                    <span class="stat-label">Contratos Activos</span>
                                    <span class="stat-value">8</span>
                                    <span class="stat-change">2 Pending</span>
                                </div>
                            </div>
                            <div class="stat-card risk-exposure">
                                <div class="stat-icon">🎯</div>
                                <div class="stat-content">
                                    <span class="stat-label">Exposición al Riesgo</span>
                                    <span class="stat-value risk-medium">MEDIUM</span>
                                    <span class="stat-change">75% Diversificado</span>
                                </div>
                            </div>
                        </div>
                        <div class="portfolio-breakdown">
                            <h4>Distribución por Blockchain</h4>
                            <div class="blockchain-distribution">
                                <div class="blockchain-item">
                                    <div class="blockchain-info">
                                        <span class="blockchain-icon">₿</span>
                                        <span class="blockchain-name">Bitcoin</span>
                                    </div>
                                    <div class="blockchain-stats">
                                        <span class="allocation">45%</span>
                                        <span class="value">$21,412.44</span>
                                        <span class="contracts">3 contratos</span>
                                    </div>
                                </div>
                                <div class="blockchain-item">
                                    <div class="blockchain-info">
                                        <span class="blockchain-icon">Ξ</span>
                                        <span class="blockchain-name">Ethereum</span>
                                    </div>
                                    <div class="blockchain-stats">
                                        <span class="allocation">35%</span>
                                        <span class="value">$16,654.12</span>
                                        <span class="contracts">3 contratos</span>
                                    </div>
                                </div>
                                <div class="blockchain-item">
                                    <div class="blockchain-info">
                                        <span class="blockchain-icon">◎</span>
                                        <span class="blockchain-name">Solana</span>
                                    </div>
                                    <div class="blockchain-stats">
                                        <span class="allocation">20%</span>
                                        <span class="value">$9,516.64</span>
                                        <span class="contracts">2 contratos</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="portfolio-card performance-chart">
                        <div class="chart-header">
                            <h4>📊 Performance Chart (30 días)</h4>
                            <div class="chart-controls">
                                <button class="chart-btn active" data-period="30d">30D</button>
                                <button class="chart-btn" data-period="7d">7D</button>
                                <button class="chart-btn" data-period="1d">1D</button>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="performance-chart" width="400" height="200"></canvas>
                        </div>
                        <div class="chart-legend">
                            <div class="legend-item">
                                <span class="legend-color portfolio"></span>
                                <span>Portfolio Value</span>
                            </div>
                            <div class="legend-item">
                                <span class="legend-color market"></span>
                                <span>Market Index</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Advanced Products Grid -->
            <div class="products-section-advanced">
                <div class="section-header">
                    <h2>🏦 Productos Financieros DeFi Avanzados</h2>
                    <div class="section-controls">
                        <button class="view-toggle active" data-view="grid">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                            </svg>
                        </button>
                        <button class="view-toggle" data-view="list">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="products-grid advanced-grid">
                    <!-- Forward Contracts Advanced -->
                    <div class="product-card advanced forward-contracts" data-product="forward-contracts">
                        <div class="product-header">
                            <div class="product-icon">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/>
                                </svg>
                            </div>
                            <div class="product-title">
                                <h3>Forward Contracts Pro</h3>
                                <span class="product-badge premium">Premium</span>
                            </div>
                            <div class="product-status">
                                <span class="status-dot active"></span>
                                <span class="status-text">Operativo</span>
                            </div>
                        </div>
                        <div class="product-description">
                            <p>Contratos a futuro descentralizados con liquidación automática y soporte multi-blockchain avanzado</p>
                        </div>
                        <div class="product-stats advanced">
                            <div class="stat-row">
                                <div class="stat-item">
                                    <span class="stat-label">Contratos Activos</span>
                                    <span class="stat-value">5</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Valor Nocional</span>
                                    <span class="stat-value">$23,450</span>
                                </div>
                            </div>
                            <div class="stat-row">
                                <div class="stat-item">
                                    <span class="stat-label">P&L Total</span>
                                    <span class="stat-value positive">+$1,234</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Success Rate</span>
                                    <span class="stat-value">87.5%</span>
                                </div>
                            </div>
                        </div>
                        <div class="product-features">
                            <div class="feature-list">
                                <div class="feature-item">
                                    <span class="feature-icon">✅</span>
                                    <span>Multi-blockchain Support</span>
                                </div>
                                <div class="feature-item">
                                    <span class="feature-icon">✅</span>
                                    <span>Auto-liquidation</span>
                                </div>
                                <div class="feature-item">
                                    <span class="feature-icon">✅</span>
                                    <span>Risk Management</span>
                                </div>
                            </div>
                        </div>
                        <div class="supported-chains">
                            <span class="chain-badge btc active">₿ Bitcoin</span>
                            <span class="chain-badge eth active">Ξ Ethereum</span>
                            <span class="chain-badge sol active">◎ Solana</span>
                        </div>
                        <div class="product-actions">
                            <button class="btn-action primary" onclick="window.bitForwardApp.openAdvancedContractModal()">
                                <span class="btn-icon">📄</span>
                                Crear Contrato
                            </button>
                            <button class="btn-action secondary" onclick="window.bitForwardApp.viewForwardPortfolio()">
                                <span class="btn-icon">📊</span>
                                Ver Portfolio
                            </button>
                            <button class="btn-action tertiary" onclick="window.bitForwardApp.showForwardAnalytics()">
                                <span class="btn-icon">📈</span>
                                Analytics
                            </button>
                        </div>
                    </div>

                    <!-- DeFi Lending Advanced -->
                    <div class="product-card advanced defi-lending" data-product="defi-lending">
                        <div class="product-header">
                            <div class="product-icon">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                                </svg>
                            </div>
                            <div class="product-title">
                                <h3>DeFi Lending Pro</h3>
                                <span class="product-badge popular">Popular</span>
                            </div>
                            <div class="product-status">
                                <span class="status-dot active"></span>
                                <span class="status-text">Alta Demanda</span>
                            </div>
                        </div>
                        <div class="product-description">
                            <p>Préstamos colateralizados con liquidación automática, gestión dinámica de LTV y optimización de rendimientos</p>
                        </div>
                        <div class="product-stats advanced">
                            <div class="stat-row">
                                <div class="stat-item">
                                    <span class="stat-label">Total Prestado</span>
                                    <span class="stat-value">$12,500</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">APY Promedio</span>
                                    <span class="stat-value">8.24%</span>
                                </div>
                            </div>
                            <div class="stat-row">
                                <div class="stat-item">
                                    <span class="stat-label">LTV Ratio</span>
                                    <span class="stat-value safe">75%</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Health Factor</span>
                                    <span class="stat-value healthy">2.1</span>
                                </div>
                            </div>
                        </div>
                        <div class="lending-details advanced">
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <span class="detail-label">Intereses Ganados</span>
                                    <span class="detail-value positive">+$89.34</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Liquidation Risk</span>
                                    <span class="detail-value risk-low">Bajo</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Auto-Repay</span>
                                    <span class="detail-value enabled">Activado</span>
                                </div>
                                <div class="detail-item">
                                    <span class="detail-label">Insurance</span>
                                    <span class="detail-value covered">Cubierto</span>
                                </div>
                            </div>
                        </div>
                        <div class="product-actions">
                            <button class="btn-action primary" onclick="window.bitForwardApp.openLendingPlatform()">
                                <span class="btn-icon">💰</span>
                                Solicitar Préstamo
                            </button>
                            <button class="btn-action secondary" onclick="window.bitForwardApp.manageLending()">
                                <span class="btn-icon">⚙️</span>
                                Gestionar
                            </button>
                            <button class="btn-action tertiary" onclick="window.bitForwardApp.viewLendingDetails()">
                                <span class="btn-icon">📋</span>
                                Detalles
                            </button>
                        </div>
                    </div>

                    <!-- Yield Farming Advanced -->
                    <div class="product-card advanced yield-farming" data-product="yield-farming">
                        <div class="product-header">
                            <div class="product-icon">
                                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                                </svg>
                            </div>
                            <div class="product-title">
                                <h3>Yield Farming Pro</h3>
                                <span class="product-badge new">Nuevo</span>
                            </div>
                            <div class="product-status">
                                <span class="status-dot active"></span>
                                <span class="status-text">Alto Rendimiento</span>
                            </div>
                        </div>
                        <div class="product-description">
                            <p>Provisión de liquidez optimizada con farming automático de tokens y estrategias de compounding</p>
                        </div>
                        <div class="product-stats advanced">
                            <div class="stat-row">
                                <div class="stat-item">
                                    <span class="stat-label">LP Tokens</span>
                                    <span class="stat-value">$5,670</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">APY Actual</span>
                                    <span class="stat-value">15.67%</span>
                                </div>
                            </div>
                            <div class="stat-row">
                                <div class="stat-item">
                                    <span class="stat-label">Rewards</span>
                                    <span class="stat-value positive">+$234.12</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-label">Pools Activos</span>
                                    <span class="stat-value">3</span>
                                </div>
                            </div>
                        </div>
                        <div class="farming-pools advanced">
                            <div class="pool-list">
                                <div class="pool-item">
                                    <div class="pool-info">
                                        <span class="pool-name">BTC-ETH LP</span>
                                        <span class="pool-apy">18.2% APY</span>
                                    </div>
                                    <span class="pool-status active">Activo</span>
                                </div>
                                <div class="pool-item">
                                    <div class="pool-info">
                                        <span class="pool-name">SOL-USDC LP</span>
                                        <span class="pool-apy">24.5% APY</span>
                                    </div>
                                    <span class="pool-status pending">Pendiente</span>
                                </div>
                                <div class="pool-item">
                                    <div class="pool-info">
                                        <span class="pool-name">ETH-DAI LP</span>
                                        <span class="pool-apy">12.8% APY</span>
                                    </div>
                                    <span class="pool-status inactive">Inactivo</span>
                                </div>
                            </div>
                        </div>
                        <div class="product-actions">
                            <button class="btn-action primary" onclick="window.bitForwardApp.openYieldFarming()">
                                <span class="btn-icon">🌱</span>
                                Empezar Farming
                            </button>
                            <button class="btn-action secondary" onclick="window.bitForwardApp.harvestRewards()">
                                <span class="btn-icon">🚜</span>
                                Harvest
                            </button>
                            <button class="btn-action tertiary" onclick="window.bitForwardApp.viewPoolDetails()">
                                <span class="btn-icon">🌊</span>
                                Ver Pools
                            </button>
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
            /* Advanced Dashboard Styles */
            .dashboard-header {
                background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
                padding: 2rem;
                border-radius: 16px;
                margin-bottom: 2rem;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                border: 1px solid rgba(255, 215, 0, 0.3);
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
                gap: 1.5rem;
            }

            .user-avatar {
                width: 70px;
                height: 70px;
                border-radius: 50%;
                background: linear-gradient(135deg, #FFD700, #FFA500);
                display: flex;
                align-items: center;
                justify-content: center;
                border: 3px solid #FFD700;
                box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
            }

            .avatar-img {
                width: 35px;
                height: 35px;
                filter: brightness(0) invert(1);
            }

            .user-details h2 {
                margin: 0 0 0.5rem 0;
                font-size: 1.8rem;
                background: linear-gradient(135deg, #FFD700, #FFA500);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }

            .user-status {
                margin: 0 0 0.75rem 0;
                opacity: 0.9;
                font-size: 1rem;
            }

            .status-indicator {
                color: #4ade80;
                font-weight: 600;
                animation: pulse 2s infinite;
            }

            .connection-status {
                display: flex;
                gap: 0.5rem;
                margin-top: 0.5rem;
            }

            .blockchain-status {
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: 600;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 215, 0, 0.3);
            }

            .blockchain-status.btc { border-color: #f7931a; color: #f7931a; }
            .blockchain-status.eth { border-color: #627eea; color: #627eea; }
            .blockchain-status.sol { border-color: #14f195; color: #14f195; }

            .header-actions {
                display: flex;
                gap: 1rem;
            }

            .btn-header {
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                color: white;
                padding: 0.75rem;
                border-radius: 12px;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
            }

            .btn-header:hover {
                background: rgba(255,255,255,0.2);
                border-color: #FFD700;
                transform: translateY(-2px);
            }

            .btn-header.notifications .notification-count {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #ef4444;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                font-size: 0.7rem;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
            }

            /* Advanced Portfolio Overview */
            .portfolio-overview-advanced {
                margin-bottom: 2rem;
            }

            .portfolio-grid {
                display: grid;
                grid-template-columns: 2fr 1fr;
                gap: 2rem;
            }

            .portfolio-card {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 16px;
                padding: 2rem;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                border: 1px solid rgba(255, 215, 0, 0.2);
            }

            .portfolio-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid #FFD700;
            }

            .portfolio-header h3 {
                margin: 0;
                color: #1a202c;
                font-size: 1.25rem;
                font-weight: 700;
            }

            .portfolio-actions {
                display: flex;
                gap: 0.5rem;
            }

            .btn-action.mini {
                padding: 0.5rem;
                border-radius: 8px;
                border: 1px solid #FFD700;
                background: white;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.9rem;
            }

            .btn-action.mini:hover {
                background: #FFD700;
                transform: scale(1.1);
            }

            .portfolio-stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;
                margin-bottom: 2rem;
            }

            .stat-card {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1.5rem;
                background: linear-gradient(135deg, #f8fafc, #e2e8f0);
                border-radius: 12px;
                border: 1px solid rgba(255, 215, 0, 0.3);
                transition: all 0.3s ease;
            }

            .stat-card:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 25px rgba(255, 215, 0, 0.2);
            }

            .stat-icon {
                font-size: 2rem;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #FFD700, #FFA500);
                box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
            }

            .stat-content {
                flex: 1;
            }

            .stat-label {
                display: block;
                font-size: 0.9rem;
                color: #64748b;
                margin-bottom: 0.25rem;
                font-weight: 500;
            }

            .stat-value {
                display: block;
                font-size: 1.5rem;
                font-weight: 700;
                color: #1a202c;
                margin-bottom: 0.25rem;
            }

            .stat-value.positive { color: #10b981; }
            .stat-value.negative { color: #ef4444; }
            .stat-value.risk-low { color: #10b981; }
            .stat-value.risk-medium { color: #f59e0b; }
            .stat-value.risk-high { color: #ef4444; }

            .stat-change {
                font-size: 0.8rem;
                font-weight: 600;
            }

            .stat-change.positive { color: #10b981; }

            /* Products Section Advanced */
            .products-section-advanced {
                margin-bottom: 2rem;
            }

            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
            }

            .section-header h2 {
                margin: 0;
                color: #1a202c;
                font-size: 1.5rem;
                font-weight: 700;
            }

            .section-controls {
                display: flex;
                gap: 0.5rem;
            }

            .view-toggle {
                padding: 0.5rem;
                border: 1px solid #d1d5db;
                background: white;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .view-toggle.active {
                background: #FFD700;
                border-color: #FFA500;
            }

            .products-grid.advanced-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 2rem;
            }

            .product-card.advanced {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-radius: 16px;
                padding: 2rem;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                border: 1px solid rgba(255, 215, 0, 0.2);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .product-card.advanced::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #FFD700, #FFA500);
            }

            .product-card.advanced:hover {
                transform: translateY(-5px);
                box-shadow: 0 20px 40px rgba(255, 215, 0, 0.2);
                border-color: #FFD700;
            }

            .product-header {
                display: flex;
                align-items: flex-start;
                gap: 1rem;
                margin-bottom: 1.5rem;
            }

            .product-icon {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #FFD700, #FFA500);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
            }

            .product-title {
                flex: 1;
            }

            .product-title h3 {
                margin: 0 0 0.5rem 0;
                font-size: 1.25rem;
                font-weight: 700;
                color: #1a202c;
            }

            .product-badge {
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
            }

            .product-badge.premium {
                background: linear-gradient(135deg, #8b5cf6, #7c3aed);
                color: white;
            }

            .product-badge.popular {
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: white;
            }

            .product-badge.new {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
            }

            .product-status {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.8rem;
                color: #64748b;
            }

            .status-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #10b981;
                animation: pulse 2s infinite;
            }

            .product-description {
                margin-bottom: 1.5rem;
            }

            .product-description p {
                margin: 0;
                color: #64748b;
                line-height: 1.5;
            }

            .product-stats.advanced {
                margin-bottom: 1.5rem;
            }

            .stat-row {
                display: flex;
                gap: 1rem;
                margin-bottom: 1rem;
            }

            .stat-item {
                flex: 1;
                text-align: center;
                padding: 1rem;
                background: #f8fafc;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
            }

            .stat-item .stat-label {
                display: block;
                font-size: 0.8rem;
                color: #64748b;
                margin-bottom: 0.25rem;
            }

            .stat-item .stat-value {
                display: block;
                font-size: 1.2rem;
                font-weight: 700;
                color: #1a202c;
            }

            .product-features {
                margin-bottom: 1.5rem;
            }

            .feature-list {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .feature-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.9rem;
                color: #374151;
            }

            .feature-icon {
                color: #10b981;
            }

            .supported-chains {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 1.5rem;
                flex-wrap: wrap;
            }

            .chain-badge {
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: 600;
                border: 1px solid;
            }

            .chain-badge.btc { border-color: #f7931a; color: #f7931a; background: rgba(247, 147, 26, 0.1); }
            .chain-badge.eth { border-color: #627eea; color: #627eea; background: rgba(98, 126, 234, 0.1); }
            .chain-badge.sol { border-color: #14f195; color: #14f195; background: rgba(20, 241, 149, 0.1); }

            .product-actions {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }

            .btn-action {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 0.75rem 1rem;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.9rem;
            }

            .btn-action.primary {
                background: linear-gradient(135deg, #1a202c, #2d3748);
                color: white;
                border: 1px solid #FFD700;
            }

            .btn-action.secondary {
                background: white;
                color: #1a202c;
                border: 1px solid #d1d5db;
            }

            .btn-action.tertiary {
                background: #f8fafc;
                color: #64748b;
                border: 1px solid #e2e8f0;
            }

            .btn-action:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }

            .btn-action.primary:hover {
                border-color: #FFA500;
                background: linear-gradient(135deg, #2d3748, #4a5568);
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            /* Responsive Design */
            @media (max-width: 1200px) {
                .portfolio-grid {
                    grid-template-columns: 1fr;
                }
                
                .products-grid.advanced-grid {
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                }
            }

            @media (max-width: 768px) {
                .dashboard-header-content {
                    flex-direction: column;
                    gap: 1rem;
                    text-align: center;
                }

                .user-info {
                    flex-direction: column;
                    text-align: center;
                }

                .portfolio-stats-grid {
                    grid-template-columns: 1fr;
                }

                .products-grid.advanced-grid {
                    grid-template-columns: 1fr;
                }

                .stat-row {
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .connection-status {
                    justify-content: center;
                }
            }
        `;
    document.head.appendChild(style);
  }

  setupDashboardEventListeners() {
    // Event listeners para las tarjetas de productos
    document.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', e => {
        if (!e.target.classList.contains('btn-action')) {
          const product = card.dataset.product;
          this.handleProductClick(product);
        }
      });
    });

    // Event listeners para botones de acción
    document.querySelectorAll('.btn-action').forEach(btn => {
      btn.addEventListener('click', e => {
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
      analytics: '📊 Cargando Analytics Pro...',
      insurance: '🛡️ Accediendo a Insurance Protocol...',
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
      error: 'Demo mode - API not available',
    };
  }

  async handleTokenExpiration() {
    const refreshToken = localStorage.getItem('bitforward_refresh_token');

    if (refreshToken) {
      try {
        const response = await this.apiCall('/auth/refresh', 'POST', {
          refreshToken,
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

  // Advanced Dashboard Functions
  showNotifications() {
    this.showNotification('🔔 Sistema de notificaciones avanzado próximamente', 'info');
    console.log('Abriendo panel de notificaciones avanzado...');
  }

  showSettings() {
    this.showNotification('⚙️ Panel de configuración avanzada próximamente', 'info');
    console.log('Abriendo configuración avanzada...');
  }

  refreshPortfolio() {
    this.showNotification('🔄 Actualizando portfolio...', 'info');
    console.log('Refreshing portfolio data...');

    // Simular actualización
    setTimeout(() => {
      this.showNotification('✅ Portfolio actualizado exitosamente', 'success');
    }, 2000);
  }

  exportPortfolio() {
    this.showNotification('📊 Exportando datos del portfolio...', 'info');
    console.log('Exporting portfolio data...');

    // Simular exportación
    setTimeout(() => {
      this.showNotification('📄 Portfolio exportado como PDF', 'success');
    }, 1500);
  }

  openAdvancedContractModal() {
    this.showNotification('📄 Abriendo creador avanzado de contratos...', 'info');
    this.openContractModal();
  }

  viewForwardPortfolio() {
    this.showNotification('📊 Abriendo portfolio de Forward Contracts...', 'info');
    console.log('Opening Forward Contracts portfolio view...');
  }

  showForwardAnalytics() {
    this.showNotification('📈 Cargando analytics de Forward Contracts...', 'info');
    console.log('Loading Forward Contracts analytics...');
  }

  openLendingPlatform() {
    this.showNotification('🏛️ Accediendo a DeFi Lending Platform...', 'info');
    console.log('Opening DeFi Lending platform...');
  }

  manageLending() {
    this.showNotification('⚙️ Abriendo gestor de préstamos...', 'info');
    console.log('Opening lending management interface...');
  }

  viewLendingDetails() {
    this.showNotification('📋 Cargando detalles de préstamos activos...', 'info');
    console.log('Loading lending details...');
  }

  openYieldFarming() {
    this.showNotification('🌱 Iniciando plataforma de Yield Farming...', 'info');
    console.log('Opening Yield Farming platform...');
  }

  harvestRewards() {
    this.showNotification('🚜 Recolectando rewards de farming...', 'info');
    console.log('Harvesting farming rewards...');

    // Simular harvest
    setTimeout(() => {
      this.showNotification('✅ Rewards recolectadas: +$45.67', 'success');
    }, 3000);
  }

  viewPoolDetails() {
    this.showNotification('🌊 Cargando detalles de liquidity pools...', 'info');
    console.log('Loading pool details...');
  }

  openBridge() {
    this.showNotification('🌉 Iniciando Cross-Chain Bridge...', 'info');
    console.log('Opening cross-chain bridge...');
  }

  viewBridgeHistory() {
    this.showNotification('📜 Cargando historial de transfers...', 'info');
    console.log('Loading bridge transfer history...');
  }

  openAnalytics() {
    this.showNotification('📊 Abriendo Analytics Pro...', 'info');
    console.log('Opening advanced analytics dashboard...');
  }

  exportReports() {
    this.showNotification('📄 Generando reports avanzados...', 'info');
    console.log('Generating advanced reports...');

    setTimeout(() => {
      this.showNotification('📋 Reports generados y listos para descarga', 'success');
    }, 2500);
  }

  comingSoon() {
    this.showNotification('🔜 Función próximamente disponible', 'info');
  }

  notifyWhenReady() {
    this.showNotification('🔔 Te notificaremos cuando esté disponible', 'success');
  }

  // Notification system
  showNotification(message, type = 'info') {
    const container =
      document.getElementById('notification-container') || this.createNotificationContainer();

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
      info: 'ℹ️',
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
