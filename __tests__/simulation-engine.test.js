describe('Simulador educativo 60/20/10/10', () => {
  let engine;

  beforeAll(async () => {
    engine = await import('../js/simulation-engine.mjs');
  });

  test('mantiene la asignación objetivo en un escenario sin variación', () => {
    const result = engine.simulatePortfolio({
      initialCapital: 10000,
      monthlyContribution: 1000,
      months: 12,
      annualReturns: { BTC: 0, ETH: 0, SOL: 0, ADA: 0 },
    });

    expect(result.finalValue).toBeCloseTo(22000, 6);
    expect(result.result).toBeCloseTo(0, 6);
    expect(result.rebalanceCount).toBe(0);
    expect(result.finalWeights).toEqual(engine.MODEL_ALLOCATION);
  });

  test('rebalancea cuando un activo excede la banda de cinco puntos', () => {
    const result = engine.simulatePortfolio({
      initialCapital: 10000,
      monthlyContribution: 0,
      months: 24,
      annualReturns: { BTC: 100, ETH: -20, SOL: -20, ADA: -20 },
    });

    expect(result.rebalanceCount).toBeGreaterThan(0);
    expect(result.records.some(record => record.rebalanced)).toBe(true);
  });

  test('rechaza tasas imposibles y capital fuera de rango', () => {
    expect(() =>
      engine.simulatePortfolio({
        initialCapital: 0,
        months: 12,
        annualReturns: { BTC: 0, ETH: 0, SOL: 0, ADA: 0 },
      })
    ).toThrow('capital inicial');

    expect(() => engine.annualToMonthlyRate(-100)).toThrow('variación anual');
  });

  test('exporta una fila por cada mes más el estado inicial', () => {
    const result = engine.simulatePortfolio({
      initialCapital: 5000,
      monthlyContribution: 0,
      months: 3,
      annualReturns: { BTC: 5, ETH: 5, SOL: 5, ADA: 5 },
    });
    const rows = engine.simulationToCsv(result).split('\n');

    expect(rows).toHaveLength(5);
    expect(rows[0]).toContain('valor_total_mxn');
  });
});
