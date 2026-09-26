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
    path: '/cockpit.html',
    tokens: ['BitForward Mission Control | Experiencia pública de AFORTU', 'id="bitforward-root"'],
  },
  {
    path: '/bitforward.webmanifest',
    tokens: ['Mission Control · Experiencia pública', '"display":"browser"'],
  },
  {
    path: '/sw.js',
    tokens: ['self.registration.unregister()'],
  },
  {
    path: '/robots.txt',
    tokens: ['User-agent: *', 'Allow: /'],
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
  const indexUrl = buildUrl('/cockpit.html');
  const indexResponse = await axios.get(indexUrl, { timeout: 8000 });
  const entryPaths = [
    ...String(indexResponse.data).matchAll(/(?:src|data-src)="([^"]*(?:main|cockpit)[^"]+\.js)"/g),
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

async function assertEditorialRuntime(browser) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
      await page.goto(buildUrl('/'), { waitUntil: 'networkidle0' });
      await page.waitForSelector('.hero-astronaut', { visible: true });
      const state = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        imageLoaded: document.querySelector('.hero-astronaut').naturalWidth > 0,
        heading: document.querySelector('h1').textContent,
      }));
      if (state.pageWidth > state.width + 1) throw new Error(`Editorial overflow at ${width}px`);
      if (!state.imageLoaded) throw new Error('ATF image did not load');
      if (!state.heading.includes('Entiende cripto')) throw new Error('Editorial heading missing');
      if (width <= 900) {
        await page.click('.menu-toggle');
        await page.waitForSelector('#main-nav.is-open', { visible: true });
        await page.keyboard.press('Escape');
        const focused = await page.evaluate(() =>
          document.activeElement.classList.contains('menu-toggle')
        );
        if (!focused) throw new Error('Mobile menu lost focus on Escape');
      }
    }
    const coinMotion = () =>
      page.$eval('.coin-strip img', img => ({
        name: getComputedStyle(img).animationName,
        state: getComputedStyle(img).animationPlayState,
      }));
    if ((await coinMotion()).name !== 'coin-float') throw new Error('Coin motion missing');
    await page.click('.motion-toggle');
    if ((await coinMotion()).state !== 'paused') throw new Error('Coin pause failed');
    await page.click('.motion-toggle');
    if ((await coinMotion()).state !== 'running') throw new Error('Coin resume failed');
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.waitForFunction(() => document.querySelector('.motion-toggle').disabled);
    if ((await coinMotion()).name !== 'none') throw new Error('Reduced motion not respected');
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
    await page.click('[data-filter="ethereum"]');
    if ((await page.$$eval('.mission-card:not([hidden])', cards => cards.length)) !== 1) {
      throw new Error('Ethereum filter failed');
    }
    await page.click('.mission-card:not([hidden]) a');
    await page.waitForSelector('.article-content');
    await page.reload({ waitUntil: 'networkidle0' });
    if (!page.url().includes('002-gasolinera-ethereum.html'))
      throw new Error('Mission deep link failed');
    await page.click('.mission-question summary');
    if (!(await page.$eval('.mission-question details', el => el.open)))
      throw new Error('Mission answer failed');
    await page.goto(buildUrl('/'), { waitUntil: 'networkidle0' });
    await page.click('.lesson-list summary');
    if (!(await page.$eval('.lesson-list details', el => el.open)))
      throw new Error('Bitacora expansion failed');
    for (const path of [
      '/misiones.html',
      '/laboratorio.html',
      '/atf.html',
      '/membresias.html',
      '/acceso.html',
    ]) {
      for (const width of [320, 1440]) {
        await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
        await page.goto(buildUrl(path), { waitUntil: 'networkidle0' });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
        );
        if (overflow) throw new Error(`Learning page overflow: ${path} at ${width}px`);
      }
    }
    if (errors.length) throw new Error(errors.join(' | '));
    console.log(
      '✓ Editorial: 320/390/768/1440px, menu, filter, article reload and expandable answers.'
    );
  } finally {
    await page.close();
  }
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
    await assertEditorialRuntime(browser);
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
    await page.goto(buildUrl('/cockpit.html'), {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await page.waitForSelector('#bitforward-root > .demo-shell', {
      visible: true,
      timeout: 10000,
    });
    await page.waitForFunction(() => {
      const image = document.querySelector('.demo-pilot-astronaut');
      return Boolean(image?.complete && image.naturalWidth > 0);
    });

    const desktopState = await page.evaluate(() => ({
      banner: document.querySelector('.demo-banner')?.textContent || '',
      active: document.querySelector('.demo-sidebar a[aria-current="page"]')?.getAttribute('href'),
      navigationCount: document.querySelectorAll('.demo-sidebar nav a').length,
      forms: document.querySelectorAll('form, input, textarea').length,
      text: document.querySelector('#bitforward-root')?.textContent || '',
      pilot: (() => {
        const image = document.querySelector('.demo-pilot-astronaut');
        const rect = image?.getBoundingClientRect();
        return {
          complete: image?.complete ?? false,
          naturalWidth: image?.naturalWidth ?? 0,
          width: rect?.width ?? 0,
          height: rect?.height ?? 0,
        };
      })(),
    }));

    if (
      !desktopState.banner.includes(
        'VERSIÓN PÚBLICA EDUCATIVA · DATOS ILUSTRATIVOS · SIN OPERACIÓN REAL'
      )
    ) {
      throw new Error('El banner de frontera pública no está visible.');
    }
    if (desktopState.active !== '#panel' || desktopState.navigationCount !== 9) {
      throw new Error('La navegación de escritorio no expone los nueve módulos.');
    }
    if (desktopState.forms !== 0) {
      throw new Error('La experiencia pública no puede captar texto o formularios.');
    }
    if (!desktopState.text.includes('Bienvenido, Piloto Explorador.')) {
      throw new Error('La réplica no montó el Panel de Misión.');
    }
    if (
      !desktopState.pilot.complete ||
      desktopState.pilot.naturalWidth === 0 ||
      desktopState.pilot.width < 180 ||
      desktopState.pilot.height < 420
    ) {
      throw new Error('El astronauta protagonista no cargó o no conserva presencia en escritorio.');
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

    await page.click('.demo-sidebar a[href="#panel"]');
    await page.waitForFunction(() => window.location.hash === '#panel');
    await page.waitForSelector('.demo-pilot-astronaut', { visible: true });
    await page.waitForFunction(() => {
      const image = document.querySelector('.demo-pilot-astronaut');
      return Boolean(image?.complete && image.naturalWidth > 0);
    });

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
        pilot: (() => {
          const image = document.querySelector('.demo-pilot-astronaut');
          const copy = document.querySelector('.demo-mission-copy');
          const rect = image?.getBoundingClientRect();
          const copyRect = copy?.getBoundingClientRect();
          return {
            complete: image?.complete ?? false,
            naturalWidth: image?.naturalWidth ?? 0,
            left: rect?.left ?? 0,
            right: rect?.right ?? 0,
            top: rect?.top ?? 0,
            bottom: rect?.bottom ?? 0,
            width: rect?.width ?? 0,
            height: rect?.height ?? 0,
            copyTop: copyRect?.top ?? 0,
          };
        })(),
        wideElements: Array.from(document.querySelectorAll('body *'))
          .filter(element => {
            const rect = element.getBoundingClientRect();
            return rect.left < -1 || rect.right > document.documentElement.clientWidth + 1;
          })
          .slice(0, 6)
          .map(element => ({
            tag: element.tagName,
            className: String(element.className || ''),
            width: Math.round(element.getBoundingClientRect().width),
          })),
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
        `La página desborda horizontalmente: ${mobileState.pageWidth}px > ${mobileState.viewportWidth}px. Elementos: ${JSON.stringify(mobileState.wideElements)}`
      );
    }
    if (mobileState.topbarWidth > mobileState.viewportWidth + 1) {
      throw new Error('La topbar desborda el viewport mínimo de 320 px.');
    }
    if (
      !mobileState.pilot.complete ||
      mobileState.pilot.naturalWidth === 0 ||
      mobileState.pilot.width < 120 ||
      mobileState.pilot.height < 220
    ) {
      throw new Error('El astronauta no conserva una silueta reconocible en 320 px.');
    }
    if (
      mobileState.pilot.left < -1 ||
      mobileState.pilot.right > mobileState.viewportWidth + 1 ||
      mobileState.pilot.bottom > mobileState.pilot.copyTop + 1
    ) {
      throw new Error('El astronauta se recorta o invade el contenido en móvil.');
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
      throw new Error(
        `La experiencia pública abrió conexiones externas: ${externalRequests.join(', ')}`
      );
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
