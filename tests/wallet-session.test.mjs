import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import {
  createWalletSession,
  discoverWallets,
  formatNativeBalance,
} from '../src/platform/wallet-session.mjs';
const A = '0x' + '1'.repeat(40),
  B = '0x' + '2'.repeat(40);
class Provider extends EventEmitter {
  accounts = [A];
  chain = '0xaa36a7';
  calls = [];
  balance = '0xde0b6b3a7640000';
  hook;
  async request(args) {
    this.calls.push(args);
    if (this.hook) {
      const result = await this.hook(args);
      if (result !== undefined) return result;
    }
    return {
      eth_requestAccounts: this.accounts,
      eth_accounts: this.accounts,
      eth_chainId: this.chain,
      eth_blockNumber: '0x10',
      eth_getBalance: this.balance,
    }[args.method];
  }
}
const tick = () => new Promise(r => setTimeout(r, 20));
test('construction does not touch a wallet; connection reads a pinned block without signing', async () => {
  const p = new Provider(),
    s = createWalletSession();
  assert.equal(p.calls.length, 0);
  await s.connect(p, 'Test');
  assert.equal(s.getState().balance, '1');
  assert.equal(s.getState().network.testnet, true);
  assert.equal(s.getState().block, '16');
  assert.deepEqual(p.calls.find(x => x.method === 'eth_getBalance').params, [A, '0x10']);
  assert.ok(
    p.calls.every(x =>
      [
        'eth_requestAccounts',
        'eth_accounts',
        'eth_chainId',
        'eth_blockNumber',
        'eth_getBalance',
      ].includes(x.method)
    )
  );
  assert.equal(s.getState().provider, undefined);
  assert.equal(s.request, undefined);
  assert.equal(s.sign, undefined);
  s.disconnect();
  assert.equal(s.getState().account, null);
  assert.equal(p.listenerCount('accountsChanged'), 0);
});
test('precise native quantities, zero and malformed responses', () => {
  assert.equal(formatNativeBalance('0x0'), '0');
  assert.equal(formatNativeBalance('0x1'), '0.000000000000000001');
  assert.equal(formatNativeBalance('0xde0b6b3a7640001'), '1.000000000000000001');
  for (const bad of ['-1', '0x', '0x00', '0xNaN', null, '0x' + 'f'.repeat(65)])
    assert.throws(() => formatNativeBalance(bad));
});
test('refused permission leaves no account and permits retry', async () => {
  const p = new Provider(),
    s = createWalletSession();
  p.hook = ({ method }) => {
    if (method === 'eth_requestAccounts') throw { code: 4001 };
  };
  await s.connect(p);
  assert.equal(s.getState().status, 'disconnected');
  assert.match(s.getState().error, /cancelada/);
  assert.equal(p.calls.length, 1);
  p.hook = null;
  await s.connect(p);
  assert.equal(s.getState().status, 'connected');
  s.disconnect();
});
test('unknown networks do not read balances or request a network switch', async () => {
  const p = new Provider(),
    s = createWalletSession();
  p.chain = '0xdead';
  await s.connect(p);
  assert.equal(s.getState().status, 'unsupported');
  assert.equal(s.getState().balance, null);
  assert.ok(!p.calls.some(x => /Balance|switch|addEthereumChain/.test(x.method)));
  s.disconnect();
});
test('account and network changes invalidate data and reread', async () => {
  const p = new Provider(),
    s = createWalletSession();
  await s.connect(p);
  p.accounts = [B];
  p.balance = '0x0';
  p.emit('accountsChanged', [B]);
  assert.equal(s.getState().balance, null);
  await tick();
  assert.equal(s.getState().account, B);
  assert.equal(s.getState().balance, '0');
  p.chain = '0x1';
  p.emit('chainChanged', '0x1');
  assert.equal(s.getState().balance, null);
  await tick();
  assert.equal(s.getState().network.testnet, false);
  s.disconnect();
});
test('revoked account permissions clear the session', async () => {
  const p = new Provider(),
    s = createWalletSession();
  await s.connect(p);
  p.accounts = [];
  p.emit('accountsChanged', []);
  await tick();
  assert.equal(s.getState().status, 'disconnected');
  assert.equal(s.getState().balance, null);
});
test('disconnect invalidates a pending permission response', async () => {
  const p = new Provider(),
    s = createWalletSession();
  let release;
  p.hook = ({ method }) =>
    method === 'eth_requestAccounts' ? new Promise(r => (release = r)) : undefined;
  const job = s.connect(p);
  await tick();
  s.disconnect();
  release([A]);
  await job;
  assert.equal(s.getState().status, 'disconnected');
  assert.equal(p.calls.length, 1);
});
test('late balance cannot overwrite new account data', async () => {
  const p = new Provider(),
    s = createWalletSession();
  await s.connect(p);
  let release,
    once = true;
  p.hook = ({ method }) => {
    if (method === 'eth_getBalance' && once) {
      once = false;
      return new Promise(r => (release = r));
    }
  };
  const old = s.refresh();
  await tick();
  p.accounts = [B];
  p.balance = '0x0';
  p.emit('accountsChanged', [B]);
  await tick();
  release('0xde0b6b3a7640000');
  await old;
  assert.equal(s.getState().account, B);
  assert.equal(s.getState().balance, '0');
  s.disconnect();
});
test('context drift without events fails closed', async () => {
  const p = new Provider(),
    s = createWalletSession();
  p.hook = ({ method }) => {
    if (method === 'eth_getBalance') p.chain = '0x1';
  };
  await s.connect(p);
  assert.equal(s.getState().status, 'error');
  assert.equal(s.getState().balance, null);
  s.disconnect();
});
test('a refresh error clears the previous successful balance', async () => {
  const p = new Provider(),
    s = createWalletSession();
  await s.connect(p);
  p.balance = 'invalid';
  await s.refresh();
  assert.equal(s.getState().balance, null);
  assert.equal(s.getState().readAt, null);
  assert.equal(s.getState().status, 'error');
  s.disconnect();
});
test('a hung request times out with no stale success', async () => {
  const p = new Provider(),
    s = createWalletSession({ timeoutMs: 10 });
  p.hook = () => new Promise(() => {});
  await s.connect(p);
  assert.equal(s.getState().status, 'disconnected');
  assert.match(s.getState().error, /tiempo/);
});
test('disconnect event clears account and removes listeners', async () => {
  const p = new Provider(),
    s = createWalletSession();
  await s.connect(p);
  p.emit('disconnect', { code: 4900 });
  assert.equal(s.getState().account, null);
  assert.equal(p.listenerCount('chainChanged'), 0);
});
test('discovery deduplicates providers, does not request accounts, and stops listening', () => {
  const host = new EventTarget();
  host.Event = Event;
  const p = new Provider();
  let entries = [];
  const send = () =>
    host.dispatchEvent(
      new CustomEvent('eip6963:announceProvider', {
        detail: { info: { name: 'Test' }, provider: p },
      })
    );
  host.addEventListener('eip6963:requestProvider', send);
  const stop = discoverWallets(host, x => (entries = x));
  send();
  assert.equal(entries.length, 1);
  assert.equal(p.calls.length, 0);
  stop();
  host.dispatchEvent(
    new CustomEvent('eip6963:announceProvider', {
      detail: { info: { name: 'Other' }, provider: new Provider() },
    })
  );
  assert.equal(entries.length, 1);
});
