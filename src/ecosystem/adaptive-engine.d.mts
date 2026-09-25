export type AdaptiveAttempt = {
  questionId: string;
  answer: number;
  hinted: boolean;
  independent: boolean;
  at: number;
};
export type AdaptiveState = { version: string; revision: number; attempts: AdaptiveAttempt[] };
export type AdaptiveAction = {
  version: string;
  revision: number;
  questionId: string;
  answer: number;
  hinted: boolean;
};
export type AdaptiveResult = {
  state: AdaptiveState;
  correct: boolean;
  explanation: string;
  credited: boolean;
  notice?: string;
};
export type Concept = {
  id: string;
  missionId: string;
  label: string;
  requires: string[];
  room: string;
};
export type Question = {
  id: string;
  conceptId: string;
  stage: string;
  level: number;
  prompt: string;
  options: string[];
  correct: number;
  explanation: string;
  hint: string;
  rehearsal?: boolean;
};
export type ConceptProgress = Concept & {
  status: string;
  demonstrated: boolean;
  evidence: number;
  attempts: number;
  diagnostic: string;
  reviewAt: number | null;
  due: boolean;
};
export const ADAPTIVE_VERSION: string;
export const DAY: number;
export const concepts: Concept[];
export const questions: Question[];
export class AdaptiveInputError extends Error {}
export function emptyAdaptive(): AdaptiveState;
export function normalizeAdaptive(input: unknown, now?: number): AdaptiveState;
export function diagnosticQuestion(state: AdaptiveState): Question | null;
export function conceptProgress(state: AdaptiveState, now?: number): ConceptProgress[];
export function nextExercise(
  state: AdaptiveState,
  conceptId: string,
  now?: number
): Question | null;
export function recommendation(
  state: AdaptiveState,
  now?: number
): { concept: ConceptProgress | null; reason: string };
export function applyAdaptiveAnswer(input: unknown, action: unknown, now?: number): AdaptiveResult;
