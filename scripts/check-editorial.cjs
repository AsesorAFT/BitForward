/** Verify the actual production HTML, GitHub Pages subpath and progressive enhancement. */
const assert = require('node:assert/strict');
const { readFileSync, existsSync, readdirSync } = require('node:fs');
const { resolve } = require('node:path');
const { JSDOM } = require('jsdom');
const pages = [
  'index.html',
  'misiones.html',
  'laboratorio.html',
  'membresias.html',
  'atf.html',
  'acceso.html',
  ...readdirSync('misiones')
    .filter(file => file.endsWith('.html'))
    .map(file => 'misiones/' + file),
];
for (const path of pages) {
  const html = readFileSync(resolve('dist', path), 'utf8');
  const document = new JSDOM(html).window.document;
  assert.equal(document.documentElement.lang, 'es-MX');
  assert.equal(document.querySelectorAll('h1').length, 1, `${path}: exactly one h1`);
  assert.ok(
    document.querySelector('main').textContent.length > 500,
    `${path}: readable without JS`
  );
  const ids = [...document.querySelectorAll('[id]')].map(el => el.id);
  assert.equal(new Set(ids).size, ids.length, `${path}: duplicate IDs`);
  for (const image of document.images) {
    assert.ok(image.hasAttribute('alt'), `${path}: image alt`);
    assert.ok(image.width && image.height, `${path}: image dimensions`);
  }
  for (const element of document.querySelectorAll('[href], [src]')) {
    const value = element.getAttribute('href') || element.getAttribute('src');
    if (!value || /^(https?:|mailto:|data:)/.test(value)) continue;
    assert.ok(
      !value.startsWith('/'),
      `${path}: root-relative path breaks Pages subdirectory: ${value}`
    );
    const url = new URL(value, `https://example.test/BitForward/${path}`);
    assert.ok(url.pathname.startsWith('/BitForward/'), `${path}: escaped deployment base`);
    let file = url.pathname.slice('/BitForward/'.length);
    if (!file || file.endsWith('/')) file += 'index.html';
    assert.ok(existsSync(resolve('dist', decodeURIComponent(file))), `${path}: missing ${value}`);
    if (url.hash && file.endsWith('.html') && !file.endsWith('cockpit.html')) {
      const target = new JSDOM(readFileSync(resolve('dist', file), 'utf8')).window.document;
      assert.ok(
        target.getElementById(decodeURIComponent(url.hash.slice(1))),
        `${path}: missing anchor ${value}`
      );
    }
  }
  for (const link of document.querySelectorAll('a[target="_blank"]')) {
    assert.ok(link.rel.includes('noopener'), `${path}: external link rel`);
    assert.ok(link.textContent.includes('nueva pestaña'), `${path}: disclose new tab`);
  }
  const loadedScripts = [...document.querySelectorAll('script[src]')].map(s => s.src).join(' ');
  if (!['laboratorio.html', 'atf.html'].includes(path))
    assert.ok(!loadedScripts.includes('vendor-react'), `${path}: editorial should not load React`);
}
const source = readFileSync('src/editorial/main.js', 'utf8').replace(/^import .+;$/gm, '');
const dom = new JSDOM(readFileSync('index.html', 'utf8'), {
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  url: 'https://example.test/BitForward/',
});
let onMotionPreferenceChange;
const motionPreference = {
  matches: false,
  addEventListener(_event, listener) {
    onMotionPreferenceChange = listener;
  },
};
dom.window.matchMedia = query =>
  query.includes('prefers-reduced-motion') ? motionPreference : { addEventListener() {} };
dom.window.eval(source);
const doc = dom.window.document;
const menu = doc.querySelector('.menu-toggle');
assert.equal(menu.hidden, false);
menu.click();
assert.equal(menu.getAttribute('aria-expanded'), 'true');
doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape' }));
assert.equal(menu.getAttribute('aria-expanded'), 'false');
assert.equal(doc.activeElement, menu);
menu.click();
doc.querySelector('#main-nav a').addEventListener('click', event => event.preventDefault());
doc.querySelector('#main-nav a').click();
assert.equal(menu.getAttribute('aria-expanded'), 'false');
for (const category of ['ethereum', 'seguridad', 'fundamentos', 'all']) {
  doc.querySelector(`[data-filter="${category}"]`).click();
  const visible = [...doc.querySelectorAll('.mission-card')].filter(el => !el.hidden);
  assert.equal(visible.length, category === 'all' ? 3 : 1);
  assert.equal(doc.querySelectorAll('[data-filter][aria-pressed="true"]').length, 1);
  if (category !== 'all') assert.equal(visible[0].dataset.category, category);
  assert.ok(doc.querySelector('#filter-result').textContent);
}
const motionButton = doc.querySelector('.motion-toggle');
assert.equal(motionButton.hidden, false);
assert.equal(doc.documentElement.dataset.coinMotion, 'running');
motionButton.click();
assert.equal(doc.documentElement.dataset.coinMotion, 'paused');
assert.ok(motionButton.textContent.includes('Activar movimiento'));
motionButton.click();
assert.equal(doc.documentElement.dataset.coinMotion, 'running');
motionPreference.matches = true;
onMotionPreferenceChange();
assert.equal(doc.documentElement.dataset.coinMotion, 'paused');
assert.equal(motionButton.disabled, true);
motionButton.click();
assert.equal(doc.documentElement.dataset.coinMotion, 'paused');
motionPreference.matches = false;
onMotionPreferenceChange();
assert.equal(motionButton.disabled, false);
assert.equal(doc.documentElement.dataset.coinMotion, 'running');
console.log(
  '✓ Fifteen pages: valid assets, links, anchors, metadata, no-JS content and /BitForward/ base.'
);
console.log(
  '✓ Menu open/close/Escape/focus and all four mission filters. DOM checks; not a visual browser audit.'
);
console.log('✓ Coin motion can be paused and respects changes to reduced-motion preferences.');
