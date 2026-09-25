function finiteNumber(value, label, min, max) {
  if ((typeof value === 'string' && !value.trim()) || value == null || typeof value === 'boolean')
    throw new Error(`Completa ${label}.`);
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`${label} debe estar entre ${min} y ${max}.`);
  }
  return number;
}
export function analyzeExposure(positions, marketDrop, stableDrop) {
  const market = finiteNumber(marketDrop, 'la caída de activos', 0, 100) / 100;
  const stable = finiteNumber(stableDrop, 'la pérdida de paridad', 0, 100) / 100;
  const rows = positions.map(item => ({
    ...item,
    value: finiteNumber(item.value, 'el valor de ' + item.symbol, 0, 1e9),
  }));
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  if (!total) throw new Error('Agrega al menos una posición mayor que cero.');
  const output = rows.map(row => ({
    ...row,
    weight: row.value / total,
    loss: row.value * (row.stable ? stable : market),
  }));
  const loss = output.reduce((sum, row) => sum + row.loss, 0);
  const largest = output.reduce((a, b) => (a.value >= b.value ? a : b));
  return {
    total,
    rows: output,
    loss,
    after: total - loss,
    lossPercent: loss / total,
    largest,
    stableShare: output.filter(r => r.stable).reduce((sum, r) => sum + r.weight, 0),
  };
}
export function calculateGas(units, gwei, ethUsd) {
  const gas = finiteNumber(units, 'las unidades de gas', 1, 1e9);
  if (!Number.isInteger(gas)) throw new Error('Las unidades de gas deben ser enteras.');
  const price = finiteNumber(gwei, 'el precio por gas', 0, 1e9);
  const eth = (gas * price) / 1e9;
  const usd =
    ethUsd === '' || ethUsd == null ? null : eth * finiteNumber(ethUsd, 'el precio de ETH', 0, 1e9);
  return { eth, usd };
}
export function safeSource(value) {
  if (!value.trim()) return '';
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}
export function analysisMarkdown(note) {
  return `# BitForward · Ficha de ${note.asset}\n\nFecha: ${note.date}\n\n## Qué hace\n${note.purpose}\n\n## Evidencia\n${note.evidence}\n\nFuente: ${note.source}\n\n## Riesgo que revisé\n${note.risk}\n\n## Qué refutaría mi hipótesis\n${note.invalidate}\n\n## Próxima revisión\n${note.review}\n\nContenido educativo. No es una recomendación de inversión.\n`;
}
