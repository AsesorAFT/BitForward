/**
 * 🎨 Modern Dashboard - BitForward
 * Sistema de dashboard con animaciones y efectos premium
 */

(function() {
    'use strict';

    const DEBUG = true;
    const log = (...args) => DEBUG && console.log('[Dashboard]', ...args);

    /**
     * Dashboard Manager
     */
    class DashboardManager {
        constructor() {
            this.walletConnected = false;
            this.portfolioData = null;
            this.init();
        }

        init() {
            log('🎨 Inicializando Dashboard Moderno...');

            // Inicializar componentes
            this.setupWalletConnection();
            this.setupQuickActions();
            this.loadPortfolioData();
            this.setupTransactions();
            this.setupMarketData();
            this.setupAnimations();

            log('✅ Dashboard inicializado');
        }

        /**
         * Setup Wallet Connection
         */
        setupWalletConnection() {
            const connectBtn = document.getElementById('connect-wallet-btn');
            
            if (connectBtn) {
                connectBtn.addEventListener('click', async () => {
                    log('💰 Conectando wallet...');

                    // Mostrar loading
                    if (window.specialEffects) {
                        window.specialEffects.loadingRocket.show('Conectando wallet...');
                    }

                    // Simular conexión (reemplazar con lógica real)
                    await this.simulateWalletConnection();

                    // Ocultar loading
                    if (window.specialEffects) {
                        window.specialEffects.loadingRocket.hide();
                    }

                    // Mostrar success
                    if (window.specialEffects) {
                        window.specialEffects.success.show('¡Wallet Conectada! 💎');
                        
                        // Confetti
                        const rect = connectBtn.getBoundingClientRect();
                        window.specialEffects.confetti.explode(
                            rect.left + rect.width / 2,
                            rect.top + rect.height / 2,
                            60
                        );
                    }

                    // Actualizar UI
                    this.onWalletConnected();
                });
            }
        }

        async simulateWalletConnection() {
            return new Promise(resolve => setTimeout(resolve, 2000));
        }

        onWalletConnected() {
            this.walletConnected = true;
            
            // Dispatch event
            document.dispatchEvent(new CustomEvent('walletConnected', {
                detail: { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' }
            }));

            // Actualizar botón
            const connectBtn = document.getElementById('connect-wallet-btn');
            if (connectBtn) {
                connectBtn.textContent = '0x742d...0bEb';
                connectBtn.classList.add('connected');
            }

            // Cargar datos
            this.loadPortfolioData();

            log('✅ Wallet conectada');
        }

        /**
         * Setup Quick Actions
         */
        setupQuickActions() {
            const actions = {
                deposit: () => this.handleDeposit(),
                withdraw: () => this.handleWithdraw(),
                trade: () => this.handleTrade(),
                stake: () => this.handleStake(),
            };

            Object.keys(actions).forEach(action => {
                const btn = document.getElementById(`${action}-btn`);
                if (btn) {
                    btn.addEventListener('click', actions[action]);
                }
            });
        }

        handleDeposit() {
            log('💵 Deposit iniciado');
            if (window.specialEffects) {
                window.specialEffects.loadingRocket.show('Procesando depósito...');
                setTimeout(() => {
                    window.specialEffects.loadingRocket.hide();
                    window.specialEffects.success.show('¡Depósito Exitoso!');
                    window.specialEffects.confetti.explode(window.innerWidth/2, 300, 50);
                }, 2000);
            }
        }

        handleWithdraw() {
            log('💸 Withdraw iniciado');
            if (window.specialEffects) {
                window.specialEffects.loadingRocket.show('Procesando retiro...');
                setTimeout(() => {
                    window.specialEffects.loadingRocket.hide();
                    window.specialEffects.success.show('¡Retiro Exitoso!');
                }, 2000);
            }
        }

        handleTrade() {
            log('📈 Trade iniciado');
            window.location.href = '/enterprise.html';
        }

        handleStake() {
            log('🔒 Stake iniciado');
            window.location.href = '/lending.html';
        }

        /**
         * Load Portfolio Data
         */
        async loadPortfolioData() {
            if (!this.walletConnected) {
                this.showDemoData();
                return;
            }

            log('📊 Cargando portfolio...');

            // Simular carga de datos
            await new Promise(resolve => setTimeout(resolve, 1000));

            this.portfolioData = {
                totalValue: 12458.32,
                totalBalance: 8932.15,
                totalProfit: 3526.17,
                profitPercentage: 39.5,
                assets: [
                    { symbol: 'ETH', name: 'Ethereum', balance: 2.5, value: 4125.50, change: 5.2 },
                    { symbol: 'BTC', name: 'Bitcoin', balance: 0.15, value: 6450.00, change: -2.1 },
                    { symbol: 'USDC', name: 'USD Coin', balance: 1882.82, value: 1882.82, change: 0.0 },
                ],
            };

            this.updatePortfolioUI();
        }

        showDemoData() {
            // Mostrar datos de demo si wallet no está conectada
            this.portfolioData = {
                totalValue: 0,
                totalBalance: 0,
                totalProfit: 0,
                profitPercentage: 0,
                assets: [],
            };

            this.updatePortfolioUI();
        }

        updatePortfolioUI() {
            if (!this.portfolioData) return;

            // Actualizar stats cards
            const valueEl = document.getElementById('portfolio-value');
            const balanceEl = document.getElementById('portfolio-balance');
            const profitEl = document.getElementById('portfolio-profit');

            if (valueEl) {
                this.animateNumber(valueEl, 0, this.portfolioData.totalValue, 2000, '$');
            }

            if (balanceEl) {
                this.animateNumber(balanceEl, 0, this.portfolioData.totalBalance, 2000, '$');
            }

            if (profitEl) {
                this.animateNumber(profitEl, 0, this.portfolioData.totalProfit, 2000, '$');
            }

            // Actualizar assets grid
            this.updateAssetsGrid();
        }

        updateAssetsGrid() {
            const container = document.getElementById('assets-container');
            if (!container || !this.portfolioData.assets.length) return;

            container.innerHTML = '';

            this.portfolioData.assets.forEach((asset, index) => {
                const card = this.createAssetCard(asset);
                card.style.animationDelay = `${index * 0.1}s`;
                container.appendChild(card);
            });
        }

        createAssetCard(asset) {
            const card = document.createElement('div');
            card.className = 'asset-card reveal';
            
            const changeClass = asset.change >= 0 ? 'positive' : 'negative';
            const changeIcon = asset.change >= 0 ? '↑' : '↓';

            card.innerHTML = `
                <div class="asset-card-header">
                    <div class="asset-icon">${asset.symbol.charAt(0)}</div>
                    <div class="asset-info">
                        <h3>${asset.name}</h3>
                        <p>${asset.symbol}</p>
                    </div>
                </div>
                <div class="asset-card-stats">
                    <div class="asset-stat">
                        <label>Balance</label>
                        <value>${asset.balance.toFixed(4)}</value>
                    </div>
                    <div class="asset-stat">
                        <label>Value</label>
                        <value>$${asset.value.toLocaleString()}</value>
                    </div>
                </div>
                <div class="stat-card-change ${changeClass}">
                    ${changeIcon} ${Math.abs(asset.change)}%
                </div>
            `;

            return card;
        }

        /**
         * Setup Transactions
         */
        setupTransactions() {
            const transactions = [
                { type: 'buy', asset: 'ETH', amount: '0.5', value: '$825.10', status: 'completed', date: '2025-10-19' },
                { type: 'sell', asset: 'BTC', amount: '0.05', value: '$2,150.00', status: 'completed', date: '2025-10-18' },
                { type: 'transfer', asset: 'USDC', amount: '500', value: '$500.00', status: 'pending', date: '2025-10-17' },
            ];

            const tbody = document.getElementById('transactions-tbody');
            if (!tbody) return;

            tbody.innerHTML = transactions.map(tx => `
                <tr>
                    <td><span class="transaction-type ${tx.type}">${tx.type}</span></td>
                    <td>${tx.asset}</td>
                    <td>${tx.amount}</td>
                    <td>${tx.value}</td>
                    <td>
                        <span class="transaction-status">
                            <span class="status-dot ${tx.status}"></span>
                            ${tx.status}
                        </span>
                    </td>
                    <td>${tx.date}</td>
                </tr>
            `).join('');
        }

        /**
         * Setup Market Data
         */
        async setupMarketData() {
            const marketData = [
                { name: 'Bitcoin', symbol: 'BTC', price: 43000, change: 2.5 },
                { name: 'Ethereum', symbol: 'ETH', price: 1650, change: -1.2 },
                { name: 'Solana', symbol: 'SOL', price: 45, change: 8.7 },
                { name: 'Cardano', symbol: 'ADA', price: 0.35, change: -3.4 },
            ];

            const container = document.getElementById('market-overview-container');
            if (!container) return;

            container.innerHTML = marketData.map(coin => {
                const changeClass = coin.change >= 0 ? 'positive' : 'negative';
                const changeIcon = coin.change >= 0 ? '↑' : '↓';
                
                return `
                    <div class="market-card reveal">
                        <div class="market-card-name">${coin.name}</div>
                        <div class="market-card-price">$${coin.price.toLocaleString()}</div>
                        <div class="market-card-change ${changeClass}">
                            ${changeIcon} ${Math.abs(coin.change)}%
                        </div>
                    </div>
                `;
            }).join('');
        }

        /**
         * Setup Animations
         */
        setupAnimations() {
            // Scroll reveal ya está implementado globalmente
            // Agregar cualquier animación específica del dashboard aquí
        }

        /**
         * Animate Number
         */
        animateNumber(element, start, end, duration, prefix = '') {
            const startTime = Date.now();
            
            const animate = () => {
                const currentTime = Date.now();
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const current = start + (end - start) * this.easeOutQuad(progress);
                element.textContent = `${prefix}${current.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        }

        easeOutQuad(t) {
            return t * (2 - t);
        }
    }

    /**
     * Inicialización
     */
    function init() {
        log('🎨 Inicializando Dashboard Moderno...');

        // Crear instancia del dashboard
        const dashboard = new DashboardManager();

        // Exponer globalmente
        window.dashboard = dashboard;

        log('🎉 Dashboard listo!');
    }

    // Ejecutar al cargar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
