/**
 * BitForward Core Integration
 * Integración de todos los componentes principales del sistema
 * Versión 2.0.0 - Enterprise Ready
 */

// Importar componentes principales (en navegador ya estarían disponibles globalmente)
const loadComponents = () => {
  // En un entorno Node.js, importaríamos los módulos
  if (typeof module !== 'undefined' && module.exports) {
    try {
      const { BitForward, bitForward } = require('./prototype');
      const { BitForwardBlockchain, bitforwardBlockchain } = require('./blockchain');
      const { EventSystem, eventSystem } = require('./event-system');
      const { PortfolioManager, portfolioManager } = require('./portfolio-management');
      const { RiskAnalyzer, riskAnalyzer } = require('./risk-analytics');
      const { CrossChainBridge, crossChainBridge } = require('./cross-chain-bridge');

      return {
        bitForward,
        bitforwardBlockchain,
        eventSystem,
        portfolioManager,
        riskAnalyzer,
        crossChainBridge
      };
    } catch (error) {
      console.error('Error cargando componentes en Node.js:', error);
    }
  }

  // En el navegador, accedemos a las variables globales
  if (typeof window !== 'undefined') {
    return {
      bitForward: window.bitForward,
      bitforwardBlockchain: window.bitforwardBlockchain,
      eventSystem: window.eventSystem,
      portfolioManager: window.portfolioManager,
      riskAnalyzer: window.riskAnalyzer,
      crossChainBridge: window.crossChainBridge
    };
  }

  // Si no se pueden cargar componentes
  console.error('No se pudieron cargar los componentes de BitForward');
  return {};
};

// Cargar componentes
const components = loadComponents();

/**
 * Clase principal que integra todos los componentes de BitForward
 */
class BitForwardCore {
  constructor() {
    // Referencias a los componentes
    this.core = components.bitForward;
    this.blockchain = components.bitforwardBlockchain;
    this.events = components.eventSystem;
    this.portfolio = components.portfolioManager;
    this.risk = components.riskAnalyzer;
    this.bridge = components.crossChainBridge;

    this.version = '2.0.0';
    this.isInitialized = false;

    this.initialize();
  }

  /**
     * Inicializar la integración
     */
  async initialize() {
    try {
      console.log('🚀 Iniciando BitForward Core Integration...');

      // Verificar componentes críticos
      if (!this.core) {
        throw new Error('Componente Core no disponible');
      }

      if (!this.blockchain) {
        console.warn('Componente Blockchain no disponible - funcionalidad limitada');
      }

      if (!this.events) {
        console.warn('Sistema de eventos no disponible - comunicación entre componentes limitada');
      }

      // Conectar componentes entre sí
      this.wireComponents();

      // Configurar manejadores de eventos globales
      this.setupGlobalEventHandlers();

      this.isInitialized = true;

      console.log(`🚀 BitForward Core Integration v${this.version} inicializado exitosamente`);

      // Notificar inicialización
      if (this.events) {
        this.events.emit(this.events.EVENTS.SYSTEM_INITIALIZED, {
          system: 'BitForwardCore',
          version: this.version,
          components: Object.keys(components).filter(key => !!components[key])
        });
      }

    } catch (error) {
      console.error('Error inicializando BitForward Core Integration:', error);
    }
  }

  /**
     * Conectar componentes entre sí
     */
  wireComponents() {
    // Este método establece conexiones específicas entre componentes
    // que no se realizan automáticamente en su inicialización

    // Por ahora, esto es mayormente informativo ya que los componentes
    // ya detectan automáticamente sus dependencias

    console.log('Conectando componentes de BitForward...');
  }

  /**
     * Configurar manejadores de eventos globales
     */
  setupGlobalEventHandlers() {
    if (!this.events) {return;}

    // Conectar eventos de contratos con actualizaciones de portfolio
    this.events.on(this.events.EVENTS.CONTRACT_CREATED, (contract) => {
      // Analizar riesgo del contrato nuevo
      if (this.risk) {
        const riskAnalysis = this.risk.analyzeContractRisk(contract);
        console.log(`Nuevo contrato analizado. Riesgo: ${riskAnalysis.level}`);
      }
    });

    // Conectar eventos de portfolio con análisis de riesgo
    this.events.on(this.events.EVENTS.PORTFOLIO_UPDATED, (data) => {
      if (this.risk && data.portfolio) {
        // Programar análisis de portfolio en segundo plano
        setTimeout(() => {
          this.risk.checkPortfolioRisk(data.userId, data.portfolio);
        }, 100);
      }
    });

    // Alertas de riesgo
    this.events.on(this.events.EVENTS.PORTFOLIO_RISK_ALERT, (alert) => {
      console.warn(`⚠️ Alerta de riesgo: ${alert.message}`);
    });

    // Eventos de blockchain
    this.events.on(this.events.EVENTS.BLOCKCHAIN_TX_CONFIRMED, (txData) => {
      console.log(`✅ Transacción confirmada: ${txData.id}`);

      // Si es transacción cross-chain, actualizar estado
      if (txData.isCrossChain && this.bridge) {
        console.log(`Cross-chain: ${txData.sourceChain} -> ${txData.targetChain}`);
      }
    });
  }

  /**
     * Obtener versión del sistema
     * @returns {string} Versión completa
     */
  getVersion() {
    return {
      core: this.version,
      components: {
        core: this.core ? '2.0.0' : 'no disponible',
        blockchain: this.blockchain ? '2.0.0' : 'no disponible',
        events: this.events ? '1.0.0' : 'no disponible',
        portfolio: this.portfolio ? '1.0.0' : 'no disponible',
        risk: this.risk ? '1.0.0' : 'no disponible',
        bridge: this.bridge ? '0.1.0' : 'no disponible'
      }
    };
  }

