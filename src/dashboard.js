// BitForward Dashboard Engine
// Sistema de Dashboard en tiempo real con métricas avanzadas

class BitForwardDashboard {
  constructor(bitForwardInstance) {
    this.bf = bitForwardInstance;
    this.charts = new Map();
    this.widgets = new Map();
    this.updateInterval = null;
    this.initialize();
  }

  initialize() {
    this.setupRealTimeUpdates();
    this.createWidgets();
    this.setupEventListeners();
    console.log('📊 Dashboard BitForward inicializado');
  }

  // --- Widgets del Dashboard ---

  createWidgets() {
    this.widgets.set('portfolio', new PortfolioWidget(this.bf));
    this.widgets.set('performance', new PerformanceWidget(this.bf));
    this.widgets.set('riskMetrics', new RiskMetricsWidget(this.bf));
    this.widgets.set('marketOverview', new MarketOverviewWidget(this.bf));
    this.widgets.set('activeContracts', new ActiveContractsWidget(this.bf));
  }

  setupRealTimeUpdates() {
    this.updateInterval = setInterval(() => {
      this.updateAllWidgets();
    }, 5000); // Actualizar cada 5 segundos
  }

  updateAllWidgets() {
    this.widgets.forEach(widget => {
      widget.update();
    });
  }

  setupEventListeners() {
    this.bf.on(this.bf.events.CONTRACT_CREATED, () => this.updateAllWidgets());
    this.bf.on(this.bf.events.CONTRACT_EXECUTED, () => this.updateAllWidgets());
    this.bf.on(this.bf.events.PORTFOLIO_UPDATED, () => this.updateAllWidgets());
  }

  // --- Métodos de Renderizado ---

