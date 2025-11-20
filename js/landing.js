const state = {
  prices: {},
  networks: [],
};

const headers = { 'Content-Type': 'application/json' };

async function fetchJson(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

async function loadPrices() {
  try {
    const data = await fetchJson('/api/prices?assets=bitcoin,ethereum,solana&vs=usd');
    state.prices = data.prices || {};
    renderPrices();
    const btc = state.prices?.bitcoin?.usd || 0;
    const eth = state.prices?.ethereum?.usd || 0;
    setText('kpi-tvl', btc && eth ? `$${Math.round((btc + eth) * 1200).toLocaleString()}` : '$--');
  } catch (error) {
    console.warn('Price load failed', error);
  }
}

async function loadNetworks() {
  try {
    const data = await fetchJson('/api/config/networks');
    state.networks = data.networks || [];
    setText('kpi-networks', state.networks.length || '--');
    renderNetworks();
  } catch (error) {
    console.warn('Network load failed', error);
  }
}

function renderPrices() {
  const container = document.getElementById('live-prices');
  if (!container) return;
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

function renderNetworks() {
  const list = document.getElementById('network-list');
  if (!list) return;
  list.innerHTML = '';
  state.networks.forEach(net => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${net.name}</span><span class="sub">${net.nativeSymbol} · chainId ${net.chainId}</span>`;
    list.appendChild(li);
  });
}

async function loadCounts() {
  try {
    const [contractsRes, loansRes] = await Promise.all([
      fetchJson('/api/contracts').catch(() => null),
      fetchJson('/api/lending/loans').catch(() => null),
    ]);
    const contracts = contractsRes?.contracts || [];
    const loans = loansRes?.loans || [];
    setText('kpi-contracts', contracts.length || '0');
    setText('kpi-loans', loans.length || '0');
  } catch (error) {
    console.warn('Counts load failed', error);
  }
}

async function init() {
  await Promise.all([loadPrices(), loadNetworks(), loadCounts()]);
}

document.addEventListener('DOMContentLoaded', init);
