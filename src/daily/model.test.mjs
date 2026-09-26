import assert from 'node:assert/strict';
import {
  ADAPTIVE_VERSION,
  applyAdaptiveAnswer,
  emptyAdaptive,
} from '../ecosystem/adaptive-engine.mjs';
import { dailySession, localDayKey } from './model.mjs';

const morning = new Date(2026, 8, 25, 9).getTime();
const tomorrow = new Date(2026, 8, 26, 9).getTime();
assert.notEqual(localDayKey(morning), localDayKey(tomorrow));

let state = emptyAdaptive();
let session = dailySession(state, morning);
assert.equal(session.kind, 'ready');
assert.equal(session.question.id, 'fundamentos-d');
assert.equal(session.label, 'Punto de partida');

const first = applyAdaptiveAnswer(
  state,
  {
    version: ADAPTIVE_VERSION,
    revision: state.revision,
    questionId: session.question.id,
    answer: session.question.correct,
    hinted: false,
  },
  morning
);
state = first.state;
session = dailySession(state, morning + 1000);
assert.equal(session.kind, 'completed');
assert.equal(session.question.id, 'fundamentos-d');
assert.equal(dailySession(state, tomorrow).question.id, 'custodia-d');

// The daily activity and full campus share the same diagnostic and recommendation sequence.
for (let i = 1; i < 9; i += 1) {
  const question = dailySession(state, tomorrow + i * 86400000).question;
  const result = applyAdaptiveAnswer(
    state,
    {
      version: ADAPTIVE_VERSION,
      revision: state.revision,
      questionId: question.id,
      answer: question.correct,
      hinted: false,
    },
    tomorrow + i * 86400000
  );
  state = result.state;
}
session = dailySession(state, tomorrow + 10 * 86400000);
assert.equal(session.kind, 'ready');
assert.equal(session.question.stage, 'practice');
assert.equal(session.concept.id, 'fundamentos');

const incorrect = (session.question.correct + 1) % session.question.options.length;
state = applyAdaptiveAnswer(
  state,
  {
    version: ADAPTIVE_VERSION,
    revision: state.revision,
    questionId: session.question.id,
    answer: incorrect,
    hinted: false,
  },
  tomorrow + 10 * 86400000
).state;
session = dailySession(state, tomorrow + 11 * 86400000);
assert.equal(session.kind, 'ready');
assert.equal(session.concept.id, 'fundamentos');
assert.equal(session.label, 'Refuerzo de una base');

console.log('✓ Práctica diaria: una decisión por día local, avance y refuerzo adaptativo.');
