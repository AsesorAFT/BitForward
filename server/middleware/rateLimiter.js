/**
 * Middleware de Rate Limiting para BitForward API
 * Protege contra abuso y ataques DDoS
 */

const rateLimit = require('express-rate-limit');

// Rate limiter principal
const rateLimitMiddleware = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por IP
  message: {
    success: false,
    error: 'Rate Limit Exceeded',
    message: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  skip: (req) => {
    // Skip rate limiting para health checks
    return req.path === '/api/health';
  }
});

// Rate limiter para creación de contratos
const contractCreationLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 contratos por hora
  message: {
    success: false,
    error: 'Contract Creation Limit Exceeded',
    message: 'Máximo 10 contratos por hora por IP',
    code: 'CONTRACT_CREATION_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter para autenticación
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por IP
  message: {
    success: false,
    error: 'Authentication Limit Exceeded',
    message: 'Demasiados intentos de autenticación.',
    code: 'AUTH_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.body.username || req.ip
});

// Rate limiter estricto para wallet authentication
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // máximo 20 intentos
  message: {
    success: false,
    error: 'Wallet Auth Limit Exceeded',
    message: 'Demasiados intentos de autenticación de wallet.',
    code: 'WALLET_AUTH_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const address = req.body?.address || req.query?.address;
    return address ? `${req.ip}-${address}` : req.ip;
  }
});

// Rate limiter permisivo para endpoints públicos
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // 200 requests
  message: {
    success: false,
    error: 'Public API Limit Exceeded',
    message: 'Demasiadas peticiones al API público.',
    code: 'PUBLIC_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  rateLimitMiddleware,
  contractCreationLimit,
  authLimit,
  authRateLimiter,
  publicLimiter
};
