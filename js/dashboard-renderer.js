/**
 * Enhanced Dashboard Renderer for BitForward DeFi Protocol
 * Integrates with blockchain service and displays real-time DeFi data
 */

class BitForwardDashboardRenderer {
  constructor() {
    this.defiClient = window.bitForwardDeFi;
    this.currentUser = null;
    this.refreshInterval = null;
  }

  // ============ MAIN DASHBOARD RENDERING ============
  renderDashboard(username) {
    this.currentUser = username;
    const dashboard = document.getElementById('main-dashboard');

    dashboard.innerHTML = this.getDashboardHTML(username);

    // Initialize components
    this.initializeEventListeners();
    this.startDataRefresh();
    this.loadInitialData();
  }

  getDashboardHTML(username) {
    return `
            <div class="dashboard-container">
                <!-- Header -->
                <header class="dashboard-header">
                    <div class="dashboard-header-content">
                        <div class="dashboard-logo">
                            <img src="assets/logo.svg" alt="BitForward" class="logo-icon">
                            <h1 class="bitforward-brand animated">BitForward DeFi</h1>
                        </div>
                        <div class="dashboard-status">
                            <div id="blockchain-status" class="blockchain-status">🔴 Conectando...</div>
                            <div class="dashboard-user">
                                <span>👤 ${username}</span>
                                <button onclick="logout()" class="logout-btn">Cerrar Sesión</button>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Main Content -->
                <main class="dashboard-main">
                    <!-- Protocol Overview -->
                    <section class="protocol-overview">
                        <h2>📊 Protocol Overview</h2>
                        <div id="protocol-stats" class="protocol-stats">
                            <div class="stats-grid">
                                <div class="stat-card loading">
                                    <h4>Total Value Locked</h4>
                                    <span class="stat-value">Cargando...</span>
                                </div>
                                <div class="stat-card loading">
                                    <h4>Active Loans</h4>
                                    <span class="stat-value">Cargando...</span>
                                </div>
                                <div class="stat-card loading">
                                    <h4>Strategies Executed</h4>
                                    <span class="stat-value">Cargando...</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <!-- Vault Management -->
                    <section class="vault-section">
                        <h2>🏛️ DeFi Vault</h2>
                        <div id="vault-info" class="vault-container">
                            <div class="vault-card loading">
                                <h3>Cargando información del vault...</h3>
                            </div>
                        </div>
                        <div class="vault-actions">
                            <button class="action-btn primary" onclick="window.dashboardRenderer.openDepositModal()">
                                💰 Depositar
                            </button>
                            <button class="action-btn secondary" onclick="window.dashboardRenderer.openWithdrawModal()">
                                💸 Retirar
                            </button>
                            <button class="action-btn secondary" onclick="window.dashboardRenderer.refreshVaultData()">
                                🔄 Actualizar
                            </button>
                        </div>
                    </section>

                    <!-- Strategy Management -->
                    <section class="strategy-section">
                        <h2>⚡ Strategy Execution</h2>
                        <div class="strategy-container">
                            <div class="strategy-card">
                                <h3>🔄 Hedge Strategies</h3>
                                <p>Execute hedging strategies across multiple protocols</p>
                                <button class="action-btn primary" onclick="window.dashboardRenderer.openHedgeModal()">
                                    Execute Hedge
                                </button>
                            </div>
                            <div class="strategy-card">
                                <h3>🏦 Collateralized Loans</h3>
                                <p>Open leveraged positions with collateral management</p>
                                <button class="action-btn primary" onclick="window.dashboardRenderer.openLoanModal()">
                                    Open Loan
                                </button>
                            </div>
                        </div>
                    </section>

                    <!-- Active Loans -->
                    <section class="loans-section">
                        <h2>🏦 Active Loans</h2>
                        <div id="loans-info" class="loans-container">
                            <div class="loans-card loading">
                                <h3>Cargando préstamos activos...</h3>
                            </div>
                        </div>
                    </section>

                    <!-- Transaction History -->
                    <section class="transactions-section">
                        <h2>📋 Recent Transactions</h2>
                        <div id="transaction-history" class="transactions-container">
                            <div class="transactions-placeholder">
                                <p>Las transacciones aparecerán aquí en tiempo real</p>
                            </div>
                        </div>
                    </section>
                </main>
            </div>

            <!-- Modals -->
            ${this.getModalsHTML()}
        `;
  }

