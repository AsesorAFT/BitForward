/**
 * BitForward API Client v2.0
 * Cliente HTTP robusto con retry, cache y manejo de errores
 */

class BitForwardAPI {
  constructor(config = {}) {
    this.baseURL = config.baseURL || 'http://localhost:3001/api';
    this.timeout = config.timeout || 10000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;

    // Cache para requests GET
    this.cache = new Map();
    this.cacheTTL = config.cacheTTL || 5 * 60 * 1000; // 5 minutos

    // Interceptores
    this.requestInterceptors = [];
    this.responseInterceptors = [];

    // Setup default interceptors
    this.setupDefaultInterceptors();
  }

  setupDefaultInterceptors() {
    // Request interceptor para agregar auth token
    this.addRequestInterceptor(config => {
      const token = localStorage.getItem('bitforward_token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor para manejar token expiration
    this.addResponseInterceptor(
      response => response,
      async error => {
        if (error.status === 401 && error.data?.code === 'TOKEN_EXPIRED') {
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry the original request
            return this.request(error.config);
          }
        }
        throw error;
      }
    );
  }

  // === Core Request Method ===

  async request(config) {
    // Apply request interceptors
    const processedConfig = await this.applyRequestInterceptors(config);

    // Check cache for GET requests
    if (processedConfig.method === 'GET') {
      const cached = this.getFromCache(processedConfig.url);
      if (cached) {
        return cached;
      }
    }

    let lastError;

    // Retry logic
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await this.performRequest(processedConfig);

        // Cache successful GET responses
        if (processedConfig.method === 'GET' && response.success) {
          this.setCache(processedConfig.url, response);
        }

        return await this.applyResponseInterceptors(response);
      } catch (error) {
        lastError = error;

        // Don't retry certain errors
        if (this.shouldNotRetry(error) || attempt === this.retryAttempts) {
          break;
        }

        // Wait before retry
        await this.delay(this.retryDelay * attempt);
      }
    }

    throw await this.applyResponseInterceptors(null, lastError);
  }

  async performRequest(config) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const url = config.url.startsWith('http') ? config.url : `${this.baseURL}${config.url}`;

      const fetchConfig = {
        method: config.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        signal: controller.signal,
      };

      if (config.data && ['POST', 'PUT', 'PATCH'].includes(fetchConfig.method)) {
        fetchConfig.body = JSON.stringify(config.data);
      }

