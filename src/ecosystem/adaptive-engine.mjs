import { ADAPTIVE_VERSION, concepts, questions } from './adaptive-content.mjs';
export { ADAPTIVE_VERSION, concepts, questions };
export const DAY = 86400000;
const byId = new Map(questions.map(q => [q.id, q]));
export function emptyAdaptive() {
  return { version: ADAPTIVE_VERSION, revision: 0, attempts: [] };
}
export function normalizeAdaptive(input, now = Date.now()) {
  if (!input || input.version !== ADAPTIVE_VERSION || !Array.isArray(input.attempts))
    return emptyAdaptive();
  const counts = new Map();
  const attempts = input.attempts
    .filter(a => {
      const q = byId.get(a?.questionId);
      return (
        q &&
        (a.answer === -1 ||
          (Number.isInteger(a.answer) && a.answer >= 0 && a.answer < q.options.length)) &&
        typeof a.hinted === 'boolean' &&
        typeof a.independent === 'boolean' &&
        Number.isSafeInteger(a.at) &&
        a.at > 0 &&
        a.at <= now + 60000 &&
        (q.stage !== 'diagnostic' || !a.hinted)
      );
    })
    .slice(-432)
    .sort((a, b) => a.at - b.at)
    .filter(a => {
      const count = (counts.get(a.questionId) || 0) + 1;
      counts.set(a.questionId, count);
      return byId.get(a.questionId).stage !== 'diagnostic' || count === 1;
    })
    .map(({ questionId, answer, hinted, independent, at }) => ({
      questionId,
      answer,
      hinted,
      independent,
      at,
    }));
  return {
    version: ADAPTIVE_VERSION,
    revision: Number.isSafeInteger(input.revision) && input.revision >= 0 ? input.revision : 0,
    attempts,
  };
}
export function diagnosticQuestion(state) {
  return (
    questions.find(
      q => q.stage === 'diagnostic' && !state.attempts.some(a => a.questionId === q.id)
    ) || null
  );
}
export function conceptProgress(state, now = Date.now()) {
  return concepts.map(c => {
    const attempts = state.attempts.filter(a => byId.get(a.questionId)?.conceptId === c.id);
    const diagnostic = attempts.find(a => byId.get(a.questionId).stage === 'diagnostic');
    const practice = attempts.filter(a => byId.get(a.questionId).stage === 'practice');
    const evidence = new Map();
    let lastEvidence = 0;
    for (const a of practice) {
      const q = byId.get(a.questionId);
      if (a.answer !== q.correct) {
        evidence.clear();
        lastEvidence = 0;
      } else if (!a.hinted && a.independent) {
        evidence.set(q.id, q.level);
        lastEvidence = a.at;
      }
    }
    const demonstrated = evidence.size >= 2 && [...evidence.values()].some(level => level === 2);
    const last = practice.at(-1);
    const needsHelp = last
      ? last.answer !== byId.get(last.questionId).correct
      : diagnostic && diagnostic.answer !== byId.get(diagnostic.questionId).correct;
    const status = demonstrated
      ? 'Comprobado'
      : needsHelp
        ? 'Por reforzar'
        : practice.length || (diagnostic && diagnostic.answer !== -1)
          ? 'En práctica'
          : diagnostic
            ? 'Por explorar'
            : 'Sin diagnóstico';
    return {
      ...c,
      status,
      demonstrated,
      evidence: evidence.size,
      attempts: practice.length,
      diagnostic: diagnostic
        ? diagnostic.answer === -1
          ? 'Sin respuesta'
          : diagnostic.answer === byId.get(diagnostic.questionId).correct
            ? 'Base identificada'
            : 'Necesita refuerzo'
        : 'Pendiente',
      reviewAt: demonstrated ? lastEvidence + 7 * DAY : null,
      due: demonstrated && now >= lastEvidence + 7 * DAY,
    };
  });
}
export function nextExercise(state, conceptId, now = Date.now()) {
  const pool = questions.filter(q => q.conceptId === conceptId && q.stage === 'practice');
  if (!pool.length) return null;
  const attempts = state.attempts.filter(
    a =>
      byId.get(a.questionId)?.conceptId === conceptId &&
      byId.get(a.questionId)?.stage === 'practice'
  );
  const seen = q => attempts.filter(a => a.questionId === q.id).at(-1)?.at || 0;
  const progress = conceptProgress(state, now).find(c => c.id === conceptId);
  const last = attempts.at(-1);
  const needsFoundation = last
    ? last.answer !== byId.get(last.questionId).correct || last.hinted
    : progress.diagnostic !== 'Base identificada';
  const fresh = pool.filter(q => !seen(q) || now - seen(q) >= DAY);
  const ordered = fresh.sort((a, b) =>
    needsFoundation
      ? a.level - b.level || seen(a) - seen(b)
      : b.level - a.level || seen(a) - seen(b)
  );
  // Once demonstrated, reviews vary the least recently seen scenario.
  const q = progress.demonstrated
    ? [...pool].sort((a, b) => seen(a) - seen(b))[0]
    : ordered[0] || [...pool].sort((a, b) => seen(a) - seen(b))[0];
  return { ...q, rehearsal: !!seen(q) && now - seen(q) < DAY };
}
export function recommendation(state, now = Date.now()) {
  const map = conceptProgress(state, now);
  const due = map.find(c => c.due);
  if (due)
    return {
      concept: due,
      reason:
        'Han pasado siete días desde tu última evidencia independiente. Comprueba qué recuerdas.',
    };
  const next = map.find(
    c => !c.demonstrated && c.requires.every(id => map.find(p => p.id === id).demonstrated)
  );
  if (next)
    return {
      concept: next,
      reason:
        next.status === 'Por reforzar'
          ? 'Tus respuestas muestran que conviene reforzar esta base antes de aplicarla en otros temas.'
          : 'Este concepto es el siguiente paso de tu ruta. Sus bases previas ya están comprobadas o no requiere ninguna.',
    };
  return {
    concept: null,
    reason:
      'Comprobaste los nueve conceptos iniciales. Puedes practicar en el laboratorio y volver para tus repasos.',
  };
}
export class AdaptiveInputError extends Error {}
export function applyAdaptiveAnswer(input, action, now = Date.now()) {
  const state = normalizeAdaptive(input, now);
  if (
    !action ||
    typeof action !== 'object' ||
    Array.isArray(action) ||
    Object.keys(action).some(
      k => !['version', 'revision', 'questionId', 'answer', 'hinted'].includes(k)
    ) ||
    action.version !== ADAPTIVE_VERSION
  )
    throw new AdaptiveInputError('La actividad cambió. Actualiza tu campus antes de continuar.');
  if (action.revision !== state.revision)
    throw new AdaptiveInputError(
      'Tu avance cambió en otra sesión. Actualiza el campus para continuar.'
    );
  const q = byId.get(action.questionId);
  if (
    !q ||
    !Number.isInteger(action.answer) ||
    action.answer < -1 ||
    action.answer >= q.options.length ||
    typeof action.hinted !== 'boolean' ||
    (q.stage === 'diagnostic' && action.hinted)
  )
    throw new AdaptiveInputError('Selecciona una respuesta válida.');
  const diagnostic = diagnosticQuestion(state);
  const expected = diagnostic || nextExercise(state, q.conceptId, now);
  if (
    q.id !== expected?.id ||
    (diagnostic && q.stage !== 'diagnostic') ||
    (!diagnostic && q.stage !== 'practice')
  )
    throw new AdaptiveInputError('Esta actividad ya no es la siguiente. Actualiza el campus.');
  const credited =
    q.stage === 'practice' && action.answer === q.correct && !action.hinted && !expected.rehearsal;
  const attempt = {
    questionId: q.id,
    answer: action.answer,
    hinted: action.hinted,
    independent: credited,
    at: now,
  };
  // Bound history per exercise, rather than allowing one repeatedly opened topic to erase the others.
  const same = state.attempts.filter(a => a.questionId === q.id);
  const attempts = [
    ...state.attempts.filter(a => a !== (same.length >= 12 ? same[0] : null)),
    attempt,
  ];
  const next = { version: ADAPTIVE_VERSION, revision: state.revision + 1, attempts };
  return {
    state: next,
    correct: action.answer === q.correct,
    explanation: q.explanation,
    credited,
  };
}
