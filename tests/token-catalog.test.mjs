import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CATALOG,
  MARKETS,
  instrumentKey,
  deduplicate,
  filterCatalog,
  capabilities,
  instrumentNotice,
} from '../src/token-demo/catalog.mjs';
import { SPOT_FIXTURES } from '../src/token-demo/fixtures.mjs';
import {
  PAIRS,
  readQuote,
  freshState,
  submitDemo,
  settleDemo,
  restore,
  balances,
} from '../src/token-demo/model.mjs';

const find = (market, base) => CATALOG.find(item => item.market === market && item.base === base);
const now = 100000;

test('43 claves únicas, 32 símbolos base y composición exacta de la selección', () => {
  assert.equal(CATALOG.length, 43);
  assert.equal(new Set(CATALOG.map(item => item.key)).size, 43);
  assert.equal(new Set(CATALOG.map(item => item.base)).size, 32);
  const expected = {
    spot: 'PYTHUSDT PHAUSDT CATIUSDT FORMUSDT WIFUSDT HEMIUSDT ZENUSDT ANIMEUSDT NILUSDT 0GUSDT BTCUSDT AVAXUSDT ONTUSDT ONGUSDT TRUMPUSDT AVNTUSDT BANKUSDT ACTUSDT CGPTUSDT COTIUSDT EULUSDT SYNUSDT',
    alpha: 'selection-BTW selection-EVAA selection-4 selection-LAB',
    bstocks: 'USARBUSDT AXTIBUSDT SOXSBUSDT',
    futures:
      'IBKRUSDT BTWUSDT EVAAUSDT VVVUSDT HEMIUSDT BTCUSDT AVNTUSDT BANKUSDT ACTUSDT CGPTUSDT COTIUSDT LABUSDT EULUSDT ONUSDT',
  };
  for (const [market, symbols] of Object.entries(expected)) {
    assert.deepEqual(
      CATALOG.filter(item => item.market === market).map(item => item.instrumentId),
      symbols.split(' ')
    );
    assert.ok(MARKETS[market]);
  }
  assert.ok(CATALOG.filter(item => item.market === 'spot').every(item => item.quote === 'USDT'));
});

test('deduplica FORM y AVAX repetidos sin colapsar Spot, Alpha o perpetuos', () => {
  const repeated = [...CATALOG, find('spot', 'FORM'), find('spot', 'AVAX')];
  assert.deepEqual(deduplicate(repeated), CATALOG);
  for (const symbol of ['BTC', 'HEMI', 'AVNT', 'BANK', 'ACT', 'CGPT', 'COTI', 'EUL'])
    assert.notEqual(find('spot', symbol).key, find('futures', symbol).key);
  assert.notEqual(find('alpha', 'BTW').key, find('futures', 'BTW').key);
  const spot = find('spot', 'BTC');
  assert.notEqual(instrumentKey({ ...spot, provider: 'another-provider' }), spot.key);
  assert.equal(deduplicate([spot, find('futures', 'BTC')]).length, 2);
});

test('0G no es OG; ON no es ONT; FORM y 4 son entradas distintas', () => {
  assert.equal(find('spot', '0G').instrumentId, '0GUSDT');
  assert.equal(
    CATALOG.some(item => item.base === 'OG'),
    false
  );
  assert.equal(find('futures', 'ON').instrumentId, 'ONUSDT');
  assert.equal(find('spot', 'ONT').instrumentId, 'ONTUSDT');
  assert.notEqual(find('spot', 'FORM').key, find('alpha', '4').key);
  assert.deepEqual(filterCatalog('0G', 'spot'), [find('spot', '0G')]);
  assert.deepEqual(filterCatalog(' form ', 'all'), [find('spot', 'FORM')]);
  assert.equal(filterCatalog('BTC', 'all').length, 2);
  assert.deepEqual(filterCatalog('BTC', 'futures'), [find('futures', 'BTC')]);
  assert.deepEqual(filterCatalog('inexistente'), []);
});

test('identidades on-chain no inferidas; su clave verificada requiere red y contrato', () => {
  for (const item of CATALOG.filter(item => item.market === 'alpha')) {
    assert.equal(item.alphaId, null);
    assert.equal(item.chainId, null);
    assert.equal(item.contract, null);
    assert.match(item.key, /identity-pending/);
    assert.throws(() => instrumentKey({ ...item, identityStatus: 'verified' }), /red y contrato/);
    const verified = {
      ...item,
      identityStatus: 'verified',
      instrumentId: 'test-alpha-id',
      chainId: 'demo-chain',
      contract: 'demo-contract-a',
    };
    assert.notEqual(
      instrumentKey(verified),
      instrumentKey({ ...verified, chainId: 'demo-chain-b' })
    );
    assert.notEqual(
      instrumentKey(verified),
      instrumentKey({ ...verified, contract: 'demo-contract-b' })
    );
  }
  assert.throws(() => instrumentKey({ market: 'spot' }), /incompleta/);
  const onchainSpot = {
    ...find('spot', 'BTC'),
    identityKind: 'onchain',
    identityStatus: 'verified',
    chainId: 'demo-chain',
    contract: 'demo-contract',
  };
  assert.notEqual(instrumentKey(onchainSpot), find('spot', 'BTC').key);
  assert.throws(() => instrumentKey({ ...onchainSpot, contract: null }), /red y contrato/);
  assert.ok(CATALOG.every(item => item.chainId === null && item.contract === null));
});

