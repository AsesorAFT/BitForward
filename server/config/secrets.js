import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

class SecretsManager {
  constructor() {
    this.secrets = new Map();
    this.loadSecrets();
  }

  loadSecrets() {
    // Cargar desde variables de entorno
    const requiredSecrets = [
      'JWT_SECRET',
      'DB_ENCRYPTION_KEY',
      'API_KEY_SALT',
      'REDIS_URL',
      'ETHEREUM_PRIVATE_KEY',
      'BITCOIN_PRIVATE_KEY',
      'SOLANA_PRIVATE_KEY'
    ];

    const missing = [];

    for (const secret of requiredSecrets) {
      const value = process.env[secret];
      if (!value) {
        missing.push(secret);
      } else {
        this.secrets.set(secret, value);
      }
    }

    if (missing.length > 0 && process.env.NODE_ENV === 'production') {
      throw new Error(`❌ Secretos faltantes en producción: ${missing.join(', ')}`);
    }

    if (missing.length > 0) {
      console.warn(`⚠️  Secretos faltantes (usando valores por defecto): ${missing.join(', ')}`);
    }
  }

  get(key) {
    return this.secrets.get(key) || this.generateDefault(key);
  }

  generateDefault(key) {
    // Solo en desarrollo
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`No se puede generar secreto en producción: ${key}`);
    }

    const defaultValue = crypto.randomBytes(32).toString('hex');
    console.warn(`⚠️  Generando secreto temporal para ${key}`);
    this.secrets.set(key, defaultValue);
    return defaultValue;
  }

  // Encriptar datos sensibles
  encrypt(data) {
    const key = this.get('DB_ENCRYPTION_KEY');
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  // Desencriptar datos
  decrypt(encryptedData) {
    const key = this.get('DB_ENCRYPTION_KEY');
    const algorithm = 'aes-256-gcm';

    const decipher = crypto.createDecipheriv(
      algorithm,
      Buffer.from(key, 'hex'),
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return JSON.parse(decrypted);
  }
}

export default new SecretsManager();
