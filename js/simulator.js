import './components/bf-header.js';
import { MODEL_ALLOCATION, simulatePortfolio, simulationToCsv } from './simulation-engine.mjs';

const ASSET_COLORS = {
  BTC: '#f7931a',
  ETH: '#7c8cff',
  SOL: '#14f195',
  ADA: '#38bdf8',
};

const PRESETS = {
  didactic: { BTC: 15, ETH: 10, SOL: 5, ADA: 0 },
  neutral: { BTC: 0, ETH: 0, SOL: 0, ADA: 0 },
  stress: { BTC: -35, ETH: -45, SOL: -55, ADA: -60 },
};

const form = document.getElementById('simulator-form');
const errorBox = document.getElementById('form-error');
const resultsRegion = document.getElementById('simulation-results');
const exportButton = document.getElementById('export-csv');
let latestSimulation = null;

const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 });

function formatPercent(value, digits = 1) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}

function getOptions() {
  const data = new FormData(form);
  return {
    initialCapital: data.get('initialCapital'),
    monthlyContribution: data.get('monthlyContribution'),
    months: data.get('months'),
    rebalanceBand: 0.05,
    annualReturns: {
      BTC: data.get('btcReturn'),
      ETH: data.get('ethReturn'),
      SOL: data.get('solReturn'),
      ADA: data.get('adaReturn'),
    },
  };
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function renderSummary(simulation) {
  setText('result-final', money.format(simulation.finalValue));
  setText('result-contributed', money.format(simulation.totalContributions));
  setText(
    'result-change',
    `${money.format(simulation.result)} · ${formatPercent(simulation.resultPercent)}`
  );
  setText('result-rebalances', number.format(simulation.rebalanceCount));
  setText('result-drawdown', formatPercent(simulation.maxDrawdown));

  const resultChange = document.getElementById('result-change');
  resultChange.classList.toggle('negative', simulation.result < 0);
  resultChange.classList.toggle('positive', simulation.result > 0);
}

function getChartPoint(index, value, records, width, height, padding, maxValue) {
  const x = padding + (index / Math.max(records.length - 1, 1)) * (width - padding * 2);
  const y = height - padding - (value / Math.max(maxValue, 1)) * (height - padding * 2);
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}

function renderChart(simulation) {
  const width = 760;
  const height = 280;
  const padding = 32;
  const maxValue = Math.max(
    ...simulation.records.flatMap(record => [record.total, record.contributed])
  );
  const totalPoints = simulation.records
    .map((record, index, records) =>
      getChartPoint(index, record.total, records, width, height, padding, maxValue)
    )
    .join(' ');
  const contributionPoints = simulation.records
    .map((record, index, records) =>
      getChartPoint(index, record.contributed, records, width, height, padding, maxValue)
    )
    .join(' ');
  const chart = document.getElementById('projection-chart');

  chart.setAttribute(
    'aria-label',
    `Proyección hipotética a ${simulation.months} meses. Valor final ${money.format(
      simulation.finalValue
    )}; capital aportado ${money.format(simulation.totalContributions)}.`
  );
  chart.innerHTML = `
    <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${
      height - padding
    }" class="chart-axis" />
    <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" class="chart-axis" />
    <polyline points="${contributionPoints}" class="chart-line contributions" />
    <polyline points="${totalPoints}" class="chart-line portfolio" />
    <text x="${padding}" y="${height - 8}" class="chart-label">Mes 0</text>
    <text x="${width - padding}" y="${height - 8}" text-anchor="end" class="chart-label">Mes ${
      simulation.months
    }</text>
    <text x="${padding + 4}" y="${padding - 10}" class="chart-label">${money.format(
      maxValue
    )}</text>
  `;
}

function renderAllocation(simulation) {
  const list = document.getElementById('final-allocation');
  list.replaceChildren(
    ...Object.keys(MODEL_ALLOCATION).map(asset => {
      const item = document.createElement('li');
      const label = document.createElement('span');
      const value = document.createElement('strong');
      const dot = document.createElement('i');
      dot.style.background = ASSET_COLORS[asset];
      label.append(
        dot,
        document.createTextNode(`${asset} · objetivo ${MODEL_ALLOCATION[asset] * 100}%`)
      );
      value.textContent = `${(simulation.finalWeights[asset] * 100).toFixed(1)}%`;
      item.append(label, value);
      return item;
    })
  );
}

function renderTable(simulation) {
  const body = document.getElementById('projection-rows');
  const visibleRecords = simulation.records.filter(
    record =>
      record.month === 0 ||
      record.month === simulation.months ||
      record.rebalanced ||
      record.month % 3 === 0
  );

  body.replaceChildren(
    ...visibleRecords.map(record => {
      const row = document.createElement('tr');
      const values = [
        record.month === 0 ? 'Inicio' : `Mes ${record.month}`,
        money.format(record.contributed),
        money.format(record.total),
        money.format(record.result),
        record.rebalanced ? 'Sí' : 'No',
      ];
      values.forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
      return row;
    })
  );
}

function renderMethodNote(simulation) {
  const rates = Object.entries(simulation.annualReturns)
    .map(([asset, rate]) => `${asset} ${formatPercent(rate, 0)}`)
    .join(', ');
  setText(
    'scenario-summary',
    `Escenario anual constante: ${rates}. Aportaciones al inicio de cada mes; revisión al cierre mensual; rebalanceo sólo al superar ±5 puntos porcentuales.`
  );
}

function calculate({ focusResults = false } = {}) {
  errorBox.hidden = true;
  try {
    latestSimulation = simulatePortfolio(getOptions());
    renderSummary(latestSimulation);
    renderChart(latestSimulation);
    renderAllocation(latestSimulation);
    renderTable(latestSimulation);
    renderMethodNote(latestSimulation);
    exportButton.disabled = false;
    if (focusResults) resultsRegion.focus();
  } catch (error) {
    latestSimulation = null;
    exportButton.disabled = true;
    errorBox.textContent = error.message;
    errorBox.hidden = false;
    errorBox.focus();
  }
}

function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;
  Object.entries(preset).forEach(([asset, value]) => {
    const input = document.getElementById(`${asset.toLowerCase()}-return`);
    input.value = value;
  });
  document.querySelectorAll('[data-preset]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.preset === name));
  });
  calculate();
}

form.addEventListener('submit', event => {
  event.preventDefault();
  calculate({ focusResults: true });
});

form.addEventListener('reset', () => {
  window.setTimeout(() => applyPreset('didactic'), 0);
});

document.querySelectorAll('[data-preset]').forEach(button => {
  button.addEventListener('click', () => applyPreset(button.dataset.preset));
});

exportButton.addEventListener('click', () => {
  if (!latestSimulation) return;
  const blob = new Blob([simulationToCsv(latestSimulation)], {
    type: 'text/csv;charset=utf-8',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'bitforward-simulacion-educativa.csv';
  link.click();
  URL.revokeObjectURL(link.href);
});

calculate();
