import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTRACTS_DIR = path.join(__dirname, '../contracts');
const REPORT_DIR = path.join(__dirname, '../audit-reports');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createReportDir() {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
}

function runSolhint() {
  log('\n🔍 Ejecutando Solhint...', 'blue');
  try {
    const output = execSync('npx solhint "contracts/**/*.sol"', {
      encoding: 'utf8',
      stdio: 'pipe'
    });

    const reportPath = path.join(REPORT_DIR, 'solhint-report.txt');
    fs.writeFileSync(reportPath, output);

    log('✅ Solhint completado - Sin errores críticos', 'green');
    return { success: true, warnings: 0, errors: 0 };
  } catch (error) {
    const reportPath = path.join(REPORT_DIR, 'solhint-report.txt');
    fs.writeFileSync(reportPath, error.stdout || error.message);

    const errorCount = (error.stdout.match(/error/gi) || []).length;
    const warningCount = (error.stdout.match(/warning/gi) || []).length;

    log(`⚠️  Solhint encontró: ${errorCount} errores, ${warningCount} advertencias`, 'yellow');
    return { success: errorCount === 0, warnings: warningCount, errors: errorCount };
  }
}

function runSlither() {
  log('\n🔍 Ejecutando Slither...', 'blue');

  // Verificar si Slither está instalado
  try {
    execSync('slither --version', { stdio: 'pipe' });
  } catch (error) {
    log('❌ Slither no está instalado. Instálalo con: pip3 install slither-analyzer', 'red');
    return { success: false, skipped: true };
  }

  try {
    const output = execSync('slither . --json -', {
      encoding: 'utf8',
      cwd: process.cwd(),
      stdio: 'pipe'
    });

    const reportPath = path.join(REPORT_DIR, 'slither-report.json');
    fs.writeFileSync(reportPath, output);

    const results = JSON.parse(output);
    const critical = results.results?.detectors?.filter(d => d.impact === 'High') || [];
    const medium = results.results?.detectors?.filter(d => d.impact === 'Medium') || [];

    if (critical.length > 0) {
      log(`❌ Slither encontró ${critical.length} vulnerabilidades críticas`, 'red');
      return { success: false, critical: critical.length, medium: medium.length };
    } else if (medium.length > 0) {
      log(`⚠️  Slither encontró ${medium.length} vulnerabilidades de severidad media`, 'yellow');
    } else {
      log('✅ Slither completado - Sin vulnerabilidades críticas', 'green');
    }

    return { success: true, critical: 0, medium: medium.length };
  } catch (error) {
    const reportPath = path.join(REPORT_DIR, 'slither-report.txt');
    fs.writeFileSync(reportPath, error.stdout || error.message);

    log('⚠️  Slither encontró problemas - revisar reporte', 'yellow');
    return { success: false, error: error.message };
  }
}

function checkOpenZeppelinUsage() {
  log('\n🔍 Verificando uso de OpenZeppelin...', 'blue');

  const solidityFiles = [];
  function findSolidityFiles(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        findSolidityFiles(filePath);
      } else if (file.endsWith('.sol')) {
        solidityFiles.push(filePath);
      }
    });
  }

  if (fs.existsSync(CONTRACTS_DIR)) {
    findSolidityFiles(CONTRACTS_DIR);

    let ozUsage = 0;
    solidityFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('@openzeppelin/contracts')) {
        ozUsage++;
      }
    });

    const percentage = solidityFiles.length > 0
      ? ((ozUsage / solidityFiles.length) * 100).toFixed(1)
      : 0;

    log(`📊 ${ozUsage}/${solidityFiles.length} contratos usan OpenZeppelin (${percentage}%)`, 'blue');

    if (percentage < 50) {
      log('⚠️  Recomendación: Considera usar más contratos de OpenZeppelin', 'yellow');
    } else {
      log('✅ Buen uso de bibliotecas auditadas', 'green');
    }
  } else {
    log('⚠️  No se encontró directorio de contratos', 'yellow');
  }
}

function generateSummaryReport(solhintResult, slitherResult) {
  const timestamp = new Date().toISOString();
  const report = `
╔════════════════════════════════════════════════════════════════╗
║            REPORTE DE AUDITORÍA DE SMART CONTRACTS             ║
║                    ${timestamp}                    ║
╚════════════════════════════════════════════════════════════════╝

📋 RESULTADOS DE SOLHINT:
   • Errores: ${solhintResult.errors || 0}
   • Advertencias: ${solhintResult.warnings || 0}
   • Estado: ${solhintResult.success ? '✅ APROBADO' : '❌ REQUIERE ATENCIÓN'}

📋 RESULTADOS DE SLITHER:
   • Vulnerabilidades Críticas: ${slitherResult.critical || 0}
   • Vulnerabilidades Medias: ${slitherResult.medium || 0}
   • Estado: ${slitherResult.success ? '✅ APROBADO' : '❌ REQUIERE ATENCIÓN'}
   ${slitherResult.skipped ? '   (Slither no instalado - ejecutar: pip3 install slither-analyzer)' : ''}

🎯 RECOMENDACIONES:
   ${solhintResult.errors > 0 ? '   • Corregir errores de Solhint antes de desplegar' : ''}
   ${slitherResult.critical > 0 ? '   • CRÍTICO: Resolver vulnerabilidades de alto impacto' : ''}
   ${slitherResult.medium > 0 ? '   • Revisar vulnerabilidades de severidad media' : ''}
   ${!slitherResult.skipped && slitherResult.success && solhintResult.success
    ? '   • ✅ Los contratos pasan las validaciones básicas de seguridad'
    : ''}

📁 Reportes detallados guardados en: ${REPORT_DIR}

══════════════════════════════════════════════════════════════════
`;

  const summaryPath = path.join(REPORT_DIR, 'summary.txt');
  fs.writeFileSync(summaryPath, report);

  console.log(report);
}

// Ejecutar auditoría
async function main() {
  log('🚀 Iniciando auditoría de Smart Contracts...', 'magenta');
  log('══════════════════════════════════════════════════', 'magenta');

  createReportDir();

  const solhintResult = runSolhint();
  const slitherResult = runSlither();

  checkOpenZeppelinUsage();

  generateSummaryReport(solhintResult, slitherResult);

  // Salir con código de error si hay problemas críticos
  if (!solhintResult.success || !slitherResult.success) {
    log('\n❌ Auditoría completada con errores', 'red');
    process.exit(1);
  }

  log('\n✅ Auditoría completada exitosamente', 'green');
  process.exit(0);
}

main().catch(error => {
  log(`\n❌ Error durante la auditoría: ${error.message}`, 'red');
  process.exit(1);
});
