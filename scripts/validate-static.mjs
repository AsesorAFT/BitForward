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
const app = read('src/site-v2/bitforward-app.jsx');
const main = read('src/site-v2/main.jsx');
const styles = read('css/bitforward-v2.css');
const manifest = read('manifest.json');
const publicManifest = read('public/bitforward.webmanifest');
const serviceWorker = read('public/sw.js');
const rootServiceWorker = read('sw.js');
const simulator = read('mission-control.html');
const viteConfig = read('vite.config.mjs');
const envExample = read('server/.env.example');

assert.match(
  index,
  /BitForward v2\.0 \| Proyecto cripto de AFORTU/i,
  'La portada debe publicar la identidad final'
);
assert.match(
  index,
  /id="bitforward-root"/i,
  'La portada necesita el contenedor estable de la aplicación'
);
assert.match(index, /src="src\/site-v2\/main\.jsx"/i, 'La portada debe cargar la aplicación final');
assert.match(
  index,
  /https:\/\/asesoraft\.github\.io\/BitForward\/assets\/brand\/bitforward-social-v2\.jpg/i,
  'La vista previa social debe usar una URL pública estable'
);
assert.doesNotMatch(index, /href="#"/i, 'La portada no debe publicar enlaces vacíos');

assert.match(app, /href="#mision"/i, 'La aplicación necesita acceso directo al Centro de Misión');
assert.match(app, /id="mision"/i, 'La aplicación necesita un Centro de Misión identificable');
assert.match(
  app,
  /disabled=\{step > missionStep\}/,
  'La navegación no debe permitir saltar a pasos futuros'
);
assert.match(
  app,
  /aria-current=\{missionStep === step \? ['"]step['"]/,
  'La misión debe anunciar el paso actual'
);
assert.match(
  app,
  /missionMode === ['"]portfolio['"] \? totalHoldings : Math\.max\(capital, 0\)/,
  'La prueba de estrés debe evaluar la exposición declarada, no recortarla antes'
);
assert.match(
  app,
  /className=['"]market-meta['"] aria-live=['"]polite['"]/,
  'El estado de mercado debe anunciar cambios'
);
assert.match(app, /api\.coingecko\.com/, 'La versión estática necesita una fuente pública');
assert.doesNotMatch(
  app,
  /fetch\(["']\/api\/market/,
  'GitHub Pages no puede depender de una ruta de servidor'
);
assert.doesNotMatch(
  app,
  /src=["']\//,
  'Los recursos de la aplicación no pueden usar rutas absolutas incompatibles con Pages'
);
assert.match(
  app,
  /No recibe dinero, no guarda llaves, no opera activos y no\s+garantiza rendimientos/i,
  'La frontera de responsabilidad debe permanecer visible'
);
assert.match(
  app,
  /pérdida parcial o total\s+del capital/i,
  'La advertencia de riesgo debe permanecer visible'
);
assert.match(app, /version:\s*2/, 'Las sesiones locales deben tener versión');
assert.match(app, /clearWorkspace/, 'El usuario debe poder eliminar la sesión local');
assert.match(main, /createRoot/, 'La entrada debe montar la aplicación React');
assert.match(main, /js\/pwa\.js/, 'La entrada debe registrar el modo instalable');

assert.doesNotMatch(
  styles,
  /\.mission-disclaimer,\s*\.afortu-section\s*\{\s*display:\s*none/i,
  'El informe impreso no puede ocultar el aviso jurídico'
);
assert.match(
  styles,
  /\.mission-disclaimer\s*\{[\s\S]*display:\s*block !important/i,
  'El informe impreso debe mostrar su aviso jurídico'
);

assert.equal(manifest, publicManifest, 'El manifiesto fuente y el público deben coincidir');
assert.equal(serviceWorker, rootServiceWorker, 'Los service workers deben coincidir');
assert.match(manifest, /Proyecto cripto de AFORTU/i, 'El manifiesto debe usar la identidad final');
assert.match(manifest, /#mision/i, 'El manifiesto debe abrir el Centro de Misión');
assert.doesNotMatch(
  manifest,
  /Acceso Cliente|mission-control\.html|login\.html/i,
  'El manifiesto público no debe exponer accesos heredados'
);
assert.match(serviceWorker, /bitforward-public-v6/, 'La nueva versión debe invalidar la caché');

for (const path of [
  'public/assets/brand/bitforward-app-icon-192.png',
  'public/assets/brand/bitforward-app-icon-512.png',
  'public/assets/brand/bitforward-logo-v2.webp',
  'public/assets/brand/bitforward-social-v2.jpg',
  'public/assets/brand/rocket-hero-v2.webp',
]) {
  assert.ok(existsSync(path), `Falta el recurso público ${path}`);
  assert.ok(statSync(path).size > 1000, `El recurso público ${path} parece vacío`);
}

assert.match(
  simulator,
  /Es un escenario, no un pronóstico/i,
  'El simulador heredado debe diferenciar escenarios de pronósticos'
);
assert.doesNotMatch(
  simulator,
  /(?:leverage|perps|empezar a operar)/i,
  'La ruta pública de simulación no puede ofrecer apalancamiento u operación'
);
assert.doesNotMatch(
  viteConfig,
  /(?:trading|lending|dashboard|enterprise):\s*resolve/i,
  'El build público no debe incluir rutas operativas del laboratorio'
);
assert.doesNotMatch(
  envExample,
  /(?:DEPLOYER_PRIVATE_KEY|SERVER_PRIVATE_KEY)=0x[0-9a-f]{64}/i,
  'El archivo de ejemplo no puede contener claves privadas completas'
);

for (const path of ['index.html', 'mission-control.html', 'about.html']) {
  const html = read(path);
  assert.match(html, /<!doctype html>/i, `${path} no tiene doctype`);
  assert.match(html, /<title>[^<]+<\/title>/i, `${path} no tiene título`);
}

console.log(`Validación estática completada: ${trackedFiles.length} archivos rastreados.`);
