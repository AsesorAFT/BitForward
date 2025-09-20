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
        
        // Initialize dashboard
        if (typeof BitForwardDashboard !== 'undefined') {
            this.dashboard = new BitForwardDashboard(window.bitForward);
            this.dashboard.renderDashboard('main-dashboard');
        }
        
        this.currentScreen = 'dashboard';
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
