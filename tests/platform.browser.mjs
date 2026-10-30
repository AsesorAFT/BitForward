import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import puppeteer from 'puppeteer';
const base = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4196';
const shots = process.env.PLATFORM_SCREENSHOTS;
if (shots) await mkdir(shots, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
try {
  for (const width of [390, 1440]) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    const errors = [],
      external = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => {
      if (!r.url().startsWith(base) && !r.url().startsWith('data:') && !r.url().startsWith('blob:'))
        external.push(r.url());
    });
    await page.setViewport({ width, height: 1000 });
    await page.evaluateOnNewDocument(() => {
      for (const name of ['ethereum', 'solana'])
        Object.defineProperty(window, name, {
          get() {
            throw new Error('Unexpected wallet access');
          },
        });
    });
    await page.goto(base + '/plataforma.html', { waitUntil: 'networkidle0' });
    const fits = async () =>
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `Overflow ${width} ${page.url()}`
      );
    const route = async hash => {
      await page.evaluate(h => {
        location.hash = h;
      }, hash);
      await page.waitForFunction(h => location.hash === h, {}, hash);
      await new Promise(r => setTimeout(r, 150));
      await fits();
    };
    await fits();
    if (shots) await page.screenshot({ path: `${shots}/inicio-${width}.png`, fullPage: true });
    await route('#mercados?q=BTW');
    assert.equal(await page.$$eval('[data-instrument]', x => x.length), 2);
    await page.click('[data-favorite]');
    await page.reload({ waitUntil: 'networkidle0' });
    assert.equal(await page.$$eval('.star[aria-pressed=true]', x => x.length), 1);
    await page.$eval('#market-search', x => {
      x.value = '';
      x.dispatchEvent(new Event('input'));
    });
    assert.equal(await page.$$eval('[data-instrument]', x => x.length), 43);
    if (shots) await page.screenshot({ path: `${shots}/mercados-${width}.png`, fullPage: false });
    await page.click('[data-instrument^="binance:alpha:selection-BTW"]');
    assert.match(await page.$eval('#instrument-dialog', x => x.textContent), /Solo exploración/);
    assert.equal(await page.$$eval('#instrument-dialog a[href^="#comprar"]', x => x.length), 0);
    await page.click('.close-dialog');
    await route('#comprar?instrument=binance%3Aspot%3ABTCUSDT');
    await page.waitForSelector('#trade-frame');
    let frame = await (await page.$('#trade-frame')).contentFrame();
    await frame.waitForSelector('#practice');
    assert.equal(await frame.$eval('#pair', x => x.value), 'binance:spot:BTCUSDT');
    await frame.click('#practice');
    await frame.click('#selection button');
    await frame.click('#consent');
    await frame.waitForFunction(() => !document.querySelector('#confirm').disabled);
    await frame.click('#confirm');
    await frame.waitForFunction(() =>
      document.querySelector('#result-title').textContent.includes('confirmada')
    );
    await route('#wallet');
    assert.match(await page.$eval('#activity', x => x.textContent), /DEMO-OP-0001/);
    assert.match(await page.$eval('.asset-grid', x => x.textContent), /BTC/);
    await route('#portafolio');
    assert.equal(await page.$$eval('.history-row', x => x.length), 1);
    await route('#comprar');
    frame = await (await page.$('#trade-frame')).contentFrame();
    await frame.waitForSelector('#again');
    await frame.click('#again');
    await frame.click('#selection button');
    await frame.click('#consent');
    await frame.select('#scenario', 'failure');
    await frame.waitForFunction(() => !document.querySelector('#confirm').disabled);
    await frame.click('#confirm');
    await frame.waitForFunction(() =>
      document.querySelector('#result-title').textContent.includes('fallida')
    );
    await route('#wallet');
    assert.equal(await page.$$eval('.history-row', x => x.length), 2);
    assert.match(await page.$eval('#activity', x => x.textContent), /Fallida · sin cargo/);
    await route('#academia');
    await page.click('[data-lesson="0"]');
    await page.click('input[name=answer][value="1"]');
    await page.click('#quiz button');
    assert.match(await page.$eval('#quiz-result', x => x.textContent), /Correcto/);
    await page.reload({ waitUntil: 'networkidle0' });
    assert.match(await page.$eval('[data-lesson="0"]', x => x.textContent), /Completada/);
    await route('#comunidad');
    await page.type('#notes', 'Mi primera prueba de BitForward.');
    await page.click('#save-notes');
    await page.reload({ waitUntil: 'networkidle0' });
    assert.equal(await page.$eval('#notes', x => x.value), 'Mi primera prueba de BitForward.');
    await route('#futuros');
    assert.match(await page.$eval('#futures-result', x => x.textContent), /2.00/);
    await page.select('[name=side]', '-1');
    await page.click('#futures-form button');
    assert.match(await page.$eval('#futures-result', x => x.textContent), /-2.00/);
    await route('#cuenta');
    assert.match(await page.$eval('#content', x => x.textContent), /no acepta dinero/);
    if (width === 390) {
      await page.click('#menu');
      assert.equal(await page.$eval('#menu', x => x.getAttribute('aria-expanded')), 'true');
      await page.click('[data-route="inicio"]');
      assert.equal(await page.$eval('#menu', x => x.getAttribute('aria-expanded')), 'false');
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      `Platform ${width}px: all routes, catalog, favorites, spot success/failure, portfolio, lessons, notes and futures OK`
    );
    await context.close();
  }
} finally {
  await browser.close();
}
