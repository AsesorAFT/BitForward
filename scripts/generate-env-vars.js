#!/usr/bin/env node

/**
 * BitForward - Generate Secure Environment Variables
 * 
 * This script generates secure random values for production environment variables.
 * Run: node scripts/generate-env-vars.js
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔐 BitForward - Environment Variables Generator\n');
console.log('═══════════════════════════════════════════════════\n');

// Generate secure random string
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Generate JWT secrets
const jwtSecret = generateSecret(32);
const jwtRefreshSecret = generateSecret(32);
const sessionSecret = generateSecret(32);
const encryptionKey = generateSecret(32);

console.log('✅ Generated Secure Secrets:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📋 Copy these to your Vercel Environment Variables:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const envVars = [
  { name: 'JWT_SECRET', value: jwtSecret, description: 'Main JWT signing secret' },
  { name: 'JWT_REFRESH_SECRET', value: jwtRefreshSecret, description: 'Refresh token secret' },
  { name: 'SESSION_SECRET', value: sessionSecret, description: 'Session encryption secret' },
  { name: 'ENCRYPTION_KEY', value: encryptionKey, description: 'Data encryption key' }
];

envVars.forEach(({ name, value, description }) => {
  console.log(`${name}:`);
  console.log(`  Value: ${value}`);
  console.log(`  Desc:  ${description}`);
  console.log('');
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Create .env.production.local file
const envContent = `# BitForward - Production Environment Variables
# Generated: ${new Date().toISOString()}
# 
# IMPORTANT: 
# - Never commit this file to Git
# - These are production secrets - keep them secure
# - Copy these values to your hosting provider's dashboard
# - Rotate these secrets regularly

# ============================================
# Authentication & Security
# ============================================

# JWT Secret (Main token signing)
JWT_SECRET=${jwtSecret}

# JWT Refresh Secret (Refresh token signing)
JWT_REFRESH_SECRET=${jwtRefreshSecret}

# Session Secret (Session encryption)
SESSION_SECRET=${sessionSecret}

# Encryption Key (Data encryption)
ENCRYPTION_KEY=${encryptionKey}

# JWT Expiration
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# Application
# ============================================

# Node Environment
NODE_ENV=production

# Server Port (usually set by hosting provider)
PORT=5000

# ============================================
# Database
# ============================================

# For SQLite (default)
DATABASE_PATH=/tmp/bitforward.sqlite3

# For PostgreSQL (uncomment if using)
# DATABASE_URL=postgresql://user:password@host:5432/bitforward

# ============================================
# CORS & Origins
# ============================================

# Allowed Origins (comma-separated, replace with your actual domains)
ALLOWED_ORIGINS=https://bitforward.vercel.app,https://www.bitforward.io

# ============================================
# External APIs (Optional)
# ============================================

# CoinGecko API (optional, for premium features)
COINGECKO_API_KEY=

# Binance API (optional)
BINANCE_API_KEY=
BINANCE_API_SECRET=

# Infura/Alchemy (for Web3)
INFURA_PROJECT_ID=
ALCHEMY_API_KEY=

# ============================================
# Security Settings
# ============================================

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5

# Security Features
ENABLE_HELMET=true
ENABLE_CSP=true
ENABLE_RATE_LIMIT=true

# ============================================
# Monitoring & Analytics (Configure Later)
# ============================================

# Sentry (Error Tracking)
SENTRY_DSN=

# Google Analytics
GA_TRACKING_ID=

# LogRocket (Session Replay)
LOGROCKET_APP_ID=

# ============================================
# Logging
# ============================================

# Log Level (error, warn, info, debug)
LOG_LEVEL=warn

# Enable Debug Mode (false in production)
DEBUG=false
`;

const envFilePath = path.join(__dirname, '..', '.env.production.local');

try {
  fs.writeFileSync(envFilePath, envContent);
  console.log(`✅ Created file: ${envFilePath}\n`);
  console.log('⚠️  IMPORTANT: This file contains sensitive secrets!');
  console.log('   - Do NOT commit this file to Git');
  console.log('   - It\'s already in .gitignore');
  console.log('   - Copy values to your hosting dashboard\n');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📋 Next Steps:\n');
console.log('1. Go to your Vercel dashboard');
console.log('2. Navigate to: Settings → Environment Variables');
console.log('3. Add each variable listed above');
console.log('4. Select "Production" environment');
console.log('5. Click "Save"');
console.log('6. Redeploy your application\n');
console.log('🔗 Vercel Dashboard: https://vercel.com/asesoraft/bitforward/settings/environment-variables\n');
console.log('✅ Done!\n');