test('estado desconocido nunca habilita rutas reales; solo Spot tiene práctica sintética', () => {
  for (const item of CATALOG) {
    assert.equal(item.availability, 'unknown');
    assert.equal(item.realProvider, null);
    assert.equal(capabilities(item).consult, true);
    assert.equal(capabilities(item).identityPending, true);
    assert.equal(capabilities(item).realExecution, false);
    assert.equal(capabilities(item).practice, item.market === 'spot');
    if (item.market !== 'spot') {
      assert.equal(PAIRS[item.key], undefined);
      assert.throws(() => readQuote(item.key, '100', now), /no disponible/);
    }
    // Ni un estado TRADING inyectado configura proveedor o ejecución.
    assert.equal(
      capabilities({ ...item, availability: 'TRADING', identityStatus: 'verified' }).realExecution,
      false
    );
  }
  assert.deepEqual(capabilities({ key: 'unknown' }), {
    consult: false,
    practice: false,
    identityPending: true,
    realExecution: false,
  });
  assert.equal(capabilities({ key: find('futures', 'BTC').key, market: 'spot' }).practice, false);
});

test('clasificación de bStocks y snapshot de futuros no equivalen a activos spot o permisos', () => {
  assert.match(instrumentNotice(find('bstocks', 'SOXSB')), /ETF inverso apalancado 3X/);
  assert.match(instrumentNotice(find('futures', 'IBKR')), /no compra de acciones/);
  const derivatives = CATALOG.filter(item => item.market === 'futures');
  assert.equal(derivatives.filter(item => item.contractType === 'PERPETUAL').length, 13);
  assert.equal(find('futures', 'IBKR').contractType, 'TRADIFI_PERPETUAL');
  assert.ok(derivatives.every(item => item.reportedSnapshot.date === '2026-10-29'));
  assert.ok(
    derivatives.every(item => item.reportedSnapshot.source === 'user-reported-exchangeInfo')
  );
});

test('fixtures separados de metadata, sin precio actual/ejecutable ni saldo de proveedor', () => {
  assert.equal(Object.keys(SPOT_FIXTURES).length, 22);
  for (const item of CATALOG) {
    assert.equal('price' in item, false);
    assert.equal('balance' in item, false);
    if (item.market !== 'spot') continue;
    const quote = readQuote(item.key, '100', now);
    assert.equal(quote.source, 'simulation');
    assert.equal(quote.instrumentKey, item.key);
    assert.equal(quote.fixtureId, 'spot-uniform-v1');
    assert.equal(quote.output, '1000000000');
    assert.equal(quote.minimum, '995000000');
    assert.equal(quote.fee, '300000');
    assert.deepEqual(quote.totals, { USDT: '100300000', ETH: '200000000000000' });
    assert.equal(SPOT_FIXTURES[item.key].executable, false);
    assert.equal(SPOT_FIXTURES[item.key].priceQuoteUnits, '10000000');
    const state = { ...freshState(), stage: 'review', quote: { ...quote, source: 'binance-live' } };
    assert.throws(() => restore(JSON.stringify(state)), /no válida/);
  }
});

test('favorito Spot reutiliza revisión, fondos, pendiente, recarga e historial por instrumento', () => {
  const item = find('spot', 'BTC');
  const quote = readQuote(item.key, '100', now);
  const review = { ...freshState(), stage: 'review', quote };
  assert.throws(() => submitDemo({ ...review, stage: 'select' }, 'ready', now), /Primero revisa/);
  assert.throws(() => submitDemo(review, 'network', now), /Red incorrecta/);
  assert.throws(() => submitDemo(review, 'gas', now), /ETH/);
  assert.throws(() => submitDemo(review, 'funds', now), /USDT/);
  const tooMuch = { ...review, quote: readQuote(item.key, '1000', now) };
  assert.throws(() => submitDemo(tooMuch, 'ready', now), /USDT/);
  const pending = submitDemo(review, 'ready', now);
  assert.equal(pending.history[0].quote.instrumentKey, item.key);
  const restored = restore(JSON.stringify(pending));
  assert.equal(submitDemo(restored, 'ready', now), restored);
  const done = settleDemo(restored, now + 2500);
  assert.equal(done.history.length, 1);
  assert.equal(done.history[0].status, 'confirmed');
  assert.equal(balances(done).USDT, 899700000n);
  assert.equal(balances(done)[item.key], 1000000000n);
  assert.equal(balances(done)[find('futures', 'BTC').key], undefined);
  assert.equal(balances(done).BTC, undefined);
  assert.deepEqual(restore(JSON.stringify(done)), done);
});
