#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

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
const landing = read('js/landing.js');
const simulator = read('mission-control.html');
const viteConfig = read('vite.config.mjs');
const envExample = read('server/.env.example');

assert.match(index, /href="#contenido"/i, 'La landing necesita un enlace para saltar al contenido');
assert.match(index, /<main[^>]+id="contenido"/i, 'El contenido principal necesita un id estable');
assert.match(
  index,
  /id="market-updated"[^>]+aria-live="polite"/i,
  'El estado de mercado debe anunciar cambios'
);
assert.doesNotMatch(index, /href="#"/i, 'La landing no debe publicar enlaces vacíos');
assert.match(landing, /components\/bf-header\.js/, 'La landing debe registrar el encabezado web');
assert.match(
  simulator,
  /Es un escenario, no un pronóstico/i,
  'El simulador debe diferenciar escenarios de pronósticos'
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
