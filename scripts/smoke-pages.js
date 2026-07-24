#!/usr/bin/env node
/**
 * Smoke test liviano para verificar que las páginas principales cargan.
 * Usa un host configurable para apuntar a preview local o a producción.
 */
const axios = require('axios');

const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:4173';
const pages = [
  {
    path: '/',
    tokens: ['BitForward v2.0 | Proyecto cripto de AFORTU', 'id="bitforward-root"'],
  },
  {
    path: '/bitforward.webmanifest',
    tokens: ['Proyecto cripto de AFORTU', '#mision'],
  },
  {
    path: '/sw.js',
    tokens: ['bitforward-public-v6'],
  },
  { path: '/mission-control.html', tokens: ['Simulador educativo | BitForward', '60/20/10/10'] },
  { path: '/about.html', tokens: ['Metodología | BitForward', 'MVP educativo en validación'] },
  { path: '/assets/brand/bitforward-social-v2.jpg', tokens: [] },
  { path: '/assets/brand/bitforward-app-icon-192.png', tokens: [] },
];

function buildUrl(path) {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

async function assertPage({ path, tokens }) {
  const url = buildUrl(path);
  const res = await axios.get(url, { timeout: 8000 });
  if (res.status >= 400) throw new Error(`Status ${res.status} en ${url}`);
  const body = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
  const missing = tokens.filter(token => !body.includes(token));
  if (missing.length) {
    throw new Error(`Faltan tokens en ${url}: ${missing.join(', ')}`);
  }
  console.log(`✓ ${url} (${res.status})`);
}

(async () => {
  try {
    await Promise.all(pages.map(assertPage));
    console.log('Smoke test completado.');
  } catch (err) {
    console.error('Smoke test falló:', err.message);
    process.exit(1);
  }
})();
