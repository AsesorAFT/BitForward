/** Source-level interaction checks in a DOM, not a visual browser audit. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import {
  analyzeExposure,
  calculateGas,
  safeSource,
  analysisMarkdown,
} from '../src/ecosystem/engine.mjs';
import { normalizeState, STORAGE_KEY } from '../src/ecosystem/storage.mjs';
import { missions, assets } from '../src/ecosystem/data.mjs';
const sample = analyzeExposure(
  [
    { symbol: 'BTC', value: 500 },
    { symbol: 'ETH', value: 250 },
    { symbol: 'ADA', value: 50 },
    { symbol: 'USDT', value: 150, stable: true },
    { symbol: 'USDC', value: 50, stable: true },
  ],
  30,
  5
);
assert.equal(sample.total, 1000);
assert.equal(sample.loss, 250);
assert.equal(sample.after, 750);
assert.equal(sample.largest.symbol, 'BTC');
assert.equal(sample.stableShare, 0.2);
assert.equal(analyzeExposure([{ symbol: 'USDT', value: 100, stable: true }], 80, 0).loss, 0);
assert.equal(analyzeExposure([{ symbol: 'BTC', value: 100 }], 100, 0).after, 0);
for (const value of ['', ' ', -1, Infinity, NaN, 1e10])
  assert.throws(() => analyzeExposure([{ symbol: 'BTC', value }], 30, 5));
assert.throws(() => analyzeExposure([{ symbol: 'BTC', value: 0 }], 30, 5));
assert.throws(() => analyzeExposure([{ symbol: 'BTC', value: 10 }], 101, 5));
assert.throws(() => analyzeExposure([{ symbol: 'BTC', value: 10 }], 20, -1));
assert.deepEqual(calculateGas(21000, 10, ''), { eth: 0.00021, usd: null });
assert.equal(calculateGas(21000, 10, 3000).usd, 0.63);
assert.equal(calculateGas(21000, 0, 3000).usd, 0);
assert.throws(() => calculateGas(1.5, 10, 3000));
assert.throws(() => calculateGas(21000, -1, 3000));
assert.equal(safeSource('javascript:alert(1)'), '');
assert.equal(safeSource('https://ethereum.org/'), 'https://ethereum.org/');
assert.match(
  analysisMarkdown({
    asset: 'BTC',
    date: '2026-09-25',
    purpose: 'Uso',
    evidence: 'Dato',
    source: 'https://bitcoin.org/',
    risk: 'Claves',
    invalidate: 'Cambio',
    review: 'Próximo mes',
  }),
  /## Evidencia\nDato/
);
assert.deepEqual(normalizeState({ completed: ['001', '001', '999'], entries: 'bad' }).completed, [
  '001',
]);
assert.equal(
  normalizeState({
    entries: Array.from({ length: 110 }, (_, i) => ({ id: String(i), text: 'nota' })),
  }).entries.length,
  100
);
assert.equal(missions.length, 9);
assert.equal(new Set(missions.map(m => m.id)).size, 9);
assert.equal(assets.length, 6);
for (const m of missions) {
  assert.ok(m.options[m.correct]);
  assert.ok(m.deliverable);
  assert.ok(readFileSync(`misiones/${m.slug}.html`, 'utf8').includes('data-checkpoint'));
}
console.log(
  '✓ Calculations: mixed exposure, depeg, extremes, invalid inputs, gas, export and local-state normalization.'
);
async function bundle(entry, definitions = {}) {
  const r = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'iife',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"', ...definitions },
    loader: { '.css': 'empty', '.svg': 'dataurl', '.webp': 'dataurl' },
    logLevel: 'silent',
  });
  return r.outputFiles[0].text;
}
function dom(html, url = 'https://example.test/BitForward/laboratorio.html') {
  const d = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true });
  d.window.matchMedia = () => ({ addEventListener() {} });
  d.window.URL.createObjectURL = () => 'blob:https://example.test/export';
  d.window.URL.revokeObjectURL = () => {};
  d.window.HTMLAnchorElement.prototype.click = function () {};
  return d;
}
const tick = () => new Promise(resolve => setTimeout(resolve, 25));
function input(d, id, value) {
  const el = d.window.document.getElementById(id);
  assert.ok(el, id);
  const proto =
    el.tagName === 'TEXTAREA'
      ? d.window.HTMLTextAreaElement.prototype
      : el.tagName === 'SELECT'
        ? d.window.HTMLSelectElement.prototype
        : d.window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(
    new d.window.Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })
  );
}
async function clickText(d, label, selector = 'button') {
  const el = [...d.window.document.querySelectorAll(selector)].find(e =>
    e.textContent.includes(label)
  );
  assert.ok(el, 'button: ' + label);
  el.click();
  await tick();
}
const lab = dom(readFileSync('laboratorio.html', 'utf8'));
lab.window.eval(await bundle('src/ecosystem/lab.jsx'));
await tick();
const doc = lab.window.document;
assert.equal(doc.querySelectorAll('.asset-profile').length, 2);
await clickText(lab, 'Mapa de exposición');
await clickText(lab, 'Cargar ejemplo');
assert.match(doc.querySelector('.result-number').textContent, /750/);
input(lab, 'market-drop', '0');
await tick();
assert.match(doc.querySelector('.result-number').textContent, /990/);
await clickText(lab, 'Calculadora de gas');
assert.match(doc.querySelector('.gas-number').textContent, /0.00021/);
input(lab, 'eth-price', '3000');
await tick();
assert.match(doc.querySelector('.gas-layout').textContent, /0.63/);
await clickText(lab, 'Mapa de exposición');
assert.equal(doc.getElementById('value-BTC').value, '500', 'values persist when changing tools');
await clickText(lab, 'Ficha de análisis');
for (const [id, v] of [
  ['purpose', 'Transferencias'],
  ['evidence', 'Documentación primaria'],
  ['risk', 'Claves'],
  ['invalidate', 'Cambio de evidencia'],
]) {
  input(lab, 'analysis-' + id, v);
  await tick();
}
await clickText(lab, 'Guardar en este navegador');
assert.equal(JSON.parse(lab.window.localStorage.getItem(STORAGE_KEY)).analysis.risk, 'Claves');
await clickText(lab, 'Mi bitácora');
input(lab, 'journal-note', 'Aprendí a distinguir fuente e hipótesis.');
await tick();
doc
  .querySelector('#journal-note')
  .closest('form')
  .dispatchEvent(new lab.window.Event('submit', { bubbles: true, cancelable: true }));
await tick();
assert.equal(JSON.parse(lab.window.localStorage.getItem(STORAGE_KEY)).entries.length, 1);
assert.match(doc.querySelector('.journal-list').textContent, /fuente e hipótesis/);
await clickText(lab, 'Borrar todos');
await clickText(lab, 'Cancelar');
assert.ok(lab.window.localStorage.getItem(STORAGE_KEY));
await clickText(lab, 'Borrar todos');
await clickText(lab, 'Confirmar borrado');
assert.equal(lab.window.localStorage.getItem(STORAGE_KEY), null);
assert.equal(
  doc.querySelectorAll('[id]').length,
  new Set([...doc.querySelectorAll('[id]')].map(e => e.id)).size
);
lab.window.close();
console.log(
  '✓ Lab interactions: comparison, scenario, gas, draft preservation, saved analysis, journal and confirmed deletion.'
);
const tutor = dom(readFileSync('atf.html', 'utf8'), 'https://example.test/BitForward/atf.html');
tutor.window.eval(await bundle('src/ecosystem/tutor.jsx'));
await tick();
input(tutor, 'tutor-focus', 'ETH');
await tick();
await clickText(tutor, 'Comenzar mi sesión');
assert.match(tutor.window.document.querySelector('.tutor-session h2').textContent, /gasolinera/);
await clickText(tutor, 'Entendido');
assert.match(tutor.window.document.querySelector('.practice-step a').href, /herramienta=gas/);
await clickText(tutor, 'Ya practiqué');
const form = tutor.window.document.querySelector('.tutor-check');
form.querySelector('input[value="1"]').click();
await tick();
form.dispatchEvent(new tutor.window.Event('submit', { bubbles: true, cancelable: true }));
await tick();
assert.equal(
  tutor.window.localStorage.getItem(STORAGE_KEY),
  null,
  'wrong answer does not save progress'
);
form.querySelector('input[value="0"]').click();
await tick();
form.dispatchEvent(new tutor.window.Event('submit', { bubbles: true, cancelable: true }));
await tick();
assert.deepEqual(JSON.parse(tutor.window.localStorage.getItem(STORAGE_KEY)).completed, ['002']);
await clickText(tutor, 'Siguiente tema');
assert.match(tutor.window.document.querySelector('.tutor-session h2').textContent, /Stablecoins/);
tutor.window.close();
console.log(
  '✓ ATF session: topic choice, lesson, practice handoff, incorrect feedback, correct completion and next topic.'
);
const learningBundle = await bundle('src/ecosystem/learning.js');
for (const m of missions) {
  const lesson = dom(readFileSync(`misiones/${m.slug}.html`, 'utf8'));
  lesson.window.eval(learningBundle);
  const f = lesson.window.document.querySelector('[data-checkpoint] form');
  f.querySelector(`input[value="${m.correct}"]`).click();
  f.dispatchEvent(new lesson.window.Event('submit', { bubbles: true, cancelable: true }));
  assert.deepEqual(JSON.parse(lesson.window.localStorage.getItem(STORAGE_KEY)).completed, [m.id]);
  lesson.window.close();
}
console.log('✓ All nine article checkpoints save correct progress. No browser layout claims.');

for (const ready of ['0', '1']) {
  const access = dom(readFileSync('acceso.html', 'utf8'));
  access.window.eval(
    await bundle('src/ecosystem/access.js', {
      'import.meta.env.VITE_AFORTU_LEARNING_READY': JSON.stringify(ready),
    })
  );
  const link = access.window.document.querySelector('[data-afortu-learning-link]');
  assert.equal(
    link.href,
    ready === '1' ? 'https://app.afortu.com.mx/mi-afortu/bitforward' : 'https://app.afortu.com.mx/'
  );
  assert.equal(link.hasAttribute('target'), ready === '0');
  access.window.close();
}
console.log('✓ AFORTU OS link stays gated until explicitly activated after portal deployment.');
