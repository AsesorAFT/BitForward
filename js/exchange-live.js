const API_BASE =
  typeof window !== 'undefined' && window.location?.port === '5174' ? 'http://localhost:3000' : '';
const PAIRS = [
  { id: 'bitcoin', symbol: 'BTC' },
  { id: 'ethereum', symbol: 'ETH' },
  { id: 'solana', symbol: 'SOL' },
];
const REFRESH_INTERVAL =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ? 20000
    : 10000;
const APEX_SRC = 'https://cdn.jsdelivr.net/npm/apexcharts';
let apexChartsReady;

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

function formatNum(val, decimals = 2) {
  if (val === null || val === undefined) return '--';
  return Number(val).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const state = {
  depth: 10,
  prices: {},
  meta: { source: 'api/prices', timestamp: null },
  side: 'long',
};
let hydrationStarted = false;

function loadApexCharts() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.ApexCharts) return Promise.resolve(window.ApexCharts);
  if (!apexChartsReady) {
    apexChartsReady = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-apexcharts]');
      if (existing && window.ApexCharts) return resolve(window.ApexCharts);
      const script = document.createElement('script');
      script.src = APEX_SRC;
      script.async = true;
      script.dataset.apexcharts = 'true';
      script.onload = () => resolve(window.ApexCharts);
      script.onerror = () => reject(new Error('No se pudo cargar ApexCharts'));
      document.head.appendChild(script);
    });
  }
  return apexChartsReady;
}

