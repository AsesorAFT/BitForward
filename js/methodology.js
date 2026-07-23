import './components/bf-header.js';
import './pwa.js';

const form = document.getElementById('readiness-form');
const result = document.getElementById('diagnostic-result');
const label = document.getElementById('diagnostic-label');
const detail = document.getElementById('diagnostic-detail');
const meter = document.getElementById('diagnostic-meter-fill');

function renderDiagnostic() {
  const controls = [...form.querySelectorAll('input[name="control"]')];
  const score = controls.filter(control => control.checked).length;
  result.classList.remove('ready', 'caution', 'blocked');
  meter.style.width = `${score * 20}%`;

  if (score === 0) {
    label.textContent = 'Sin evaluar';
    detail.textContent = 'Responde los cinco controles para obtener una lectura.';
    return;
  }

  if (score <= 2) {
    result.classList.add('blocked');
    label.textContent = `${score}/5 · Estructura insuficiente`;
    detail.textContent =
      'La prioridad no es aumentar exposición: es resolver liquidez, horizonte y control operativo.';
    return;
  }

  if (score === 3) {
    result.classList.add('caution');
    label.textContent = '3/5 · Preparación parcial';
    detail.textContent =
      'Existen bases, pero una caída fuerte todavía puede obligar a romper la estrategia.';
    return;
  }

  result.classList.add('ready');
  label.textContent = `${score}/5 · Base más sólida`;
  detail.textContent =
    'La estructura es más resistente, pero aún se requiere perfilamiento individual y revisión profesional.';
}

form.addEventListener('change', renderDiagnostic);
form.addEventListener('reset', () => window.setTimeout(renderDiagnostic, 0));
renderDiagnostic();
