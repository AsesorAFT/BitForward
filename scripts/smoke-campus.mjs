import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import puppeteer from 'puppeteer';
import { questions } from '../src/ecosystem/adaptive-content.mjs';
import { STORAGE_KEY } from '../src/ecosystem/storage.mjs';

const base = (process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const screenshots = process.env.CAMPUS_SCREENSHOTS;
const browser = await puppeteer.launch({
  headless: true,
  ...(process.env.PUPPETEER_EXECUTABLE_PATH
    ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }
    : {}),
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
async function button(label) {
  const handle = await page.waitForFunction(
    text => [...document.querySelectorAll('button')].find(b => b.textContent.includes(text)),
    {},
    label
  );
  await handle.asElement().click();
  await handle.dispose();
}
async function screenshot(name) {
  if (!screenshots) return;
  await mkdir(screenshots, { recursive: true });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: resolve(screenshots, name + '.png'), fullPage: true });
}
async function noOverflow() {
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
    ),
    'campus remains inside the viewport'
  );
}
async function correctAnswer() {
  const prompt = await page.$eval('legend', el => el.textContent);
  const q = questions.find(q => q.prompt === prompt);
  assert.ok(q, 'rendered question is in the curriculum');
  await page.click(`input[name="atf-answer"][value="${q.correct}"]`);
  await button(q.stage === 'diagnostic' ? 'Registrar respuesta' : 'Comprobar respuesta');
  await page.waitForSelector('.atf-feedback');
  return q;
}
try {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewport({ width, height: 950, deviceScaleFactor: 1 });
    await page.goto(base + '/atf.html', { waitUntil: 'networkidle0' });
    await page.waitForSelector('.atf-concept');
    await noOverflow();
    assert.equal(await page.$$eval('.atf-concept', els => els.length), 9);
    assert.ok(await page.$eval('.atf-guide img', img => img.naturalWidth > 0));
    if ([390, 1440].includes(width)) await screenshot(`campus-${width}`);
    await button('Comenzar diagnóstico');
    await noOverflow();
    assert.equal(await page.evaluate(() => document.activeElement.tagName), 'H2');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.type), 'radio');
    if (width === 390) await screenshot('diagnostico-390');
  }
  // A previous mission checkpoint and notes must survive the new campus.
  await page.evaluate(key => {
    localStorage.setItem(
      key,
      JSON.stringify({
        completed: ['001'],
        entries: [{ id: 'fixture-note', text: 'Mi nota anterior' }],
      })
    );
  }, STORAGE_KEY);
  await page.reload({ waitUntil: 'networkidle0' });
  await button('Comenzar diagnóstico');
  for (let i = 0; i < 9; i++) {
    await correctAnswer();
    await button(i === 8 ? 'Ver mi ruta' : 'Siguiente concepto');
  }
  await page.waitForSelector('.atf-next');
  assert.match(await page.$eval('.atf-counter strong', e => e.textContent), /^0/);
  await button('Entrar al aula');
  await button('Necesito una pista');
  await correctAnswer();
  assert.match(await page.$eval('.atf-feedback', e => e.textContent), /no añade evidencia/);
  await screenshot('aula-1440');
  await button('Otro ejercicio');
  await correctAnswer();
  await button('Otro ejercicio');
  await correctAnswer();
  assert.match(await page.$eval('.atf-counter strong', e => e.textContent), /^1/);
  await button('Ver mi siguiente paso');
  assert.match(await page.$eval('.atf-next', e => e.textContent), /Claves y permisos/);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('.atf-concept');
  assert.match(await page.$eval('.atf-counter strong', e => e.textContent), /^1/);
  const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
  assert.deepEqual(stored.completed, ['001']);
  assert.equal(stored.entries[0].text, 'Mi nota anterior');
  await button('Laboratorio');
  await screenshot('laboratorio-1440');
  const links = await page.$$eval('.atf-lab-grid a', els => els.map(el => el.href));
  assert.equal(links.length, 9);
  for (const link of [...new Set(links)]) {
    await page.goto(link, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.tool-heading');
    const target = new URL(link).searchParams.get('herramienta');
    const labels = {
      comparar: 'Comparar activos',
      riesgo: 'Mapa de exposición',
      gas: 'Calculadora de gas',
      ficha: 'Ficha de análisis',
      bitacora: 'Mi bitácora',
    };
    assert.ok(
      (await page.$eval('.tool-nav button[aria-pressed="true"]', e => e.textContent)).includes(
        labels[target]
      )
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    '✓ Campus: four viewports, keyboard focus, nine-question diagnosis, hints, independent evidence, prerequisite recommendation, reload, preserved notes and all lab links.'
  );
} finally {
  await browser.close();
}
