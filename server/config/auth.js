/**
 * Configuración de Autenticación JWT
 * Sistema robusto para BitForward v2.0
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class AuthConfig {
  constructor() {
    // Generar secreto JWT si no existe en variables de entorno
    this.JWT_SECRET = process.env.JWT_SECRET || this.generateSecureSecret();
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
    this.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    this.BCRYPT_SALT_ROUNDS = 12;

    // Configuración de rate limiting por usuario
    this.LOGIN_ATTEMPTS = {
      MAX_ATTEMPTS: 5,
      WINDOW_MS: 15 * 60 * 1000, // 15 minutos
      BLOCK_DURATION: 30 * 60 * 1000 // 30 minutos
    };
  }

  generateSecureSecret() {
    const secret = crypto.randomBytes(64).toString('hex');
    console.warn('⚠️ Usando JWT_SECRET generado automáticamente. En producción usar variable de entorno.');
    return secret;
  }

  /**
     * Genera un token JWT
     */
  generateToken(payload, expiresIn = this.JWT_EXPIRES_IN) {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn,
      issuer: 'BitForward',
      audience: 'BitForward-Users'
    });
  }

  /**
     * Genera tokens de acceso y refresh
     */
  generateTokenPair(user) {
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'user'
    };

    const accessToken = this.generateToken(tokenPayload, this.JWT_EXPIRES_IN);
    const refreshToken = this.generateToken(
      { id: user.id, type: 'refresh' },
      this.JWT_REFRESH_EXPIRES_IN
    );

    return { accessToken, refreshToken };
  }

  /**
     * Verifica un token JWT
     */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET, {
        issuer: 'BitForward',
        audience: 'BitForward-Users'
      });
    } catch (error) {
      throw new Error(`Token inválido: ${error.message}`);
    }
  }

  /**
     * Hash de contraseña
     */
  async hashPassword(password) {
    return await bcrypt.hash(password, this.BCRYPT_SALT_ROUNDS);
  }

  /**
     * Verificar contraseña
     */
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
     * Genera ID único para sesiones
     */
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }
}

module.exports = new AuthConfig();
