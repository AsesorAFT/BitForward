import './components/bf-header.js';
import './pwa.js';

const PRICE_REFRESH_MS = 5 * 60 * 1000;
const CACHE_FRESH_MS = 60 * 60 * 1000;
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;
const CACHE_KEY = 'bitforward-market-v3';

const assets = [
  { id: 'bitcoin', symbol: 'btc', ticker: 'BTC', binance: 'BTCUSDT' },
  { id: 'ethereum', symbol: 'eth', ticker: 'ETH', binance: 'ETHUSDT' },
  { id: 'solana', symbol: 'sol', ticker: 'SOL', binance: 'SOLUSDT' },
  { id: 'cardano', symbol: 'ada', ticker: 'ADA', binance: 'ADAUSDT' },
];

const modelAllocation = {
  btc: 0.6,
  eth: 0.2,
  sol: 0.1,
  ada: 0.1,
};

let refreshInFlight = false;

const moneyMxn = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function formatUsd(value) {
  if (!Number.isFinite(value)) return '$--';
  if (value >= 1000) {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    });
  }
  if (value >= 1) {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return `$${value.toFixed(4)}`;
}

function formatChange(change) {
  if (!Number.isFinite(change)) return 'No disponible';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}% · 24h`;
}

function updateChangeClass(id, change) {
  const element = document.getElementById(id);
  if (!element) return;
  element.classList.remove('up', 'down');
  if (Number.isFinite(change)) element.classList.add(change >= 0 ? 'up' : 'down');
}

function formatTimestamp(timestamp = Date.now()) {
  return new Date(timestamp).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getQuotes(prices) {
  return assets
    .map(asset => ({
      ...asset,
      price: Number(prices?.[asset.id]?.usd),
      change: Number(prices?.[asset.id]?.usd_24h_change),
    }))
    .filter(quote => Number.isFinite(quote.price) && Number.isFinite(quote.change));
}

function renderMarketPulse(prices) {
  const quotes = getQuotes(prices);
  if (!quotes.length) {
    setText('market-breadth', 'Sin lectura');
    setText('market-leader', 'Sin lectura');
    setText('market-volatility', 'Sin lectura');
    setText('market-bias', 'Datos no disponibles');
    setText(
      'market-narrative',
      'No mostramos cifras incompletas. Reintenta la conexión o consulta la última lectura guardada.'
    );
    return;
  }

  const positiveCount = quotes.filter(quote => quote.change >= 0).length;
  const leader = [...quotes].sort((a, b) => b.change - a.change)[0];
  const averageChange = quotes.reduce((sum, quote) => sum + quote.change, 0) / quotes.length;
  const averageAbsolute =
    quotes.reduce((sum, quote) => sum + Math.abs(quote.change), 0) / quotes.length;

  setText('market-breadth', `${positiveCount} de ${quotes.length} positivos`);
  setText('market-leader', `${leader.ticker} ${formatChange(leader.change).split(' ·')[0]}`);
  setText('market-volatility', `${averageAbsolute.toFixed(2)}% promedio`);

  if (positiveCount === quotes.length && averageChange > 1.5) {
    setText('market-bias', 'Impulso amplio');
    setText(
      'market-narrative',
      'La muestra avanza de forma coordinada. El movimiento mejora la amplitud, pero no sustituye reglas de exposición.'
    );
  } else if (positiveCount === 0 && averageChange < -1.5) {
    setText('market-bias', 'Presión defensiva');
    setText(
      'market-narrative',
      'La debilidad es generalizada. La prioridad es revisar liquidez, bandas de control y capacidad de pérdida.'
    );
  } else {
    setText('market-bias', 'Mercado selectivo');
    setText(
      'market-narrative',
      'La dirección no es uniforme. Conviene separar movimientos individuales de una señal estructural del portafolio.'
    );
  }
}

function renderPrices(prices, { source = 'Mercado', timestamp = Date.now(), stale = false } = {}) {
  assets.forEach(asset => {
    const quote = prices?.[asset.id];
    const price = Number(quote?.usd);
    const change = Number(quote?.usd_24h_change);
    setText(`price-${asset.symbol}`, formatUsd(price));
    setText(`change-${asset.symbol}`, formatChange(change));
    updateChangeClass(`change-${asset.symbol}`, change);
  });

  setText('market-source', source);
  setText('market-updated', formatTimestamp(timestamp));
  setText('market-availability', stale ? 'Última lectura guardada · USD' : 'Datos públicos · USD');
  renderMarketPulse(prices);
}

function renderUnavailable() {
  assets.forEach(asset => {
    setText(`price-${asset.symbol}`, '$--');
    setText(`change-${asset.symbol}`, 'No disponible');
    updateChangeClass(`change-${asset.symbol}`, Number.NaN);
  });
  setText('market-source', 'Sin conexión');
  setText('market-updated', 'Reintenta');
  setText('market-availability', 'Mercado temporalmente no disponible');
  renderMarketPulse(null);
}

function readCache({ allowStale = false } = {}) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    const age = Date.now() - Number(cached.timestamp);
    const maxAge = allowStale ? CACHE_MAX_AGE_MS : CACHE_FRESH_MS;
    if (!cached.prices || !Number.isFinite(age) || age > maxAge) return null;
    return { ...cached, stale: age > CACHE_FRESH_MS };
  } catch {
    return null;
  }
}

function writeCache(prices, source) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), prices, source }));
  } catch {
    // El almacenamiento local es una mejora, no un requisito de funcionamiento.
  }
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchCoinGecko() {
  const ids = assets.map(asset => asset.id).join(',');
  const data = await fetchJson(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
  );
  if (getQuotes(data).length !== assets.length) throw new Error('CoinGecko incompleto');
  return { prices: data, source: 'CoinGecko' };
}

async function fetchBinance() {
  const rows = await Promise.all(
    assets.map(asset =>
      fetchJson(`https://api.binance.com/api/v3/ticker/24hr?symbol=${asset.binance}`)
    )
  );
  const prices = Object.fromEntries(
    rows.map((row, index) => [
      assets[index].id,
      {
        usd: Number(row.lastPrice),
        usd_24h_change: Number(row.priceChangePercent),
      },
    ])
  );
  if (getQuotes(prices).length !== assets.length) throw new Error('Binance incompleto');
  return { prices, source: 'Binance · USDT' };
}

