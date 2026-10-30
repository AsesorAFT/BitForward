import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';
import { mkdir } from 'node:fs/promises';
const base = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:4196';
const shots = process.env.PLATFORM_SCREENSHOTS;
if (shots) await mkdir(shots, { recursive: true });
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
try {
  for (const width of [390, 1440]) {
    const ctx = await browser.createBrowserContext(),
      page = await ctx.newPage();
    const errors = [],
      external = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => {
      if (!r.url().startsWith(base) && !/^(data|blob):/.test(r.url())) external.push(r.url());
    });
    await page.setViewport({ width, height: 1000 });
    await page.evaluateOnNewDocument(() => {
      window.walletCalls = [];
      window.discoveryCount = 0;
      window.pwned = false;
      const listeners = {};
      window.testWallet = {
        accounts: ['0x' + '1'.repeat(40)],
        chain: '0xaa36a7',
        balance: '0xde0b6b3a7640000',
        reject: false,
        on(e, f) {
          (listeners[e] ||= new Set()).add(f);
        },
        removeListener(e, f) {
          listeners[e]?.delete(f);
        },
        emit(e, v) {
          for (const f of listeners[e] || []) f(v);
        },
        async request(args) {
          window.walletCalls.push(args);
          if (this.reject && args.method === 'eth_requestAccounts') throw { code: 4001 };
          return {
            eth_accounts: this.accounts,
            eth_requestAccounts: this.accounts,
            eth_chainId: this.chain,
            eth_blockNumber: '0x10',
            eth_getBalance: this.balance,
          }[args.method];
        },
      };
      window.addEventListener('eip6963:requestProvider', () => {
        window.discoveryCount++;
        window.dispatchEvent(
          new CustomEvent('eip6963:announceProvider', {
            detail: {
              info: { name: 'Test Wallet <img src=x onerror="window.pwned=true">' },
              provider: window.testWallet,
            },
          })
        );
      });
    });
    await page.goto(base + '/plataforma.html#wallet', { waitUntil: 'networkidle0' });
    assert.equal(await page.$eval('.demo-chip', e => e.textContent), 'CONSULTA');
    assert.equal(await page.evaluate(() => discoveryCount), 0);
    assert.equal(await page.evaluate(() => walletCalls.length), 0);
    await page.click('#discover-wallets');
    await page.waitForSelector('[data-wallet]');
    assert.equal(await page.evaluate(() => walletCalls.length), 0);
    assert.equal(await page.evaluate(() => window.pwned), false);
    await page.evaluate(() => (testWallet.reject = true));
    await page.click('[data-wallet]');
    await page.waitForSelector('.wallet-error');
    assert.match(await page.$eval('.wallet-error', e => e.textContent), /cancelada/);
    await page.evaluate(() => (testWallet.reject = false));
    await page.click('#discover-wallets');
    await page.click('[data-wallet]');
    await page.waitForSelector('.wallet-balance');
    await page.waitForFunction(() =>
      document.querySelector('.wallet-status').textContent.includes('Lectura disponible')
    );
    assert.match(await page.$eval('.wallet-balance', e => e.textContent), /1 ETH de prueba/);
    assert.equal(await page.$$eval('.asset-card', x => x.length), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(
      await page.evaluate(() =>
        JSON.stringify({ ...localStorage, ...sessionStorage }).includes('111111111111111111')
      ),
      false
    );
    if (shots)
      await page.screenshot({ path: `${shots}/wallet-consulta-${width}.png`, fullPage: true });
    await page.evaluate(() => {
      testWallet.chain = '0xdead';
      testWallet.emit('chainChanged', '0xdead');
    });
    await page.waitForFunction(() =>
      document.querySelector('.wallet-status').textContent.includes('Red sin soporte')
    );
    assert.equal(await page.$eval('.wallet-balance', e => e.textContent), '—');
    await page.evaluate(() => {
      testWallet.chain = '0x1';
      testWallet.accounts = ['0x' + '2'.repeat(40)];
      testWallet.balance = '0x0';
      testWallet.emit('accountsChanged', testWallet.accounts);
    });
    await page.waitForFunction(() =>
      document.querySelector('.wallet-status').textContent.includes('Lectura disponible')
    );
    assert.match(await page.$eval('.wallet-balance', e => e.textContent), /0 ETH/);
    assert.match(await page.$eval('.wallet-address', e => e.textContent), /222222/);
    await page.click('a[href="#wallet?modo=demo"]');
    await page.waitForSelector('.asset-grid');
    assert.match(await page.$eval('.asset-grid', e => e.textContent), /DEMO/);
    await page.click('.wallet-tabs a[href="#wallet"]');
    await page.waitForSelector('#refresh-wallet');
    await page.click('#disconnect-wallet');
    await page.waitForSelector('#discover-wallets');
    assert.equal(await page.$$eval('.wallet-address', x => x.length), 0);
    const methods = await page.evaluate(() => walletCalls.map(x => x.method));
    assert.ok(
      methods.every(x =>
        [
          'eth_requestAccounts',
          'eth_accounts',
          'eth_chainId',
          'eth_blockNumber',
          'eth_getBalance',
        ].includes(x)
      )
    );
    await page.reload({ waitUntil: 'networkidle0' });
    assert.equal(await page.evaluate(() => walletCalls.length), 0);
    assert.equal(await page.evaluate(() => discoveryCount), 0);
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      `Wallet ${width}px: opt-in, rejection, provider escaping, read, network/account changes, demo isolation, disconnect, storage and no signing OK`
    );
    await ctx.close();
  }
  // Browser without a wallet stays usable, with an actionable fallback.
  const page = await browser.newPage();
  await page.goto(base + '/plataforma.html#wallet', { waitUntil: 'networkidle0' });
  await page.click('#discover-wallets');
  assert.match(await page.$eval('#no-wallet', e => e.textContent), /No detectamos/);
  await page.close();
} finally {
  await browser.close();
}
