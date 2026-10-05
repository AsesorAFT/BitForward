import { readdir,writeFile } from 'node:fs/promises';
import path from 'node:path';
import { redirectHtml,recoveryHtml } from './canonical-campus.mjs';
const root=path.resolve(process.argv[2]||'dist');
async function walk(dir){const items=await readdir(dir,{withFileTypes:true});for(const item of items){const file=path.join(dir,item.name);if(item.isDirectory())await walk(file);else if(item.name.endsWith('.html'))await writeFile(file,redirectHtml(path.relative(root,file)));}}
await walk(root);
await writeFile(path.join(root,'recuperar.html'),recoveryHtml());
await writeFile(path.join(root,'404.html'),redirectHtml('index.html'));
console.log('Public HTML entries now open the canonical AFORTU academy. Recovery page retained.');
