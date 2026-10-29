export const NETWORK = 'Red DEMO · chainId ficticio 31337';
export const TTL = 60_000;
export const PAIRS = {
  'usdc-eth': { input: 'USDC', output: 'ETH', decimals: 6, outputDecimals: 18 },
  'eth-usdc': { input: 'ETH', output: 'USDC', decimals: 18, outputDecimals: 6 },
};
const ZERO = BigInt(0);
const GAS = BigInt('200000000000000');
const INITIAL = { USDC: BigInt('1000000000'), ETH: BigInt('1000000000000000000') };

export function units(value, decimals) {
  if (!/^(0|[1-9]\d*)([.,]\d+)?$/.test(value) || value.length > 40)
    throw new Error('Introduce un importe positivo, sin exponentes ni separadores de miles.');
  const [whole, fraction = ''] = value.replace(',', '.').split('.');
  if (fraction.length > decimals) throw new Error(`Máximo ${decimals} decimales.`);
  const result = BigInt(whole + fraction.padEnd(decimals, '0'));
  if (result <= ZERO) throw new Error('El importe debe ser mayor que cero.');
  return result;
}

export function format(value, decimals) {
  const digits = BigInt(value)
    .toString()
    .padStart(decimals + 1, '0');
  const fraction = digits.slice(-decimals).replace(/0+$/, '');
  return digits.slice(0, -decimals) + (fraction ? ',' + fraction : '');
}

// Interfaz de lectura local: no importa wallets ni ejecutores.
export function readQuote(pairId, amount, now) {
  const pair = PAIRS[pairId];
  if (!pair) throw new Error('Par de demostración no disponible.');
  const input = units(amount, pair.decimals);
  const fee = (input * BigInt(3) + BigInt(999)) / BigInt(1000);
  const scale = BigInt('1000000000000');
  const output =
    pair.input === 'USDC' ? (input * scale) / BigInt(2000) : (input * BigInt(2000)) / scale;
  const minimum = (output * BigInt(995)) / BigInt(1000);
  if (minimum === ZERO)
    throw new Error('El importe no produce una unidad mínima de salida protegida.');
  const totals = { USDC: ZERO, ETH: GAS };
  totals[pair.input] += input + fee;
  return {
    pairId,
    input: input.toString(),
    output: output.toString(),
    minimum: minimum.toString(),
    fee: fee.toString(),
    gas: GAS.toString(),
    totals: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, v.toString()])),
    expiresAt: now + TTL,
  };
}

export const freshState = () => ({
  version: 1,
  sequence: 0,
  quote: null,
  stage: 'learn',
  history: [],
});

export function balances(state) {
  const result = { ...INITIAL };
  for (const row of state.history) {
    if (!['pending', 'confirmed'].includes(row.status)) continue;
    for (const asset of ['USDC', 'ETH']) result[asset] -= BigInt(row.quote.totals[asset]);
    if (row.status === 'confirmed') {
      result[PAIRS[row.quote.pairId].output] += BigInt(row.quote.output);
    }
  }
  return result;
}

export function checkQuote(state, scenario, now) {
  if (!state.quote || state.stage !== 'review') throw new Error('Primero revisa una cotización.');
  if (scenario === 'disconnected') throw new Error('Wallet demo desconectada. Elige «Lista».');
  if (scenario === 'network')
    throw new Error('Red incorrecta. Esta demo requiere la red ficticia 31337.');
  if (now >= state.quote.expiresAt) throw new Error('Cotización caducada. Vuelve a revisar.');
  const available = balances(state);
  if (scenario === 'funds') available.USDC = available.ETH = ZERO;
  if (scenario === 'gas') available.ETH = ZERO;
  for (const asset of ['USDC', 'ETH']) {
    if (BigInt(state.quote.totals[asset]) > available[asset])
      throw new Error(`Fondos demo insuficientes para importe y comisiones en ${asset}.`);
  }
}

// Interfaz de ejecución exclusivamente sintética; no acepta un proveedor externo.
export function submitDemo(state, scenario, now) {
  if (state.stage === 'pending' || state.stage === 'result') return state;
  checkQuote(state, scenario, now);
  const sequence = state.sequence + 1;
  const row = {
    id: `DEMO-OP-${String(sequence).padStart(4, '0')}`,
    type: 'swap',
    quote: state.quote,
    status: scenario === 'reject' ? 'rejected' : 'pending',
    outcome: scenario === 'failure' ? 'failed' : 'confirmed',
    readyAt: now + 2500,
  };
  return {
    ...state,
    sequence,
    stage: row.status === 'pending' ? 'pending' : 'result',
    history: [row, ...state.history],
  };
}

export function settleDemo(state, now) {
  if (state.stage !== 'pending') return state;
  const row = state.history[0];
  if (now < row.readyAt) return state;
  return {
    ...state,
    stage: 'result',
    history: [{ ...row, status: row.outcome }, ...state.history.slice(1)],
  };
}

export function restore(raw) {
  if (!raw) return freshState();
  const state = JSON.parse(raw);
  if (
    state.version !== 1 ||
    !Number.isSafeInteger(state.sequence) ||
    !['learn', 'select', 'review', 'pending', 'result'].includes(state.stage) ||
    !Array.isArray(state.history) ||
    state.history.length !== state.sequence
  )
    throw new Error('Estado demo no válido.');
  const quotes = [...state.history.map(row => row.quote), ...(state.quote ? [state.quote] : [])];
  for (const quote of quotes) {
    const pair = PAIRS[quote.pairId];
    if (!pair) throw new Error('Par no válido.');
    const expected = readQuote(
      quote.pairId,
      format(quote.input, pair.decimals),
      quote.expiresAt - TTL
    );
    if (!Number.isFinite(quote.expiresAt) || JSON.stringify(expected) !== JSON.stringify(quote))
      throw new Error('Cotización demo no válida.');
  }
  for (const [index, row] of state.history.entries()) {
    if (
      row.id !== `DEMO-OP-${String(state.sequence - index).padStart(4, '0')}` ||
      row.type !== 'swap' ||
      !['pending', 'confirmed', 'rejected', 'failed'].includes(row.status) ||
      !['confirmed', 'failed'].includes(row.outcome) ||
      !Number.isFinite(row.readyAt)
    )
      throw new Error('Historial demo no válido.');
  }
  if (
    (['review', 'pending', 'result'].includes(state.stage) && !state.quote) ||
    (['pending', 'result'].includes(state.stage) && !state.history.length) ||
    (state.stage === 'pending' && state.history[0].status !== 'pending')
  )
    throw new Error('Paso demo no válido.');
  return state;
}
