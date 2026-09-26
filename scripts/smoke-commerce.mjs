import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import puppeteer from 'puppeteer';
import { addToCart, cartTotal, normalizeCart, leverageScenario } from '../src/commerce/catalog.mjs';
assert.equal(
  cartTotal(addToCart(addToCart([], 'analista', 'monthly'), 'circulo', 'annual')),
  1290000
);
assert.equal(normalizeCart([{ id: 'fake', period: 'annual' }]).length, 0);
assert.equal(leverageScenario({ margin: 100, leverage: 10, move: -5, direction: 'long' }).pnl, -50);
assert.equal(leverageScenario({ margin: 100, leverage: 10, move: -5, direction: 'short' }).pnl, 50);
assert.equal(
  leverageScenario({ margin: 100, leverage: 100, move: -1, direction: 'long' }).exhausted,
  true
);
assert.throws(() => leverageScenario({ margin: 0, leverage: 10, move: 2, direction: 'long' }));
const base = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4173';
const screenshots = process.env.COMMERCE_SCREENSHOTS;
if (screenshots) await mkdir(screenshots, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const errors = [];
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewport({ width, height: 900, isMobile: width < 500, hasTouch: width < 500 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto(base + '/membresias.html', { waitUntil: 'networkidle0' });
    await page.evaluate(() => localStorage.removeItem('bitforward-cart-v1'));
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('.bf-plans');
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      `memberships overflow ${width}`
    );
    const click = async label => {
      await page.evaluate(label => {
        const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes(label));
        if (!b) throw new Error('Missing ' + label);
        b.click();
      }, label);
    };
    await click('Añadir Analista');
    await page.waitForFunction(() =>
      document.querySelector('.bf-cart-items')?.textContent.includes('Analista')
    );
    await click('Añadir Círculo');
    await page.waitForFunction(
      () =>
        document.querySelectorAll('.bf-cart-items li').length === 1 &&
        document.querySelector('.bf-cart-items').textContent.includes('Círculo')
    );
    await click('Añadir programa');
    await page.waitForFunction(() => document.querySelectorAll('.bf-cart-items li').length === 2);
    // Center the control above the fixed mobile cart bar before a pointer click.
    await page.$eval('[aria-label="Quitar Círculo AFORTU"]', button =>
      button.scrollIntoView({ block: 'center', behavior: 'instant' })
    );
    await page.click('[aria-label="Quitar Círculo AFORTU"]');
    await page.waitForFunction(() => document.querySelectorAll('.bf-cart-items li').length === 1);
    await click('Añadir Círculo');
    await page.waitForFunction(() => document.querySelectorAll('.bf-cart-items li').length === 2);
    await page.reload({ waitUntil: 'networkidle0' });
    assert.equal(await page.$$eval('.bf-cart-items li', n => n.length), 2);
    await click('Elegir método');
    await page.waitForSelector('input[value="btc"]');
    await page.click('input[value="btc"]');
    assert.ok(
      await page.$eval('.bf-payment', el => el.textContent.includes('Recepción de pagos pendiente'))
    );
    assert.equal(await page.$$eval('a[href*="/bitforward/compras"]', n => n.length), 0);
    await page.evaluate(() => document.querySelector('#carrito').scrollIntoView());
    if (screenshots && [390, 1440].includes(width))
      await page.screenshot({ path: `${screenshots}/carrito-${width}.png` });
    if (width < 500) {
      await page.$eval('input[value="binance_pay"]', input =>
        input.scrollIntoView({ block: 'center', behavior: 'instant' })
      );
      await page.click('input[value="binance_pay"]');
      await page.waitForSelector('.bf-asset-picker select');
      await page.select('.bf-asset-picker select', 'BTC');
      await page.select('.bf-asset-picker select', 'USDT');
      assert.equal(await page.$eval('input[value="binance_pay"]', input => input.checked), true);
      assert.equal(await page.$eval('.bf-asset-picker select', select => select.value), 'USDT');
      assert.ok(
        await page.$eval('.bf-payment', el =>
          el.textContent.includes('Recepción de pagos pendiente de activar')
        )
      );
      assert.equal(await page.$$eval('a[href*="/bitforward/compras"]', n => n.length), 0);
      await page.evaluate(() => {
        const createObjectURL = URL.createObjectURL.bind(URL);
        URL.createObjectURL = blob => {
          window.__quoteBlob = blob;
          return createObjectURL(blob);
        };
      });
      await click('Descargar mi propuesta');
      const quote = await page.evaluate(async () => window.__quoteBlob?.text());
      assert.match(quote, /Método elegido: Binance Pay en USDT/);
      assert.match(quote, /PROPUESTA, NO ES UN PEDIDO NI UN COMPROBANTE/);
      if (screenshots) {
        await page.evaluate(() =>
          document.querySelector('.bf-asset-picker').scrollIntoView({
            block: 'center',
            behavior: 'instant',
          })
        );
        await page.screenshot({ path: `${screenshots}/binance-pay-${width}.png` });
      }
    }
    await page.goto(base + '/ruta.html', { waitUntil: 'networkidle0' });
    await page.waitForSelector('.bf-risk-lab');
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      `route overflow ${width}`
    );
    assert.equal(await page.$$eval('.bf-roadmap article', n => n.length), 6);
    await page.select('.bf-risk-fields select', 'short');
    await page.waitForFunction(() => !document.querySelector('.bf-risk-result .bf-loss'));
    await page.$eval('.bf-risk-fields input', input => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForFunction(() =>
      document.querySelector('.bf-risk-result').textContent.includes('valores válidos')
    );
    if (screenshots && width === 390) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${screenshots}/ruta-${width}.png` });
    }
    await page.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    '✓ Commerce: 320/390/768/1440px, touch layouts, cart replacement/removal/persistence, BTC and mobile Binance Pay/USDT previews, no live checkout, downloadable proposal, long/short scenarios and empty inputs.'
  );
} finally {
  await browser.close();
}
