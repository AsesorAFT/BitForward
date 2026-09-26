import '../editorial/main.js';
import './market.css';
import {
  MARKET_PRODUCT,
  MARKET_RANGES,
  MARKET_SOURCE,
  candlesToCsv,
  freshness,
  notesToMarkdown,
  parseMarketPayload,
  summarizeCandles,
} from './model.mjs';
import { deleteMarketNote, readMarketNotes, saveMarketNote } from './storage.mjs';

const $ = selector => document.querySelector(selector);
const sourceApi = `https://api.exchange.coinbase.com/products/${MARKET_PRODUCT}/candles`;
const dollar = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});
const quantity = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 4 });
const percent = new Intl.NumberFormat('es-MX', {
  style: 'percent',
  signDisplay: 'exceptZero',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const dateTime = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});
const shortDate = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

let currentRange = '24h';
let currentMarket = null;
let selectedIndex = 0;
let selectedDot = null;
let currentRequest = null;
let requestId = 0;

function utc(milliseconds) {
  return `${dateTime.format(new Date(milliseconds))} UTC`;
}

function download(content, filename, mime) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function showMessage(message, state = 'loading') {
  const target = $('#market-message');
  target.textContent = message;
  target.dataset.state = state;
}

function clearMarketDisplay() {
  currentMarket = null;
  selectedDot = null;
  $('#market-last-close').textContent = '—';
  $('#market-last-time').textContent = 'Esperando datos';
  $('#market-change').textContent = '—';
  $('#market-change').removeAttribute('data-direction');
  $('#market-extremes').textContent = '—';
  $('#market-chart').replaceChildren();
  $('#market-chart-empty').hidden = false;
  $('#market-time-start').textContent = '—';
  $('#market-time-end').textContent = '—';
  $('#market-chart-summary').textContent = 'Resumen textual disponible al cargar los datos.';
  $('#market-interval-label').textContent = 'Esperando velas completas.';
  $('#market-candle-count').textContent = '— velas';
  $('#market-inspection').textContent =
    'Mueve el control para leer apertura, máximo, mínimo, cierre y volumen.';
  $('#market-table-body').replaceChildren();
  $('#market-as-of').textContent = '—';
  $('#market-last-bucket').textContent = '—';
  $('#market-freshness').textContent = 'Sin datos';
  $('#market-scrubber').disabled = true;
  $('#market-export-csv').disabled = true;
  $('#market-save').disabled = true;
}

