import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import puppeteer from 'puppeteer';

const base = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4173';
const screenshots = process.env.TOKEN_DEMO_SCREENSHOTS;
if (screenshots) await mkdir(screenshots, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
try {
  for (const width of [360, 390, 1440]) {
    const page = await browser.newPage();
    const errors = [];
    const external = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', request => {
      if (!request.url().startsWith(base) && !request.url().startsWith('data:'))
        external.push(request.url());
    });
    await page.setViewport({ width, height: 900 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.evaluateOnNewDocument(() => {
      for (const name of ['ethereum', 'solana'])
        Object.defineProperty(window, name, {
          get() {
            throw new Error('Wallet accessed');
          },
        });
    });
    await page.goto(`${base}/prototipo-tokens.html`, { waitUntil: 'networkidle0' });
    const fits = async () =>
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `Overflow at ${width}`
      );
    await fits();
    // Navegación real por teclado y foco visible en el enlace de salto.
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.className), 'skip-link');
    assert.notEqual(
      await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle),
      'none'
    );
    await page.click('#practice');
    await page.$eval('#amount', input => {
      input.value = '1e3';
    });
    await page.click('#selection button');
    assert.match(await page.$eval('#message', el => el.textContent), /importe positivo/);
    await page.$eval('#amount', input => {
      input.value = '100';
    });
    await page.click('#selection button');
    await page.waitForSelector('#review:not([hidden])');
    assert.equal(await page.$eval('#confirm', el => el.disabled), true);
    await page.click('#consent');
    await fits();
    if (screenshots) {
      await page.evaluate(() => {
        document.activeElement.blur();
        window.scrollTo(0, 0);
      });
      await page.screenshot({ path: `${screenshots}/revision-${width}.png`, fullPage: true });
    }
    for (const [scenario, message] of [
      ['network', /Red incorrecta/],
      ['disconnected', /desconectada/],
      ['funds', /insuficientes/],
      ['gas', /ETH/],
    ]) {
      await page.select('#scenario', scenario);
      await page.click('#confirm');
      assert.match(await page.$eval('#message', el => el.textContent), message);
    }
    await fits();
    await page.select('#scenario', 'reject');
    await page.click('#confirm');
    assert.match(await page.$eval('#result-title', el => el.textContent), /rechazada/);
    await page.click('#again');
    await page.click('#selection button');
    await page.click('#consent');
    await page.select('#scenario', 'ready');
    await page.evaluate(() => {
      document.querySelector('#confirm').click();
      document.querySelector('#confirm').click();
    });
    assert.match(await page.$eval('#result-title', el => el.textContent), /Pendiente/);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() =>
      document.querySelector('#result-title').textContent.includes('confirmada')
    );
    assert.equal(await page.$$eval('#history > li', els => els.length), 2);
    await page.reload({ waitUntil: 'networkidle0' });
    assert.equal(await page.$$eval('#history > li', els => els.length), 2);
    await fits();
    if (screenshots) {
      await page.evaluate(() => {
        document.activeElement.blur();
        window.scrollTo(0, 0);
      });
      await page.screenshot({ path: `${screenshots}/resultado-${width}.png`, fullPage: true });
    }
    await page.click('#again');
    await page.click('#selection button');
    await page.click('#consent');
    await page.evaluate(() => {
      const realNow = Date.now;
      Date.now = () => realNow() + 61000;
    });
    await page.waitForFunction(() => document.querySelector('#confirm').disabled);
    assert.match(await page.$eval('#expiry', el => el.textContent), /caducada/);
    await page.click('#edit');
    await page.click('#selection button');
    await page.click('#consent');
    await page.select('#scenario', 'failure');
    await page.click('#confirm');
    await page.waitForFunction(() =>
      document.querySelector('#result-title').textContent.includes('fallida')
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    await page.close();
    console.log(`Demo: ${width}px, teclado, costes, estados, caducidad y recarga OK`);
  }
} finally {
  await browser.close();
}
