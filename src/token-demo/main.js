import '../../css/editorial.css';
import './style.css';
import {
  NETWORK,
  PAIRS,
  freshState,
  restore,
  readQuote,
  submitDemo,
  settleDemo,
  balances,
  format,
  assetInfo,
} from './model.mjs';
import { CATALOG, MARKETS, capabilities, filterCatalog, instrumentNotice } from './catalog.mjs';

const $ = id => document.getElementById(id);
const KEY = 'bitforward-token-demo-v1';
const entryParams = new URLSearchParams(location.search);
if (entryParams.get('embed') === '1') document.body.classList.add('embedded');
const statuses = {
  pending: 'Pendiente de resolución demo',
  rejected: 'Simulación rechazada por el usuario',
  failed: 'Simulación fallida',
  confirmed: 'Simulación confirmada · sin tokens reales',
};
let selectedKey = CATALOG.find(item => item.market === 'spot' && item.base === 'BTC').key;
let marketFilter = 'all';
let state = freshState();
let storageReady = true;
try {
  state = restore(sessionStorage.getItem(KEY));
} catch {
  $('message').textContent = 'No se pudo recuperar el ejercicio. No se reenvió ninguna operación.';
}
try {
  sessionStorage.setItem(KEY, JSON.stringify(state));
} catch {
  storageReady = false;
  $('message').textContent =
    'Almacenamiento no disponible. El envío demo queda desactivado para evitar duplicados.';
}

function commit(next) {
  // Persistir antes de mostrar o resolver un envío.
  sessionStorage.setItem(KEY, JSON.stringify(next));
  state = next;
  render();
}

function attempt(action) {
  try {
    $('message').textContent = '';
    action();
  } catch (error) {
    $('message').textContent = error.message;
  }
}

function detail(list, title, value) {
  const term = document.createElement('dt');
  const description = document.createElement('dd');
  term.textContent = title;
  description.textContent = value;
  list.append(term, description);
}

const assetText = (value, asset) => {
  const info = assetInfo(asset);
  return `${format(value, info.decimals)} ${info.label} demo`;
};

function renderInstrument() {
  const instrument = CATALOG.find(item => item.key === selectedKey);
  const ability = capabilities(instrument);
  $('instrument-title').textContent =
    `${instrument.base}${instrument.quote ? '/USDT' : ''} · ${MARKETS[instrument.market]}`;
  $('instrument-notice').textContent = instrumentNotice(instrument);
  $('instrument-details').replaceChildren();
  for (const [label, value] of [
    ['Proveedor de referencia · no conectado', 'Binance'],
    ['Clave de selección', instrument.key],
    [
      'Nombre',
      instrument.name
        ? `${instrument.name}${instrument.nameStatus === 'selection-label' ? ' · etiqueta de selección, pendiente de metadata actual' : ''}`
        : 'Pendiente de metadata oficial; sin inferir por ticker',
    ],
    ['Identidad / disponibilidad actual', 'Pendiente / desconocida · ejecución real bloqueada'],
    ['Red / contrato', 'No verificados. USDT no determina una blockchain.'],
  ])
    detail($('instrument-details'), label, value);
  if (instrument.market === 'alpha')
    detail($('instrument-details'), 'Alpha ID', 'Pendiente del Token List oficial');
  if (instrument.reportedSnapshot) {
    detail($('instrument-details'), 'Tipo de contrato comunicado', instrument.contractType);
    detail(
      $('instrument-details'),
      'Snapshot comunicado por el usuario',
      'exchangeInfo Futures · 29/10/2026 · TRADING. No verificado aquí, no garantiza permisos ni disponibilidad futura.'
    );
  }
  $('instrument-fixture').textContent = ability.practice
    ? 'Fixture SIMULACIÓN: 1 unidad sintética = 10 USDT demo. No es un precio de mercado. Precisión demo de salida: 8 decimales, no decimales on-chain.'
    : 'Sin cotización ni simulación de compra: solo consulta educativa de esta selección.';
  $('catalog-practice').disabled = !ability.practice || state.stage === 'pending';
  $('catalog-practice').textContent = ability.practice
    ? 'Practicar Spot demo'
    : 'Solo exploración · sin compra';
  $('catalog-action-note').textContent =
    state.stage === 'pending'
      ? 'Espera el resultado pendiente antes de iniciar otro ejercicio.'
      : 'Ninguna ruta real está configurada. Los distintivos 5x/10x no habilitan apalancamiento.';
  document
    .querySelectorAll('#catalog-list button')
    .forEach(button =>
      button.setAttribute('aria-pressed', String(button.dataset.key === selectedKey))
    );
}

