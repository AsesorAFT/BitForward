import '../editorial/main.js';
import { readLearning, saveLearning } from '../ecosystem/storage.mjs';
import { calculateScenario } from './engine.mjs';
import './simulator.css';

const form = document.querySelector('#scenario-form');
const fallback = document.querySelector('#sim-fallback');
const app = document.querySelector('#sim-app');
const error = document.querySelector('#scenario-error');
const saveStatus = document.querySelector('#save-status');
const modeInputs = [...form.querySelectorAll('input[name="mode"]')];
const derivativeInputs = [...form.querySelectorAll('.sim-derivative-field input')];
const leverageInput = form.querySelector('#leverage');
const results = document.querySelector('#scenario-results');

const usd = value =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const btc = value =>
  `${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 8 }).format(value)} BTC`;

const percent = value =>
  `${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(value)}%`;

function display(id, value) {
  document.querySelector(`#${id}`).textContent = value;
}

function currentValues() {
  return {
    mode: form.querySelector('input[name="mode"]:checked').value,
    capital: form.capital.value,
    entryPrice: form.entryPrice.value,
    exitPrice: form.exitPrice.value,
    leverage: form.leverage.value,
    feePercent: form.feePercent.value,
    spreadPercent: form.spreadPercent.value,
    fundingPercent: form.fundingPercent.value,
    hours: form.hours.value,
    maintenancePercent: form.maintenancePercent.value,
  };
}

function synchronizeMode() {
  const spot = form.querySelector('input[name="mode"]:checked').value === 'spot';
  leverageInput.disabled = spot;
  derivativeInputs.forEach(input => {
    input.disabled = spot;
  });
}

function showResult(result) {
  const lead = results.querySelector('.sim-result-lead');
  lead.dataset.outcome = result.netPnl < 0 ? 'loss' : result.netPnl > 0 ? 'gain' : 'even';
  display('result-net', usd(result.netPnl));
  display('result-return', `${percent(result.returnPercent)} del capital ficticio`);
  display('result-notional', usd(result.notional));
  display('result-quantity', btc(result.quantity));
  display('result-gross', usd(result.grossPnl));
  display('result-fees', usd(-(result.entryFee + result.exitFee)));
  display('result-funding', result.mode === 'spot' ? 'No aplica' : usd(-result.fundingCost));
  display('result-equity', usd(result.theoreticalEquity));

  if (result.mode === 'spot') {
    display('result-threshold', 'No aplica a spot');
    display('result-distance', 'No hay margen prestado en este modelo.');
  } else if (result.theoreticalLiquidation === null) {
    display('result-threshold', 'Sin umbral positivo');
    display('result-distance', 'Con estos supuestos, la ecuación no cruza un precio positivo.');
  } else {
    display('result-threshold', usd(result.theoreticalLiquidation));
    display(
      'result-distance',
      `${percent(result.distanceToLiquidationPercent)} desde el precio de entrada, en dirección contraria`
    );
  }

  const warning = document.querySelector('#result-warning');
  if (result.initialBufferExhausted) {
    warning.textContent =
      'Estos costos y el margen supuesto agotan el colchón inicial del ejemplo. Revisa los supuestos antes de interpretar la salida.';
    warning.hidden = false;
  } else if (result.crossesTheoreticalThreshold) {
    warning.textContent =
      'La salida elegida cruza el umbral teórico. El saldo mostrado es sólo algebraico: en una operación real podría producirse liquidación antes de llegar a ese precio.';
    warning.hidden = false;
  } else if (result.theoreticalEquity < 0) {
    warning.textContent =
      'El saldo algebraico es negativo. No representa una cuenta ejecutable ni una pérdida máxima garantizada.';
    warning.hidden = false;
  } else {
    warning.hidden = true;
  }
}

function render({ reportErrors = false } = {}) {
  synchronizeMode();
  try {
    const result = calculateScenario(currentValues());
    showResult(result);
    results.hidden = false;
    error.hidden = true;
    error.textContent = '';
    return result;
  } catch (cause) {
    results.hidden = true;
    error.textContent = reportErrors
      ? cause.message
      : 'Completa valores válidos para calcular un escenario actualizado.';
    error.hidden = false;
    return null;
  }
}

