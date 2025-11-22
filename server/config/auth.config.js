/**
 * BitForward Authentication Configuration
 * JWT y configuración de seguridad
 * 
 * @author BitForward Team
 * @date 2025-10-19
 */

require('dotenv').config();

const DEFAULT_ACCESS_SECRET = 'bitforward-access-secret-change-in-production';
const DEFAULT_REFRESH_SECRET = 'bitforward-refresh-secret-change-in-production';
const isProd = process.env.NODE_ENV === 'production';

if (
  isProd &&
  (!process.env.JWT_ACCESS_SECRET ||
    !process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_ACCESS_SECRET === DEFAULT_ACCESS_SECRET ||
    process.env.JWT_REFRESH_SECRET === DEFAULT_REFRESH_SECRET)
) {
  throw new Error('JWT secrets must be set via environment variables in production.');
}

if (!isProd && (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET === DEFAULT_ACCESS_SECRET)) {
  console.warn('⚠️ Using default JWT access secret. Set JWT_ACCESS_SECRET for higher security.');
}

if (!isProd && (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET === DEFAULT_REFRESH_SECRET)) {
  console.warn('⚠️ Using default JWT refresh secret. Set JWT_REFRESH_SECRET for higher security.');
}

module.exports = {
    jwt: {
        // Secret para access tokens (debe estar en .env en producción)
        accessTokenSecret: process.env.JWT_ACCESS_SECRET || DEFAULT_ACCESS_SECRET,
        
        // Secret para refresh tokens
        refreshTokenSecret: process.env.JWT_REFRESH_SECRET || DEFAULT_REFRESH_SECRET,
        
        // Duración de tokens
        accessTokenExpiry: '15m',      // 15 minutos
        refreshTokenExpiry: '7d',      // 7 días
        
        // Issuer y audience
        issuer: 'bitforward-api',
        audience: 'bitforward-client'
    },
    
    auth: {
        // Configuración de nonce para SIWE (Sign-In with Ethereum)
        nonceExpiry: 5 * 60 * 1000,    // 5 minutos en ms
        
        // Mensaje de firma para wallet authentication
        signatureMessage: (nonce, address) => `BitForward Authentication

Please sign this message to authenticate your wallet.

Wallet: ${address}
Nonce: ${nonce}
Timestamp: ${new Date().toISOString()}

This request will not trigger a blockchain transaction or cost any gas fees.`,
        
        // Configuración de sesiones
        sessionExpiry: 7 * 24 * 60 * 60 * 1000,  // 7 días en ms
        
        // Rate limiting por usuario
        maxLoginAttempts: 5,
        loginAttemptWindow: 15 * 60 * 1000,  // 15 minutos
        
        // Refresh token settings
        maxRefreshTokens: 5,  // Máximo de refresh tokens activos por usuario
        
        // Chains permitidas
        allowedChainIds: [1, 5, 137, 80001, 56, 43114],
        
        // Dominios permitidos para CORS
        allowedOrigins: [
            'http://localhost:8080',
            'http://localhost:3000',
            'http://127.0.0.1:8080',
            'https://bitforward.io',
            'https://app.bitforward.io'
        ]
    },
    
    security: {
        // Bcrypt rounds para hashing (si se necesita)
        bcryptRounds: 10,
        
        // Headers de seguridad
        helmet: {
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'", "https://api.coingecko.com", "wss://stream.binance.com"]
                }
            }
        },
        
        // Rate limiting global
        rateLimiter: {
            windowMs: 15 * 60 * 1000,  // 15 minutos
            max: 100,                   // Límite de requests
            message: 'Too many requests from this IP, please try again later.'
        },
        
        // Rate limiting para auth endpoints
        authRateLimiter: {
            windowMs: 15 * 60 * 1000,
            max: 20,
            message: 'Too many authentication attempts, please try again later.'
        }
    }
};