async function getPrices() {
  const assets = PAIRS.map(p => p.id).join(',');
  const url = `${API_BASE}/api/prices?assets=${assets}&vs=usdt`;
  // 1) Backend
  try {
    const { success, prices, source, timestamp, msg } = await fetchJson(url);
    if (success && prices?.bitcoin?.usdt) {
      state.prices = prices;
      state.meta = {
        source: source || 'api/prices',
        timestamp: timestamp || new Date().toISOString(),
      };
      return state.prices;
    }
    throw new Error(msg || 'API sin precios');
  } catch (error) {
    console.warn('Fallo Price API, uso fallback', error);
  }

  // 2) CoinGecko directo
  try {
    const cgUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${assets}&vs_currencies=usdt&include_24hr_change=true&include_24hr_vol=true`;
    const data = await fetchJson(cgUrl);
    if (data && data.bitcoin?.usdt) {
      state.prices = data;
      state.meta = { source: 'coingecko', timestamp: new Date().toISOString() };
      return state.prices;
    }
  } catch (err) {
    console.warn('Fallo CoinGecko', err);
  }

  // 3) Binance ticker mínimo
  try {
    const ticker = await fetchJson('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
    state.prices = {
      bitcoin: {
        usdt: Number(ticker.lastPrice),
        usdt_24h_change: Number(ticker.priceChangePercent),
        usdt_24h_vol: Number(ticker.quoteVolume),
      },
    };
    state.meta = { source: 'binance-ticker', timestamp: new Date().toISOString() };
    return state.prices;
  } catch (err) {
    console.error('Fallo Binance ticker', err);
  }

  // 4) Último recurso: mantener el estado previo
  return state.prices;
}

function updateStrip(prices) {
  const strip = document.getElementById('live-strip');
  const source = document.getElementById('price-source');
  if (!strip) return;
  strip.innerHTML = '';
  PAIRS.forEach(({ id, symbol }) => {
    const price = prices?.[id]?.usdt || prices?.[id]?.usd;
    const change = prices?.[id]?.usdt_24h_change || prices?.[id]?.usd_24h_change;
    const item = document.createElement('div');
    item.className = 'strip-item';
    item.innerHTML = `<span>${symbol}/USDT</span><div class="strip-price">$${formatNum(
      price
    )}</div><div class="${(change || 0) >= 0 ? 'positive' : 'negative'}">${formatNum(
      change || 0,
      2
    )}%</div>`;
    strip.appendChild(item);
  });
  if (source) {
    const ts = state.meta.timestamp ? new Date(state.meta.timestamp) : new Date();
    source.textContent = `vía ${state.meta.source} · ${ts.toLocaleTimeString()}`;
  }
}

let chart;
async function fetchCandles(symbol = 'BTCUSDT', interval = '1m', limit = 120) {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const data = await fetchJson(url);
  if (!Array.isArray(data)) return [];
  return data.map(k => ({
    x: k[0],
    y: [Number(k[1]), Number(k[2]), Number(k[3]), Number(k[4])],
  }));
}

async function renderChart(prices, candles) {
  const ApexCharts = await loadApexCharts().catch(err => {
    console.error(err);
    return null;
  });
  const container = document.getElementById('chart-container');
  if (!container || !ApexCharts) return;
  const mid = prices?.bitcoin?.usdt || prices?.bitcoin?.usd || 0;
  const seriesData =
    candles && candles.length
      ? candles
      : Array.from({ length: 60 }, (_, i) => {
          const base = mid + (Math.random() - 0.5) * 40;
          return {
            x: Date.now() - (60 - i) * 60000,
            y: [base - 20, base + 20, base - 35, base + 35],
          };
        });

  if (!chart) {
    chart = new ApexCharts(container, {
      chart: {
        type: 'candlestick',
        height: '100%',
        background: 'transparent',
        foreColor: '#c9d4e1',
      },
      series: [{ data: seriesData }],
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeUTC: false,
          datetimeFormatter: {
            hour: 'HH:mm',
            minute: 'HH:mm',
          },
        },
      },
      yaxis: { labels: { formatter: v => `$${formatNum(v)}` } },
      grid: { borderColor: 'rgba(255,255,255,0.06)' },
      plotOptions: {
        candlestick: {
          colors: { upward: '#34d399', downward: '#f87171' },
        },
      },
      tooltip: {
        x: { format: 'dd MMM HH:mm' },
      },
    });
    chart.render();
  } else {
    chart.updateSeries([{ data: seriesData }]);
  }
}

function renderOrderBook(orderBook) {
  const asksEl = document.getElementById('order-book-asks');
  const bidsEl = document.getElementById('order-book-bids');
  const spreadEl = document.getElementById('spread-value');
  if (!asksEl || !bidsEl || !spreadEl) return;

  const maxAmount = Math.max(
    ...(orderBook.asks || []).map(o => o.amount),
    ...(orderBook.bids || []).map(o => o.amount),
    1
  );

  const formatRow = (order, type) => `
    <div class="data-table-row order-book-row ${type}" style="--depth:${Math.min(
      100,
      (order.amount / maxAmount) * 100
    )}%">
      <span>${formatNum(order.price)}</span>
      <span>${formatNum(order.amount, 4)}</span>
      <span>${formatNum(order.price * order.amount)}</span>
    </div>`;

  asksEl.innerHTML = orderBook.asks.map(o => formatRow(o, 'ask')).join('');
  bidsEl.innerHTML = orderBook.bids.map(o => formatRow(o, 'bid')).join('');

  const spread = orderBook.asks[0]?.price - orderBook.bids[0]?.price;
  spreadEl.textContent = spread ? `$${formatNum(spread)}` : '--';
}

function renderTrades(trades) {
  const list = document.getElementById('trade-history-list');
  if (!list) return;
  list.innerHTML = trades
    .map(
      t => `<div class="data-table-row ${t.side === 'buy' ? 'positive' : 'negative'}">
        <span>${formatNum(t.price)}</span>
        <span>${formatNum(t.amount, 4)}</span>
        <span>${t.time}</span>
      </div>`
    )
    .join('');
}

function renderPositions(positions) {
  const tbody = document.querySelector('.user-positions-table tbody');
  if (!tbody) return;
  if (!positions.length) {
    tbody.innerHTML = '<tr><td colspan="7">Sin posiciones</td></tr>';
    return;
  }
  tbody.innerHTML = positions
    .map(
      p => `<tr>
      <td>${p.pair}</td>
      <td class="${p.side === 'long' ? 'positive' : 'negative'}">${p.side}</td>
      <td>${p.size}</td>
      <td>$${formatNum(p.entry)}</td>
      <td class="${p.pnl >= 0 ? 'positive' : 'negative'}">${p.pnl >= 0 ? '+' : ''}${formatNum(
        p.pnl
      )}</td>
      <td>HF ${p.health || '--'}</td>
      <td><button class="btn btn-ghost btn-sm">Close</button></td>
    </tr>`
    )
    .join('');
}

async function loadDepth(depth, midPrice) {
  // Placeholder depth using random generation; replace with real orderbook endpoint if available
  const mid = midPrice || 67500 + Math.random() * 200;
  const bids = Array.from({ length: depth }, () => {
    const price = mid - Math.random() * 50;
    const amount = Math.random() * 2;
    return { price, amount };
  }).sort((a, b) => b.price - a.price);
  const asks = Array.from({ length: depth }, () => {
    const price = mid + Math.random() * 50;
    const amount = Math.random() * 2;
    return { price, amount };
  }).sort((a, b) => a.price - b.price);
  renderOrderBook({ bids, asks });
}

function updateHeader(prices) {
  const priceEl = document.getElementById('current-price');
  const changeEl = document.getElementById('price-change');
  const volEl = document.getElementById('volume-24h');
  const price = prices?.bitcoin?.usdt || prices?.bitcoin?.usd || 0;
  const change = prices?.bitcoin?.usdt_24h_change || prices?.bitcoin?.usd_24h_change || 0;
  const vol = prices?.bitcoin?.usdt_24h_vol || prices?.bitcoin?.usd_24h_vol;

  if (priceEl) priceEl.textContent = `$${formatNum(price, 2)}`;
  if (changeEl) {
    const changeAbs = price * (change / 100);
    changeEl.textContent = `${change >= 0 ? '+' : ''}${formatNum(changeAbs, 2)} (${formatNum(
      change,
      2
    )}%)`;
    changeEl.classList.toggle('positive', change >= 0);
    changeEl.classList.toggle('negative', change < 0);
  }
  if (volEl) volEl.textContent = vol ? `${formatNum(vol, 0)} USDT` : '--';
}

async function hydrate() {
  try {
    const prices = await getPrices();
    let candles = [];
    try {
      candles = await fetchCandles('BTCUSDT', '1m', 120);
    } catch (err) {
      console.warn('No se pudieron traer velas de Binance, uso mock', err);
    }
    updateStrip(prices);
    updateHeader(prices);
    await renderChart(prices, candles);

    const mid = prices?.bitcoin?.usdt || prices?.bitcoin?.usd || 0;

    // Orderbook/trades mock until real endpoint
    await loadDepth(state.depth, mid);
    renderTrades(
      Array.from({ length: 12 }, () => ({
        price: mid + (Math.random() - 0.5) * 20,
        amount: Math.random() * 0.5,
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        time: new Date().toLocaleTimeString(),
      }))
    );

    renderPositions([
      { pair: 'BTC/USDT', side: 'long', size: 0.5, entry: 65120, pnl: 1190.25, health: 75 },
    ]);
  } catch (error) {
    console.error('Error hydrating exchange view', error);
    // Render mínimo para no perder layout
    await renderChart({}, []);
  }
}

function bindControls() {
  const depthSelect = document.getElementById('depth-select');
  if (depthSelect) {
    depthSelect.addEventListener('change', async e => {
      state.depth = parseInt(e.target.value, 10) || 10;
      const mid = state.prices?.bitcoin?.usdt || state.prices?.bitcoin?.usd || 0;
      await loadDepth(state.depth, mid);
    });
  }

  const tabLong = document.getElementById('tab-long');
  const tabShort = document.getElementById('tab-short');
  if (tabLong && tabShort) {
    const toggleSide = side => {
      state.side = side;
      tabLong.classList.toggle('active', side === 'long');
      tabShort.classList.toggle('active', side === 'short');
      const buyBtn = document.getElementById('btn-buy');
      const sellBtn = document.getElementById('btn-sell');
      if (buyBtn) buyBtn.textContent = side === 'long' ? 'Long (Bull)' : 'Comprar';
      if (sellBtn) sellBtn.textContent = side === 'short' ? 'Short (Bear)' : 'Vender';
    };
    tabLong.addEventListener('click', () => toggleSide('long'));
    tabShort.addEventListener('click', () => toggleSide('short'));
    toggleSide('long');
  }
}

function startHydrationLoop() {
  if (hydrationStarted) return;
  hydrationStarted = true;
  hydrate();
  setInterval(hydrate, REFRESH_INTERVAL);
}

document.addEventListener('DOMContentLoaded', () => {
  bindControls();
  const chartContainer = document.getElementById('chart-container');
  if ('IntersectionObserver' in window && chartContainer) {
    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry && entry.isIntersecting) {
          observer.disconnect();
          startHydrationLoop();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(chartContainer);
  } else {
    startHydrationLoop();
  }
});
