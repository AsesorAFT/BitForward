/* eslint-disable no-unused-vars -- JSX component references are compiled by Vite. */
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../editorial/main.js';
import { missions } from './data.mjs';
import { content } from './content.mjs';
import { readLearning, saveLearning } from './storage.mjs';
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
const focusOptions = [
  ['base', 'Desde los fundamentos', '001'],
  ['BTC', 'Bitcoin', '004'],
  ['ETH', 'Ethereum y comisiones', '002'],
  ['USDT', 'Tether y stablecoins', '005'],
  ['ADA', 'Cardano', '006'],
  ['riesgo', 'Seguridad y riesgo', '003'],
  ['tesis', 'Construir mi análisis', '008'],
];
function Tutor() {
  const [completed, setCompleted] = useState(() => readLearning().completed);
  const [focus, setFocus] = useState('base');
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(
    () => missions.find(m => !readLearning().completed.includes(m.id))?.id || '001'
  );
  const [phase, setPhase] = useState(0);
  const [choice, setChoice] = useState('');
  const [feedback, setFeedback] = useState('');
  const [passed, setPassed] = useState(false);
  const m = missions.find(m => m.id === current);
  const lessons = basics[current] || content[current].sections.slice(0, 3);
  const idx = missions.indexOf(m);
  const next = missions[idx + 1];
  function open(id) {
    setCurrent(id);
    setPhase(0);
    setChoice('');
    setFeedback('');
    setPassed(false);
    setStarted(true);
  }
  function check(e) {
    e.preventDefault();
    if (choice === '') {
      setFeedback('Elige una respuesta para continuar.');
      return;
    }
    if (Number(choice) !== m.correct) {
      setFeedback(
        'Vamos a revisarlo: ' + m.explanation + ' Puedes volver a leer la explicación y repetir.'
      );
      setPassed(false);
      return;
    }
    setPassed(true);
    const newCompleted = [...new Set([...readLearning().completed, m.id])];
    const ok = saveLearning({ completed: newCompleted });
    setCompleted(newCompleted);
    setFeedback(
      'Correcto. ' +
        m.explanation +
        (ok
          ? ' Avance guardado en este navegador.'
          : ' No fue posible guardar en este navegador; el avance se conserva mientras estés aquí.')
    );
  }
  const tool = `./laboratorio.html?herramienta=${m.tool}${m.asset ? '&activo=' + m.asset : ''}`;
  return (
    <div className="tutor-layout">
      <aside className="atf-presence">
        <div className="atf-portrait">
          <img
            src={portrait}
            width="800"
            height="1200"
            alt="ATF, el asesor del futuro de AFORTU, con traje ejecutivo y casco espacial."
          />
        </div>
        <div className="atf-profile">
          <p className="eyebrow">TU GUÍA DE APRENDIZAJE</p>
          <h2>
            ATF<span>By AFORTU</span>
          </h2>
          <p>Primero entender. Después practicar. Siempre preguntar.</p>
          <div className="tutor-progress">
            <strong>{completed.length} / 9</strong>
            <span>comprobaciones completadas</span>
            <progress value={completed.length} max="9" aria-label="Comprobaciones completadas" />
          </div>
          <a className="text-link" href="./acceso.html">
            Capacitación con cuenta AFORTU OS ↗
          </a>
        </div>
      </aside>
      <section className="tutor-session" aria-label="Capacitación con ATF">
        {!started ? (
          <>
            <p className="eyebrow">TU PUNTO DE PARTIDA</p>
            <h2>¿Qué quieres entender hoy?</h2>
            <p>
              Elige un tema para comenzar. No necesitas comprar activos ni tener experiencia previa.
            </p>
            <label className="sr-only" htmlFor="tutor-focus">
              Tema de interés
            </label>
            <select id="tutor-focus" value={focus} onChange={e => setFocus(e.target.value)}>
              {focusOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <div className="action-row">
              <button
                className="button button-primary"
                onClick={() => open(focusOptions.find(f => f[0] === focus)[2])}
              >
                Comenzar mi sesión →
              </button>
              {completed.length > 0 && completed.length < 9 && (
                <button
                  className="button button-outline"
                  onClick={() => open(missions.find(m => !completed.includes(m.id)).id)}
                >
                  Retomar mi ruta
                </button>
              )}
            </div>
            <div className="tutor-method">
              <div>
                <span>01</span>
                <strong>Entiende</strong>
                <p>Una idea clara y sus fuentes.</p>
              </div>
              <div>
                <span>02</span>
                <strong>Practica</strong>
                <p>Un resultado en el laboratorio.</p>
              </div>
              <div>
                <span>03</span>
                <strong>Comprueba</strong>
                <p>Retroalimentación antes de seguir.</p>
              </div>
            </div>
            <p className="tool-footnote">
              Esta primera versión ofrece una guía con lecciones y respuestas preparadas. No es un
              chat de IA ni una sesión con un asesor humano.
            </p>
          </>
        ) : (
          <>
            <div className="session-top">
              <span className="eyebrow">
                MISIÓN {m.id} / {m.topic.toUpperCase()}
              </span>
              <button className="text-button" onClick={() => setStarted(false)}>
                Cambiar tema
              </button>
            </div>
            <h2>{m.title}</h2>
            <p className="session-outcome">Hoy vas a: {m.outcome.toLowerCase()}</p>
            <ol className="session-steps" aria-label="Pasos de la sesión">
              {['Entender', 'Practicar', 'Comprobar'].map((label, i) => (
                <li key={label} aria-current={phase === i ? 'step' : undefined}>
                  <button
                    onClick={() => {
                      if (i < 2 || phase === 2) setPhase(i);
                    }}
                    disabled={i === 2 && phase < 2}
                  >
                    <span>{i + 1}</span>
                    {label}
                  </button>
                </li>
              ))}
            </ol>
            {phase === 0 ? (
              <div className="lesson-step">
                {lessons.map(([title, text]) => (
                  <div key={title}>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                ))}
                <a className="text-link" href={`./misiones/${m.slug}.html`}>
                  Leer la misión completa y sus fuentes ↗
                </a>
                <button className="button button-primary" onClick={() => setPhase(1)}>
                  Entendido, vamos a practicar →
                </button>
              </div>
            ) : phase === 1 ? (
              <div className="practice-step">
                <p className="eyebrow">EL RESULTADO DE TU SESIÓN</p>
                <h3>{m.deliverable}</h3>
                <p>
                  Abre el laboratorio, aplica esta idea y conserva tu resultado. Al terminar, vuelve
                  aquí para comprobar lo aprendido.
                </p>
                <a
                  className="button button-primary"
                  href={tool}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir herramienta ↗<span className="sr-only"> (nueva pestaña)</span>
                </a>
                <p className="tool-footnote">
                  Se abre en otra pestaña para conservar tu sesión con ATF.
                </p>
                <button className="button button-outline" onClick={() => setPhase(2)}>
                  Ya practiqué, comprobar lo aprendido →
                </button>
              </div>
            ) : (
              <form className="tutor-check" onSubmit={check}>
                <fieldset>
                  <legend>{m.question}</legend>
                  {m.options.map((option, i) => (
                    <label className="quiz-option" key={option}>
                      <input
                        type="radio"
                        required
                        name="tutor-answer"
                        value={i}
                        checked={choice === String(i)}
                        onChange={e => {
                          setChoice(e.target.value);
                          setPassed(false);
                          setFeedback('');
                        }}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </fieldset>
                <button className="button button-primary" type="submit">
                  Comprobar y guardar avance
                </button>
                <p className="quiz-feedback" role="status">
                  {feedback}
                </p>
                {passed && (
                  <div className="next-topic">
                    <h3>Una idea más clara. Un paso más.</h3>
                    {next ? (
                      <button
                        className="button button-outline"
                        type="button"
                        onClick={() => open(next.id)}
                      >
                        Siguiente tema: {next.title} →
                      </button>
                    ) : (
                      <a
                        className="button button-outline"
                        href="./laboratorio.html?herramienta=bitacora"
                      >
                        Registrar mi conclusión →
                      </a>
                    )}
                  </div>
                )}
                <p className="tool-footnote">
                  Comprobar una respuesta correcta guarda tu avance local. La práctica se completa
                  por tu cuenta y no se certifica automáticamente.
                </p>
              </form>
            )}
          </>
        )}
      </section>
    </div>
  );
}
createRoot(document.getElementById('tutor-root')).render(<Tutor />);
