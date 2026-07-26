#!/usr/bin/env node
/**
 * Smoke test de la réplica pública de Mission Control.
 * Comprueba artefacto, montaje React, fronteras demo y navegación responsive.
 */
const axios = require('axios');
const fs = require('fs');
const puppeteer = require('puppeteer');

const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:4173';
const pages = [
  {
    path: '/',
    tokens: ['BitForward Mission Control Demo | AFORTU', 'id="bitforward-root"'],
  },
  {
    path: '/bitforward.webmanifest',
    tokens: ['Mission Control · Demo pública', '"display":"browser"'],
  },
  {
    path: '/sw.js',
    tokens: ['self.registration.unregister()'],
  },
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

function resolveChrome() {
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
  return executablePath;
}

async function assertApplicationRuntime() {
  const executablePath = resolveChrome();
  if (!executablePath) {
    if (process.env.CI) {
      throw new Error('Chrome es obligatorio para validar el render antes de publicar.');
    }
    console.log('↷ Prueba visual omitida: Chrome no está instalado en este entorno.');
    return;
  }

  const runtimeErrors = [];
  const externalRequests = [];
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    page.on('pageerror', error => runtimeErrors.push(error.message));
    page.on('request', request => {
      const requestUrl = new URL(request.url());
      const expectedOrigin = new URL(baseUrl).origin;
      if (
        !['data:', 'blob:'].includes(requestUrl.protocol) &&
        requestUrl.origin !== expectedOrigin
      ) {
        externalRequests.push(request.url());
      }
    });

    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(buildUrl('/'), {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await page.waitForSelector('#bitforward-root > .demo-shell', {
      visible: true,
      timeout: 10000,
    });

    const desktopState = await page.evaluate(() => ({
      banner: document.querySelector('.demo-banner')?.textContent || '',
      active: document.querySelector('.demo-sidebar a[aria-current="page"]')?.getAttribute('href'),
      navigationCount: document.querySelectorAll('.demo-sidebar nav a').length,
      forms: document.querySelectorAll('form, input, textarea').length,
      text: document.querySelector('#bitforward-root')?.textContent || '',
    }));

    if (!desktopState.banner.includes('DEMO PÚBLICA · DATOS FICTICIOS · NO RECIBE DINERO')) {
      throw new Error('El banner de frontera demo no está visible.');
    }
    if (desktopState.active !== '#panel' || desktopState.navigationCount !== 9) {
      throw new Error('La navegación de escritorio no expone los nueve módulos.');
    }
    if (desktopState.forms !== 0) {
      throw new Error('La demo pública no puede captar texto o formularios.');
    }
    if (!desktopState.text.includes('Buen regreso, Piloto Demo.')) {
      throw new Error('La réplica no montó el Panel de Misión.');
    }

    await page.click('.demo-sidebar a[href="#telemetria"]');
    await page.waitForFunction(() => window.location.hash === '#telemetria');
    await page.waitForSelector('.demo-stress-panel', { visible: true });
    await page.$eval('.demo-skip-link', element => element.click());
    const skipState = await page.evaluate(() => ({
      hash: window.location.hash,
      active: document.querySelector('.demo-sidebar a[aria-current="page"]')?.getAttribute('href'),
      focused: document.activeElement?.id,
    }));
    if (
      skipState.hash !== '#telemetria' ||
      skipState.active !== '#telemetria' ||
      skipState.focused !== 'demo-content'
    ) {
      throw new Error('El enlace de salto cambió el módulo o no enfocó el contenido.');
    }

    const stressButtons = await page.$$('.demo-scenario-buttons button');
    if (stressButtons.length !== 3) throw new Error('Faltan escenarios de estrés.');
    await stressButtons[2].click();
    await page.waitForFunction(() =>
      document.querySelector('.demo-stress-result strong')?.textContent?.includes('$36,000')
    );

    await page.setViewport({ width: 320, height: 700, deviceScaleFactor: 1 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const mobileState = await page.evaluate(() => {
      const sidebar = document.querySelector('.demo-sidebar');
      const dock = document.querySelector('.demo-mobile-dock');
      return {
        sidebarDisplay: sidebar ? getComputedStyle(sidebar).display : 'missing',
        dockDisplay: dock ? getComputedStyle(dock).display : 'missing',
        dockItems: dock?.querySelectorAll('a').length ?? 0,
        topbarWidth: document.querySelector('.demo-topbar')?.scrollWidth ?? 0,
        viewportTitle: document.querySelector('.demo-location strong')?.textContent ?? '',
        viewportWidth: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
      };
    });
    if (mobileState.sidebarDisplay !== 'none' || mobileState.dockDisplay !== 'flex') {
      throw new Error('El responsive no cambia de sidebar a dock móvil.');
    }
    if (mobileState.dockItems !== 9) {
      throw new Error('El dock móvil no conserva los nueve módulos.');
    }
    if (mobileState.pageWidth > mobileState.viewportWidth + 1) {
      throw new Error(
        `La página desborda horizontalmente: ${mobileState.pageWidth}px > ${mobileState.viewportWidth}px.`
      );
    }
    if (mobileState.topbarWidth > mobileState.viewportWidth + 1) {
      throw new Error('La topbar desborda el viewport mínimo de 320 px.');
    }

    const motionButton = await page.$('.demo-quiet-button');
    const pauseIcon = await page.evaluate(
      element => getComputedStyle(element, '::after').content,
      motionButton
    );
    await motionButton.click();
    const playIcon = await page.evaluate(
      element => getComputedStyle(element, '::after').content,
      motionButton
    );
    if (!pauseIcon.includes('⏸') || !playIcon.includes('▶')) {
      throw new Error('El control móvil de movimiento no refleja su estado.');
    }

    await page.$eval('.demo-mobile-dock a[href="#pagos"]', element => element.click());
    await page.waitForFunction(() => window.location.hash === '#pagos');
    await page.waitForSelector('.demo-payment-status', { visible: true });
    const paymentState = await page.evaluate(() => ({
      text: document.querySelector('.demo-payment-status')?.textContent || '',
      disabled: document.querySelector('.demo-disabled-action')?.disabled ?? false,
    }));
    if (!paymentState.text.includes('Sin cargos activos.')) {
      throw new Error('El módulo móvil de pagos no comunica su estado inactivo.');
    }
    if (!paymentState.disabled) {
      throw new Error('El módulo de pago debe permanecer deshabilitado.');
    }

    if (externalRequests.length) {
      throw new Error(`La demo abrió conexiones externas: ${externalRequests.join(', ')}`);
    }
    if (runtimeErrors.length) {
      throw new Error(`Errores de JavaScript: ${runtimeErrors.join(' | ')}`);
    }

    console.log('✓ Cockpit Demo montado y navegado en escritorio y móvil sin conexiones externas.');
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
  } catch (error) {
    console.error('Smoke test falló:', error.message);
    process.exit(1);
  }
})();