  getModalsHTML() {
    return `
            <!-- Hedge Strategy Modal -->
            <div id="hedge-modal" class="defi-modal" style="display: none;">
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <header class="modal-header">
                        <h3>🔄 Execute Hedge Strategy</h3>
                        <button class="modal-close" onclick="window.dashboardRenderer.closeModal('hedge-modal')">&times;</button>
                    </header>
                    <div class="modal-body">
                        <form id="hedge-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Asset In</label>
                                    <select id="hedge-asset-in" required>
                                        <option value="">Select Asset</option>
                                        <option value="USDC">USDC</option>
                                        <option value="WETH">WETH</option>
                                        <option value="WBTC">WBTC</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Asset Out</label>
                                    <select id="hedge-asset-out" required>
                                        <option value="">Select Asset</option>
                                        <option value="USDC">USDC</option>
                                        <option value="WETH">WETH</option>
                                        <option value="WBTC">WBTC</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Amount</label>
                                    <input type="number" id="hedge-amount" step="0.0001" min="0" required>
                                </div>
                                <div class="form-group">
                                    <label>Min Amount Out</label>
                                    <input type="number" id="hedge-min-amount" step="0.0001" min="0" required>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn-secondary" onclick="window.dashboardRenderer.closeModal('hedge-modal')">Cancel</button>
                                <button type="submit" class="btn-primary">Execute Hedge</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Loan Modal -->
            <div id="loan-modal" class="defi-modal" style="display: none;">
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <header class="modal-header">
                        <h3>🏦 Open Collateralized Loan</h3>
                        <button class="modal-close" onclick="window.dashboardRenderer.closeModal('loan-modal')">&times;</button>
                    </header>
                    <div class="modal-body">
                        <form id="loan-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Collateral Asset</label>
                                    <select id="loan-collateral-asset" required>
                                        <option value="">Select Asset</option>
                                        <option value="WETH">WETH</option>
                                        <option value="WBTC">WBTC</option>
                                        <option value="USDC">USDC</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Debt Asset</label>
                                    <select id="loan-debt-asset" required>
                                        <option value="">Select Asset</option>
                                        <option value="USDC">USDC</option>
                                        <option value="WETH">WETH</option>
                                        <option value="DAI">DAI</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Collateral Amount</label>
                                    <input type="number" id="loan-collateral-amount" step="0.0001" min="0" required>
                                </div>
                                <div class="form-group">
                                    <label>Debt Amount</label>
                                    <input type="number" id="loan-debt-amount" step="0.0001" min="0" required>
                                </div>
                            </div>
                            <div class="loan-info">
                                <div class="info-item">
                                    <label>Estimated Health Factor:</label>
                                    <span id="estimated-hf">Calculate above</span>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button type="button" class="btn-secondary" onclick="window.dashboardRenderer.closeModal('loan-modal')">Cancel</button>
                                <button type="submit" class="btn-primary">Open Loan</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
  }

  // ============ EVENT LISTENERS ============
  initializeEventListeners() {
    // Hedge form
    const hedgeForm = document.getElementById('hedge-form');
    if (hedgeForm) {
      hedgeForm.addEventListener('submit', this.handleHedgeSubmit.bind(this));
    }

    // Loan form
    const loanForm = document.getElementById('loan-form');
    if (loanForm) {
      loanForm.addEventListener('submit', this.handleLoanSubmit.bind(this));
    }

    // Close modals when clicking backdrop
    document.addEventListener('click', e => {
      if (e.target.classList.contains('modal-backdrop')) {
        const modal = e.target.closest('.defi-modal');
        if (modal) {
          modal.style.display = 'none';
        }
      }
    });
  }

  // ============ FORM HANDLERS ============
  async handleHedgeSubmit(event) {
    event.preventDefault();

    const assetIn = document.getElementById('hedge-asset-in').value;
    const assetOut = document.getElementById('hedge-asset-out').value;
    const amount = document.getElementById('hedge-amount').value;
    const minAmountOut = document.getElementById('hedge-min-amount').value;

    try {
      await this.defiClient.executeHedge(assetIn, assetOut, amount, minAmountOut);
      this.closeModal('hedge-modal');
      document.getElementById('hedge-form').reset();
    } catch (error) {
      console.error('Error executing hedge:', error);
    }
  }

  async handleLoanSubmit(event) {
    event.preventDefault();

    const collateralAsset = document.getElementById('loan-collateral-asset').value;
    const debtAsset = document.getElementById('loan-debt-asset').value;
    const collateralAmount = document.getElementById('loan-collateral-amount').value;
    const debtAmount = document.getElementById('loan-debt-amount').value;

    try {
      await this.defiClient.openLoan(collateralAsset, debtAsset, collateralAmount, debtAmount);
      this.closeModal('loan-modal');
      document.getElementById('loan-form').reset();
    } catch (error) {
      console.error('Error opening loan:', error);
    }
  }

  // ============ MODAL MANAGEMENT ============
  openHedgeModal() {
    document.getElementById('hedge-modal').style.display = 'flex';
  }

  openLoanModal() {
    document.getElementById('loan-modal').style.display = 'flex';
  }

  openDepositModal() {
    // TODO: Implement deposit modal
    this.defiClient.showNotification('Deposit functionality coming soon!', 'info');
  }

  openWithdrawModal() {
    // TODO: Implement withdraw modal
    this.defiClient.showNotification('Withdraw functionality coming soon!', 'info');
  }

  closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
  }

  // ============ DATA MANAGEMENT ============
  async loadInitialData() {
    try {
      await this.defiClient.refreshProtocolData();
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  async refreshVaultData() {
    try {
      await this.defiClient.refreshVaultData();
      this.defiClient.showSuccess('Vault data refreshed');
    } catch (error) {
      console.error('Error refreshing vault data:', error);
      this.defiClient.showError('Error refreshing vault data');
    }
  }

  startDataRefresh() {
    // Refresh data every 30 seconds
    this.refreshInterval = setInterval(() => {
      this.defiClient.refreshProtocolData();
    }, 30000);
  }

  stopDataRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // ============ CLEANUP ============
  destroy() {
    this.stopDataRefresh();
  }
}

// Global instance
window.dashboardRenderer = new BitForwardDashboardRenderer();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BitForwardDashboardRenderer;
}
