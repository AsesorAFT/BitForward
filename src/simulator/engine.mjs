/**
 * A deliberately small, deterministic teaching model. Prices, costs and rates
 * are supplied by the learner; no venue data or execution is involved.
 */
const LIMITS = {
  capital: [1, 100_000_000],
  entryPrice: [0.00000001, 1_000_000_000],
  exitPrice: [0.00000001, 1_000_000_000],
  leverage: [1, 20],
  feePercent: [0, 2],
  spreadPercent: [0, 2],
  fundingPercent: [-2, 2],
  hours: [0, 240],
  maintenancePercent: [0, 10],
};

const LABELS = {
  capital: 'capital ficticio',
  entryPrice: 'precio de entrada',
  exitPrice: 'precio de salida',
  leverage: 'apalancamiento',
  feePercent: 'comisión',
  spreadPercent: 'spread',
  fundingPercent: 'funding',
  hours: 'duración',
  maintenancePercent: 'margen de mantenimiento',
};

function numberInRange(value, key) {
  if (value === '' || value === null || value === undefined) {
    throw new RangeError(`Indica ${LABELS[key]}.`);
  }
  const number = Number(value);
  const [min, max] = LIMITS[key];
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new RangeError(`${LABELS[key]} debe estar entre ${min} y ${max}.`);
  }
  return number;
}

export function calculateScenario(raw) {
  const mode = raw?.mode;
  if (!['spot', 'long', 'short'].includes(mode)) {
    throw new RangeError('Selecciona spot, largo o corto.');
  }

  const capital = numberInRange(raw.capital, 'capital');
  const entryPrice = numberInRange(raw.entryPrice, 'entryPrice');
  const exitPrice = numberInRange(raw.exitPrice, 'exitPrice');
  const feeRate = numberInRange(raw.feePercent, 'feePercent') / 100;
  const spreadRate = numberInRange(raw.spreadPercent, 'spreadPercent') / 100;
  const leveraged = mode !== 'spot';
  const leverage = leveraged ? numberInRange(raw.leverage, 'leverage') : 1;
  const fundingRate = leveraged ? numberInRange(raw.fundingPercent, 'fundingPercent') / 100 : 0;
  const hours = leveraged ? numberInRange(raw.hours, 'hours') : 0;
  const maintenanceRate = leveraged
    ? numberInRange(raw.maintenancePercent, 'maintenancePercent') / 100
    : 0;

  // Positive funding is paid by a long and received by a short. Negative
  // funding reverses that relationship. It is held constant for this scenario.
  const direction = mode === 'short' ? -1 : 1;
  const entryFactor = 1 + (direction * spreadRate) / 2;
  const exitFactor = 1 - (direction * spreadRate) / 2;
  const entryExecution = entryPrice * entryFactor;
  const exitExecution = exitPrice * exitFactor;
  // Spot treats capital as the full cash budget, including its entry fee.
  // Derivatives treat it as initial margin and deduct fees from that equity.
  const notional = leveraged ? capital * leverage : capital / (1 + feeRate);
  const quantity = notional / entryExecution;
  const exitNotional = quantity * exitExecution;
  const grossPnl = direction * quantity * (exitExecution - entryExecution);
  const entryFee = notional * feeRate;
  const exitFee = exitNotional * feeRate;
  const fundingCost = leveraged ? direction * notional * fundingRate * (hours / 8) : 0;
  const netPnl = grossPnl - entryFee - exitFee - fundingCost;
  const theoreticalEquity = capital + netPnl;

  // Solve equity(mark) = maintenanceRate * exit-notional(mark), assuming an
  // isolated position, fixed quantity, constant spread/rates and one close fee.
  // This is a didactic threshold, not any exchange's liquidation price.
  let theoreticalLiquidation = null;
  let distanceToLiquidationPercent = null;
  let crossesTheoreticalThreshold = false;
  let initialBufferExhausted = false;
  if (leveraged) {
    const numerator = direction * quantity * entryExecution + entryFee + fundingCost - capital;
    const denominator = quantity * exitFactor * (direction - feeRate - maintenanceRate);
    const threshold = numerator / denominator;
    if (Number.isFinite(threshold) && threshold > 0) {
      theoreticalLiquidation = threshold;
      distanceToLiquidationPercent = (direction * (entryPrice - threshold) * 100) / entryPrice;
      initialBufferExhausted = distanceToLiquidationPercent <= 0;
      crossesTheoreticalThreshold =
        direction === 1 ? exitPrice <= threshold : exitPrice >= threshold;
    }
  }

  return {
    mode,
    capital,
    entryPrice,
    exitPrice,
    leverage,
    feePercent: feeRate * 100,
    spreadPercent: spreadRate * 100,
    fundingPercent: fundingRate * 100,
    maintenancePercent: maintenanceRate * 100,
    hours,
    entryExecution,
    exitExecution,
    notional,
    quantity,
    grossPnl,
    entryFee,
    exitFee,
    fundingCost,
    netPnl,
    theoreticalEquity,
    returnPercent: (netPnl / capital) * 100,
    theoreticalLiquidation,
    distanceToLiquidationPercent,
    crossesTheoreticalThreshold,
    initialBufferExhausted,
  };
}