  /**
     * Verificar la salud del sistema
     * @returns {Object} Estado de los componentes
     */
  checkHealth() {
    const health = {
      status: 'operational',
      initialized: this.isInitialized,
      components: {}
    };

    // Verificar cada componente
    health.components.core = this.core ? 'operational' : 'unavailable';
    health.components.blockchain = this.blockchain ? 'operational' : 'unavailable';
    health.components.events = this.events ? 'operational' : 'unavailable';
    health.components.portfolio = this.portfolio ? 'operational' : 'unavailable';
    health.components.risk = this.risk ? 'operational' : 'unavailable';
    health.components.bridge = this.bridge ? 'experimental' : 'unavailable';

    // Determinar estado general
    const criticalComponents = ['core', 'blockchain'];
    const degraded = criticalComponents.some(c => health.components[c] !== 'operational');

    health.status = degraded ? 'degraded' : 'operational';

    return health;
  }

  /**
     * Obtener información completa del usuario
     * @param {string} userId - ID del usuario
     * @returns {Promise<Object>} Información completa
     */
  async getUserCompleteInfo(userId) {
    if (!userId) {
      throw new Error('ID de usuario requerido');
    }

    try {
      // Obtener información básica del usuario
      let user = null;

      if (this.core) {
        user = this.core.currentUser && this.core.currentUser.id === userId ?
          this.core.currentUser : { id: userId };
      } else {
        user = { id: userId };
      }

      // Obtener portfolio
      let portfolio = null;
      if (this.portfolio) {
        portfolio = this.portfolio.getUserPortfolio(userId);
      }

      // Obtener análisis de riesgo
      let riskAnalysis = null;
      if (this.risk && portfolio) {
        riskAnalysis = await this.risk.analyzePortfolio(portfolio);
      }

      // Obtener transacciones cross-chain
      let crossChainTx = [];
      if (this.bridge && user.wallets) {
        // Obtener direcciones de las wallets
        const addresses = Object.values(user.wallets)
          .filter(wallet => wallet && wallet.address)
          .map(wallet => wallet.address);

        // Obtener transacciones para cada dirección
        for (const address of addresses) {
          const transactions = this.bridge.getUserTransactions(address);
          crossChainTx = [...crossChainTx, ...transactions];
        }
      }

      // Construir respuesta completa
      return {
        user,
        portfolio,
        riskAnalysis,
        crossChainTx
      };

    } catch (error) {
      console.error('Error obteniendo información completa del usuario:', error);
      throw error;
    }
  }

  /**
     * Ejecutar un contrato forward con integración completa
     * @param {Object} contractData - Datos del contrato
     * @param {boolean} crossChain - Si es transacción cross-chain
     * @returns {Promise<Object>} Resultado de la ejecución
     */
  async executeIntegratedContract(contractData, crossChain = false) {
    if (!this.core) {
      throw new Error('Componente Core no disponible');
    }

    try {
      // Si es cross-chain, verificar disponibilidad del bridge
      if (crossChain) {
        if (!this.bridge) {
          throw new Error('Bridge cross-chain no disponible');
        }

        const { sourceChain, targetChain } = contractData;

        if (!sourceChain || !targetChain) {
          throw new Error('Parámetros cross-chain incompletos');
        }

        if (!this.bridge.hasBridge(sourceChain, targetChain)) {
          throw new Error(`No hay bridge disponible entre ${sourceChain} y ${targetChain}`);
        }
      }

      // Ejecutar contrato
      let result = null;

      if (crossChain) {
        result = await this.bridge.executeForwardContract({
          sourceChain: contractData.sourceChain,
          targetChain: contractData.targetChain,
          contract: contractData
        });
      } else {
        result = await this.core.executeContract(contractData.id);
      }

      // Si hay portfolio manager, actualizar portfolio
      if (this.portfolio && contractData.creatorId) {
        await this.portfolio.recalculatePortfolio(contractData.creatorId);
      }

      return result;

    } catch (error) {
      console.error('Error ejecutando contrato integrado:', error);
      throw error;
    }
  }

  /**
     * Generar un dashboard completo para un usuario
     * @param {string} userId - ID del usuario
     * @returns {Promise<Object>} Datos completos para dashboard
     */
  async generateDashboard(userId) {
    try {
      // Obtener información completa
      const userInfo = await this.getUserCompleteInfo(userId);

      // Generar informe detallado del portfolio
      let portfolioReport = null;
      if (this.portfolio) {
        portfolioReport = this.portfolio.generateDetailedReport(userId);
      }

      // Obtener análisis de riesgo avanzado
      let riskReport = null;
      if (this.risk) {
        riskReport = this.risk.generateRiskReport(userInfo.portfolio);
      }

      // Generar simulaciones de escenarios
      let scenarios = null;
      if (this.risk && userInfo.portfolio) {
        scenarios = this.risk.simulateRiskScenarios(userInfo.portfolio);
      }

      // Obtener analíticas generales del sistema
      let analytics = null;
      if (this.core) {
        analytics = this.core.generateAnalytics();
      }

      // Construir respuesta
      return {
        user: userInfo.user,
        portfolio: portfolioReport,
        riskAnalysis: riskReport,
        scenarios,
        crossChainTransactions: userInfo.crossChainTx,
        analytics,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Error generando dashboard:', error);
      throw error;
    }
  }
}

// Crear instancia singleton
const bitForwardCore = new BitForwardCore();

// Exportar para diferentes entornos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BitForwardCore,
    bitForwardCore
  };
} else if (typeof window !== 'undefined') {
  window.BitForwardCore = BitForwardCore;
  window.bitForwardCore = bitForwardCore;
}

console.log('🚀 BitForward Core Integration inicializado exitosamente');
