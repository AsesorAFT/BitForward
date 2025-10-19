/**
 * BitForward Authentication Service
 * Servicio para gestión de autenticación con wallets
 * 
 * @author BitForward Team
 * @date 2025-10-19
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ethers } = require('ethers');
const authConfig = require('../config/auth.config');
const logger = require('../utils/logger');

class AuthService {
    constructor() {
        // Almacenamiento en memoria para nonces (en producción usar Redis)
        this.nonces = new Map();
        
        // Almacenamiento de refresh tokens (en producción usar DB)
        this.refreshTokens = new Map();
        
        // Intentos de login por dirección
        this.loginAttempts = new Map();
        
        // Limpiar nonces expirados cada minuto
        setInterval(() => this.cleanupExpiredNonces(), 60000);
        
        // Limpiar intentos de login cada 15 minutos
        setInterval(() => this.cleanupLoginAttempts(), 15 * 60 * 1000);
    }
    
    /**
     * Generar nonce único para autenticación
     */
    generateNonce(address) {
        // Verificar rate limiting
        if (this.isRateLimited(address)) {
            throw new Error('Too many login attempts. Please try again later.');
        }
        
        const nonce = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + authConfig.auth.nonceExpiry;
        
        this.nonces.set(nonce, {
            address: address.toLowerCase(),
            expiresAt,
            used: false
        });
        
        logger.info(`Nonce generated for address: ${address}`);
        
        return {
            nonce,
            message: authConfig.auth.signatureMessage(nonce, address),
            expiresAt
        };
    }
    
    /**
     * Verificar firma de wallet
     */
    async verifySignature(address, signature, nonce) {
        try {
            // Verificar que el nonce existe y es válido
            const nonceData = this.nonces.get(nonce);
            
            if (!nonceData) {
                throw new Error('Invalid or expired nonce');
            }
            
            if (nonceData.used) {
                throw new Error('Nonce already used');
            }
            
            if (Date.now() > nonceData.expiresAt) {
                this.nonces.delete(nonce);
                throw new Error('Nonce expired');
            }
            
            if (nonceData.address !== address.toLowerCase()) {
                throw new Error('Address mismatch');
            }
            
            // Verificar la firma
            const message = authConfig.auth.signatureMessage(nonce, address);
            const recoveredAddress = ethers.verifyMessage(message, signature);
            
            if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
                this.recordFailedAttempt(address);
                throw new Error('Invalid signature');
            }
            
            // Marcar nonce como usado
            nonceData.used = true;
            
            // Limpiar nonce después de uso exitoso
            setTimeout(() => this.nonces.delete(nonce), 5000);
            
            logger.info(`Signature verified successfully for address: ${address}`);
            
            return true;
            
        } catch (error) {
            logger.error(`Signature verification failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Generar access token
     */
    generateAccessToken(address, chainId = 1) {
        const payload = {
            address: address.toLowerCase(),
            chainId,
            type: 'access',
            timestamp: Date.now()
        };
        
        return jwt.sign(payload, authConfig.jwt.accessTokenSecret, {
            expiresIn: authConfig.jwt.accessTokenExpiry,
            issuer: authConfig.jwt.issuer,
            audience: authConfig.jwt.audience
        });
    }
    
    /**
     * Generar refresh token
     */
    generateRefreshToken(address, chainId = 1) {
        const tokenId = crypto.randomBytes(32).toString('hex');
        
        const payload = {
            address: address.toLowerCase(),
            chainId,
            type: 'refresh',
            tokenId,
            timestamp: Date.now()
        };
        
        const token = jwt.sign(payload, authConfig.jwt.refreshTokenSecret, {
            expiresIn: authConfig.jwt.refreshTokenExpiry,
            issuer: authConfig.jwt.issuer,
            audience: authConfig.jwt.audience
        });
        
        // Almacenar refresh token
        const addressKey = address.toLowerCase();
        if (!this.refreshTokens.has(addressKey)) {
            this.refreshTokens.set(addressKey, []);
        }
        
        const tokens = this.refreshTokens.get(addressKey);
        tokens.push({
            tokenId,
            token,
            createdAt: Date.now(),
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000)
        });
        
        // Limitar cantidad de refresh tokens
        if (tokens.length > authConfig.auth.maxRefreshTokens) {
            tokens.shift(); // Remover el más antiguo
        }
        
        return token;
    }
    
    /**
     * Verificar access token
     */
    verifyAccessToken(token) {
        try {
            const decoded = jwt.verify(token, authConfig.jwt.accessTokenSecret, {
                issuer: authConfig.jwt.issuer,
                audience: authConfig.jwt.audience
            });
            
            if (decoded.type !== 'access') {
                throw new Error('Invalid token type');
            }
            
            return decoded;
            
        } catch (error) {
            logger.error(`Access token verification failed: ${error.message}`);
            throw new Error('Invalid or expired token');
        }
    }
    
    /**
     * Verificar refresh token
     */
    verifyRefreshToken(token) {
        try {
            const decoded = jwt.verify(token, authConfig.jwt.refreshTokenSecret, {
                issuer: authConfig.jwt.issuer,
                audience: authConfig.jwt.audience
            });
            
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            
            // Verificar que el token existe en storage
            const addressKey = decoded.address.toLowerCase();
            const tokens = this.refreshTokens.get(addressKey);
            
            if (!tokens || !tokens.find(t => t.tokenId === decoded.tokenId)) {
                throw new Error('Token revoked or invalid');
            }
            
            return decoded;
            
        } catch (error) {
            logger.error(`Refresh token verification failed: ${error.message}`);
            throw new Error('Invalid or expired refresh token');
        }
    }
    
    /**
     * Refrescar access token
     */
    async refreshAccessToken(refreshToken) {
        const decoded = this.verifyRefreshToken(refreshToken);
        
        // Generar nuevo access token
        const newAccessToken = this.generateAccessToken(decoded.address, decoded.chainId);
        
        logger.info(`Access token refreshed for address: ${decoded.address}`);
        
        return {
            accessToken: newAccessToken,
            expiresIn: '15m'
        };
    }
    
    /**
     * Revocar refresh token
     */
    revokeRefreshToken(address, tokenId) {
        const addressKey = address.toLowerCase();
        const tokens = this.refreshTokens.get(addressKey);
        
        if (tokens) {
            const index = tokens.findIndex(t => t.tokenId === tokenId);
            if (index > -1) {
                tokens.splice(index, 1);
                logger.info(`Refresh token revoked for address: ${address}`);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Revocar todos los refresh tokens de una dirección
     */
    revokeAllRefreshTokens(address) {
        const addressKey = address.toLowerCase();
        this.refreshTokens.delete(addressKey);
        logger.info(`All refresh tokens revoked for address: ${address}`);
    }
    
    /**
     * Verificar rate limiting
     */
    isRateLimited(address) {
        const addressKey = address.toLowerCase();
        const attempts = this.loginAttempts.get(addressKey);
        
        if (!attempts) return false;
        
        const recentAttempts = attempts.filter(
            timestamp => Date.now() - timestamp < authConfig.auth.loginAttemptWindow
        );
        
        return recentAttempts.length >= authConfig.auth.maxLoginAttempts;
    }
    
    /**
     * Registrar intento fallido
     */
    recordFailedAttempt(address) {
        const addressKey = address.toLowerCase();
        
        if (!this.loginAttempts.has(addressKey)) {
            this.loginAttempts.set(addressKey, []);
        }
        
        this.loginAttempts.get(addressKey).push(Date.now());
    }
    
    /**
     * Limpiar nonces expirados
     */
    cleanupExpiredNonces() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [nonce, data] of this.nonces.entries()) {
            if (now > data.expiresAt) {
                this.nonces.delete(nonce);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            logger.debug(`Cleaned ${cleaned} expired nonces`);
        }
    }
    
    /**
     * Limpiar intentos de login antiguos
     */
    cleanupLoginAttempts() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [address, attempts] of this.loginAttempts.entries()) {
            const recentAttempts = attempts.filter(
                timestamp => now - timestamp < authConfig.auth.loginAttemptWindow
            );
            
            if (recentAttempts.length === 0) {
                this.loginAttempts.delete(address);
                cleaned++;
            } else if (recentAttempts.length < attempts.length) {
                this.loginAttempts.set(address, recentAttempts);
            }
        }
        
        if (cleaned > 0) {
            logger.debug(`Cleaned login attempts for ${cleaned} addresses`);
        }
    }
    
    /**
     * Obtener estadísticas
     */
    getStats() {
        return {
            activeNonces: this.nonces.size,
            refreshTokens: Array.from(this.refreshTokens.values()).reduce((sum, tokens) => sum + tokens.length, 0),
            addressesWithAttempts: this.loginAttempts.size
        };
    }
}

// Exportar instancia única (Singleton)
module.exports = new AuthService();
