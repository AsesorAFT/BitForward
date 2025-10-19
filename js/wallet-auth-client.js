/**
 * BitForward Wallet Authentication Client
 * Cliente para autenticación con wallets (SIWE - Sign-In with Ethereum)
 * 
 * @author BitForward Team
 * @date 2025-10-19
 */

class WalletAuthClient {
    constructor(apiBaseUrl = 'http://localhost:3000/api') {
        this.apiBaseUrl = apiBaseUrl;
        this.accessToken = null;
        this.refreshToken = null;
        this.userAddress = null;
        this.chainId = null;
        this.refreshTimer = null;
        
        // Listeners para eventos
        this.listeners = {
            login: [],
            logout: [],
            tokenRefreshed: [],
            error: []
        };
        
        // Cargar tokens del localStorage
        this.loadTokens();
        
        // Auto-refresh si hay tokens
        if (this.accessToken) {
            this.startAutoRefresh();
        }
    }
    
    /**
     * Conectar wallet y autenticar
     */
    async login(walletManager) {
        try {
            if (!walletManager || !walletManager.isConnected) {
                throw new Error('Wallet not connected');
            }
            
            const address = walletManager.currentAccount;
            const chainId = walletManager.currentChainId;
            
            console.log(`🔐 Iniciando autenticación para wallet: ${address}`);
            
            // Paso 1: Solicitar nonce
            const nonceResponse = await this.requestNonce(address, chainId);
            const { nonce, message } = nonceResponse;
            
            console.log('📝 Nonce recibido, solicitando firma...');
            
            // Paso 2: Firmar mensaje con wallet
            const signature = await walletManager.signMessage(message);
            
            console.log('✅ Mensaje firmado, verificando...');
            
            // Paso 3: Verificar firma y obtener tokens
            const authResponse = await this.verifySignature(address, signature, nonce, chainId);
            
            // Guardar tokens
            this.accessToken = authResponse.accessToken;
            this.refreshToken = authResponse.refreshToken;
            this.userAddress = authResponse.address;
            this.chainId = authResponse.chainId;
            
            // Persistir en localStorage
            this.saveTokens();
            
            // Iniciar auto-refresh
            this.startAutoRefresh();
            
            console.log('🎉 Autenticación exitosa!');
            
            // Emitir evento de login
            this.emit('login', {
                address: this.userAddress,
                chainId: this.chainId
            });
            
            return {
                success: true,
                address: this.userAddress,
                chainId: this.chainId
            };
            
        } catch (error) {
            console.error('❌ Error en autenticación:', error);
            this.emit('error', error);
            throw error;
        }
    }
    
