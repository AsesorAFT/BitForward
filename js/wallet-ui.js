/**
 * BitForward Wallet UI Component v2.0
 * Interfaz de usuario para la gestión de wallets
 */

class WalletUI {
  constructor(containerSelector, walletManager) {
    this.container = document.querySelector(containerSelector);
    this.walletManager = walletManager;
    this.isOpen = false;

    this.init();
    this.setupEventListeners();
  }

  init() {
    this.createWalletButton();
    this.createWalletModal();
    this.createWalletStatus();
  }

  createWalletButton() {
    const button = document.createElement('button');
    button.id = 'wallet-connect-btn';
    button.className = 'wallet-connect-btn';
    button.innerHTML = `
            <span class="wallet-icon">
                <span style="font-size: 14px; margin-right: 2px;">₿</span>
                <span style="font-size: 12px; margin-right: 2px;">Ξ</span>
                <span style="font-size: 14px;">◎</span>
            </span>
            <span class="wallet-text">Connect Wallet</span>
            <span class="wallet-status-indicator"></span>
        `;

    this.container.appendChild(button);
    this.connectButton = button;
  }

  createWalletModal() {
    const modal = document.createElement('div');
    modal.id = 'wallet-modal';
    modal.className = 'wallet-modal';
    modal.innerHTML = `
            <div class="wallet-modal-overlay">
                <div class="wallet-modal-content">
                    <div class="wallet-modal-header">
                        <h3>Connect a Wallet</h3>
                        <button class="wallet-modal-close">&times;</button>
                    </div>
                    
                    <div class="wallet-modal-body">
                        <div class="wallet-list" id="wallet-list">
                            <!-- Wallets will be populated here -->
                        </div>
                        
                        <div class="wallet-info">
                            <p class="wallet-info-text">
                                By connecting a wallet, you agree to BitForward's 
                                <a href="#" target="_blank">Terms of Service</a> and 
                                <a href="#" target="_blank">Privacy Policy</a>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(modal);
    this.modal = modal;
  }

  createWalletStatus() {
    const status = document.createElement('div');
    status.id = 'wallet-status';
    status.className = 'wallet-status hidden';
    status.innerHTML = `
            <div class="wallet-status-content">
                <div class="wallet-status-info">
                    <span class="wallet-status-icon"></span>
                    <div class="wallet-status-details">
                        <div class="wallet-status-name"></div>
                        <div class="wallet-status-address"></div>
                        <div class="wallet-status-network"></div>
                    </div>
                </div>
                
                <div class="wallet-status-actions">
                    <button class="wallet-status-copy" title="Copy Address">📋</button>
                    <button class="wallet-status-disconnect" title="Disconnect">🔌</button>
                </div>
            </div>
        `;

    this.container.appendChild(status);
    this.statusComponent = status;
  }

  setupEventListeners() {
    // Connect button
    this.connectButton.addEventListener('click', () => {
      this.showModal();
    });

    // Modal close
    this.modal.querySelector('.wallet-modal-close').addEventListener('click', () => {
      this.hideModal();
    });

    // Modal overlay click
    this.modal.querySelector('.wallet-modal-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        this.hideModal();
      }
    });

    // Status actions
    this.statusComponent.querySelector('.wallet-status-copy').addEventListener('click', () => {
      this.copyAddress();
    });

    this.statusComponent.querySelector('.wallet-status-disconnect').addEventListener('click', () => {
      this.disconnectWallet();
    });

    // Wallet manager events
    this.walletManager.on('wallet_connected', (data) => {
      this.onWalletConnected(data);
    });

    this.walletManager.on('wallet_disconnected', (data) => {
      this.onWalletDisconnected(data);
    });

    this.walletManager.on('wallet_error', (data) => {
      this.onWalletError(data);
    });

    this.walletManager.on('account_changed', (data) => {
      this.onAccountChanged(data);
    });

    this.walletManager.on('chain_changed', (data) => {
      this.onChainChanged(data);
    });

    // Keyboard events
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.hideModal();
      }
    });
  }

  showModal() {
    this.populateWalletList();
    this.modal.classList.add('show');
    this.isOpen = true;

    // Focus management
    const firstWallet = this.modal.querySelector('.wallet-item');
    if (firstWallet) {
      firstWallet.focus();
    }
  }

  hideModal() {
    this.modal.classList.remove('show');
    this.isOpen = false;
  }

  populateWalletList() {
    const walletList = this.modal.querySelector('#wallet-list');
    const availableWallets = this.walletManager.getAvailableWallets();

    walletList.innerHTML = '';

    if (availableWallets.length === 0) {
      walletList.innerHTML = `
                <div class="wallet-empty">
                    <div class="wallet-empty-icon">🔍</div>
                    <h4>No Wallets Found</h4>
                    <p>Please install a supported wallet extension:</p>
                    <div class="wallet-download-links">
                        <a href="https://metamask.io/download/" target="_blank" class="wallet-download-link">
                            <span>🦊</span> MetaMask
                        </a>
                        <a href="https://phantom.app/" target="_blank" class="wallet-download-link">
                            <span>👻</span> Phantom
                        </a>
                    </div>
                </div>
            `;
      return;
    }

    availableWallets.forEach(wallet => {
      const walletItem = this.createWalletItem(wallet);
      walletList.appendChild(walletItem);
    });
  }

  createWalletItem(wallet) {
    const item = document.createElement('button');
    item.className = `wallet-item ${wallet.connected ? 'connected' : ''}`;
    item.dataset.walletId = wallet.id;

    item.innerHTML = `
            <div class="wallet-item-icon">${wallet.icon}</div>
            <div class="wallet-item-info">
                <div class="wallet-item-name">${wallet.name}</div>
                <div class="wallet-item-blockchain">${wallet.blockchain}</div>
                ${wallet.connected ? '<div class="wallet-item-status">Connected</div>' : ''}
            </div>
            <div class="wallet-item-arrow">→</div>
        `;

    item.addEventListener('click', () => {
      this.connectToWallet(wallet.id);
    });

    return item;
  }

  async connectToWallet(walletId) {
    const walletItem = this.modal.querySelector(`[data-wallet-id="${walletId}"]`);

    try {
      // Show loading state
      walletItem.classList.add('loading');
      walletItem.querySelector('.wallet-item-arrow').textContent = '⏳';

      await this.walletManager.connectWallet(walletId);

      // Success will be handled by the event listener

    } catch (error) {
      console.error('Failed to connect wallet:', error);

      // Reset loading state
      walletItem.classList.remove('loading');
      walletItem.querySelector('.wallet-item-arrow').textContent = '→';

      this.showError(`Failed to connect ${walletId}: ${error.message}`);
    }
  }

  onWalletConnected(data) {
    const { walletId, connection } = data;

    // Hide modal
    this.hideModal();

    // Update UI
    this.updateConnectedState(walletId, connection);

    // Show success notification
    this.showSuccess(`${this.walletManager.getWalletInfo(walletId).name} connected successfully!`);
  }

  onWalletDisconnected(data) {
    const { walletId } = data;

    // Update UI
    this.updateDisconnectedState();

    // Show notification
    this.showInfo(`${this.walletManager.getWalletInfo(walletId).name} disconnected`);
  }

  onWalletError(data) {
    const { walletId, error } = data;
    this.showError(`Wallet error: ${error}`);
  }

  onAccountChanged(data) {
    const { walletId, address } = data;
    this.updateWalletAddress(address);
    this.showInfo('Account changed');
  }

  onChainChanged(data) {
    const { walletId, chainId } = data;
    this.updateWalletNetwork(chainId);
    this.showInfo('Network changed');
  }

  updateConnectedState(walletId, connection) {
    const walletInfo = this.walletManager.getWalletInfo(walletId);

    // Update connect button
    this.connectButton.classList.add('connected');
    this.connectButton.querySelector('.wallet-text').textContent = 'Connected';
    this.connectButton.querySelector('.wallet-status-indicator').classList.add('connected');

    // Show status component
    this.statusComponent.classList.remove('hidden');
    this.statusComponent.querySelector('.wallet-status-icon').textContent = walletInfo.icon;
    this.statusComponent.querySelector('.wallet-status-name').textContent = walletInfo.name;
    this.statusComponent.querySelector('.wallet-status-address').textContent = this.formatAddress(connection.address);

    // Update network info
    if (connection.chainId) {
      this.updateWalletNetwork(connection.chainId);
    }
  }

  updateDisconnectedState() {
    // Update connect button
    this.connectButton.classList.remove('connected');
    this.connectButton.querySelector('.wallet-text').textContent = 'Connect Wallet';
    this.connectButton.querySelector('.wallet-status-indicator').classList.remove('connected');

    // Hide status component
    this.statusComponent.classList.add('hidden');
  }

  updateWalletAddress(address) {
    const addressElement = this.statusComponent.querySelector('.wallet-status-address');
    if (addressElement) {
      addressElement.textContent = this.formatAddress(address);
    }
  }

  updateWalletNetwork(chainId) {
    const networkElement = this.statusComponent.querySelector('.wallet-status-network');
    if (networkElement) {
      networkElement.textContent = this.getNetworkName(chainId);
    }
  }

  async copyAddress() {
    const connectedWallets = this.walletManager.getAllConnectedWallets();
    if (connectedWallets.length > 0) {
      const address = connectedWallets[0].address;

      try {
        await navigator.clipboard.writeText(address);
        this.showSuccess('Address copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy address:', error);
        this.showError('Failed to copy address');
      }
    }
  }

  async disconnectWallet() {
    const connectedWallets = this.walletManager.getAllConnectedWallets();

    for (const wallet of connectedWallets) {
      await this.walletManager.disconnectWallet(wallet.walletId);
    }
  }

  formatAddress(address) {
    if (!address) {return '';}
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  getNetworkName(chainId) {
    const networks = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      137: 'Polygon',
      'mainnet-beta': 'Solana Mainnet',
      'devnet': 'Solana Devnet'
    };

    return networks[chainId] || `Chain ${chainId}`;
  }

  // Notification methods
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showInfo(message) {
    this.showNotification(message, 'info');
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `wallet-notification wallet-notification-${type}`;
    notification.textContent = message;

    // Add to page
    document.body.appendChild(notification);

    // Show with animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Auto remove
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof walletManager !== 'undefined') {
      window.walletUI = new WalletUI('#wallet-container', walletManager);
    }
  });
} else {
  if (typeof walletManager !== 'undefined') {
    window.walletUI = new WalletUI('#wallet-container', walletManager);
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WalletUI;
} else {
  window.WalletUI = WalletUI;
}
