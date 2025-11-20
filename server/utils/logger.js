/**
 * Sistema de Logging BitForward v2.0
 * Logging estructurado con diferentes niveles y transports
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

class BitForwardLogger {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
    this.logger = this.createLogger();
  }

  /**
   * Asegura que el directorio de logs existe
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Crea el logger principal de Winston
   */
  createLogger() {
    const dateSlug = new Date().toISOString().slice(0, 10);
    const customFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.errors({ stack: true }),
      winston.format.printf(({ level, message, timestamp, ...metadata }) => {
        let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;

        if (Object.keys(metadata).length > 0) {
          msg += `\n${JSON.stringify(metadata, null, 2)}`;
        }

        return msg;
      })
    );

    const logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: customFormat,
      transports: [
        // Console transport para desarrollo
        new winston.transports.Console({
          format: winston.format.combine(winston.format.colorize(), customFormat),
        }),

        // Archivo para todos los logs
        new winston.transports.File({
          filename: path.join(this.logsDir, `bitforward-${dateSlug}.log`),
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),

        // Archivo específico para errores
        new winston.transports.File({
          filename: path.join(this.logsDir, `error-${dateSlug}.log`),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),

        // Archivo para eventos de seguridad
        new winston.transports.File({
          filename: path.join(this.logsDir, `security-${dateSlug}.log`),
          level: 'warn',
          maxsize: 5242880, // 5MB
          maxFiles: 10,
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
      ],
      exitOnError: false,
    });

    return logger;
  }

  /**
   * Logs de información general
   */
  info(message, metadata = {}) {
    this.logger.info(message, this.enrichMetadata(metadata));
  }

  /**
   * Logs de advertencia
   */
  warn(message, metadata = {}) {
    this.logger.warn(message, this.enrichMetadata(metadata));
  }

  /**
   * Logs de error
   */
  error(message, metadata = {}) {
    this.logger.error(message, this.enrichMetadata(metadata));
  }

  /**
   * Logs de debug (solo en desarrollo)
   */
  debug(message, metadata = {}) {
    this.logger.debug(message, this.enrichMetadata(metadata));
  }

  /**
   * Logs específicos para eventos de seguridad
   */
  security(message, metadata = {}) {
    this.logger.warn(`[SECURITY] ${message}`, {
      ...this.enrichMetadata(metadata),
      category: 'security',
    });
  }

  /**
   * Logs específicos para transacciones blockchain
   */
  blockchain(message, metadata = {}) {
    this.logger.info(`[BLOCKCHAIN] ${message}`, {
      ...this.enrichMetadata(metadata),
      category: 'blockchain',
    });
  }

  /**
   * Logs específicos para contratos
   */
  contract(message, metadata = {}) {
    this.logger.info(`[CONTRACT] ${message}`, {
      ...this.enrichMetadata(metadata),
      category: 'contract',
    });
  }

  /**
   * Logs de performance/métricas
   */
  performance(message, metadata = {}) {
    this.logger.info(`[PERFORMANCE] ${message}`, {
      ...this.enrichMetadata(metadata),
      category: 'performance',
    });
  }

  /**
   * Enriquece los metadatos con información contextual
   */
  enrichMetadata(metadata) {
    return {
      ...metadata,
      timestamp: new Date().toISOString(),
      service: 'BitForward',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      pid: process.pid,
    };
  }

  /**
   * Crea un logger específico para un módulo
   */
  createModuleLogger(moduleName) {
    return {
      info: (message, metadata = {}) => this.info(`[${moduleName}] ${message}`, metadata),
      warn: (message, metadata = {}) => this.warn(`[${moduleName}] ${message}`, metadata),
      error: (message, metadata = {}) => this.error(`[${moduleName}] ${message}`, metadata),
      debug: (message, metadata = {}) => this.debug(`[${moduleName}] ${message}`, metadata),
    };
  }

  /**
   * Middleware para logging de requests HTTP
   */
  createRequestLogger() {
    return (req, res, next) => {
      const start = Date.now();

      // Capturar cuando la respuesta termina
      res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          contentLength: res.get('Content-Length'),
          user: req.user?.id || 'anonymous',
        };

        if (res.statusCode >= 400) {
          this.warn('HTTP Request Failed', logData);
        } else {
          this.info('HTTP Request', logData);
        }
      });

      next();
    };
  }

  /**
   * Log de inicio de aplicación
   */
  logAppStart(config) {
    this.info('BitForward Application Started', {
      port: config.port,
      environment: config.environment,
      database: config.database,
      features: config.features || [],
    });
  }

  /**
   * Log de cierre de aplicación
   */
  logAppShutdown(reason = 'unknown') {
    this.info('BitForward Application Shutting Down', {
      reason,
      uptime: process.uptime(),
    });
  }

  /**
   * Obtener estadísticas de logs
   */
  getLogStats() {
    // TODO: Implementar análisis de archivos de log
    return {
      logDirectory: this.logsDir,
      logFiles: fs.readdirSync(this.logsDir),
      currentLevel: this.logger.level,
    };
  }
}

// Crear instancia singleton
const logger = new BitForwardLogger();

module.exports = logger;
