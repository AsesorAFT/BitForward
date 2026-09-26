import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateScenario } from './engine.mjs';

const defaults = {
  mode: 'spot',
  capital: 100,
  entryPrice: 100,
  exitPrice: 110,
  leverage: 5,
  feePercent: 0,
  spreadPercent: 0,
  fundingPercent: 0,
  hours: 8,
  maintenancePercent: 0,
};

const close = (actual, expected, tolerance = 1e-8) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be near ${expected}`);

test('spot uses cash exposure and has no funding or liquidation threshold', () => {
  const result = calculateScenario(defaults);
  close(result.quantity, 1);
  close(result.notional, 100);
  close(result.netPnl, 10);
  close(result.theoreticalEquity, 110);
  assert.equal(result.leverage, 1);
  assert.equal(result.fundingCost, 0);
  assert.equal(result.theoreticalLiquidation, null);
});

test('long and short respond in opposite directions without costs', () => {
  const long = calculateScenario({ ...defaults, mode: 'long', exitPrice: 90 });
  const short = calculateScenario({ ...defaults, mode: 'short', exitPrice: 90 });
  close(long.netPnl, -50);
  close(short.netPnl, 50);
  close(long.returnPercent, -50);
  close(short.returnPercent, 50);
  close(long.theoreticalLiquidation, 80);
  close(short.theoreticalLiquidation, 120);
});

test('spread and fees are paid on execution prices and both sides', () => {
  const result = calculateScenario({
    ...defaults,
    exitPrice: 100,
    feePercent: 0.1,
    spreadPercent: 0.2,
  });
  close(result.entryExecution, 100.1);
  close(result.exitExecution, 99.9);
  close(result.entryFee, result.notional * 0.001);
  close(result.notional + result.entryFee, 100);
  close(result.exitFee, result.quantity * 99.9 * 0.001);
  close(result.netPnl, result.grossPnl - result.entryFee - result.exitFee);
  assert.ok(result.netPnl < -0.3);
});

test('positive funding is a cost for long and credit for short; negative reverses it', () => {
  const long = calculateScenario({
    ...defaults,
    mode: 'long',
    exitPrice: 100,
    leverage: 10,
    fundingPercent: 0.1,
    hours: 16,
  });
  const short = calculateScenario({
    ...defaults,
    mode: 'short',
    exitPrice: 100,
    leverage: 10,
    fundingPercent: 0.1,
    hours: 16,
  });
  const reversed = calculateScenario({
    ...defaults,
    mode: 'long',
    exitPrice: 100,
    leverage: 10,
    fundingPercent: -0.1,
    hours: 16,
  });
  close(long.fundingCost, 2);
  close(short.fundingCost, -2);
  close(reversed.fundingCost, -2);
  close(long.netPnl, -2);
  close(short.netPnl, 2);
});

test('teaching threshold satisfies equity equals assumed maintenance on both sides', () => {
  for (const mode of ['long', 'short']) {
    const input = {
      ...defaults,
      mode,
      exitPrice: 100,
      feePercent: 0.1,
      spreadPercent: 0.1,
      fundingPercent: 0.02,
      maintenancePercent: 0.5,
    };
    const result = calculateScenario(input);
    assert.ok(result.theoreticalLiquidation > 0);
    const atThreshold = calculateScenario({ ...input, exitPrice: result.theoreticalLiquidation });
    const maintenanceNotional =
      atThreshold.quantity * atThreshold.exitExecution * (input.maintenancePercent / 100);
    close(atThreshold.theoreticalEquity, maintenanceNotional, 1e-6);
    assert.equal(atThreshold.crossesTheoreticalThreshold, true);
  }
});

test('crossed threshold is flagged rather than treated as an executable result', () => {
  const long = calculateScenario({ ...defaults, mode: 'long', exitPrice: 70 });
  const short = calculateScenario({ ...defaults, mode: 'short', exitPrice: 130 });
  assert.equal(long.crossesTheoreticalThreshold, true);
  assert.equal(short.crossesTheoreticalThreshold, true);
  assert.ok(long.theoreticalEquity < 0);
  assert.ok(short.theoreticalEquity < 0);
});

test('rejects invalid mode, nonfinite numbers and unsafe input ranges', () => {
  assert.throws(() => calculateScenario({ ...defaults, mode: 'binary' }), /Selecciona/);
  assert.throws(() => calculateScenario({ ...defaults, capital: '' }), /capital ficticio/);
  assert.throws(() => calculateScenario({ ...defaults, exitPrice: Infinity }), /precio de salida/);
  assert.throws(
    () => calculateScenario({ ...defaults, mode: 'long', leverage: 21 }),
    /apalancamiento/
  );
  assert.throws(() => calculateScenario({ ...defaults, spreadPercent: -0.1 }), /spread/);
  assert.throws(() => calculateScenario({ ...defaults, mode: 'short', hours: -1 }), /duración/);
});
