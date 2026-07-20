import './components/bf-header.js';

const PRICE_REFRESH_MS = 5 * 60 * 1000;
const CACHE_TTL_MS = 20 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;

const assets = [
  { id: 'bitcoin', symbol: 'btc' },
  { id: 'ethereum', symbol: 'eth' },
  { id: 'solana', symbol: 'sol' },
  { id: 'cardano', symbol: 'ada' },
];

let refreshInFlight = false;

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
  if (!Number.isFinite(change)) return '--';
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}% 24h`;
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

function renderPrices(prices, { source = 'Mercado', timestamp = Date.now() } = {}) {
  assets.forEach(asset => {
    const quote = prices?.[asset.id];
    const price = Number(quote?.usd);
    const change = Number(quote?.usd_24h_change);
    setText(`price-${asset.symbol}`, formatUsd(price));
    setText(`change-${asset.symbol}`, formatChange(change));
    updateChangeClass(`change-${asset.symbol}`, change);
  });

  setText('market-updated', `${source} · ${formatTimestamp(timestamp)}`);
}

function renderUnavailable() {
  assets.forEach(asset => {
    setText(`price-${asset.symbol}`, '$--');
    setText(`change-${asset.symbol}`, 'No disponible');
    updateChangeClass(`change-${asset.symbol}`, Number.NaN);
  });
  setText('market-updated', 'Datos no disponibles');
}

function readCache() {
  try {
    const raw = localStorage.getItem('bitforward-prices-v2');
    if (!raw) return null;
    const cached = JSON.parse(raw);
    const age = Date.now() - Number(cached.timestamp);
    if (!cached.prices || !Number.isFinite(age) || age > CACHE_TTL_MS) return null;
    return cached;
  } catch {
    return null;
  }
}

function writeCache(prices) {
  try {
    localStorage.setItem('bitforward-prices-v2', JSON.stringify({ timestamp: Date.now(), prices }));
  } catch {
    // El almacenamiento local puede estar bloqueado sin afectar la consulta en vivo.
  }
}

async function fetchMarketPrices() {
  const ids = assets.map(asset => asset.id).join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Market data unavailable: ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(timeout);
  }
}

async function refreshPrices() {
  if (refreshInFlight) return;
  refreshInFlight = true;

  try {
    const prices = await fetchMarketPrices();
    writeCache(prices);
    renderPrices(prices, { source: 'En vivo' });
  } catch (error) {
    console.warn('BitForward price feed failed', error);
    const cached = readCache();
    if (cached) {
      renderPrices(cached.prices, { source: 'Caché reciente', timestamp: cached.timestamp });
    } else {
      renderUnavailable();
    }
  } finally {
    refreshInFlight = false;
  }
}

function init() {
  const cached = readCache();
  if (cached) {
    renderPrices(cached.prices, { source: 'Caché reciente', timestamp: cached.timestamp });
  } else {
    renderUnavailable();
  }

  refreshPrices();
  window.setInterval(() => {
    if (document.visibilityState === 'visible') refreshPrices();
  }, PRICE_REFRESH_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshPrices();
  });
}

document.addEventListener('DOMContentLoaded', init);
