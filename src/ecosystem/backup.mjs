import { normalizeState } from './storage.mjs';

export const BACKUP_FORMAT = 'bitforward-learning-backup-v1';
export const MAX_BACKUP_BYTES = 1_000_000;

export function makeBackup(state, exportedAt = new Date().toISOString()) {
  return JSON.stringify(
    { format: BACKUP_FORMAT, exportedAt, learning: normalizeState(state) },
    null,
    2
  );
}

export function parseBackup(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_BACKUP_BYTES)
    throw new Error(
      'El archivo es demasiado grande. Elige un respaldo de BitForward menor a 1 MB.'
    );
  let document;
  try {
    document = JSON.parse(text);
  } catch {
    throw new Error('El archivo no contiene JSON válido.');
  }
  if (
    document?.format !== BACKUP_FORMAT ||
    !document.learning ||
    typeof document.learning !== 'object' ||
    !Array.isArray(document.learning.completed) ||
    !Array.isArray(document.learning.entries)
  )
    throw new Error('Este archivo no es un respaldo compatible de BitForward.');
  return normalizeState(document.learning);
}
