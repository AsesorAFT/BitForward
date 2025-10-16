/**
 * Configuración del Servidor BitForward
 * Centraliza todas las variables de entorno y configuraciones
 */

const path = require('path');

const config = {
    // Puerto del servidor
    PORT: process.env.PORT || 3001,
    
    // Entorno de ejecución
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // Base de datos
    DATABASE_PATH: process.env.DATABASE_PATH || path.join(__dirname, '../data/bitforward.db'),
    
    // Seguridad
    JWT_SECRET: process.env.JWT_SECRET || 'bitforward-super-secret-key-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    API_KEY: process.env.API_KEY || 'bf-dev-key-2024',
    
    // CORS
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? 
        process.env.ALLOWED_ORIGINS.split(',') : 
        ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'],
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutos
    RATE_LIMIT_MAX_REQUESTS: process.env.NODE_ENV === 'production' ? 100 : 1000,
    
    // Configuración de contratos
    CONTRACTS: {
        MIN_AMOUNT: 0.001,
        MAX_AMOUNT: 100,
        MIN_EXECUTION_HOURS: 24, // Mínimo 24 horas en el futuro
        MAX_EXECUTION_DAYS: 365, // Máximo 1 año en el futuro
        SUPPORTED_BLOCKCHAINS: ['bitcoin', 'ethereum', 'solana'],
        
        // Límites por blockchain
        LIMITS: {
            bitcoin: { min: 0.001, max: 100 },
            ethereum: { min: 0.01, max: 1000 },
            solana: { min: 0.1, max: 10000 }
        }
    },
    
    // Configuración de logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    
    // Features flags
    FEATURES: {
        AUTHENTICATION_ENABLED: process.env.AUTH_ENABLED !== 'false',
        RATE_LIMITING_ENABLED: process.env.RATE_LIMIT_ENABLED !== 'false',
        CORS_ENABLED: process.env.CORS_ENABLED !== 'false',
        COMPRESSION_ENABLED: process.env.COMPRESSION_ENABLED !== 'false'
    }
};

// Validar configuración crítica
if (config.NODE_ENV === 'production') {
    if (config.JWT_SECRET === 'bitforward-super-secret-key-change-in-production') {
        console.warn('⚠️  ADVERTENCIA: Usando JWT_SECRET por defecto en producción!');
    }
    
    if (config.API_KEY === 'bf-dev-key-2024') {
        console.warn('⚠️  ADVERTENCIA: Usando API_KEY por defecto en producción!');
    }
}

module.exports = config;
