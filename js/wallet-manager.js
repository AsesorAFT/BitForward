/**
 * BitForward Wallet Manager v2.0
 * Sistema completo de gestión de wallets multi-blockchain
 */

class WalletManager {
    constructor() {
        this.connectedWallets = new Map();
        this.availableWallets = new Map();
        this.eventListeners = new Map();
        this.detectionInterval = null;
        
        this.initialize();
    }

    async initialize() {
        console.log('🔗 Initializing Wallet Manager...');
        
        // Detectar wallets disponibles
        await this.detectWallets();
        
        // Configurar listeners de eventos
        this.setupEventListeners();
        
        // Iniciar detección periódica
        this.startPeriodicDetection();
        
        console.log('✅ Wallet Manager initialized');
    }

    async detectWallets() {
        const wallets = [];

        // Detectar MetaMask (Ethereum)
        if (this.isMetaMaskAvailable()) {
            wallets.push({
                id: 'metamask',
                name: 'MetaMask',
                icon: '🦊',
                blockchain: 'Ethereum',
                type: 'browser_extension',
                available: true,
                connected: false,
                provider: window.ethereum
            });
        }

        // Detectar Phantom (Solana)
        if (this.isPhantomAvailable()) {
            wallets.push({
                id: 'phantom',
                name: 'Phantom',
                icon: '👻',
                blockchain: 'Solana',
                type: 'browser_extension',
                available: true,
                connected: false,
                provider: window.solana
            });
        }

        // Detectar Coinbase Wallet
        if (this.isCoinbaseWalletAvailable()) {
            wallets.push({
                id: 'coinbase',
                name: 'Coinbase Wallet',
                icon: '🔵',
                blockchain: 'Ethereum',
                type: 'browser_extension',
                available: true,
                connected: false,
                provider: window.ethereum
            });
        }

        // Detectar WalletConnect
        wallets.push({
            id: 'walletconnect',
            name: 'WalletConnect',
            icon: '🔗',
            blockchain: 'Multi-chain',
            type: 'qr_code',
            available: true,
            connected: false,
            provider: null
        });

        // Simular Bitcoin wallet (Unisat, Xverse, etc.)
        if (this.isBitcoinWalletAvailable()) {
            wallets.push({
                id: 'unisat',
                name: 'Unisat Wallet',
                icon: '₿',
                blockchain: 'Bitcoin',
                type: 'browser_extension',
                available: true,
                connected: false,
                provider: window.unisat
            });
        }

        // Actualizar lista de wallets disponibles
        this.availableWallets.clear();
        wallets.forEach(wallet => {
            this.availableWallets.set(wallet.id, wallet);
        });

        console.log(`📱 Detected ${wallets.length} available wallets:`, wallets.map(w => w.name));
    }

    // Detección de wallets específicas
    isMetaMaskAvailable() {
        return typeof window !== 'undefined' && 
               typeof window.ethereum !== 'undefined' && 
               window.ethereum.isMetaMask === true;
    }

    isPhantomAvailable() {
        return typeof window !== 'undefined' && 
               typeof window.solana !== 'undefined' && 
               window.solana.isPhantom === true;
    }

    isCoinbaseWalletAvailable() {
        return typeof window !== 'undefined' && 
               typeof window.ethereum !== 'undefined' && 
               window.ethereum.isCoinbaseWallet === true;
    }

    isBitcoinWalletAvailable() {
        return typeof window !== 'undefined' && 
               (typeof window.unisat !== 'undefined' || 
                typeof window.btc !== 'undefined');
    }

    setupEventListeners() {
        // MetaMask events
        if (window.ethereum && window.ethereum.isMetaMask) {
            window.ethereum.on('accountsChanged', (accounts) => {
                this.handleAccountChanged('metamask', accounts);
            });

            window.ethereum.on('chainChanged', (chainId) => {
                this.handleChainChanged('metamask', chainId);
            });

            window.ethereum.on('disconnect', () => {
                this.handleWalletDisconnected('metamask');
            });
        }

        // Phantom events
        if (window.solana && window.solana.isPhantom) {
            window.solana.on('accountChanged', (publicKey) => {
                this.handleAccountChanged('phantom', publicKey ? [publicKey.toString()] : []);
            });

            window.solana.on('disconnect', () => {
                this.handleWalletDisconnected('phantom');
            });
        }
    }

