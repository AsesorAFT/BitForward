/**
 * Middleware de Validación de API Key
 * Protege endpoints que requieren autenticación básica
 */

const config = require('../config/config');

/**
 * Middleware para validar API Key en headers
 */
const validateApiKey = (req, res, next) => {
    // Saltar validación en desarrollo si está deshabilitada
    if (config.NODE_ENV === 'development' && !config.FEATURES.AUTHENTICATION_ENABLED) {
        return next();
    }

    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({
            success: false,
            error: 'API Key Required',
            message: 'X-API-Key header es requerido',
            code: 'API_KEY_REQUIRED'
        });
    }

    if (apiKey !== config.API_KEY) {
        return res.status(403).json({
            success: false,
            error: 'Invalid API Key',
            message: 'API Key inválida',
            code: 'INVALID_API_KEY'
        });
    }

    next();
};

/**
 * Middleware de autenticación JWT (placeholder)
 */
const authenticateJWT = (req, res, next) => {
    // Por ahora, pasar directamente
    // En el futuro, validar JWT tokens
    next();
};

module.exports = {
    validateApiKey,
    authenticateJWT
};
