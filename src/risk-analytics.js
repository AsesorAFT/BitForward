/**
 * BitForward Risk Analytics
 * Sistema avanzado de análisis de riesgos para DeFi
 * Versión 1.0.0 - Enterprise Ready
 * 
 * Este módulo proporciona análisis de riesgo avanzado para contratos forward,
 * préstamos y portfolios completos, con alertas predictivas y recomendaciones.
 */

class RiskAnalyzer {
    constructor(config = {}) {
        // Configuración predeterminada
        this.config = {
            updateInterval: 60 * 60 * 1000, // 1 hora
            riskLevels: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'],
            volatilityThresholds: {
                LOW: 0.01,       // 1%
                MEDIUM: 0.03,    // 3% 
                HIGH: 0.05,      // 5%
                VERY_HIGH: 0.1   // 10%
            },
            maxAlerts: 50,
            historicalDataPoints: 30,
            correlationWindow: 90, // días para correlaciones
            ...config
        };

        // Estado interno
        this.alerts = [];
        this.riskModels = new Map();
        this.volatilityCache = new Map();
        this.correlationMatrix = new Map();
        this.lastUpdated = null;
        this.isInitialized = false;

        // Referencias a otros sistemas
        this.eventSystem = null;
        this.priceFeeds = null;
        
        this.initialize();
    }
    
