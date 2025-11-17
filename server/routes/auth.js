/**
 * Rutas de Autenticación BitForward v2.0
 * Sistema robusto con JWT, rate limiting y validación exhaustiva
 */

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Importar servicios mejorados
const authConfig = require('../config/auth');
const database = require('../database/database');
const { db } = require('../database/config');
const validationService = require('../validators/validationService');
const { ErrorFactory } = require('../errors/AppError');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  authenticateToken,
  authMiddleware,
  loginLimiter,
  recordFailedAttempt,
  clearFailedAttempts,
  isUserBlocked
} = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * @route   POST /api/auth/register
 * @desc    Registrar un nuevo usuario en BitForward
 * @access  Público
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validación de campos requeridos
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        msg: 'Por favor, proporciona username, email y contraseña.',
        field: !username ? 'username' : !email ? 'email' : 'password'
      });
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        msg: 'Por favor, proporciona un email válido.',
        field: 'email'
      });
    }

    // Validación de contraseña
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        msg: 'La contraseña debe tener al menos 8 caracteres.',
        field: 'password'
      });
    }

    // Validación de fortaleza de contraseña
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        msg: 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 símbolo.',
        field: 'password'
      });
    }

    // Verificar confirmación de contraseña
    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        msg: 'Las contraseñas no coinciden.',
        field: 'confirmPassword'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await db('users')
      .where(function() {
        this.where('email', email.toLowerCase())
          .orWhere('username', username.toLowerCase());
      })
      .first();

    if (existingUser) {
      return res.status(400).json({
        success: false,
        msg: existingUser.email.toLowerCase() === email.toLowerCase()
          ? 'Ya existe una cuenta con este email.'
          : 'El nombre de usuario ya está en uso.',
        field: existingUser.email.toLowerCase() === email.toLowerCase() ? 'email' : 'username'
      });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear nuevo usuario en la base de datos
    const [userId] = await db('users').insert({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password_hash: hashedPassword,
      email_verified: false,
      profile: JSON.stringify({
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        portfolio: {
          totalValue: 0,
          contracts: 0,
          loans: 0
        }
      })
    });

    // Obtener el usuario recién creado
    const newUser = await db('users').where('id', userId).first();

    console.log(`✅ Nuevo usuario registrado: ${username} (${email}) - ID: ${userId}`);

    res.status(201).json({
      success: true,
      msg: 'Usuario registrado exitosamente. ¡Bienvenido a BitForward!',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.created_at
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      msg: 'Error interno del servidor durante el registro.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Autenticar usuario y obtener tokens
 * @access  Público
 */
router.post('/login',
  loginLimiter,
  validationService.createValidationMiddleware(validationService.userAuthSchema),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    // Verificar si el usuario está bloqueado
    if (isUserBlocked(username)) {
      logger.security('Blocked user attempted login', { username, ip: req.ip });
      throw ErrorFactory.authentication('Account temporarily blocked due to multiple failed attempts');
    }

    // Buscar usuario en la base de datos
    const user = await database.get(
      'SELECT id, username, email, password_hash, is_active, role FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (!user) {
      recordFailedAttempt(username);
      logger.security('Login attempt with non-existent user', { username, ip: req.ip });
      throw ErrorFactory.authentication('Invalid credentials');
    }

    if (!user.is_active) {
      logger.security('Login attempt with inactive user', { username: user.username, ip: req.ip });
      throw ErrorFactory.authentication('Account is inactive');
    }

    // Verificar contraseña
    const isValidPassword = await authConfig.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      recordFailedAttempt(username);
      logger.security('Login attempt with invalid password', { username: user.username, ip: req.ip });
      throw ErrorFactory.authentication('Invalid credentials');
    }

    // Login exitoso - generar tokens
    clearFailedAttempts(username);
    const tokens = authConfig.generateTokenPair(user);

    // Registrar login exitoso
    await database.run(
      'INSERT INTO system_events (id, event_type, entity_type, entity_id, data) VALUES (?, ?, ?, ?, ?)',
      [
        uuidv4(),
        'user_login',
        'user',
        user.id,
        JSON.stringify({
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          loginTime: new Date().toISOString()
        })
      ]
    );

    logger.info('User logged in successfully', {
      userId: user.id,
      username: user.username,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role || 'user'
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: authConfig.JWT_EXPIRES_IN
        }
      }
    });
  })
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verificar token y obtener datos del usuario
 * @access  Privado (requiere token)
 */
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    // El middleware ya verificó el token y agregó req.user
    const user = await db('users').where('id', req.user.id).first();

    if (!user) {
      return res.status(404).json({
        success: false,
        msg: 'Usuario no encontrado.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Parsear el perfil JSON
    const profile = user.profile ? JSON.parse(user.profile) : {
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      portfolio: { totalValue: 0, contracts: 0, loans: 0 }
    };

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: profile.avatar,
        portfolio: profile.portfolio,
        emailVerified: user.email_verified,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });

  } catch (error) {
    console.error('Error en verificación:', error);
    res.status(500).json({
      success: false,
      msg: 'Error interno del servidor durante la verificación.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
