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
} from './model.mjs';

const $ = id => document.getElementById(id);
const KEY = 'bitforward-token-demo-v1';
const statuses = {
  pending: 'Pendiente de resolución demo',
  rejected: 'Simulación rechazada por el usuario',
  failed: 'Simulación fallida',
  confirmed: 'Simulación confirmada · sin tokens reales',
};
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

const assetText = (value, asset) => `${format(value, asset === 'ETH' ? 18 : 6)} ${asset} demo`;

function render() {
  $('learn').hidden = state.stage !== 'learn';
  $('selection').hidden = state.stage !== 'select';
  $('review').hidden = state.stage !== 'review';
  $('result').hidden = !['pending', 'result'].includes(state.stage);
  $('scenario').disabled = state.stage === 'pending';
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
    $('quote-details').replaceChildren();
    for (const [label, value] of [
      ['Importe de entrada', assetText(q.input, pair.input)],
      ['Salida estimada', assetText(q.output, pair.output)],
      ['Mínimo a recibir · tolerancia 0,5 %', assetText(q.minimum, pair.output)],
      ['Red', NETWORK],
      ['Proveedor ficticio · 0,3 % adicional, redondeo hacia arriba', assetText(q.fee, pair.input)],
      ['Coste de red fijo', assetText(q.gas, 'ETH')],
      ['Total a descontar en USDC', assetText(q.totals.USDC, 'USDC')],
      ['Total a descontar en ETH', assetText(q.totals.ETH, 'ETH')],
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
    item.textContent = `${row.id} · Compra/intercambio demo · ${assetText(row.quote.input, pair.input)} → ${assetText(row.quote.output, pair.output)} estimados · ${statuses[row.status]}. Costes: ${assetText(row.quote.fee, pair.input)} proveedor + ${assetText(row.quote.gas, 'ETH')} red. ${row.status === 'confirmed' ? 'Salida simulada igual a la estimada.' : 'No es una recepción confirmada.'}`;
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
$('pair').onchange = () => {
  $('input-unit').textContent = `(${PAIRS[$('pair').value].input} demo)`;
};
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
render();
