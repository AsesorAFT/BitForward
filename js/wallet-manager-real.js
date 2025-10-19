/**
 * BitForward Real Wallet Manager v1.0
 * Integración real con MetaMask, WalletConnect y otras wallets Web3
 * @author BitForward Team
 * @date 2025-10-19
 */

class RealWalletManager {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.chainId = null;
        this.balance = null;
        this.isConnected = false;
        this.listeners = new Map();
        
        // Configuración de redes soportadas
        this.networks = {
            1: { name: 'Ethereum Mainnet', symbol: 'ETH', explorer: 'https://etherscan.io' },
            5: { name: 'Goerli Testnet', symbol: 'ETH', explorer: 'https://goerli.etherscan.io' },
            137: { name: 'Polygon Mainnet', symbol: 'MATIC', explorer: 'https://polygonscan.com' },
            80001: { name: 'Mumbai Testnet', symbol: 'MATIC', explorer: 'https://mumbai.polygonscan.com' },
            56: { name: 'BSC Mainnet', symbol: 'BNB', explorer: 'https://bscscan.com' },
            43114: { name: 'Avalanche C-Chain', symbol: 'AVAX', explorer: 'https://snowtrace.io' }
        };
        
        // Chain IDs permitidos (testnet y mainnet)
        this.allowedChains = [1, 5, 137, 80001, 56, 43114];
        