    /**
     * Solicitar nonce al servidor
     */
    async requestNonce(address, chainId) {
        const response = await fetch(`${this.apiBaseUrl}/auth/wallet/nonce`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ address, chainId })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to request nonce');
        }
        
        const data = await response.json();
        return data.data;
    }
    
    /**
     * Verificar firma y obtener tokens
     */
    async verifySignature(address, signature, nonce, chainId) {
        const response = await fetch(`${this.apiBaseUrl}/auth/wallet/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ address, signature, nonce, chainId })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Signature verification failed');
        }
        
        const data = await response.json();
        return data.data;
    }
    
    /**
     * Cerrar sesión
     */
    async logout(logoutAll = false) {
        try {
            if (!this.accessToken) {
                console.warn('No active session to logout');
                return;
            }
            
            // Llamar al endpoint de logout
            await fetch(`${this.apiBaseUrl}/auth/wallet/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.accessToken}`
                },
                body: JSON.stringify({
                    refreshToken: this.refreshToken,
                    logoutAll
                })
            });
            
            console.log('👋 Sesión cerrada');
            
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        } finally {
            // Limpiar tokens locales siempre
            this.clearTokens();
            
            // Detener auto-refresh
            this.stopAutoRefresh();
            
            // Emitir evento de logout
            this.emit('logout');
        }
    }
    
    /**
     * Refrescar access token
     */
    async refreshAccessToken() {
        try {
            if (!this.refreshToken) {
                throw new Error('No refresh token available');
            }
            
            const response = await fetch(`${this.apiBaseUrl}/auth/wallet/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken: this.refreshToken })
            });
            
            if (!response.ok) {
                // Si el refresh token es inválido, hacer logout
                if (response.status === 401) {
                    console.warn('Refresh token expired, logging out...');
                    this.logout();
                    return null;
                }
                
                throw new Error('Failed to refresh token');
            }
            
            const data = await response.json();
            this.accessToken = data.data.accessToken;
            
            // Actualizar en localStorage
            this.saveTokens();
            
            console.log('🔄 Access token refrescado');
            
            // Emitir evento
            this.emit('tokenRefreshed');
            
            return this.accessToken;
            
        } catch (error) {
            console.error('Error refreshing token:', error);
            this.emit('error', error);
            throw error;
        }
    }
    
    /**
     * Iniciar auto-refresh de tokens (cada 10 minutos)
     */
    startAutoRefresh() {
        if (this.refreshTimer) return;
        
        // Refrescar cada 10 minutos (tokens duran 15 min)
        this.refreshTimer = setInterval(async () => {
            try {
                await this.refreshAccessToken();
            } catch (error) {
                console.error('Auto-refresh failed:', error);
                this.stopAutoRefresh();
            }
        }, 10 * 60 * 1000);
        
        console.log('⏰ Auto-refresh de tokens iniciado (cada 10 minutos)');
    }
    
    /**
     * Detener auto-refresh
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
            console.log('⏸️  Auto-refresh detenido');
        }
    }
    
    /**
     * Obtener información del usuario autenticado
     */
    async getUserInfo() {
        try {
            if (!this.accessToken) {
                throw new Error('Not authenticated');
            }
            
            const response = await fetch(`${this.apiBaseUrl}/auth/wallet/me`, {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to get user info');
            }
            
            const data = await response.json();
            return data.data;
            
        } catch (error) {
            console.error('Error getting user info:', error);
            throw error;
        }
    }
    
    /**
     * Hacer request autenticado
     */
    async authenticatedFetch(url, options = {}) {
        if (!this.accessToken) {
            throw new Error('Not authenticated');
        }
        
        // Agregar Authorization header
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${this.accessToken}`
        };
        
        let response = await fetch(url, options);
        
        // Si el token expiró, intentar refrescar
        if (response.status === 401 && this.refreshToken) {
            console.log('🔄 Token expirado, intentando refrescar...');
            
            try {
                await this.refreshAccessToken();
                
                // Reintentar request con nuevo token
                options.headers['Authorization'] = `Bearer ${this.accessToken}`;
                response = await fetch(url, options);
            } catch (error) {
                console.error('Failed to refresh token:', error);
                throw error;
            }
        }
        
        return response;
    }
    
    /**
     * Verificar si está autenticado
     */
    isAuthenticated() {
        return !!this.accessToken;
    }
    
    /**
     * Obtener access token actual
     */
    getAccessToken() {
        return this.accessToken;
    }
    
    /**
     * Guardar tokens en localStorage
     */
    saveTokens() {
        try {
            localStorage.setItem('bf_access_token', this.accessToken);
            localStorage.setItem('bf_refresh_token', this.refreshToken);
            localStorage.setItem('bf_user_address', this.userAddress);
            localStorage.setItem('bf_chain_id', this.chainId);
        } catch (error) {
            console.error('Error saving tokens to localStorage:', error);
        }
    }
    
    /**
     * Cargar tokens desde localStorage
     */
    loadTokens() {
        try {
            this.accessToken = localStorage.getItem('bf_access_token');
            this.refreshToken = localStorage.getItem('bf_refresh_token');
            this.userAddress = localStorage.getItem('bf_user_address');
            this.chainId = localStorage.getItem('bf_chain_id');
            
            if (this.accessToken) {
                console.log('🔑 Tokens cargados desde localStorage');
            }
        } catch (error) {
            console.error('Error loading tokens from localStorage:', error);
        }
    }
    
    /**
     * Limpiar tokens
     */
    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        this.userAddress = null;
        this.chainId = null;
        
        try {
            localStorage.removeItem('bf_access_token');
            localStorage.removeItem('bf_refresh_token');
            localStorage.removeItem('bf_user_address');
            localStorage.removeItem('bf_chain_id');
        } catch (error) {
            console.error('Error clearing tokens from localStorage:', error);
        }
    }
    
    /**
     * Sistema de eventos
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }
    
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
}

// Crear instancia global
const walletAuthClient = new WalletAuthClient();

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.walletAuthClient = walletAuthClient;
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletAuthClient;
}