async function fetchDirectFromCoinbase(range, signal) {
  const config = MARKET_RANGES[range];
  const end = new Date();
  const start = new Date(end.getTime() - config.seconds * 1000);
  const url = new URL(sourceApi);
  url.searchParams.set('start', start.toISOString());
  url.searchParams.set('end', end.toISOString());
  url.searchParams.set('granularity', String(config.granularity));
  const response = await fetch(url, {
    credentials: 'omit',
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.ok) throw new Error(`Coinbase respondió con estado ${response.status}.`);
  const candles = await response.json();
  return {
    source: MARKET_SOURCE,
    product: MARKET_PRODUCT,
    range,
    granularity: config.granularity,
    asOf: new Date().toISOString(),
    candles,
  };
}

async function fetchMarket(range, signal) {
  if (!['www.afortu.com.mx', 'afortu.com.mx'].includes(location.hostname)) {
    return fetchDirectFromCoinbase(range, signal);
  }
  try {
    const response = await fetch(`./api/btc-candles?range=${range}`, {
      credentials: 'omit',
      headers: { Accept: 'application/json' },
      signal,
    });
    if (!response.ok) throw new Error(`La ruta de datos respondió ${response.status}.`);
    return await response.json();
  } catch (error) {
    if (signal.aborted) throw error;
    // Coinbase allows browser reads. AFORTU's BitForward-only CSP permits this
    // path when its same-origin Worker cannot reach the public market endpoint.
    return fetchDirectFromCoinbase(range, signal);
  }
}

function drawChart(candles, summary) {
  const svg = $('#market-chart');
  const ns = 'http://www.w3.org/2000/svg';
  const width = 720;
  const height = 280;
  const inset = 18;
  const span = Math.max(summary.high - summary.low, summary.high * 0.001);
  const low = summary.low - span * 0.08;
  const high = summary.high + span * 0.08;
  const point = (candle, index) => ({
    x: inset + (index / (candles.length - 1)) * (width - inset * 2),
    y: inset + ((high - candle.close) / (high - low)) * (height - inset * 2),
  });
  const points = candles.map(point);
  const linePath = points
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L${points.at(-1).x.toFixed(2)} ${height} L${points[0].x.toFixed(2)} ${height} Z`;
  const elements = [];
  for (let line = 1; line <= 3; line += 1) {
    const y = Math.round((height / 4) * line);
    const grid = document.createElementNS(ns, 'line');
    grid.setAttribute('x1', '0');
    grid.setAttribute('x2', String(width));
    grid.setAttribute('y1', String(y));
    grid.setAttribute('y2', String(y));
    grid.setAttribute('stroke', '#283a54');
    grid.setAttribute('stroke-width', '1');
    grid.setAttribute('vector-effect', 'non-scaling-stroke');
    elements.push(grid);
  }
  const area = document.createElementNS(ns, 'path');
  area.setAttribute('d', areaPath);
  area.setAttribute('fill', '#5c91dd');
  area.setAttribute('fill-opacity', '0.13');
  const line = document.createElementNS(ns, 'path');
  line.setAttribute('d', linePath);
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', '#a6c4ff');
  line.setAttribute('stroke-width', '2.5');
  line.setAttribute('stroke-linecap', 'round');
  line.setAttribute('stroke-linejoin', 'round');
  line.setAttribute('vector-effect', 'non-scaling-stroke');
  const dot = document.createElementNS(ns, 'circle');
  dot.setAttribute('r', '6');
  dot.setAttribute('fill', '#ddf1ff');
  dot.setAttribute('stroke', '#15385d');
  dot.setAttribute('stroke-width', '3');
  dot.setAttribute('vector-effect', 'non-scaling-stroke');
  svg.replaceChildren(...elements, area, line, dot);
  selectedDot = { dot, points };
  $('#market-chart-empty').hidden = true;
}

function inspectCandle(index) {
  if (!currentMarket) return;
  selectedIndex = Math.max(0, Math.min(currentMarket.candles.length - 1, Number(index)));
  const candle = currentMarket.candles[selectedIndex];
  const scrubber = $('#market-scrubber');
  scrubber.value = String(selectedIndex);
  scrubber.setAttribute(
    'aria-valuetext',
    `${utc(candle.time * 1000)}, cierre ${dollar.format(candle.close)}`
  );
  $('#market-inspection').textContent =
    `${utc(candle.time * 1000)} · Apertura ${dollar.format(candle.open)} · Máximo ${dollar.format(candle.high)} · Mínimo ${dollar.format(candle.low)} · Cierre ${dollar.format(candle.close)} · Volumen ${quantity.format(candle.volume)} BTC.`;
  if (selectedDot) {
    selectedDot.dot.setAttribute('cx', selectedDot.points[selectedIndex].x.toFixed(2));
    selectedDot.dot.setAttribute('cy', selectedDot.points[selectedIndex].y.toFixed(2));
  }
}

function fillTable(candles) {
  const body = $('#market-table-body');
  body.replaceChildren();
  for (const candle of candles.slice(-12).reverse()) {
    const row = document.createElement('tr');
    for (const cell of [
      utc(candle.time * 1000),
      dollar.format(candle.open),
      dollar.format(candle.high),
      dollar.format(candle.low),
      dollar.format(candle.close),
    ]) {
      const item = document.createElement('td');
      item.textContent = cell;
      row.append(item);
    }
    body.append(row);
  }
}

function renderMarket(market) {
  currentMarket = market;
  const config = MARKET_RANGES[market.range];
  const summary = summarizeCandles(market.candles);
  const { first, last } = summary;
  $('#market-last-close').textContent = dollar.format(last.close);
  $('#market-last-time').textContent = `Vela iniciada ${utc(last.time * 1000)}`;
  $('#market-change').textContent = percent.format(summary.changePercent / 100);
  $('#market-change').dataset.direction = summary.changePercent < 0 ? 'down' : 'up';
  $('#market-extremes').textContent =
    `${dollar.format(summary.low)} / ${dollar.format(summary.high)}`;
  $('#market-interval-label').textContent = `${config.label} · una vela cada ${config.interval}`;
  $('#market-candle-count').textContent = `${market.candles.length} velas completas`;
  $('#market-time-start').textContent = `${shortDate.format(new Date(first.time * 1000))} UTC`;
  $('#market-time-end').textContent = `${shortDate.format(new Date(last.time * 1000))} UTC`;
  $('#market-chart-summary').textContent =
    `Del primer cierre ${dollar.format(first.close)} al último ${dollar.format(last.close)}: ${percent.format(summary.changePercent / 100)}. Mínimo ${dollar.format(summary.low)} y máximo ${dollar.format(summary.high)} en las velas mostradas.`;
  $('#market-as-of').textContent = utc(Date.parse(market.asOf));
  $('#market-last-bucket').textContent = utc(last.time * 1000);
  $('#market-freshness').textContent = freshness(market.asOf).label;
  drawChart(market.candles, summary);
  fillTable(market.candles);
  const scrubber = $('#market-scrubber');
  scrubber.max = String(market.candles.length - 1);
  scrubber.disabled = false;
  $('#market-export-csv').disabled = false;
  $('#market-save').disabled = false;
  inspectCandle(market.candles.length - 1);
  showMessage(
    `${market.candles.length} velas completas cargadas. Fuente: Coinbase Exchange; consulta ${utc(Date.parse(market.asOf))}.`,
    'success'
  );
}

function refreshFreshness() {
  if (currentMarket) $('#market-freshness').textContent = freshness(currentMarket.asOf).label;
}

async function loadMarket(range, keepPrevious = false) {
  if (!MARKET_RANGES[range]) return;
  if (currentRequest) currentRequest.abort();
  currentRequest = new AbortController();
  const currentId = ++requestId;
  currentRange = range;
  document.querySelectorAll('[data-market-range]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.marketRange === range));
  });
  if (!keepPrevious) clearMarketDisplay();
  $('#market-reload').disabled = true;
  showMessage(`Consultando velas históricas de ${MARKET_RANGES[range].label}…`);
  try {
    const payload = await fetchMarket(range, currentRequest.signal);
    if (currentId !== requestId) return;
    renderMarket(parseMarketPayload(payload, range));
  } catch (error) {
    if (currentId !== requestId || error.name === 'AbortError') return;
    showMessage(
      keepPrevious && currentMarket
        ? 'No se pudo actualizar. Sigues viendo la consulta anterior, con su hora indicada abajo.'
        : 'No se pudieron cargar datos verificados. Revisa tu conexión o vuelve a intentarlo; no mostramos precios de ejemplo como si fueran reales.',
      'error'
    );
  } finally {
    if (currentId === requestId) {
      $('#market-reload').disabled = false;
      currentRequest = null;
    }
  }
}

function createSavedNote(note) {
  const article = document.createElement('article');
  article.className = 'market-saved-note';
  const time = document.createElement('time');
  time.dateTime = note.createdAt;
  time.textContent = utc(Date.parse(note.createdAt));
  const metadata = document.createElement('small');
  metadata.textContent = `${note.range} · vela ${utc(note.candleTime * 1000)} · cierre ${dollar.format(note.close)} · ${MARKET_SOURCE}`;
  const hypothesis = document.createElement('p');
  hypothesis.textContent = note.hypothesis;
  const invalidation = document.createElement('p');
  invalidation.textContent = `La pondría en duda: ${note.invalidation}`;
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.textContent = 'Borrar esta hipótesis';
  remove.addEventListener('click', () => {
    try {
      renderNotes(deleteMarketNote(note.id));
      $('#market-note-status').textContent = 'Hipótesis borrada de este navegador.';
    } catch {
      $('#market-note-status').textContent = 'No se pudo borrar. Inténtalo de nuevo.';
    }
  });
  article.append(time, metadata, hypothesis, invalidation, remove);
  return article;
}

function renderNotes(notes = readMarketNotes()) {
  const list = $('#market-saved-notes');
  list.replaceChildren();
  if (!notes.length) {
    const empty = document.createElement('p');
    empty.textContent = 'Aún no hay hipótesis guardadas.';
    list.append(empty);
  } else {
    list.append(...notes.map(createSavedNote));
  }
  $('#market-export-notes').disabled = notes.length === 0;
}

document.querySelectorAll('[data-market-range]').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.marketRange !== currentRange) loadMarket(button.dataset.marketRange);
  });
});
$('#market-reload').addEventListener('click', () => loadMarket(currentRange, true));
$('#market-scrubber').addEventListener('input', event => inspectCandle(event.target.value));
$('#market-export-csv').addEventListener('click', () => {
  if (currentMarket) {
    download(
      candlesToCsv(currentMarket),
      `bitforward-btc-${currentMarket.range}.csv`,
      'text/csv;charset=utf-8'
    );
  }
});
$('#market-export-notes').addEventListener('click', () => {
  const notes = readMarketNotes();
  if (notes.length) {
    download(notesToMarkdown(notes), 'bitforward-hipotesis-btc.md', 'text/markdown;charset=utf-8');
  }
});
$('#market-note-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!currentMarket) {
    $('#market-note-status').textContent =
      'Carga datos verificados antes de guardar una hipótesis.';
    return;
  }
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const candle = currentMarket.candles[selectedIndex];
  const note = {
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    createdAt: new Date().toISOString(),
    range: currentMarket.range,
    asOf: currentMarket.asOf,
    candleTime: candle.time,
    close: candle.close,
    hypothesis: $('#market-hypothesis').value.trim(),
    invalidation: $('#market-invalidation').value.trim(),
  };
  if (note.hypothesis.length < 10 || note.invalidation.length < 10) {
    $('#market-note-status').textContent = 'Escribe al menos diez caracteres en cada respuesta.';
    return;
  }
  try {
    renderNotes(saveMarketNote(note));
    form.reset();
    $('#market-note-status').textContent = 'Hipótesis guardada con la vela inspeccionada.';
  } catch (error) {
    $('#market-note-status').textContent = error.message?.includes('30 hipótesis')
      ? error.message
      : 'No se pudo guardar en este navegador. Copia tus respuestas antes de salir.';
  }
});

renderNotes();
loadMarket('24h');
window.setInterval(refreshFreshness, 60_000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refreshFreshness();
});
