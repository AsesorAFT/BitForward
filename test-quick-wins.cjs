#!/usr/bin/env node

/**
 * 🧪 BitForward Quick Wins Testing Suite
 * 
 * Verifica automáticamente todas las implementaciones de Quick Wins:
 * 1. Lazy Loading
 * 2. Analytics Integration
 * 3. Security Headers
 * 4. Toast Notifications
 * 5. Service Worker
 */

const fs = require('fs');
const path = require('path');

// ANSI Colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
    title: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`)
};

// Test Results
const results = {
    passed: 0,
    failed: 0,
    warnings: 0
};

// Helper: Check if file exists
function fileExists(filePath) {
    return fs.existsSync(path.join(__dirname, filePath));
}

// Helper: Read file content
function readFile(filePath) {
    return fs.readFileSync(path.join(__dirname, filePath), 'utf-8');
}

// Helper: Check if string exists in file
function fileContains(filePath, searchString) {
    const content = readFile(filePath);
    return content.includes(searchString);
}

// Test 1: Lazy Loader
function testLazyLoader() {
    log.title('🧪 Test 1: Lazy Loading');
    
    // Check file exists
    if (!fileExists('js/lazy-loader.js')) {
        log.error('js/lazy-loader.js no existe');
        results.failed++;
        return;
    }
    log.success('js/lazy-loader.js existe');
    results.passed++;
    
    // Check Ethers.js lazy loading
    if (fileContains('js/lazy-loader.js', 'loadEthers') || fileContains('js/lazy-loader.js', 'setupEthersLazyLoad')) {
        log.success('Ethers.js lazy loading implementado');
        results.passed++;
    } else {
        log.error('Ethers.js lazy loading NO encontrado');
        results.failed++;
    }
    
    // Check image lazy loading
    if (fileContains('js/lazy-loader.js', 'IntersectionObserver')) {
        log.success('Image lazy loading con IntersectionObserver');
        results.passed++;
    } else {
        log.warning('IntersectionObserver no encontrado');
        results.warnings++;
    }
    
    // Check index.html integration
    if (fileContains('index.html', 'lazy-loader.js')) {
        log.success('Lazy loader integrado en index.html');
        results.passed++;
    } else {
        log.error('Lazy loader NO integrado en index.html');
        results.failed++;
    }
}

// Test 2: Analytics
function testAnalytics() {
    log.title('🧪 Test 2: Google Analytics 4');
    
    // Check file exists
    if (!fileExists('js/analytics.js')) {
        log.error('js/analytics.js no existe');
        results.failed++;
        return;
    }
    log.success('js/analytics.js existe');
    results.passed++;
    
    // Check GA4 implementation
    if (fileContains('js/analytics.js', 'gtag')) {
        log.success('GA4 gtag implementado');
        results.passed++;
    } else {
        log.error('GA4 gtag NO encontrado');
        results.failed++;
    }
    
    // Check event tracking
    if (fileContains('js/analytics.js', 'trackEvent')) {
        log.success('Event tracking implementado');
        results.passed++;
    } else {
        log.error('Event tracking NO encontrado');
        results.failed++;
    }
    
    // Check Measurement ID configuration
    const analyticsContent = readFile('js/analytics.js');
    if (analyticsContent.includes('G-') && !analyticsContent.includes('G-XXXXXXXXXX')) {
        log.success('GA4 Measurement ID configurado');
        results.passed++;
    } else {
        log.warning('GA4 Measurement ID pendiente de configurar');
        results.warnings++;
    }
    
    // Check index.html integration
    if (fileContains('index.html', 'analytics.js')) {
        log.success('Analytics integrado en index.html');
        results.passed++;
    } else {
        log.error('Analytics NO integrado en index.html');
        results.failed++;
    }
}

// Test 3: Security Headers
function testSecurityHeaders() {
    log.title('🧪 Test 3: Security Headers (CSP)');
    
    // Check file exists
    if (!fileExists('server/middleware/security.js')) {
        log.error('server/middleware/security.js no existe');
        results.failed++;
        return;
    }
    log.success('server/middleware/security.js existe');
    results.passed++;
    
    // Check CSP headers
    if (fileContains('server/middleware/security.js', 'contentSecurityPolicy') || fileContains('server/middleware/security.js', 'Content-Security-Policy')) {
        log.success('CSP headers implementados');
        results.passed++;
    } else {
        log.error('CSP headers NO encontrados');
        results.failed++;
    }
    
    // Check HSTS
    if (fileContains('server/middleware/security.js', 'hsts:') || fileContains('server/middleware/security.js', 'Strict-Transport-Security')) {
        log.success('HSTS implementado');
        results.passed++;
    } else {
        log.error('HSTS NO encontrado');
        results.failed++;
    }
    
    // Check preload
    if (fileContains('server/middleware/security.js', 'preload')) {
        log.success('HSTS preload habilitado');
        results.passed++;
    } else {
        log.warning('HSTS preload no encontrado');
        results.warnings++;
    }
    
    // Check XSS protection
    if (fileContains('server/middleware/security.js', 'X-XSS-Protection')) {
        log.success('XSS Protection habilitado');
        results.passed++;
    } else {
        log.warning('XSS Protection no encontrado');
        results.warnings++;
    }
}

// Test 4: Toast Notifications
function testToastNotifications() {
    log.title('🧪 Test 4: Toast Notifications');
    
    // Check file exists
    if (!fileExists('js/toast.js')) {
        log.error('js/toast.js no existe');
        results.failed++;
        return;
    }
    log.success('js/toast.js existe');
    results.passed++;
    
    // Check toast types
    const toastTypes = ['success', 'error', 'warning', 'info'];
    toastTypes.forEach(type => {
        if (fileContains('js/toast.js', type)) {
            log.success(`Toast tipo '${type}' implementado`);
            results.passed++;
        } else {
            log.error(`Toast tipo '${type}' NO encontrado`);
            results.failed++;
        }
    });
    
    // Check animations
    if (fileContains('js/toast.js', 'animation') || fileContains('js/toast.js', 'transition')) {
        log.success('Animaciones implementadas');
        results.passed++;
    } else {
        log.warning('Animaciones no encontradas');
        results.warnings++;
    }
    
    // Check auto-dismiss
    if (fileContains('js/toast.js', 'setTimeout') || fileContains('js/toast.js', 'duration')) {
        log.success('Auto-dismiss implementado');
        results.passed++;
    } else {
        log.warning('Auto-dismiss no encontrado');
        results.warnings++;
    }
    
    // Check index.html integration
    if (fileContains('index.html', 'toast.js')) {
        log.success('Toast integrado en index.html');
        results.passed++;
    } else {
        log.error('Toast NO integrado en index.html');
        results.failed++;
    }
}

// Test 5: Service Worker
function testServiceWorker() {
    log.title('🧪 Test 5: Service Worker');
    
    // Check if service worker file exists
    if (fileExists('service-worker.js') || fileExists('sw.js')) {
        log.success('Service Worker file existe');
        results.passed++;
    } else {
        log.warning('Service Worker file no encontrado');
        results.warnings++;
    }
    
    // Check registration
    if (fileExists('js/sw-register.js')) {
        log.success('Service Worker registration existe');
        results.passed++;
        
        if (fileContains('js/sw-register.js', 'navigator.serviceWorker.register')) {
            log.success('Service Worker registration implementado');
            results.passed++;
        } else {
            log.error('Service Worker registration NO encontrado');
            results.failed++;
        }
    } else {
        log.warning('js/sw-register.js no encontrado');
        results.warnings++;
    }
    
    // Check index.html integration
    if (fileContains('index.html', 'sw-register') || fileContains('index.html', 'serviceWorker')) {
        log.success('Service Worker integrado en index.html');
        results.passed++;
    } else {
        log.warning('Service Worker no integrado en index.html');
        results.warnings++;
    }
}

// Test 6: Bundle Size Check
function testBundleSize() {
    log.title('🧪 Test 6: Bundle Size Analysis');
    
    // Check if Ethers.js is NOT loaded directly in index.html
    const indexContent = readFile('index.html');
    
    if (indexContent.includes('ethers') && !indexContent.includes('<!-- ethers')) {
        log.warning('Ethers.js está cargado directamente (no lazy)');
        results.warnings++;
    } else {
        log.success('Ethers.js NO se carga directamente (lazy loading correcto)');
        results.passed++;
    }
    
    // Check for other heavy libraries
    const heavyLibs = ['web3.js', 'jquery', 'lodash'];
    let foundHeavy = false;
    
    heavyLibs.forEach(lib => {
        if (indexContent.includes(lib)) {
            log.warning(`Librería pesada detectada: ${lib}`);
            results.warnings++;
            foundHeavy = true;
        }
    });
    
    if (!foundHeavy) {
        log.success('No se detectaron librerías pesadas innecesarias');
        results.passed++;
    }
}

// Test 7: Documentation
function testDocumentation() {
    log.title('🧪 Test 7: Documentation');
    
    // Check QUICK_WINS_SUMMARY.md
    if (fileExists('QUICK_WINS_SUMMARY.md')) {
        log.success('QUICK_WINS_SUMMARY.md existe');
        results.passed++;
    } else {
        log.warning('QUICK_WINS_SUMMARY.md no encontrado');
        results.warnings++;
    }
    
    // Check IMPROVEMENT_PLAN.md
    if (fileExists('IMPROVEMENT_PLAN.md')) {
        log.success('IMPROVEMENT_PLAN.md existe');
        results.passed++;
    } else {
        log.warning('IMPROVEMENT_PLAN.md no encontrado');
        results.warnings++;
    }
}

// Run all tests
function runTests() {
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║          🧪 BITFORWARD QUICK WINS TEST SUITE                      ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
`);
    
    testLazyLoader();
    testAnalytics();
    testSecurityHeaders();
    testToastNotifications();
    testServiceWorker();
    testBundleSize();
    testDocumentation();
    
    // Final Report
    console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║          📊 RESULTADOS DE TESTS                                   ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
`);
    
    log.success(`Tests Passed: ${results.passed}`);
    log.error(`Tests Failed: ${results.failed}`);
    log.warning(`Warnings: ${results.warnings}`);
    
    const total = results.passed + results.failed + results.warnings;
    const successRate = ((results.passed / total) * 100).toFixed(1);
    
    console.log(`\n${colors.bold}Success Rate: ${successRate}%${colors.reset}\n`);
    
    if (results.failed === 0) {
        log.success('✅ TODOS LOS TESTS CRÍTICOS PASARON!');
        console.log('\n🚀 Tu app está lista para production!\n');
    } else {
        log.error(`❌ ${results.failed} tests fallaron. Revisar antes de deploy.`);
    }
    
    // Exit code
    process.exit(results.failed > 0 ? 1 : 0);
}

// Execute
runTests();
