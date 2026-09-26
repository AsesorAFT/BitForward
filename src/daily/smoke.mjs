import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import puppeteer from 'puppeteer';
import { questions } from '../ecosystem/adaptive-engine.mjs';
import { STORAGE_KEY } from '../ecosystem/storage.mjs';

const base = (process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const screenshots = process.env.DAILY_SCREENSHOTS;
const browser = await puppeteer.launch({
  headless: true,
  ...(process.env.PUPPETEER_EXECUTABLE_PATH
    ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }
    : {}),
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));

try {
  for (const width of [320, 390, 1440]) {
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
    await page.goto(`${base}/practica.html`, { waitUntil: 'networkidle0' });
    await page.evaluate(key => localStorage.removeItem(key), STORAGE_KEY);
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector('input[name="daily-answer"]');
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
      ),
      true,
      `no horizontal overflow at ${width}px`
    );
    assert.match(
      await page.$eval('.daily-label', element => element.textContent),
      /Punto de partida/
    );
    if (screenshots && width === 390) {
      await mkdir(screenshots, { recursive: true });
      await page.screenshot({ path: resolve(screenshots, 'practica-390.png'), fullPage: true });
    }
  }

  await page.setViewport({ width: 390, height: 900, deviceScaleFactor: 1 });
  await page.evaluate(key => {
    localStorage.setItem(
      key,
      JSON.stringify({ entries: [{ id: 'nota-previa', text: 'Conservar esta nota' }] })
    );
  }, STORAGE_KEY);
  await page.reload({ waitUntil: 'networkidle0' });
  const prompt = await page.$eval('legend', element => element.textContent);
  const question = questions.find(item => item.prompt === prompt);
  assert.ok(question);
  await page.click(`input[name="daily-answer"][value="${question.correct}"]`);
  await page.click('button[type="submit"]');
  await page.waitForSelector('.daily-save');
  assert.match(await page.$eval('.daily-save', element => element.textContent), /Guardado/);
  assert.equal(await page.evaluate(() => document.activeElement.tagName), 'H2');
  const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  assert.equal(stored.adaptive.attempts.length, 1);
  assert.equal(stored.entries[0].text, 'Conservar esta nota');
  await page.reload({ waitUntil: 'networkidle0' });
  assert.match(
    await page.$eval('.daily-label', element => element.textContent),
    /Ya hiciste tu práctica de hoy/
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
    ),
    true,
    'completed view remains inside the viewport'
  );
  if (screenshots) {
    await page.screenshot({
      path: resolve(screenshots, 'practica-completada-390.png'),
      fullPage: true,
    });
  }
  assert.deepEqual(errors, []);
  console.log('✓ Práctica diaria: 320/390/1440 px, respuesta, guardado y reanudación.');
} finally {
  await browser.close();
}
