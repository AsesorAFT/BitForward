/**
 * BitForward Price Feed Manager
 * Sistema de precios en tiempo real usando múltiples fuentes
 * - CoinGecko API (REST)
 * - Binance WebSocket (tiempo real)
 * - Chainlink Oracles (on-chain)
 *
 * @author BitForward Team
 * @date 2025-10-19
 * @version 1.0.0
 */

class PriceFeedManager {
  constructor() {
    this.prices = new Map();
    this.subscribers = new Map();
    this.wsConnections = new Map();
    this.updateInterval = null;
    this.isInitialized = false;

    // Configuración
    this.config = {
      updateInterval: 30000, // 30 segundos
      coingeckoAPI: 'https://api.coingecko.com/api/v3',
      binanceWS: 'wss://stream.binance.com:9443/ws',
      retryAttempts: 3,
      retryDelay: 2000,
    };

    // Símbolos soportados
    this.symbols = {
      BTC: { id: 'bitcoin', binance: 'btcusdt' },
      ETH: { id: 'ethereum', binance: 'ethusdt' },
      SOL: { id: 'solana', binance: 'solusdt' },
      MATIC: { id: 'matic-network', binance: 'maticusdt' },
      BNB: { id: 'binancecoin', binance: 'bnbusdt' },
      ADA: { id: 'cardano', binance: 'adausdt' },
      AVAX: { id: 'avalanche-2', binance: 'avaxusdt' },
      USDT: { id: 'tether', binance: 'usdtusdt' },
      USDC: { id: 'usd-coin', binance: 'usdcusdt' },
      DAI: { id: 'dai', binance: 'daiusdt' },
    };

    this.init();
  }

  /**
   * Inicializar el sistema de precios
   */
  async init() {
    console.log('💰 Inicializando Price Feed Manager...');

    try {
      // Cargar precios iniciales
      await this.fetchInitialPrices();

      // Iniciar WebSocket para updates en tiempo real
      this.startWebSocketFeeds();

      // Iniciar polling periódico como backup
      this.startPeriodicUpdates();

      this.isInitialized = true;
      console.log('✅ Price Feed Manager inicializado');
      console.log(`📊 ${this.prices.size} precios cargados`);

      this.emit('initialized', {
        pricesLoaded: this.prices.size,
        symbols: Array.from(this.prices.keys()),
      });
    } catch (error) {
      console.error('❌ Error inicializando Price Feed:', error);
      // Reintentar en 5 segundos
      setTimeout(() => this.init(), 5000);
    }
  }

