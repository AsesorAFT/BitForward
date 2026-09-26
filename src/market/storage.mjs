export const NOTES_KEY = 'bitforward-btc-hypotheses-v1';
export const MAX_NOTES = 30;

export function readMarketNotes(storage) {
  try {
    const value = JSON.parse((storage ?? globalThis.localStorage).getItem(NOTES_KEY) || '[]');
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        note =>
          note &&
          typeof note.id === 'string' &&
          typeof note.createdAt === 'string' &&
          Number.isFinite(Date.parse(note.createdAt)) &&
          typeof note.hypothesis === 'string' &&
          note.hypothesis.length <= 1000 &&
          typeof note.invalidation === 'string' &&
          note.invalidation.length <= 1000 &&
          typeof note.asOf === 'string' &&
          Number.isFinite(Date.parse(note.asOf)) &&
          ['24h', '7d', '30d', '90d'].includes(note.range) &&
          Number.isFinite(note.candleTime) &&
          Number.isFinite(note.candleTime * 1000) &&
          note.candleTime * 1000 <= 8.64e15 &&
          note.candleTime > 0 &&
          Number.isFinite(note.close) &&
          note.close > 0
      )
      .slice(0, MAX_NOTES);
  } catch {
    return [];
  }
}

export function saveMarketNote(note, storage = globalThis.localStorage) {
  const existing = readMarketNotes(storage);
  if (existing.length >= MAX_NOTES)
    throw new Error('Llegaste a 30 hipótesis. Descarga una copia y borra una antes de guardar.');
  const notes = [note, ...existing];
  storage.setItem(NOTES_KEY, JSON.stringify(notes));
  return notes;
}

export function deleteMarketNote(id, storage = globalThis.localStorage) {
  const notes = readMarketNotes(storage).filter(note => note.id !== id);
  storage.setItem(NOTES_KEY, JSON.stringify(notes));
  return notes;
}
