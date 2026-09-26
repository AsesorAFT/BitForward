import { missions } from './data.mjs';
import { readLearning, saveLearning } from './storage.mjs';

function updateProgress() {
  const { completed } = readLearning();
  document.querySelectorAll('[data-mission-status]').forEach(el => {
    const done = completed.includes(el.dataset.missionStatus);
    el.textContent = done ? '✓ Comprobación completada' : 'Por explorar';
    el.classList.toggle('completed', done);
  });
  const progress = document.querySelector('#learning-progress');
  if (progress) progress.value = completed.length;
  const label = document.querySelector('#progress-label');
  if (label)
    label.textContent = `${completed.length} de ${missions.length} comprobaciones completadas`;
}
updateProgress();
window.addEventListener('storage', updateProgress);
const checkpoint = document.querySelector('[data-checkpoint]');
if (checkpoint) {
  checkpoint.hidden = false;
  const mission = missions.find(m => m.id === checkpoint.dataset.checkpoint);
  const form = checkpoint.querySelector('form');
  const feedback = checkpoint.querySelector('[role="status"]');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const choice = form.querySelector('input:checked');
    if (!choice) {
      feedback.textContent = 'Elige una respuesta para comprobar lo aprendido.';
      return;
    }
    if (Number(choice.value) !== mission.correct) {
      feedback.textContent = 'Todavía no. ' + mission.explanation + ' Puedes volver a intentarlo.';
      return;
    }
    const saved = saveLearning({ completed: [...readLearning().completed, mission.id] });
    feedback.textContent =
      'Correcto. ' +
      mission.explanation +
      (saved
        ? ' Tu progreso se guardó en este navegador.'
        : ' No se pudo guardar el progreso en este navegador.');
    updateProgress();
  });
}
