const axios = require('axios');
const config = require('../config/config');

class PriceService {
  constructor() {
    this.cache = new Map(); // key: `${assets.join(',')}_${vs}` -> { timestamp, data }
    this.ttl = config.PRICE_FEEDS.cacheTtlMs || 60000;
    this.coingeckoUrl = config.PRICE_FEEDS.coingeckoUrl;
    this.defaultVs = config.BASE_CURRENCY || 'usdt';
  }

  _cacheKey(assets, vs) {
    return `${assets.sort().join(',').toLowerCase()}_${vs.toLowerCase()}`;
  }

  _fromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    const isFresh = Date.now() - cached.timestamp < this.ttl;
    return isFresh ? cached.data : null;
  }

  _setCache(key, data) {
    this.cache.set(key, { timestamp: Date.now(), data });
  }

  async getPrices(assets = ['bitcoin'], vs = 'usd') {
    const normalizedAssets = assets.map(a => a.trim().toLowerCase()).filter(Boolean);
    const normalizedVs = (vs || this.defaultVs || 'usd').toLowerCase();
    const key = this._cacheKey(normalizedAssets, normalizedVs);

    const cached = this._fromCache(key);
    if (cached) {
      return { success: true, source: 'cache', data: cached };
    }

    // 1) Intentar CoinGecko (con cambio/volumen para UI más precisa)
    try {
      const params = {
        ids: normalizedAssets.join(','),
        vs_currencies: normalizedVs,
        include_24hr_change: true,
        include_last_updated_at: true,
        include_24hr_vol: true,
      };
      const { data } = await axios.get(this.coingeckoUrl, { params, timeout: 5000 });
      if (data && Object.keys(data).length) {
        this._setCache(key, data);
        return { success: true, source: 'coingecko', data };
      }
    } catch (error) {
      // continua a fallback
    }

    // 2) Fallback estático mínimo si no hay resultados previos
    const previous = this.cache.get(key)?.data;
    if (previous) {
      return {
        success: true,
        source: 'stale-cache',
        data: previous,
        warning: 'Using stale cached price',
      };
    }

    return { success: false, error: 'Failed to fetch prices from providers' };
  }
}

module.exports = new PriceService();