      const response = await fetch(url, fetchConfig);
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          statusText: response.statusText,
          data,
          config,
        };
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw {
          status: 408,
          statusText: 'Request Timeout',
          data: { message: 'Request timed out' },
          config,
        };
      }

      throw error;
    }
  }

  // === HTTP Methods ===

  async get(url, config = {}) {
    return this.request({
      method: 'GET',
      url,
      ...config,
    });
  }

  async post(url, data, config = {}) {
    return this.request({
      method: 'POST',
      url,
      data,
      ...config,
    });
  }

  async put(url, data, config = {}) {
    return this.request({
      method: 'PUT',
      url,
      data,
      ...config,
    });
  }

  async patch(url, data, config = {}) {
    return this.request({
      method: 'PATCH',
      url,
      data,
      ...config,
    });
  }

  async delete(url, config = {}) {
    return this.request({
      method: 'DELETE',
      url,
      ...config,
    });
  }

  // === API Endpoints ===

  // Authentication
  async login(credentials) {
    const response = await this.post('/auth/login', credentials);

    if (response.success) {
      // Store tokens
      localStorage.setItem('bitforward_token', response.data.tokens.accessToken);
      localStorage.setItem('bitforward_refresh_token', response.data.tokens.refreshToken);

      // Clear cache on login
      this.clearCache();
    }

    return response;
  }

  async register(userData) {
    return this.post('/auth/register', userData);
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } finally {
      // Clear local storage regardless of response
      localStorage.removeItem('bitforward_token');
      localStorage.removeItem('bitforward_refresh_token');
      this.clearCache();
    }
  }

  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('bitforward_refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.post('/auth/refresh', { refreshToken });

      if (response.success) {
        localStorage.setItem('bitforward_token', response.data.accessToken);
        return true;
      }

      return false;
    } catch (error) {
      // Clear tokens on refresh failure
      localStorage.removeItem('bitforward_token');
      localStorage.removeItem('bitforward_refresh_token');
      return false;
    }
  }

  async verifyToken() {
    try {
      return await this.get('/auth/verify');
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Contracts
  async getContracts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `/contracts${queryString ? `?${queryString}` : ''}`;
    return this.get(url);
  }

  async getContract(id) {
    return this.get(`/contracts/${id}`);
  }

  async createContract(contractData) {
    const response = await this.post('/contracts', contractData);

    // Invalidate contracts cache
    this.invalidateCache('/contracts');

    return response;
  }

  async updateContract(id, updates) {
    const response = await this.put(`/contracts/${id}`, updates);

    // Invalidate related cache
    this.invalidateCache('/contracts');
    this.invalidateCache(`/contracts/${id}`);

    return response;
  }

  async deleteContract(id) {
    const response = await this.delete(`/contracts/${id}`);

    // Invalidate related cache
    this.invalidateCache('/contracts');
    this.invalidateCache(`/contracts/${id}`);

    return response;
  }

  // Portfolio and Stats
  async getPortfolio() {
    return this.get('/portfolio');
  }

  async getStats() {
    return this.get('/stats');
  }

  async getAnalytics(timeframe = '7d') {
    return this.get(`/analytics?timeframe=${timeframe}`);
  }

  // Market Data
  async getPrices(assets = ['BTC', 'ETH', 'SOL']) {
    const assetsParam = assets.join(',');
    return this.get(`/market/prices?assets=${assetsParam}`);
  }

  async getMarketData() {
    return this.get('/market/overview');
  }

  // === Cache Management ===

  getFromCache(url) {
    const cached = this.cache.get(url);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.cache.delete(url);
      return null;
    }

    return cached.data;
  }

  setCache(url, data) {
    this.cache.set(url, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidateCache(pattern) {
    if (pattern) {
      // Remove specific pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    }
  }

  clearCache() {
    this.cache.clear();
  }

  // === Interceptors ===

  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(successInterceptor, errorInterceptor) {
    this.responseInterceptors.push({
      success: successInterceptor,
      error: errorInterceptor,
    });
  }

  async applyRequestInterceptors(config) {
    let processedConfig = { ...config };

    for (const interceptor of this.requestInterceptors) {
      processedConfig = await interceptor(processedConfig);
    }

    return processedConfig;
  }

  async applyResponseInterceptors(response, error = null) {
    for (const interceptor of this.responseInterceptors) {
      if (error && interceptor.error) {
        try {
          return await interceptor.error(error);
        } catch (interceptorError) {
          error = interceptorError;
        }
      } else if (response && interceptor.success) {
        response = await interceptor.success(response);
      }
    }

    if (error) {
      throw error;
    }

    return response;
  }

  // === Utilities ===

  shouldNotRetry(error) {
    // Don't retry authentication errors (except token expiration)
    if (error.status === 401 && error.data?.code !== 'TOKEN_EXPIRED') {
      return true;
    }

    // Don't retry validation errors
    if (error.status === 400) {
      return true;
    }

    // Don't retry not found errors
    if (error.status === 404) {
      return true;
    }

    return false;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // === Health Check ===

  async healthCheck() {
    try {
      const response = await this.get('/health');
      return {
        healthy: true,
        ...response,
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }
}

// Crear instancia global
const api = new BitForwardAPI();

// Exportar para uso
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BitForwardAPI, api };
} else {
  window.BitForwardAPI = BitForwardAPI;
  window.api = api;
}
