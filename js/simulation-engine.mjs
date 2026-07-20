export const MODEL_ALLOCATION = Object.freeze({
  BTC: 0.6,
  ETH: 0.2,
  SOL: 0.1,
  ADA: 0.1,
});

export const DEFAULT_REBALANCE_BAND = 0.05;

const ASSETS = Object.keys(MODEL_ALLOCATION);

function requireNumber(value, label, { min, max }) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new RangeError(`${label} debe estar entre ${min} y ${max}.`);
  }
  return number;
}

export function annualToMonthlyRate(annualPercent) {
  const annual = requireNumber(annualPercent, 'La variación anual', { min: -95, max: 300 });
  return Math.pow(1 + annual / 100, 1 / 12) - 1;
}

export function shouldRebalance(weights, band = DEFAULT_REBALANCE_BAND) {
  return ASSETS.some(asset => Math.abs(weights[asset] - MODEL_ALLOCATION[asset]) > band);
}

function getWeights(balances, total) {
  return Object.fromEntries(ASSETS.map(asset => [asset, total > 0 ? balances[asset] / total : 0]));
}

function getMaxDrawdown(records) {
  let peak = records[0]?.total ?? 0;
  let maxDrawdown = 0;

  records.forEach(record => {
    peak = Math.max(peak, record.total);
    if (peak > 0) maxDrawdown = Math.min(maxDrawdown, record.total / peak - 1);
  });

  return maxDrawdown;
}

export function simulatePortfolio(options = {}) {
  const initialCapital = requireNumber(options.initialCapital, 'El capital inicial', {
    min: 100,
    max: 100000000,
  });
  const monthlyContribution = requireNumber(
    options.monthlyContribution ?? 0,
    'La aportación mensual',
    { min: 0, max: 10000000 }
  );
  const months = Math.round(requireNumber(options.months, 'El horizonte', { min: 1, max: 120 }));
  const rebalanceBand = requireNumber(
    options.rebalanceBand ?? DEFAULT_REBALANCE_BAND,
    'La banda de rebalanceo',
    { min: 0.01, max: 0.25 }
  );

  const annualReturns = Object.fromEntries(
    ASSETS.map(asset => [
      asset,
      requireNumber(options.annualReturns?.[asset] ?? 0, `La variación de ${asset}`, {
        min: -95,
        max: 300,
      }),
    ])
  );
  const monthlyRates = Object.fromEntries(
    ASSETS.map(asset => [asset, annualToMonthlyRate(annualReturns[asset])])
  );

  let balances = Object.fromEntries(
    ASSETS.map(asset => [asset, initialCapital * MODEL_ALLOCATION[asset]])
  );
  let contributed = initialCapital;
  let rebalanceCount = 0;
  const records = [
    {
      month: 0,
      total: initialCapital,
      contributed,
      result: 0,
      rebalanced: false,
      weights: { ...MODEL_ALLOCATION },
    },
  ];

  for (let month = 1; month <= months; month += 1) {
    ASSETS.forEach(asset => {
      balances[asset] += monthlyContribution * MODEL_ALLOCATION[asset];
      balances[asset] *= 1 + monthlyRates[asset];
    });
    contributed += monthlyContribution;

    let total = ASSETS.reduce((sum, asset) => sum + balances[asset], 0);
    let weights = getWeights(balances, total);
    const rebalanced = shouldRebalance(weights, rebalanceBand);

    if (rebalanced) {
      balances = Object.fromEntries(ASSETS.map(asset => [asset, total * MODEL_ALLOCATION[asset]]));
      weights = { ...MODEL_ALLOCATION };
      rebalanceCount += 1;
    }

    total = ASSETS.reduce((sum, asset) => sum + balances[asset], 0);
    records.push({
      month,
      total,
      contributed,
      result: total - contributed,
      rebalanced,
      weights,
    });
  }

  const finalRecord = records.at(-1);
  return {
    initialCapital,
    monthlyContribution,
    months,
    annualReturns,
    rebalanceBand,
    finalValue: finalRecord.total,
    totalContributions: finalRecord.contributed,
    result: finalRecord.result,
    resultPercent:
      finalRecord.contributed > 0 ? (finalRecord.result / finalRecord.contributed) * 100 : 0,
    rebalanceCount,
    maxDrawdown: getMaxDrawdown(records) * 100,
    finalWeights: finalRecord.weights,
    records,
  };
}

export function simulationToCsv(simulation) {
  const header = [
    'mes',
    'valor_total_mxn',
    'capital_aportado_mxn',
    'resultado_hipotetico_mxn',
    'rebalanceo',
    'peso_btc',
    'peso_eth',
    'peso_sol',
    'peso_ada',
  ];
  const rows = simulation.records.map(record => [
    record.month,
    record.total.toFixed(2),
    record.contributed.toFixed(2),
    record.result.toFixed(2),
    record.rebalanced ? 'si' : 'no',
    ...ASSETS.map(asset => (record.weights[asset] * 100).toFixed(2)),
  ]);

  return [header, ...rows].map(row => row.join(',')).join('\n');
}
