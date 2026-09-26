import '../editorial/main.js';
import './daily.css';
import { ADAPTIVE_VERSION, applyAdaptiveAnswer } from '../ecosystem/adaptive-engine.mjs';
import { readLearning, saveLearning, STORAGE_KEY } from '../ecosystem/storage.mjs';
import { makeBackup } from '../ecosystem/backup.mjs';
import { dailySession } from './model.mjs';

const root = document.querySelector('#daily-app');
const conceptNode = document.querySelector('#daily-concept');
const reasonNode = document.querySelector('#daily-reason');
const lessonLink = document.querySelector('#daily-lesson');
let memory = readLearning().adaptive;

function updateGuide(session) {
  if (!session.concept || !session.mission) return;
  conceptNode.textContent = `${session.concept.label}. ${session.mission.outcome}`;
  reasonNode.textContent =
    session.kind === 'ready'
      ? session.reason
      : 'Vuelve mañana para otra decisión. Si quieres avanzar hoy, el campus ATF conserva la ruta completa.';
  lessonLink.href = `./misiones/${session.mission.slug}.html`;
  lessonLink.textContent = `Leer misión ${session.mission.id}: ${session.mission.title}`;
}

function focusTitle() {
  root.querySelector('h2')?.focus();
}

function downloadProgress() {
  const payload = makeBackup({ ...readLearning(), adaptive: memory });
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'bitforward-respaldo.json';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderReady(session) {
  updateGuide(session);
  root.innerHTML = `
    <div class="daily-step"><span>01 / DECIDIR</span><span>≈ 5 MIN</span></div>
    <p class="daily-label"></p>
    <h2 tabindex="-1">La decisión de hoy.</h2>
    <p class="daily-prompt-intro"></p>
    <form class="daily-form">
      <fieldset><legend></legend><div class="daily-options"></div></fieldset>
      <div class="daily-hint" hidden><p></p></div>
      <div class="daily-actions">
        <button class="button button-primary" type="submit">Comprobar mi respuesta</button>
        <button class="daily-unknown" type="button">Aún no lo sé</button>
      </div>
      <p class="daily-error" role="alert" hidden></p>
    </form>
    <p class="daily-question-note"></p>
  `;
  root.querySelector('.daily-label').textContent = session.label;
  root.querySelector('.daily-prompt-intro').textContent =
    session.question.stage === 'diagnostic'
      ? 'Tu primera respuesta identifica un punto de partida. Todavía no demuestra dominio.'
      : session.question.level === 1
        ? 'Refuerza una base antes de aplicarla a casos más complejos.'
        : 'Aplica lo que aprendiste en una situación concreta.';
  root.querySelector('legend').textContent = session.question.prompt;
  const options = root.querySelector('.daily-options');
  session.question.options.forEach((option, index) => {
    const label = document.createElement('label');
    label.className = 'daily-option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'daily-answer';
    input.value = String(index);
    const text = document.createElement('span');
    text.textContent = option;
    label.append(input, text);
    options.append(label);
  });
  let hinted = false;
  if (session.question.stage === 'practice') {
    const hint = root.querySelector('.daily-hint');
    hint.hidden = false;
    const button = document.createElement('button');
    button.className = 'daily-hint-button';
    button.type = 'button';
    button.textContent = 'Ver una pista';
    hint.prepend(button);
    button.addEventListener('click', () => {
      hinted = true;
      button.hidden = true;
      const copy = hint.querySelector('p');
      copy.textContent = `${session.question.hint} Este intento contará como práctica guiada.`;
    });
  }
  root.querySelector('.daily-question-note').textContent =
    session.question.stage === 'diagnostic'
      ? 'El diagnóstico no otorga evidencia. Puedes seguir aprendiendo en el campus ATF.'
      : session.question.rehearsal
        ? 'Ya viste este caso en las últimas 24 horas. Puedes repasarlo, aunque hoy no añadirá evidencia nueva.'
        : 'Una respuesta correcta sin pista puede aportar evidencia independiente a tu ruta.';

  let busy = false;
  const submitAnswer = answer => {
    if (busy) return;
    if (answer === null) {
      const error = root.querySelector('.daily-error');
      error.hidden = false;
      error.textContent = 'Selecciona una opción o indica que aún no lo sabes.';
      return;
    }
    busy = true;
    root.querySelectorAll('button, input').forEach(element => {
      element.disabled = true;
    });
    try {
      const stored = readLearning().adaptive;
      const current = stored.revision > memory.revision ? stored : memory;
      const result = applyAdaptiveAnswer(current, {
        version: ADAPTIVE_VERSION,
        revision: memory.revision,
        questionId: session.question.id,
        answer,
        hinted,
      });
      memory = result.state;
      const saved = saveLearning({ adaptive: memory });
      renderResult(session, result, saved);
    } catch (error) {
      busy = false;
      root.querySelectorAll('button, input').forEach(element => {
        element.disabled = false;
      });
      const notice = root.querySelector('.daily-error');
      notice.hidden = false;
      notice.textContent =
        error.message || 'No pudimos registrar tu respuesta. Inténtalo de nuevo.';
    }
  };
  root.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const selected = root.querySelector('input[name="daily-answer"]:checked');
    submitAnswer(selected ? Number(selected.value) : null);
  });
  root.querySelector('.daily-unknown').addEventListener('click', () => submitAnswer(-1));
}

