const state = {
  token: localStorage.getItem('bf_access_token') || '',
  prices: {},
  networks: [],
  defaultNetwork: 'ethereum',
};

const headers = () => {
  const h = { 'Content-Type': 'application/json' };
  if (state.token) {
    h.Authorization = `Bearer ${state.token}`;
  }
  return h;
};

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { ...headers(), ...(opts.headers || {}) } });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

async function loadNetworks() {
  try {
    const data = await fetchJson('/api/config/networks');
    state.networks = data.networks || [];
    state.defaultNetwork = data.default || 'ethereum';
    const select = document.getElementById('network-picker');
    select.innerHTML = '';
    state.networks.forEach(net => {
      const opt = document.createElement('option');
      opt.value = net.key;
      opt.textContent = `${net.name} (${net.nativeSymbol})`;
      if (net.key === state.defaultNetwork) opt.selected = true;
      select.appendChild(opt);
    });
  } catch (error) {
    console.warn('Networks fetch failed', error);
  }
}

async function loadPrices() {
  try {
    const data = await fetchJson('/api/prices?assets=bitcoin,ethereum,solana&vs=usd');
    state.prices = data.prices || {};
    renderPrices();
  } catch (error) {
    console.warn('Price fetch failed', error);
  }
}

async function loadData() {
  const alerts = [];
  let contracts = [];
  let loans = [];
  let positions = [];
  let hedges = [];

  const requests = [
    fetchJson('/api/contracts').catch(() => null),
    fetchJson('/api/lending/loans').catch(() => null),
    fetchJson('/api/defi/positions').catch(() => null),
    fetchJson('/api/defi/hedges').catch(() => null),
  ];

  const [contractsRes, loansRes, positionsRes, hedgesRes] = await Promise.all(requests);
  contracts = safeArray(contractsRes?.contracts);
  loans = safeArray(loansRes?.loans);
  positions = safeArray(positionsRes?.positions);
  hedges = safeArray(hedgesRes?.hedges);

  // Simple derived alerts
  positions
    .filter(p => (p.healthFactor || 1) < 60)
    .forEach(p =>
      alerts.push({ type: 'Riesgo', msg: `Posición ${p.asset} riesgo alto (HF ${p.healthFactor})` })
    );
  hedges
    .filter(h => h.status === 'failed')
    .forEach(h => alerts.push({ type: 'Hedge', msg: `Hedge ${h.id} falló` }));

  renderStats({ contracts, loans, positions, hedges });
  renderTables({ contracts, hedges, loans, positions });
  renderAlerts(alerts);
  renderChart({ contracts, loans, positions });
}

function renderPrices() {
  const container = document.getElementById('price-cards');
  container.innerHTML = '';
  const pairs = [
    ['bitcoin', 'BTC'],
    ['ethereum', 'ETH'],
    ['solana', 'SOL'],
  ];
  pairs.forEach(([key, label]) => {
    const price = state.prices?.[key]?.usd;
    const card = document.createElement('div');
    card.className = 'price-card';
    card.innerHTML = `
      <div class="pair">${label}/USD</div>
      <div class="value">${price ? `$${price.toLocaleString()}` : '--'}</div>
    `;
    container.appendChild(card);
  });
}

function renderStats({ contracts, loans, positions, hedges }) {
  document.getElementById('stat-contracts').textContent = contracts.length;
  document.getElementById('stat-loans').textContent = loans.length;
  document.getElementById('stat-positions').textContent = positions.length;
  document.getElementById('stat-hedges').textContent = hedges.length;

  document.getElementById('stat-contracts-detail').textContent =
    `${contracts.filter(c => c.status === 'active').length} activos`;
  document.getElementById('stat-loans-detail').textContent =
    `${loans.filter(l => l.status === 'active').length} activos`;
  document.getElementById('stat-positions-detail').textContent =
    `${positions.filter(p => p.status === 'open').length} abiertas`;
  document.getElementById('stat-hedges-detail').textContent =
    `${hedges.filter(h => h.status === 'pending').length} pendientes`;
}

function renderTables({ contracts, hedges, loans, positions }) {
  const contractsTable = document.getElementById('contracts-table');
  const loansTable = document.getElementById('loans-table');

  contractsTable.innerHTML = '';
  loansTable.innerHTML = '';

  [...contracts, ...hedges].slice(0, 6).forEach(item => {
    const tr = document.createElement('tr');
    const isHedge = item.assetIn || item.asset_out;
    tr.innerHTML = `
      <td>${item.id || item.reference_id || '--'}</td>
      <td>${isHedge ? 'Hedge' : 'Contrato'}</td>
      <td>${isHedge ? `${item.assetIn || item.asset_in}→${item.assetOut || item.asset_out}` : item.asset || item.collateral_asset || '--'}</td>
      <td>${item.amount || item.amountIn || item.amount_in || '--'}</td>
      <td>${item.status || '--'}</td>
    `;
    contractsTable.appendChild(tr);
  });

  [...loans, ...positions].slice(0, 6).forEach(item => {
    const isLoan = !!item.principal || item.principal_amount !== undefined;
    const asset = isLoan ? item.collateral?.type || item.collateral_asset : item.asset;
    const amount = isLoan
      ? item.loan?.amount || item.principal_amount
      : item.amount !== undefined
        ? item.amount
        : null;
    const status = item.status || '--';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${isLoan ? 'Préstamo' : 'Posición'}</td>
      <td>${asset || '--'}</td>
      <td>${amount !== null && amount !== undefined ? amount : '--'}</td>
      <td>${status}</td>
    `;
    loansTable.appendChild(tr);
  });
}

function renderAlerts(alerts) {
  const list = document.getElementById('alert-list');
  const counter = document.getElementById('alert-count');
  list.innerHTML = '';
  counter.textContent = alerts.length;
  if (!alerts.length) {
    const li = document.createElement('li');
    li.textContent = 'Sin alertas críticas';
    list.appendChild(li);
    return;
  }
  alerts.slice(0, 5).forEach(alert => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${alert.msg}</span><span class="tag">${alert.type}</span>`;
    list.appendChild(li);
  });
}

function renderChart({ contracts, loans, positions }) {
  const totalContracts = contracts.length;
  const activeLoans = loans.filter(l => l.status === 'active').length;
  const openPositions = positions.filter(p => p.status === 'open').length;

  const series = [
    { name: 'Contratos', data: [totalContracts] },
    { name: 'Préstamos', data: [activeLoans] },
    { name: 'Vault', data: [openPositions] },
  ];

  const options = {
    chart: { type: 'bar', height: 280, background: 'transparent', foreColor: '#e7edf7' },
    plotOptions: { bar: { horizontal: false, columnWidth: '50%', borderRadius: 8 } },
    dataLabels: { enabled: false },
    xaxis: { categories: ['Estado actual'] },
    theme: { mode: 'dark' },
    colors: ['#62d0ff', '#a78bfa', '#34d399'],
  };

  const el = document.querySelector('#tvl-chart');
  if (!el) return;
  if (el._chart) {
    el._chart.updateSeries(series);
  } else {
    el._chart = new ApexCharts(el, { ...options, series });
    el._chart.render();
  }
}

function bindEvents() {
  const refresh = document.getElementById('refresh-dashboard');
  refresh?.addEventListener('click', () => {
    loadPrices();
    loadData();
  });

  document.getElementById('network-picker')?.addEventListener('change', e => {
    state.defaultNetwork = e.target.value;
  });
}

async function init() {
  bindEvents();
  await loadNetworks();
  await loadPrices();
  await loadData();
}

document.addEventListener('DOMContentLoaded', init);
