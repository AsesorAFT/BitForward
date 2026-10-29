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
    page.on('pageerror', error => errors.push(error.message));
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
    const count = async value =>
      assert.equal(await page.$$eval('#catalog-list button', els => els.length), value);
    const search = async text => {
      await page.$eval(
        '#catalog-search',
        (input, value) => {
          input.value = value;
          input.dispatchEvent(new Event('input'));
        },
        text
      );
    };
    const market = async value => page.click(`#catalog-filters [data-market="${value}"]`);
    const explore = async (type, symbol) =>
      page.click(`#catalog-list button[data-key^="binance:${type}:${symbol}"]`);
    const fits = async () =>
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `Horizontal overflow at ${width}px`
      );
    await count(43);
    assert.equal(await page.$$eval('#pair option', els => els.length), 24);
    await page.focus('#catalog-search');
    await page.keyboard.type('BTC');
    await count(2);
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.dataset.market), 'all');
    assert.notEqual(
      await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle),
      'none'
    );
    await page.keyboard.press('Space');
    await count(2);
    await search('');
    for (const [type, total] of [
      ['spot', 22],
      ['alpha', 4],
      ['futures', 14],
      ['bstocks', 3],
    ]) {
      await market(type);
      await count(total);
      assert.equal(
        await page.$eval(`#catalog-filters [data-market="${type}"]`, el =>
          el.getAttribute('aria-pressed')
        ),
        'true'
      );
      await fits();
    }
    await explore('bstocks', 'SOXSBUSDT');
    assert.match(
      await page.$eval('#instrument-notice', el => el.textContent),
      /ETF inverso apalancado 3X/
    );
    assert.equal(await page.$eval('#catalog-practice', el => el.disabled), true);
    await market('alpha');
    await explore('alpha', 'selection-4');
    assert.match(
      await page.$eval('#instrument-details', el => el.textContent),
      /Alpha IDPendiente/
    );
    assert.equal(await page.$eval('#catalog-practice', el => el.disabled), true);
    await market('futures');
    await explore('futures', 'IBKRUSDT');
    assert.match(
      await page.$eval('#instrument-notice', el => el.textContent),
      /no compra de acciones/
    );
    assert.match(
      await page.$eval('#instrument-details', el => el.textContent),
      /TRADIFI_PERPETUAL/
    );
    await market('all');
    for (const [text, total] of [
      ['0G', 1],
      ['OGUSDT', 0],
      ['ONUSDT', 1],
      ['ONTUSDT', 1],
      ['FORM', 1],
      ['BTC', 2],
    ]) {
      await search(text);
      await count(total);
    }
    await explore('futures', 'BTCUSDT');
    assert.equal(await page.$eval('#catalog-practice', el => el.disabled), true);
    await explore('spot', 'BTCUSDT');
    assert.equal(await page.$eval('#catalog-practice', el => el.disabled), false);
    await search('');
    await fits();
    if (screenshots) {
      await page.evaluate(() => {
        document.activeElement.blur();
        window.scrollTo(0, 0);
      });
      await page.screenshot({ path: `${screenshots}/catalogo-${width}.png`, fullPage: true });
    }
    await page.click('#catalog-practice');
    assert.equal(await page.$eval('#learn', el => el.hidden), false);
    assert.match(await page.$eval('#message', el => el.textContent), /Lee los límites/);
    await page.click('#practice');
    assert.equal(await page.$eval('#pair', el => el.value), 'binance:spot:BTCUSDT');
    await page.click('#selection button');
    await page.waitForSelector('#review:not([hidden])');
    const details = await page.$eval('#quote-details', el => el.textContent);
    assert.match(details, /binance:spot:BTCUSDT/);
    assert.match(details, /SIMULACIÓN/);
    assert.match(details, /100,3 USDT demo/);
    assert.match(details, /0,0002 ETH demo/);
    assert.match(details, /10 BTC · Spot demo/);
    await fits();
    if (screenshots) {
      await page.evaluate(() => {
        document.activeElement.blur();
        window.scrollTo(0, 0);
      });
      await page.screenshot({ path: `${screenshots}/spot-revision-${width}.png`, fullPage: true });
    }
    await page.click('#consent');
    await page.evaluate(() => {
      document.querySelector('#confirm').click();
      document.querySelector('#confirm').click();
    });
    assert.match(await page.$eval('#result-title', el => el.textContent), /Pendiente/);
    assert.equal(await page.$eval('#catalog-practice', el => el.disabled), true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() =>
      document.querySelector('#result-title').textContent.includes('confirmada')
    );
    assert.equal(await page.$$eval('#history > li', els => els.length), 1);
    assert.match(await page.$eval('#history', el => el.textContent), /binance:spot:BTCUSDT/);
    assert.match(await page.$eval('#balances', el => el.textContent), /899,7 USDT demo/);
    await page.reload({ waitUntil: 'networkidle0' });
    assert.equal(await page.$$eval('#history > li', els => els.length), 1);
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    await page.close();
    console.log(
      `Catálogo ${width}px: 43 entradas, filtros, teclado, exploración sin compra y práctica Spot idempotente OK`
    );
  }
} finally {
  await browser.close();
}
