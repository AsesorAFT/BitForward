#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');
const trackedFiles = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(Boolean);

const forbiddenTrackedFiles = trackedFiles.filter(
  path =>
    path.includes('/node_modules/') ||
    /(^|\/)(?!.*\.example$).*\.(?:db|sqlite|sqlite3)$/i.test(path)
);

assert.deepEqual(
  forbiddenTrackedFiles,
  [],
  `Archivos de runtime o datos versionados: ${forbiddenTrackedFiles.join(', ')}`
);

const index = read('index.html');
const app = read('src/site-v2/cockpit-demo.jsx');
const main = read('src/site-v2/main.jsx');
const styles = read('css/cockpit-demo.css');
const manifest = read('manifest.json');
const publicManifest = read('public/bitforward.webmanifest');
const serviceWorker = read('public/sw.js');
const rootServiceWorker = read('sw.js');
const pwaCleanup = read('js/pwa.js');
const viteConfig = read('vite.config.mjs');
const envExample = read('server/.env.example');

assert.match(
  index,
  /BitForward Mission Control Demo \| AFORTU/i,
  'La portada debe identificarse como demostración'
);
assert.match(
  index,
  /id="bitforward-root"/i,
  'La portada necesita el contenedor estable de la aplicación'
);
assert.match(index, /src="src\/site-v2\/main\.jsx"/i, 'La portada debe cargar la entrada React');
assert.match(
  index,
  /https:\/\/asesoraft\.github\.io\/BitForward\/assets\/brand\/bitforward-social-v2\.jpg/i,
  'La vista previa social debe usar una URL pública estable'
);
assert.doesNotMatch(index, /rel="manifest"/i, 'La demo no debe instalarse como aplicación');
assert.doesNotMatch(
  index,
  /fonts\.googleapis|fonts\.gstatic|api\.coingecko/i,
  'La portada demo no debe abrir conexiones externas'
);

assert.match(main, /CockpitDemo/, 'La entrada debe montar la réplica del cockpit');
assert.match(main, /cockpit-demo\.css/, 'La entrada debe cargar el sistema visual de la demo');
assert.doesNotMatch(main, /bitforward-app\.jsx/, 'La portada no debe montar la landing anterior');

for (const id of [
  'panel',
  'perfil',
  'plan',
  'telemetria',
  'bitacora',
  'navigator',
  'torre',
  'privacidad',
  'pagos',
]) {
  assert.match(app, new RegExp(`id: ['"]${id}['"]`), `Falta el módulo demo ${id}`);
}

assert.match(
  app,
  /DEMO PÚBLICA · DATOS FICTICIOS · NO RECIBE DINERO/i,
  'El banner persistente debe declarar la frontera pública'
);
assert.match(app, /Piloto Demo/g, 'La aplicación debe usar una identidad sintética');
assert.match(app, /MÉTODOS DE PAGO/, 'La demo debe reservar el módulo de pagos');
assert.match(
  app,
  /Esta página no solicita, transmite ni almacena información bancaria/i,
  'El módulo de pagos debe negar la captura bancaria'
);
assert.match(
  app,
  /Configurar método de pago · próximamente/i,
  'El control de pagos debe permanecer deshabilitado'
);
assert.match(
  app,
  /disabled className="demo-disabled-action"/i,
  'El control de pagos no puede ejecutar una acción'
);
assert.match(app, /window\.print\(\)/, 'La Torre debe ofrecer un reporte demo imprimible');
assert.match(
  app,
  /Comprueba la ausencia de almacenamiento/i,
  'Privacidad no debe prometer un reinicio que el control no ejecuta'
);
assert.match(
  styles,
  /DEMO PÚBLICA · DATOS FICTICIOS · SIN VALIDEZ OPERATIVA/i,
  'La impresión debe conservar una marca de agua inequívoca'
);
assert.match(styles, /@page[\s\S]*size:\s*A4 portrait/i, 'El reporte debe declarar formato A4');
assert.match(
  styles,
  /\.demo-tower > \.demo-stepper[\s\S]*display:\s*none !important/i,
  'La impresión debe excluir los controles de Torre'
);
assert.match(
  styles,
  /\.demo-dossier-card[\s\S]*break-inside:\s*avoid/i,
  'El expediente impreso debe evitar cortes internos'
);
assert.match(
  styles,
  /@media \(max-width: 920px\)[\s\S]*\.demo-mobile-dock/i,
  'La navegación móvil debe conservar todos los módulos'
);
assert.match(
  styles,
  /@media \(prefers-reduced-motion: reduce\)/i,
  'La demo debe respetar movimiento reducido'
);

