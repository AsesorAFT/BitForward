/**
 * BitForward Wallet Integration v2.0
 * Integración real con MetaMask, Phantom y otras wallets
 */

class WalletManager {
  constructor() {
    this.connectedWallets = new Map();
    this.walletProviders = new Map();
    this.eventListeners = new Map();

    this.initializeProviders();
    this.setupEventListeners();
  }

  initializeProviders() {
    // MetaMask (Ethereum)
    this.walletProviders.set('metamask', {
      name: 'MetaMask',
      blockchain: 'ethereum',
      icon: '🦊',
      detector: () => typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask,
      provider: () => window.ethereum,
    });

    // Phantom (Solana)
    this.walletProviders.set('phantom', {
      name: 'Phantom',
      blockchain: 'solana',
      icon: '👻',
      detector: () => typeof window.solana !== 'undefined' && window.solana.isPhantom,
      provider: () => window.solana,
    });

    // WalletConnect (Universal)
    this.walletProviders.set('walletconnect', {
      name: 'WalletConnect',
      blockchain: 'ethereum',
      icon: '🔗',
      detector: () => typeof window.WalletConnect !== 'undefined',
      provider: () => window.WalletConnect,
    });

    // Coinbase Wallet
    this.walletProviders.set('coinbase', {
      name: 'Coinbase Wallet',
      blockchain: 'ethereum',
      icon: '🔵',
      detector: () => typeof window.ethereum !== 'undefined' && window.ethereum.isCoinbaseWallet,
      provider: () => window.ethereum,
    });
  }

