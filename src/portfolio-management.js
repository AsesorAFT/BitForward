/**
 * BitForward Portfolio Management
 * Sistema avanzado de gestión y análisis de cartera
 * Versión 1.0.0 - Enterprise Ready
 *
 * Este módulo permite una gestión completa del portfolio de contratos forward,
 * préstamos y otros activos, con análisis detallado y visualizaciones avanzadas.
 */

class PortfolioManager {
  constructor(config = {}) {
    // Configuración
    this.config = {
      cacheTime: 60 * 1000, // 60 segundos
      historyLength: 100,
      riskCategories: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'],
      currencies: ['USD', 'EUR', 'GBP', 'JPY', 'BTC', 'ETH'],
      defaultCurrency: 'USD',
      ...config
    };

    // Propiedades
    this.portfolios = new Map(); // userId -> portfolio data
    this.watchlists = new Map(); // userId -> watchlist data
    this.history = new Map(); // userId -> portfolio history
    this.cache = new Map(); // Caché de cálculos complejos
    this.isInitialized = false;

    // Referencias a otros sistemas
    this.eventSystem = null;
    this.riskAnalyzer = null;
    this.priceFeeds = null;

    this.initialize();
  }

  /**
     * Inicializar el sistema de portfolio
     */
  async initialize() {
    try {
      // Inicializar dependencias
      this.initializeDependencies();

      // Cargar datos previos si es posible
      await this.loadSavedData();

      // Configurar listeners de eventos
      this.setupEventListeners();

      this.isInitialized = true;

      console.log('🚀 BitForward Portfolio Management inicializado');

      // Notificar inicialización si hay sistema de eventos
      if (this.eventSystem) {
        this.eventSystem.emit(this.eventSystem.EVENTS.SYSTEM_INITIALIZED, {
          system: 'PortfolioManager',
          version: '1.0.0'
        });
      }
    } catch (error) {
      console.error('Error al inicializar Portfolio Management:', error);
    }
  }

  /**
     * Inicializar dependencias con otros sistemas
     */
  initializeDependencies() {
    // Detectar sistema de eventos
    if (typeof window !== 'undefined' && window.eventSystem) {
      this.eventSystem = window.eventSystem;
    } else if (typeof global !== 'undefined' && global.eventSystem) {
      this.eventSystem = global.eventSystem;
    }

    // Detectar sistema de análisis de riesgo
    if (typeof window !== 'undefined' && window.riskAnalyzer) {
      this.riskAnalyzer = window.riskAnalyzer;
    } else if (typeof global !== 'undefined' && global.riskAnalyzer) {
      this.riskAnalyzer = global.riskAnalyzer;
    }

    // Detectar sistema de precios
    if (typeof window !== 'undefined' && window.bitforwardBlockchain) {
      this.priceFeeds = window.bitforwardBlockchain;
    } else if (typeof global !== 'undefined' && global.bitforwardBlockchain) {
      this.priceFeeds = global.bitforwardBlockchain;
    }
  }

  /**
     * Configurar escuchas de eventos
     */
  setupEventListeners() {
    if (!this.eventSystem) {return;}

    // Escuchar eventos de contratos
    this.eventSystem.on(this.eventSystem.EVENTS.CONTRACT_CREATED, (contract) => {
      this.addContractToPortfolio(contract.creatorId, contract);
    });

    this.eventSystem.on(this.eventSystem.EVENTS.CONTRACT_EXECUTED, (contract) => {
      this.updateContractInPortfolio(contract.creatorId, contract);
    });

    // Escuchar eventos de mercado para actualizar valoraciones
    this.eventSystem.on(this.eventSystem.EVENTS.MARKET_PRICE_UPDATED, (priceData) => {
      this.updatePortfolioValuations(priceData);
    });

    // Escuchar eventos de usuario
    this.eventSystem.on(this.eventSystem.EVENTS.USER_LOGIN, (user) => {
      if (user && user.id) {
        // Cargar portfolio del usuario que inicia sesión
        this.loadUserPortfolio(user.id);
      }
    });
  }

  /**
     * Cargar datos guardados previamente
     */
  async loadSavedData() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedData = JSON.parse(localStorage.getItem('bitforward_portfolios') || '{}');

