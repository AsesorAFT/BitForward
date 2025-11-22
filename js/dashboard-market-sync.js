// dashboard-market-sync.js
// Sincroniza la selección de mercado con el gráfico, orderbook, carteras y formulario de trading (mock).

document.addEventListener('DOMContentLoaded', () => {
  const marketList = document.querySelector('bf-market-list');
  const toast = document.getElementById('bf-toast');
  const tradingChartEl = document.getElementById('bf-trading-chart');
  const orderbookEl = document.getElementById('bf-orderbook');
  const positionsEl = document.getElementById('bf-open-positions');
  const historyEl = document.getElementById('bf-order-history');
  const rfqEl = document.getElementById('bf-rfq-quotes');
  const tradeForm = document.getElementById('bf-trade-form');
  const shortBtn = document.getElementById('bf-short-btn');
  const leverageInput = document.getElementById('bf-leverage');
  const sizeInput = document.getElementById('bf-size');
  const marketSelect = document.getElementById('bf-market-select');
  const marginToggle = document.getElementById('bf-margin-toggle');
  const tradeSummary = document.getElementById('bf-trade-summary');
  const activeMarketLabel = document.getElementById('bf-active-market');
  const timeframeButtons = document.querySelectorAll('[data-timeframe]');
  const assetsContainer = document.getElementById('assets-container');
  const assetsSearch = document.getElementById('assets-search');
  const newOrderBtn = document.getElementById('bf-new-order');
  const exportBtn = document.getElementById('bf-export-report');
  const feedConfig = window.BF_FEEDS || {};

  const markets = [
    { symbol: 'BTC-USD', price: 67123.45 },
    { symbol: 'ETH-USD', price: 3540.12 },
    { symbol: 'SOL-USD', price: 172.5 },
    { symbol: 'AVAX-USD', price: 61.3 },
    { symbol: 'MATIC-USD', price: 1.12 },
  ];

  const assetsData = [
    {
      name: 'Bitcoin',
      symbol: 'BTC',
      balance: 1.25,
      price: 67123.45,
      change: 1.5,
      logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=029',
    },
    {
      name: 'Ethereum',
      symbol: 'ETH',
      balance: 15.2,
      price: 3540.12,
      change: -0.8,
      logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=029',
    },
    {
      name: 'Solana',
      symbol: 'SOL',
      balance: 120,
      price: 172.5,
      change: 4.2,
      logo: 'https://cryptologos.cc/logos/solana-sol-logo.svg?v=029',
    },
    {
      name: 'Avalanche',
      symbol: 'AVAX',
      balance: 480,
      price: 61.3,
      change: 2.1,
      logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.svg?v=029',
    },
    {
      name: 'Polygon',
      symbol: 'MATIC',
      balance: 2400,
      price: 1.12,
      change: -1.2,
      logo: 'https://cryptologos.cc/logos/polygon-matic-logo.svg?v=029',
    },
  ];

  const positionsData = [
    { market: 'BTC-USD', size: 0.6, entry: 65820, liq: 59800, pnl: 923.5 },
    { market: 'ETH-USD', size: 4, entry: 3410, liq: 2980, pnl: -120.4 },
    { market: 'SOL-USD', size: 50, entry: 165.3, liq: 122.3, pnl: 418.1 },
  ];

  const historyData = [
    { market: 'BTC-USD', side: 'Long', size: 0.2, status: 'Filled', price: 66210 },
    { market: 'ETH-USD', side: 'Short', size: 1.4, status: 'Partial', price: 3560 },
    { market: 'MATIC-USD', side: 'Long', size: 800, status: 'Filled', price: 1.09 },
    { market: 'SOL-USD', side: 'Short', size: 20, status: 'Cancelled', price: 168.4 },
  ];

  let tradingChart;
  let assetsSort = { key: 'name', dir: 'asc' };
  let ws;
  let restPoll;
  let wsUrlInUse = '';

  const state = {
    symbol: marketList?.active || 'BTC-USD',
    timeframe: '15m',
    marginMode: 'cross',
    leverage: Number(leverageInput?.value) || 10,
    balance: 10000,
  };

  const liveData = {
    prices: [],
    orderbook: null,
    positions: null,
    history: null,
    rfq: null,
  };

  if (activeMarketLabel) activeMarketLabel.textContent = state.symbol;
  updateTradeSummary();
  hydrateMarketSelect();
  initChart();
  renderOrderbook();
  renderPositions();
  renderHistory();
  renderRFQ();
  renderAssets();

  hookEvents();
  tickUpdates();
  runOnboarding();
  initFeeds();

  function hydrateMarketSelect() {
    if (!marketSelect) return;
    marketSelect.innerHTML = markets
      .map(m => `<option value="${m.symbol}">${m.symbol}</option>`)
      .join('');
    marketSelect.value = state.symbol;
  }

  function hookEvents() {
    if (marketList) {
      marketList.addEventListener('market-selected', e => setMarket(e.detail.symbol));
    }

    if (marketSelect) {
      marketSelect.addEventListener('change', e => setMarket(e.target.value));
    }

    timeframeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        timeframeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.timeframe = btn.dataset.timeframe;
        updateChart();
      });
    });

    if (marginToggle) {
      marginToggle.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          marginToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          state.marginMode = btn.dataset.mode;
          updateTradeSummary();
        });
      });
    }

    if (tradeForm) {
      tradeForm.addEventListener('submit', e => {
        e.preventDefault();
        handleTrade('long');
      });
    }

    if (shortBtn) {
      shortBtn.addEventListener('click', () => handleTrade('short'));
    }

    leverageInput?.addEventListener('input', () => {
      state.leverage = Number(leverageInput.value) || 1;
      updateTradeSummary();
    });

    sizeInput?.addEventListener('input', updateTradeSummary);

    document.querySelectorAll('.quick-size button').forEach(btn => {
      btn.addEventListener('click', () => {
        const percent = Number(btn.dataset.percent);
        const allocation = (state.balance * percent) / 100;
        sizeInput.value = allocation.toFixed(2);
        updateTradeSummary();
      });
    });

    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        showToast(`Acción: ${btn.textContent}`, 'info');
      });
    });

    assetsSearch?.addEventListener('input', renderAssets);

    document.querySelectorAll('.assets-table th[data-sort]').forEach(cell => {
      cell.addEventListener('click', () => {
        const key = cell.dataset.sort;
        assetsSort.dir = assetsSort.key === key && assetsSort.dir === 'asc' ? 'desc' : 'asc';
        assetsSort.key = key;
        renderAssets();
      });
    });

    newOrderBtn?.addEventListener('click', () =>
      showToast('Inicia el flujo de nueva orden desde el panel de trading.', 'success')
    );
    exportBtn?.addEventListener('click', () => showToast('Generando reporte en CSV…', 'info'));
  }

  function tickUpdates() {
    setInterval(() => {
      bumpPrices();
      renderOrderbook();
      updateChart(true);
    }, 5000);

    setInterval(() => {
      randomizePnl();
      renderPositions();
    }, 8000);
  }

  function setMarket(symbol) {
    state.symbol = symbol;
    if (activeMarketLabel) activeMarketLabel.textContent = symbol;
    if (marketSelect) marketSelect.value = symbol;
    updateChart();
    renderOrderbook();
    updateTradeSummary();
    showToast(`Mercado seleccionado: ${symbol}`, 'success');
    reconnectFeeds();
  }

  function initChart() {
    if (!tradingChartEl || typeof ApexCharts === 'undefined') return;
    tradingChart = new ApexCharts(tradingChartEl, buildChartOptions());
    tradingChart.render().then(() => markLoaded('chart'));
  }

  function buildChartOptions() {
    return {
      chart: {
        type: 'area',
        height: 340,
        toolbar: { show: false },
        animations: { enabled: true, easing: 'easeinout', speed: 600 },
        fontFamily: 'JetBrains Mono, Inter, system-ui, sans-serif',
      },
      series: [
        {
          name: state.symbol,
          data: generatePriceSeries(state.symbol, state.timeframe),
        },
      ],
      colors: ['#22c55e'],
      stroke: { curve: 'smooth', width: 2.2 },
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.15, stops: [0, 100] },
      },
      grid: { borderColor: 'rgba(255,255,255,0.08)', strokeDashArray: 4 },
      tooltip: { theme: 'dark' },
      xaxis: { type: 'datetime', labels: { style: { colors: 'var(--bf-text-tertiary)' } } },
      yaxis: {
        labels: {
          style: { colors: 'var(--bf-text-tertiary)' },
          formatter: v => `$${v.toFixed(2)}`,
        },
      },
      theme: { mode: 'dark' },
    };
  }

  function updateChart(skipToast = false) {
    if (!tradingChart) {
      initChart();
      return;
    }
    const data = getChartSeries();
    tradingChart.updateSeries([{ name: state.symbol, data }], true);
    tradingChart.updateOptions({ colors: [pickColorForSymbol(state.symbol)] });
    if (!skipToast) showToast(`Actualizando gráfico ${state.symbol} (${state.timeframe})`, 'info');
  }

  function getChartSeries() {
    if (liveData.prices.length) return liveData.prices;
    return generatePriceSeries(state.symbol, state.timeframe);
  }

  function generatePriceSeries(symbol, timeframe) {
    const base = markets.find(m => m.symbol === symbol)?.price || 100;
    const points = timeframe === '1D' ? 24 : timeframe === '4H' ? 48 : timeframe === '1H' ? 60 : 40;
    const now = Date.now();
    const data = [];
    let price = base;
    for (let i = points; i > 0; i--) {
      price += (Math.random() - 0.5) * (base * 0.003);
      const timestamp =
        now -
        i *
          60 *
          1000 *
          (timeframe === '1D' ? 60 : timeframe === '4H' ? 30 : timeframe === '1H' ? 10 : 5);
      data.push([timestamp, Number(price.toFixed(2))]);
    }
    return data;
  }

  function renderOrderbook() {
    if (!orderbookEl) return;
    const base = markets.find(m => m.symbol === state.symbol)?.price || 100;
    const book = liveData.orderbook || generateOrderbook(base);
    const header = `<div class="orderbook-row header"><span>Precio</span><span>Tamaño</span><span>Total</span></div>`;
    const asks = book.asks
      .map(
        o =>
          `<div class="orderbook-row ask"><span>$${o.price}</span><span>${o.size}</span><span>$${o.total}</span></div>`
      )
      .join('');
    const bids = book.bids
      .map(
        o =>
          `<div class="orderbook-row bid"><span>$${o.price}</span><span>${o.size}</span><span>$${o.total}</span></div>`
      )
      .join('');
    orderbookEl.innerHTML = `${header}${asks}${bids}`;
    orderbookEl.classList.remove('skeleton');
  }

  function generateOrderbook(base) {
    const bids = [];
    const asks = [];
    for (let i = 0; i < 10; i++) {
      const bidPrice = Number((base - i * (Math.random() * 6 + 2)).toFixed(2));
      const askPrice = Number((base + i * (Math.random() * 6 + 2)).toFixed(2));
      const size = Number((Math.random() * 3 + 0.2).toFixed(3));
      bids.push({ price: bidPrice, size, total: (bidPrice * size).toFixed(2) });
      asks.push({ price: askPrice, size, total: (askPrice * size).toFixed(2) });
    }
    return { bids, asks };
  }

  function renderPositions() {
    if (!positionsEl) return;
    const data = liveData.positions || positionsData;
    const header =
      '<div class="table-row header"><span>Par</span><span>Tamaño</span><span>Entrada</span><span>Liq.</span><span>P/L</span></div>';
    const rows = data
      .map(
        p =>
          `<div class="table-row"><span>${p.market}</span><span>${p.size}</span><span>$${p.entry.toLocaleString()}</span><span>$${p.liq.toLocaleString()}</span><span class="${p.pnl >= 0 ? 'positive' : 'negative'}">${p.pnl >= 0 ? '+' : ''}${p.pnl.toFixed(2)}</span></div>`
      )
      .join('');
    positionsEl.innerHTML = header + rows;
    positionsEl.classList.remove('skeleton');
  }

  function renderHistory() {
    if (!historyEl) return;
    const data = liveData.history || historyData;
    const header =
      '<div class="table-row header"><span>Par</span><span>Side</span><span>Tamaño</span><span>Estatus</span><span>Precio</span></div>';
    const rows = data
      .map(
        h =>
          `<div class="table-row"><span>${h.market}</span><span>${h.side}</span><span>${h.size}</span><span>${h.status}</span><span>$${h.price}</span></div>`
      )
      .join('');
    historyEl.innerHTML = header + rows;
    historyEl.classList.remove('skeleton');
  }

  function renderRFQ() {
    if (!rfqEl) return;
    const quotes = liveData.rfq || generateQuotes();
    rfqEl.innerHTML = quotes
      .map(
        q =>
          `<div class="table-row" style="grid-template-columns: repeat(4, 1fr); border: none;"><span>${q.market}</span><span>${q.side}</span><span>${q.size}</span><span>${
            q.status
          }</span></div>`
      )
      .join('');
    rfqEl.classList.remove('skeleton');
  }

  function generateQuotes() {
    const sides = ['Bid', 'Ask'];
    return markets.slice(0, 3).map(m => ({
      market: m.symbol,
      side: sides[Math.floor(Math.random() * sides.length)],
      size: (Math.random() * 1.2).toFixed(2),
      status: Math.random() > 0.4 ? 'Firm' : 'Indicativo',
    }));
  }

  function renderAssets() {
    if (!assetsContainer) return;
    const search = (assetsSearch?.value || '').toLowerCase();
    const filtered = assetsData
      .filter(a => a.name.toLowerCase().includes(search) || a.symbol.toLowerCase().includes(search))
      .sort((a, b) => sortAssets(a, b));
    assetsContainer.innerHTML = filtered.map(asset => renderAssetRow(asset)).join('');
  }

  function sortAssets(a, b) {
    const dir = assetsSort.dir === 'asc' ? 1 : -1;
    if (assetsSort.key === 'name') return a.name.localeCompare(b.name) * dir;
    if (assetsSort.key === 'balance') return (a.balance - b.balance) * dir;
    if (assetsSort.key === 'price') return (a.price - b.price) * dir;
    if (assetsSort.key === 'value') return (a.balance * a.price - b.balance * b.price) * dir;
    if (assetsSort.key === 'change') return (a.change - b.change) * dir;
    return 0;
  }

  function renderAssetRow(asset) {
    const value = (asset.balance * asset.price).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `
      <tr>
        <td>
          <div class="asset-info">
            <img src="${asset.logo}" alt="${asset.symbol}" class="asset-logo" />
            <div>
              <span class="asset-name">${asset.name}</span>
              <span class="asset-symbol">${asset.symbol}</span>
            </div>
          </div>
        </td>
        <td>${asset.balance.toLocaleString()} ${asset.symbol}</td>
        <td>$${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td>$${value}</td>
        <td class="${asset.change >= 0 ? 'positive' : 'negative'}">${asset.change >= 0 ? '+' : ''}${asset.change}%</td>
      </tr>
    `;
  }

  function handleTrade(side) {
    if (!tradeForm) return;
    const size = parseFloat(sizeInput?.value || '0');
    const leverage = Number(leverageInput?.value || '1');
    const minSize = 10;
    if (!size || size < minSize) {
      showToast(`El tamaño mínimo es ${minSize} ${state.symbol.split('-')[0]}.`, 'error');
      sizeInput?.focus();
      return;
    }
    if (leverage < 1 || leverage > 50) {
      showToast('El apalancamiento debe estar entre 1x y 50x.', 'error');
      leverageInput?.focus();
      return;
    }
    state.leverage = leverage;
    const message = `Orden ${side.toUpperCase()} enviada:<br><b>${state.symbol}</b> | Cantidad: <b>${size}</b> | x${leverage} (${state.marginMode})`;
    showToast(message, side === 'long' ? 'success' : 'info');
    const lastPrice = markets.find(m => m.symbol === state.symbol)?.price || 0;
    pushToHistory(side, size, lastPrice);
  }

  function pushToHistory(side, size, price) {
    historyData.unshift({
      market: state.symbol,
      side: side === 'long' ? 'Long' : 'Short',
      size,
      status: 'Enviada',
      price,
    });
    historyData.splice(10);
    renderHistory();
  }

  function bumpPrices() {
    markets.forEach(m => {
      const drift = (Math.random() - 0.5) * (m.price * 0.0025);
      m.price = Number(Math.max(m.price + drift, 0.0001).toFixed(2));
    });
  }

  function randomizePnl() {
    const data = liveData.positions || positionsData;
    data.forEach(p => {
      const swing = (Math.random() - 0.5) * 100;
      p.pnl = Number((p.pnl + swing).toFixed(2));
    });
  }

  function updateTradeSummary() {
    if (!tradeSummary) return;
    tradeSummary.innerHTML = `Este trade usa margin <strong>${state.marginMode}</strong> a <strong>${state.leverage}x</strong>.`;
  }

  function markLoaded(keys) {
    const list = Array.isArray(keys) ? keys : [keys];
    list.forEach(key => {
      document
        .querySelectorAll(`[data-skeleton="${key}"]`)
        .forEach(el => el.classList.remove('skeleton'));
    });
  }

  function markLoading(keys) {
    const list = Array.isArray(keys) ? keys : [keys];
    list.forEach(key => {
      document
        .querySelectorAll(`[data-skeleton="${key}"]`)
        .forEach(el => el.classList.add('skeleton'));
    });
  }

  function initFeeds() {
    const hasWs = Boolean(feedConfig.ws);
    const hasRest =
      Boolean(feedConfig.orderbook) ||
      Boolean(feedConfig.positions) ||
      Boolean(feedConfig.history) ||
      Boolean(feedConfig.rfq);
    if (!hasWs && !hasRest) return;

    if (hasWs) connectWebSocket(resolveUrl(feedConfig.ws));
    if (hasRest) scheduleRestPolling();
  }

  function reconnectFeeds() {
    liveData.prices = [];
    liveData.orderbook = null;
    liveData.positions = null;
    liveData.history = null;
    liveData.rfq = null;

    markLoading(['chart', 'orderbook', 'positions', 'history', 'rfq']);

    if (feedConfig.ws) connectWebSocket(resolveUrl(feedConfig.ws));
    if (feedConfig.orderbook || feedConfig.positions || feedConfig.history) scheduleRestPolling();
  }

  function scheduleRestPolling() {
    if (restPoll) clearInterval(restPoll);
    hydrateFromRest();
    const interval = feedConfig.pollInterval || 8000;
    restPoll = setInterval(hydrateFromRest, interval);
  }

  function connectWebSocket(url) {
    if (!url) return;
    try {
      ws?.close();
    } catch (e) {
      console.warn('WS close error', e);
    }
    wsUrlInUse = url;
    ws = new WebSocket(url);
    ws.onopen = () => showToast('WS conectado: mercado en vivo.', 'success');
    ws.onerror = () => showToast('Error de WS, reintentando…', 'error');
    ws.onclose = () => {
      if (wsUrlInUse !== url) return; // Evitar reconexión si ya cambiamos de par
      showToast('WS cerrado, reconectando…', 'info');
      setTimeout(() => connectWebSocket(url), 2500);
    };
    ws.onmessage = event => {
      try {
        const message = JSON.parse(event.data);
        handleFeedMessage(message);
      } catch (err) {
        console.error('WS parse error', err);
      }
    };
  }

  function handleFeedMessage(message) {
    const { type, payload } = message || {};
    if (!type) return;
    const symbol = payload?.symbol || payload?.pair;
    if (symbol && symbol !== state.symbol) return; // ignorar mensajes de otros pares

    switch (type) {
      case 'ticker':
        appendPricePoint(getPrice(payload));
        break;
      case 'orderbook':
        if (payload?.bids && payload?.asks) {
          liveData.orderbook = normalizeBook(payload);
          renderOrderbook();
          markLoaded('orderbook');
        }
        break;
      case 'positions':
        if (Array.isArray(payload)) {
          liveData.positions = mapPositionsPayload(payload);
          renderPositions();
          markLoaded('positions');
        }
        break;
      case 'history':
        if (Array.isArray(payload)) {
          liveData.history = mapHistoryPayload(payload);
          renderHistory();
          markLoaded('history');
        }
        break;
      case 'rfq':
        if (Array.isArray(payload)) {
          liveData.rfq = mapRfqPayload(payload);
          renderRFQ();
          markLoaded('rfq');
        }
        break;
      default:
        break;
    }
  }

  function appendPricePoint(price) {
    if (!price || Number.isNaN(price)) return;
    const point = [Date.now(), Number(price.toFixed(2))];
    liveData.prices.push(point);
    if (liveData.prices.length > 240) liveData.prices.shift();
    if (tradingChart) {
      tradingChart.updateSeries([{ name: state.symbol, data: liveData.prices }], true);
    }
    markLoaded('chart');
  }

  function hydrateFromRest() {
    const orderbookUrl = resolveUrl(feedConfig.orderbook);
    const positionsUrl = resolveUrl(feedConfig.positions);
    const historyUrl = resolveUrl(feedConfig.history);
    const rfqUrl = resolveUrl(feedConfig.rfq);
    const headers = feedConfig.apiKey
      ? {
          Authorization: `Bearer ${feedConfig.apiKey}`,
        }
      : {};

    if (orderbookUrl) {
      fetch(orderbookUrl, { headers })
        .then(r => r.json())
        .then(book => {
          liveData.orderbook = normalizeBook(book);
          renderOrderbook();
          markLoaded('orderbook');
        })
        .catch(err => {
          console.error('Orderbook fetch error', err);
          showToast('No pudimos actualizar el orderbook.', 'error');
        });
    }

    if (positionsUrl) {
      fetch(positionsUrl, { headers })
        .then(r => r.json())
        .then(data => {
          liveData.positions = data;
          renderPositions();
          markLoaded('positions');
        })
        .catch(err => {
          console.error('Positions fetch error', err);
          showToast('No pudimos actualizar posiciones.', 'error');
        });
    }

    if (historyUrl) {
      fetch(historyUrl, { headers })
        .then(r => r.json())
        .then(data => {
          liveData.history = data;
          renderHistory();
          markLoaded('history');
        })
        .catch(err => {
          console.error('History fetch error', err);
          showToast('No pudimos actualizar el historial.', 'error');
        });
    }

    if (rfqUrl) {
      fetch(rfqUrl, { headers })
        .then(r => r.json())
        .then(data => {
          liveData.rfq = mapRfqPayload(data);
          renderRFQ();
          markLoaded('rfq');
        })
        .catch(err => {
          console.error('RFQ fetch error', err);
          showToast('No pudimos actualizar RFQ.', 'error');
        });
    }
  }

  function normalizeBook(raw) {
    if (raw.bids && Array.isArray(raw.bids[0])) {
      return {
        bids: raw.bids.map(b => ({
          price: Number(b[0]).toFixed(2),
          size: Number(b[1]).toFixed(3),
          total: (Number(b[0]) * Number(b[1])).toFixed(2),
        })),
        asks: raw.asks.map(a => ({
          price: Number(a[0]).toFixed(2),
          size: Number(a[1]).toFixed(3),
          total: (Number(a[0]) * Number(a[1])).toFixed(2),
        })),
      };
    }
    if (raw.bids && Array.isArray(raw.bids)) return raw;
    return generateOrderbook(markets.find(m => m.symbol === state.symbol)?.price || 100);
  }

  function getPrice(payload) {
    if (!payload) return null;
    if (payload.price) return Number(payload.price);
    if (payload.p) return Number(payload.p);
    if (payload.last) return Number(payload.last);
    return null;
  }

  function mapPositionsPayload(list) {
    return list.map(p => ({
      market: p.market || p.symbol || p.pair || state.symbol,
      size: Number(p.size ?? p.qty ?? p.amount ?? 0),
      entry: Number(p.entry ?? p.entryPrice ?? p.avgEntry ?? 0),
      liq: Number(p.liq ?? p.liquidationPrice ?? p.liquidation ?? 0),
      pnl: Number(p.pnl ?? p.pnlUsd ?? p.unrealizedPnl ?? 0),
    }));
  }

  function mapHistoryPayload(list) {
    return list.map(h => ({
      market: h.market || h.symbol || h.pair || state.symbol,
      side: h.side || h.type || h.direction || '—',
      size: Number(h.size ?? h.qty ?? h.amount ?? 0),
      status: h.status || h.state || '—',
      price: Number(h.price ?? h.avgPrice ?? h.fillPrice ?? 0),
    }));
  }

  function mapRfqPayload(list) {
    return list.map(q => ({
      market: q.market || q.symbol || q.pair || state.symbol,
      side: q.side || q.direction || '—',
      size: Number(q.size ?? q.qty ?? q.amount ?? 0),
      status: q.status || q.state || '—',
    }));
  }

  function resolveUrl(url) {
    if (!url) return null;
    const [base, quote] = state.symbol.split('-');
    return url
      .replace(/\{symbol\}/g, state.symbol)
      .replace(/\{base\}/g, base || '')
      .replace(/\{quote\}/g, quote || '');
  }

  function markLoading(keys) {
    const list = Array.isArray(keys) ? keys : [keys];
    list.forEach(key => {
      document
        .querySelectorAll(`[data-skeleton="${key}"]`)
        .forEach(el => el.classList.add('skeleton'));
    });
  }

  function runOnboarding() {
    const flag = 'bf-onboarding-done';
    if (typeof window === 'undefined' || !toast || window.localStorage?.getItem(flag)) return;
    showToast('1/3: Selecciona un mercado para sincronizar gráfico y orderbook.', 'info');
    setTimeout(
      () =>
        showToast(
          '2/3: Configura cross/isolated, apalancamiento y % del balance en el panel derecho.',
          'info'
        ),
      1400
    );
    setTimeout(
      () => showToast('3/3: Consulta posiciones y órdenes en la sección inferior.', 'info'),
      2800
    );
    window.localStorage?.setItem(flag, 'true');
  }

  function pickColorForSymbol(symbol) {
    if (symbol.includes('BTC')) return '#fbbf24';
    if (symbol.includes('ETH')) return '#6366f1';
    if (symbol.includes('SOL')) return '#22c55e';
    if (symbol.includes('AVAX')) return '#f97316';
    return '#a855f7';
  }

  function showToast(message, variant = 'info') {
    if (toast && typeof toast.show === 'function') {
      toast.show(message, variant);
    } else {
      console.log(`[${variant}] ${message}`);
    }
  }
});
