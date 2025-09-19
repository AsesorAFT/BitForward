/**
 * Middleware de Autenticación JWT
 * Maneja la validación de tokens JWT para rutas protegidas
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const database = require('../database/database');

/**
 * Middleware de autenticación JWT
 */
const authenticateToken = async (req, res, next) => {
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

        // Verificar token
        const decoded = jwt.verify(token, config.JWT_SECRET);
        
        // Verificar que el usuario aún existe y está activo
        const user = await database.get(
            'SELECT id, username, email, is_active FROM users WHERE id = ?',
            [decoded.userId]
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
            email: user.email
        };

        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token Expired',
                message: 'Token ha expirado',
                code: 'TOKEN_EXPIRED'
            });
        }

        if (error.name === 'JsonWebTokenError') {
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
 * Middleware opcional de autenticación (no falla si no hay token)
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, config.JWT_SECRET);
            const user = await database.get(
                'SELECT id, username, email, is_active FROM users WHERE id = ?',
                [decoded.userId]
            );

            if (user && user.is_active) {
                req.user = {
                    id: user.id,
                    username: user.username,
                    email: user.email
                };
            }
        }

        next();

    } catch (error) {
        // En autenticación opcional, ignorar errores y continuar
        next();
    }
};

module.exports = {
    authenticateToken,
    optionalAuth
};
