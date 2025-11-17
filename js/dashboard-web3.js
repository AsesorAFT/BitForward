/**
 * BitForward Dashboard Web3 Integration
 * Integración del Wallet Manager con el Dashboard UI
 * @author BitForward Team
 * @date 2025-10-19
 */

class DashboardWeb3 {
  constructor() {
    this.walletManager = null;
    this.isInitialized = false;
    this.updateInterval = null;

    this.init();
  }

  /**
     * Inicializar integración Web3 en el dashboard
     */
  async init() {
    console.log('🚀 Inicializando Dashboard Web3...');

    // Esperar a que walletManager esté disponible
    if (typeof walletManager !== 'undefined') {
      this.walletManager = walletManager;
      this.setupEventListeners();
      this.setupUIHandlers();
      this.isInitialized = true;
      console.log('✅ Dashboard Web3 inicializado');
    } else {
      console.error('❌ walletManager no disponible');
    }
  }

  /**
     * Configurar event listeners del wallet
     */
  setupEventListeners() {
    // Cuando se conecta el wallet
    this.walletManager.on('connected', (data) => {
      console.log('🔗 Wallet conectado en dashboard:', data);
      this.updateUI(data);
      this.startAutoUpdate();
      this.showSuccessNotification('Wallet conectado exitosamente');
    });

    // Cuando se desconecta
    this.walletManager.on('disconnected', () => {
      console.log('👋 Wallet desconectado');
      this.resetUI();
      this.stopAutoUpdate();
      this.showInfoNotification('Wallet desconectado');
    });

    // Cuando cambia la cuenta
    this.walletManager.on('accountChanged', (address) => {
      console.log('🔄 Cuenta cambiada:', address);
      this.showInfoNotification(`Cuenta cambiada: ${this.walletManager.formatAddress(address)}`);
      this.refreshData();
    });

    // Cuando se actualiza el balance
    this.walletManager.on('balanceUpdated', (balance) => {
      this.updateBalanceDisplay(balance);
    });
  }

  /**
     * Configurar handlers de UI
     */
  setupUIHandlers() {
    // Botón de conectar wallet
    const walletBtn = document.getElementById('wallet-connect');
    if (walletBtn) {
      walletBtn.addEventListener('click', () => this.handleConnectClick());
    }

    // Botón de desconectar (si existe)
    const disconnectBtn = document.getElementById('wallet-disconnect');
    if (disconnectBtn) {
      disconnectBtn.addEventListener('click', () => this.handleDisconnect());
    }

    // Click en dirección de wallet para copiar
    const addressDisplay = document.getElementById('wallet-address');
    if (addressDisplay) {
      addressDisplay.addEventListener('click', () => this.copyAddressToClipboard());
    }
  }

  /**
     * Manejar click en botón de conectar
     */
  async handleConnectClick() {
    const walletBtn = document.getElementById('wallet-connect');

    if (this.walletManager.isConnected) {
      // Si ya está conectado, mostrar opciones
      this.showWalletMenu();
    } else {
      // Intentar conectar
      try {
        walletBtn.disabled = true;
        walletBtn.textContent = 'Conectando...';

        await this.walletManager.connectMetaMask();

      } catch (error) {
        console.error('Error al conectar:', error);
        walletBtn.disabled = false;
        walletBtn.textContent = 'Conectar Wallet';
      }
    }
  }

  /**
     * Manejar desconexión
     */
  handleDisconnect() {
    if (confirm('¿Deseas desconectar tu wallet?')) {
      this.walletManager.disconnect();
    }
  }