        if (savedData.portfolios) {
          for (const [userId, portfolio] of Object.entries(savedData.portfolios)) {
            this.portfolios.set(userId, portfolio);
          }
        }

        if (savedData.watchlists) {
          for (const [userId, watchlist] of Object.entries(savedData.watchlists)) {
            this.watchlists.set(userId, watchlist);
          }
        }

        if (savedData.history) {
          for (const [userId, history] of Object.entries(savedData.history)) {
            this.history.set(userId, history);
          }
        }

        console.log('Datos de portfolio cargados desde almacenamiento local');
      } catch (error) {
        console.warn('Error al cargar datos de portfolio:', error);
      }
    }
  }

  /**
     * Guardar datos en almacenamiento persistente
     */
  saveData() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const dataToSave = {
          portfolios: Object.fromEntries(this.portfolios),
          watchlists: Object.fromEntries(this.watchlists),
          history: Object.fromEntries(this.history),
          timestamp: Date.now()
        };

        localStorage.setItem('bitforward_portfolios', JSON.stringify(dataToSave));
      } catch (error) {
        console.warn('Error al guardar datos de portfolio:', error);
      }
    }
  }

  /**
     * Crear un portfolio vacío para un usuario
     * @param {string} userId - ID del usuario
     * @returns {Object} Portfolio inicializado
     */
  createEmptyPortfolio(userId) {
    const portfolio = {
      userId,
      summary: {
        totalValue: 0,
        totalPnL: 0,
        totalFees: 0,
        riskScore: 0,
        riskLevel: 'LOW',
        allocation: {},
        lastUpdated: Date.now()
      },
      contracts: [],
      loans: [],
      assets: [],
      metrics: {
        weeklyChange: 0,
        monthlyChange: 0,
        yearlyChange: 0,
        volatility: 0,
        sharpeRatio: 0
      },
      notifications: []
    };

    this.portfolios.set(userId, portfolio);
    this.history.set(userId, []);

    // Notificar creación de portfolio
    this.emitPortfolioUpdated(userId);

    return portfolio;
  }

  /**
     * Obtener el portfolio de un usuario
     * @param {string} userId - ID del usuario
     * @param {boolean} createIfNotExists - Crear portfolio si no existe
     * @returns {Object|null} Portfolio del usuario o null
     */
  getUserPortfolio(userId, createIfNotExists = true) {
    let portfolio = this.portfolios.get(userId);

    if (!portfolio && createIfNotExists) {
      portfolio = this.createEmptyPortfolio(userId);
    }

    return portfolio;
  }

  /**
     * Cargar el portfolio completo de un usuario
     * @param {string} userId - ID del usuario
     * @returns {Object|null} Portfolio cargado o null
     */
  async loadUserPortfolio(userId) {
    // Crear portfolio si no existe
    const portfolio = this.getUserPortfolio(userId);

    try {
      // Obtener contratos del usuario
      const contracts = await this.fetchUserContracts(userId);

      // Actualizar contratos
      portfolio.contracts = contracts;

      // Recalcular métricas
      await this.recalculatePortfolio(userId);

      // Notificar actualización
      this.emitPortfolioUpdated(userId);

      return portfolio;
    } catch (error) {
      console.error('Error al cargar portfolio del usuario:', error);
      return portfolio;
    }
  }

  /**
     * Obtener contratos de un usuario (de blockchain o sistema local)
     * @param {string} userId - ID del usuario
     * @returns {Promise<Array>} Lista de contratos
     */
  async fetchUserContracts(userId) {
    // Primero intentamos obtener de BitForward Core
    if (typeof window !== 'undefined' && window.bitForward) {
      return window.bitForward.contracts.filter(c =>
        c.creatorId === userId || c.counterpartyId === userId
      );
    }

    // Si no hay contratos, devolver lista vacía
    return [];
  }

  /**
     * Añadir un contrato al portfolio de un usuario
     * @param {string} userId - ID del usuario
     * @param {Object} contract - Datos del contrato
     * @returns {boolean} Si se añadió correctamente
     */
  addContractToPortfolio(userId, contract) {
    const portfolio = this.getUserPortfolio(userId);

    // Verificar si ya existe
    const existingIndex = portfolio.contracts.findIndex(c => c.id === contract.id);

    if (existingIndex >= 0) {
      portfolio.contracts[existingIndex] = contract;
    } else {
      portfolio.contracts.push(contract);
    }

    // Recalcular portfolio
    this.recalculatePortfolio(userId);

    // Registrar en historial
    this.addToHistory(userId, {
      type: 'contract_added',
      contractId: contract.id,
      timestamp: Date.now()
    });

    this.saveData();
    return true;
  }

  /**
     * Actualizar un contrato existente en el portfolio
     * @param {string} userId - ID del usuario
     * @param {Object} contract - Contrato actualizado
     * @returns {boolean} Si se actualizó correctamente
     */
  updateContractInPortfolio(userId, contract) {
    const portfolio = this.getUserPortfolio(userId);

    // Buscar índice del contrato
    const index = portfolio.contracts.findIndex(c => c.id === contract.id);

    if (index >= 0) {
      portfolio.contracts[index] = contract;

      // Recalcular portfolio
      this.recalculatePortfolio(userId);

      // Registrar en historial
      this.addToHistory(userId, {
        type: 'contract_updated',
        contractId: contract.id,
        status: contract.status,
        timestamp: Date.now()
      });

      this.saveData();
      return true;
    }

    return false;
  }

  /**
     * Recalcular todo el portfolio de un usuario
     * @param {string} userId - ID del usuario
     */
  async recalculatePortfolio(userId) {
    const portfolio = this.getUserPortfolio(userId);

    // Cálculos básicos
    portfolio.summary.totalValue = this.calculateTotalValue(portfolio);
    portfolio.summary.totalPnL = this.calculateTotalPnL(portfolio);
    portfolio.summary.totalFees = this.calculateTotalFees(portfolio);
    portfolio.summary.allocation = this.calculateAllocation(portfolio);

    // Cálculos avanzados de riesgo
    if (this.riskAnalyzer) {
      const riskAnalysis = await this.riskAnalyzer.analyzePortfolio(portfolio);
      portfolio.summary.riskScore = riskAnalysis.score;
      portfolio.summary.riskLevel = riskAnalysis.level;
      portfolio.metrics.volatility = riskAnalysis.volatility;
      portfolio.metrics.sharpeRatio = riskAnalysis.sharpeRatio;
    } else {
      // Cálculo simplificado si no hay risk analyzer
      portfolio.summary.riskScore = this.calculateSimpleRiskScore(portfolio);
      portfolio.summary.riskLevel = this.getRiskLevel(portfolio.summary.riskScore);
    }

    // Cálculo de cambios
    portfolio.metrics = {
      ...portfolio.metrics,
      ...this.calculatePerformanceMetrics(userId)
    };

    portfolio.summary.lastUpdated = Date.now();

    // Emitir evento de actualización
    this.emitPortfolioUpdated(userId);

    return portfolio;
  }

  /**
     * Calcular valor total del portfolio
     * @param {Object} portfolio - Portfolio a calcular
     * @returns {number} Valor total
     */
  calculateTotalValue(portfolio) {
    let total = 0;

    // Sumar valor de contratos activos
    for (const contract of portfolio.contracts) {
      if (contract.status === 'active' || contract.status === 'pending_counterparty') {
        total += this.getContractValue(contract);
      }
    }

    // Sumar valor de activos
    for (const asset of portfolio.assets || []) {
      total += asset.amount * (asset.price || 1);
    }

    return total;
  }

  /**
     * Obtener valor de un contrato específico
     * @param {Object} contract - Contrato a evaluar
     * @returns {number} Valor del contrato
     */
  getContractValue(contract) {
    // Valor nominal del contrato
    return contract.amount * contract.strikePrice;
  }

  /**
     * Calcular PnL total del portfolio
     * @param {Object} portfolio - Portfolio a calcular
     * @returns {number} PnL total
     */
  calculateTotalPnL(portfolio) {
    let totalPnL = 0;

    // Sumar PnL de contratos ejecutados
    for (const contract of portfolio.contracts) {
      if (contract.status === 'executed' && contract.pnl !== undefined) {
        totalPnL += contract.pnl;
      }
    }

    return totalPnL;
  }

  /**
     * Calcular total de fees pagados
     * @param {Object} portfolio - Portfolio a calcular
     * @returns {number} Total de fees
     */
  calculateTotalFees(portfolio) {
    let totalFees = 0;

    // Sumar fees de todos los contratos
    for (const contract of portfolio.contracts) {
      if (contract.fees && contract.fees.total) {
        totalFees += contract.fees.total;
      }
    }

    return totalFees;
  }

  /**
     * Calcular distribución de activos en el portfolio
     * @param {Object} portfolio - Portfolio a calcular
     * @returns {Object} Distribución por blockchain, tipo, etc
     */
  calculateAllocation(portfolio) {
    const allocation = {
      byBlockchain: {},
      byStatus: {},
      byType: {}
    };

    const totalValue = this.calculateTotalValue(portfolio);

    if (totalValue === 0) {return allocation;}

    // Calcular por blockchain
    for (const contract of portfolio.contracts) {
      const contractValue = this.getContractValue(contract);

      // Por blockchain
      if (!allocation.byBlockchain[contract.blockchain]) {
        allocation.byBlockchain[contract.blockchain] = 0;
      }
      allocation.byBlockchain[contract.blockchain] += (contractValue / totalValue);

      // Por estado
      if (!allocation.byStatus[contract.status]) {
        allocation.byStatus[contract.status] = 0;
      }
      allocation.byStatus[contract.status] += (contractValue / totalValue);

      // Por tipo
      if (!allocation.byType[contract.contractType]) {
        allocation.byType[contract.contractType] = 0;
      }
      allocation.byType[contract.contractType] += (contractValue / totalValue);
    }

    return allocation;
  }

  /**
     * Calcular un score de riesgo simple
     * @param {Object} portfolio - Portfolio a evaluar
     * @returns {number} Score de riesgo (0-100)
     */
  calculateSimpleRiskScore(portfolio) {
    if (portfolio.contracts.length === 0) {return 0;}

    let riskPoints = 0;
    let totalPoints = 0;

    // Evaluar cada contrato
    for (const contract of portfolio.contracts) {
      if (contract.status !== 'active') {continue;}

      const contractValue = this.getContractValue(contract);
      totalPoints += contractValue;

      // Puntos de riesgo según blockchain
      const blockchainRisk = this.getBlockchainRiskFactor(contract.blockchain);
      riskPoints += contractValue * blockchainRisk;

      // Puntos por tiempo hasta expiración
      const timeToExpiryRisk = this.getTimeToExpiryRiskFactor(contract);
      riskPoints += contractValue * timeToExpiryRisk;

      // Si hay métricas de riesgo en el contrato, usarlas
      if (contract.riskMetrics) {
        const contractRisk = this.parseRiskLevel(contract.riskMetrics.exposureLevel);
        riskPoints += contractValue * contractRisk;
      }
    }

    if (totalPoints === 0) {return 0;}

    // Normalizar a escala 0-100
    return Math.min(100, Math.max(0, (riskPoints / totalPoints) * 100));
  }

  /**
     * Obtener factor de riesgo por blockchain
     * @param {string} blockchain - Nombre de la blockchain
     * @returns {number} Factor de riesgo (0-1)
     */
  getBlockchainRiskFactor(blockchain) {
    const riskFactors = {
      'bitcoin': 0.3,
      'ethereum': 0.4,
      'solana': 0.6,
      'default': 0.5
    };

    return riskFactors[blockchain] || riskFactors.default;
  }

  /**
     * Calcular factor de riesgo por tiempo hasta expiración
     * @param {Object} contract - Contrato a evaluar
     * @returns {number} Factor de riesgo (0-1)
     */
  getTimeToExpiryRiskFactor(contract) {
    const now = Date.now();
    const expiry = new Date(contract.executionDate).getTime();
    const daysToExpiry = Math.max(0, (expiry - now) / (1000 * 60 * 60 * 24));

    // Contratos más cercanos a expirar son más riesgosos
    if (daysToExpiry < 1) {return 0.9;}
    if (daysToExpiry < 7) {return 0.7;}
    if (daysToExpiry < 30) {return 0.5;}
    if (daysToExpiry < 90) {return 0.3;}
    return 0.2;
  }

  /**
     * Convertir nivel de riesgo textual a numérico
     * @param {string} riskLevel - Nivel de riesgo textual
     * @returns {number} Valor numérico (0-1)
     */
  parseRiskLevel(riskLevel) {
    const levels = {
      'LOW': 0.2,
      'MEDIUM': 0.5,
      'HIGH': 0.7,
      'VERY_HIGH': 0.9,
      'DEFAULT': 0.5
    };

    return levels[riskLevel] || levels.DEFAULT;
  }

  /**
     * Obtener nivel de riesgo textual desde un score
     * @param {number} score - Score de riesgo (0-100)
     * @returns {string} Nivel de riesgo
     */
  getRiskLevel(score) {
    if (score < 20) {return 'LOW';}
    if (score < 50) {return 'MEDIUM';}
    if (score < 75) {return 'HIGH';}
    return 'VERY_HIGH';
  }

  /**
     * Calcular métricas de rendimiento (cambios semanales, mensuales, etc)
     * @param {string} userId - ID del usuario
     * @returns {Object} Métricas de rendimiento
     */
  calculatePerformanceMetrics(userId) {
    const portfolio = this.getUserPortfolio(userId);
    const history = this.history.get(userId) || [];

    // Si no hay suficiente historial, retornar valores por defecto
    if (history.length < 2) {
      return {
        weeklyChange: 0,
        monthlyChange: 0,
        yearlyChange: 0
      };
    }

    // Ordenar historial cronológicamente
    const sortedHistory = history
      .filter(item => item.type === 'portfolio_snapshot')
      .sort((a, b) => a.timestamp - b.timestamp);

    if (sortedHistory.length < 2) {
      return {
        weeklyChange: 0,
        monthlyChange: 0,
        yearlyChange: 0
      };
    }

    const currentValue = portfolio.summary.totalValue;
    const now = Date.now();

    // Buscar snapshots relevantes
    const weekSnapshot = this.findNearestSnapshot(sortedHistory, now - 7 * 24 * 60 * 60 * 1000);
    const monthSnapshot = this.findNearestSnapshot(sortedHistory, now - 30 * 24 * 60 * 60 * 1000);
    const yearSnapshot = this.findNearestSnapshot(sortedHistory, now - 365 * 24 * 60 * 60 * 1000);

    // Calcular cambios
    const weeklyChange = weekSnapshot ? this.calculateChange(weekSnapshot.totalValue, currentValue) : 0;
    const monthlyChange = monthSnapshot ? this.calculateChange(monthSnapshot.totalValue, currentValue) : 0;
    const yearlyChange = yearSnapshot ? this.calculateChange(yearSnapshot.totalValue, currentValue) : 0;

    return {
      weeklyChange,
      monthlyChange,
      yearlyChange
    };
  }

  /**
     * Buscar el snapshot más cercano a una fecha
     * @param {Array} history - Historial ordenado
     * @param {number} timestamp - Timestamp objetivo
     * @returns {Object|null} Snapshot más cercano
     */
  findNearestSnapshot(history, timestamp) {
    // Buscar el snapshot más cercano pero no más reciente que timestamp
    let nearest = null;
    let minDiff = Infinity;

    for (const snapshot of history) {
      if (snapshot.timestamp <= timestamp) {
        const diff = timestamp - snapshot.timestamp;
        if (diff < minDiff) {
          minDiff = diff;
          nearest = snapshot;
        }
      }
    }

    return nearest;
  }

  /**
     * Calcular cambio porcentual entre dos valores
     * @param {number} oldValue - Valor anterior
     * @param {number} newValue - Valor actual
     * @returns {number} Cambio porcentual
     */
  calculateChange(oldValue, newValue) {
    if (!oldValue) {return 0;}
    return ((newValue - oldValue) / oldValue) * 100;
  }

  /**
     * Añadir entrada al historial de un usuario
     * @param {string} userId - ID del usuario
     * @param {Object} entry - Entrada de historial
     */
  addToHistory(userId, entry) {
    if (!this.history.has(userId)) {
      this.history.set(userId, []);
    }

    const userHistory = this.history.get(userId);
    userHistory.unshift(entry);

    // Limitar tamaño del historial
    if (userHistory.length > this.config.historyLength) {
      userHistory.pop();
    }
  }

  /**
     * Crear un snapshot del portfolio para el historial
     * @param {string} userId - ID del usuario
     */
  createPortfolioSnapshot(userId) {
    const portfolio = this.getUserPortfolio(userId);

    const snapshot = {
      type: 'portfolio_snapshot',
      timestamp: Date.now(),
      totalValue: portfolio.summary.totalValue,
      totalPnL: portfolio.summary.totalPnL,
      riskLevel: portfolio.summary.riskLevel,
      contractCount: portfolio.contracts.length,
      activeContractCount: portfolio.contracts.filter(c => c.status === 'active').length
    };

    this.addToHistory(userId, snapshot);
    this.saveData();
  }

  /**
     * Obtener historial de un usuario
     * @param {string} userId - ID del usuario
     * @param {Object} options - Opciones de filtrado
     * @returns {Array} Historial filtrado
     */
  getUserHistory(userId, options = {}) {
    const history = this.history.get(userId) || [];

    if (options.type) {
      return history.filter(entry => entry.type === options.type);
    }

    return history;
  }

  /**
     * Actualizar valoraciones de portfolio por cambios de precios
     * @param {Object} priceData - Datos de precios actualizados
     */
  updatePortfolioValuations(priceData) {
    // Iterar todos los portfolios
    for (const [userId, portfolio] of this.portfolios.entries()) {
      let updated = false;

      // Actualizar contratos afectados
      for (const contract of portfolio.contracts) {
        if (contract.blockchain === priceData.asset) {
          // Recalcular valor o PnL según precio actualizado
          updated = true;
        }
      }

      if (updated) {
        this.recalculatePortfolio(userId);
      }
    }
  }

  /**
     * Emitir evento de portfolio actualizado
     * @param {string} userId - ID del usuario
     */
  emitPortfolioUpdated(userId) {
    if (!this.eventSystem) {return;}

    const portfolio = this.getUserPortfolio(userId, false);
    if (!portfolio) {return;}

    this.eventSystem.emit(this.eventSystem.EVENTS.PORTFOLIO_UPDATED, {
      userId,
      portfolio: { ...portfolio.summary }
    });
  }

  /**
     * Generar informe detallado del portfolio
     * @param {string} userId - ID del usuario
     * @returns {Object} Informe detallado
     */
  generateDetailedReport(userId) {
    const portfolio = this.getUserPortfolio(userId, false);
    if (!portfolio) {return null;}

    // Cache key para informes
    const cacheKey = `report_${userId}_${portfolio.summary.lastUpdated}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.config.cacheTime) {
      return cached.data;
    }

    // Generar informe nuevo
    const report = {
      summary: { ...portfolio.summary },
      metrics: { ...portfolio.metrics },
      contractAnalysis: this.analyzeContracts(portfolio.contracts),
      riskAnalysis: this.analyzeRisk(userId),
      projections: this.generateProjections(userId),
      recommendations: this.generateRecommendations(userId),
      generatedAt: Date.now()
    };

    // Guardar en caché
    this.cache.set(cacheKey, {
      data: report,
      timestamp: Date.now()
    });

    return report;
  }

  /**
     * Analizar contratos del portfolio
     * @param {Array} contracts - Lista de contratos
     * @returns {Object} Análisis de contratos
     */
  analyzeContracts(contracts) {
    const analysis = {
      total: contracts.length,
      active: 0,
      executed: 0,
      pending: 0,
      cancelled: 0,
      expired: 0,
      byBlockchain: {},
      byStatus: {},
      byMonth: {},
      averageSize: 0,
      largestContract: null,
      mostProfitable: null,
      leastProfitable: null
    };

    if (contracts.length === 0) {return analysis;}

    let totalValue = 0;
    let largestValue = 0;
    let mostProfit = -Infinity;
    let leastProfit = Infinity;

    for (const contract of contracts) {
      // Contar por estado
      switch (contract.status) {
        case 'active':
          analysis.active++;
          break;
        case 'executed':
          analysis.executed++;
          break;
        case 'cancelled':
          analysis.cancelled++;
          break;
        case 'expired':
          analysis.expired++;
          break;
        default:
          if (contract.status.includes('pending')) {
            analysis.pending++;
          }
      }

      // Contar por blockchain
      if (!analysis.byBlockchain[contract.blockchain]) {
        analysis.byBlockchain[contract.blockchain] = 0;
      }
      analysis.byBlockchain[contract.blockchain]++;

      // Por estado
      if (!analysis.byStatus[contract.status]) {
        analysis.byStatus[contract.status] = 0;
      }
      analysis.byStatus[contract.status]++;

      // Por mes
      const month = new Date(contract.createdAt).toISOString().substring(0, 7); // YYYY-MM
      if (!analysis.byMonth[month]) {
        analysis.byMonth[month] = 0;
      }
      analysis.byMonth[month]++;

      // Valor total
      const value = this.getContractValue(contract);
      totalValue += value;

      // Contrato más grande
      if (value > largestValue) {
        largestValue = value;
        analysis.largestContract = {
          id: contract.id,
          value,
          blockchain: contract.blockchain
        };
      }

      // Contratos más/menos rentables
      if (contract.pnl !== undefined) {
        if (contract.pnl > mostProfit) {
          mostProfit = contract.pnl;
          analysis.mostProfitable = {
            id: contract.id,
            pnl: contract.pnl,
            blockchain: contract.blockchain
          };
        }

        if (contract.pnl < leastProfit) {
          leastProfit = contract.pnl;
          analysis.leastProfitable = {
            id: contract.id,
            pnl: contract.pnl,
            blockchain: contract.blockchain
          };
        }
      }
    }

    // Tamaño promedio
    analysis.averageSize = totalValue / contracts.length;

    return analysis;
  }

  /**
     * Analizar riesgo del portfolio
     * @param {string} userId - ID del usuario
     * @returns {Object} Análisis de riesgo
     */
  analyzeRisk(userId) {
    const portfolio = this.getUserPortfolio(userId, false);
    if (!portfolio) {return null;}

    // Si hay analizador de riesgo externo, usarlo
    if (this.riskAnalyzer) {
      return this.riskAnalyzer.generateRiskReport(portfolio);
    }

    // Análisis simplificado
    const activeContracts = portfolio.contracts.filter(c => c.status === 'active');

    if (activeContracts.length === 0) {
      return {
        level: 'LOW',
        score: 0,
        factors: [],
        recommendations: ['No hay contratos activos para analizar']
      };
    }

    // Factores de riesgo
    const factors = [];

    // Concentración por blockchain
    const blockchainCounts = {};
    for (const contract of activeContracts) {
      if (!blockchainCounts[contract.blockchain]) {
        blockchainCounts[contract.blockchain] = 0;
      }
      blockchainCounts[contract.blockchain]++;
    }

    const dominantBlockchain = Object.entries(blockchainCounts)
      .sort((a, b) => b[1] - a[1])[0];

    if (dominantBlockchain && dominantBlockchain[1] / activeContracts.length > 0.7) {
      factors.push({
        type: 'concentration',
        severity: 'high',
        description: `Alta concentración (${Math.round(dominantBlockchain[1] / activeContracts.length * 100)}%) en blockchain ${dominantBlockchain[0]}`
      });
    }

    // Contratos cercanos a expiración
    const now = Date.now();
    const soonExpiringContracts = activeContracts.filter(c => {
      const expiry = new Date(c.executionDate).getTime();
      return (expiry - now) < (7 * 24 * 60 * 60 * 1000); // 7 días
    });

    if (soonExpiringContracts.length > 0) {
      factors.push({
        type: 'expiration',
        severity: 'medium',
        description: `${soonExpiringContracts.length} contratos expiran en menos de 7 días`
      });
    }

    // Recomendaciones
    const recommendations = [];

    if (factors.find(f => f.type === 'concentration')) {
      recommendations.push('Diversificar contratos entre diferentes blockchains');
    }

    if (factors.find(f => f.type === 'expiration')) {
      recommendations.push('Revisar contratos a punto de expirar y preparar estrategia');
    }

    return {
      level: portfolio.summary.riskLevel,
      score: portfolio.summary.riskScore,
      factors,
      recommendations
    };
  }

  /**
     * Generar proyecciones de rendimiento
     * @param {string} userId - ID del usuario
     * @returns {Object} Proyecciones
     */
  generateProjections(userId) {
    const portfolio = this.getUserPortfolio(userId, false);
    if (!portfolio || portfolio.contracts.length === 0) {return null;}

    // Simulaciones simples
    const currentValue = portfolio.summary.totalValue;

    return {
      oneMonth: {
        conservative: currentValue * 1.01,
        moderate: currentValue * 1.03,
        optimistic: currentValue * 1.05
      },
      threeMonths: {
        conservative: currentValue * 1.02,
        moderate: currentValue * 1.07,
        optimistic: currentValue * 1.12
      },
      sixMonths: {
        conservative: currentValue * 1.03,
        moderate: currentValue * 1.12,
        optimistic: currentValue * 1.2
      }
    };
  }

  /**
     * Generar recomendaciones para el portfolio
     * @param {string} userId - ID del usuario
     * @returns {Array} Lista de recomendaciones
     */
  generateRecommendations(userId) {
    const portfolio = this.getUserPortfolio(userId, false);
    if (!portfolio) {return [];}

    const recommendations = [];

    // Recomendaciones basadas en diversificación
    const allocation = portfolio.summary.allocation;
    if (allocation.byBlockchain) {
      const chains = Object.keys(allocation.byBlockchain);

      if (chains.length === 1) {
        recommendations.push({
          type: 'diversification',
          priority: 'high',
          message: `Considere diversificar en otras blockchains además de ${chains[0]}`
        });
      }
    }

    // Recomendaciones basadas en riesgo
    if (portfolio.summary.riskLevel === 'HIGH' || portfolio.summary.riskLevel === 'VERY_HIGH') {
      recommendations.push({
        type: 'risk',
        priority: 'high',
        message: 'Su portfolio tiene un nivel de riesgo alto. Considere reequilibrar con contratos de menor riesgo.'
      });
    }

    // Recomendaciones basadas en rendimiento
    if (portfolio.metrics.monthlyChange < 0) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'Su portfolio ha tenido rendimiento negativo en el último mes. Revise su estrategia.'
      });
    }

    return recommendations;
  }

  /**
     * Crear y gestionar una lista de vigilancia
     * @param {string} userId - ID del usuario
     * @param {Array} items - Elementos a vigilar
     * @returns {Object} Watchlist creada
     */
  createWatchlist(userId, items = []) {
    const watchlist = {
      userId,
      items: items || [],
      created: Date.now(),
      lastUpdated: Date.now()
    };

    this.watchlists.set(userId, watchlist);
    this.saveData();

    return watchlist;
  }

  /**
     * Añadir elemento a watchlist
     * @param {string} userId - ID del usuario
     * @param {Object} item - Elemento a añadir
     * @returns {boolean} Si se añadió correctamente
     */
  addToWatchlist(userId, item) {
    if (!this.watchlists.has(userId)) {
      this.createWatchlist(userId);
    }

    const watchlist = this.watchlists.get(userId);

    // Verificar si ya existe
    const exists = watchlist.items.some(i =>
      i.type === item.type && i.id === item.id
    );

    if (!exists) {
      watchlist.items.push({
        ...item,
        addedAt: Date.now()
      });

      watchlist.lastUpdated = Date.now();
      this.saveData();
      return true;
    }

    return false;
  }

  /**
     * Obtener la watchlist de un usuario
     * @param {string} userId - ID del usuario
     * @returns {Object|null} Watchlist o null
     */
  getWatchlist(userId) {
    return this.watchlists.get(userId) || null;
  }

  /**
     * Limpiar portfolio de un usuario
     * @param {string} userId - ID del usuario
     */
  clearPortfolio(userId) {
    this.portfolios.delete(userId);
    this.saveData();
  }
}

// Crear instancia singleton
const portfolioManager = new PortfolioManager();

// Exportar para diferentes entornos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PortfolioManager,
    portfolioManager
  };
} else if (typeof window !== 'undefined') {
  window.BitForwardPortfolioManager = PortfolioManager;
  window.portfolioManager = portfolioManager;
}

console.log('🚀 BitForward Portfolio Management 1.0.0 inicializado');
