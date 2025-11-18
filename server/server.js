/**
 * BitForward Backend Server v2.0
 * Motor de Persistencia para Contratos Forward DeFi
 *
 * Este servidor proporciona:
 * - API REST para gestión de contratos
 * - Base de datos SQLite para persistencia
 * - Validación robusta de datos
 * - Seguridad enterprise-grade
 * - Rate limiting y CORS
 */

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

// Importar rutas y middleware
const contractRoutes = require('./routes/contracts');
const statsRoutes = require('./routes/stats');
const authRoutes = require('./routes/auth');
const lendingRoutes = require('./routes/lending');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { rateLimitMiddleware } = require('./middleware/rateLimiter');
const validationService = require('./validators/validationService');
const logger = require('./utils/logger');

// Importar middleware de seguridad mejorada
const { setupSecurity, verifyOrigin, blockMaliciousBots } = require('./middleware/security');

// Configuración
const config = require('./config/config');
const database = require('./database/database');
const { closeConnection } = require('./database/config');

// Servicios blockchain
const BlockchainService = require('./services/BlockchainService');

class BitForwardServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.blockchainService = null;
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeBlockchainRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Inicializa el servicio blockchain
   */
  async initializeBlockchainService() {
    try {
      console.log('🔗 Inicializando servicio blockchain...');
      this.blockchainService = new BlockchainService();
      await this.blockchainService.initialize();
      console.log('✅ Servicio blockchain inicializado');
      return true;
    } catch (error) {
      console.error('❌ Error al inicializar servicio blockchain:', error);
      console.log('⚠️  El servidor continuará sin conectividad blockchain');
      return false;
    }
  }

  /**
   * Configura middleware de seguridad y utilidad
   */
  initializeMiddleware() {
    // Logging de requests HTTP
    this.app.use(logger.createRequestLogger());

    // Bloquear bots maliciosos
    this.app.use(blockMaliciousBots);

    // Sanitización de datos de entrada
    this.app.use(validationService.createSanitizationMiddleware());

    // Sistema de seguridad mejorada (Helmet + Rate Limiting + XSS + CSRF)
    setupSecurity(this.app);

    // Verificar origen de requests (Anti-CSRF)
    this.app.use('/api/', verifyOrigin);

    // CORS configurado para el frontend
    this.app.use(
      cors({
        origin: config.ALLOWED_ORIGINS,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      })
    );

    // Compresión de respuestas
    this.app.use(compression());

    // Parsing de JSON con límite de tamaño
    this.app.use(
      express.json({
        limit: '10mb',
        verify: (req, res, buf) => {
          req.rawBody = buf;
        },
      })
    );

    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting global
    this.app.use(rateLimitMiddleware);

    // Servir archivos estáticos del frontend
    this.app.use(express.static(path.join(__dirname, '../')));
  }

  /**
   * Define las rutas de la API
   */
  initializeRoutes() {
    // Health check con información de base de datos y blockchain
    this.app.get('/api/health', async (req, res) => {
      try {
        const dbConnected = await database.testConnection();
        const blockchainConnected = this.blockchainService
          ? await this.blockchainService.checkConnection()
          : false;

        res.json({
          status: 'OK',
          timestamp: new Date().toISOString(),
          version: '2.0.0',
          service: 'BitForward API - Búnker de Datos Persistente + DeFi Protocol',
          database: {
            type: 'SQLite',
            status: dbConnected ? 'Connected' : 'Disconnected',
            path: 'server/database/bitforward.sqlite3',
          },
          blockchain: {
            status: blockchainConnected ? 'Connected' : 'Disconnected',
            network: process.env.BLOCKCHAIN_NETWORK || 'localhost',
            services: ['Vault', 'StrategyExecutor', 'Adapters'],
          },
        });
      } catch (error) {
        res.status(500).json({
          status: 'ERROR',
          timestamp: new Date().toISOString(),
          error: 'Service connection failed',
        });
      }
    });

    // API routes con persistencia SQLite
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/auth/wallet', require('./routes/walletAuth')); // Wallet authentication
    this.app.use('/api/contracts', contractRoutes);
    this.app.use('/api/stats', statsRoutes);
    this.app.use('/api/lending', lendingRoutes);

    // Información de la API
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'BitForward API',
        version: '2.0.0',
        description:
          'API empresarial para contratos forward DeFi con persistencia SQLite + Blockchain Protocol',
        endpoints: {
          auth: '/api/auth',
          contracts: '/api/contracts',
          lending: '/api/lending',
          vault: '/api/vault',
          strategy: '/api/strategy',
          loans: '/api/loans',
          health: '/api/health',
        },
        features: [
          'Autenticación JWT',
          'Persistencia SQLite',
          'Contratos Forward',
          'Plataforma de Préstamos',
          'Validación de Seguridad',
          'DeFi Vault Protocol',
          'Strategy Execution',
          'Multi-Protocol Adapters',
        ],
      });
    });

    // Ruta catch-all para SPA
    this.app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({
          error: 'API endpoint not found',
          path: req.path,
          available_endpoints: [
            '/api/auth',
            '/api/contracts',
            '/api/lending',
            '/api/vault',
            '/api/strategy',
            '/api/loans',
            '/api/health',
          ],
          timestamp: new Date().toISOString(),
        });
      }
      res.sendFile(path.join(__dirname, '../enterprise.html'));
    });
  }

  /**
   * Define las rutas específicas de blockchain/DeFi
   */
  initializeBlockchainRoutes() {
    // Middleware para verificar servicio blockchain
    const checkBlockchainService = (req, res, next) => {
      if (!this.blockchainService) {
        return res.status(503).json({
          error: 'Blockchain service not available',
          message: 'The DeFi protocol is currently disconnected',
        });
      }
      next();
    };

    // ============ VAULT OPERATIONS ============
    this.app.get('/api/vault/info', checkBlockchainService, async (req, res) => {
      try {
        const result = await this.blockchainService.getVaultInfo();
        res.json(result);
      } catch (error) {
        console.error('Error in /api/vault/info:', error);
        res.status(500).json({ error: 'Failed to fetch vault information' });
      }
    });

    this.app.get('/api/vault/balance/:asset', checkBlockchainService, async (req, res) => {
      try {
        const { asset } = req.params;
        const result = await this.blockchainService.getVaultBalance(asset);
        res.json(result);
      } catch (error) {
        console.error('Error in /api/vault/balance:', error);
        res.status(500).json({ error: 'Failed to fetch vault balance' });
      }
    });

    // ============ STRATEGY OPERATIONS ============
    this.app.post('/api/strategy/hedge', checkBlockchainService, async (req, res) => {
      try {
        const { assetIn, assetOut, amount, minAmountOut } = req.body;

        // Validation
        if (!assetIn || !assetOut || !amount || !minAmountOut) {
          return res.status(400).json({
            error: 'Missing required parameters',
            required: ['assetIn', 'assetOut', 'amount', 'minAmountOut'],
          });
        }

        const result = await this.blockchainService.executeHedge(
          assetIn,
          assetOut,
          amount,
          minAmountOut
        );
        res.json(result);
      } catch (error) {
        console.error('Error in /api/strategy/hedge:', error);
        res.status(500).json({ error: 'Failed to execute hedge strategy' });
      }
    });

    this.app.post('/api/strategy/loan', checkBlockchainService, async (req, res) => {
      try {
        const { collateralAsset, debtAsset, collateralAmount, debtAmount } = req.body;

        if (!collateralAsset || !debtAsset || !collateralAmount || !debtAmount) {
          return res.status(400).json({
            error: 'Missing required parameters',
            required: ['collateralAsset', 'debtAsset', 'collateralAmount', 'debtAmount'],
          });
        }

        const result = await this.blockchainService.openLoan(
          collateralAsset,
          debtAsset,
          collateralAmount,
          debtAmount
        );
        res.json(result);
      } catch (error) {
        console.error('Error in /api/strategy/loan:', error);
        res.status(500).json({ error: 'Failed to open collateralized loan' });
      }
    });

    // ============ LOAN MANAGEMENT ============
    this.app.get('/api/loans', checkBlockchainService, async (req, res) => {
      try {
        const result = await this.blockchainService.getActiveLoans();
        res.json(result);
      } catch (error) {
        console.error('Error in /api/loans:', error);
        res.status(500).json({ error: 'Failed to fetch active loans' });
      }
    });

    this.app.get('/api/loans/:loanId', checkBlockchainService, async (req, res) => {
      try {
        const { loanId } = req.params;
        const result = await this.blockchainService.getLoanInfo(loanId);
        res.json(result);
      } catch (error) {
        console.error('Error in /api/loans/:loanId:', error);
        res.status(500).json({ error: 'Failed to fetch loan information' });
      }
    });

    // ============ TRANSACTION TRACKING ============
    this.app.get('/api/transaction/:txHash', checkBlockchainService, async (req, res) => {
      try {
        const { txHash } = req.params;
        const result = await this.blockchainService.getTransactionStatus(txHash);
        res.json(result);
      } catch (error) {
        console.error('Error in /api/transaction:', error);
        res.status(500).json({ error: 'Failed to fetch transaction status' });
      }
    });

    // ============ PROTOCOL STATS ============
    this.app.get('/api/protocol/stats', checkBlockchainService, async (req, res) => {
      try {
        const vaultInfo = await this.blockchainService.getVaultInfo();
        const activeLoans = await this.blockchainService.getActiveLoans();

        res.json({
          vault: vaultInfo,
          loans: {
            active: activeLoans.length,
            list: activeLoans,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error in /api/protocol/stats:', error);
        res.status(500).json({ error: 'Failed to fetch protocol statistics' });
      }
    });
  }

  /**
   * Configura el manejo de errores
   */
  initializeErrorHandling() {
    // Handler para rutas no encontradas
    this.app.use(notFoundHandler);

    // Error handler principal
    this.app.use(errorHandler);
  }

  /**
   * Inicia el servidor con verificación de base de datos y blockchain
   */
  async start() {
    try {
      // Verificar conexión a la base de datos
      console.log('🔍 Verificando conexión a la base de datos...');
      const dbConnected = await database.testConnection();

      if (!dbConnected) {
        console.log('⚠️  La base de datos no está inicializada.');
        console.log('💡 Ejecuta: npm run db:setup para crear las tablas');
        console.log('🚀 El servidor continuará, pero algunas funciones pueden fallar');
      }

      // Inicializar servicio blockchain
      const blockchainConnected = await this.initializeBlockchainService();

      // Iniciar servidor
      this.server = this.app.listen(this.port, () => {
        console.log(`
🏛️  BÚNKER DE DATOS PERSISTENTE + PROTOCOLO DeFi ACTIVADO

🚀 BitForward Server v2.0 - Persistencia SQLite + Blockchain Protocol
   Puerto: ${this.port}
   Ambiente: ${process.env.NODE_ENV || 'development'}
   
🌐 URLs disponibles:
   Frontend: http://localhost:${this.port}
   API Health: http://localhost:${this.port}/api/health
   API Info: http://localhost:${this.port}/api

💾 Características del Búnker:
   ✅ Base de datos SQLite persistente
   ✅ Autenticación JWT robusta
   ✅ Contratos forward con métricas
   ✅ Plataforma de préstamos
   ✅ Transacciones auditables
   ✅ Configuración del sistema

⛓️  Protocolo DeFi:
   ${blockchainConnected ? '✅' : '❌'} Servicio blockchain
   ${blockchainConnected ? '✅' : '❌'} Vault de custodia
   ${blockchainConnected ? '✅' : '❌'} Adaptadores de protocolo
   ${blockchainConnected ? '✅' : '❌'} Executor de estrategias

💾 Base de datos: server/database/bitforward.sqlite3
⛓️  Smart contracts: contracts/ (Vault, Adapters, StrategyExecutor)

${dbConnected ? '✅ Base de datos conectada y operativa' : '⚠️  Ejecuta "npm run db:setup" para inicializar la BD'}
${blockchainConnected ? '✅ Protocolo DeFi conectado y operativo' : '⚠️  Protocolo DeFi desconectado (revisa configuración blockchain)'}
                `);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      console.error('❌ Error al iniciar el servidor:', error);
      process.exit(1);
    }
  }

  /**
   * Configura el cierre graceful del servidor
   */
  setupGracefulShutdown() {
    const shutdown = async signal => {
      console.log(`\n🔄 Recibido ${signal}, cerrando Búnker de Datos...`);

      if (this.server) {
        this.server.close(async () => {
          console.log('✅ Servidor HTTP cerrado');

          try {
            await closeConnection();
            console.log('✅ Conexión a base de datos cerrada');
            console.log('🏛️  Búnker de Datos desactivado de forma segura');
            process.exit(0);
          } catch (error) {
            console.error('❌ Error al cerrar la base de datos:', error);
            process.exit(1);
          }
        });
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

// Inicializar y ejecutar servidor
if (require.main === module) {
  const server = new BitForwardServer();
  server.start().catch(console.error);
}

module.exports = BitForwardServer;
