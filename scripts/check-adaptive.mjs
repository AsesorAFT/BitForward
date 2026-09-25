import assert from 'node:assert/strict';
import {
  ADAPTIVE_VERSION,
  DAY,
  questions,
  concepts,
  emptyAdaptive,
  normalizeAdaptive,
  applyAdaptiveAnswer,
  diagnosticQuestion,
  nextExercise,
  conceptProgress,
  recommendation,
} from '../src/ecosystem/adaptive-engine.mjs';
const now = Date.now();
const action = (s, q, answer = q.correct, hinted = false) => ({
  version: ADAPTIVE_VERSION,
  revision: s.revision,
  questionId: q.id,
  answer,
  hinted,
});
function diagnose(correct = false) {
  let s = emptyAdaptive();
  for (let q; (q = diagnosticQuestion(s));)
    s = applyAdaptiveAnswer(s, action(s, q, correct ? q.correct : -1), now).state;
  return s;
}
assert.equal(questions.length, 36);
assert.equal(new Set(questions.map(q => q.id)).size, 36);
assert.equal(concepts.length, 9);
assert.equal(
  conceptProgress(diagnose(true), now).filter(c => c.demonstrated).length,
  0,
  'diagnosis does not certify mastery'
);
assert.equal(nextExercise(diagnose(), 'fundamentos', now).level, 1);
assert.equal(
  nextExercise(diagnose(true), 'fundamentos', now).level,
  2,
  'diagnosis changes first difficulty'
);
assert.equal(recommendation(diagnose(), now).concept.id, 'fundamentos');
let s = diagnose();
let q = nextExercise(s, 'fundamentos', now);
let result = applyAdaptiveAnswer(s, action(s, q, q.correct, true), now);
assert.equal(result.credited, false);
s = result.state;
assert.equal(conceptProgress(s, now)[0].evidence, 0, 'hints do not count');
q = nextExercise(s, 'fundamentos', now);
s = applyAdaptiveAnswer(s, action(s, q), now).state;
q = nextExercise(s, 'fundamentos', now);
s = applyAdaptiveAnswer(s, action(s, q), now).state;
assert.equal(
  conceptProgress(s, now)[0].demonstrated,
  true,
  'two distinct independent applied answers'
);
assert.equal(recommendation(s, now).concept.id, 'custodia', 'prerequisite ordering');
q = nextExercise(s, 'fundamentos', now);
result = applyAdaptiveAnswer(s, action(s, q), now);
assert.equal(result.credited, false, 'immediate repetition is rehearsal');
assert.equal(conceptProgress(result.state, now + 7 * DAY + 1)[0].due, true);
assert.equal(recommendation(result.state, now + 7 * DAY + 1).concept.id, 'fundamentos');
q = nextExercise(s, 'fundamentos', now);
s = applyAdaptiveAnswer(s, action(s, q, (q.correct + 1) % 3), now).state;
assert.equal(conceptProgress(s, now)[0].demonstrated, false, 'new error reopens a concept');
assert.equal(conceptProgress(s, now)[0].status, 'Por reforzar');
for (let i = 0; i < 1000; i++) {
  q = nextExercise(s, 'fundamentos', now + i);
  result = applyAdaptiveAnswer(s, action(s, q), now + i);
  s = result.state;
  assert.equal(result.credited, false, 'repeated exposed items cannot manufacture evidence');
}
assert.ok(s.attempts.length <= 45, 'bounded history per item preserves other concepts');
assert.equal(
  conceptProgress(s, now + 2000)[0].demonstrated,
  false,
  'history compaction cannot inflate mastery'
);
q = nextExercise(s, 'fundamentos', now + DAY + 3000);
assert.equal(
  applyAdaptiveAnswer(s, action(s, q), now + DAY + 3000).credited,
  true,
  'later recall can provide evidence'
);
assert.deepEqual(normalizeAdaptive({ version: 'old', attempts: [] }), emptyAdaptive());
assert.deepEqual(normalizeAdaptive({ completed: ['001'], score: 100 }), emptyAdaptive());
assert.throws(() =>
  applyAdaptiveAnswer(
    emptyAdaptive(),
    action(
      emptyAdaptive(),
      questions.find(q => q.stage === 'practice')
    ),
    now
  )
);
const start = emptyAdaptive();
q = diagnosticQuestion(start);
for (const patch of [
  { version: 'old' },
  { revision: 3 },
  { answer: 9 },
  { answer: '1' },
  { userId: 'someone' },
  { independent: true },
  { questionId: 'missing' },
  { hinted: true },
])
  assert.throws(() => applyAdaptiveAnswer(start, { ...action(start, q), ...patch }, now));
assert.throws(() => applyAdaptiveAnswer(start, null, now));
assert.throws(() => applyAdaptiveAnswer(start, [], now));
assert.equal(
  normalizeAdaptive(
    {
      version: ADAPTIVE_VERSION,
      revision: 0,
      attempts: [
        {
          questionId: q.id,
          answer: q.correct,
          hinted: false,
          independent: false,
          at: now + 2 * DAY,
        },
      ],
    },
    now
  ).attempts.length,
  0
);
console.log(
  '✓ ATF: 36 unique questions, diagnostic difficulty, prerequisites, hints, independent evidence, reopening, 7-day review, 24-hour recall, bounded non-inflating history and input validation.'
);
