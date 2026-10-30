import { cp, mkdir } from 'node:fs/promises';
await cp('platform-dist/plataforma.html', 'platform-dist/index.html');
await mkdir('platform-dist/docs', { recursive: true });
for (const name of [
  'propuesta-tokens.html',
  'token-demo-390.png',
  'token-demo-1440.png',
  'catalogo-demo-390.png',
  'catalogo-demo-1440.png',
]) {
  await cp(`public/docs/${name}`, `platform-dist/docs/${name}`);
}
console.log('Preview entry and approved demo documentation prepared.');
