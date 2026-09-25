/* eslint-disable no-unused-vars -- JSX component references are compiled by Vite. */
import { createRoot } from 'react-dom/client';
import '../editorial/main.js';
import { missions } from './data.mjs';
import { content } from './content.mjs';
import { readLearning, saveLearning, STORAGE_KEY } from './storage.mjs';
import { applyAdaptiveAnswer } from './adaptive-engine.mjs';
import AdaptiveCampus from './AdaptiveCampus.jsx';
import portrait from '../../assets/brand/advisor-atf-approved.webp';
const basics = {
  '001': [
    [
      'Red, activo y precio',
      'Una blockchain registra información compartida según sus reglas. Un criptoactivo puede tener una función en esa red. Su precio de mercado es otra dimensión: una tecnología útil no garantiza que el activo suba.',
    ],
    [
      'La pregunta correcta',
      'Antes de mirar un precio objetivo, pregunta qué función tiene el activo, quién controla tus claves y qué evidencia respalda lo que estás leyendo.',
    ],
  ],
  '002': [
    [
      'Qué estás pagando',
      'El gas mide trabajo computacional. La comisión en ETH es el gas consumido multiplicado por su precio efectivo en gwei, dividido entre 1,000,000,000. El precio de ETH en dólares es un dato distinto.',
    ],
    [
      'Un ejemplo que puedes verificar',
      '21,000 unidades × 10 gwei = 0.00021 ETH. Una ejecución fallida también puede consumir gas. Usa el laboratorio para cambiar los supuestos; el ejemplo no es una tarifa actual.',
    ],
  ],
  '003': [
    [
      'Tus claves, tu control',
      'Una frase de recuperación permite restaurar el acceso a una wallet. No la compartas con soporte, en una web ni en este laboratorio. Una dirección pública no tiene el mismo propósito.',
    ],
    [
      'Antes de firmar',
      'Verifica dominio, red y permisos por una vía independiente. Una interfaz conocida o un mensaje urgente no garantizan que una solicitud sea legítima. Detente si no entiendes lo que estás autorizando.',
    ],
  ],
};

const initial = readLearning();
let memory = initial.adaptive;
const lessons = missions.map(m => ({
  ...m,
  sections: basics[m.id] || content[m.id].sections.slice(0, 3),
}));
async function answer(action) {
  const stored = readLearning().adaptive;
  const current = stored.revision > memory.revision ? stored : memory;
  const result = applyAdaptiveAnswer(current, action);
  memory = result.state;
  const saved = saveLearning({ adaptive: result.state });
  return {
    ...result,
    notice: saved
      ? 'Avance guardado en este navegador.'
      : 'El navegador no permite guardar. El avance se conserva durante esta sesión; descárgalo antes de salir.',
  };
}
createRoot(document.getElementById('tutor-root')).render(
  <AdaptiveCampus
    initialState={initial.adaptive}
    onAnswer={answer}
    lessons={lessons}
    portrait={portrait}
    legacyCompleted={initial.completed.length}
  />
);

window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY && event.newValue === null) window.location.reload();
});
