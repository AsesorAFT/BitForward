export const MARKETS = {
  spot: 'Spot',
  alpha: 'Alpha',
  futures: 'Futuros',
  bstocks: 'Valores tokenizados',
};

const spot =
  'PYTH PHA CATI FORM WIF HEMI ZEN ANIME NIL 0G BTC AVAX ONT ONG TRUMP AVNT BANK ACT CGPT COTI EUL SYN'.split(
    ' '
  );
const alpha = ['BTW', 'EVAA', '4', 'LAB'];
const bstocks = ['USARB', 'AXTIB', 'SOXSB'];
const futures = 'IBKR BTW EVAA VVV HEMI BTC AVNT BANK ACT CGPT COTI LAB EUL ON'.split(' ');
const bstockNames = {
  USARB: 'USA Rare Earth (bStocks)',
  AXTIB: 'AXT (bStocks)',
  SOXSB: 'Direxion Semiconductor Bear 3X ETF (bStocks)',
};

export function instrumentKey(instrument) {
  if (!instrument.provider || !instrument.market || !instrument.instrumentId)
    throw new Error('Identidad de instrumento incompleta.');
  const parts = [instrument.provider, instrument.market, instrument.instrumentId];
  if (instrument.identityKind === 'onchain') {
    // La selección provisional no equivale a una identidad on-chain verificada.
    if (instrument.identityStatus === 'verified') {
      if (!instrument.chainId || !instrument.contract)
        throw new Error('Falta red y contrato verificados.');
      parts.push(String(instrument.chainId), instrument.contract);
    } else parts.push('identity-pending');
  }
  return parts.map(part => encodeURIComponent(part)).join(':');
}

export function deduplicate(instruments) {
  return [
    ...new Map(instruments.map(instrument => [instrumentKey(instrument), instrument])).values(),
  ];
}

function entry(market, base) {
  const instrumentId = market === 'alpha' ? `selection-${base}` : `${base}USDT`;
  const instrument = {
    provider: 'binance',
    market,
    instrumentId,
    identityKind: market === 'alpha' ? 'onchain' : 'exchange-market',
    base,
    quote: market === 'alpha' ? null : 'USDT',
    name: bstockNames[base] || null,
    nameStatus: bstockNames[base] ? 'selection-label' : 'pending',
    identityStatus: 'pending',
    availability: 'unknown',
    alphaId: null,
    chainId: null,
    contract: null,
    realProvider: null,
    contractType:
      market === 'futures' ? (base === 'IBKR' ? 'TRADIFI_PERPETUAL' : 'PERPETUAL') : null,
    reportedSnapshot:
      market === 'futures'
        ? { source: 'user-reported-exchangeInfo', date: '2026-10-29', status: 'TRADING' }
        : null,
  };
  return Object.freeze({ ...instrument, key: instrumentKey(instrument) });
}

export const CATALOG = Object.freeze(
  deduplicate([
    ...spot.map(base => entry('spot', base)),
    ...alpha.map(base => entry('alpha', base)),
    ...bstocks.map(base => entry('bstocks', base)),
    ...futures.map(base => entry('futures', base)),
  ])
);

export function capabilities(instrument) {
  const selected = CATALOG.find(item => item.key === instrument?.key);
  return {
    consult: Boolean(selected),
    practice: Boolean(selected && selected.market === 'spot'),
    identityPending: selected?.identityStatus !== 'verified',
    // Ningún instrumento tiene proveedor ejecutor ni ruta real en este prototipo.
    realExecution: false,
  };
}

export function filterCatalog(query = '', market = 'all') {
  const normalized = query.trim().toLocaleUpperCase('es');
  return CATALOG.filter(
    item =>
      (market === 'all' || item.market === market) &&
      [item.base, item.instrumentId, item.name || ''].some(value =>
        value.toLocaleUpperCase('es').includes(normalized)
      )
  );
}

export function instrumentNotice(instrument) {
  if (instrument.market === 'alpha')
    return 'Solo exploración. Alpha ID, red y contrato pendientes del catálogo oficial; el símbolo no verifica la identidad.';
  if (instrument.market === 'futures')
    return instrument.base === 'IBKR'
      ? 'Derivado TRADIFI_PERPETUAL, no compra de acciones de Interactive Brokers. Sin compra spot ni apalancamiento habilitado.'
      : 'Contrato perpetuo, no compra del token subyacente. Solo exploración; sin margen, deuda ni ejecución.';
  if (instrument.market === 'bstocks')
    return instrument.base === 'SOXSB'
      ? 'Producto ligado a un ETF inverso apalancado 3X, no una acción ordinaria. Solo informativo; disponibilidad por proveedor/usuario pendiente.'
      : 'Valor tokenizado (bStocks), separado de cripto. Solo informativo; disponibilidad por proveedor/usuario pendiente.';
  return 'Práctica spot sin deuda con unidades sintéticas. USDT no identifica blockchain; no se presupone ERC-20 ni BTC envuelto.';
}
