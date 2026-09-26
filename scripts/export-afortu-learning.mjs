/** Exports public curriculum only. Never reads or copies portal data into this repository. */
import { writeFileSync, readFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { missions } from '../src/ecosystem/data.mjs';
import { content } from '../src/ecosystem/content.mjs';
const target = process.argv[2];
const source = fileURLToPath(new URL('../', import.meta.url));
if (!target) throw new Error('Indica la carpeta apps/afortu-sites del checkout privado.');
const { JSDOM } = await import('jsdom');
const exported = missions.map(m => {
  if (content[m.id])
    return { ...m, sections: content[m.id].sections.slice(0, 3), sources: content[m.id].sources };
  const doc = new JSDOM(readFileSync(resolve(source, `misiones/${m.slug}.html`), 'utf8')).window.document;
  const sections = [...doc.querySelectorAll('.article-content > h2')]
    .slice(0, 3)
    .map(h => [h.textContent, h.nextElementSibling.textContent.trim().replace(/\s+/g, ' ')]);
  return {
    ...m,
    sections,
    sources: [...doc.querySelectorAll('.article-sources a')].map(a => [
      a.textContent.replace(/\s+/g, ' ').trim(),
      a.href,
    ]),
  };
});
const dir = resolve(target, 'app/lib/learning');
mkdirSync(dir, { recursive: true });
writeFileSync(resolve(dir, 'bitforward-curriculum.json'), JSON.stringify(exported, null, 2) + '\n');
const out = resolve(target, 'public/bitforward');
mkdirSync(out, { recursive: true });
for (const file of ['advisor-atf-approved.webp'])
  copyFileSync(resolve(source, 'assets/brand', file), resolve(out, file));
for (const file of [
  'spacegrotesk-latin.woff2',
  'manrope-latin.woff2',
  'spacegrotesk-OFL.txt',
  'manrope-OFL.txt',
])
  copyFileSync(resolve(source, 'assets/fonts', file), resolve(out, file));
console.log('Public curriculum and approved brand assets exported to private portal checkout.');

// The adaptive engine and UI are public learning code. Export is intentionally one-way.
const shared = resolve(dir, 'campus');
mkdirSync(shared, { recursive: true });
for (const file of [
  'adaptive-content.mjs',
  'adaptive-engine.mjs',
  'adaptive-engine.d.mts',
  'AdaptiveCampus.jsx',
  'AdaptiveCampus.d.ts',
  'adaptive.css',
  'data.mjs',
])
  copyFileSync(resolve(source, 'src/ecosystem', file), resolve(shared, file));
console.log('Shared ATF diagnostic, concept engine and campus exported.');