    startPeriodicDetection() {
        // Detectar nuevas wallets cada 5 segundos
        this.detectionInterval = setInterval(async () => {
            const currentCount = this.availableWallets.size;
            await this.detectWallets();
            
            if (this.availableWallets.size !== currentCount) {
                this.emit('wallets_updated', {
                    available: this.getAvailableWallets()
                });
            }
        }, 5000);
    }

    stopPeriodicDetection() {
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }
    }

    // Conexión de wallets
    async connectWallet(walletId) {
        const wallet = this.availableWallets.get(walletId);
        
        if (!wallet) {
            throw new Error(`Wallet ${walletId} not found`);
        }

        if (!wallet.available) {
            throw new Error(`Wallet ${walletId} not available`);
        }

        console.log(`🔗 Connecting to ${wallet.name}...`);

        try {
            let connection;

            switch (walletId) {
                case 'metamask':
                    connection = await this.connectMetaMask();
                    break;
                case 'phantom':
                    connection = await this.connectPhantom();
                    break;
                case 'coinbase':
                    connection = await this.connectCoinbaseWallet();
                    break;
                case 'walletconnect':
                    connection = await this.connectWalletConnect();
                    break;
                case 'unisat':
                    connection = await this.connectUnisat();
                    break;
                default:
                    throw new Error(`Connection not implemented for ${walletId}`);
            }

            // Guardar conexión
            this.connectedWallets.set(walletId, {
                walletId,
                connection,
                connectedAt: new Date().toISOString()
            });

            // Actualizar estado de wallet
            wallet.connected = true;
            wallet.connection = connection;

            // Emitir evento
            this.emit('wallet_connected', {
                walletId,
                connection,
                wallet
            });

            console.log(`✅ Connected to ${wallet.name}:`, connection.address);
            return connection;

        } catch (error) {
            console.error(`❌ Failed to connect to ${wallet.name}:`, error);
            
            this.emit('wallet_error', {
                walletId,
                error: error.message
            });
            
            throw error;
        }
    }

    async connectMetaMask() {
        if (!window.ethereum || !window.ethereum.isMetaMask) {
            throw new Error('MetaMask not installed');
        }

        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        if (accounts.length === 0) {
            throw new Error('No accounts found in MetaMask');
        }

        const chainId = await window.ethereum.request({
            method: 'eth_chainId'
        });

        const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest']
        });

        return {
            address: accounts[0],
            chainId: parseInt(chainId, 16),
            balance: parseInt(balance, 16) / Math.pow(10, 18),
            provider: window.ethereum
        };
    }

    async connectPhantom() {
        if (!window.solana || !window.solana.isPhantom) {
            throw new Error('Phantom wallet not installed');
        }

        const response = await window.solana.connect();
        
        if (!response.publicKey) {
            throw new Error('Failed to connect to Phantom');
        }

        // Obtener balance (simulado)
        const balance = Math.random() * 100; // En producción: usar solana-web3.js

        return {
            address: response.publicKey.toString(),
            balance,
            provider: window.solana
        };
    }

    async connectCoinbaseWallet() {
        if (!window.ethereum || !window.ethereum.isCoinbaseWallet) {
            throw new Error('Coinbase Wallet not installed');
        }

        // Similar a MetaMask pero específico para Coinbase
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        return {
            address: accounts[0],
            chainId: 1,
            balance: 0,
            provider: window.ethereum
        };
    }

    async connectWalletConnect() {
        // Implementación básica de WalletConnect
        // En producción: usar @walletconnect/client
        
        throw new Error('WalletConnect implementation coming soon');
    }

    async connectUnisat() {
        if (!window.unisat) {
            throw new Error('Unisat wallet not installed');
        }

        const accounts = await window.unisat.requestAccounts();
        const balance = await window.unisat.getBalance();

        return {
            address: accounts[0],
            balance: balance.confirmed / 100000000, // Satoshis to BTC
            provider: window.unisat
        };
    }

    // Desconexión de wallets
    async disconnectWallet(walletId) {
        const connectedWallet = this.connectedWallets.get(walletId);
        
        if (!connectedWallet) {
            console.warn(`Wallet ${walletId} not connected`);
            return;
        }

        try {
            // Desconectar según el tipo de wallet
            switch (walletId) {
                case 'phantom':
                    if (window.solana && window.solana.disconnect) {
                        await window.solana.disconnect();
                    }
                    break;
                // MetaMask no tiene método de desconexión programática
                // Los usuarios deben desconectar manualmente desde la extensión
            }

            // Limpiar estado
            this.connectedWallets.delete(walletId);
            
            const wallet = this.availableWallets.get(walletId);
            if (wallet) {
                wallet.connected = false;
                delete wallet.connection;
            }

            this.emit('wallet_disconnected', {
                walletId
            });

            console.log(`🔌 Disconnected from ${walletId}`);

        } catch (error) {
            console.error(`Error disconnecting from ${walletId}:`, error);
            throw error;
        }
    }

    async disconnectAllWallets() {
        const connectedWalletIds = Array.from(this.connectedWallets.keys());
        
        for (const walletId of connectedWalletIds) {
            await this.disconnectWallet(walletId);
        }
    }

    // Event handlers
    handleAccountChanged(walletId, accounts) {
        console.log(`📱 Account changed for ${walletId}:`, accounts);
        
        if (accounts.length === 0) {
            this.handleWalletDisconnected(walletId);
        } else {
            const connectedWallet = this.connectedWallets.get(walletId);
            if (connectedWallet) {
                connectedWallet.connection.address = accounts[0];
                
                this.emit('account_changed', {
                    walletId,
                    address: accounts[0]
                });
            }
        }
    }

    handleChainChanged(walletId, chainId) {
        console.log(`⛓️ Chain changed for ${walletId}:`, chainId);
        
        const connectedWallet = this.connectedWallets.get(walletId);
        if (connectedWallet) {
            connectedWallet.connection.chainId = parseInt(chainId, 16);
            
            this.emit('chain_changed', {
                walletId,
                chainId: connectedWallet.connection.chainId
            });
        }
    }

    handleWalletDisconnected(walletId) {
        console.log(`🔌 Wallet ${walletId} disconnected`);
        
        this.connectedWallets.delete(walletId);
        
        const wallet = this.availableWallets.get(walletId);
        if (wallet) {
            wallet.connected = false;
            delete wallet.connection;
        }

        this.emit('wallet_disconnected', {
            walletId
        });
    }

    // Getters
    getAvailableWallets() {
        return Array.from(this.availableWallets.values());
    }

    getConnectedWallets() {
        return Array.from(this.connectedWallets.values());
    }

    getAllConnectedWallets() {
        return this.getConnectedWallets();
    }

    getWalletInfo(walletId) {
        return this.availableWallets.get(walletId);
    }

    isWalletConnected(walletId) {
        return this.connectedWallets.has(walletId);
    }

    getConnectedWallet(walletId) {
        return this.connectedWallets.get(walletId);
    }

    // Event system
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in event listener:', error);
                }
            });
        }
    }

    // Utilities
    formatAddress(address, length = 8) {
        if (!address) return '';
        if (address.length <= length) return address;
        
        const start = Math.floor(length / 2);
        const end = length - start;
        
        return `${address.slice(0, start)}...${address.slice(-end)}`;
    }

    getNetworkName(chainId) {
        const networks = {
            1: 'Ethereum Mainnet',
            3: 'Ropsten Testnet',
            4: 'Rinkeby Testnet',
            5: 'Goerli Testnet',
            42: 'Kovan Testnet',
            56: 'BSC Mainnet',
            97: 'BSC Testnet',
            137: 'Polygon Mainnet',
            80001: 'Polygon Mumbai',
            250: 'Fantom Opera',
            4002: 'Fantom Testnet',
            43114: 'Avalanche Mainnet',
            43113: 'Avalanche Fuji'
        };
        
        return networks[chainId] || `Chain ${chainId}`;
    }

    // Cleanup
    destroy() {
        this.stopPeriodicDetection();
        this.disconnectAllWallets();
        this.eventListeners.clear();
        this.availableWallets.clear();
        this.connectedWallets.clear();
    }
}

// Auto-initialize
if (typeof window !== 'undefined') {
    // Esperar a que la página esté cargada
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.walletManager = new WalletManager();
        });
    } else {
        window.walletManager = new WalletManager();
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletManager;
} else if (typeof window !== 'undefined') {
    window.WalletManager = WalletManager;
}

console.log('🔗 WalletManager loaded');
