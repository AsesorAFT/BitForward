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
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

// Importar rutas y middleware
const contractRoutes = require('./routes/contracts');
const statsRoutes = require('./routes/stats');
const authRoutes = require('./routes/auth');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const { authenticateToken } = require('./middleware/auth');
const validationService = require('./validators/validationService');
const logger = require('./utils/logger');

// Configuración
const config = require('./config/config');
const database = require('./database/database');

class BitForwardServer {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    /**
     * Configura middleware de seguridad y utilidad
     */
    initializeMiddleware() {
        // Logging de requests HTTP
        this.app.use(logger.createRequestLogger());

        // Sanitización de datos de entrada
        this.app.use(validationService.createSanitizationMiddleware());

        // Seguridad
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"]
                }
            }
        }));

        // CORS configurado para el frontend
        this.app.use(cors({
            origin: config.ALLOWED_ORIGINS,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
        }));

        // Compresión de respuestas
        this.app.use(compression());

        // Parsing de JSON con límite de tamaño
        this.app.use(express.json({ 
            limit: '10mb',
            verify: (req, res, buf) => {
                req.rawBody = buf;
            }
        }));
        
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Rate limiting global
        this.app.use(rateLimiter);

        // Servir archivos estáticos del frontend
        this.app.use(express.static(path.join(__dirname, '../')));
    }

    /**
     * Define las rutas de la API
     */
    initializeRoutes() {
        // Health check con información de base de datos
        this.app.get('/api/health', async (req, res) => {
            try {
                const dbConnected = await testConnection();
                res.json({
                    status: 'OK',
                    timestamp: new Date().toISOString(),
                    version: '2.0.0',
                    service: 'BitForward API - Búnker de Datos Persistente',
                    database: {
                        type: 'SQLite',
                        status: dbConnected ? 'Connected' : 'Disconnected',
                        path: 'server/database/bitforward.sqlite3'
                    }
                });
            } catch (error) {
                res.status(500).json({
                    status: 'ERROR',
                    timestamp: new Date().toISOString(),
                    error: 'Database connection failed'
                });
            }
        });

        // API routes con persistencia SQLite
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/contracts', contractRoutes);
        this.app.use('/api/lending', lendingRoutes);

        // Información de la API
        this.app.get('/api', (req, res) => {
            res.json({
                name: 'BitForward API',
                version: '2.0.0',
                description: 'API empresarial para contratos forward DeFi con persistencia SQLite',
                endpoints: {
                    auth: '/api/auth',
                    contracts: '/api/contracts',
                    lending: '/api/lending',
                    health: '/api/health'
                },
                features: [
                    'Autenticación JWT',
                    'Persistencia SQLite',
                    'Contratos Forward',
                    'Plataforma de Préstamos',
                    'Validación de Seguridad'
                ]
            });
        });

        // Ruta catch-all para SPA
        this.app.get('*', (req, res) => {
            if (req.path.startsWith('/api/')) {
                return res.status(404).json({
                    error: 'API endpoint not found',
                    path: req.path,
                    available_endpoints: ['/api/auth', '/api/contracts', '/api/lending', '/api/health'],
                    timestamp: new Date().toISOString()
                });
            }
            res.sendFile(path.join(__dirname, '../enterprise.html'));
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
     * Inicia el servidor con verificación de base de datos
     */
    async start() {
        try {
            // Verificar conexión a la base de datos
            console.log('🔍 Verificando conexión a la base de datos...');
            const dbConnected = await testConnection();
            
            if (!dbConnected) {
                console.log('⚠️  La base de datos no está inicializada.');
                console.log('💡 Ejecuta: npm run db:setup para crear las tablas');
                console.log('🚀 El servidor continuará, pero algunas funciones pueden fallar');
            }

            // Iniciar servidor
            this.server = this.app.listen(this.port, () => {
                console.log(`
🏛️  BÚNKER DE DATOS PERSISTENTE ACTIVADO

🚀 BitForward Server v2.0 - Persistencia SQLite
   Puerto: ${this.port}
   Ambiente: ${process.env.NODE_ENV || 'development'}
   
🌐 URLs disponibles:
   Frontend: http://localhost:${this.port}
   API Health: http://localhost:${this.port}/api/health
   API Info: http://localhost:${this.port}/api

� Características del Búnker:
   ✅ Base de datos SQLite persistente
   ✅ Autenticación JWT robusta
   ✅ Contratos forward con métricas
   ✅ Plataforma de préstamos
   ✅ Transacciones auditables
   ✅ Configuración del sistema

💾 Base de datos: server/database/bitforward.sqlite3
� Todos los datos son permanentes y seguros

${dbConnected ? '✅ Base de datos conectada y operativa' : '⚠️  Ejecuta "npm run db:setup" para inicializar la BD'}
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
        const shutdown = async (signal) => {
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