function markdown(result, reflection) {
  const direction = { spot: 'Spot', long: 'Largo', short: 'Corto' }[result.mode];
  const threshold =
    result.theoreticalLiquidation === null
      ? 'Sin umbral positivo bajo estos supuestos'
      : usd(result.theoreticalLiquidation);
  return `# BitForward · Escenario ficticio de BTC

Fecha: ${new Date().toLocaleDateString('es-MX')}
Modalidad: ${direction}
Capital ficticio: ${usd(result.capital)}
Entrada manual: ${usd(result.entryPrice)} por BTC
Salida manual: ${usd(result.exitPrice)} por BTC
Apalancamiento: ${result.leverage}x
Exposición ficticia: ${usd(result.notional)}
Cantidad estimada: ${btc(result.quantity)}

## Supuestos de costo

Comisión por lado: ${percent(result.feePercent)}
Spread total: ${percent(result.spreadPercent)}
Funding por 8 horas: ${result.mode === 'spot' ? 'No aplica' : percent(result.fundingPercent)}
Duración: ${result.hours} horas
Margen de mantenimiento supuesto: ${result.mode === 'spot' ? 'No aplica' : percent(result.maintenancePercent)}

## Consecuencias del modelo

Movimiento después del spread: ${usd(result.grossPnl)}
Comisiones totales: ${usd(result.entryFee + result.exitFee)}
Funding (costo positivo, crédito negativo): ${usd(result.fundingCost)}
Resultado algebraico: ${usd(result.netPnl)} (${percent(result.returnPercent)} del capital)
Saldo algebraico: ${usd(result.theoreticalEquity)}
Umbral didáctico de liquidación: ${result.mode === 'spot' ? 'No aplica' : threshold}
${result.crossesTheoreticalThreshold ? 'La salida cruza el umbral teórico; el resultado no sería ejecutable como se muestra.\n' : ''}
## Reflexión

${reflection || 'Pendiente de documentar.'}

Precios y tasas manuales. No se consultó un exchange, no se abrió una operación y el umbral no es un precio real de liquidación. El modelo omite trayectoria, deslizamiento variable, liquidación parcial, impuestos y reglas particulares de cada plataforma.
`;
}

function download(text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'bitforward-escenario-btc.md';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

form.addEventListener('input', () => render());
modeInputs.forEach(input => input.addEventListener('change', () => render()));
form.addEventListener('submit', event => {
  event.preventDefault();
  if (render({ reportErrors: true }))
    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.querySelector('#download-scenario').addEventListener('click', () => {
  const result = render({ reportErrors: true });
  if (!result) return;
  download(markdown(result, document.querySelector('#reflection').value.trim()));
  saveStatus.textContent = 'Ficha descargada. Revísala y conserva una copia.';
});

document.querySelector('#save-scenario').addEventListener('click', () => {
  const result = render({ reportErrors: true });
  if (!result) return;
  const reflectionField = document.querySelector('#reflection');
  const reflection = reflectionField.value.trim();
  if (!reflection) {
    saveStatus.textContent = 'Escribe primero qué riesgo o supuesto revisarías.';
    reflectionField.focus();
    return;
  }
  const entries = readLearning().entries;
  if (entries.length >= 100) {
    saveStatus.textContent =
      'Mi bitácora llegó a 100 notas. Descarga una copia y borra una antes de guardar.';
    return;
  }
  const entry = {
    id:
      globalThis.crypto?.randomUUID?.() ||
      `sim-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    asset: 'BTC',
    text: markdown(result, reflection).slice(0, 2000),
    source: 'Escenario manual del simulador; sin datos en vivo',
    date: new Date().toISOString(),
  };
  if (saveLearning({ entries: [entry, ...entries] })) {
    saveStatus.textContent = 'Escenario y reflexión guardados en Mi bitácora de este navegador.';
  } else {
    saveStatus.textContent =
      'No se pudo guardar en este navegador. Descarga la ficha para conservarla.';
  }
});

fallback.hidden = true;
app.hidden = false;
render({ reportErrors: true });
