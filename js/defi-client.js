/**
 * BitForward DeFi Dashboard Integration
 * Connects frontend with blockchain service
 */

class BitForwardDeFiClient {
  constructor() {
    this.apiBase = window.location.origin;
    this.wsConnection = null;
    this.isConnected = false;
    this.vaultData = {};
    this.loanData = [];
    this.protocolStats = {};

    this.initializeWebSocket();
  }

  // ============ WEBSOCKET CONNECTION ============
  initializeWebSocket() {
    try {
      const wsUrl = `ws://${window.location.hostname}:3001`;
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.onopen = () => {
        console.log('✅ WebSocket connected to blockchain service');
        this.isConnected = true;
        this.updateConnectionStatus(true);
      };

      this.wsConnection.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleBlockchainUpdate(data);
      };

      this.wsConnection.onclose = () => {
        console.log('⚠️ WebSocket disconnected');
        this.isConnected = false;
        this.updateConnectionStatus(false);

        // Reconnect after 5 seconds
        setTimeout(() => this.initializeWebSocket(), 5000);
      };

      this.wsConnection.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnected = false;
        this.updateConnectionStatus(false);
      };
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error);
      this.isConnected = false;
      this.updateConnectionStatus(false);
    }
  }

  // ============ API CALLS ============
  async apiCall(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.apiBase}/api${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // ============ VAULT OPERATIONS ============
  async getVaultInfo() {
    try {
      const data = await this.apiCall('/vault/info');
      this.vaultData = data;
      this.updateVaultDisplay(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch vault info:', error);
      this.showError('Error al obtener información del vault');
      return null;
    }
  }

  async getVaultBalance(asset) {
    try {
      const data = await this.apiCall(`/vault/balance/${asset}`);
      this.updateAssetBalance(asset, data);
      return data;
    } catch (error) {
      console.error(`Failed to fetch vault balance for ${asset}:`, error);
      return null;
    }
  }

  // ============ STRATEGY OPERATIONS ============
  async executeHedge(assetIn, assetOut, amount, minAmountOut) {
    try {
      const data = await this.apiCall('/strategy/hedge', {
        method: 'POST',
        body: JSON.stringify({ assetIn, assetOut, amount, minAmountOut })
      });

      this.showSuccess(`Hedge ejecutado: ${data.transactionHash}`);
      this.refreshProtocolData();
      return data;
    } catch (error) {
      console.error('Failed to execute hedge:', error);
      this.showError('Error al ejecutar hedge');
      throw error;
    }
  }

  async openLoan(collateralAsset, debtAsset, collateralAmount, debtAmount) {
    try {
      const data = await this.apiCall('/strategy/loan', {
        method: 'POST',
        body: JSON.stringify({ collateralAsset, debtAsset, collateralAmount, debtAmount })
      });

      this.showSuccess(`Préstamo abierto: ${data.transactionHash}`);
      this.refreshProtocolData();
      return data;
    } catch (error) {
      console.error('Failed to open loan:', error);
      this.showError('Error al abrir préstamo');
      throw error;
    }
  }

  // ============ LOAN MANAGEMENT ============
  async getActiveLoans() {
    try {
      const data = await this.apiCall('/loans');
      this.loanData = data;
      this.updateLoansDisplay(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch active loans:', error);
      return [];
    }
  }

  async getLoanInfo(loanId) {
    try {
      const data = await this.apiCall(`/loans/${loanId}`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch loan ${loanId}:`, error);
      return null;
    }
  }

  // ============ PROTOCOL STATS ============
  async getProtocolStats() {
    try {
      const data = await this.apiCall('/protocol/stats');
      this.protocolStats = data;
      this.updateProtocolStatsDisplay(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch protocol stats:', error);
      return null;
    }
  }

  // ============ TRANSACTION TRACKING ============
  async getTransactionStatus(txHash) {
    try {
      const data = await this.apiCall(`/transaction/${txHash}`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch transaction ${txHash}:`, error);
      return null;
    }
  }

  // ============ WEBSOCKET EVENT HANDLING ============
  handleBlockchainUpdate(data) {
    console.log('📡 Blockchain update received:', data);

    switch (data.type) {
      case 'VAULT_DEPOSIT':
        this.handleVaultDeposit(data);
        break;
      case 'STRATEGY_EXECUTED':
        this.handleStrategyExecuted(data);
        break;
      case 'LOAN_OPENED':
        this.handleLoanOpened(data);
        break;
      case 'LOAN_LIQUIDATED':
        this.handleLoanLiquidated(data);
        break;
      case 'TRANSACTION_MINED':
        this.handleTransactionMined(data);
        break;
      default:
        console.log('Unknown blockchain event:', data.type);
    }
  }

  handleVaultDeposit(data) {
    this.showNotification(`💰 Depósito en vault: ${data.amount} ${data.asset}`);
    this.refreshVaultData();
  }

  handleStrategyExecuted(data) {
    this.showNotification(`⚡ Estrategia ejecutada: ${data.strategy} - Hash: ${data.transactionHash.slice(0, 8)}...`);
    this.refreshProtocolData();
  }

  handleLoanOpened(data) {
    this.showNotification(`🏦 Nuevo préstamo: ${data.loanId} - Colateral: ${data.collateralAmount} ${data.collateralAsset}`);
    this.refreshLoansData();
  }

  handleLoanLiquidated(data) {
    this.showNotification(`⚠️ Préstamo liquidado: ${data.loanId}`, 'warning');
    this.refreshLoansData();
  }

  handleTransactionMined(data) {
    this.showNotification(`⛏️ Transacción confirmada: ${data.transactionHash.slice(0, 8)}...`);
  }

  // ============ UI UPDATE METHODS ============
  updateConnectionStatus(connected) {
    const statusEl = document.getElementById('blockchain-status');
    if (statusEl) {
      statusEl.textContent = connected ? '🟢 Conectado' : '🔴 Desconectado';
      statusEl.className = connected ? 'status-connected' : 'status-disconnected';
    }
  }

  updateVaultDisplay(vaultData) {
    const vaultEl = document.getElementById('vault-info');
    if (vaultEl && vaultData) {
      vaultEl.innerHTML = `
                <div class="vault-card">
                    <h3>🏛️ DeFi Vault</h3>
                    <div class="vault-stats">
                        <div class="stat">
                            <label>Total Deposited:</label>
                            <span>$${vaultData.totalValue?.toLocaleString() || '0'}</span>
                        </div>
                        <div class="stat">
                            <label>Active Strategies:</label>
                            <span>${vaultData.activeStrategies || 0}</span>
                        </div>
                        <div class="stat">
                            <label>Health Factor:</label>
                            <span class="${vaultData.healthFactor > 1.5 ? 'healthy' : 'warning'}">
                                ${vaultData.healthFactor?.toFixed(2) || 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
    }
  }

  updateLoansDisplay(loans) {
    const loansEl = document.getElementById('loans-info');
    if (loansEl) {
      loansEl.innerHTML = `
                <div class="loans-card">
                    <h3>🏦 Active Loans</h3>
                    <div class="loans-list">
                        ${loans.length === 0 ?
    '<p class="no-loans">No hay préstamos activos</p>' :
    loans.map(loan => `
                                <div class="loan-item" data-loan-id="${loan.id}">
                                    <div class="loan-header">
                                        <span class="loan-id">Loan #${loan.id}</span>
                                        <span class="health-factor ${loan.healthFactor > 1.5 ? 'healthy' : 'warning'}">
                                            HF: ${loan.healthFactor?.toFixed(2)}
                                        </span>
                                    </div>
                                    <div class="loan-details">
                                        <div>Collateral: ${loan.collateralAmount} ${loan.collateralAsset}</div>
                                        <div>Debt: ${loan.debtAmount} ${loan.debtAsset}</div>
                                    </div>
                                </div>
                            `).join('')
}
                    </div>
                </div>
            `;
    }
  }

  updateProtocolStatsDisplay(stats) {
    const statsEl = document.getElementById('protocol-stats');
    if (statsEl && stats) {
      statsEl.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <h4>Total Value Locked</h4>
                        <span class="stat-value">$${stats.vault?.totalValue?.toLocaleString() || '0'}</span>
                    </div>
                    <div class="stat-card">
                        <h4>Active Loans</h4>
                        <span class="stat-value">${stats.loans?.active || 0}</span>
                    </div>
                    <div class="stat-card">
                        <h4>Strategies Executed</h4>
                        <span class="stat-value">${stats.vault?.strategiesExecuted || 0}</span>
                    </div>
                </div>
            `;
    }
  }

  // ============ REFRESH METHODS ============
  async refreshVaultData() {
    await this.getVaultInfo();
  }

  async refreshLoansData() {
    await this.getActiveLoans();
  }

  async refreshProtocolData() {
    await Promise.all([
      this.getProtocolStats(),
      this.getVaultInfo(),
      this.getActiveLoans()
    ]);
  }

  // ============ NOTIFICATION METHODS ============
  showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.id = 'notification-container';
      notificationContainer.className = 'notification-container';
      document.body.appendChild(notificationContainer);
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

    notificationContainer.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);

    // Manual close
    notification.querySelector('.notification-close').onclick = () => {
      notification.remove();
    };
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  // ============ INITIALIZATION ============
  async initialize() {
    console.log('🚀 Inicializando BitForward DeFi Client...');

    try {
      // Load initial data
      await this.refreshProtocolData();
      console.log('✅ BitForward DeFi Client inicializado');
    } catch (error) {
      console.error('❌ Error initializing DeFi client:', error);
      this.showError('Error al conectar con el protocolo DeFi');
    }
  }
}

// Global instance
window.bitForwardDeFi = new BitForwardDeFiClient();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.bitForwardDeFi.initialize();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BitForwardDeFiClient;
}