  setupEventListeners() {
    // MetaMask events
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', accounts => {
        this.handleAccountsChanged('metamask', accounts);
      });

      window.ethereum.on('chainChanged', chainId => {
        this.handleChainChanged('metamask', chainId);
      });

      window.ethereum.on('disconnect', () => {
        this.handleDisconnect('metamask');
      });
    }

    // Phantom events
    if (window.solana) {
      window.solana.on('connect', () => {
        this.handleConnect('phantom');
      });

      window.solana.on('disconnect', () => {
        this.handleDisconnect('phantom');
      });

      window.solana.on('accountChanged', publicKey => {
        this.handleAccountsChanged('phantom', [publicKey?.toString()]);
      });
    }
  }

  // === Wallet Detection ===

  getAvailableWallets() {
    const available = [];

    for (const [key, wallet] of this.walletProviders) {
      if (wallet.detector()) {
        available.push({
          id: key,
          name: wallet.name,
          blockchain: wallet.blockchain,
          icon: wallet.icon,
          connected: this.connectedWallets.has(key),
        });
      }
    }

    return available;
  }

  isWalletAvailable(walletId) {
    const wallet = this.walletProviders.get(walletId);
    return wallet && wallet.detector();
  }

  // === Connection Management ===

  async connectWallet(walletId, options = {}) {
    if (!this.isWalletAvailable(walletId)) {
      throw new Error(`Wallet ${walletId} is not available`);
    }

    const wallet = this.walletProviders.get(walletId);

    try {
      let connection;

      switch (walletId) {
        case 'metamask':
          connection = await this.connectMetaMask(options);
          break;
        case 'phantom':
          connection = await this.connectPhantom(options);
          break;
        case 'walletconnect':
          connection = await this.connectWalletConnect(options);
          break;
        case 'coinbase':
          connection = await this.connectCoinbase(options);
          break;
        default:
          throw new Error(`Unsupported wallet: ${walletId}`);
      }

      this.connectedWallets.set(walletId, {
        ...connection,
        walletId,
        blockchain: wallet.blockchain,
        connectedAt: Date.now(),
      });

      this.emitEvent('wallet_connected', { walletId, connection });

      return connection;
    } catch (error) {
      this.emitEvent('wallet_error', { walletId, error: error.message });
      throw error;
    }
  }

  async disconnectWallet(walletId) {
    const connection = this.connectedWallets.get(walletId);
    if (!connection) {
      return;
    }

    try {
      switch (walletId) {
        case 'metamask':
          // MetaMask doesn't have programmatic disconnect
          break;
        case 'phantom':
          await window.solana.disconnect();
          break;
        case 'walletconnect':
          // Handle WalletConnect disconnect
          break;
      }
    } catch (error) {
      console.warn(`Error disconnecting ${walletId}:`, error);
    }

    this.connectedWallets.delete(walletId);
    this.emitEvent('wallet_disconnected', { walletId });
  }

  // === Specific Wallet Implementations ===

  async connectMetaMask(options = {}) {
    const ethereum = window.ethereum;

    // Request account access
    const accounts = await ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (accounts.length === 0) {
      throw new Error('No accounts found');
    }

    // Get network info
    const chainId = await ethereum.request({
      method: 'eth_chainId',
    });

    // Switch to desired network if specified
    if (options.chainId && chainId !== options.chainId) {
      await this.switchEthereumChain(options.chainId);
    }

    return {
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      provider: ethereum,
      isConnected: true,
    };
  }

  async connectPhantom(options = {}) {
    const solana = window.solana;

    // Connect to Phantom
    const response = await solana.connect();

    if (!response.publicKey) {
      throw new Error('Failed to connect to Phantom');
    }

    return {
      address: response.publicKey.toString(),
      publicKey: response.publicKey,
      provider: solana,
      isConnected: true,
    };
  }

  async connectWalletConnect(options = {}) {
    // Implementation for WalletConnect
    throw new Error('WalletConnect implementation pending');
  }

  async connectCoinbase(options = {}) {
    const ethereum = window.ethereum;

    if (!ethereum.isCoinbaseWallet) {
      throw new Error('Coinbase Wallet not detected');
    }

    const accounts = await ethereum.request({
      method: 'eth_requestAccounts',
    });

    const chainId = await ethereum.request({
      method: 'eth_chainId',
    });

    return {
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      provider: ethereum,
      isConnected: true,
    };
  }

  // === Transaction Methods ===

  async signMessage(walletId, message) {
    const connection = this.connectedWallets.get(walletId);
    if (!connection) {
      throw new Error(`Wallet ${walletId} not connected`);
    }

    switch (walletId) {
      case 'metamask':
      case 'coinbase':
        return await connection.provider.request({
          method: 'personal_sign',
          params: [message, connection.address],
        });

      case 'phantom':
        const encodedMessage = new TextEncoder().encode(message);
        const signedMessage = await connection.provider.signMessage(encodedMessage, 'utf8');
        return signedMessage.signature;

      default:
        throw new Error(`Sign message not implemented for ${walletId}`);
    }
  }

  async sendTransaction(walletId, transaction) {
    const connection = this.connectedWallets.get(walletId);
    if (!connection) {
      throw new Error(`Wallet ${walletId} not connected`);
    }

    switch (walletId) {
      case 'metamask':
      case 'coinbase':
        return await connection.provider.request({
          method: 'eth_sendTransaction',
          params: [transaction],
        });

      case 'phantom':
        return await connection.provider.signAndSendTransaction(transaction);

      default:
        throw new Error(`Send transaction not implemented for ${walletId}`);
    }
  }

  // === Network Management ===

  async switchEthereumChain(chainId) {
    const hexChainId = '0x' + chainId.toString(16);

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError) {
      // Chain not added to wallet
      if (switchError.code === 4902) {
        await this.addEthereumChain(chainId);
      } else {
        throw switchError;
      }
    }
  }

  async addEthereumChain(chainId) {
    const networks = {
      1: {
        chainName: 'Ethereum Mainnet',
        rpcUrls: ['https://mainnet.infura.io/v3/'],
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        blockExplorerUrls: ['https://etherscan.io'],
      },
      5: {
        chainName: 'Goerli Testnet',
        rpcUrls: ['https://goerli.infura.io/v3/'],
        nativeCurrency: { name: 'GoerliETH', symbol: 'ETH', decimals: 18 },
        blockExplorerUrls: ['https://goerli.etherscan.io'],
      },
    };

    const network = networks[chainId];
    if (!network) {
      throw new Error(`Unsupported network: ${chainId}`);
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: '0x' + chainId.toString(16),
          ...network,
        },
      ],
    });
  }

  // === Event System ===

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  emitEvent(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in wallet event listener:', error);
        }
      });
    }
  }

  // === Event Handlers ===

  handleAccountsChanged(walletId, accounts) {
    const connection = this.connectedWallets.get(walletId);
    if (connection) {
      if (accounts.length === 0) {
        this.disconnectWallet(walletId);
      } else {
        connection.address = accounts[0];
        this.emitEvent('account_changed', { walletId, address: accounts[0] });
      }
    }
  }

  handleChainChanged(walletId, chainId) {
    const connection = this.connectedWallets.get(walletId);
    if (connection) {
      connection.chainId = parseInt(chainId, 16);
      this.emitEvent('chain_changed', { walletId, chainId: connection.chainId });
    }
  }

  handleConnect(walletId) {
    this.emitEvent('wallet_connected', { walletId });
  }

  handleDisconnect(walletId) {
    this.disconnectWallet(walletId);
  }

  // === Utility Methods ===

  getConnectedWallet(walletId) {
    return this.connectedWallets.get(walletId);
  }

  getAllConnectedWallets() {
    return Array.from(this.connectedWallets.values());
  }

  isWalletConnected(walletId) {
    return this.connectedWallets.has(walletId);
  }

  getWalletInfo(walletId) {
    return this.walletProviders.get(walletId);
  }
}

// Crear instancia global
const walletManager = new WalletManager();

// Exportar para uso
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WalletManager, walletManager };
} else {
  window.WalletManager = WalletManager;
  window.walletManager = walletManager;
}
