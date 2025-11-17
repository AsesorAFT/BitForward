import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  const envPath = path.join(__dirname, '../.env');
  const envExamplePath = path.join(__dirname, '../.env.example');

  log('\n🔍 Verificando configuración de variables de entorno...', 'cyan');
  log('═══════════════════════════════════════════════════════', 'cyan');

  // Verificar si existe .env
  if (!fs.existsSync(envPath)) {
    log('\n❌ Archivo .env no encontrado', 'red');

    if (fs.existsSync(envExamplePath)) {
      log('\n💡 Solución:', 'yellow');
      log('   1. Copia .env.example a .env:', 'yellow');
      log('      cp .env.example .env', 'cyan');
      log('   2. Rellena los valores necesarios', 'yellow');
    }

    return false;
  }

  log('✅ Archivo .env encontrado', 'green');
  return true;
}

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const vars = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      vars[key.trim()] = valueParts.join('=').trim();
    }
  });

  return vars;
}

function checkRequiredVars() {
  log('\n🔑 Verificando variables requeridas...', 'cyan');

  const requiredVars = {
    production: [
      'NODE_ENV',
      'PORT',
      'JWT_SECRET',
      'DB_ENCRYPTION_KEY',
      'REDIS_URL',
      'ETHEREUM_RPC_URL',
      'CORS_ORIGIN'
    ],
    development: [
      'NODE_ENV',
      'PORT'
    ]
  };

  const envPath = path.join(__dirname, '../.env');
  const envVars = parseEnvFile(envPath);
  const isProduction = envVars.NODE_ENV === 'production';

  const required = isProduction ? requiredVars.production : requiredVars.development;
  const missing = [];
  const weak = [];

  for (const varName of required) {
    const value = envVars[varName];

    if (!value) {
      missing.push(varName);
      log(`   ❌ ${varName}: NO DEFINIDA`, 'red');
    } else if (value.includes('<') || value.includes('YOUR_')) {
      weak.push(varName);
      log(`   ⚠️  ${varName}: Usar valor de ejemplo`, 'yellow');
    } else if (varName.includes('SECRET') || varName.includes('KEY')) {
      // Verificar longitud de secretos
      if (value.length < 32) {
        weak.push(varName);
        log(`   ⚠️  ${varName}: Demasiado corto (mínimo 32 caracteres)`, 'yellow');
      } else {
        log(`   ✅ ${varName}: OK`, 'green');
      }
    } else {
      log(`   ✅ ${varName}: OK`, 'green');
    }
  }

  return { missing, weak, isProduction };
}

function checkFilePermissions() {
  log('\n🔒 Verificando permisos de archivos sensibles...', 'cyan');

  const sensitiveFiles = [
    '.env',
    'server/database/bitforward.sqlite3',
  ];

  for (const file of sensitiveFiles) {
    const filePath = path.join(__dirname, '..', file);

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const mode = (stats.mode & parseInt('777', 8)).toString(8);

      // En producción, archivos sensibles deben ser 600 o más restrictivos
      if (process.env.NODE_ENV === 'production' && mode !== '600') {
        log(`   ⚠️  ${file}: Permisos ${mode} (recomendado: 600)`, 'yellow');
        log(`      Corregir con: chmod 600 ${file}`, 'cyan');
      } else {
        log(`   ✅ ${file}: Permisos OK (${mode})`, 'green');
      }
    }
  }
}

function checkGitignore() {
  log('\n📄 Verificando .gitignore...', 'cyan');

  const gitignorePath = path.join(__dirname, '../.gitignore');

  if (!fs.existsSync(gitignorePath)) {
    log('   ❌ .gitignore no encontrado', 'red');
    return;
  }

  const content = fs.readFileSync(gitignorePath, 'utf8');
  const requiredEntries = [
    '.env',
    '.env.local',
    '.env.*.local',
    'node_modules',
    '*.sqlite3',
    '*.log'
  ];

  const missing = requiredEntries.filter(entry => !content.includes(entry));

  if (missing.length > 0) {
    log('   ⚠️  Entradas faltantes en .gitignore:', 'yellow');
    missing.forEach(entry => log(`      - ${entry}`, 'yellow'));
  } else {
    log('   ✅ .gitignore configurado correctamente', 'green');
  }
}

function generateSecrets() {
  log('\n🔐 Generador de secretos seguros:', 'magenta');
  log('═══════════════════════════════════════════════════════', 'magenta');

  const secrets = {
    JWT_SECRET: crypto.randomBytes(64).toString('hex'),
    DB_ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex'),
    API_KEY_SALT: crypto.randomBytes(32).toString('hex'),
    CSRF_SECRET: crypto.randomBytes(32).toString('hex')
  };

  log('\nCopia estos valores a tu archivo .env:\n', 'cyan');

  for (const [key, value] of Object.entries(secrets)) {
    log(`${key}=${value}`, 'green');
  }

  log('\n⚠️  IMPORTANTE: Guarda estos valores de forma segura', 'yellow');
}

function printSummary(results) {
  log('\n📊 RESUMEN DE SEGURIDAD', 'magenta');
  log('═══════════════════════════════════════════════════════', 'magenta');

  const { missing, weak, isProduction } = results;

  if (missing.length === 0 && weak.length === 0) {
    log('\n✅ Configuración de seguridad: EXCELENTE', 'green');
  } else if (missing.length > 0) {
    log('\n❌ Configuración de seguridad: CRÍTICA', 'red');
    log(`   ${missing.length} variable(s) faltante(s)`, 'red');

    if (isProduction) {
      log('\n⚠️  NO DESPLEGAR EN PRODUCCIÓN', 'red');
      process.exit(1);
    }
  } else if (weak.length > 0) {
    log('\n⚠️  Configuración de seguridad: MEJORABLE', 'yellow');
    log(`   ${weak.length} variable(s) con valores débiles`, 'yellow');
  }

  log('\n💡 Recomendaciones:', 'cyan');
  log('   • Usa secretos fuertes (mínimo 32 caracteres aleatorios)', 'cyan');
  log('   • Nunca commitees archivos .env al repositorio', 'cyan');
  log('   • Rota secretos regularmente en producción', 'cyan');
  log('   • Usa servicios como HashiCorp Vault en producción', 'cyan');
}

// Ejecutar verificación
async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'magenta');
  log('║         VERIFICACIÓN DE SEGURIDAD Y CONFIGURACIÓN          ║', 'magenta');
  log('╚════════════════════════════════════════════════════════════╝', 'magenta');

  const hasEnv = checkEnvFile();

  if (!hasEnv) {
    log('\n💡 ¿Quieres generar secretos seguros ahora? (s/n): ', 'cyan');
    generateSecrets();
    process.exit(0);
  }

  const results = checkRequiredVars();
  checkFilePermissions();
  checkGitignore();
  printSummary(results);

  log('\n✅ Verificación completada\n', 'green');
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});
