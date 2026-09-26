/* eslint-disable no-unused-vars -- JSX references are compiled by the host. */
import { useEffect, useRef, useState } from 'react';
import {
  ADAPTIVE_VERSION,
  concepts,
  diagnosticQuestion,
  conceptProgress,
  nextExercise,
  recommendation,
  normalizeAdaptive,
} from './adaptive-engine.mjs';
import './adaptive.css';

/** Shared learning UI. Persistence is injected: browser storage or authenticated AFORTU API. */
export default function AdaptiveCampus({
  initialState,
  onAnswer,
  lessons,
  portrait,
  baseUrl = './',
  account = false,
  legacyCompleted = 0,
}) {
  const [state, setState] = useState(() => normalizeAdaptive(initialState));
  const [active, setActive] = useState(null);
  const [answer, setAnswer] = useState('');
  const [hinted, setHinted] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const [view, setView] = useState('campus');
  const title = useRef(null);
  const busy = useRef(false);
  const map = conceptProgress(state);
  const recommended = recommendation(state);
  const diagnostic = diagnosticQuestion(state);
  const diagnosticCount = state.attempts.filter(a => a.questionId.endsWith('-d')).length;
  const demonstrated = map.filter(c => c.demonstrated).length;
  const mission =
    active && lessons.find(m => m.id === concepts.find(c => c.id === active.conceptId).missionId);
  useEffect(() => {
    title.current?.focus();
  }, [view, active?.id]);
  useEffect(() => {
    if (account) return;
    const reset = () => window.location.reload();
    window.addEventListener('learning-reset', reset);
    return () => window.removeEventListener('learning-reset', reset);
  }, [account]);
  function openQuestion(q) {
    if (!q) return;
    setActive(q);
    setView(q.stage === 'diagnostic' ? 'diagnostic' : 'classroom');
    setAnswer('');
    setHinted(false);
    setFeedback(null);
    setError('');
  }
  function study(id) {
    openQuestion(diagnostic || nextExercise(state, id));
  }
  async function submit(event, unknown = false) {
    event?.preventDefault();
    if (busy.current || feedback) return;
    if (!unknown && answer === '') {
      setError('Selecciona una opción o indica que aún no lo sabes.');
      return;
    }
    busy.current = true;
    setPending(true);
    setError('');
    try {
      const result = await onAnswer(
        {
          version: ADAPTIVE_VERSION,
          revision: state.revision,
          questionId: active.id,
          answer: unknown ? -1 : Number(answer),
          hinted,
        },
        state
      );
      setState(result.state);
      setFeedback(result);
      setNotice(result.notice || '');
    } catch (e) {
      setError(
        e.message || 'No se pudo guardar. Tu respuesta sigue aquí para volver a intentarlo.'
      );
    } finally {
      setPending(false);
      busy.current = false;
    }
  }
  function exportProgress() {
    const blob = new Blob(
      [JSON.stringify({ ...state, concepts: map, exportedAt: new Date().toISOString() }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'atf-mi-aprendizaje.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="atf-campus">
      <nav className="atf-spaces" aria-label="Espacios del campus">
        <button
          aria-current={view === 'campus' ? 'page' : undefined}
          onClick={() => setView('campus')}
          disabled={pending}
        >
          <span>01</span> Mi campus
        </button>
        <button
          aria-current={view === 'diagnostic' || view === 'classroom' ? 'page' : undefined}
          onClick={() =>
            active
              ? setView(active.stage === 'diagnostic' ? 'diagnostic' : 'classroom')
              : study(recommended.concept?.id || concepts[0].id)
          }
          disabled={pending}
        >
          <span>02</span> Aula ATF
        </button>
        <button
          aria-current={view === 'lab' ? 'page' : undefined}
          onClick={() => setView('lab')}
          disabled={pending}
        >
          <span>03</span> Laboratorio
        </button>
      </nav>
      <div className="atf-grid">
        <aside className="atf-guide">
          <div className="atf-guide-image">
            <img
              src={portrait}
              width="800"
              height="1200"
              alt="ATF, guía de AFORTU con traje ejecutivo y casco espacial."
            />
          </div>
          <div className="atf-guide-copy">
            <p className="atf-kicker">ADVISOR OF THE FUTURE</p>
            <h2>
              ATF <small>By AFORTU</small>
            </h2>
            <p>Una ruta que cambia con lo que demuestras.</p>
            <div className="atf-counter">
              <strong>
                {demonstrated}
                <span> / 9</span>
              </strong>
              <span>conceptos comprobados</span>
              <progress value={demonstrated} max="9" aria-label="Conceptos comprobados" />
            </div>
            <p className="atf-storage">
              {account
                ? 'Avance vinculado a tu cuenta AFORTU OS.'
                : 'Avance local en este navegador.'}
            </p>
            {!account && <a href={baseUrl + 'acceso.html'}>Acceso con AFORTU OS</a>}
          </div>
        </aside>
        <section className="atf-workspace" aria-label="Aprendizaje adaptativo con ATF">
          {view === 'campus' && (
            <>
              <p className="atf-kicker">CAMPUS BITFORWARD / TU RECORRIDO</p>
              <h2 tabIndex="-1" ref={title}>
                Tu siguiente paso, con contexto.
              </h2>
              <p>
                Explora los conceptos, aplica lo aprendido y regresa a comprobarlo. ATF organiza tu
                ruta con tus respuestas.
              </p>
              <div className="atf-next">
                <span className="atf-kicker">
                  {diagnostic ? 'PUNTO DE PARTIDA' : 'RECOMENDACIÓN DE ATF'}
                </span>
                <h3>
                  {diagnostic
                    ? diagnosticCount
                      ? 'Continúa tu diagnóstico'
                      : 'Conozcamos tus bases'
                    : recommended.concept?.label || 'Lleva tus conceptos a la práctica'}
                </h3>
                <p>
                  {diagnostic
                    ? 'Nueve preguntas breves, una por concepto. Si aún no lo sabes, indícalo: nos ayuda a elegir la explicación adecuada.'
                    : recommended.reason}
                </p>
                {diagnostic && (
                  <p className="atf-small">
                    {diagnosticCount} de 9 respuestas guardadas · Aproximadamente 5 minutos
                  </p>
                )}
                <button
                  className="atf-primary"
                  onClick={() =>
                    diagnostic
                      ? openQuestion(diagnostic)
                      : recommended.concept
                        ? study(recommended.concept.id)
                        : setView('lab')
                  }
                >
                  {diagnostic
                    ? diagnosticCount
                      ? 'Retomar diagnóstico'
                      : 'Comenzar diagnóstico'
                    : recommended.concept
                      ? recommended.concept.due
                        ? 'Hacer mi repaso'
                        : 'Entrar al aula'
                      : 'Abrir laboratorio'}{' '}
                </button>
              </div>
              <div className="atf-section-heading">
                <h3>Tu mapa de conceptos</h3>
                <span>9 conceptos · 9 misiones</span>
              </div>
              <div className="atf-concept-map">
                {map.map((c, i) => (
                  <button
                    className={'atf-concept ' + (c.demonstrated ? 'is-demonstrated' : '')}
                    key={c.id}
                    onClick={() => study(c.id)}
                    aria-label={
                      c.label +
                      ': ' +
                      c.status +
                      (diagnostic ? '. Completa primero el diagnóstico.' : '. Abrir ejercicios.')
                    }
                  >
                    <span className="atf-concept-number">
                      {String(i + 1).padStart(2, '0')} <span>{c.room}</span>
                    </span>
                    <strong>{c.label}</strong>
                    <span className="atf-status">{c.due ? 'Repaso disponible' : c.status}</span>
                    <span className="atf-small">
                      {c.demonstrated
                        ? 'Repaso: ' + new Date(c.reviewAt).toLocaleDateString('es-MX')
                        : c.evidence
                          ? c.evidence + ' de 2 evidencias independientes'
                          : c.diagnostic}
                    </span>
                  </button>
                ))}
              </div>
              <details className="atf-method">
                <summary>¿Cómo decide ATF qué sigue?</summary>
                <p>
                  El diagnóstico identifica tu punto de partida; no acredita dominio. Para marcar un
                  concepto como comprobado necesitas dos ejercicios distintos correctos, sin pista,
                  incluyendo una aplicación. Un error posterior vuelve a abrir el concepto.
                </p>
                <p>
                  Repetir un ejercicio visto en las últimas 24 horas sirve para practicar, pero no
                  añade evidencia. Los repasos se proponen a los siete días de la última evidencia.
                  La ruta prioriza bases pendientes; después puedes elegir cualquier tema.
                </p>
                <p>
                  Es una evaluación inicial con un banco de 27 ejercicios y reglas transparentes. No
                  es una certificación profesional, un chat de IA ni una tutoría humana en vivo.
                </p>
              </details>
              <div className="atf-footer-actions">
                <button className="atf-secondary" onClick={exportProgress}>
                  Descargar mi avance
                </button>
                <span className="atf-small">
                  {legacyCompleted > 0
                    ? `${legacyCompleted} comprobaciones anteriores conservadas. El mapa usa evidencia nueva.`
                    : 'Tu bitácora y tus fichas se conservan en el laboratorio.'}
                </span>
              </div>
            </>
          )}
          {(view === 'diagnostic' || view === 'classroom') && active && (
            <>
              <div className="atf-section-heading">
                <p className="atf-kicker">
                  {active.stage === 'diagnostic'
                    ? `DIAGNÓSTICO / ${Math.min(diagnosticCount + (feedback ? 0 : 1), 9)} DE 9`
                    : `AULA / MISIÓN ${mission.id}`}
                </p>
                <button
                  className="atf-text-button"
                  onClick={() => setView('campus')}
                  disabled={pending}
                >
                  Volver al campus
                </button>
              </div>
              <h2 tabIndex="-1" ref={title}>
                {concepts.find(c => c.id === active.conceptId).label}
              </h2>
              {active.stage === 'diagnostic' ? (
                <p>
                  Responde con lo que sabes hoy. Cada respuesta se guarda para que puedas continuar
                  después.
                </p>
              ) : (
                <>
                  <p>
                    {active.level === 1
                      ? 'Refuerza la base antes de aplicar el concepto.'
                      : 'Aplica el concepto a una situación concreta.'}
                  </p>
                  <details className="atf-lesson">
                    <summary>Leer la explicación · {mission.title}</summary>
                    {mission.sections.map(([heading, text]) => (
                      <div key={heading}>
                        <h3>{heading}</h3>
                        <p>{text}</p>
                      </div>
                    ))}
                    <a
                      href={baseUrl + `misiones/${mission.slug}.html`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Misión completa y fuentes <span className="atf-sr">(nueva pestaña)</span>
                    </a>
                  </details>
                  {active.rehearsal && (
                    <p className="atf-note">
                      Ya viste este ejercicio recientemente. Puedes practicarlo; contará como nueva
                      evidencia cuando hayan pasado 24 horas desde el último intento.
                    </p>
                  )}
                </>
              )}
              <form className="atf-exercise" onSubmit={submit}>
                <fieldset disabled={pending || !!feedback}>
                  <legend>{active.prompt}</legend>
                  {active.options.map((option, i) => (
                    <label className={answer === String(i) ? 'is-selected' : ''} key={option}>
                      <input
                        type="radio"
                        name="atf-answer"
                        value={i}
                        checked={answer === String(i)}
                        onChange={e => setAnswer(e.target.value)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </fieldset>
                {!feedback && (
                  <>
                    {active.stage === 'practice' && (
                      <div className="atf-hint">
                        {hinted ? (
                          <p role="status">
                            Pista: {active.hint} Este intento será práctica guiada.
                          </p>
                        ) : (
                          <button
                            type="button"
                            className="atf-text-button"
                            onClick={() => setHinted(true)}
                            disabled={pending}
                          >
                            Necesito una pista
                          </button>
                        )}
                      </div>
                    )}
                    <div className="atf-actions">
                      <button type="submit" className="atf-primary" disabled={pending}>
                        {pending
                          ? 'Guardando…'
                          : active.stage === 'diagnostic'
                            ? 'Registrar respuesta'
                            : 'Comprobar respuesta'}
                      </button>
                      <button
                        type="button"
                        className="atf-secondary"
                        onClick={() => submit(null, true)}
                        disabled={pending}
                      >
                        Aún no lo sé
                      </button>
                    </div>
                  </>
                )}
              </form>
              {error && (
                <div className="atf-error" role="alert">
                  <p>{error}</p>
                  <button className="atf-text-button" onClick={() => window.location.reload()}>
                    Actualizar mi avance
                  </button>
                </div>
              )}
              {feedback && (
                <div className="atf-feedback" role="status">
                  <h3>{feedback.correct ? 'Respuesta correcta.' : 'Revisemos la idea.'}</h3>
                  <p>{feedback.explanation}</p>
                  <p className="atf-small">
                    {active.stage === 'diagnostic'
                      ? 'Registrado como punto de partida; todavía no acredita dominio.'
                      : feedback.credited
                        ? 'Esta respuesta aporta evidencia independiente.'
                        : 'Este intento ayuda a practicar; no añade evidencia de dominio.'}
                  </p>
                  <div className="atf-actions">
                    {active.stage === 'diagnostic' ? (
                      <button
                        className="atf-primary"
                        onClick={() => (diagnostic ? openQuestion(diagnostic) : setView('campus'))}
                      >
                        {diagnostic ? 'Siguiente concepto' : 'Ver mi ruta personalizada'}
                      </button>
                    ) : (
                      <>
                        <button className="atf-primary" onClick={() => setView('campus')}>
                          Ver mi siguiente paso
                        </button>
                        <button
                          className="atf-secondary"
                          onClick={() => openQuestion(nextExercise(state, active.conceptId))}
                        >
                          Otro ejercicio de este concepto
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          {view === 'lab' && (
            <>
              <p className="atf-kicker">LABORATORIO / TRABAJO APLICADO</p>
              <h2 tabIndex="-1" ref={title}>
                Convierte una idea en un resultado.
              </h2>
              <p>
                Cada misión tiene una herramienta y un entregable. Usa los ejemplos, documenta tus
                supuestos y vuelve al aula para comprobar el concepto.
              </p>
              <div className="atf-lab-grid">
                {lessons.map(m => (
                  <article key={m.id}>
                    <span className="atf-kicker">MISIÓN {m.id}</span>
                    <h3>{m.title}</h3>
                    <p>{m.deliverable}</p>
                    <a
                      href={
                        baseUrl +
                        `laboratorio.html?herramienta=${m.tool}${m.asset ? '&activo=' + m.asset : ''}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir herramienta <span className="atf-sr">(nueva pestaña)</span>
                    </a>
                  </article>
                ))}
              </div>
              <p className="atf-note">
                Las fichas y notas del laboratorio se guardan en el navegador del sitio público.{' '}
                {account
                  ? 'Todavía no se sincronizan con tu cuenta; el diagnóstico y los ejercicios del aula sí.'
                  : 'Puedes descargarlas desde cada herramienta.'}{' '}
                Abrir una herramienta no acredita automáticamente un concepto.
              </p>
            </>
          )}
          <p className="atf-save-notice" role="status">
            {notice}
          </p>
        </section>
      </div>
    </div>
  );
}
