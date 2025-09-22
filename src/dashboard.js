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
        return `
            <div class="bitforward-dashboard">
                <header class="dashboard-header">
                    <h1>BitForward Dashboard</h1>
                    <div class="user-info">
                        <span class="user-name">${this.bf.currentUser?.username || 'No autenticado'}</span>
                        <span class="last-update" id="last-update">Actualizado: ${new Date().toLocaleTimeString()}</span>
                    </div>
                </header>
                
                <div class="dashboard-grid">
                    <div class="widget-container" id="portfolio-widget">
                        <h3>Portfolio Overview</h3>
                        <div class="widget-content" id="portfolio-content"></div>
                    </div>
                    
                    <div class="widget-container" id="performance-widget">
                        <h3>Performance</h3>
                        <div class="widget-content" id="performance-content"></div>
                    </div>
                    
                    <div class="widget-container" id="risk-widget">
                        <h3>Risk Metrics</h3>
                        <div class="widget-content" id="risk-content"></div>
                    </div>
                    
                    <div class="widget-container" id="market-widget">
                        <h3>Market Overview</h3>
                        <div class="widget-content" id="market-content"></div>
                    </div>
                    
                    <div class="widget-container full-width" id="contracts-widget">
                        <h3>Active Contracts</h3>
                        <div class="widget-content" id="contracts-content"></div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAllWidgets() {
        this.widgets.forEach((widget, name) => {
            const contentElement = document.getElementById(`${name.replace(/([A-Z])/g, '-$1').toLowerCase()}-content`);
            if (contentElement) {
                widget.render(contentElement);
            }
        });
    }

    attachEventHandlers() {
        // Agregar handlers para interactividad del dashboard
        document.addEventListener('click', (e) => {
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
                ${contract.pnl !== undefined ? `
                    <div class="detail-row">
                        <label>P&L:</label>
                        <span class="${contract.pnl >= 0 ? 'profit' : 'loss'}">${BitForwardUtils.formatCurrency(contract.pnl)}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    openModal(title, content) {
        // Crear modal dinámico
        const modal = document.createElement('div');
        modal.className = 'bitforward-modal';
        
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        // Create header
        const header = document.createElement('header');
        header.className = 'modal-header';
        
        const h3 = document.createElement('h3');
        h3.textContent = title;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.textContent = '×';
        closeBtn.setAttribute('aria-label', 'Cerrar modal');
        
        header.appendChild(h3);
        header.appendChild(closeBtn);
        
        // Create body
        const body = document.createElement('div');
        body.className = 'modal-body';
        // Safely handle content - if it's a string, treat as text, if it's an element, append it
        if (typeof content === 'string') {
            body.textContent = content;
        } else if (content instanceof HTMLElement) {
            body.appendChild(content);
        }
        
        // Assemble modal
        modalContent.appendChild(header);
        modalContent.appendChild(body);
        modal.appendChild(backdrop);
        modal.appendChild(modalContent);
        
        document.body.appendChild(modal);
        
        // Event listeners para cerrar using addEventListener
        closeBtn.addEventListener('click', () => modal.remove());
        backdrop.addEventListener('click', () => modal.remove());
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
        
        // Clear container safely
        container.textContent = '';
        
        // Create portfolio summary
        const portfolioSummary = document.createElement('div');
        portfolioSummary.className = 'portfolio-summary';
        
        // Create metrics
        const metrics = [
            { value: this.data.contracts, label: 'Total Contracts' },
            { value: this.data.active, label: 'Active' },
            { 
                value: BitForwardUtils.formatCurrency(this.data.totalPnL), 
                label: 'Total P&L',
                className: this.data.totalPnL >= 0 ? 'positive' : 'negative'
            },
            { 
                value: this.data.riskExposure, 
                label: 'Risk Level',
                className: `risk-${this.data.riskExposure.toLowerCase()}`
            }
        ];
        
        metrics.forEach(metric => {
            const metricDiv = document.createElement('div');
            metricDiv.className = 'metric';
            
            const valueSpan = document.createElement('span');
            valueSpan.className = 'value';
            if (metric.className) {
                valueSpan.classList.add(metric.className);
            }
            valueSpan.textContent = metric.value;
            
            const labelSpan = document.createElement('span');
            labelSpan.className = 'label';
            labelSpan.textContent = metric.label;
            
            metricDiv.appendChild(valueSpan);
            metricDiv.appendChild(labelSpan);
            portfolioSummary.appendChild(metricDiv);
        });
        
        // Create blockchain breakdown
        const blockchainBreakdown = document.createElement('div');
        blockchainBreakdown.className = 'blockchain-breakdown';
        
        Object.entries(this.data.byBlockchain).forEach(([chain, data]) => {
            const chainItem = document.createElement('div');
            chainItem.className = 'chain-item';
            
            const chainName = document.createElement('span');
            chainName.className = 'chain-name';
            chainName.textContent = chain;
            
            const chainCount = document.createElement('span');
            chainCount.className = 'chain-count';
            chainCount.textContent = `${data.count} contracts`;
            
            const chainAmount = document.createElement('span');
            chainAmount.className = 'chain-amount';
            chainAmount.textContent = data.totalAmount.toFixed(4);
            
            chainItem.appendChild(chainName);
            chainItem.appendChild(chainCount);
            chainItem.appendChild(chainAmount);
            blockchainBreakdown.appendChild(chainItem);
        });
        
        // Assemble and append
        container.appendChild(portfolioSummary);
        container.appendChild(blockchainBreakdown);
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
        
        container.innerHTML = `
            <div class="performance-metrics">
                <div class="metric-card">
                    <h4>Win Rate</h4>
                    <span class="big-number">${perf.winRate.toFixed(1)}%</span>
                </div>
                <div class="metric-card">
                    <h4>Avg Holding Period</h4>
                    <span class="big-number">${perf.avgHoldingPeriod.toFixed(0)} days</span>
                </div>
                <div class="metric-card">
                    <h4>Success Rate</h4>
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
            marketTrend: Math.random() > 0.5 ? 'up' : 'down'
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
                        ${[...activeContracts, ...pendingContracts].map(contract => `
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
                        `).join('')}
                    </tbody>
                </table>
                ${activeContracts.length === 0 && pendingContracts.length === 0 ? 
                    '<p class="no-contracts">No active contracts</p>' : ''}
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
        ActiveContractsWidget
    };
}

if (typeof window !== 'undefined') {
    window.BitForwardDashboard = BitForwardDashboard;
}
