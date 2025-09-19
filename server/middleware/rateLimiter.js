/**
 * Middleware de Rate Limiting para BitForward API
 * Protege contra abuso y ataques DDoS
 */

const { RateLimiterMemory } = require('rate-limiter-flexible');
const config = require('../config/config');

// Rate limiter principal
const rateLimiter = new RateLimiterMemory({
    keyPrefix: 'middleware',
    points: config.RATE_LIMIT_MAX_REQUESTS, // Número de requests
    duration: config.RATE_LIMIT_WINDOW_MS / 1000, // Ventana en segundos
    blockDuration: 60, // Bloquear por 60 segundos si se excede
});

// Rate limiter específico para creación de contratos
const contractCreationLimiter = new RateLimiterMemory({
    keyPrefix: 'contract_creation',
    points: 10, // Máximo 10 contratos por hora
    duration: 3600, // 1 hora
    blockDuration: 3600, // Bloquear por 1 hora
});

// Rate limiter para endpoints de autenticación
const authLimiter = new RateLimiterMemory({
    keyPrefix: 'auth',
    points: 5, // Máximo 5 intentos de login por minuto
    duration: 60, // 1 minuto
    blockDuration: 900, // Bloquear por 15 minutos
});

/**
 * Middleware principal de rate limiting
 */
const rateLimitMiddleware = async (req, res, next) => {
    if (!config.FEATURES.RATE_LIMITING_ENABLED) {
        return next();
    }

    try {
        const key = req.ip;
        await rateLimiter.consume(key);
        next();
    } catch (rejRes) {
        const totalHits = rejRes.totalHits;
        const msBeforeNext = rejRes.msBeforeNext;
        
        res.set({
            'Retry-After': Math.round(msBeforeNext / 1000) || 1,
            'X-RateLimit-Limit': config.RATE_LIMIT_MAX_REQUESTS,
            'X-RateLimit-Remaining': rejRes.remainingPoints || 0,
            'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext).toISOString()
        });

        res.status(429).json({
            success: false,
            error: 'Too Many Requests',
            message: `Límite de ${config.RATE_LIMIT_MAX_REQUESTS} requests por ${config.RATE_LIMIT_WINDOW_MS / 1000 / 60} minutos excedido`,
            retryAfter: Math.round(msBeforeNext / 1000),
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }
};

/**
 * Rate limiting específico para creación de contratos
 */
const contractCreationLimit = async (req, res, next) => {
    if (!config.FEATURES.RATE_LIMITING_ENABLED) {
        return next();
    }

    try {
        const key = req.ip;
        await contractCreationLimiter.consume(key);
        next();
    } catch (rejRes) {
        res.set({
            'Retry-After': Math.round(rejRes.msBeforeNext / 1000) || 1,
            'X-RateLimit-Limit': 10,
            'X-RateLimit-Remaining': rejRes.remainingPoints || 0,
        });

        res.status(429).json({
            success: false,
            error: 'Contract Creation Limit Exceeded',
            message: 'Máximo 10 contratos por hora por IP',
            retryAfter: Math.round(rejRes.msBeforeNext / 1000),
            code: 'CONTRACT_CREATION_LIMIT_EXCEEDED'
        });
    }
};

/**
 * Rate limiting para autenticación
 */
const authLimit = async (req, res, next) => {
    if (!config.FEATURES.RATE_LIMITING_ENABLED) {
        return next();
    }

    try {
        const key = req.ip;
        await authLimiter.consume(key);
        next();
    } catch (rejRes) {
        res.set({
            'Retry-After': Math.round(rejRes.msBeforeNext / 1000) || 1,
        });

        res.status(429).json({
            success: false,
            error: 'Authentication Limit Exceeded',
            message: 'Demasiados intentos de autenticación. Intenta en 15 minutos.',
            retryAfter: Math.round(rejRes.msBeforeNext / 1000),
            code: 'AUTH_LIMIT_EXCEEDED'
        });
    }
};

module.exports = {
    rateLimitMiddleware,
    contractCreationLimit,
    authLimit
};
