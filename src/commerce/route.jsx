/* eslint-disable no-unused-vars -- JSX is compiled by Vite. */
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../editorial/main.js';
import './commerce.css';
import { leverageScenario } from './catalog.mjs';
function RiskLab() {
  const [margin, setMargin] = useState('100');
  const [leverage, setLeverage] = useState('5');
  const [move, setMove] = useState('-5');
  const [direction, setDirection] = useState('long');
  let result;
  try {
    if ([margin, leverage, move].some(v => !v.trim())) throw new Error();
    result = leverageScenario({
      margin: Number(margin),
      leverage: Number(leverage),
      move: Number(move),
      direction,
    });
  } catch {
    /* Empty/invalid fields must not become zero-value results. */
  }
  const amount = n =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(n);
  return (
    <div className="bf-risk-lab">
      <div className="bf-risk-fields">
        <label>
          Margen hipotético (USD)
          <input
            type="number"
            min="1"
            max="10000000"
            value={margin}
            onChange={e => setMargin(e.target.value)}
          />
        </label>
        <label>
          Apalancamiento
          <input
            type="number"
            min="1"
            max="100"
            step="1"
            value={leverage}
            onChange={e => setLeverage(e.target.value)}
          />
          <small>De 1× a 100× para comparar riesgos; no es una recomendación.</small>
        </label>
        <label>
          Movimiento del precio (%)
          <input
            type="number"
            min="-100"
            max="100"
            step="0.1"
            value={move}
            onChange={e => setMove(e.target.value)}
          />
        </label>
        <label>
          Dirección
          <select value={direction} onChange={e => setDirection(e.target.value)}>
            <option value="long">Larga / long</option>
            <option value="short">Corta / short</option>
          </select>
        </label>
      </div>
      <div className="bf-risk-result" aria-live="polite">
        {result ? (
          <>
            <p className="eyebrow">ESCENARIO HIPOTÉTICO · SIN COSTES</p>
            <dl>
              <div>
                <dt>Exposición teórica</dt>
                <dd>{amount(result.notional)} USD</dd>
              </div>
              <div>
                <dt>Resultado por movimiento de precio</dt>
                <dd className={result.pnl < 0 ? 'bf-loss' : ''}>{amount(result.pnl)} USD</dd>
              </div>
              <div>
                <dt>Cambio respecto al margen</dt>
                <dd>{result.marginChange.toFixed(1)}%</dd>
              </div>
            </dl>
            <p>
              {result.exhausted
                ? 'La pérdida teórica alcanza o supera tu margen. Una posición real podría liquidarse antes; este resultado no representa una posición que siguió abierta.'
                : 'El mismo movimiento, con más apalancamiento, tiene mayor impacto sobre tu margen. La liquidación real depende de las reglas del producto.'}
            </p>
          </>
        ) : (
          <p>Introduce valores válidos para calcular el escenario.</p>
        )}
      </div>
    </div>
  );
}
createRoot(document.getElementById('risk-root')).render(<RiskLab />);
