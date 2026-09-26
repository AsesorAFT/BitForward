/* eslint-disable no-unused-vars -- JSX component references are compiled by Vite. */
import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '../editorial/main.js';
import { assets } from './data.mjs';
import { analyzeExposure, calculateGas, safeSource, analysisMarkdown } from './engine.mjs';
import { readLearning, saveLearning, clearLearning } from './storage.mjs';
import { makeBackup, parseBackup, MAX_BACKUP_BYTES } from './backup.mjs';

import btcIcon from '../../assets/crypto/btc.svg';
import ethIcon from '../../assets/crypto/eth.svg';
import usdtIcon from '../../assets/crypto/usdt.svg';
import adaIcon from '../../assets/crypto/ada.svg';
import solIcon from '../../assets/crypto/sol.svg';
import usdcIcon from '../../assets/crypto/usdc.svg';
const icons = {
  BTC: btcIcon,
  ETH: ethIcon,
  USDT: usdtIcon,
  ADA: adaIcon,
  SOL: solIcon,
  USDC: usdcIcon,
};
const money = n =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n);
const percent = n =>
  new Intl.NumberFormat('es-MX', { style: 'percent', maximumFractionDigits: 1 }).format(n);
const today = () => {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};
const tools = [
  ['comparar', '01', 'Comparar activos'],
  ['riesgo', '02', 'Mapa de exposición'],
  ['gas', '03', 'Calculadora de gas'],
  ['ficha', '04', 'Ficha de análisis'],
  ['bitacora', '05', 'Mi bitácora'],
];
function download(text, name, type = 'text/markdown;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Coin({ symbol }) {
  const asset = assets.find(a => a.symbol === symbol);
  return (
    <span className="coin-name">
      <img src={icons[symbol]} width="30" height="30" alt="" />
      {asset.name}
      <small>{symbol}</small>
    </span>
  );
}
function AssetSelect({ id, label, value, onChange }) {
  return (
    <label htmlFor={id}>
      {label}
      <select id={id} value={value} onChange={e => onChange(e.target.value)}>
        {assets.map(a => (
          <option key={a.symbol}>{a.symbol}</option>
        ))}
      </select>
    </label>
  );
}
function Source({ href, children }) {
  return (
    <a className="text-link" href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> (nueva pestaña)</span>
    </a>
  );
}
function Heading({ label, title, children }) {
  return (
    <div className="tool-heading">
      <p className="eyebrow">{label}</p>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
function Compare({ initialAsset }) {
  const [first, setFirst] = useState(initialAsset || 'BTC');
  const [second, setSecond] = useState(initialAsset === 'USDT' ? 'USDC' : 'ETH');
  return (
    <>
      <Heading label="COMPRENDER LAS DIFERENCIAS" title="No todos los activos hacen lo mismo.">
        Compara su propósito y las preguntas que conviene hacer. Una ficha explicativa, sin
        puntuaciones ni recomendaciones de compra.
      </Heading>
      <div className="form-grid">
        <AssetSelect id="asset-one" label="Primer activo" value={first} onChange={setFirst} />
        <AssetSelect id="asset-two" label="Segundo activo" value={second} onChange={setSecond} />
      </div>
      {first === second && (
        <p className="tool-notice" role="status">
          Elegiste el mismo activo. Selecciona otro para ver sus diferencias.
        </p>
      )}
      <div className="compare-grid">
        {[first, second].map((symbol, i) => {
          const a = assets.find(a => a.symbol === symbol);
          return (
            <article className="asset-profile" key={i} style={{ '--coin-color': a.color }}>
              <Coin symbol={symbol} />
              <p className="asset-kind">
                {a.kind} · {a.network}
              </p>
              <dl>
                {[
                  ['Para qué sirve', a.use],
                  ['Cómo funciona', a.mechanism],
                  ['Qué revisar en la custodia', a.custody],
                  ['Riesgos por investigar', a.risk],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <blockquote>{a.question}</blockquote>
              <Source href={a.source}>Consultar fuente primaria</Source>
              <a className="text-link" href={`./misiones/${a.mission}.html`}>
                Ir a la misión
              </a>
            </article>
          );
        })}
      </div>
      <p className="tool-footnote">
        Referencias revisadas el 25 de septiembre de 2026. USDT y USDC buscan mantener paridad con
        USD; no equivalen a efectivo sin riesgo.
      </p>
    </>
  );
}
function Exposure() {
  const [values, setValues] = useState(Object.fromEntries(assets.map(a => [a.symbol, '0'])));
  const [market, setMarket] = useState('30');
  const [stable, setStable] = useState('5');
  let result, error;
  try {
    result = analyzeExposure(
      assets.map(a => ({
        symbol: a.symbol,
        value: values[a.symbol],
        stable: a.kind === 'Stablecoin',
        color: a.color,
      })),
      market,
      stable
    );
  } catch (e) {
    error = e.message;
  }
  function example() {
    setValues({ BTC: '500', ETH: '250', USDT: '150', ADA: '50', SOL: '0', USDC: '50' });
    setMarket('30');
    setStable('5');
  }
  function exportReport() {
    download(
      `# BitForward · Escenario hipotético\n\nFecha: ${today()}\nCaída de activos: ${market}%\nPérdida de paridad: ${stable}%\n\n${result.rows.map(r => `${r.symbol}: ${money(r.value)} USD · peso ${percent(r.weight)} · pérdida ${money(r.loss)} USD`).join('\n')}\n\nTotal: ${money(result.total)} USD\nPérdida: ${money(result.loss)} USD (${percent(result.lossPercent)})\nValor restante: ${money(result.after)} USD\n\nValores manuales. No incluye comisiones, impuestos, correlaciones ni riesgos de contraparte. No es un pronóstico.\n`,
      'bitforward-escenario.md'
    );
  }
  return (
    <>
      <Heading label="PON A PRUEBA UN ESCENARIO" title="¿Cuánto cambia el total si el mercado cae?">
        Introduce valores actuales en USD, no cantidades de monedas. También puedes comenzar con un
        ejemplo de $1,000. Los datos se calculan aquí y no se guardan.
      </Heading>
      <button className="button button-outline" onClick={example}>
        Cargar ejemplo de $1,000
      </button>
      <div className="exposure-layout">
        <div>
          <div className="positions-grid">
            {assets.map(a => (
              <label key={a.symbol} htmlFor={`value-${a.symbol}`}>
                <Coin symbol={a.symbol} />
                <span className="input-unit">
                  <input
                    id={`value-${a.symbol}`}
                    type="number"
                    min="0"
                    max="1000000000"
                    step="any"
                    inputMode="decimal"
                    value={values[a.symbol]}
                    onChange={e => setValues({ ...values, [a.symbol]: e.target.value })}
                  />
                  <span>USD</span>
                </span>
              </label>
            ))}
          </div>
          <div className="scenario-controls">
            <label htmlFor="market-drop">
              Caída hipotética de BTC, ETH, ADA y SOL <strong>{market}%</strong>
              <input
                id="market-drop"
                type="range"
                min="0"
                max="100"
                value={market}
                onChange={e => setMarket(e.target.value)}
              />
            </label>
            <label htmlFor="stable-drop">
              Pérdida de paridad de USDT y USDC <strong>{stable}%</strong>
              <input
                id="stable-drop"
                type="range"
                min="0"
                max="100"
                value={stable}
                onChange={e => setStable(e.target.value)}
              />
            </label>
          </div>
        </div>
        <div className="scenario-result" aria-live="polite" aria-atomic="true">
          {result ? (
            <>
              <p className="eyebrow">RESULTADO HIPOTÉTICO</p>
              <span>Valor después del escenario</span>
              <strong className="result-number">{money(result.after)}</strong>
              <span>USD · de un total de {money(result.total)}</span>
              <div className="result-loss">
                Pérdida de {money(result.loss)} USD <b>−{percent(result.lossPercent)}</b>
              </div>
              <div className="allocation-bar" aria-label="Distribución de valores">
                {result.rows
                  .filter(r => r.value)
                  .map(r => (
                    <span
                      key={r.symbol}
                      style={{ width: percent(r.weight).replace(',', '.'), background: r.color }}
                    />
                  ))}
              </div>
              <ul className="allocation-list">
                {result.rows
                  .filter(r => r.value)
                  .map(r => (
                    <li key={r.symbol}>
                      <span>{r.symbol}</span>
                      <strong>{percent(r.weight)}</strong>
                    </li>
                  ))}
              </ul>
              <p>
                Mayor posición: <b>{result.largest.symbol}</b> ({percent(result.largest.weight)}).
                Stablecoins: <b>{percent(result.stableShare)}</b> del total.
              </p>
              <button className="button button-outline" onClick={exportReport}>
                Descargar escenario
              </button>
            </>
          ) : (
            <p>{error}</p>
          )}
        </div>
      </div>
      <p className="tool-notice">
        Este modelo aplica dos caídas uniformes que tú eliges. No estima probabilidades ni incluye
        comisiones, impuestos, liquidez, correlaciones o quiebras de plataformas. No utiliza
        cotizaciones en vivo.
      </p>
      <a className="text-link" href="./misiones/007-mapa-de-exposicion.html">
        Entender los pesos y los límites del modelo
      </a>
    </>
  );
}
function Gas() {
  const [units, setUnits] = useState('21000');
  const [gwei, setGwei] = useState('10');
  const [price, setPrice] = useState('');
  let result, error;
  try {
    result = calculateGas(units, gwei, price);
  } catch (e) {
    error = e.message;
  }
  return (
    <>
      <Heading label="ETHEREUM / ENTENDER UNA COMISIÓN" title="Del gas al costo, sin misterio.">
        Usa las unidades consumidas y el precio efectivo por gas. El ejemplo inicial es didáctico:
        no es una tarifa actual.
      </Heading>
      <div className="gas-layout">
        <div className="form-stack">
          <label htmlFor="gas-units">
            Unidades de gas
            <input
              id="gas-units"
              type="number"
              min="1"
              max="1000000000"
              step="1"
              value={units}
              onChange={e => setUnits(e.target.value)}
            />
            <small>21,000 es el ejemplo de una transferencia simple de ETH.</small>
          </label>
          <label htmlFor="gas-price">
            Precio efectivo por unidad (gwei)
            <input
              id="gas-price"
              type="number"
              min="0"
              max="1000000000"
              step="any"
              value={gwei}
              onChange={e => setGwei(e.target.value)}
            />
          </label>
          <label htmlFor="eth-price">
            Precio de 1 ETH en USD · opcional
            <input
              id="eth-price"
              type="number"
              min="0"
              max="1000000000"
              step="any"
              placeholder="Introduce tu referencia"
              value={price}
              onChange={e => setPrice(e.target.value)}
            />
          </label>
        </div>
        <div className="scenario-result" aria-live="polite" aria-atomic="true">
          {result ? (
            <>
              <p className="eyebrow">COMISIÓN CALCULADA</p>
              <strong className="result-number gas-number">
                {new Intl.NumberFormat('es-MX', { maximumFractionDigits: 12 }).format(result.eth)}{' '}
                <small>ETH</small>
              </strong>
              {result.usd !== null && (
                <p>{money(result.usd)} USD, usando el precio que introdujiste.</p>
              )}
              <p className="formula">unidades × gwei ÷ 1,000,000,000</p>
              <p>El importe enviado y la comisión son conceptos distintos.</p>
            </>
          ) : (
            <p>{error}</p>
          )}
        </div>
      </div>
      <p className="tool-notice">
        La comisión real depende de la ejecución. Este cálculo no estima gas, tarifas futuras ni
        cargos adicionales de redes de segunda capa.
      </p>
      <a className="text-link" href="./misiones/002-gasolinera-ethereum.html">
        Volver a la gasolinera Ethereum
      </a>
    </>
  );
}
function Analysis({ initialAsset }) {
  const blank = {
    asset: initialAsset || 'BTC',
    date: today(),
    purpose: '',
    evidence: '',
    source: '',
    risk: '',
    invalidate: '',
    review: '',
  };
  const [note, setNote] = useState(blank);
  const [message, setMessage] = useState('');
  const [hasSaved, setHasSaved] = useState(Boolean(readLearning().analysis));
  useEffect(() => {
    const sync = () => setHasSaved(Boolean(readLearning().analysis));
    window.addEventListener('learning-reset', sync);
    return () => window.removeEventListener('learning-reset', sync);
  }, []);
  const change = (key, value) => {
    setNote({ ...note, [key]: value });
    setMessage('');
  };
  const valid = () => {
    if (
      !note.purpose.trim() ||
      !note.evidence.trim() ||
      !note.risk.trim() ||
      !note.invalidate.trim()
    ) {
      setMessage('Completa propósito, evidencia, riesgo y condición de revisión.');
      return false;
    }
    if (note.source && !safeSource(note.source)) {
      setMessage('La fuente debe ser una dirección web válida con https:// o http://.');
      return false;
    }
    return true;
  };
  function save() {
    if (valid()) {
      const ok = saveLearning({ analysis: note });
      setMessage(
        ok
          ? 'Ficha guardada en este navegador.'
          : 'No se pudo guardar. Descarga tu ficha para conservarla.'
      );
      if (ok) setHasSaved(true);
    }
  }
  function load() {
    const saved = readLearning().analysis;
    if (saved) {
      setNote({
        ...blank,
        ...saved,
        asset: assets.some(a => a.symbol === saved.asset) ? saved.asset : 'BTC',
      });
      setMessage('Ficha guardada recuperada.');
    }
  }
  return (
    <>
      <Heading label="DEL DATO A UNA HIPÓTESIS" title="Construye tu propia ficha de análisis.">
        Escribe lo que sabes, de dónde viene y qué te haría cambiar de opinión. Puedes descargarlo o
        guardarlo en este navegador.
      </Heading>
      {hasSaved && (
        <button className="button button-outline" onClick={load}>
          Recuperar mi última ficha guardada
        </button>
      )}
      <form
        onSubmit={e => {
          e.preventDefault();
          if (valid()) {
            download(analysisMarkdown(note), `bitforward-ficha-${note.asset.toLowerCase()}.md`);
            setMessage('Ficha descargada.');
          }
        }}
      >
        <div className="form-grid">
          <AssetSelect
            id="analysis-asset"
            label="Activo"
            value={note.asset}
            onChange={value => change('asset', value)}
          />
          <label htmlFor="analysis-date">
            Fecha
            <input
              id="analysis-date"
              required
              type="date"
              value={note.date}
              onChange={e => change('date', e.target.value)}
            />
          </label>
        </div>
        <div className="form-stack">
          {[
            [
              'purpose',
              '¿Qué problema intenta resolver?',
              'Describe una función concreta, no una promesa de precio.',
            ],
            [
              'evidence',
              '¿Qué evidencia encontraste?',
              'Separa un dato verificado de tu interpretación.',
            ],
            [
              'risk',
              '¿Qué riesgo podría cambiar el escenario?',
              'Ejemplo: custodia, paridad, permisos o uso de la red.',
            ],
            [
              'invalidate',
              '¿Qué refutaría tu hipótesis?',
              'Anota una condición observable que te haría reconsiderarla.',
            ],
          ].map(([key, label, placeholder]) => (
            <label key={key} htmlFor={`analysis-${key}`}>
              {label}
              <textarea
                id={`analysis-${key}`}
                required
                maxLength="3000"
                rows="3"
                value={note[key]}
                placeholder={placeholder}
                onChange={e => change(key, e.target.value)}
              />
            </label>
          ))}
          <label htmlFor="analysis-source">
            Fuente primaria · enlace opcional
            <input
              id="analysis-source"
              type="url"
              maxLength="500"
              placeholder="https://"
              value={note.source}
              onChange={e => change('source', e.target.value)}
            />
          </label>
          <label htmlFor="analysis-review">
            ¿Cuándo volverás a revisarlo?
            <input
              id="analysis-review"
              maxLength="300"
              placeholder="Ejemplo: al publicarse el próximo informe de reservas."
              value={note.review}
              onChange={e => change('review', e.target.value)}
            />
          </label>
        </div>
        <div className="action-row">
          <button className="button button-primary" type="submit">
            Descargar ficha
          </button>
          <button className="button button-outline" type="button" onClick={save}>
            Guardar en este navegador
          </button>
        </div>
        <p className="save-feedback" role="status">
          {message}
        </p>
      </form>
      <p className="tool-footnote">
        Guardar reemplaza tu última ficha, no tus notas de bitácora. No introduzcas contraseñas,
        claves ni información personal. Tus datos no se envían a BitForward.
      </p>
    </>
  );
}
function Journal() {
  const [entries, setEntries] = useState(() => readLearning().entries);
  const [asset, setAsset] = useState('BTC');
  const [text, setText] = useState('');
  const [source, setSource] = useState('');
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [pendingBackup, setPendingBackup] = useState(null);
  function persist(next) {
    if (saveLearning({ entries: next })) {
      setEntries(next);
      return true;
    }
    setMessage(
      'El navegador no permite guardar. Conserva el texto o descarga las notas disponibles.'
    );
    return false;
  }
  function add(e) {
    e.preventDefault();
    if (!text.trim()) {
      setMessage('Escribe una conclusión antes de guardarla.');
      return;
    }
    if (source && !safeSource(source)) {
      setMessage('Introduce una fuente web válida.');
      return;
    }
    if (entries.length >= 100) {
      setMessage('Alcanzaste 100 notas. Descárgalas antes de eliminar alguna.');
      return;
    }
    const entry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      asset,
      text: text.trim(),
      source: safeSource(source),
    };
    if (persist([entry, ...readLearning().entries])) {
      setText('');
      setSource('');
      setMessage('Nota guardada en este navegador.');
    }
  }
  function exportNotes() {
    download(
      `# BitForward · Bitácora\n\n${entries.map(e => `## ${e.asset} · ${e.date.slice(0, 10)}\n${e.text}\n\nFuente: ${e.source || 'No registrada'}\n`).join('\n')}`,
      'bitforward-bitacora.md'
    );
  }
  function exportBackup() {
    download(
      makeBackup(readLearning()),
      'bitforward-respaldo.json',
      'application/json;charset=utf-8'
    );
    setMessage(
      'Respaldo descargado. Contiene progreso, ficha y notas de Mi bitácora. Guárdalo en privado.'
    );
  }
  async function inspectBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setPendingBackup(null);
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      setMessage('El archivo es demasiado grande. Elige un respaldo menor a 1 MB.');
      return;
    }
    try {
      const backup = parseBackup(await file.text());
      setPendingBackup(backup);
      setMessage(
        `Respaldo listo: ${backup.completed.length} misiones y ${backup.entries.length} notas. Revisa antes de reemplazar los datos actuales.`
      );
    } catch (error) {
      setMessage(error.message);
    }
  }
  function restoreBackup() {
    if (!pendingBackup) return;
    if (!saveLearning(pendingBackup)) {
      setMessage('No fue posible restaurar. Revisa los permisos o espacio de este navegador.');
      return;
    }
    setEntries(pendingBackup.entries);
    setPendingBackup(null);
    window.dispatchEvent(new Event('learning-reset'));
    setMessage('Respaldo restaurado en este navegador. Tu progreso y notas están disponibles.');
  }
  return (
    <>
      <Heading label="TU MÉTODO, POR ESCRITO" title="Una buena decisión deja una huella.">
        Registra qué aprendiste y qué evidencia cambiaría tu conclusión. Las notas permanecen en
        este navegador; descarga una copia para conservarlas.
      </Heading>
      <form onSubmit={add} className="form-stack">
        <AssetSelect
          id="journal-asset"
          label="Activo de la nota"
          value={asset}
          onChange={setAsset}
        />
        <label htmlFor="journal-note">
          Conclusión y condición de revisión
          <textarea
            id="journal-note"
            rows="4"
            required
            maxLength="2000"
            placeholder="Hoy revisé… Mi fuente fue… Volveré a comprobarlo cuando…"
            value={text}
            onChange={e => setText(e.target.value)}
          />
        </label>
        <label htmlFor="journal-source">
          Fuente · enlace opcional
          <input
            id="journal-source"
            type="url"
            maxLength="500"
            placeholder="https://"
            value={source}
            onChange={e => setSource(e.target.value)}
          />
        </label>
        <div>
          <button type="submit" className="button button-primary">
            Guardar nota en este navegador +
          </button>
        </div>
      </form>
      <p className="save-feedback" role="status">
        {message}
      </p>
      <div className="journal-heading">
        <h3>
          {entries.length} {entries.length === 1 ? 'nota guardada' : 'notas guardadas'}
        </h3>
        {entries.length > 0 && (
          <button className="button button-outline" onClick={exportNotes}>
            Descargar bitácora
          </button>
        )}
      </div>
      {entries.length === 0 ? (
        <div className="empty-notes">
          Tu bitácora empieza con una pregunta. Completa una misión y registra aquí tu primera
          conclusión.
        </div>
      ) : (
        <div className="journal-list">
          {entries.map(entry => (
            <article key={entry.id}>
              <div className="metadata">
                <span>{entry.asset}</span>
                <time>{entry.date.slice(0, 10)}</time>
              </div>
              <p>{entry.text}</p>
              {safeSource(entry.source) && (
                <Source href={safeSource(entry.source)}>Consultar fuente</Source>
              )}
              <button
                className="delete-note"
                aria-label={`Eliminar nota de ${entry.asset} del ${entry.date.slice(0, 10)}`}
                onClick={() => {
                  if (persist(entries.filter(e => e.id !== entry.id)))
                    setMessage('Nota eliminada.');
                }}
              >
                Eliminar nota
              </button>
            </article>
          ))}
        </div>
      )}
      <details className="local-data">
        <summary>Respaldar, trasladar o borrar mis datos</summary>
        <p>
          Este espacio no tiene cuenta ni sincronización. Borrar los datos del navegador elimina tu
          progreso, ficha y notas. No guardes frases semilla, contraseñas ni datos sensibles.
        </p>
        <div className="action-row">
          <button className="button button-outline" type="button" onClick={exportBackup}>
            Respaldar progreso y bitácora
          </button>
          <label htmlFor="learning-backup-file">
            Importar respaldo de BitForward
            <input
              id="learning-backup-file"
              type="file"
              accept=".json,application/json"
              onChange={inspectBackup}
            />
          </label>
        </div>
        <p>
          Para cambiar de dominio o teléfono, descarga el respaldo en el navegador anterior y ábrelo
          aquí. Incluye el campus ATF, misiones, ficha y Mi bitácora; las hipótesis del Mercado BTC
          se exportan en esa página por separado. No compartas estos archivos públicamente. Importar
          reemplazará el progreso, la ficha y las notas de este navegador.
        </p>
        {pendingBackup && (
          <div>
            <p>
              Se restaurarán {pendingBackup.completed.length} misiones y{' '}
              {pendingBackup.entries.length} notas. Descarga primero un respaldo de tus datos
              actuales si quieres conservarlos.
            </p>
            <div className="action-row">
              <button className="button button-primary" type="button" onClick={restoreBackup}>
                Reemplazar con este respaldo
              </button>
              <button
                className="button button-outline"
                type="button"
                onClick={() => setPendingBackup(null)}
              >
                Cancelar importación
              </button>
            </div>
          </div>
        )}
        {!confirm ? (
          <button className="button button-outline" onClick={() => setConfirm(true)}>
            Borrar todos mis datos de aprendizaje
          </button>
        ) : (
          <div>
            <p>
              Se eliminarán las notas, la ficha guardada y el progreso de misiones en este
              navegador. Descarga primero lo que quieras conservar.
            </p>
            <div className="action-row">
              <button
                className="button button-outline"
                onClick={() => {
                  if (clearLearning()) {
                    setEntries([]);
                    setConfirm(false);
                    setMessage('Tus datos de aprendizaje se eliminaron.');
                    window.dispatchEvent(new Event('learning-reset'));
                  } else
                    setMessage(
                      'No fue posible borrar los datos. Revisa los permisos del navegador.'
                    );
                }}
              >
                Confirmar borrado
              </button>
              <button className="button button-outline" onClick={() => setConfirm(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </details>
    </>
  );
}
function Lab() {
  const params = new URLSearchParams(location.search);
  const requested = params.get('activo');
  const initialAsset = assets.some(a => a.symbol === requested) ? requested : null;
  const [active, setActive] = useState(
    tools.some(t => t[0] === params.get('herramienta')) ? params.get('herramienta') : 'comparar'
  );
  function select(id) {
    setActive(id);
    const url = new URL(location.href);
    url.searchParams.set('herramienta', id);
    history.replaceState(null, '', url);
  }
  return (
    <div className="lab-shell">
      <nav className="tool-nav" aria-label="Herramientas del laboratorio">
        {tools.map(([id, n, label]) => (
          <button
            key={id}
            aria-pressed={active === id}
            aria-controls="tool-workspace"
            onClick={() => select(id)}
          >
            <span>{n}</span>
            {label}
          </button>
        ))}
        <p>
          ACCESO EXPLORADOR
          <br />
          <strong>Abierto y gratuito</strong>
        </p>
        <a href="./misiones.html">Ver mi ruta de misiones</a>
      </nav>
      <section
        className="tool-workspace"
        id="tool-workspace"
        aria-label={tools.find(t => t[0] === active)[2]}
      >
        <div hidden={active !== 'comparar'}>
          <Compare initialAsset={initialAsset} />
        </div>
        <div hidden={active !== 'riesgo'}>
          <Exposure />
        </div>
        <div hidden={active !== 'gas'}>
          <Gas />
        </div>
        <div hidden={active !== 'ficha'}>
          <Analysis initialAsset={initialAsset} />
        </div>
        <div hidden={active !== 'bitacora'}>
          <Journal />
        </div>
      </section>
    </div>
  );
}
createRoot(document.getElementById('lab-root')).render(<Lab />);
