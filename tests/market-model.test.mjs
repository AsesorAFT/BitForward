import test from 'node:test';
import assert from 'node:assert/strict';
import {
  candlesToCsv,
  freshness,
  notesToMarkdown,
  parseMarketPayload,
  summarizeCandles,
} from '../src/market/model.mjs';
import {
  MAX_NOTES,
  NOTES_KEY,
  deleteMarketNote,
  readMarketNotes,
  saveMarketNote,
} from '../src/market/storage.mjs';

const asOf = '2026-09-25T12:30:00.000Z';
const now = Date.parse(asOf);
const hour = 3600;
const currentBucket = Math.floor(now / 1000 / hour) * hour;
const candle = (time, close) => [time, close - 10, close + 10, close - 5, close, 2];
const payload = () => ({
  source: 'Coinbase Exchange',
  product: 'BTC-USD',
  range: '24h',
  granularity: hour,
  asOf,
  candles: [
    candle(currentBucket, 110), // incomplete candle, must never appear as a close
    candle(currentBucket - hour, 105),
    candle(currentBucket - hour * 2, 100),
    ['malformed'],
  ],
});

test('market parser keeps only complete, finite, chronologically ordered BTC-USD candles', () => {
  const parsed = parseMarketPayload(payload(), '24h', now);
  assert.deepEqual(
    parsed.candles.map(item => item.close),
    [100, 105]
  );
  assert.equal(parsed.candles.at(-1).time, currentBucket - hour);
  const summary = summarizeCandles(parsed.candles);
  assert.equal(summary.changePercent, 5);
  assert.equal(summary.low, 90);
  assert.equal(summary.high, 115);
});

test('market parser refuses wrong product, range and unverifiable timestamps', () => {
  assert.throws(() => parseMarketPayload({ ...payload(), source: 'Unknown' }, '24h', now));
  assert.throws(() => parseMarketPayload({ ...payload(), product: 'ETH-USD' }, '24h', now));
  assert.throws(() => parseMarketPayload({ ...payload(), range: '7d' }, '24h', now));
  assert.throws(() => parseMarketPayload({ ...payload(), asOf: 'not-a-date' }, '24h', now));
  assert.throws(() => parseMarketPayload({ ...payload(), candles: [] }, '24h', now));
});

test('freshness labels distinguish a recent query from old history', () => {
  assert.equal(freshness(asOf, now + 10 * 60_000).kind, 'recent');
  assert.equal(freshness(asOf, now + 60 * 60_000).kind, 'older');
  assert.equal(freshness(asOf, now + 48 * 60 * 60_000).kind, 'stale');
});

test('CSV and note export carry market provenance and observation timestamps', () => {
  const market = parseMarketPayload(payload(), '24h', now);
  const csv = candlesToCsv(market);
  assert.match(csv, /Coinbase Exchange/);
  assert.match(csv, /Consulta UTC: 2026-09-25T12:30:00.000Z/);
  assert.match(csv, /inicio_utc,apertura_usd,maximo_usd,minimo_usd,cierre_usd,volumen_btc/);
  assert.equal(csv.split('\n').filter(line => line.includes('2026-09-25T')).length, 3);
  const markdown = notesToMarkdown([
    {
      createdAt: asOf,
      range: '24h',
      asOf,
      candleTime: market.candles.at(-1).time,
      close: 105,
      hypothesis: 'Puede depender de la liquidez.',
      invalidation: 'Un nuevo mínimo cambiaría mi lectura.',
    },
  ]);
  assert.match(markdown, /Vela inspeccionada UTC:/);
  assert.match(markdown, /Qué la pondría en duda/);
});

test('local notes can be saved, read and removed without corrupt entries', () => {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
  const note = {
    id: 'note-1',
    createdAt: asOf,
    range: '24h',
    asOf,
    candleTime: currentBucket - hour,
    close: 105,
    hypothesis: 'Un supuesto comprobable.',
    invalidation: 'Un dato contrario.',
  };
  assert.equal(saveMarketNote(note, storage).length, 1);
  assert.equal(readMarketNotes(storage)[0].id, 'note-1');
  values.set(NOTES_KEY, JSON.stringify([null, note, { id: 'broken' }]));
  assert.equal(readMarketNotes(storage).length, 1);
  assert.deepEqual(deleteMarketNote('note-1', storage), []);
});

test('the note limit never discards an older hypothesis without consent', () => {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
  const note = {
    id: 'new-note',
    createdAt: asOf,
    range: '24h',
    asOf,
    candleTime: currentBucket - hour,
    close: 105,
    hypothesis: 'Un supuesto comprobable.',
    invalidation: 'Un dato contrario.',
  };
  const existing = Array.from({ length: MAX_NOTES }, (_, index) => ({
    ...note,
    id: `existing-${index}`,
  }));
  values.set(NOTES_KEY, JSON.stringify(existing));
  assert.throws(() => saveMarketNote(note, storage), /Descarga una copia/);
  assert.equal(readMarketNotes(storage).length, MAX_NOTES);
  assert.equal(readMarketNotes(storage).at(-1).id, `existing-${MAX_NOTES - 1}`);
});