  /**
     * Actualizar UI con datos del wallet
     */
  updateUI(walletData) {
    const walletBtn = document.getElementById('wallet-connect');
    const addressDisplay = document.getElementById('wallet-address');
    const networkDisplay = document.getElementById('network-name');
    const balanceDisplay = document.getElementById('wallet-balance');

    // Actualizar botón
    if (walletBtn) {
      walletBtn.textContent = this.walletManager.formatAddress(walletData.address);
      walletBtn.classList.add('connected');
      walletBtn.disabled = false;
    }

    // Actualizar dirección
    if (addressDisplay) {
      addressDisplay.textContent = this.walletManager.formatAddress(walletData.address);
      addressDisplay.title = walletData.address;
      addressDisplay.style.cursor = 'pointer';
    }

    // Actualizar red
    if (networkDisplay) {
      networkDisplay.textContent = walletData.network;

      // Agregar indicador de red
      const networkDot = document.createElement('span');
      networkDot.className = 'network-indicator';
      networkDot.style.cssText = `
                display: inline-block;
                width: 8px;
                height: 8px;
                background: #10b981;
                border-radius: 50%;
                margin-right: 5px;
                animation: pulse 2s ease-in-out infinite;
            `;
      networkDisplay.prepend(networkDot);
    }

    // Actualizar balance
    if (balanceDisplay) {
      this.updateBalanceDisplay(walletData.balance);
    }

    // Mostrar sección de wallet conectado
    const connectedSection = document.getElementById('wallet-connected-section');
    if (connectedSection) {
      connectedSection.style.display = 'block';
    }

    // Ocultar mensaje de "no conectado"
    const notConnectedMsg = document.getElementById('wallet-not-connected');
    if (notConnectedMsg) {
      notConnectedMsg.style.display = 'none';
    }
  }

  /**
     * Resetear UI al desconectar
     */
  resetUI() {
    const walletBtn = document.getElementById('wallet-connect');
    const addressDisplay = document.getElementById('wallet-address');
    const networkDisplay = document.getElementById('network-name');
    const balanceDisplay = document.getElementById('wallet-balance');

    if (walletBtn) {
      walletBtn.textContent = 'Conectar Wallet';
      walletBtn.classList.remove('connected');
      walletBtn.disabled = false;
    }

    if (addressDisplay) {
      addressDisplay.textContent = 'No conectado';
      addressDisplay.style.cursor = 'default';
    }

    if (networkDisplay) {
      networkDisplay.textContent = '-';
    }

    if (balanceDisplay) {
      balanceDisplay.textContent = '0.0000';
    }

    // Mostrar mensaje de "no conectado"
    const notConnectedMsg = document.getElementById('wallet-not-connected');
    if (notConnectedMsg) {
      notConnectedMsg.style.display = 'block';
    }

    // Ocultar sección conectada
    const connectedSection = document.getElementById('wallet-connected-section');
    if (connectedSection) {
      connectedSection.style.display = 'none';
    }
  }

  /**
     * Actualizar display del balance
     */
  updateBalanceDisplay(balance) {
    const balanceDisplay = document.getElementById('wallet-balance');
    if (balanceDisplay && balance) {
      const formatted = this.walletManager.formatBalance(balance);
      const symbol = this.walletManager.getNetworkSymbol();
      balanceDisplay.textContent = `${formatted} ${symbol}`;
    }
  }

  /**
     * Copiar dirección al portapapeles
     */
  async copyAddressToClipboard() {
    if (!this.walletManager.address) {return;}

    try {
      await navigator.clipboard.writeText(this.walletManager.address);
      this.showSuccessNotification('Dirección copiada al portapapeles');
    } catch (error) {
      console.error('Error al copiar:', error);
      // Fallback para navegadores antiguos
      const input = document.createElement('input');
      input.value = this.walletManager.address;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      this.showSuccessNotification('Dirección copiada');
    }
  }

