/**
 * Middleware de Manejo de Errores para BitForward API
 * Centraliza el manejo de errores y proporciona respuestas consistentes
 */

const config = require('../config/config');

/**
 * Middleware de manejo de errores global
 */
const errorHandler = (error, req, res, next) => {
    console.error('Error capturado por errorHandler:', {
        message: error.message,
        stack: config.NODE_ENV === 'development' ? error.stack : undefined,
        url: req.url,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    // Error de validación de Joi
    if (error.isJoi) {
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

    // Error de base de datos SQLite
    if (error.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({
            success: false,
            error: 'Database Constraint Error',
            message: 'Violación de restricción en la base de datos',
            details: error.message,
            code: 'DATABASE_CONSTRAINT_ERROR',
            timestamp: new Date().toISOString()
        });
    }

    // Error de base de datos general
    if (error.code && error.code.startsWith('SQLITE_')) {
        return res.status(500).json({
            success: false,
            error: 'Database Error',
            message: 'Error en la operación de base de datos',
            code: 'DATABASE_ERROR',
            timestamp: new Date().toISOString()
        });
    }

    // Error de JSON malformado
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({
            success: false,
            error: 'Invalid JSON',
            message: 'El JSON proporcionado no es válido',
            code: 'INVALID_JSON',
            timestamp: new Date().toISOString()
        });
    }

    // Error personalizado con status
    if (error.status || error.statusCode) {
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

    // Error interno del servidor (500)
    res.status(500).json({
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
};

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
    errorHandler,
    notFoundHandler,
    asyncHandler,
    validateContentType,
    createError
};
