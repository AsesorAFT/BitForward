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

// Preserve the existing public-demo contract on its dedicated route.
const index = read('cockpit.html');
const home = read('index.html');
const editorial = read('src/editorial/main.js');
assert.match(home, /BitForward \| Laboratorio cripto de AFORTU/);
for (const section of ['misiones', 'reporta', 'bitacora', 'seguridad']) {
  assert.ok(home.includes(`id="${section}"`), `Falta la sección editorial ${section}`);
}
assert.doesNotMatch(editorial, /\b(?:fetch|XMLHttpRequest|WebSocket|localStorage)\b/);
assert.doesNotMatch(home, /<iframe|<form|type="password"/i);
assert.match(home, /advisor-atf-approved\.webp/);
assert.match(home, /instagram\.com\/bitforward_aft/);
assert.match(home, /datetime="2026-09-07"/);

const app = read('src/site-v2/cockpit-demo.jsx');
const readme = read('README.md');
const main = read('src/site-v2/main.jsx');
const styles = read('css/cockpit-demo.css');
const manifest = read('manifest.json');
const publicManifest = read('public/bitforward.webmanifest');
const robots = read('public/robots.txt');
const serviceWorker = read('public/sw.js');
const rootServiceWorker = read('sw.js');
const pwaCleanup = read('js/pwa.js');
const viteConfig = read('vite.config.mjs');
const envExample = read('server/.env.example');

assert.match(
  index,
  /BitForward Mission Control \| Experiencia pública de AFORTU/i,
  'La portada debe identificarse como experiencia pública'
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
assert.doesNotMatch(
  index,
  /rel="manifest"/i,
  'La versión pública no debe instalarse como aplicación'
);
assert.doesNotMatch(
  index,
  /fonts\.googleapis|fonts\.gstatic|api\.coingecko/i,
  'La portada pública no debe abrir conexiones externas'
);

assert.match(main, /CockpitDemo/, 'La entrada debe montar la réplica del cockpit');
assert.match(
  main,
  /cockpit-demo\.css/,
  'La entrada debe cargar el sistema visual de la experiencia pública'
);
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
  assert.match(app, new RegExp(`id: ['"]${id}['"]`), `Falta el módulo público ${id}`);
}

assert.match(
  app,
  /VERSIÓN PÚBLICA EDUCATIVA · DATOS ILUSTRATIVOS · SIN OPERACIÓN REAL/i,
  'El banner persistente debe declarar la frontera pública'
);
assert.match(app, /Piloto Explorador/g, 'La aplicación debe usar una identidad sintética');
assert.doesNotMatch(
  `${app}\n${readme}`,
  /advisoryPartners|Equipo promotor de AFORTU|Certificación individual|partner\.(?:name|role|credential)|initials:/i,
  'La experiencia pública no debe identificar socios ni exponer credenciales personales'
);
assert.match(
  readme,
  /identifica únicamente a AFORTU como institución/i,
  'La documentación pública debe mantener una representación exclusivamente institucional'
);
assert.match(
  app,
  /acreditaciones aplicables se documentan[\s\S]*instrumentos contractuales correspondientes/i,
  'La representación profesional debe remitirse discretamente a los contratos aplicables'
);
assert.match(
  app,
  /pilot-astronaut-v3\.webp/,
  'El cockpit debe conservar al astronauta como protagonista visual'
);
assert.match(
  app,
  /className="demo-pilot-astronaut"[\s\S]*width="800"[\s\S]*height="1200"/i,
  'El astronauta debe declarar dimensiones estables'
);
assert.match(app, /MÉTODOS DE PAGO/, 'La versión pública debe reservar el módulo de pagos');
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
assert.match(app, /window\.print\(\)/, 'La Torre debe ofrecer un reporte ilustrativo imprimible');
assert.match(
  app,
  /Comprueba la ausencia de almacenamiento/i,
  'Privacidad no debe prometer un reinicio que el control no ejecuta'
);
assert.match(
  styles,
  /VERSIÓN PÚBLICA EDUCATIVA · DATOS ILUSTRATIVOS · SIN VALIDEZ OPERATIVA/i,
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
  /@media \(max-width: 680px\)[\s\S]*\.demo-governance-grid[\s\S]*grid-template-columns:\s*1fr/i,
  'El bloque de gobierno institucional debe conservar una sola columna en móvil'
);
assert.match(
  styles,
  /@media \(prefers-reduced-motion: reduce\)/i,
  'La experiencia pública debe respetar movimiento reducido'
);

assert.doesNotMatch(
  app,
  /bitforward-premium|chatgpt\.site|@gmail\.com/i,
  'La experiencia pública no debe revelar el cockpit o al propietario'
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
const externalHrefs = [...app.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)].map(
  match => match[1]
);
assert.deepEqual(
  externalHrefs,
  [],
  'La experiencia pública no debe enlazar superficies externas sin revisión'
);

assert.equal(manifest, publicManifest, 'El manifiesto fuente y el público deben coincidir');
assert.equal(serviceWorker, rootServiceWorker, 'Los service workers de retiro deben coincidir');
assert.match(
  manifest,
  /Mission Control · Experiencia pública/i,
  'El manifiesto debe identificar la experiencia pública'
);
assert.match(
  manifest,
  /"display": "browser"/i,
  'La experiencia pública debe mantener visible el navegador'
);
assert.match(
  manifest,
  /"shortcuts": \[\]/i,
  'La experiencia pública no debe ofrecer accesos instalables'
);
assert.match(
  robots,
  /^User-agent: \*\s+Allow: \/\s*$/i,
  'robots.txt debe permitir el sitio público'
);
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
  'assets/brand/pilot-astronaut-v3.webp',
  'assets/brand/rocket-hero-v2.webp',
]) {
  assert.ok(existsSync(path), `Falta el recurso público ${path}`);
  assert.ok(trackedFiles.includes(path), `El recurso público ${path} debe quedar versionado`);
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
