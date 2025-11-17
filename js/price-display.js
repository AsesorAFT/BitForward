/**
 * BitForward Price Display Integration
 * Integra el sistema de precios con la UI del dashboard
 *
 * @author BitForward Team
 * @date 2025-10-19
 */

class PriceDisplayManager {
  constructor(priceFeedManager) {
    this.priceManager = priceFeedManager;
    this.activeSubscriptions = new Map();
    this.priceElements = new Map();

    this.init();
  }

  async init() {
    console.log('🎨 Inicializando Price Display Manager...');

    // Esperar a que el price manager esté listo
    if (!this.priceManager.isInitialized) {
      this.priceManager.on('initialized', () => this.setupDisplay());
    } else {
      this.setupDisplay();
    }
  }

  /**
     * Configurar display de precios en el dashboard
     */
  setupDisplay() {
    // Detectar todos los elementos de precio en la página
    this.findPriceElements();

    // Suscribirse a actualizaciones
    this.subscribeToUpdates();

    // Actualizar UI inicial
    this.updateAllPrices();

    console.log('✅ Price Display Manager inicializado');
  }

  /**
     * Encontrar elementos de precio en el DOM
     */
  findPriceElements() {
    // Buscar por atributos data
    const elements = document.querySelectorAll('[data-price-symbol]');

    elements.forEach(element => {
      const symbol = element.getAttribute('data-price-symbol').toUpperCase();
      const type = element.getAttribute('data-price-type') || 'price'; // price, change, volume

      if (!this.priceElements.has(symbol)) {
        this.priceElements.set(symbol, []);
      }

      this.priceElements.get(symbol).push({ element, type });
    });

    console.log(`📍 ${this.priceElements.size} símbolos encontrados en DOM`);
  }

  /**
     * Suscribirse a actualizaciones de precio
     */
  subscribeToUpdates() {
    // Suscribirse a cada símbolo detectado
    for (const symbol of this.priceElements.keys()) {
      const unsubscribe = this.priceManager.subscribe(symbol, (priceData) => {
        this.updateSymbolDisplay(symbol, priceData);
      });

      this.activeSubscriptions.set(symbol, unsubscribe);
    }

    // Suscribirse a evento general de actualización
    this.priceManager.on('price:update', ({ symbol, data }) => {
      this.animatePriceChange(symbol, data);
    });
  }

  /**
     * Actualizar display de un símbolo específico
     */
  updateSymbolDisplay(symbol, priceData) {
    const elements = this.priceElements.get(symbol);
    if (!elements) {return;}

    elements.forEach(({ element, type }) => {
      switch (type) {
        case 'price':
          element.textContent = this.priceManager.formatPrice(priceData.price);
          this.updateTrendIndicator(element, priceData.trend);
          break;

        case 'change':
          element.textContent = this.priceManager.formatPercentage(priceData.change24h);
          this.updateChangeColor(element, priceData.change24h);
          break;

        case 'volume':
          element.textContent = this.priceManager.formatVolume(priceData.volume24h);
          break;

        case 'marketcap':
          element.textContent = this.priceManager.formatVolume(priceData.marketCap);
          break;

        default:
          element.textContent = this.priceManager.formatPrice(priceData.price);
      }
    });
  }

  /**
     * Actualizar todos los precios
     */
  updateAllPrices() {
    const allPrices = this.priceManager.getAllPrices();

    for (const [symbol, priceData] of Object.entries(allPrices)) {
      this.updateSymbolDisplay(symbol, priceData);
    }
  }

  /**
     * Animar cambio de precio
     */
  animatePriceChange(symbol, priceData) {
    const elements = this.priceElements.get(symbol);
    if (!elements) {return;}

    elements.forEach(({ element, type }) => {
      if (type !== 'price') {return;}

      // Remover clases anteriores
      element.classList.remove('price-up', 'price-down', 'price-pulse');

      // Agregar clase según tendencia
      if (priceData.trend === 'up') {
        element.classList.add('price-up', 'price-pulse');
      } else if (priceData.trend === 'down') {
        element.classList.add('price-down', 'price-pulse');
      }

      // Remover animación después de 1 segundo
      setTimeout(() => {
        element.classList.remove('price-pulse');
      }, 1000);
    });
  }