assert.doesNotMatch(
  app,
  /bitforward-premium|jonathangranados1242|chatgpt\.site|@gmail\.com/i,
  'La demo no debe revelar el cockpit o al propietario'
);
assert.doesNotMatch(
  app,
  /\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/i,
  'La réplica estática no debe ejecutar solicitudes de datos'
);
assert.doesNotMatch(
  app,
  /localStorage|sessionStorage|indexedDB/i,
  'La réplica no debe persistir información en el navegador'
);
assert.doesNotMatch(
  app,
  /<(?:input|textarea|form)\b/i,
  'La réplica no debe ofrecer captura libre de datos'
);
assert.doesNotMatch(
  app,
  /(?:import|from|require\s*\()[^\n]*(?:stripe|paypal|mercadopago|ethers|web3|wallet)/i,
  'La réplica no puede importar SDK de credenciales, wallet o pago'
);
assert.doesNotMatch(
  app,
  /(?:type|name|id)=["'](?:password|email|cvv|clabe|card|wallet|private-key|seed)["']/i,
  'La réplica no puede declarar campos de credenciales o pago'
);
assert.doesNotMatch(app, /href=["']https?:\/\//i, 'La réplica no debe enlazar servicios externos');

assert.equal(manifest, publicManifest, 'El manifiesto fuente y el público deben coincidir');
assert.equal(serviceWorker, rootServiceWorker, 'Los service workers de retiro deben coincidir');
assert.match(manifest, /Mission Control · Demo pública/i, 'El manifiesto debe decir demo');
assert.match(manifest, /"display": "browser"/i, 'La demo debe mantener visible el navegador');
assert.match(manifest, /"shortcuts": \[\]/i, 'La demo no debe ofrecer accesos instalables');
assert.match(
  serviceWorker,
  /self\.registration\.unregister\(\)/i,
  'El service worker heredado debe retirarse'
);
assert.match(
  pwaCleanup,
  /getRegistrations\(\)[\s\S]*unregister\(\)/i,
  'La página debe limpiar instalaciones PWA heredadas'
);
assert.match(
  pwaCleanup,
  /registrationPath\.startsWith\(appScopePath\)/i,
  'La limpieza PWA debe limitarse al scope actual de BitForward'
);
assert.match(
  pwaCleanup,
  /startsWith\(['"]bitforward-public-['"]\)/i,
  'La página sólo debe retirar la familia histórica de cachés públicas'
);
assert.match(
  serviceWorker,
  /startsWith\(['"]bitforward-public-['"]\)/i,
  'El service worker sólo debe retirar la familia histórica de cachés públicas'
);

for (const path of [
  'public/assets/brand/bitforward-app-icon-192.png',
  'public/assets/brand/bitforward-app-icon-512.png',
  'public/assets/brand/bitforward-logo-v2.webp',
  'public/assets/brand/bitforward-social-v2.jpg',
  'assets/brand/hero-intelligence.webp',
  'assets/brand/rocket-hero-v2.webp',
]) {
  assert.ok(existsSync(path), `Falta el recurso público ${path}`);
  assert.ok(statSync(path).size > 1000, `El recurso público ${path} parece vacío`);
}

assert.doesNotMatch(
  viteConfig,
  /(?:trading|lending|dashboard|enterprise):\s*resolve/i,
  'El build público no debe incluir rutas operativas del laboratorio'
);
assert.doesNotMatch(
  viteConfig,
  /['"](?:mission-control|about)['"]:\s*resolve/i,
  'El artefacto público debe contener únicamente la réplica del cockpit'
);
assert.match(
  viteConfig,
  /emptyOutDir:\s*true/i,
  'Cada build debe retirar bundles obsoletos antes de publicar'
);
assert.match(
  viteConfig,
  /process\.env\.ANALYZE === ['"]true['"]/i,
  'El mapa del bundle debe permanecer desactivado en publicaciones normales'
);
assert.doesNotMatch(
  viteConfig,
  /filename:\s*['"]\.\/dist\/stats\.html['"]/i,
  'El mapa técnico del bundle no debe escribirse dentro del artefacto público'
);
assert.doesNotMatch(
  envExample,
  /(?:DEPLOYER_PRIVATE_KEY|SERVER_PRIVATE_KEY)=0x[0-9a-f]{64}/i,
  'El archivo de ejemplo no puede contener claves privadas completas'
);

assert.match(index, /<!doctype html>/i, 'index.html no tiene doctype');
assert.match(index, /<title>[^<]+<\/title>/i, 'index.html no tiene título');

console.log(`Validación estática completada: ${trackedFiles.length} archivos rastreados.`);