function renderCatalog() {
  const entries = filterCatalog($('catalog-search').value, marketFilter);
  $('catalog-count').textContent =
    `${entries.length} de 43 entradas · ${MARKETS[marketFilter] || 'Todos'}`;
  $('catalog-list').replaceChildren();
  for (const instrument of entries) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.key = instrument.key;
    button.setAttribute('aria-pressed', String(instrument.key === selectedKey));
    button.setAttribute(
      'aria-label',
      `Explorar ${instrument.instrumentId} · ${MARKETS[instrument.market]}`
    );
    const title = document.createElement('strong');
    title.textContent = instrument.market === 'alpha' ? instrument.base : instrument.instrumentId;
    const subtitle = document.createElement('span');
    subtitle.textContent = `${MARKETS[instrument.market]} · ${capabilities(instrument).practice ? 'Práctica demo' : 'Solo explorar'}`;
    button.append(title, subtitle);
    button.onclick = () => {
      selectedKey = instrument.key;
      renderInstrument();
    };
    item.append(button);
    $('catalog-list').append(item);
  }
  if (!entries.length) {
    const empty = document.createElement('li');
    empty.textContent = 'Sin coincidencias. Prueba otro símbolo o mercado.';
    $('catalog-list').append(empty);
  }
  for (const button of $('catalog-filters').querySelectorAll('button'))
    button.setAttribute('aria-pressed', String(button.dataset.market === marketFilter));
}

function updatePair() {
  const pair = PAIRS[$('pair').value];
  if (pair.instrumentKey) {
    selectedKey = pair.instrumentKey;
    renderInstrument();
  }
  $('input-unit').textContent = `(${pair.input} demo)`;
  $('pair-context').textContent = pair.instrumentKey
    ? `${pair.output}/USDT · Spot · Binance como referencia, sin conexión. Fixture: 1 unidad sintética = 10 USDT demo; red, contrato y disponibilidad real pendientes.`
    : 'Caso educativo original USDC/ETH, fuera de los 43 favoritos.';
}

