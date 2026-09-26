import {
  conceptProgress,
  diagnosticQuestion,
  nextExercise,
  normalizeAdaptive,
  questions,
  recommendation,
} from '../ecosystem/adaptive-engine.mjs';
import { missions } from '../ecosystem/data.mjs';

const byQuestion = new Map(questions.map(question => [question.id, question]));
const byMission = new Map(missions.map(mission => [mission.id, mission]));

export function localDayKey(timestamp) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** One short decision per local calendar day, using the same progress and exercise rules as ATF. */
export function dailySession(input, now = Date.now()) {
  const state = normalizeAdaptive(input, now);
  const latest = state.attempts.at(-1);
  if (latest && localDayKey(latest.at) === localDayKey(now)) {
    const question = byQuestion.get(latest.questionId);
    const concept = conceptProgress(state, now).find(item => item.id === question.conceptId);
    return {
      kind: 'completed',
      question,
      concept,
      mission: byMission.get(concept.missionId),
      attempt: latest,
    };
  }

  const diagnostic = diagnosticQuestion(state);
  const recommended = recommendation(state, now);
  const concept = diagnostic
    ? conceptProgress(state, now).find(item => item.id === diagnostic.conceptId)
    : recommended.concept ||
      [...conceptProgress(state, now)].sort((a, b) => a.reviewAt - b.reviewAt)[0];
  const question = diagnostic || nextExercise(state, concept?.id, now);
  if (!question || !concept) return { kind: 'unavailable' };

  return {
    kind: 'ready',
    question,
    concept,
    mission: byMission.get(concept.missionId),
    label: diagnostic
      ? 'Punto de partida'
      : concept.due
        ? 'Repaso de 7 días'
        : concept.status === 'Por reforzar'
          ? 'Refuerzo de una base'
          : recommended.concept
            ? 'Siguiente paso'
            : 'Práctica libre',
    reason: diagnostic
      ? 'Responde con lo que sabes hoy. Este diagnóstico orienta tu ruta y no acredita dominio.'
      : recommended.concept
        ? recommended.reason
        : 'Ya comprobaste los nueve conceptos iniciales. Puedes seguir practicando mientras llega tu próximo repaso.',
  };
}