function renderResult(session, result, saved) {
  updateGuide({ ...session, kind: 'completed' });
  root.innerHTML = `
    <div class="daily-step"><span>02 / COMPRENDER</span><span>LISTO POR HOY</span></div>
    <p class="daily-label">Tu decisión quedó registrada</p>
    <h2 tabindex="-1"></h2>
    <p class="daily-explanation"></p>
    <p class="daily-evidence"></p>
    <p class="daily-save" role="status"></p>
    <div class="daily-next">
      <a class="button button-primary" href="./atf.html">Continuar en el campus ATF</a>
      <button class="button button-outline" type="button">Descargar mi avance</button>
    </div>
    <p class="daily-tomorrow">Tu práctica diaria estará disponible de nuevo mañana, según la fecha local de este dispositivo.</p>
  `;
  root.querySelector('h2').textContent = result.correct
    ? 'Bien razonado.'
    : result.state.attempts.at(-1).answer === -1
      ? 'Aprender empieza por preguntar.'
      : 'Revisemos la idea.';
  root.querySelector('.daily-explanation').textContent = result.explanation;
  root.querySelector('.daily-evidence').textContent =
    session.question.stage === 'diagnostic'
      ? 'Este punto de partida orienta la ruta; todavía no acredita dominio.'
      : result.credited
        ? 'Tu respuesta aportó evidencia independiente a este concepto.'
        : result.correct
          ? 'Esto fue práctica guiada o un caso visto recientemente; no sumó evidencia nueva.'
          : 'ATF tendrá en cuenta esta respuesta para proponerte refuerzo.';
  root.querySelector('.daily-save').textContent = saved
    ? 'Guardado en este navegador. No se sincroniza con una cuenta.'
    : 'Este navegador no permitió guardar. Descarga tu avance antes de salir.';
  root.querySelector('.daily-next button').addEventListener('click', downloadProgress);
  focusTitle();
}

function renderCompleted(session) {
  updateGuide(session);
  const correct = session.attempt.answer === session.question.correct;
  root.innerHTML = `
    <div class="daily-step"><span>HOY / COMPLETADO</span><span>VUELVE MAÑANA</span></div>
    <p class="daily-label">Ya hiciste tu práctica de hoy</p>
    <h2 tabindex="-1">Una idea que puedes conservar.</h2>
    <p class="daily-completed-question"></p>
    <p class="daily-explanation"></p>
    <p class="daily-evidence"></p>
    <div class="daily-next"><a class="button button-primary" href="./atf.html">Seguir en el campus ATF</a><a class="button button-outline" href="./laboratorio.html">Abrir laboratorio</a></div>
  `;
  root.querySelector('.daily-completed-question').textContent = session.question.prompt;
  root.querySelector('.daily-explanation').textContent = session.question.explanation;
  root.querySelector('.daily-evidence').textContent =
    session.question.stage === 'diagnostic'
      ? 'Punto de partida registrado; no equivale a dominio.'
      : correct
        ? 'Tu respuesta fue correcta. Revisa tu mapa en el campus para ver la evidencia acumulada.'
        : 'Puedes repasar este concepto en el campus cuando lo necesites.';
}

const session = dailySession(memory);
if (session.kind === 'ready') renderReady(session);
else if (session.kind === 'completed') renderCompleted(session);
else {
  root.innerHTML =
    '<h2>No hay una actividad disponible ahora.</h2><p>Abre el campus ATF para seguir aprendiendo.</p><a class="button button-primary" href="./atf.html">Ir al campus ATF</a>';
}

window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY) window.location.reload();
});