    /**
     * Inicializar el analizador de riesgos
     */
    async initialize() {
        try {
            // Inicializar dependencias
            this.initializeDependencies();
            
            // Cargar modelos de riesgo
            await this.loadRiskModels();
            
            // Configurar actualizaciones periódicas
            this.setupUpdateInterval();
            
            // Configurar escucha de eventos
            this.setupEventListeners();
            
            this.isInitialized = true;
            
            console.log('🚀 BitForward Risk Analytics inicializado');
            
            // Notificar inicialización si hay sistema de eventos
            if (this.eventSystem) {
                this.eventSystem.emit(this.eventSystem.EVENTS.SYSTEM_INITIALIZED, {
                    system: 'RiskAnalyzer',
                    version: '1.0.0'
                });
            }
            
        } catch (error) {
            console.error('Error al inicializar Risk Analytics:', error);
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
        
        // Detectar sistema de precios
        if (typeof window !== 'undefined' && window.bitforwardBlockchain) {
            this.priceFeeds = window.bitforwardBlockchain;
        } else if (typeof global !== 'undefined' && global.bitforwardBlockchain) {
            this.priceFeeds = global.bitforwardBlockchain;
        }
    }
    
    /**
     * Cargar modelos de riesgo
     */
    async loadRiskModels() {
        // Modelos básicos de riesgo por blockchain
        this.riskModels.set('blockchain', {
            'bitcoin': {
                volatilityFactor: 0.8,
                liquidityFactor: 0.9,
                securityFactor: 0.95,
                regulatoryFactor: 0.7,
                baseRisk: 0.2
            },
            'ethereum': {
                volatilityFactor: 1.0,
                liquidityFactor: 0.85,
                securityFactor: 0.8,
                regulatoryFactor: 0.6,
                baseRisk: 0.3
            },
            'solana': {
                volatilityFactor: 1.3,
                liquidityFactor: 0.7,
                securityFactor: 0.7,
                regulatoryFactor: 0.5,
                baseRisk: 0.4
            }
        });
        
        // Modelos para tipos de contratos
        this.riskModels.set('contractType', {
            'standard': {
                baseRisk: 0.3,
                leverageFactor: 1.0
            },
            'leveraged': {
                baseRisk: 0.5,
                leverageFactor: 1.5
            },
            'collateralized': {
                baseRisk: 0.25,
                leverageFactor: 0.8
            }
        });
        
        // Modelos para duración de contratos
        this.riskModels.set('duration', {
            'short': { // < 7 días
                timeFactor: 0.7,
                volatilityMultiplier: 0.8
            },
            'medium': { // 7-30 días
                timeFactor: 1.0,
                volatilityMultiplier: 1.0
            },
            'long': { // > 30 días
                timeFactor: 1.3,
                volatilityMultiplier: 1.2
            }
        });
    }
    
    /**
     * Configurar intervalo de actualización
     */
    setupUpdateInterval() {
        // Actualizar datos periódicamente
        if (typeof window !== 'undefined') {
            setInterval(() => {
                this.updateRiskData();
            }, this.config.updateInterval);
        }
    }
    
    /**
     * Configurar escuchas de eventos
     */
    setupEventListeners() {
        if (!this.eventSystem) return;
        
        // Escuchar eventos de contratos
        this.eventSystem.on(this.eventSystem.EVENTS.CONTRACT_CREATED, (contract) => {
            this.analyzeContractRisk(contract);
        });
        
        // Escuchar eventos de mercado
        this.eventSystem.on(this.eventSystem.EVENTS.MARKET_PRICE_UPDATED, (priceData) => {
            this.updateMarketData(priceData);
        });
        
        // Escuchar eventos de portfolio
        this.eventSystem.on(this.eventSystem.EVENTS.PORTFOLIO_UPDATED, (data) => {
            this.checkPortfolioRisk(data.userId, data.portfolio);
        });
    }
    
    /**
     * Actualizar datos de riesgo
     */
    async updateRiskData() {
        try {
            // Actualizar volatilidades
            await this.updateVolatilityData();
            
            // Actualizar matriz de correlación
            await this.updateCorrelationMatrix();
            
            this.lastUpdated = Date.now();
            
            console.log('Risk Analytics: Datos de riesgo actualizados');
        } catch (error) {
            console.error('Error actualizando datos de riesgo:', error);
        }
    }
    
    /**
     * Actualizar datos de volatilidad
     */
    async updateVolatilityData() {
        if (!this.priceFeeds) return;
        
        try {
            // Obtener datos de precio para principales blockchains
            const blockchains = ['bitcoin', 'ethereum', 'solana'];
            
            for (const blockchain of blockchains) {
                const volatility = await this.calculateVolatility(blockchain);
                
                this.volatilityCache.set(blockchain, {
                    value: volatility,
                    timestamp: Date.now(),
                    level: this.getVolatilityLevel(volatility)
                });
                
                // Si la volatilidad es alta, generar alerta
                if (volatility > this.config.volatilityThresholds.HIGH) {
                    this.createAlert({
                        type: 'volatility',
                        severity: volatility > this.config.volatilityThresholds.VERY_HIGH ? 'critical' : 'high',
                        blockchain,
                        message: `Alta volatilidad detectada en ${blockchain}: ${(volatility * 100).toFixed(2)}%`,
                        value: volatility,
                        timestamp: Date.now()
                    });
                }
            }
        } catch (error) {
            console.error('Error actualizando datos de volatilidad:', error);
        }
    }
    
    /**
     * Calcular volatilidad para un activo
     * @param {string} asset - Blockchain o activo
     * @returns {number} Volatilidad (0-1)
     */
    async calculateVolatility(asset) {
        // En un sistema real obtendríamos datos históricos
        // y calcularíamos la desviación estándar
        
        if (!this.priceFeeds) {
            return this.getDefaultVolatility(asset);
        }
        
        try {
            // Simulación de cálculo de volatilidad
            const volatilities = {
                'bitcoin': 0.025 + (Math.random() * 0.02),
                'ethereum': 0.035 + (Math.random() * 0.03),
                'solana': 0.05 + (Math.random() * 0.04)
            };
            
            return volatilities[asset] || 0.03;
        } catch (error) {
            console.warn(`Error calculando volatilidad para ${asset}:`, error);
            return this.getDefaultVolatility(asset);
        }
    }
    
    /**
     * Obtener volatilidad predeterminada
     * @param {string} asset - Activo
     * @returns {number} Volatilidad predeterminada
     */
    getDefaultVolatility(asset) {
        const defaults = {
            'bitcoin': 0.03,
            'ethereum': 0.045,
            'solana': 0.06,
            'default': 0.04
        };
        
        return defaults[asset] || defaults.default;
    }
    
    /**
     * Obtener nivel de volatilidad
     * @param {number} volatility - Valor de volatilidad
     * @returns {string} Nivel de volatilidad
     */
    getVolatilityLevel(volatility) {
        if (volatility < this.config.volatilityThresholds.LOW) return 'LOW';
        if (volatility < this.config.volatilityThresholds.MEDIUM) return 'MEDIUM';
        if (volatility < this.config.volatilityThresholds.HIGH) return 'HIGH';
        return 'VERY_HIGH';
    }
    
    /**
     * Actualizar matriz de correlación
     */
    async updateCorrelationMatrix() {
        const assets = ['bitcoin', 'ethereum', 'solana'];
        
        // Matriz de correlación simulada entre activos
        const correlations = {
            'bitcoin_ethereum': 0.7 + (Math.random() * 0.1 - 0.05),
            'bitcoin_solana': 0.5 + (Math.random() * 0.1 - 0.05),
            'ethereum_solana': 0.8 + (Math.random() * 0.1 - 0.05)
        };
        
        // En un sistema real, calcularíamos la correlación
        // con datos históricos de precios
        
        for (let i = 0; i < assets.length; i++) {
            for (let j = i + 1; j < assets.length; j++) {
                const pairKey = `${assets[i]}_${assets[j]}`;
                const correlation = correlations[pairKey] || 0.5;
                
                this.correlationMatrix.set(pairKey, {
                    value: correlation,
                    timestamp: Date.now()
                });
            }
        }
    }
    
    /**
     * Obtener correlación entre dos activos
     * @param {string} asset1 - Primer activo
     * @param {string} asset2 - Segundo activo
     * @returns {number} Correlación (-1 a 1)
     */
    getCorrelation(asset1, asset2) {
        if (asset1 === asset2) return 1.0;
        
        const key1 = `${asset1}_${asset2}`;
        const key2 = `${asset2}_${asset1}`;
        
        const correlation = this.correlationMatrix.get(key1) || this.correlationMatrix.get(key2);
        
        return correlation ? correlation.value : 0.5;
    }
    
    /**
     * Analizar riesgo de un contrato
     * @param {Object} contract - Contrato a analizar
     * @returns {Object} Análisis de riesgo
     */
    analyzeContractRisk(contract) {
        try {
            // Extraer parámetros del contrato
            const { blockchain, amount, strikePrice, executionDate, contractType = 'standard' } = contract;
            
            // Obtener modelos de riesgo
            const blockchainModel = this.riskModels.get('blockchain')[blockchain] || this.riskModels.get('blockchain').ethereum;
            const contractModel = this.riskModels.get('contractType')[contractType] || this.riskModels.get('contractType').standard;
            
            // Determinar duración
            const durationCategory = this.getDurationCategory(executionDate);
            const durationModel = this.riskModels.get('duration')[durationCategory];
            
            // Obtener volatilidad actual
            const volatilityData = this.volatilityCache.get(blockchain) || { 
                value: this.getDefaultVolatility(blockchain),
                level: 'MEDIUM'
            };
            
            // Calcular factores de riesgo
            let riskScore = blockchainModel.baseRisk;
            
            // Factor por volatilidad
            riskScore += volatilityData.value * blockchainModel.volatilityFactor * durationModel.volatilityMultiplier;
            
            // Factor por duración
            riskScore += durationModel.timeFactor * 0.1;
            
            // Factor por tipo de contrato
            riskScore *= contractModel.leverageFactor;
            
            // Factor por tamaño (contratos más grandes son más riesgosos)
            const sizeRiskFactor = amount > 10 ? 1.3 : amount > 1 ? 1.1 : 1.0;
            riskScore *= sizeRiskFactor;
            
            // Normalizar a escala 0-100
            const normalizedScore = Math.min(100, Math.max(0, riskScore * 100));
            
            // Determinar nivel de riesgo
            const riskLevel = this.getRiskLevel(normalizedScore);
            
            // Construir resultado
            const riskAnalysis = {
                score: normalizedScore,
                level: riskLevel,
                factors: {
                    blockchainRisk: blockchainModel.baseRisk * 100,
                    volatilityRisk: volatilityData.value * 100,
                    durationRisk: durationModel.timeFactor * 10,
                    sizeRisk: (sizeRiskFactor - 1) * 100,
                    contractTypeRisk: (contractModel.leverageFactor - 1) * 100
                },
                volatility: volatilityData.value,
                timeToExpiry: this.getTimeToExpiry(executionDate),
                warnings: []
            };
            
            // Generar advertencias
            if (volatilityData.level === 'HIGH' || volatilityData.level === 'VERY_HIGH') {
                riskAnalysis.warnings.push({
                    type: 'volatility',
                    severity: volatilityData.level === 'VERY_HIGH' ? 'high' : 'medium',
                    message: `Alta volatilidad en ${blockchain}: ${(volatilityData.value * 100).toFixed(2)}%`
                });
            }
            
            if (durationCategory === 'long' && volatilityData.level !== 'LOW') {
                riskAnalysis.warnings.push({
                    type: 'duration',
                    severity: 'medium',
                    message: 'Contrato de larga duración en un mercado volátil'
                });
            }
            
            if (sizeRiskFactor > 1.1) {
                riskAnalysis.warnings.push({
                    type: 'size',
                    severity: sizeRiskFactor > 1.2 ? 'high' : 'medium',
                    message: 'Contrato de gran tamaño incrementa exposición al riesgo'
                });
            }
            
            // Si el riesgo es alto, crear alerta
            if (riskLevel === 'HIGH' || riskLevel === 'VERY_HIGH') {
                this.createAlert({
                    type: 'contract',
                    severity: riskLevel === 'VERY_HIGH' ? 'critical' : 'high',
                    contractId: contract.id,
                    blockchain,
                    message: `Contrato de alto riesgo (${riskLevel}) creado en ${blockchain}`,
                    score: normalizedScore,
                    timestamp: Date.now()
                });
            }
            
            return riskAnalysis;
            
        } catch (error) {
            console.error('Error analizando riesgo del contrato:', error);
            return {
                score: 50,
                level: 'MEDIUM',
                error: 'Error al analizar riesgo'
            };
        }
    }
    
    /**
     * Obtener categoría de duración de un contrato
     * @param {string|number} executionDate - Fecha de ejecución
     * @returns {string} Categoría de duración
     */
    getDurationCategory(executionDate) {
        const now = Date.now();
        const execDate = new Date(executionDate).getTime();
        const daysToExpiry = Math.ceil((execDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysToExpiry < 7) return 'short';
        if (daysToExpiry < 30) return 'medium';
        return 'long';
    }
    
    /**
     * Obtener tiempo hasta expiración
     * @param {string|number} executionDate - Fecha de ejecución
     * @returns {number} Días hasta expiración
     */
    getTimeToExpiry(executionDate) {
        const now = Date.now();
        const execDate = new Date(executionDate).getTime();
        return Math.ceil((execDate - now) / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Obtener nivel de riesgo desde score
     * @param {number} score - Score de riesgo (0-100)
     * @returns {string} Nivel de riesgo
     */
    getRiskLevel(score) {
        if (score < 25) return 'LOW';
        if (score < 50) return 'MEDIUM';
        if (score < 75) return 'HIGH';
        return 'VERY_HIGH';
    }
    
    /**
     * Analizar portfolio completo
     * @param {Object} portfolio - Portfolio a analizar
     * @returns {Object} Análisis de riesgo del portfolio
     */
    async analyzePortfolio(portfolio) {
        try {
            if (!portfolio || !portfolio.contracts || portfolio.contracts.length === 0) {
                return {
                    score: 0,
                    level: 'LOW',
                    volatility: 0,
                    sharpeRatio: 0,
                    riskFactors: [],
                    diversification: 100
                };
            }
            
            // Analizar riesgo individual de cada contrato activo
            const activeContracts = portfolio.contracts.filter(c => c.status === 'active');
            
            if (activeContracts.length === 0) {
                return {
                    score: 0,
                    level: 'LOW',
                    volatility: 0,
                    sharpeRatio: 0,
                    riskFactors: [],
                    diversification: 100
                };
            }
            
            const contractsRisk = await Promise.all(
                activeContracts.map(contract => this.analyzeContractRisk(contract))
            );
            
            // Calcular riesgo ponderado por valor de contrato
            let totalValue = 0;
            let weightedRiskScore = 0;
            let totalVolatility = 0;
            
            for (let i = 0; i < activeContracts.length; i++) {
                const contract = activeContracts[i];
                const risk = contractsRisk[i];
                
                const contractValue = contract.amount * contract.strikePrice;
                totalValue += contractValue;
                
                weightedRiskScore += risk.score * contractValue;
                totalVolatility += risk.volatility * contractValue;
            }
            
            // Normalizar por valor total
            const avgRiskScore = totalValue > 0 ? weightedRiskScore / totalValue : 0;
            const avgVolatility = totalValue > 0 ? totalVolatility / totalValue : 0;
            
            // Calcular nivel de diversificación
            const diversification = this.calculateDiversification(activeContracts);
            
            // Ajustar riesgo por diversificación (menos diversificado = más riesgoso)
            const diversificationFactor = diversification / 100;
            const adjustedRiskScore = avgRiskScore * (1 + (1 - diversificationFactor) * 0.5);
            
            // Calcular ratio de Sharpe simulado
            // (retorno esperado - tasa libre de riesgo) / volatilidad
            const expectedReturn = 0.1; // 10% anual (simulado)
            const riskFreeRate = 0.02; // 2% anual
            const sharpeRatio = avgVolatility > 0 ? (expectedReturn - riskFreeRate) / avgVolatility : 0;
            
            // Identificar factores de riesgo
            const riskFactors = this.identifyPortfolioRiskFactors(activeContracts, diversification);
            
            // Determinar nivel de riesgo
            const riskLevel = this.getRiskLevel(adjustedRiskScore);
            
            // Resultado
            return {
                score: adjustedRiskScore,
                level: riskLevel,
                volatility: avgVolatility,
                sharpeRatio,
                diversification,
                riskFactors
            };
        } catch (error) {
            console.error('Error analizando portfolio:', error);
            return {
                score: 50,
                level: 'MEDIUM',
                volatility: 0.04,
                sharpeRatio: 1,
                diversification: 50,
                riskFactors: [{
                    type: 'error',
                    severity: 'medium',
                    message: 'Error al analizar el portfolio completo'
                }]
            };
        }
    }
    
    /**
     * Calcular nivel de diversificación del portfolio
     * @param {Array} contracts - Lista de contratos
     * @returns {number} Score de diversificación (0-100)
     */
    calculateDiversification(contracts) {
        if (!contracts || contracts.length === 0) return 100;
        if (contracts.length === 1) return 0;
        
        // Contar por blockchain
        const blockchainCounts = {};
        let totalContracts = contracts.length;
        
        for (const contract of contracts) {
            blockchainCounts[contract.blockchain] = (blockchainCounts[contract.blockchain] || 0) + 1;
        }
        
        // Calcular índice de diversificación (Herfindahl-Hirschman Index inverso)
        let sumSquared = 0;
        for (const blockchain in blockchainCounts) {
            const percentage = blockchainCounts[blockchain] / totalContracts;
            sumSquared += percentage * percentage;
        }
        
        // Normalizar a 0-100
        // 1/sumSquared da un valor entre 1 y N (número de blockchains)
        // Normalizamos para que 1 = 0% diversificación y N = 100% diversificación
        const n = Object.keys(blockchainCounts).length;
        const normalizedDiversity = ((1/sumSquared) - 1) / (n - 1);
        
        return Math.min(100, Math.max(0, normalizedDiversity * 100));
    }
    
    /**
     * Identificar factores de riesgo en el portfolio
     * @param {Array} contracts - Lista de contratos
     * @param {number} diversification - Score de diversificación
     * @returns {Array} Factores de riesgo
     */
    identifyPortfolioRiskFactors(contracts, diversification) {
        const factors = [];
        
        // Factor de diversificación
        if (diversification < 30) {
            factors.push({
                type: 'diversification',
                severity: diversification < 10 ? 'high' : 'medium',
                message: `Baja diversificación (${diversification.toFixed(0)}%)`,
                value: diversification
            });
        }
        
        // Factor de concentración blockchain
        const blockchains = {};
        for (const contract of contracts) {
            blockchains[contract.blockchain] = (blockchains[contract.blockchain] || 0) + 1;
        }
        
        const dominantBlockchain = Object.entries(blockchains)
            .sort((a, b) => b[1] - a[1])[0];
        
        if (dominantBlockchain && dominantBlockchain[1] / contracts.length > 0.7) {
            factors.push({
                type: 'concentration',
                severity: dominantBlockchain[1] / contracts.length > 0.9 ? 'high' : 'medium',
                message: `Alta concentración en ${dominantBlockchain[0]} (${Math.round(dominantBlockchain[1] / contracts.length * 100)}%)`,
                blockchain: dominantBlockchain[0]
            });
        }
        
        // Factor de volatilidad
        const highVolatilityContracts = contracts.filter(contract => {
            const volatilityData = this.volatilityCache.get(contract.blockchain);
            return volatilityData && (volatilityData.level === 'HIGH' || volatilityData.level === 'VERY_HIGH');
        });
        
        if (highVolatilityContracts.length > contracts.length * 0.5) {
            factors.push({
                type: 'volatility',
                severity: highVolatilityContracts.length > contracts.length * 0.8 ? 'high' : 'medium',
                message: `${highVolatilityContracts.length} contratos en blockchains de alta volatilidad`,
                count: highVolatilityContracts.length
            });
        }
        
        // Factor de expiración cercana
        const now = Date.now();
        const soonExpiringContracts = contracts.filter(contract => {
            const expiry = new Date(contract.executionDate).getTime();
            return (expiry - now) < (7 * 24 * 60 * 60 * 1000); // 7 días
        });
        
        if (soonExpiringContracts.length > 0) {
            factors.push({
                type: 'expiration',
                severity: soonExpiringContracts.length > contracts.length * 0.5 ? 'high' : 'medium',
                message: `${soonExpiringContracts.length} contratos expiran en menos de 7 días`,
                count: soonExpiringContracts.length
            });
        }
        
        return factors;
    }
    
    /**
     * Verificar riesgo de portfolio y emitir alertas si es necesario
     * @param {string} userId - ID del usuario
     * @param {Object} portfolio - Datos del portfolio
     */
    checkPortfolioRisk(userId, portfolio) {
        if (!portfolio) return;
        
        // Si el riesgo es alto, generar alerta
        if (portfolio.riskLevel === 'HIGH' || portfolio.riskLevel === 'VERY_HIGH') {
            this.createAlert({
                type: 'portfolio',
                userId,
                severity: portfolio.riskLevel === 'VERY_HIGH' ? 'critical' : 'high',
                message: `Portfolio de alto riesgo detectado (${portfolio.riskLevel})`,
                score: portfolio.riskScore,
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Actualizar datos de mercado
     * @param {Object} priceData - Datos de precio
     */
    updateMarketData(priceData) {
        // En un sistema real, actualizaríamos predicciones
        // y analizaríamos cambios significativos
        
        if (!priceData || !priceData.asset) return;
        
        // Detectar cambios rápidos de precio
        const priceDelta = priceData.priceDelta;
        
        if (priceDelta && Math.abs(priceDelta) > 0.05) { // >5% cambio
            this.createAlert({
                type: 'price_movement',
                severity: Math.abs(priceDelta) > 0.1 ? 'high' : 'medium',
                asset: priceData.asset,
                message: `Movimiento rápido de precio en ${priceData.asset}: ${(priceDelta * 100).toFixed(2)}%`,
                value: priceDelta,
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * Crear una alerta de riesgo
     * @param {Object} alert - Datos de la alerta
     */
    createAlert(alert) {
        // Añadir ID y timestamp si no existen
        alert.id = alert.id || `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        alert.timestamp = alert.timestamp || Date.now();
        
        // Añadir al inicio de la lista
        this.alerts.unshift(alert);
        
        // Limitar número de alertas
        if (this.alerts.length > this.config.maxAlerts) {
            this.alerts.pop();
        }
        
        // Notificar alerta si hay sistema de eventos
        if (this.eventSystem) {
            if (alert.type === 'portfolio') {
                this.eventSystem.emit(this.eventSystem.EVENTS.PORTFOLIO_RISK_ALERT, alert);
            } else if (alert.type === 'volatility' || alert.type === 'price_movement') {
                this.eventSystem.emit(this.eventSystem.EVENTS.MARKET_VOLATILITY_ALERT, alert);
            } else {
                this.eventSystem.emit(this.eventSystem.EVENTS.SYSTEM_WARNING, alert);
            }
        }
    }
    
    /**
     * Obtener alertas activas
     * @param {Object} filters - Filtros a aplicar
     * @returns {Array} Lista de alertas
     */
    getAlerts(filters = {}) {
        let filteredAlerts = [...this.alerts];
        
        if (filters.type) {
            filteredAlerts = filteredAlerts.filter(alert => alert.type === filters.type);
        }
        
        if (filters.severity) {
            filteredAlerts = filteredAlerts.filter(alert => alert.severity === filters.severity);
        }
        
        if (filters.blockchain) {
            filteredAlerts = filteredAlerts.filter(alert => alert.blockchain === filters.blockchain);
        }
        
        if (filters.userId) {
            filteredAlerts = filteredAlerts.filter(alert => alert.userId === filters.userId);
        }
        
        if (filters.since) {
            filteredAlerts = filteredAlerts.filter(alert => alert.timestamp >= filters.since);
        }
        
        if (filters.limit) {
            filteredAlerts = filteredAlerts.slice(0, filters.limit);
        }
        
        return filteredAlerts;
    }
    
    /**
     * Marcar alerta como leída
     * @param {string} alertId - ID de la alerta
     * @returns {boolean} Si se marcó correctamente
     */
    markAlertAsRead(alertId) {
        const alertIndex = this.alerts.findIndex(a => a.id === alertId);
        
        if (alertIndex >= 0) {
            this.alerts[alertIndex].read = true;
            return true;
        }
        
        return false;
    }
    
    /**
     * Generar informe completo de riesgo
     * @param {Object} portfolio - Portfolio a analizar
     * @returns {Object} Informe detallado
     */
    generateRiskReport(portfolio) {
        if (!portfolio) return null;
        
        // Análisis básico
        const riskAnalysis = {
            level: portfolio.summary?.riskLevel || 'MEDIUM',
            score: portfolio.summary?.riskScore || 50,
            factors: [],
            recommendations: []
        };
        
        // Si no hay contratos activos, retornar informe básico
        if (!portfolio.contracts || portfolio.contracts.length === 0 ||
            !portfolio.contracts.some(c => c.status === 'active')) {
            riskAnalysis.factors.push({
                type: 'information',
                severity: 'low',
                message: 'No hay contratos activos para analizar'
            });
            riskAnalysis.recommendations.push('Considere crear nuevos contratos forward');
            return riskAnalysis;
        }
        
        // Obtener contratos activos
        const activeContracts = portfolio.contracts.filter(c => c.status === 'active');
        
        // Analizar diversificación
        const blockchains = {};
        let totalValue = 0;
        
        for (const contract of activeContracts) {
            const blockchain = contract.blockchain;
            const value = contract.amount * contract.strikePrice;
            
            if (!blockchains[blockchain]) {
                blockchains[blockchain] = 0;
            }
            
            blockchains[blockchain] += value;
            totalValue += value;
        }
        
        // Verificar concentración
        if (Object.keys(blockchains).length === 1) {
            const blockchain = Object.keys(blockchains)[0];
            riskAnalysis.factors.push({
                type: 'concentration',
                severity: 'high',
                message: `Todos los contratos están en una sola blockchain (${blockchain})`,
                blockchain
            });
            riskAnalysis.recommendations.push(`Diversifique su portfolio con contratos en otras blockchains además de ${blockchain}`);
        } else {
            // Verificar si hay alguna blockchain dominante
            for (const blockchain in blockchains) {
                const percentage = blockchains[blockchain] / totalValue;
                
                if (percentage > 0.7) {
                    riskAnalysis.factors.push({
                        type: 'concentration',
                        severity: 'medium',
                        message: `Alta concentración en ${blockchain} (${(percentage * 100).toFixed(0)}%)`,
                        blockchain
                    });
                    riskAnalysis.recommendations.push(`Considere reducir su exposición a ${blockchain}`);
                }
            }
        }
        
        // Verificar volatilidad
        let highVolatilityBlockchains = [];
        
        for (const blockchain in blockchains) {
            const volatilityData = this.volatilityCache.get(blockchain);
            
            if (volatilityData && (volatilityData.level === 'HIGH' || volatilityData.level === 'VERY_HIGH')) {
                highVolatilityBlockchains.push(blockchain);
            }
        }
        
        if (highVolatilityBlockchains.length > 0) {
            riskAnalysis.factors.push({
                type: 'volatility',
                severity: 'medium',
                message: `Alta volatilidad en: ${highVolatilityBlockchains.join(', ')}`,
                blockchains: highVolatilityBlockchains
            });
            riskAnalysis.recommendations.push('Monitoree de cerca estos mercados volátiles');
        }
        
        // Verificar vencimientos cercanos
        const now = Date.now();
        const soonExpiringContracts = activeContracts.filter(contract => {
            const expiry = new Date(contract.executionDate).getTime();
            return (expiry - now) < (7 * 24 * 60 * 60 * 1000); // 7 días
        });
        
        if (soonExpiringContracts.length > 0) {
            riskAnalysis.factors.push({
                type: 'expiration',
                severity: 'medium',
                message: `${soonExpiringContracts.length} contratos expiran en menos de 7 días`,
                contracts: soonExpiringContracts.map(c => c.id)
            });
            riskAnalysis.recommendations.push('Prepare estrategias para los contratos a punto de expirar');
        }
        
        // Si no hay factores de riesgo específicos
        if (riskAnalysis.factors.length === 0) {
            riskAnalysis.factors.push({
                type: 'information',
                severity: 'low',
                message: 'No se detectaron factores de riesgo específicos'
            });
        }
        
        // Añadir recomendación general según nivel de riesgo
        if (riskAnalysis.level === 'HIGH' || riskAnalysis.level === 'VERY_HIGH') {
            riskAnalysis.recommendations.push('Considere reequilibrar su portfolio para reducir el riesgo general');
        } else if (riskAnalysis.level === 'LOW') {
            riskAnalysis.recommendations.push('Su portfolio tiene un nivel de riesgo bajo, lo que puede resultar en rendimientos más bajos');
        }
        
        return riskAnalysis;
    }
    
    /**
     * Realizar simulaciones de escenarios de riesgo
     * @param {Object} portfolio - Portfolio a simular
     * @param {number} scenarios - Número de escenarios
     * @returns {Object} Resultados de simulaciones
     */
    simulateRiskScenarios(portfolio, scenarios = 3) {
        if (!portfolio || !portfolio.contracts) return null;
        
        const activeContracts = portfolio.contracts.filter(c => c.status === 'active');
        if (activeContracts.length === 0) return null;
        
        // Escenarios predefinidos
        const scenarioDefinitions = [
            { name: 'Optimista', priceChangeFactor: 1.15, volatilityFactor: 0.7 },
            { name: 'Base', priceChangeFactor: 1.0, volatilityFactor: 1.0 },
            { name: 'Pesimista', priceChangeFactor: 0.85, volatilityFactor: 1.5 }
        ];
        
        const results = [];
        
        for (const scenario of scenarioDefinitions) {
            let totalPnL = 0;
            let totalValue = 0;
            
            // Simular cada contrato
            for (const contract of activeContracts) {
                const initialPrice = contract.strikePrice;
                
                // Simular precio en fecha de ejecución
                const simulatedPrice = initialPrice * scenario.priceChangeFactor;
                
                // Calcular PnL para el escenario
                const pnl = (simulatedPrice - initialPrice) * contract.amount;
                
                totalPnL += pnl;
                totalValue += contract.amount * initialPrice;
            }
            
            const riskScore = portfolio.summary?.riskScore || 50;
            const adjustedRisk = riskScore * scenario.volatilityFactor;
            
            results.push({
                name: scenario.name,
                pnl: totalPnL,
                returnPercentage: totalValue > 0 ? (totalPnL / totalValue) * 100 : 0,
                riskLevel: this.getRiskLevel(adjustedRisk),
                riskScore: adjustedRisk
            });
        }
        
        return results;
    }
    
    /**
     * Restablecer todas las alertas
     */
    clearAlerts() {
        this.alerts = [];
    }
}

// Crear instancia singleton
const riskAnalyzer = new RiskAnalyzer();

// Exportar para diferentes entornos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RiskAnalyzer,
        riskAnalyzer
    };
} else if (typeof window !== 'undefined') {
    window.BitForwardRiskAnalyzer = RiskAnalyzer;
    window.riskAnalyzer = riskAnalyzer;
}

console.log('🚀 BitForward Risk Analytics 1.0.0 inicializado');
