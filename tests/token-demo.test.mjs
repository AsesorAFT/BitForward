import assert from 'node:assert/strict';
import test from 'node:test';
import {
  units,
  format,
  readQuote,
  freshState,
  submitDemo,
  settleDemo,
  restore,
  balances,
  TTL,
} from '../src/token-demo/model.mjs';

const now = 100000;
const reviewed = (pair = 'usdc-eth', amount = '100') => ({
  ...freshState(),
  stage: 'review',
  quote: readQuote(pair, amount, now),
});

test('importes positivos estrictos, coma decimal y precisión sin floats', () => {
  for (const value of ['', '0', '-1', '+1', 'NaN', 'Infinity', '1e3', '1,000.00', ' 2', '01'])
    assert.throws(() => units(value, 6), value);
  assert.throws(() => units('1.0000001', 6), /decimales/);
  assert.equal(units('0,000001', 6), 1n);
  assert.equal(units('0.000000000000000001', 18), 1n);
  assert.equal(format('100000000000000001', 18), '0,100000000000000001');
  assert.throws(() => readQuote('unknown', '100', now));
  assert.throws(() => readQuote('eth-usdc', '0.000000000000000001', now), /unidad mínima/);
  assert.throws(() => readQuote('eth-usdc', '0.0000000005', now), /unidad mínima/);
});

test('cotización fija: unidades, mínimo, redondeo y comisiones sin doble conteo', () => {
  const q = readQuote('usdc-eth', '100', now);
  assert.equal(q.output, '50000000000000000');
  assert.equal(q.minimum, '49750000000000000');
  assert.equal(q.fee, '300000');
  assert.deepEqual(q.totals, { USDC: '100300000', ETH: '200000000000000' });
  assert.equal(q.expiresAt, now + TTL);
  const reverse = readQuote('eth-usdc', '0.1', now);
  assert.equal(reverse.output, '200000000');
  assert.equal(reverse.minimum, '199000000');
  assert.equal(reverse.fee, '300000000000000');
  assert.deepEqual(reverse.totals, { USDC: '0', ETH: '100500000000000000' });
  assert.equal(readQuote('usdc-eth', '0.000001', now).fee, '1');
});

test('revisión obligatoria; red, wallet, fondos y gas bloquean sin historial', () => {
  assert.throws(() => submitDemo(freshState(), 'ready', now), /Primero revisa/);
  for (const [scenario, message] of [
    ['disconnected', /desconectada/],
    ['network', /Red incorrecta/],
    ['funds', /insuficientes/],
    ['gas', /ETH/],
  ]) {
    const state = reviewed();
    assert.throws(() => submitDemo(state, scenario, now), message);
    assert.deepEqual(state.history, []);
  }
  assert.throws(() => submitDemo(reviewed('usdc-eth', '1000'), 'ready', now), /insuficientes/);
  assert.throws(() => submitDemo(reviewed('eth-usdc', '1'), 'ready', now), /insuficientes/);
});

test('caduca exactamente en el límite y al restaurar la revisión', () => {
  assert.equal(submitDemo(reviewed(), 'ready', now + TTL - 1).stage, 'pending');
  assert.throws(() => submitDemo(reviewed(), 'ready', now + TTL), /caducada/);
  const restored = restore(JSON.stringify(reviewed()));
  assert.throws(() => submitDemo(restored, 'ready', now + TTL + 1), /caducada/);
});

test('rechazo y fallo nunca cuentan como recepción o descuentan saldo', () => {
  const initial = balances(freshState());
  const rejected = submitDemo(reviewed(), 'reject', now);
  assert.equal(rejected.history[0].status, 'rejected');
  assert.deepEqual(balances(rejected), initial);
  const pending = submitDemo(reviewed(), 'failure', now);
  assert.equal(pending.history[0].status, 'pending');
  const failed = settleDemo(pending, now + 2500);
  assert.equal(failed.history[0].status, 'failed');
  assert.deepEqual(balances(failed), initial);
});

test('doble envío y recarga son idempotentes; solo resuelve después de pendiente', () => {
  const pending = submitDemo(reviewed(), 'ready', now);
  assert.equal(pending.history.length, 1);
  assert.equal(pending.history[0].id, 'DEMO-OP-0001');
  assert.equal(submitDemo(pending, 'ready', now), pending);
  assert.equal(settleDemo(pending, now + 2499), pending);
  const restored = restore(JSON.stringify(pending));
  assert.equal(submitDemo(restored, 'ready', now + 100), restored);
  const done = settleDemo(restored, now + 2500);
  assert.equal(done.history[0].status, 'confirmed');
  assert.equal(done.history.length, 1);
  assert.equal(settleDemo(done, now + 10000), done);
  assert.equal(submitDemo(done, 'ready', now + 10000), done);
  assert.deepEqual(balances(done), { USDC: 899700000n, ETH: 1049800000000000000n });
  const next = submitDemo(
    { ...done, stage: 'review', quote: readQuote('usdc-eth', '1', now) },
    'ready',
    now
  );
  assert.equal(next.history[0].id, 'DEMO-OP-0002');
});

test('restauración rechaza datos corruptos y cotizaciones manipuladas', () => {
  assert.deepEqual(restore(null), freshState());
  assert.throws(() => restore('bad JSON'));
  const state = reviewed();
  state.quote.totals.USDC = '0';
  assert.throws(() => restore(JSON.stringify(state)), /no válida/);
  assert.throws(() => restore(JSON.stringify({ ...freshState(), stage: 'pending' })));
});