  /**
     * Actualizar indicador de tendencia
     */
  updateTrendIndicator(element, trend) {
    const parent = element.parentElement;
    if (!parent) {return;}

    let indicator = parent.querySelector('.trend-indicator');
    if (!indicator) {
      indicator = document.createElement('span');
      indicator.className = 'trend-indicator';
      parent.appendChild(indicator);
    }

    indicator.className = 'trend-indicator';

    if (trend === 'up') {
      indicator.textContent = '▲';
      indicator.classList.add('trend-up');
    } else if (trend === 'down') {
      indicator.textContent = '▼';
      indicator.classList.add('trend-down');
    } else {
      indicator.textContent = '▬';
      indicator.classList.add('trend-neutral');
    }
  }

  /**
     * Actualizar color de cambio
     */
  updateChangeColor(element, change) {
    element.classList.remove('text-green-400', 'text-red-400', 'text-gray-400');

    if (change > 0) {
      element.classList.add('text-green-400');
    } else if (change < 0) {
      element.classList.add('text-red-400');
    } else {
      element.classList.add('text-gray-400');
    }
  }

  /**
     * Crear widget de precio
     */
  createPriceWidget(symbol, container) {
    const priceData = this.priceManager.getPrice(symbol);
    if (!priceData) {
      console.warn(`No hay datos de precio para ${symbol}`);
      return;
    }

    const widget = document.createElement('div');
    widget.className = 'price-widget bg-gray-800 rounded-lg p-4';
    widget.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div>
                    <h3 class="text-lg font-bold text-white">${symbol}</h3>
                    <p class="text-sm text-gray-400">${this.getSymbolName(symbol)}</p>
                </div>
                <div class="text-right">
                    <p class="text-2xl font-bold text-white" data-price-symbol="${symbol}" data-price-type="price">
                        ${this.priceManager.formatPrice(priceData.price)}
                    </p>
                    <p class="text-sm" data-price-symbol="${symbol}" data-price-type="change">
                        ${this.priceManager.formatPercentage(priceData.change24h)}
                    </p>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs text-gray-400">
                <div>
                    <p>Vol 24h</p>
                    <p class="text-white" data-price-symbol="${symbol}" data-price-type="volume">
                        ${this.priceManager.formatVolume(priceData.volume24h)}
                    </p>
                </div>
                <div>
                    <p>Market Cap</p>
                    <p class="text-white" data-price-symbol="${symbol}" data-price-type="marketcap">
                        ${this.priceManager.formatVolume(priceData.marketCap)}
                    </p>
                </div>
            </div>
        `;

    container.appendChild(widget);

    // Registrar elementos para actualizaciones
    this.findPriceElements();
    this.subscribeToUpdates();
  }

  /**
     * Obtener nombre completo del símbolo
     */
  getSymbolName(symbol) {
    const names = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'SOL': 'Solana',
      'MATIC': 'Polygon',
      'BNB': 'Binance Coin',
      'ADA': 'Cardano',
      'AVAX': 'Avalanche',
      'USDT': 'Tether',
      'USDC': 'USD Coin',
      'DAI': 'Dai'
    };
    return names[symbol] || symbol;
  }

  /**
     * Crear mini ticker (ticker compacto)
     */
  createMiniTicker(symbols, container) {
    const ticker = document.createElement('div');
    ticker.className = 'mini-ticker flex gap-4 overflow-x-auto py-2';

    symbols.forEach(symbol => {
      const priceData = this.priceManager.getPrice(symbol);
      if (!priceData) {return;}

      const item = document.createElement('div');
      item.className = 'mini-ticker-item flex items-center gap-2 whitespace-nowrap';
      item.innerHTML = `
                <span class="font-bold text-white">${symbol}</span>
                <span class="text-white" data-price-symbol="${symbol}" data-price-type="price">
                    ${this.priceManager.formatPrice(priceData.price)}
                </span>
                <span class="text-sm" data-price-symbol="${symbol}" data-price-type="change">
                    ${this.priceManager.formatPercentage(priceData.change24h)}
                </span>
            `;

      ticker.appendChild(item);
    });

    container.appendChild(ticker);

    // Registrar para actualizaciones
    this.findPriceElements();
    this.subscribeToUpdates();
  }

  /**
     * Limpiar y desuscribirse
     */
  destroy() {
    // Desuscribirse de todas las actualizaciones
    for (const unsubscribe of this.activeSubscriptions.values()) {
      unsubscribe();
    }

    this.activeSubscriptions.clear();
    this.priceElements.clear();

    console.log('✅ Price Display Manager limpiado');
  }
}

// Auto-inicializar si existe priceFeedManager
if (typeof window !== 'undefined' && window.priceFeedManager) {
  window.priceDisplayManager = new PriceDisplayManager(window.priceFeedManager);
}

// Exportar
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PriceDisplayManager;
}
