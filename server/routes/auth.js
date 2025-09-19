/**
 * API Routes para Autenticación BitForward
 * Maneja registro, login y gestión de usuarios
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');
const database = require('../database/database');
const config = require('../config/config');
const { authLimit } = require('../middleware/rateLimiter');

const router = express.Router();

// Esquemas de validación
const registerSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    walletAddress: Joi.string().optional()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

/**
 * POST /api/auth/register
 * Registra un nuevo usuario
 */
router.post('/register', authLimit, async (req, res, next) => {
    try {
        // Validar datos de entrada
        const { error, value } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Datos de registro inválidos',
                details: error.details.map(d => d.message),
                code: 'VALIDATION_ERROR'
            });
        }

        const { username, email, password, walletAddress } = value;

        // Verificar si el usuario ya existe
        const existingUser = await database.get(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email, username]
        );

        if (existingUser) {
            return res.status(409).json({
                success: false,
                error: 'Usuario ya existe',
                message: 'El email o nombre de usuario ya está registrado',
                code: 'USER_ALREADY_EXISTS'
            });
        }

        // Hash de la contraseña
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Crear usuario
        const userId = uuidv4();
        const now = new Date().toISOString();

        await database.run(`
            INSERT INTO users (id, username, email, password_hash, wallet_address, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [userId, username, email, passwordHash, walletAddress || null, now]);

        // Generar JWT token
        const token = jwt.sign(
            { 
                userId, 
                username, 
                email 
            },
            config.JWT_SECRET,
            { 
                expiresIn: config.JWT_EXPIRES_IN,
                issuer: 'bitforward-api',
                audience: 'bitforward-client'
            }
        );

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: {
                    id: userId,
                    username,
                    email,
                    walletAddress: walletAddress || null,
                    createdAt: now
                },
                token,
                expiresIn: config.JWT_EXPIRES_IN
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/login
 * Autentica a un usuario existente
 */
router.post('/login', authLimit, async (req, res, next) => {
    try {
        // Validar datos de entrada
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Datos de login inválidos',
                details: error.details.map(d => d.message),
                code: 'VALIDATION_ERROR'
            });
        }

        const { email, password } = value;

        // Buscar usuario
        const user = await database.get(
            'SELECT * FROM users WHERE email = ? AND is_active = 1',
            [email]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas',
                message: 'Email o contraseña incorrectos',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Verificar contraseña
        const passwordValid = await bcrypt.compare(password, user.password_hash);
        if (!passwordValid) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas',
                message: 'Email o contraseña incorrectos',
                code: 'INVALID_CREDENTIALS'
            });
        }

        // Actualizar último login
        await database.run(
            'UPDATE users SET updated_at = ? WHERE id = ?',
            [new Date().toISOString(), user.id]
        );

        // Generar JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                email: user.email 
            },
            config.JWT_SECRET,
            { 
                expiresIn: config.JWT_EXPIRES_IN,
                issuer: 'bitforward-api',
                audience: 'bitforward-client'
            }
        );

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    walletAddress: user.wallet_address,
                    createdAt: user.created_at
                },
                token,
                expiresIn: config.JWT_EXPIRES_IN
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/auth/profile
 * Obtiene el perfil del usuario autenticado
 */
router.get('/profile', async (req, res, next) => {
    try {
        // Por ahora, retornar un perfil de ejemplo
        // En el futuro, esto requerirá middleware de autenticación
        res.json({
            success: true,
            message: 'Perfil de usuario (demo)',
            data: {
                user: {
                    id: 'demo-user-id',
                    username: 'demo_user',
                    email: 'demo@bitforward.com',
                    walletAddress: null,
                    createdAt: new Date().toISOString()
                },
                stats: {
                    totalContracts: 0,
                    activeContracts: 0,
                    completedContracts: 0
                }
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/refresh
 * Renueva un token JWT
 */
router.post('/refresh', async (req, res, next) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Token requerido',
                code: 'TOKEN_REQUIRED'
            });
        }

        try {
            // Verificar token existente (permitir tokens expirados para refresh)
            const decoded = jwt.verify(token, config.JWT_SECRET, { ignoreExpiration: true });
            
            // Verificar que el usuario aún existe y está activo
            const user = await database.get(
                'SELECT * FROM users WHERE id = ? AND is_active = 1',
                [decoded.userId]
            );

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario no válido',
                    code: 'INVALID_USER'
                });
            }

            // Generar nuevo token
            const newToken = jwt.sign(
                { 
                    userId: user.id, 
                    username: user.username, 
                    email: user.email 
                },
                config.JWT_SECRET,
                { 
                    expiresIn: config.JWT_EXPIRES_IN,
                    issuer: 'bitforward-api',
                    audience: 'bitforward-client'
                }
            );

            res.json({
                success: true,
                message: 'Token renovado exitosamente',
                data: {
                    token: newToken,
                    expiresIn: config.JWT_EXPIRES_IN
                },
                timestamp: new Date().toISOString()
            });

        } catch (jwtError) {
            return res.status(401).json({
                success: false,
                error: 'Token inválido',
                code: 'INVALID_TOKEN'
            });
        }

    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/logout
 * Logout del usuario (en el futuro, invalidar token)
 */
router.post('/logout', async (req, res, next) => {
    try {
        // En una implementación completa, aquí invalidaríamos el token
        // Por ahora, simplemente retornamos éxito
        res.json({
            success: true,
            message: 'Logout exitoso',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