function render() {
  $('learn').hidden = state.stage !== 'learn';
  $('selection').hidden = state.stage !== 'select';
  $('review').hidden = state.stage !== 'review';
  $('result').hidden = !['pending', 'result'].includes(state.stage);
  $('scenario').disabled = state.stage === 'pending';
  renderInstrument();
  $('balances').replaceChildren();
  for (const [asset, value] of Object.entries(balances(state)))
    detail($('balances'), `Disponible ${asset} demo`, assetText(value, asset));
  document.querySelectorAll('.demo-steps li').forEach((item, index) => {
    const active = ['learn', 'select', 'review', 'pending'].indexOf(state.stage);
    if (index === (state.stage === 'result' ? 3 : active))
      item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  if (state.stage === 'review') {
    const q = state.quote;
    const pair = PAIRS[q.pairId];
    const outputAsset = pair.outputAsset || pair.output;
    $('quote-details').replaceChildren();
    for (const [label, value] of [
      ['Importe de entrada', assetText(q.input, pair.input)],
      ['Instrumento', pair.instrumentKey || 'Caso original USDC/ETH · fuera de favoritos'],
      [
        'Fuente',
        q.source === 'simulation'
          ? 'SIMULACIÓN · spot-uniform-v1 · no cotización de Binance'
          : 'Fixture original USDC/ETH',
      ],
      ['Salida estimada', assetText(q.output, outputAsset)],
      ['Mínimo a recibir · tolerancia 0,5 %', assetText(q.minimum, outputAsset)],
      ['Red', NETWORK],
      ['Proveedor ficticio · 0,3 % adicional, redondeo hacia arriba', assetText(q.fee, pair.input)],
      ['Coste de red fijo', assetText(q.gas, 'ETH')],
      ...Object.entries(q.totals).map(([asset, value]) => [
        `Total a descontar en ${asset}`,
        assetText(value, asset),
      ]),
      ['Caducidad local', new Date(q.expiresAt).toLocaleTimeString('es-MX')],
    ])
      detail($('quote-details'), label, value);
    updateExpiry();
  }
  if (['pending', 'result'].includes(state.stage)) {
    const row = state.history[0];
    $('result-title').textContent = statuses[row.status];
    $('result-copy').textContent =
      row.status === 'pending'
        ? `${row.id}: esperando el resultado del simulador local. Recargar no lo reenvía.`
        : `${row.id}: no se envió nada a una red real. Consulta el detalle en el historial.`;
    $('again').hidden = state.stage === 'pending';
  }
  $('history').replaceChildren();
  if (!state.history.length) {
    const empty = document.createElement('li');
    empty.textContent = 'Aún no hay intercambios demo en esta pestaña.';
    $('history').append(empty);
  }
  for (const row of state.history) {
    const item = document.createElement('li');
    const pair = PAIRS[row.quote.pairId];
    item.textContent = `${row.id} · Compra/intercambio demo · ${pair.instrumentKey || 'Caso original USDC/ETH'} · ${assetText(row.quote.input, pair.input)} → ${assetText(row.quote.output, pair.outputAsset || pair.output)} estimados · ${statuses[row.status]}. Costes: ${assetText(row.quote.fee, pair.input)} proveedor + ${assetText(row.quote.gas, 'ETH')} red ficticia. ${row.quote.source === 'simulation' ? 'Fixture spot-uniform-v1, no cotización de mercado. ' : ''}${row.status === 'confirmed' ? 'Salida simulada igual a la estimada.' : 'No es una recepción confirmada.'}`;
    $('history').append(item);
  }
}

function updateExpiry() {
  if (state.stage !== 'review') return;
  const seconds = Math.max(0, Math.ceil((state.quote.expiresAt - Date.now()) / 1000));
  $('expiry').textContent = seconds
    ? `Cotización demo válida durante ${seconds} s.`
    : 'Cotización caducada. Vuelve a elegir para renovarla.';
  $('confirm').disabled = !storageReady || !$('consent').checked || seconds === 0;
}

$('practice').onclick = () =>
  attempt(() => {
    commit({ ...state, stage: 'select' });
    $('pair').focus();
  });
$('pair').onchange = updatePair;
$('catalog-search').oninput = renderCatalog;
for (const button of $('catalog-filters').querySelectorAll('button'))
  button.onclick = () => {
    marketFilter = button.dataset.market;
    renderCatalog();
  };
$('catalog-practice').onclick = () =>
  attempt(() => {
    const instrument = CATALOG.find(item => item.key === selectedKey);
    if (!capabilities(instrument).practice || state.stage === 'pending') return;
    $('pair').value = instrument.key;
    updatePair();
    if (state.stage === 'learn') {
      $('message').textContent = 'Favorito elegido. Lee los límites antes de empezar la práctica.';
      $('practice').focus();
      return;
    }
    $('consent').checked = false;
    commit({ ...state, stage: 'select', quote: null });
    $('pair').focus();
  });
$('selection').onsubmit = event => {
  event.preventDefault();
  attempt(() => {
    const quote = readQuote($('pair').value, $('amount').value.trim(), Date.now());
    $('consent').checked = false;
    commit({ ...state, stage: 'review', quote });
    $('review-title').focus();
  });
};
$('consent').onchange = updateExpiry;
$('confirm').onclick = () =>
  attempt(() => {
    if (!storageReady || !$('consent').checked) return;
    commit(submitDemo(state, $('scenario').value, Date.now()));
    if (['pending', 'result'].includes(state.stage)) $('result-title').focus();
  });
for (const id of ['edit', 'again'])
  $(id).onclick = () =>
    attempt(() => {
      if (state.stage === 'pending') return;
      $('consent').checked = false;
      commit({ ...state, stage: 'select', quote: null });
      $('pair').focus();
    });
setInterval(() => {
  updateExpiry();
  if (state.stage === 'pending')
    attempt(() => {
      const next = settleDemo(state, Date.now());
      if (next !== state) {
        commit(next);
        $('message').textContent = statuses[state.history[0].status];
      }
    });
}, 250);
const spotOptions = document.createElement('optgroup');
spotOptions.label = 'Favoritos Spot · USDT demo · sin deuda';
for (const instrument of CATALOG.filter(item => capabilities(item).practice)) {
  const option = document.createElement('option');
  option.value = instrument.key;
  option.textContent = `USDT demo → ${instrument.base} sintético · Spot`;
  spotOptions.append(option);
}
$('pair').append(spotOptions);
const requestedInstrument = CATALOG.find(item => item.key === entryParams.get('instrument'));
if (!state.quote && requestedInstrument && capabilities(requestedInstrument).practice) {
  $('pair').value = requestedInstrument.key;
  selectedKey = requestedInstrument.key;
}
if (state.quote) {
  $('pair').value = state.quote.pairId;
  if (state.quote.instrumentKey) selectedKey = state.quote.instrumentKey;
}
updatePair();
renderCatalog();
render();