  /**
   * Cargar precios iniciales de CoinGecko
   */
  async fetchInitialPrices() {
    console.log('📥 Cargando precios iniciales de CoinGecko...');

    const ids = Object.values(this.symbols)
      .map(s => s.id)
      .join(',');
    const url = `${this.config.coingeckoAPI}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&include_last_updated_at=true`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      // Procesar y almacenar precios
      for (const [symbol, config] of Object.entries(this.symbols)) {
        const priceData = data[config.id];
        if (priceData) {
          this.updatePrice(symbol, {
            price: priceData.usd,
            change24h: priceData.usd_24h_change || 0,
            volume24h: priceData.usd_24h_vol || 0,
            marketCap: priceData.usd_market_cap || 0,
            lastUpdated: priceData.last_updated_at
              ? new Date(priceData.last_updated_at * 1000)
              : new Date(),
            source: 'coingecko',
          });
        }
      }

      console.log(`✅ ${this.prices.size} precios cargados de CoinGecko`);
    } catch (error) {
      console.error('❌ Error cargando precios de CoinGecko:', error);
      throw error;
    }
  }

  /**
   * Iniciar WebSocket para precios en tiempo real
   */
  startWebSocketFeeds() {
    console.log('🔌 Conectando WebSockets de Binance...');

    // Crear streams para cada símbolo
    const streams = Object.values(this.symbols)
      .filter(s => s.binance)
      .map(s => `${s.binance}@ticker`)
      .join('/');

    const wsUrl = `${this.config.binanceWS}/${streams}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✅ WebSocket conectado a Binance');
        this.emit('websocket:connected');
      };

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          this.handleBinanceUpdate(data);
        } catch (error) {
          console.error('Error procesando mensaje WebSocket:', error);
        }
      };

      ws.onerror = error => {
        console.error('❌ WebSocket error:', error);
        this.emit('websocket:error', error);
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket cerrado, reconectando...');
        this.emit('websocket:disconnected');
        // Reconectar en 5 segundos
        setTimeout(() => this.startWebSocketFeeds(), 5000);
      };

      this.wsConnections.set('binance', ws);
    } catch (error) {
      console.error('❌ Error creando WebSocket:', error);
    }
  }

  /**
   * Manejar actualización de Binance WebSocket
   */
  handleBinanceUpdate(data) {
    if (!data.s || !data.c) return;

    // Buscar símbolo correspondiente
    const symbol = Object.keys(this.symbols).find(
      key => this.symbols[key].binance === data.s.toLowerCase()
    );

    if (symbol) {
      const currentPrice = this.prices.get(symbol);
      const newPrice = parseFloat(data.c);
      const change24h = parseFloat(data.P);
      const volume24h = parseFloat(data.v);

      this.updatePrice(symbol, {
        price: newPrice,
        change24h: change24h,
        volume24h: volume24h * newPrice,
        lastUpdated: new Date(),
        source: 'binance',
        previousPrice: currentPrice?.price,
      });
    }
  }

  /**
   * Actualizar precio de un símbolo
   */
  updatePrice(symbol, data) {
    const previousData = this.prices.get(symbol);

    const priceData = {
      symbol,
      price: data.price,
      change24h: data.change24h || 0,
      volume24h: data.volume24h || 0,
      marketCap: data.marketCap || 0,
      lastUpdated: data.lastUpdated || new Date(),
      source: data.source || 'unknown',
      previousPrice: data.previousPrice || previousData?.price,
      trend: this.calculateTrend(data.price, previousData?.price),
    };

    this.prices.set(symbol, priceData);

    // Notificar subscribers
    this.emit('price:update', { symbol, data: priceData });
    this.emit(`price:${symbol}`, priceData);
  }

  /**
   * Calcular tendencia del precio
   */
  calculateTrend(currentPrice, previousPrice) {
    if (!previousPrice) return 'neutral';
    if (currentPrice > previousPrice) return 'up';
    if (currentPrice < previousPrice) return 'down';
    return 'neutral';
  }

  /**
   * Iniciar actualizaciones periódicas (backup)
   */
  startPeriodicUpdates() {
    if (this.updateInterval) return;

    this.updateInterval = setInterval(async () => {
      try {
        await this.fetchInitialPrices();
        console.log('🔄 Precios actualizados (periodic)');
      } catch (error) {
        console.error('Error en actualización periódica:', error);
      }
    }, this.config.updateInterval);

    console.log(`⏰ Actualizaciones periódicas cada ${this.config.updateInterval / 1000}s`);
  }

  /**
   * Detener actualizaciones periódicas
   */
  stopPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('⏸️ Actualizaciones periódicas detenidas');
    }
  }

  /**
   * Obtener precio actual de un símbolo
   */
  getPrice(symbol) {
    return this.prices.get(symbol.toUpperCase());
  }

  /**
   * Obtener precio formateado
   */
  getFormattedPrice(symbol, decimals = 2) {
    const data = this.getPrice(symbol);
    if (!data) return null;

    return {
      ...data,
      priceFormatted: this.formatPrice(data.price, decimals),
      change24hFormatted: this.formatPercentage(data.change24h),
      volume24hFormatted: this.formatVolume(data.volume24h),
      marketCapFormatted: this.formatVolume(data.marketCap),
    };
  }

  /**
   * Obtener todos los precios
   */
  getAllPrices() {
    const prices = {};
    for (const [symbol, data] of this.prices.entries()) {
      prices[symbol] = data;
    }
    return prices;
  }

  /**
   * Formatear precio
   */
  formatPrice(price, decimals = 2) {
    if (price === null || price === undefined) return 'N/A';

    // Para precios muy pequeños, usar más decimales
    if (price < 0.01) decimals = 6;
    else if (price < 1) decimals = 4;

    return (
      '$' +
      price.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    );
  }

  /**
   * Formatear porcentaje
   */
  formatPercentage(value) {
    if (value === null || value === undefined) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return sign + value.toFixed(2) + '%';
  }

  /**
   * Formatear volumen
   */
  formatVolume(value) {
    if (value === null || value === undefined) return 'N/A';

    if (value >= 1e9) {
      return '$' + (value / 1e9).toFixed(2) + 'B';
    } else if (value >= 1e6) {
      return '$' + (value / 1e6).toFixed(2) + 'M';
    } else if (value >= 1e3) {
      return '$' + (value / 1e3).toFixed(2) + 'K';
    }
    return '$' + value.toFixed(2);
  }

  /**
   * Suscribirse a actualizaciones de precio
   */
  subscribe(symbol, callback) {
    const key = `price:${symbol.toUpperCase()}`;
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }
    this.subscribers.get(key).push(callback);

    // Enviar precio actual inmediatamente
    const currentPrice = this.getPrice(symbol);
    if (currentPrice) {
      callback(currentPrice);
    }

    return () => this.unsubscribe(symbol, callback);
  }

  /**
   * Desuscribirse de actualizaciones
   */
  unsubscribe(symbol, callback) {
    const key = `price:${symbol.toUpperCase()}`;
    if (this.subscribers.has(key)) {
      const callbacks = this.subscribers.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Sistema de eventos
   */
  on(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }
    this.subscribers.get(event).push(callback);
  }

  emit(event, data) {
    if (this.subscribers.has(event)) {
      this.subscribers.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en listener de ${event}:`, error);
        }
      });
    }
  }

  /**
   * Obtener precio histórico (simplificado)
   */
  async getHistoricalPrice(symbol, days = 7) {
    const config = this.symbols[symbol.toUpperCase()];
    if (!config) throw new Error(`Símbolo ${symbol} no soportado`);

    const url = `${this.config.coingeckoAPI}/coins/${config.id}/market_chart?vs_currency=usd&days=${days}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      return data.prices.map(([timestamp, price]) => ({
        timestamp: new Date(timestamp),
        price,
      }));
    } catch (error) {
      console.error('Error obteniendo precio histórico:', error);
      throw error;
    }
  }

  /**
   * Cerrar todas las conexiones
   */
  destroy() {
    console.log('🛑 Cerrando Price Feed Manager...');

    // Cerrar WebSockets
    for (const ws of this.wsConnections.values()) {
      ws.close();
    }
    this.wsConnections.clear();

    // Detener actualizaciones periódicas
    this.stopPeriodicUpdates();

    // Limpiar subscribers
    this.subscribers.clear();

    console.log('✅ Price Feed Manager cerrado');
  }

  /**
   * Obtener estado del sistema
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      pricesLoaded: this.prices.size,
      websocketsConnected: this.wsConnections.size,
      subscribersCount: this.subscribers.size,
      lastUpdate: Math.max(...Array.from(this.prices.values()).map(p => p.lastUpdated.getTime())),
      symbols: Array.from(this.prices.keys()),
    };
  }
}

// Crear instancia global
const priceFeedManager = new PriceFeedManager();

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
  window.priceFeedManager = priceFeedManager;
}

// Exportar para módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PriceFeedManager;
}
