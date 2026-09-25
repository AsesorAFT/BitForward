export const STORAGE_KEY = 'bitforward-learning-v1';
const knownMissions = ['001', '002', '003', '004', '005', '006', '007', '008', '009'];
export function normalizeState(value) {
  const input = value && typeof value === 'object' ? value : {};
  return {
    completed: Array.isArray(input.completed)
      ? [...new Set(input.completed.filter(id => knownMissions.includes(id)))]
      : [],
    entries: Array.isArray(input.entries)
      ? input.entries
          .filter(
            n =>
              n && typeof n === 'object' && typeof n.text === 'string' && typeof n.id === 'string'
          )
          .slice(0, 100)
          .map(n => ({
            id: n.id.slice(0, 100),
            asset: String(n.asset || 'General').slice(0, 12),
            text: n.text.slice(0, 2000),
            source: String(n.source || '').slice(0, 500),
            date: String(n.date || '').slice(0, 30),
          }))
      : [],
    analysis:
      input.analysis && typeof input.analysis === 'object'
        ? Object.fromEntries(
            ['asset', 'date', 'purpose', 'evidence', 'source', 'risk', 'invalidate', 'review'].map(
              k => [k, String(input.analysis[k] || '').slice(0, 3000)]
            )
          )
        : null,
  };
}
export function readLearning() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
  } catch {
    return normalizeState({});
  }
}
export function saveLearning(update) {
  try {
    const state = normalizeState({ ...readLearning(), ...update });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
export function clearLearning() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
