#!/usr/bin/env node
/**
 * Smoke test liviano para verificar que las páginas principales cargan.
 * Usa un host configurable para apuntar a preview local o a producción.
 */
const axios = require('axios');
const fs = require('fs');
const puppeteer = require('puppeteer');

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
    tokens: ['bitforward-public-v7'],
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

async function assertJsxRuntime() {
  const indexUrl = buildUrl('/');
  const indexResponse = await axios.get(indexUrl, { timeout: 8000 });
  const entryPaths = [
    ...String(indexResponse.data).matchAll(/(?:src|data-src)="([^"]*main[^"]+\.js)"/g),
  ].map(match => match[1]);

  if (entryPaths.length === 0) {
    throw new Error('No se encontraron bundles principales en la portada compilada.');
  }

  await Promise.all(
    [...new Set(entryPaths)].map(async entryPath => {
      const bundleUrl = new URL(entryPath, indexUrl).href;
      const response = await axios.get(bundleUrl, { timeout: 8000 });
      if (/\bReact\.createElement\b/.test(String(response.data))) {
        throw new Error(`El bundle ${bundleUrl} depende de una variable global de React.`);
      }
    })
  );

  console.log('✓ Bundles JSX enlazados al runtime modular de React.');
}

async function assertApplicationRuntime() {
  const runtimeErrors = [];
  let executablePath = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].find(candidate => candidate && fs.existsSync(candidate));

  if (!executablePath) {
    try {
      const bundledBrowser = puppeteer.executablePath();
      if (fs.existsSync(bundledBrowser)) executablePath = bundledBrowser;
    } catch {
      executablePath = undefined;
    }
  }

  if (!executablePath) {
    if (process.env.CI) {
      throw new Error('Chrome es obligatorio para validar el render antes de publicar.');
    }
    console.log('↷ Prueba visual omitida: Chrome no está instalado en este entorno.');
    return;
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    page.on('pageerror', error => runtimeErrors.push(error.message));

    await page.goto(buildUrl('/'), {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await page.waitForSelector('#bitforward-root > *', {
      visible: true,
      timeout: 10000,
    });

    const appState = await page.$eval('#bitforward-root', element => ({
      childCount: element.children.length,
      text: element.textContent || '',
    }));

    if (appState.childCount === 0 || !appState.text.includes('Centro de Misión')) {
      throw new Error('La aplicación React no montó el Centro de Misión.');
    }
    if (runtimeErrors.length) {
      throw new Error(`Errores de JavaScript: ${runtimeErrors.join(' | ')}`);
    }

    console.log('✓ Aplicación React montada sin errores de ejecución.');
  } finally {
    await browser.close();
  }
}

(async () => {
  try {
    await Promise.all(pages.map(assertPage));
    await assertJsxRuntime();
    await assertApplicationRuntime();
    console.log('Smoke test completado.');
  } catch (err) {
    console.error('Smoke test falló:', err.message);
    process.exit(1);
  }
})();