async function requestMarket() {
  try {
    return await fetchCoinGecko();
  } catch {
    return fetchBinance();
  }
}

function setRefreshState(loading) {
  const button = document.getElementById('market-refresh');
  if (!button) return;
  button.disabled = loading;
  button.innerHTML = loading
    ? 'Actualizando <span aria-hidden="true">…</span>'
    : 'Actualizar <span aria-hidden="true">↻</span>';
}

async function refreshPrices({ userInitiated = false } = {}) {
  if (refreshInFlight) return;
  refreshInFlight = true;
  setRefreshState(true);

  try {
    const { prices, source } = await requestMarket();
    writeCache(prices, source);
    renderPrices(prices, { source });
  } catch {
    const cached = readCache({ allowStale: true });
    if (cached) {
      renderPrices(cached.prices, {
        source: `${cached.source || 'Caché'} · guardado`,
        timestamp: cached.timestamp,
        stale: true,
      });
    } else {
      renderUnavailable();
    }
  } finally {
    refreshInFlight = false;
    setRefreshState(false);
    if (userInitiated) document.getElementById('market-updated')?.focus?.();
  }
}

function updateAllocation() {
  const input = document.getElementById('model-capital');
  if (!input) return;
  const raw = Number(input.value);
  const capital = Number.isFinite(raw) ? Math.min(Math.max(raw, 1000), 100000000) : 100000;
  Object.entries(modelAllocation).forEach(([asset, weight]) => {
    setText(`alloc-${asset}`, moneyMxn.format(capital * weight));
  });
  try {
    localStorage.setItem('bitforward-model-capital', String(capital));
  } catch {
    // No se requiere persistencia para usar el cálculo.
  }
}

function initAllocation() {
  const input = document.getElementById('model-capital');
  if (!input) return;
  try {
    const saved = Number(localStorage.getItem('bitforward-model-capital'));
    if (Number.isFinite(saved) && saved >= 1000 && saved <= 100000000) input.value = saved;
  } catch {
    // Mantener el valor inicial.
  }
  input.addEventListener('input', updateAllocation);
  updateAllocation();
}

function init() {
  const cached = readCache({ allowStale: true });
  if (cached) {
    renderPrices(cached.prices, {
      source: `${cached.source || 'Caché'}${cached.stale ? ' · guardado' : ''}`,
      timestamp: cached.timestamp,
      stale: cached.stale,
    });
  } else {
    renderUnavailable();
  }

  document
    .getElementById('market-refresh')
    ?.addEventListener('click', () => refreshPrices({ userInitiated: true }));

  initAllocation();
  refreshPrices();
  window.setInterval(() => {
    if (document.visibilityState === 'visible') refreshPrices();
  }, PRICE_REFRESH_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshPrices();
  });
}

document.addEventListener('DOMContentLoaded', init);
