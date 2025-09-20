/**
 * Middleware de Autenticación BitForward v2.0
 * Sistema robusto con JWT, rate limiting y gestión de sesiones
 */

const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const database = require('../database/database');
const rateLimit = require('express-rate-limit');

class AuthMiddleware {
    constructor() {
        this.loginAttempts = new Map(); // Track de intentos de login
        this.blockedUsers = new Map(); // Usuarios bloqueados temporalmente
    }

    /**
     * Rate limiter para intentos de login
     */
    createLoginLimiter() {
        return rateLimit({
            windowMs: authConfig.LOGIN_ATTEMPTS.WINDOW_MS,
            max: authConfig.LOGIN_ATTEMPTS.MAX_ATTEMPTS,
            message: {
                success: false,
                error: 'Too Many Login Attempts',
                message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
                code: 'RATE_LIMIT_EXCEEDED'
            },
            standardHeaders: true,
            legacyHeaders: false,
            keyGenerator: (req) => req.body.username || req.ip
        });
    }

    /**
     * Verifica si un usuario está bloqueado
     */
    isUserBlocked(username) {
        const blockInfo = this.blockedUsers.get(username);
        if (!blockInfo) return false;

        if (Date.now() > blockInfo.unblockTime) {
            this.blockedUsers.delete(username);
            return false;
        }

        return true;
    }

    /**
     * Bloquea temporalmente un usuario
     */
    blockUser(username) {
        this.blockedUsers.set(username, {
            blockedAt: Date.now(),
            unblockTime: Date.now() + authConfig.LOGIN_ATTEMPTS.BLOCK_DURATION
        });
    }

    /**
     * Registra intento de login fallido
     */
    recordFailedAttempt(username) {
        const now = Date.now();
        const attempts = this.loginAttempts.get(username) || { count: 0, firstAttempt: now };

        // Reset counter si ha pasado la ventana de tiempo
        if (now - attempts.firstAttempt > authConfig.LOGIN_ATTEMPTS.WINDOW_MS) {
            attempts.count = 1;
            attempts.firstAttempt = now;
        } else {
            attempts.count++;
        }

        this.loginAttempts.set(username, attempts);

        // Bloquear si excede intentos máximos
        if (attempts.count >= authConfig.LOGIN_ATTEMPTS.MAX_ATTEMPTS) {
            this.blockUser(username);
        }
    }

    /**
     * Limpia intentos de login exitoso
     */
    clearFailedAttempts(username) {
        this.loginAttempts.delete(username);
    }

    /**
     * Middleware principal de autenticación JWT
     */
    authenticateToken = async (req, res, next) => {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'Access Token Required',
                    message: 'Token de acceso requerido',
                    code: 'TOKEN_REQUIRED'
                });
            }

            // Verificar token usando la nueva configuración
            const decoded = authConfig.verifyToken(token);
            
            // Verificar que el usuario aún existe y está activo
            const user = await database.get(
                'SELECT id, username, email, is_active, role FROM users WHERE id = ?',
                [decoded.id]
            );

            if (!user || !user.is_active) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid User',
                    message: 'Usuario inválido o inactivo',
                    code: 'INVALID_USER'
                });
            }

            // Agregar información del usuario al request
            req.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role || 'user'
            };

            next();

        } catch (error) {
            if (error.message.includes('expired')) {
                return res.status(401).json({
                    success: false,
                    error: 'Token Expired',
                    message: 'Token ha expirado',
                    code: 'TOKEN_EXPIRED'
                });
            }

            if (error.message.includes('invalid')) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid Token',
                    message: 'Token inválido',
                    code: 'INVALID_TOKEN'
                });
            }

            // Error interno
            return res.status(500).json({
                success: false,
                error: 'Authentication Error',
                message: 'Error en la autenticación',
                code: 'AUTH_ERROR'
            });
        }
    };

    /**
     * Middleware opcional de autenticación
     */
    optionalAuth = async (req, res, next) => {
        try {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (token) {
                const decoded = authConfig.verifyToken(token);
                const user = await database.get(
                    'SELECT id, username, email, is_active, role FROM users WHERE id = ?',
                    [decoded.id]
                );

                if (user && user.is_active) {
                    req.user = {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role || 'user'
                    };
                }
            }

            next();

        } catch (error) {
            // En autenticación opcional, ignorar errores y continuar
            next();
        }
    };

    /**
     * Middleware para verificar roles específicos
     */
    requireRole = (roles) => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Authentication Required',
                    code: 'AUTH_REQUIRED'
                });
            }

            if (!roles.includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    error: 'Insufficient Permissions',
                    message: 'Permisos insuficientes',
                    code: 'INSUFFICIENT_PERMISSIONS'
                });
            }

            next();
        };
    };
}

// Crear instancia del middleware
const authMiddleware = new AuthMiddleware();

module.exports = {
    authenticateToken: authMiddleware.authenticateToken,
    optionalAuth: authMiddleware.optionalAuth,
    requireRole: authMiddleware.requireRole,
    loginLimiter: authMiddleware.createLoginLimiter(),
    recordFailedAttempt: authMiddleware.recordFailedAttempt.bind(authMiddleware),
    clearFailedAttempts: authMiddleware.clearFailedAttempts.bind(authMiddleware),
    isUserBlocked: authMiddleware.isUserBlocked.bind(authMiddleware)
};
