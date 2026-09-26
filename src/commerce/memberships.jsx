/* eslint-disable no-unused-vars -- JSX is compiled by Vite. */
import { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import '../editorial/main.js';
import './commerce.css';
import {
  products,
  money,
  addToCart,
  normalizeCart,
  cartTotal,
  CATALOG_VERSION,
} from './catalog.mjs';
const KEY = 'bitforward-cart-v1';
function readCart() {
  try {
    return normalizeCart(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return [];
  }
}
function Memberships() {
  const [period, setPeriod] = useState('monthly');
  const [cart, setCart] = useState(readCart);
  const [step, setStep] = useState('cart');
  const [method, setMethod] = useState('transfer');
  const [asset, setAsset] = useState('USDT');
  const [notice, setNotice] = useState('');
  const checkout = useRef(null);
  const live = import.meta.env.VITE_BITFORWARD_COMMERCE_READY === 'true';
  const update = next => {
    setCart(next);
    setStep('cart');
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setNotice('Selección guardada en este navegador.');
    } catch {
      setNotice('La selección sólo se conserva mientras esta página esté abierta.');
    }
  };
  const choose = p => {
    update(addToCart(cart, p.id, p.once ? 'once' : period));
    setNotice(`${p.name} añadido. Círculo incluye Analista; sólo necesitas una membresía.`);
    checkout.current?.focus();
  };
  const exportQuote = () => {
    const text = `BITFORWARD · PROPUESTA, NO ES UN PEDIDO NI UN COMPROBANTE\n${CATALOG_VERSION}\n\n${cart
      .map(i => {
        const p = products.find(p => p.id === i.id);
        return `${p.name} · ${i.period === 'annual' ? '365 días' : i.period === 'monthly' ? '30 días' : 'Pago único'} · ${money(p[i.period])} MXN`;
      })
      .join(
        '\n'
      )}\nTotal propuesto: ${money(cartTotal(cart))} MXN\nMétodo elegido: ${method === 'btc' ? 'BTC, red Bitcoin' : method === 'binance_pay' ? `Binance Pay en ${asset}` : 'Transferencia bancaria'}\nLa cotización en cripto se solicita al crear un pedido real. No se ha reservado un cupo ni activado acceso.\nPrecios, calendario y condiciones sujetos a aprobación antes de contratar.\n`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    a.download = 'bitforward-propuesta.txt';
    a.click();
    URL.revokeObjectURL(a.href);
    setNotice('Propuesta descargada. No es una orden de pago.');
  };
  const privateUrl =
    'https://app.afortu.com.mx/mi-afortu/bitforward/compras?items=' +
    encodeURIComponent(cart.map(i => `${i.id}:${i.period}`).join(',')) +
    '&method=' +
    method +
    (method === 'binance_pay' ? '&asset=' + asset : '');
  return (
    <>
      <div className="bf-mobile-cart" data-empty={cart.length === 0 ? 'true' : 'false'}>
        <span>
          {cart.length} {cart.length === 1 ? 'selección' : 'selecciones'} · {money(cartTotal(cart))}{' '}
          MXN
        </span>
        <a href="#carrito" onClick={() => checkout.current?.focus()}>
          Ver carrito
        </a>
      </div>
      <div className="bf-period" role="group" aria-label="Periodo propuesto">
        <button aria-pressed={period === 'monthly'} onClick={() => setPeriod('monthly')}>
          Mensual
        </button>
        <button aria-pressed={period === 'annual'} onClick={() => setPeriod('annual')}>
          Anual <span>365 días al precio de 10 periodos</span>
        </button>
      </div>
      <div className="plans-grid bf-plans">
        <article className="plan plan-live">
          <p className="eyebrow">DISPONIBLE AHORA</p>
          <h2>Explorador</h2>
          <p>Empieza sin saber nada de cripto.</p>
          <p className="plan-price">
            $0 <small>MXN</small>
          </p>
          <ul>
            <li>Introducción desde cero y nueve misiones.</li>
            <li>Campus ATF con diagnóstico y práctica.</li>
            <li>Cinco herramientas y simulador de riesgo.</li>
            <li>Fichas y bitácora descargables.</li>
          </ul>
          <a className="button button-outline" href="./ruta.html#desde-cero">
            Comenzar desde cero
          </a>
          <small>Sin cuenta. Progreso local en tu navegador.</small>
        </article>
        {products
          .filter(p => p.group === 'membership')
          .map(p => (
            <article className={`plan ${p.id === 'analista' ? 'bf-featured' : ''}`} key={p.id}>
              <p className="eyebrow">PROPUESTA · POR HABILITAR</p>
              <h2>{p.name}</h2>
              <p>{p.tagline}</p>
              <p className="plan-price">
                {money(p[period])}{' '}
                <small>MXN / {period === 'annual' ? '365 días' : '30 días'}</small>
              </p>
              {period === 'annual' && (
                <p>Ahorras {money(p.monthly * 12 - p.annual)} MXN frente a 12 pagos de 30 días.</p>
              )}
              <ul>
                {p.features.map(f => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <button className="button button-primary" onClick={() => choose(p)}>
                Añadir {p.name}
              </button>
              <small>
                Precio y prestaciones propuestos. Renovación manual, sin cargos automáticos.
              </small>
            </article>
          ))}
      </div>
      <article className="bf-cohort">
        <div>
          <p className="eyebrow">PROGRAMA INTENSIVO · PROPUESTA</p>
          <h2>De cero a tu primer análisis.</h2>
          <p>Cuatro semanas, ocho sesiones y un proyecto que puedas explicar.</p>
          <p>{products[2].features.join(' ')}</p>
        </div>
        <div>
          <p className="plan-price">
            {money(products[2].once)} <small>MXN · pago único</small>
          </p>
          <button className="button button-outline" onClick={() => choose(products[2])}>
            Añadir programa
          </button>
          <p>Fechas y facilitador por confirmar. No reservamos cupos todavía.</p>
        </div>
      </article>
      <section className="bf-checkout" id="carrito" aria-labelledby="cart-title">
        <div>
          <p className="eyebrow">TU FORMACIÓN</p>
          <h2 id="cart-title" tabIndex="-1" ref={checkout}>
            Tu carrito.
          </h2>
          <ol className="bf-checkout-steps" aria-label="Proceso de compra">
            <li aria-current={step === 'cart' ? 'step' : undefined}>
              <span>01</span>Selección
            </li>
            <li aria-current={step === 'payment' ? 'step' : undefined}>
              <span>02</span>Método de pago
            </li>
            <li>
              <span>03</span>Confirmación
            </li>
          </ol>
          <p className="bf-proposal">
            Vista previa comercial. Puedes preparar tu selección; los cobros todavía no están
            abiertos.
          </p>
          <p className="bf-status" role="status">
            {notice}
          </p>
          {cart.length ? (
            <>
              <ul className="bf-cart-items">
                {cart.map(i => {
                  const p = products.find(p => p.id === i.id);
                  return (
                    <li key={i.id}>
                      <div>
                        <strong>{p.name}</strong>
                        <span>
                          {i.period === 'annual'
                            ? '365 días'
                            : i.period === 'monthly'
                              ? '30 días'
                              : 'Programa de 4 semanas'}{' '}
                          · {money(p[i.period])} MXN
                        </span>
                      </div>
                      <button
                        className="bf-text-button"
                        onClick={() => update(cart.filter(x => x.id !== i.id))}
                        aria-label={`Quitar ${p.name}`}
                      >
                        Quitar
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="bf-total">
                <span>Total propuesto</span>
                <strong>{money(cartTotal(cart))} MXN</strong>
              </div>
              <p>
                Importe de referencia para revisar la oferta. El total definitivo y sus condiciones
                aparecerán antes de contratar.
              </p>
              {step === 'cart' && (
                <button className="button button-primary" onClick={() => setStep('payment')}>
                  Elegir método de pago
                </button>
              )}
            </>
          ) : (
            <p className="bf-empty">
              Tu carrito está vacío. Elige una membresía o el programa intensivo para revisar la
              propuesta.
            </p>
          )}
        </div>
        <div className="bf-payment">
          <h3>{step === 'payment' ? 'Cómo quieres pagar' : 'Pagos con seguimiento'}</h3>
          {step === 'payment' && cart.length > 0 ? (
            <>
              <fieldset>
                <legend>Método de pago previsto</legend>
                <label>
                  <input
                    type="radio"
                    name="method"
                    value="transfer"
                    checked={method === 'transfer'}
                    onChange={() => setMethod('transfer')}
                  />
                  <span>
                    <strong>Transferencia bancaria</strong>
                    <small>MXN · referencia única · revisión del abono</small>
                  </span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="method"
                    value="btc"
                    checked={method === 'btc'}
                    onChange={() => setMethod('btc')}
                  />
                  <span>
                    <strong>Bitcoin</strong>
                    <small>BTC · red Bitcoin · cotización con vencimiento</small>
                  </span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="method"
                    value="binance_pay"
                    checked={method === 'binance_pay'}
                    onChange={() => setMethod('binance_pay')}
                  />
                  <span>
                    <strong>Binance Pay</strong>
                    <small>BTC o USDT · enlace personal · revisión manual</small>
                  </span>
                </label>
              </fieldset>
              {method === 'binance_pay' && (
                <label className="bf-asset-picker">
                  Activo previsto
                  <select value={asset} onChange={event => setAsset(event.target.value)}>
                    <option value="USDT">USDT</option>
                    <option value="BTC">BTC</option>
                  </select>
                </label>
              )}
              <p>
                {method === 'transfer'
                  ? 'El pedido real mostrará beneficiario, banco, CLABE, importe y referencia. Reportar una transferencia no equivale a confirmar su recepción.'
                  : method === 'btc'
                    ? 'Se solicitará una cotización en BTC con dirección, importe exacto, red y plazo. El acceso se activa al verificar el abono. Tu wallet o exchange puede cobrar una comisión adicional.'
                    : 'Se solicitará una cotización en el activo elegido. El pedido mostrará importe exacto, destinatario, enlace y plazo. La transferencia se verifica manualmente en Binance Pay antes de activar el acceso.'}
              </p>
              {live ? (
                <a className="button button-primary" href={privateUrl}>
                  Continuar en AFORTU OS
                </a>
              ) : (
                <div className="bf-proposal">
                  <strong>Recepción de pagos pendiente de activar</strong>
                  <p>El receptor y las condiciones aún no están habilitados para cobrar.</p>
                </div>
              )}
              <button className="button button-outline" onClick={exportQuote}>
                Descargar mi propuesta
              </button>
              <button className="bf-text-button" onClick={() => setStep('cart')}>
                Volver al carrito
              </button>
            </>
          ) : (
            <ol>
              <li>Eliges tu formación y revisas el total.</li>
              <li>Tu pedido recibe instrucciones de pago.</li>
              <li>Reportas tu transferencia bancaria, BTC o pago por Binance Pay.</li>
              <li>Confirmamos el abono y la vigencia de tu acceso.</li>
            </ol>
          )}
          <p className="bf-fine">
            USDT se prevé sólo mediante Binance Pay personal con revisión manual. USDT en cadena,
            tarjetas y conexión de wallets requieren otra integración. Conectar una wallet no prueba
            un pago.
          </p>
        </div>
      </section>
    </>
  );
}
createRoot(document.getElementById('memberships-root')).render(<Memberships />);