  renderDashboard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container del dashboard no encontrado');
      return;
    }

    container.innerHTML = this.generateDashboardHTML();
    this.attachEventHandlers();
    this.renderAllWidgets();
  }

  generateDashboardHTML() {
    const i18n = window.i18n;
    return `
            <div class="bitforward-dashboard">
                <header class="dashboard-header">
                    <div class="dashboard-logo">
                        <img src="assets/logo-astronaut-rocket.svg" alt="BitForward" class="logo-icon">
                        <h1 data-i18n="dashboard.title" class="bitforward-brand animated size-lg">${i18n ? i18n.t('dashboard.title') : 'BitForward Dashboard'}</h1>
                    </div>
                    <div class="user-info">
                        <span class="user-name">${this.bf.currentUser?.username || 'No autenticado'}</span>
                        <span class="last-update" id="last-update">${i18n ? i18n.t('user.updated') : 'Actualizado'}: ${new Date().toLocaleTimeString()}</span>
                    </div>
                </header>
                
                <div class="dashboard-grid">
                    <div class="widget-container" id="portfolio-widget">
                        <h3 data-i18n="portfolio.overview">${i18n ? i18n.t('portfolio.overview') : 'Portfolio Overview'}</h3>
                        <div class="widget-content" id="portfolio-content"></div>
                    </div>
                    
                    <div class="widget-container" id="performance-widget">
                        <h3 data-i18n="performance.title">${i18n ? i18n.t('performance.title') : 'Performance'}</h3>
                        <div class="widget-content" id="performance-content"></div>
                    </div>
                    
                    <div class="widget-container" id="risk-widget">
                        <h3 data-i18n="risk.metrics">${i18n ? i18n.t('risk.metrics') : 'Risk Metrics'}</h3>
                        <div class="widget-content" id="risk-content"></div>
                    </div>
                    
                    <div class="widget-container" id="market-widget">
                        <h3 data-i18n="market.overview">${i18n ? i18n.t('market.overview') : 'Market Overview'}</h3>
                        <div class="widget-content" id="market-content"></div>
                    </div>
                    
                    <div class="widget-container full-width" id="contracts-widget">
                        <h3 data-i18n="contracts.active">${i18n ? i18n.t('contracts.active') : 'Active Contracts'}</h3>
                        <div class="widget-content" id="contracts-content"></div>
                    </div>
                </div>
            </div>
        `;
  }

  renderAllWidgets() {
    this.widgets.forEach((widget, name) => {
      const contentElement = document.getElementById(
        `${name.replace(/([A-Z])/g, '-$1').toLowerCase()}-content`
      );
      if (contentElement) {
        widget.render(contentElement);
      }
    });
  }

  attachEventHandlers() {
    // Agregar handlers para interactividad del dashboard
    document.addEventListener('click', e => {
      if (e.target.classList.contains('contract-detail-btn')) {
        this.showContractDetails(e.target.dataset.contractId);
      }
    });
  }

  showContractDetails(contractId) {
    const contract = this.bf.contracts.find(c => c.id === contractId);
    if (contract) {
      this.openModal('Contract Details', this.generateContractDetailsHTML(contract));
    }
  }

  generateContractDetailsHTML(contract) {
    return `
            <div class="contract-details">
                <div class="detail-row">
                    <label>ID:</label>
                    <span>${contract.id}</span>
                </div>
                <div class="detail-row">
                    <label>Blockchain:</label>
                    <span class="blockchain-badge ${contract.blockchain}">${contract.blockchain.toUpperCase()}</span>
                </div>
                <div class="detail-row">
                    <label>Amount:</label>
                    <span>${contract.amount} ${contract.blockchain}</span>
                </div>
                <div class="detail-row">
                    <label>Strike Price:</label>
                    <span>$${contract.strikePrice}</span>
                </div>
                <div class="detail-row">
                    <label>Status:</label>
                    <span class="status-badge ${contract.status}">${contract.status}</span>
                </div>
                <div class="detail-row">
                    <label>Risk Level:</label>
                    <span class="risk-badge ${contract.riskMetrics.exposureLevel.toLowerCase()}">${contract.riskMetrics.exposureLevel}</span>
                </div>
                <div class="detail-row">
                    <label>Time to Expiry:</label>
                    <span>${BitForwardUtils.calculateTimeToExpiry(contract.executionDate)}</span>
                </div>
                ${
                  contract.pnl !== undefined
                    ? `
                    <div class="detail-row">
                        <label>P&L:</label>
                        <span class="${contract.pnl >= 0 ? 'profit' : 'loss'}">${BitForwardUtils.formatCurrency(contract.pnl)}</span>
                    </div>
                `
                    : ''
                }
            </div>
        `;
  }

  openModal(title, content) {
    // Crear modal dinámico
    const modal = document.createElement('div');
    modal.className = 'bitforward-modal';
    modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <header class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </header>
                <div class="modal-body">${content}</div>
            </div>
        `;

    document.body.appendChild(modal);

    // Event listeners para cerrar
    modal.querySelector('.modal-close').onclick = () => modal.remove();
    modal.querySelector('.modal-backdrop').onclick = () => modal.remove();
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.widgets.clear();
    this.charts.clear();
  }
}

// --- Widgets Especializados ---

class PortfolioWidget {
  constructor(bitForwardInstance) {
    this.bf = bitForwardInstance;
    this.data = null;
  }

  update() {
    this.data = this.bf.calculatePortfolio();
  }

  render(container) {
    if (!this.data) this.update();

    const i18n = window.i18n;

    container.innerHTML = `
            <div class="portfolio-summary">
                <div class="metric">
                    <span class="value">${this.data.contracts}</span>
                    <span class="label" data-i18n="portfolio.total.contracts">${i18n ? i18n.t('portfolio.total.contracts') : 'Total Contracts'}</span>
                </div>
                <div class="metric">
                    <span class="value">${this.data.active}</span>
                    <span class="label" data-i18n="portfolio.active">${i18n ? i18n.t('portfolio.active') : 'Active'}</span>
                </div>
                <div class="metric">
                    <span class="value ${this.data.totalPnL >= 0 ? 'positive' : 'negative'}">${BitForwardUtils.formatCurrency(this.data.totalPnL)}</span>
                    <span class="label" data-i18n="portfolio.total.pnl">${i18n ? i18n.t('portfolio.total.pnl') : 'Total P&L'}</span>
                </div>
                <div class="metric">
                    <span class="value risk-${this.data.riskExposure.toLowerCase()}">${i18n ? i18n.t(`portfolio.risk.${this.data.riskExposure.toLowerCase()}`) : this.data.riskExposure}</span>
                    <span class="label" data-i18n="portfolio.risk.level">${i18n ? i18n.t('portfolio.risk.level') : 'Risk Level'}</span>
                </div>
            </div>
            <div class="blockchain-breakdown">
                ${Object.entries(this.data.byBlockchain)
                  .map(
                    ([chain, data]) => `
                    <div class="chain-item">
                        <span class="chain-name">${chain}</span>
                        <span class="chain-count">${data.count} contracts</span>
                        <span class="chain-amount">${data.totalAmount.toFixed(4)}</span>
                    </div>
                `
                  )
                  .join('')}
            </div>
        `;
  }
}

class PerformanceWidget {
  constructor(bitForwardInstance) {
    this.bf = bitForwardInstance;
    this.analytics = null;
  }

  update() {
    this.analytics = this.bf.generateAnalytics();
  }

  render(container) {
    if (!this.analytics) this.update();

    const perf = this.analytics.performance;
    const i18n = window.i18n;

    container.innerHTML = `
            <div class="performance-metrics">
                <div class="metric-card">
                    <h4 data-i18n="performance.win.rate">${i18n ? i18n.t('performance.win.rate') : 'Win Rate'}</h4>
                    <span class="big-number">${perf.winRate.toFixed(1)}%</span>
                </div>
                <div class="metric-card">
                    <h4 data-i18n="performance.avg.holding">${i18n ? i18n.t('performance.avg.holding') : 'Avg Holding Period'}</h4>
                    <span class="big-number">${perf.avgHoldingPeriod.toFixed(0)} ${i18n ? i18n.t('performance.days') : 'days'}</span>
                </div>
                <div class="metric-card">
                    <h4 data-i18n="performance.success.rate">${i18n ? i18n.t('performance.success.rate') : 'Success Rate'}</h4>
                    <span class="big-number">${this.analytics.marketData.successRate.toFixed(1)}%</span>
                </div>
            </div>
        `;
  }
}

class RiskMetricsWidget {
  constructor(bitForwardInstance) {
    this.bf = bitForwardInstance;
  }

  update() {
    // Actualizar métricas de riesgo
  }

  render(container) {
    const portfolio = this.bf.calculatePortfolio();

    container.innerHTML = `
            <div class="risk-indicators">
                <div class="risk-gauge">
                    <div class="gauge-label">Portfolio Risk</div>
                    <div class="gauge-value risk-${portfolio.riskExposure.toLowerCase()}">${portfolio.riskExposure}</div>
                </div>
                <div class="risk-factors">
                    <div class="factor">
                        <span class="factor-name">Concentration Risk</span>
                        <span class="factor-value">${this.calculateConcentrationRisk()}</span>
                    </div>
                    <div class="factor">
                        <span class="factor-name">Liquidity Risk</span>
                        <span class="factor-value">MEDIUM</span>
                    </div>
                </div>
            </div>
        `;
  }

  calculateConcentrationRisk() {
    const portfolio = this.bf.calculatePortfolio();
    const chains = Object.keys(portfolio.byBlockchain);
    return chains.length < 2 ? 'HIGH' : chains.length < 3 ? 'MEDIUM' : 'LOW';
  }
}

class MarketOverviewWidget {
  constructor(bitForwardInstance) {
    this.bf = bitForwardInstance;
    this.marketData = {};
  }

  update() {
    // Simular datos de mercado
    this.marketData = {
      btcPrice: 45000 + (Math.random() - 0.5) * 2000,
      ethPrice: 3000 + (Math.random() - 0.5) * 200,
      solPrice: 100 + (Math.random() - 0.5) * 10,
      marketTrend: Math.random() > 0.5 ? 'up' : 'down',
    };
  }

  render(container) {
    if (!this.marketData.btcPrice) this.update();

    container.innerHTML = `
            <div class="market-prices">
                <div class="price-item">
                    <span class="crypto-name">BTC</span>
                    <span class="crypto-price">$${this.marketData.btcPrice.toLocaleString()}</span>
                </div>
                <div class="price-item">
                    <span class="crypto-name">ETH</span>
                    <span class="crypto-price">$${this.marketData.ethPrice.toLocaleString()}</span>
                </div>
                <div class="price-item">
                    <span class="crypto-name">SOL</span>
                    <span class="crypto-price">$${this.marketData.solPrice.toFixed(2)}</span>
                </div>
            </div>
        `;
  }
}

class ActiveContractsWidget {
  constructor(bitForwardInstance) {
    this.bf = bitForwardInstance;
  }

  update() {
    // Se actualiza automáticamente con los contratos
  }

  render(container) {
    const activeContracts = this.bf.getContractsByStatus('active');
    const pendingContracts = this.bf.getContractsByStatus('pending_counterparty');

    container.innerHTML = `
            <div class="contracts-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Blockchain</th>
                            <th>Amount</th>
                            <th>Strike Price</th>
                            <th>Expiry</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${[...activeContracts, ...pendingContracts]
                          .map(
                            contract => `
                            <tr>
                                <td>${contract.id.substring(0, 8)}...</td>
                                <td><span class="blockchain-badge ${contract.blockchain}">${contract.blockchain}</span></td>
                                <td>${contract.amount}</td>
                                <td>$${contract.strikePrice}</td>
                                <td>${BitForwardUtils.calculateTimeToExpiry(contract.executionDate)}</td>
                                <td><span class="status-badge ${contract.status}">${contract.status}</span></td>
                                <td>
                                    <button class="btn-small contract-detail-btn" data-contract-id="${contract.id}">
                                        Details
                                    </button>
                                </td>
                            </tr>
                        `
                          )
                          .join('')}
                    </tbody>
                </table>
                ${
                  activeContracts.length === 0 && pendingContracts.length === 0
                    ? '<p class="no-contracts">No active contracts</p>'
                    : ''
                }
            </div>
        `;
  }
}

// Exportar para uso
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BitForwardDashboard,
    PortfolioWidget,
    PerformanceWidget,
    RiskMetricsWidget,
    MarketOverviewWidget,
    ActiveContractsWidget,
  };
}

if (typeof window !== 'undefined') {
  window.BitForwardDashboard = BitForwardDashboard;
}
