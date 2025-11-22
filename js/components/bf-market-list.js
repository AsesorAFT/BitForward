// bf-market-list.js
// Componente web para mostrar los mercados principales (top 10-20 tokens) y opción de expandir/buscar

const API_BASE =
  typeof window !== 'undefined' && window.location?.port === '5174' ? 'http://localhost:3000' : '';

const DEFAULT_MARKETS = [
  { id: 'bitcoin', symbol: 'BTC/USDT', name: 'Bitcoin', price: 0, change: 0, volume: '--' },
  { id: 'ethereum', symbol: 'ETH/USDT', name: 'Ethereum', price: 0, change: 0, volume: '--' },
  { id: 'solana', symbol: 'SOL/USDT', name: 'Solana', price: 0, change: 0, volume: '--' },
  { id: 'binancecoin', symbol: 'BNB/USDT', name: 'BNB', price: 0, change: 0, volume: '--' },
  { id: 'matic-network', symbol: 'MATIC/USDT', name: 'Polygon', price: 0, change: 0, volume: '--' },
];

async function fetchPrices() {
  const assets = DEFAULT_MARKETS.map(m => m.id).join(',');
  const url = `${API_BASE}/api/prices?assets=${assets}&vs=usdt`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Price API error');
    return res.json();
  } catch (err) {
    // fallback directo a CoinGecko
    const cgUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${assets}&vs_currencies=usdt&include_24hr_change=true&include_24hr_vol=true`;
    const res = await fetch(cgUrl);
    if (!res.ok) throw new Error('CoinGecko error');
    const prices = await res.json();
    return { success: true, source: 'coingecko', prices, timestamp: new Date().toISOString() };
  }
}

function mapPrices(apiData) {
  if (!apiData?.prices) return DEFAULT_MARKETS;
  return DEFAULT_MARKETS.map(m => {
    const p = apiData.prices[m.id] || {};
    const price = p.usdt || p.usd || 0;
    const change = p.usdt_24h_change || p.usd_24h_change || 0;
    const volume = p.usdt_24h_vol || p.usd_24h_vol || '--';
    return {
      ...m,
      price,
      change,
      volume: typeof volume === 'number' ? volume.toLocaleString() : volume,
    };
  });
}

class BfMarketList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.expanded = false;
    this.markets = DEFAULT_MARKETS;
    this.active = this.markets[0].symbol;
    this.interval = null;
  }

  connectedCallback() {
    this.render();
    this.loadLive();
    this.interval = setInterval(() => this.loadLive(), 20000);
  }

  disconnectedCallback() {
    if (this.interval) clearInterval(this.interval);
  }

  setActive(symbol) {
    this.active = symbol;
    this.render();
    this.dispatchEvent(new CustomEvent('market-selected', { detail: { symbol } }));
  }

  toggleExpand() {
    this.expanded = !this.expanded;
    this.render();
  }

  async loadLive() {
    try {
      const data = await fetchPrices();
      this.markets = mapPrices(data);
      if (!this.active && this.markets[0]) this.active = this.markets[0].symbol;
      this.render();
    } catch (err) {
      console.warn('No se pudieron cargar precios en bf-market-list, usando fallback', err);
    }
  }

  render() {
    const style = `
      <style>
        .market-list { background: rgba(30,32,40,0.7); border-radius: 12px; padding: 0.5rem 0.5rem 0.5rem 0.5rem; color: #fff; font-size: 0.95rem; }
        .market-row { display: flex; align-items: center; justify-content: space-between; padding: 0.4rem 0.2rem; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
        .market-row.active { background: #23272f; font-weight: bold; }
        .market-row:hover { background: #23272f; }
        .market-symbol { min-width: 80px; font-family: monospace; }
        .market-price { min-width: 80px; text-align: right; }
        .market-change { min-width: 60px; text-align: right; }
        .market-change.negative { color: #ef4444; }
        .market-change.positive { color: #22c55e; }
        .expand-btn { width: 100%; background: none; border: none; color: #3b82f6; padding: 0.5rem 0; cursor: pointer; font-size: 0.95rem; }
      </style>
    `;
    const rows = this.markets
      .slice(0, this.expanded ? this.markets.length : 5)
      .map(m => {
        const priceText = m.price ? `$${Number(m.price).toLocaleString()}` : '$0.00';
        const changeText = `${m.change > 0 ? '+' : ''}${Number(m.change || 0).toFixed(2)}%`;
        return `
        <div class="market-row${this.active === m.symbol ? ' active' : ''}" data-symbol="${m.symbol}">
          <span class="market-symbol">${m.symbol}</span>
          <span class="market-price">${priceText}</span>
          <span class="market-change ${m.change < 0 ? 'negative' : 'positive'}">${changeText}</span>
        </div>
      `;
      })
      .join('');
    const expandBtn =
      this.markets.length > 5
        ? `<button class="expand-btn" id="expandBtn">${this.expanded ? 'Ver menos' : 'Ver más'}</button>`
        : '';
    this.shadowRoot.innerHTML = `${style}<div class="market-list">${rows}${expandBtn}</div>`;
    this.shadowRoot.querySelectorAll('.market-row').forEach(row => {
      row.onclick = () => this.setActive(row.dataset.symbol);
    });
    const btn = this.shadowRoot.getElementById('expandBtn');
    if (btn) btn.onclick = () => this.toggleExpand();
  }
}

customElements.define('bf-market-list', BfMarketList);
