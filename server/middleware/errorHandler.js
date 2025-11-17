/**
 * Middleware de Manejo de Errores BitForward v2.0
 * Sistema robusto con logging, categorización y respuestas estandarizadas
 */

const { AppError } = require('../errors/AppError');
const config = require('../config/config');

class ErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.errorPatterns = new Map();
  }

  /**
     * Middleware principal de manejo de errores
     */
  handle = (error, req, res, next) => {
    // Registrar error para análisis
    this.logError(error, req);

    // Contar errores para detectar patrones
    this.trackError(error);

    // Si es un error operacional conocido
    if (error.isOperational) {
      return this.handleOperationalError(error, req, res);
    }

    // Manejar errores específicos de bibliotecas
    if (error.isJoi) {
      return this.handleJoiValidationError(error, req, res);
    }

    if (error.code && error.code.startsWith('SQLITE_')) {
      return this.handleDatabaseError(error, req, res);
    }

    if (error instanceof SyntaxError && error.status === 400) {
      return this.handleJSONError(error, req, res);
    }

    if (error.status || error.statusCode) {
      return this.handleStatusError(error, req, res);
    }

    // Error no manejado - crítico
    return this.handleUnknownError(error, req, res);
  };

  /**
     * Maneja errores operacionales (AppError)
     */
  handleOperationalError(error, req, res) {
    const response = {
      success: false,
      error: error.message,
      code: error.code,
      timestamp: error.timestamp
    };

    // Agregar detalles en desarrollo
    if (config.NODE_ENV === 'development' && error.details) {
      response.details = error.details;
    }

    return res.status(error.statusCode).json(response);
  }

  /**
     * Maneja errores de validación Joi
     */
  handleJoiValidationError(error, req, res) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Los datos proporcionados no son válidos',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      })),
      code: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  /**
     * Maneja errores de base de datos
     */
  handleDatabaseError(error, req, res) {
    if (error.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({
        success: false,
        error: 'Database Constraint Error',
        message: 'Violación de restricción en la base de datos',
        code: 'DATABASE_CONSTRAINT_ERROR',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Database Error',
      message: 'Error en la operación de base de datos',
      code: 'DATABASE_ERROR',
      timestamp: new Date().toISOString()
    });
  }

  /**
     * Maneja errores de JSON malformado
     */
  handleJSONError(error, req, res) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON',
      message: 'El JSON proporcionado no es válido',
      code: 'INVALID_JSON',
      timestamp: new Date().toISOString()
    });
  }

  /**
     * Maneja errores con status personalizado
     */
  handleStatusError(error, req, res) {
    const status = error.status || error.statusCode;
    return res.status(status).json({
      success: false,
      error: error.name || 'Application Error',
      message: error.message,
      code: error.code || 'APPLICATION_ERROR',
      ...(config.NODE_ENV === 'development' && { stack: error.stack }),
      timestamp: new Date().toISOString()
    });
  }

  /**
     * Maneja errores desconocidos/críticos
     */
  handleUnknownError(error, req, res) {
    // Log crítico del error
    this.logCriticalError(error, req);

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: config.NODE_ENV === 'production'
        ? 'Ha ocurrido un error interno del servidor'
        : error.message,
      code: 'INTERNAL_SERVER_ERROR',
      ...(config.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error.toString()
      }),
      timestamp: new Date().toISOString()
    });
  }

  /**
     * Registra el error para análisis
     */
  logError(error, req) {
    console.error('Error capturado por errorHandler:', {
      message: error.message,
      code: error.code || 'UNKNOWN',
      stack: config.NODE_ENV === 'development' ? error.stack : undefined,
      url: req.url,
      method: req.method,
      ip: req.ip,
      user: req.user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    });
  }

  /**
     * Log específico para errores críticos
     */
  logCriticalError(error, req) {
    console.error('🚨 CRITICAL ERROR:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      user: req.user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    });
  }

  /**
     * Rastrea errores para detectar patrones
     */
  trackError(error) {
    const errorKey = error.code || error.name || 'UNKNOWN';
    const currentCount = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, currentCount + 1);

    // Detectar spike de errores
    if (currentCount > 10) {
      console.warn(`⚠️ Error spike detected: ${errorKey} occurred ${currentCount} times`);
    }
  }
}

// Crear instancia global del error handler
const errorHandler = new ErrorHandler();

/**
 * Middleware para manejar rutas no encontradas (404)
 */
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.path}`);
  error.status = 404;
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
};

/**
 * Wrapper para funciones async que automaticamente captura errores
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware para validar tipos de contenido
 */
const validateContentType = (expectedType = 'application/json') => {
  return (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
      const contentType = req.get('Content-Type');

      if (!contentType || !contentType.includes(expectedType)) {
        return res.status(415).json({
          success: false,
          error: 'Unsupported Media Type',
          message: `Content-Type debe ser ${expectedType}`,
          received: contentType || 'none',
          code: 'UNSUPPORTED_MEDIA_TYPE',
          timestamp: new Date().toISOString()
        });
      }
    }
    next();
  };
};

/**
 * Crear error personalizado con status y código
 */
const createError = (status, message, code = null) => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
};

module.exports = {
  errorHandler: errorHandler.handle,
  notFoundHandler,
  asyncHandler,
  validateContentType,
  createError
};
