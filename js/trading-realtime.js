/**
 * BitForward - Real-time Trading Data Integration
 * Integración con TradingView y APIs de precios en tiempo real
 */

class TradingDataManager {
    constructor() {
        this.assetPrices = {
            BTC: { price: 0, change: 0, symbol: 'BTCUSD', geckoId: 'bitcoin' },
            ETH: { price: 0, change: 0, symbol: 'ETHUSD', geckoId: 'ethereum' },
            SOL: { price: 0, change: 0, symbol: 'SOLUSD', geckoId: 'solana' },
            AVAX: { price: 0, change: 0, symbol: 'AVAXUSD', geckoId: 'avalanche-2' },
            BNB: { price: 0, change: 0, symbol: 'BNBUSD', geckoId: 'binancecoin' },
            ADA: { price: 0, change: 0, symbol: 'ADAUSD', geckoId: 'cardano' }
        };
        
        this.currentSymbol = 'BTCUSD';
        this.updateInterval = null;
        this.chartWidget = null;
        
        this.init();
    }
    
    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        this.loadInitialChart();
        this.fetchPrices();
        this.startPriceUpdates();
        this.setupEventListeners();
    }
    
    /**
     * Cargar gráfico inicial de TradingView
     */
    loadInitialChart() {
        if (typeof TradingView === 'undefined') {
            console.warn('TradingView library not loaded yet, retrying...');
            setTimeout(() => this.loadInitialChart(), 500);
            return;
        }
        
        this.loadChart('BTCUSD');
    }
    
    /**
     * Cargar gráfico de TradingView para un símbolo específico
     */
    loadChart(symbol) {
        this.currentSymbol = symbol;
        
        const container = document.getElementById('tradingview_chart_widget');
        if (!container) return;
        
        // Limpiar contenedor
        container.innerHTML = '';
        
        try {
            this.chartWidget = new TradingView.widget({
                "width": "100%",
                "height": "100%",
                "symbol": "BINANCE:" + symbol.replace('USD', 'USDT'),
                "interval": "15",
                "timezone": "America/New_York",
                "theme": "dark",
                "style": "1",
                "locale": "es",
                "toolbar_bg": "#0F172A",
                "enable_publishing": false,
                "hide_side_toolbar": false,
                "allow_symbol_change": true,
                "save_image": false,
                "container_id": "tradingview_chart_widget",
                "studies": [
                    "MASimple@tv-basicstudies",
                    "RSI@tv-basicstudies",
                    "MACD@tv-basicstudies"
                ],
                "show_popup_button": true,
                "popup_width": "1000",
                "popup_height": "650",
                "withdateranges": true,
                "hide_top_toolbar": false,
                "hide_legend": false,
                "save_image": true
            });
        } catch (error) {
            console.error('Error loading TradingView chart:', error);
        }
    }
    
    /**
     * Obtener precios desde CoinGecko API
     */
    async fetchPrices() {
        try {
            const ids = Object.values(this.assetPrices).map(a => a.geckoId).join(',');
            const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`;
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();
            
            // Actualizar precios
            Object.keys(this.assetPrices).forEach(key => {
                const geckoId = this.assetPrices[key].geckoId;
                if (data[geckoId]) {
                    this.assetPrices[key].price = data[geckoId].usd || 0;
                    this.assetPrices[key].change = data[geckoId].usd_24h_change || 0;
                    this.assetPrices[key].volume = data[geckoId].usd_24h_vol || 0;
                    this.assetPrices[key].marketCap = data[geckoId].usd_market_cap || 0;
                }
            });
            
            this.updateUI();
            
        } catch (error) {
            console.error('Error fetching prices from CoinGecko:', error);
            // Usar precios de respaldo si falla la API
            this.useFallbackPrices();
        }
    }
    
    /**
     * Precios de respaldo si falla la API
     */
    useFallbackPrices() {
        this.assetPrices.BTC.price = 67234.56;
        this.assetPrices.ETH.price = 3456.78;
        this.assetPrices.SOL.price = 145.23;
        this.assetPrices.AVAX.price = 38.91;
        this.assetPrices.BNB.price = 615.43;
        this.assetPrices.ADA.price = 0.58;
        
        this.updateUI();
    }
    
    /**
     * Actualizar UI con nuevos precios
     */
    updateUI() {
        this.updateEntryPrice();
        this.updatePositionCalculations();
        
        // Disparar evento para que otros componentes se actualicen
        window.dispatchEvent(new CustomEvent('pricesUpdated', {
            detail: { prices: this.assetPrices }
        }));
    }
    
    /**
     * Actualizar precio de entrada en el formulario
     */
    updateEntryPrice() {
        const assetSelect = document.getElementById('asset-select');
        const entryPriceEl = document.getElementById('entry-price');
        
        if (!assetSelect || !entryPriceEl) return;
        
        const selectedAsset = assetSelect.value;
        const priceData = this.assetPrices[selectedAsset];
        
        if (priceData && priceData.price > 0) {
            entryPriceEl.textContent = this.formatPrice(priceData.price);
        }
    }
    
    /**
     * Actualizar cálculos de posición
     */
    updatePositionCalculations() {
        const assetSelect = document.getElementById('asset-select');
        const leverageSlider = document.getElementById('leverage-slider');
        const collateralInput = document.querySelector('input[placeholder="0.1"]');
        
        if (!assetSelect || !leverageSlider || !collateralInput) return;
        
        const asset = assetSelect.value;
        const leverage = parseInt(leverageSlider.value) || 5;
        const collateral = parseFloat(collateralInput.value) || 0;
        const price = this.assetPrices[asset]?.price || 0;
        
        if (collateral > 0 && price > 0) {
            // Calcular precio de liquidación (simplificado)
            const isLong = document.querySelector('.btn-long.active') !== null;
            const liquidationPrice = isLong 
                ? price * (1 - (1 / leverage) * 0.9)
                : price * (1 + (1 / leverage) * 0.9);
            
            const liquidationEl = document.getElementById('liquidation-price');
            if (liquidationEl) {
                liquidationEl.textContent = this.formatPrice(liquidationPrice);
            }
            
            // Calcular margen requerido
            const notionalValue = collateral * price * leverage;
            const requiredMargin = notionalValue / leverage;
            
            const marginEl = document.getElementById('required-margin');
            if (marginEl) {
                marginEl.textContent = this.formatPrice(requiredMargin);
            }
        }
    }
    
    /**
     * Formatear precio con símbolo de dólar
     */
    formatPrice(price) {
        return '$' + price.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    /**
     * Iniciar actualizaciones automáticas de precios
     */
    startPriceUpdates() {
        // Actualizar cada 30 segundos
        this.updateInterval = setInterval(() => {
            this.fetchPrices();
        }, 30000);
    }
    
    /**
     * Detener actualizaciones automáticas
     */
    stopPriceUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Asset selector
        const assetSelect = document.getElementById('asset-select');
        if (assetSelect) {
            assetSelect.addEventListener('change', (e) => {
                const asset = e.target.value;
                const symbol = this.assetPrices[asset]?.symbol;
                if (symbol) {
                    this.loadChart(symbol);
                    this.updateUI();
                }
            });
        }
        
        // Leverage slider
        const leverageSlider = document.getElementById('leverage-slider');
        if (leverageSlider) {
            leverageSlider.addEventListener('input', () => {
                this.updatePositionCalculations();
            });
        }
        
        // Collateral input
        const collateralInput = document.querySelector('input[placeholder="0.1"]');
        if (collateralInput) {
            collateralInput.addEventListener('input', () => {
                this.updatePositionCalculations();
            });
        }
        
        // Position type buttons
        const positionButtons = document.querySelectorAll('.btn-position');
        positionButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                setTimeout(() => this.updatePositionCalculations(), 100);
            });
        });
    }
    
    /**
     * Obtener datos de un activo específico
     */
    getAssetData(symbol) {
        return this.assetPrices[symbol] || null;
    }
    
    /**
     * Obtener todos los precios
     */
    getAllPrices() {
        return { ...this.assetPrices };
    }
}

// Crear instancia global
const tradingDataManager = new TradingDataManager();

// Exportar para uso global
window.TradingDataManager = tradingDataManager;

console.log('📊 BitForward Real-time Trading Data Manager loaded');
