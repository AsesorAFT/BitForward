const assets = [
  { id: 'bitcoin', symbol: 'btc', label: 'BTC' },
  { id: 'ethereum', symbol: 'eth', label: 'ETH' },
  { id: 'solana', symbol: 'sol', label: 'SOL' },
  { id: 'cardano', symbol: 'ada', label: 'ADA' },
];

const fallbackPrices = {
  bitcoin: { usd: 65633, usd_24h_change: 1.96 },
  ethereum: { usd: 1721.42, usd_24h_change: 2.59 },
  solana: { usd: 70.84, usd_24h_change: 2.97 },
  cardano: { usd: 0.180945, usd_24h_change: 5.45 },
};

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
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
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('up', 'down');
  if (Number.isFinite(change)) el.classList.add(change >= 0 ? 'up' : 'down');
}

function renderPrices(prices, sourceLabel = 'Mercado') {
  assets.forEach(asset => {
    const quote = prices?.[asset.id] || fallbackPrices[asset.id];
    const price = Number(quote?.usd);
    const change = Number(quote?.usd_24h_change);
    setText(`price-${asset.symbol}`, formatUsd(price));
    setText(`change-${asset.symbol}`, formatChange(change));
    updateChangeClass(`change-${asset.symbol}`, change);
  });

  const now = new Date();
  const stamp = now.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  setText('market-updated', `${sourceLabel} · ${stamp}`);
}

function readCache() {
  try {
    const raw = localStorage.getItem('bitforward-prices-v1');
    if (!raw) return null;
    const cached = JSON.parse(raw);
    const age = Date.now() - cached.timestamp;
    if (age > 1000 * 60 * 20) return null;
    return cached.prices;
  } catch {
    return null;
  }
}

function writeCache(prices) {
  try {
    localStorage.setItem(
      'bitforward-prices-v1',
      JSON.stringify({ timestamp: Date.now(), prices }),
    );
  } catch {
    // Local storage can be unavailable in private mode.
  }
}

async function fetchMarketPrices() {
  const ids = assets.map(asset => asset.id).join(',');
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Market data unavailable: ${response.status}`);
  return response.json();
}

async function init() {
  const cached = readCache();
  if (cached) renderPrices(cached, 'Cache');
  else renderPrices(fallbackPrices, 'Referencia');

  try {
    const prices = await fetchMarketPrices();
    writeCache(prices);
    renderPrices(prices, 'En vivo');
  } catch (error) {
    console.warn('BitForward price feed failed', error);
    if (!cached) renderPrices(fallbackPrices, 'Referencia');
  }
}

document.addEventListener('DOMContentLoaded', init);
