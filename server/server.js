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
const morgan = require('morgan');
const path = require('path');

// Importar rutas y middleware
const contractRoutes = require('./routes/contracts');
const statsRoutes = require('./routes/stats');
const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const validateApiKey = require('./middleware/validateApiKey');

// Configuración
const config = require('./config/config');
const database = require('./database/database');

class BitForwardServer {
    constructor() {
        this.app = express();
        this.port = config.PORT || 3001;
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    /**
     * Configura middleware de seguridad y utilidad
     */
    initializeMiddleware() {
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

        // Logging de requests
        this.app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));

        // Parsing de JSON con límite de tamaño
        this.app.use(express.json({ 
            limit: '10mb',
            verify: (req, res, buf) => {
                req.rawBody = buf;
            }
        }));
        
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Rate limiting
        this.app.use(rateLimiter);

        // Servir archivos estáticos del frontend
        this.app.use(express.static(path.join(__dirname, '../')));
    }

    /**
     * Define las rutas de la API
     */
    initializeRoutes() {
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                version: '2.0.0',
                service: 'BitForward API',
                database: database.isConnected() ? 'Connected' : 'Disconnected'
            });
        });

        // API routes
        this.app.use('/api/contracts', contractRoutes);
        this.app.use('/api/stats', statsRoutes);
        this.app.use('/api/auth', authRoutes);

        // Documentación de la API
        this.app.get('/api/docs', (req, res) => {
            res.sendFile(path.join(__dirname, 'docs/api-docs.html'));
        });

        // Ruta catch-all para SPA
        this.app.get('*', (req, res) => {
            if (req.path.startsWith('/api/')) {
                return res.status(404).json({
                    error: 'API endpoint not found',
                    path: req.path,
                    timestamp: new Date().toISOString()
                });
            }
            res.sendFile(path.join(__dirname, '../index.html'));
        });
    }

    /**
     * Configura el manejo de errores
     */
    initializeErrorHandling() {
        this.app.use(errorHandler);
    }

    /**
     * Inicia el servidor
     */
    async start() {
        try {
            // Inicializar base de datos
            await database.initialize();
            console.log('✅ Base de datos inicializada correctamente');

            // Iniciar servidor
            this.server = this.app.listen(this.port, () => {
                console.log(`
🚀 BitForward Server v2.0 iniciado exitosamente!

📊 Información del Servidor:
   Puerto: ${this.port}
   Ambiente: ${config.NODE_ENV}
   Base de datos: SQLite (${config.DATABASE_PATH})
   
🌐 URLs disponibles:
   Frontend: http://localhost:${this.port}
   API Health: http://localhost:${this.port}/api/health
   API Docs: http://localhost:${this.port}/api/docs

🛡️ Características activas:
   ✅ Rate limiting
   ✅ CORS protection
   ✅ Helmet security headers
   ✅ Request compression
   ✅ Error handling
   ✅ API validation

💡 Listo para recibir contratos forward!
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
            console.log(`\n🔄 Recibido ${signal}, cerrando servidor gracefully...`);
            
            if (this.server) {
                this.server.close(async () => {
                    console.log('✅ Servidor HTTP cerrado');
                    
                    try {
                        await database.close();
                        console.log('✅ Base de datos cerrada');
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