        this.init();
    }
    
    /**
     * Inicializar el gestor de wallets
     */
    async init() {
        console.log('🚀 BitForward Wallet Manager iniciando...');
        
        // Detectar si ya hay una wallet conectada previamente
        const savedAddress = localStorage.getItem('bf_wallet_address');
        if (savedAddress && this.isMetaMaskInstalled()) {
            try {
                await this.connectMetaMask(false); // Reconectar silenciosamente
            } catch (error) {
                console.warn('No se pudo reconectar automáticamente:', error.message);
            }
        }
        
        // Escuchar cambios de cuenta y red
        this.setupEventListeners();
    }
    
    /**
     * Verificar si MetaMask está instalado
     */
    isMetaMaskInstalled() {
        return typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
    }
    
    /**
     * Conectar con MetaMask
     * @param {boolean} requestAccounts - Si debe solicitar permiso al usuario
     */
    async connectMetaMask(requestAccounts = true) {
        try {
            if (!this.isMetaMaskInstalled()) {
                throw new Error('MetaMask no está instalado. Por favor instálalo desde metamask.io');
            }
            
            console.log('🦊 Conectando con MetaMask...');
            
            // Crear provider de ethers.js
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Solicitar acceso a las cuentas
            let accounts;
            if (requestAccounts) {
                accounts = await this.provider.send("eth_requestAccounts", []);
            } else {
                accounts = await this.provider.send("eth_accounts", []);
            }
            
            if (!accounts || accounts.length === 0) {
                throw new Error('No se pudo acceder a ninguna cuenta');
            }
            
            // Obtener signer (para firmar transacciones)
            this.signer = this.provider.getSigner();
            this.address = accounts[0];
            
            // Obtener información de la red
            const network = await this.provider.getNetwork();
            this.chainId = network.chainId;
            
            // Verificar que la red sea soportada
            if (!this.allowedChains.includes(this.chainId)) {
                console.warn(`⚠️ Red ${this.chainId} no soportada oficialmente`);
            }
            
            // Obtener balance
            await this.updateBalance();
            
            // Marcar como conectado
            this.isConnected = true;
            
            // Guardar en localStorage
            localStorage.setItem('bf_wallet_address', this.address);
            localStorage.setItem('bf_wallet_chainId', this.chainId);
            
            console.log('✅ Wallet conectado exitosamente');
            console.log('📍 Dirección:', this.address);
            console.log('🌐 Red:', this.getNetworkName());
            console.log('💰 Balance:', ethers.utils.formatEther(this.balance), this.getNetworkSymbol());
            
            // Notificar a listeners
            this.emit('connected', {
                address: this.address,
                chainId: this.chainId,
                balance: this.balance,
                network: this.getNetworkName()
            });
            
            return {
                address: this.address,
                chainId: this.chainId,
                balance: this.balance,
                network: this.getNetworkName(),
                provider: this.provider,
                signer: this.signer
            };
            
        } catch (error) {
            console.error('❌ Error al conectar wallet:', error);
            this.handleConnectionError(error);
            throw error;
        }
    }
    
    /**
     * Desconectar wallet
     */
    disconnect() {
        this.provider = null;
        this.signer = null;
        this.address = null;
        this.chainId = null;
        this.balance = null;
        this.isConnected = false;
        
        localStorage.removeItem('bf_wallet_address');
        localStorage.removeItem('bf_wallet_chainId');
        
        console.log('👋 Wallet desconectado');
        this.emit('disconnected');
    }
    
    /**
     * Actualizar balance de la wallet
     */
    async updateBalance() {
        if (!this.provider || !this.address) {
            throw new Error('Wallet no conectado');
        }
        
        try {
            this.balance = await this.provider.getBalance(this.address);
            this.emit('balanceUpdated', this.balance);
            return this.balance;
        } catch (error) {
            console.error('Error al obtener balance:', error);
            throw error;
        }
    }
    
    /**
     * Obtener balance de un token ERC20
     * @param {string} tokenAddress - Dirección del contrato del token
     */
    async getTokenBalance(tokenAddress) {
        if (!this.provider || !this.address) {
            throw new Error('Wallet no conectado');
        }
        
        try {
            const tokenABI = [
                "function balanceOf(address owner) view returns (uint256)",
                "function decimals() view returns (uint8)",
                "function symbol() view returns (string)"
            ];
            
            const tokenContract = new ethers.Contract(tokenAddress, tokenABI, this.provider);
            
            const balance = await tokenContract.balanceOf(this.address);
            const decimals = await tokenContract.decimals();
            const symbol = await tokenContract.symbol();
            
            return {
                balance: balance,
                formatted: ethers.utils.formatUnits(balance, decimals),
                decimals: decimals,
                symbol: symbol
            };
        } catch (error) {
            console.error('Error al obtener balance del token:', error);
            throw error;
        }
    }
    
    /**
     * Cambiar a una red específica
     * @param {number} chainId - ID de la red
     */
    async switchNetwork(chainId) {
        if (!this.isMetaMaskInstalled()) {
            throw new Error('MetaMask no está instalado');
        }
        
        const chainIdHex = '0x' + chainId.toString(16);
        
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainIdHex }]
            });
            
            console.log(`✅ Cambiado a red ${chainId}`);
            this.chainId = chainId;
            await this.updateBalance();
            
            this.emit('networkChanged', chainId);
        } catch (error) {
            // Si la red no está agregada, intentar agregarla
            if (error.code === 4902) {
                await this.addNetwork(chainId);
            } else {
                console.error('Error al cambiar de red:', error);
                throw error;
            }
        }
    }
    
    /**
     * Agregar una red a MetaMask
     * @param {number} chainId - ID de la red
     */
    async addNetwork(chainId) {
        const networkConfig = this.getNetworkConfig(chainId);
        
        if (!networkConfig) {
            throw new Error(`Configuración de red ${chainId} no disponible`);
        }
        
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [networkConfig]
            });
            
            console.log(`✅ Red ${chainId} agregada exitosamente`);
        } catch (error) {
            console.error('Error al agregar red:', error);
            throw error;
        }
    }
    
    /**
     * Obtener configuración de una red
     * @param {number} chainId - ID de la red
     */
    getNetworkConfig(chainId) {
        const configs = {
            137: {
                chainId: '0x89',
                chainName: 'Polygon Mainnet',
                nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                rpcUrls: ['https://polygon-rpc.com'],
                blockExplorerUrls: ['https://polygonscan.com']
            },
            80001: {
                chainId: '0x13881',
                chainName: 'Mumbai Testnet',
                nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
                blockExplorerUrls: ['https://mumbai.polygonscan.com']
            },
            56: {
                chainId: '0x38',
                chainName: 'BSC Mainnet',
                nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                rpcUrls: ['https://bsc-dataseed.binance.org'],
                blockExplorerUrls: ['https://bscscan.com']
            }
        };
        
        return configs[chainId];
    }
    
    /**
     * Firmar un mensaje
     * @param {string} message - Mensaje a firmar
     */
    async signMessage(message) {
        if (!this.signer) {
            throw new Error('Wallet no conectado');
        }
        
        try {
            const signature = await this.signer.signMessage(message);
            console.log('✍️ Mensaje firmado exitosamente');
            return signature;
        } catch (error) {
            console.error('Error al firmar mensaje:', error);
            throw error;
        }
    }
    
    /**
     * Verificar una firma
     * @param {string} message - Mensaje original
     * @param {string} signature - Firma a verificar
     */
    verifySignature(message, signature) {
        try {
            const recoveredAddress = ethers.utils.verifyMessage(message, signature);
            return recoveredAddress.toLowerCase() === this.address.toLowerCase();
        } catch (error) {
            console.error('Error al verificar firma:', error);
            return false;
        }
    }
    
    /**
     * Enviar transacción
     * @param {Object} transaction - Objeto de transacción
     */
    async sendTransaction(transaction) {
        if (!this.signer) {
            throw new Error('Wallet no conectado');
        }
        
        try {
            console.log('📤 Enviando transacción...');
            const tx = await this.signer.sendTransaction(transaction);
            console.log('⏳ Esperando confirmación...');
            console.log('🔗 Hash:', tx.hash);
            
            const receipt = await tx.wait();
            console.log('✅ Transacción confirmada en el bloque:', receipt.blockNumber);
            
            this.emit('transactionConfirmed', receipt);
            return receipt;
        } catch (error) {
            console.error('Error al enviar transacción:', error);
            throw error;
        }
    }
    
    /**
     * Obtener nombre de la red actual
     */
    getNetworkName() {
        return this.networks[this.chainId]?.name || `Red Desconocida (${this.chainId})`;
    }
    
    /**
     * Obtener símbolo de la red actual
     */
    getNetworkSymbol() {
        return this.networks[this.chainId]?.symbol || 'ETH';
    }
    
    /**
     * Obtener explorador de bloques de la red actual
     */
    getExplorer() {
        return this.networks[this.chainId]?.explorer || 'https://etherscan.io';
    }
    
    /**
     * Formatear dirección (0x1234...5678)
     * @param {string} address - Dirección a formatear
     */
    formatAddress(address = this.address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    /**
     * Formatear balance
     * @param {BigNumber} balance - Balance en Wei
     * @param {number} decimals - Decimales a mostrar
     */
    formatBalance(balance = this.balance, decimals = 4) {
        if (!balance) return '0';
        return parseFloat(ethers.utils.formatEther(balance)).toFixed(decimals);
    }
    
    /**
     * Configurar listeners de eventos
     */
    setupEventListeners() {
        if (!window.ethereum) return;
        
        // Listener para cambio de cuenta
        window.ethereum.on('accountsChanged', async (accounts) => {
            console.log('🔄 Cuenta cambiada');
            
            if (accounts.length === 0) {
                this.disconnect();
            } else {
                this.address = accounts[0];
                await this.updateBalance();
                this.emit('accountChanged', this.address);
            }
        });
        
        // Listener para cambio de red
        window.ethereum.on('chainChanged', (chainIdHex) => {
            console.log('🔄 Red cambiada');
            const newChainId = parseInt(chainIdHex, 16);
            this.chainId = newChainId;
            
            // Recargar la página para evitar problemas
            window.location.reload();
        });
        
        // Listener para desconexión
        window.ethereum.on('disconnect', () => {
            console.log('🔌 MetaMask desconectado');
            this.disconnect();
        });
    }
    
    /**
     * Manejar errores de conexión
     */
    handleConnectionError(error) {
        let userMessage = 'Error al conectar wallet';
        
        if (error.code === 4001) {
            userMessage = 'Conexión rechazada por el usuario';
        } else if (error.code === -32002) {
            userMessage = 'Ya hay una solicitud de conexión pendiente. Por favor revisa MetaMask';
        } else if (error.message.includes('No se pudo acceder')) {
            userMessage = 'No se detectó ninguna cuenta en MetaMask';
        }
        
        // Mostrar notificación al usuario
        if (typeof showNotification === 'function') {
            showNotification(userMessage, 'error');
        } else {
            alert(userMessage);
        }
    }
    
    /**
     * Sistema de eventos simple
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en listener de ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Obtener resumen del estado de la wallet
     */
    getStatus() {
        return {
            isConnected: this.isConnected,
            address: this.address,
            formattedAddress: this.formatAddress(),
            chainId: this.chainId,
            network: this.getNetworkName(),
            networkSymbol: this.getNetworkSymbol(),
            balance: this.balance,
            formattedBalance: this.formatBalance(),
            explorer: this.getExplorer()
        };
    }
}

// Exportar instancia singleton
const walletManager = new RealWalletManager();

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.walletManager = walletManager;
}

// Exportar para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealWalletManager;
}
