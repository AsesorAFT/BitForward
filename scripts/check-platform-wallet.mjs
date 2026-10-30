import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const root = new URL('../platform-dist/', import.meta.url);
const files = await readdir(new URL('assets/', root));
const source = await readFile(
  new URL('../src/platform/wallet-session.mjs', import.meta.url),
  'utf8'
);
assert.ok(
  !/localStorage|sessionStorage|fetch\(/.test(source),
  'Wallet adapter must not persist or upload account state'
);
for (const name of files.filter(x => /\.js$/.test(x))) {
  const text = await readFile(new URL('assets/' + name, root), 'utf8');
  assert.ok(
    !/eth_sendTransaction|eth_sendRawTransaction|eth_sign|personal_sign|wallet_sendCalls|wallet_switchEthereumChain|wallet_addEthereumChain|signTransaction|signTypedData|PRIVATE_KEY|wallet-auth-client|wallet-manager-real/.test(
      text
    ),
    `Forbidden execution surface in ${name}`
  );
}
for (const entry of ['index.html', 'plataforma.html']) {
  const html = await readFile(new URL(entry, root), 'utf8');
  assert.ok(html.includes('Content-Security-Policy'));
  assert.ok(html.includes("script-src 'self'"));
  assert.ok(!/<script(?![^>]*src=)[^>]*>\s*\S/.test(html), 'No inline scripts');
}
console.log(
  'Platform boundary: read-only wallet; no transaction/signing SDK or legacy backend in release.'
);