  /**
     * Mostrar menú de opciones del wallet
     */
  showWalletMenu() {
    const status = this.walletManager.getStatus();

    const menu = document.createElement('div');
    menu.className = 'wallet-menu glass-effect';
    menu.innerHTML = `
            <div class="wallet-menu-content" style="
                position: absolute;
                top: 60px;
                right: 20px;
                background: rgba(30, 41, 59, 0.95);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(59, 130, 246, 0.2);
                border-radius: 12px;
                padding: 1rem;
                min-width: 250px;
                z-index: 1000;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            ">
                <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <p style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 0.5rem;">Wallet Conectado</p>
                    <p style="color: #fff; font-family: monospace; font-size: 0.875rem;">${status.formattedAddress}</p>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <p style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 0.25rem;">Red</p>
                    <p style="color: #06b6d4; font-weight: 600;">${status.network}</p>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <p style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 0.25rem;">Balance</p>
                    <p style="color: #fff; font-size: 1.25rem; font-weight: 700;">${status.formattedBalance} ${status.networkSymbol}</p>
                </div>
                
                <div style="display: flex; gap: 0.5rem; flex-direction: column;">
                    <button onclick="dashboardWeb3.copyAddressToClipboard()" class="btn-secondary" style="
                        width: 100%;
                        padding: 0.5rem;
                        background: rgba(59, 130, 246, 0.2);
                        color: #3b82f6;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                    ">
                        📋 Copiar Dirección
                    </button>
                    
                    <button onclick="window.open('${status.explorer}/address/${status.address}', '_blank')" class="btn-secondary" style="
                        width: 100%;
                        padding: 0.5rem;
                        background: rgba(59, 130, 246, 0.2);
                        color: #3b82f6;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                    ">
                        🔍 Ver en Explorer
                    </button>
                    
                    <button onclick="dashboardWeb3.handleDisconnect()" class="btn-danger" style="
                        width: 100%;
                        padding: 0.5rem;
                        background: rgba(239, 68, 68, 0.2);
                        color: #ef4444;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                        font-weight: 500;
                    ">
                        🚪 Desconectar
                    </button>
                </div>
            </div>
        `;

    // Remover menú anterior si existe
    const oldMenu = document.querySelector('.wallet-menu');
    if (oldMenu) {oldMenu.remove();}

    document.body.appendChild(menu);

    // Cerrar al hacer click fuera
    setTimeout(() => {
      const closeMenu = (e) => {
        if (!menu.contains(e.target) && !document.getElementById('wallet-connect').contains(e.target)) {
          menu.remove();
          document.removeEventListener('click', closeMenu);
        }
      };
      document.addEventListener('click', closeMenu);
    }, 100);
  }

  /**
     * Refrescar datos del dashboard
     */
  async refreshData() {
    if (!this.walletManager.isConnected) {return;}

    try {
      await this.walletManager.updateBalance();
      // Aquí puedes agregar más llamadas para actualizar otros datos
    } catch (error) {
      console.error('Error al refrescar datos:', error);
    }
  }

  /**
     * Iniciar actualización automática
     */
  startAutoUpdate() {
    if (this.updateInterval) {return;}

    // Actualizar cada 30 segundos
    this.updateInterval = setInterval(() => {
      this.refreshData();
    }, 30000);

    console.log('✅ Auto-actualización activada (30s)');
  }

  /**
     * Detener actualización automática
     */
  stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('⏸️ Auto-actualización detenida');
    }
  }

  /**
     * Sistema de notificaciones
     */
  showSuccessNotification(message) {
    this.showNotification(message, 'success');
  }

  showErrorNotification(message) {
    this.showNotification(message, 'error');
  }

  showInfoNotification(message) {
    this.showNotification(message, 'info');
  }

  showNotification(message, type = 'info') {
    // Usar el sistema de notificaciones existente si está disponible
    if (typeof showNotification === 'function') {
      showNotification(message, type);
      return;
    }

    // Fallback: crear notificación simple
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(16, 185, 129, 0.9)' : type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.9)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
     * Obtener estado de conexión
     */
  getConnectionStatus() {
    return {
      isConnected: this.walletManager?.isConnected || false,
      hasWallet: this.walletManager?.isMetaMaskInstalled() || false,
      ...this.walletManager?.getStatus()
    };
  }
}

// Inicializar cuando el DOM esté listo
let dashboardWeb3;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    dashboardWeb3 = new DashboardWeb3();
    window.dashboardWeb3 = dashboardWeb3;
  });
} else {
  dashboardWeb3 = new DashboardWeb3();
  window.dashboardWeb3 = dashboardWeb3;
}

// Agregar estilos para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0%, 100% {
            opacity: 1;
        }
        50% {
            opacity: 0.5;
        }
    }
    
    .wallet-menu button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease;
    }
`;
document.head.appendChild(style);
