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
        if (token) {
            try {
                const response = await this.apiCall('/auth/verify', 'GET', null, {
                    'Authorization': `Bearer ${token}`
                });
                
                if (response.success) {
                    this.user = response.data.user;
                    this.showDashboard();
                    return;
                }
            } catch (error) {
                // Token inválido, limpiar storage
                localStorage.removeItem('bitforward_token');
                localStorage.removeItem('bitforward_refresh_token');
            }
        }
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
            const response = await this.apiCall('/auth/login', 'POST', {
                username,
                password
            });
            
            if (response.success) {
                // Guardar tokens
                localStorage.setItem('bitforward_token', response.data.tokens.accessToken);
                localStorage.setItem('bitforward_refresh_token', response.data.tokens.refreshToken);
                
                this.user = response.data.user;
                this.showNotification('Login successful! Welcome to BitForward Dashboard', 'success');
                
                setTimeout(() => {
                    this.showDashboard();
                }, 1000);
            } else {
                throw new Error(response.error || 'Login failed');
            }
        } catch (error) {
            this.showNotification(`Login failed: ${error.message}`, 'error');
        } finally {
            btnText.style.display = 'inline';
            btnSpinner.style.display = 'none';
            loginBtn.disabled = false;
        }
    }

    async handleWalletConnect(walletType) {
        try {
            this.showNotification(`Connecting to ${walletType}...`, 'info');
            
            if (!this.blockchain) {
                throw new Error('Blockchain service not available');
            }

            const blockchain = this.getBlockchainFromWallet(walletType);
            const connection = await this.blockchain.connectWallet(blockchain, walletType);
            
            if (connection.connected) {
                // Auto-login with wallet
                const loginResult = await this.apiCall('/auth/wallet-login', 'POST', {
                    walletType,
                    address: connection.address,
                    signature: connection.signature
                });
                
                if (loginResult.success) {
                    localStorage.setItem('bitforward_token', loginResult.data.tokens.accessToken);
                    this.user = loginResult.data.user;
                    this.showNotification(`${walletType} connected successfully!`, 'success');
                    
                    setTimeout(() => {
                        this.showDashboard();
                    }, 1000);
                }
            }
        } catch (error) {
            this.showNotification(`Failed to connect ${walletType}: ${error.message}`, 'error');
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

    // API utilities
    async apiCall(endpoint, method = 'GET', data = null, headers = {}) {
        const url = `${this.config.apiBaseUrl}${endpoint}`;
        const token = localStorage.getItem('bitforward_token');
        
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (token && !headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (data && (method === 'POST' || method === 'PUT')) {
            config.body = JSON.stringify(data);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.requestTimeout);
        config.signal = controller.signal;

        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            // Handle token expiration
            if (error.message.includes('401') || error.message.includes('token')) {
                await this.handleTokenExpiration();
            }
            
            throw error;
        }
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
