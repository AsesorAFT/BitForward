export const MARKET_RANGES = Object.freeze({
  '24h': { label: '24 horas', seconds: 86_400, granularity: 3_600, interval: '1 hora' },
  '7d': { label: '7 días', seconds: 604_800, granularity: 3_600, interval: '1 hora' },
  '30d': { label: '30 días', seconds: 2_592_000, granularity: 21_600, interval: '6 horas' },
  '90d': { label: '90 días', seconds: 7_776_000, granularity: 86_400, interval: '1 día' },
});

export const MARKET_SOURCE = 'Coinbase Exchange';
export const MARKET_PRODUCT = 'BTC-USD';
export const MARKET_SOURCE_URL =
  'https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-candles';

const finitePositive = value => Number.isFinite(value) && value > 0;

export function parseMarketPayload(payload, expectedRange, now = Date.now()) {
  const config = MARKET_RANGES[expectedRange];
  if (!config || !payload || typeof payload !== 'object') {
    throw new Error('La respuesta de mercado no tiene un formato válido.');
  }
  if (
    payload.source !== MARKET_SOURCE ||
    payload.product !== MARKET_PRODUCT ||
    payload.range !== expectedRange ||
    payload.granularity !== config.granularity ||
    !Array.isArray(payload.candles)
  ) {
    throw new Error('La respuesta no corresponde al par o al periodo solicitado.');
  }

  const asOfMs = Date.parse(payload.asOf);
  if (!Number.isFinite(asOfMs) || asOfMs > now + 5 * 60_000) {
    throw new Error('La respuesta no incluye una hora de consulta válida.');
  }
  const asOfSeconds = Math.floor(asOfMs / 1000);
  const earliest = asOfSeconds - config.seconds - config.granularity;
  const valid = new Map();
  for (const bucket of payload.candles) {
    if (!Array.isArray(bucket) || bucket.length < 6) continue;
    const [time, low, high, open, close, volume] = bucket.map(Number);
    if (
      !Number.isInteger(time) ||
      time < earliest ||
      time > asOfSeconds ||
      time + config.granularity > asOfSeconds ||
      !finitePositive(low) ||
      !finitePositive(high) ||
      !finitePositive(open) ||
      !finitePositive(close) ||
      !Number.isFinite(volume) ||
      volume < 0 ||
      low > high ||
      open < low ||
      open > high ||
      close < low ||
      close > high
    ) {
      continue;
    }
    valid.set(time, { time, low, high, open, close, volume });
  }

  const candles = [...valid.values()].sort((a, b) => a.time - b.time).slice(-300);
  if (candles.length < 2) {
    throw new Error('No hay suficientes velas completas para mostrar este periodo.');
  }
  return {
    source: MARKET_SOURCE,
    product: MARKET_PRODUCT,
    range: expectedRange,
    granularity: config.granularity,
    asOf: new Date(asOfMs).toISOString(),
    candles,
  };
}

export function summarizeCandles(candles) {
  if (!Array.isArray(candles) || candles.length < 2) {
    throw new Error('Se necesitan al menos dos velas.');
  }
  const first = candles[0];
  const last = candles[candles.length - 1];
  return {
    first,
    last,
    changePercent: ((last.close - first.close) / first.close) * 100,
    low: Math.min(...candles.map(candle => candle.low)),
    high: Math.max(...candles.map(candle => candle.high)),
  };
}

export function freshness(asOf, now = Date.now()) {
  const ageMs = Math.max(0, now - Date.parse(asOf));
  if (ageMs <= 15 * 60_000) return { kind: 'recent', label: 'Consulta reciente' };
  if (ageMs <= 24 * 60 * 60_000) return { kind: 'older', label: 'Consulta anterior' };
  return { kind: 'stale', label: 'Consulta antigua' };
}

export function candlesToCsv(market) {
  const header = [
    '# BitForward / BTC-USD / Coinbase Exchange',
    `# Consulta UTC: ${market.asOf}`,
    `# Periodo: ${market.range}; intervalo: ${market.granularity} segundos`,
    'inicio_utc,apertura_usd,maximo_usd,minimo_usd,cierre_usd,volumen_btc',
  ];
  for (const candle of market.candles) {
    header.push(
      [
        new Date(candle.time * 1000).toISOString(),
        candle.open,
        candle.high,
        candle.low,
        candle.close,
        candle.volume,
      ].join(',')
    );
  }
  return `${header.join('\n')}\n`;
}

export function notesToMarkdown(notes) {
  const sections = [
    '# BitForward · hipótesis sobre BTC',
    '',
    'Apuntes educativos guardados en este navegador. No son recomendaciones de inversión.',
  ];
  for (const note of notes) {
    sections.push(
      '',
      `## ${note.createdAt} · ${note.range}`,
      '',
      `- Fuente: ${MARKET_SOURCE}, ${MARKET_PRODUCT}`,
      `- Consulta UTC: ${note.asOf}`,
      `- Vela inspeccionada UTC: ${new Date(note.candleTime * 1000).toISOString()}`,
      `- Cierre observado: USD ${note.close}`,
      '',
      '**Mi hipótesis**',
      ...note.hypothesis.split('\n').map(line => `> ${line}`),
      '',
      '**Qué la pondría en duda**',
      ...note.invalidation.split('\n').map(line => `> ${line}`)
    );
  }
  return `${sections.join('\n')}\n`;
}
