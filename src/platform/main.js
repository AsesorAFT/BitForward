import './style.css';
import orbit from '../../assets/brand/orbital-mission-v2.webp';
import astronaut from '../../assets/brand/pilot-astronaut-v3.webp';
import { CATALOG, MARKETS, filterCatalog, capabilities } from '../token-demo/catalog.mjs';
import {
  restore,
  freshState,
  balances,
  assetInfo,
  format,
  PAIRS,
  settleDemo,
} from '../token-demo/model.mjs';

const $ = selector => document.querySelector(selector);
const content = $('#content');
const storageKey = 'bitforward-platform-v1';
const icons = {
  inicio:
    '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  mercados: '<path d="M3 17l5-6 4 3 8-10M15 4h5v5M3 21h18"/>',
  comprar: '<path d="M4 7h15l-4-4M20 17H5l4 4M19 7l-4 4M5 17l4-4"/>',
  futuros: '<path d="M5 3v18M2 7h6v7H2M16 3v18M13 10h6v7h-6"/>',
  wallet: '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 8V5l14-3v3M21 11h-6v5h6"/>',
  portafolio: '<path d="M12 3v9h9A9 9 0 1 1 12 3Z"/><path d="M16 3a8 8 0 0 1 5 5h-5Z"/>',
  academia: '<path d="M2 8l10-5 10 5-10 5Z M6 10v6q6 5 12 0v-6M22 8v9"/>',
  comunidad:
    '<circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 15q4 0 4 6"/>',
  cuenta: '<circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/>',
};
const icon = name =>
  `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.mercados}</svg>`;
const routes = {
  inicio: 'Inicio',
  mercados: 'Mercados',
  comprar: 'Comprar tokens',
  futuros: 'Futuros perpetuos',
  wallet: 'Wallet',
  portafolio: 'Portafolio',
  academia: 'Academia',
  comunidad: 'Comunidad',
  cuenta: 'Mi espacio',
};
const escape = text =>
  String(text).replace(
    /[&<>"']/g,
    char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
  );
let preferences = { favorites: [], lessons: [], notes: '' };
try {
  const p = JSON.parse(localStorage.getItem(storageKey));
  if (p)
    preferences = {
      favorites: Array.isArray(p.favorites)
        ? p.favorites.filter(k => CATALOG.some(x => x.key === k))
        : [],
      lessons: Array.isArray(p.lessons) ? p.lessons.filter(x => [0, 1, 2].includes(x)) : [],
      notes: typeof p.notes === 'string' ? p.notes.slice(0, 5000) : '',
    };
} catch {
  /* A new local workspace remains usable. */
}
function savePreferences() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(preferences));
    return true;
  } catch {
    toast('El navegador no permite guardar el progreso. Puedes descargarlo.');
    return false;
  }
}
function demoState() {
  try {
    return restore(sessionStorage.getItem('bitforward-token-demo-v1'));
  } catch {
    toast('No pudimos recuperar el ejercicio. Abre la práctica para revisarlo.');
    return freshState();
  }
}
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  setTimeout(() => $('#toast').classList.remove('visible'), 4000);
}
const badge = text => `<span class="tag">${text}</span>`;
const header = (eyebrow, title, description, extra = '') =>
  `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="lede">${description}</p></div>${extra}</div>`;
function download(name, data) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('#nav').innerHTML = Object.entries(routes)
  .filter(([key]) => key !== 'cuenta')
  .map(
    ([key, label]) =>
      `<a href="#${key}" data-route="${key}">${icon(key)}<span>${label}</span>${key === 'comprar' ? '<small>DEMO</small>' : ''}</a>`
  )
  .join('');
const mobileNavigation = matchMedia('(max-width: 800px)');
function setNavigation(expanded) {
  $('#navigation').classList.toggle('open', expanded);
  $('#menu').setAttribute('aria-expanded', String(expanded));
  $('#menu').setAttribute('aria-label', expanded ? 'Cerrar navegación' : 'Abrir navegación');
  $('#navigation').inert = mobileNavigation.matches && !expanded;
}
$('#menu').onclick = () => setNavigation($('#menu').getAttribute('aria-expanded') !== 'true');
mobileNavigation.addEventListener('change', () => {
  const focusWasInside = $('#navigation').contains(document.activeElement);
  setNavigation(false);
  if (mobileNavigation.matches && focusWasInside) $('#menu').focus();
});
setNavigation(false);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && $('#navigation').classList.contains('open')) {
    setNavigation(false);
    $('#menu').focus();
  }
});

function home() {
  content.innerHTML =
    header(
      'TU CENTRO DE OPERACIONES',
      'Tu espacio de trading.',
      'Mercados, práctica y aprendizaje. Tú marcas el siguiente paso.',
      badge('TRADING LAB · DEMO')
    ) +
    `
 <section class="hero"><img src="${orbit}" alt="" class="hero-orbit"><div class="hero-copy"><span class="pill"><span class="status-dot"></span> BITFORWARD / PRIMERA TRIPULACIÓN</span><h2>Entiende el mercado.<br><em>Explora lo que sigue.</em></h2><p>Del primer concepto a tu primer intercambio de práctica. Una ruta para avanzar con criterio.</p><div class="actions"><a class="button primary" href="#academia">Comenzar mi ruta <span>↗</span></a><a class="button quiet" href="#mercados">Explorar mercados →</a></div></div><div class="orbital-label"><span>BF—01</span><i></i><small>ACADEMIA · MERCADOS · WALLET</small></div></section>
 <div class="stats"><div><span>Mercados en el catálogo</span><strong>43 <small>entradas</small></strong></div><div><span>Modalidades</span><strong>04 <small>por explorar</small></strong></div><div><span>Mis favoritos</span><strong>${String(preferences.favorites.length).padStart(2, '0')} <small>guardados aquí</small></strong></div><div><span>Mi ruta inicial</span><strong>${preferences.lessons.length}<small> / 3 lecciones</small></strong></div></div>
 <div class="section-heading"><h2>Un espacio para cada paso</h2><span class="muted">Explora la plataforma</span></div>
 <div class="module-grid">${[
   [
     'academia',
     '01',
     'Aprende a tu ritmo',
     'Conceptos claros, ejercicios y una ruta que guarda tu avance.',
     'Abrir academia',
   ],
   [
     'comprar',
     '02',
     'Tu primer intercambio',
     'Elige un activo, revisa los costes y sigue el resultado demo.',
     'Practicar compra',
   ],
   [
     'wallet',
     '03',
     'Conoce tu wallet',
     'Consulta los activos ficticios de tu sesión y aprende a cuidarlos.',
     'Ver mi wallet',
   ],
   [
     'futuros',
     '04',
     'Entiende los perpetuos',
     'Explora los contratos y cómo el apalancamiento cambia el resultado.',
     'Abrir laboratorio',
   ],
 ]
   .map(
     ([route, n, title, desc, cta]) =>
       `<a class="module" href="#${route}"><div class="module-top">${icon(route)}<span>${n}</span></div><h3>${title}</h3><p>${desc}</p><span class="module-link">${cta} <b>↗</b></span></a>`
   )
   .join('')}</div>
 <div class="bottom-grid"><section class="panel"><div class="section-heading"><h2>En tu radar</h2><a href="#mercados">Ver catálogo ↗</a></div>${[
   'BTC',
   'BTW',
   'EVAA',
 ]
   .map(symbol => {
     const x = CATALOG.find(i => i.base === symbol);
     return `<a class="radar-row" href="#mercados?q=${symbol}"><span class="token-symbol">${symbol.slice(0, 2)}</span><span><strong>${symbol}</strong><small>${MARKETS[x.market]}</small></span><span class="muted">${x.market === 'spot' ? 'Práctica disponible' : 'Explorar'}</span><b>↗</b></a>`;
   })
   .join(
     ''
   )}</section><section class="panel route-panel"><p class="eyebrow">DE LA TEORÍA A LA PRÁCTICA</p><h2>Tu primera misión,<br>paso a paso.</h2><div class="progress-track"><span style="width:${(preferences.lessons.length / 3) * 100}%"></span></div><p>${preferences.lessons.length} de 3 lecciones completadas en este navegador.</p><a class="button secondary" href="#academia">Continuar mi ruta →</a></section></div>`;
}
let market = 'all',
  query = '',
  onlyFavorites = false;
function markets(params) {
  market = params.get('market') in MARKETS ? params.get('market') : 'all';
  query = params.get('q') || '';
  onlyFavorites = false;
  content.innerHTML =
    header(
      'DESCUBRE / SIGUE / COMPARA',
      'Mercados',
      'Tu selección de activos, organizada por tipo de mercado.',
      badge('CATÁLOGO DE PRÁCTICA')
    ) +
    `<section class="panel market-panel"><div class="market-toolbar"><label class="search-field"><span>⌕</span><input id="market-search" type="search" placeholder="Buscar BTC, BTW, 0G…" aria-label="Buscar mercados" value="${escape(query)}"></label><button class="button secondary" id="favorites-toggle" aria-pressed="false">☆ Mis favoritos</button></div><div class="filter-row" role="group" aria-label="Tipo de mercado">${[['all', 'Todos'], ...Object.entries(MARKETS)].map(([key, label]) => `<button data-market="${key}" aria-pressed="${key === market}">${label}</button>`).join('')}</div><div class="table-meta"><span id="market-count" role="status"></span><span>Precios reales aún no conectados</span></div><div class="market-list" id="market-list"></div></section><dialog id="instrument-dialog" aria-labelledby="instrument-title"></dialog>`;
  $('#market-search').oninput = e => {
    query = e.target.value;
    renderMarkets();
  };
  $('#favorites-toggle').onclick = () => {
    onlyFavorites = !onlyFavorites;
    $('#favorites-toggle').setAttribute('aria-pressed', onlyFavorites);
    renderMarkets();
  };
  document.querySelectorAll('[data-market]').forEach(
    b =>
      (b.onclick = () => {
        market = b.dataset.market;
        document
          .querySelectorAll('[data-market]')
          .forEach(x => x.setAttribute('aria-pressed', x === b));
        renderMarkets();
      })
  );
  renderMarkets();
}
function renderMarkets() {
  const entries = filterCatalog(query, market).filter(
    x => !onlyFavorites || preferences.favorites.includes(x.key)
  );
  $('#market-count').textContent = `${entries.length} de ${CATALOG.length} mercados`;
  $('#market-list').innerHTML =
    `<div class="market-row table-head"><span>Favorito</span><span>Instrumento</span><span>Mercado</span><span>Disponible en esta versión</span><span></span></div>` +
    entries
      .map(
        x =>
          `<div class="market-row"><button class="star" data-favorite="${escape(x.key)}" aria-label="${preferences.favorites.includes(x.key) ? 'Quitar' : 'Guardar'} ${x.base} ${MARKETS[x.market]} en favoritos" aria-pressed="${preferences.favorites.includes(x.key)}">${preferences.favorites.includes(x.key) ? '★' : '☆'}</button><div class="instrument-name"><span class="token-symbol color-${x.market}">${escape(x.base.slice(0, 2))}</span><span><strong>${escape(x.base)}${x.quote ? '<small> / USDT</small>' : ''}</strong><small>${escape(x.name || (x.market === 'alpha' ? 'Selección Alpha' : x.instrumentId))}</small></span></div><span class="market-type">${MARKETS[x.market]}</span><span class="available">${capabilities(x).practice ? '<i></i> Práctica Spot' : 'Solo exploración'}</span><button class="text-button" data-instrument="${escape(x.key)}">Explorar <span>↗</span></button></div>`
      )
      .join('') +
    (!entries.length
      ? '<p class="empty">No hay coincidencias. Cambia el filtro o guarda un favorito.</p>'
      : '');
  document.querySelectorAll('[data-favorite]').forEach(
    b =>
      (b.onclick = () => {
        const key = b.dataset.favorite;
        preferences.favorites = preferences.favorites.includes(key)
          ? preferences.favorites.filter(x => x !== key)
          : [...preferences.favorites, key];
        savePreferences();
        renderMarkets();
      })
  );
  document
    .querySelectorAll('[data-instrument]')
    .forEach(b => (b.onclick = () => showInstrument(b.dataset.instrument)));
}
function showInstrument(key) {
  const x = CATALOG.find(item => item.key === key);
  const dialog = $('#instrument-dialog');
  const practice = capabilities(x).practice;
  const descriptions = {
    alpha:
      'Sigue este token en tu lista. La compra estará disponible cuando se verifiquen su red y contrato.',
    futures:
      'Contrato perpetuo: explora su categoría y practica cómo cambia el resultado de una posición en el laboratorio.',
    bstocks:
      'Valor tokenizado: consulta su categoría. La disponibilidad de compra se confirmará con el proveedor.',
    spot: 'Practica el intercambio con activos ficticios. Revisa importe y costes antes de confirmar cada paso.',
  };
  const related = CATALOG.filter(item => item.base === x.base && item.key !== x.key);
  const description =
    x.base === 'IBKR' && x.market === 'futures'
      ? 'Contrato perpetuo sobre Interactive Brokers. No equivale a comprar acciones de la empresa.'
      : x.base === 'SOXSB'
        ? 'Producto tokenizado ligado a un ETF inverso apalancado 3X. Su comportamiento difiere del de una acción ordinaria.'
        : descriptions[x.market];
  dialog.innerHTML = `<button class="close-dialog" aria-label="Cerrar ficha">×</button><p class="eyebrow">FICHA DE MERCADO / ${MARKETS[x.market]}</p><div class="instrument-heading"><span class="token-symbol color-${x.market}">${escape(x.base.slice(0, 2))}</span><div><h2 id="instrument-title" tabindex="-1">${escape(x.base)}${x.quote ? ' / USDT' : ''}</h2><p>${escape(x.name || (x.market === 'futures' ? 'Contrato perpetuo' : MARKETS[x.market]))}</p></div></div><span class="instrument-state">${practice ? 'Práctica Spot disponible' : 'Solo exploración'}</span><div class="info-block">${description}</div><dl class="compact"><dt>Tipo de mercado</dt><dd>${MARKETS[x.market]}</dd><dt>Precios</dt><dd>${practice ? 'Sintéticos · ejercicio demo' : 'Sin conexión en directo'}</dd><dt>Compra real</dt><dd>No habilitada</dd></dl><div class="instrument-actions"><button class="button secondary" id="detail-favorite" aria-pressed="${preferences.favorites.includes(key)}">${preferences.favorites.includes(key) ? '★ En favoritos' : '☆ Guardar en favoritos'}</button>${practice ? `<a class="button primary" href="#comprar?instrument=${encodeURIComponent(x.key)}">Practicar con ${escape(x.base)} ↗</a>` : x.market === 'futures' ? '<a class="button primary" href="#futuros">Abrir laboratorio ↗</a>' : '<button class="button secondary" id="close-detail">Volver al catálogo</button>'}</div>${related.length ? `<div class="related-markets"><p>OTROS MERCADOS DE ${escape(x.base)}</p>${related.map(item => `<button class="related-market" data-related="${escape(item.key)}"><span>${escape(item.base)}${item.quote ? ' / USDT' : ''}<small>${MARKETS[item.market]} · ${item.market === 'spot' ? 'Práctica' : 'Exploración'}</small></span><span aria-hidden="true">↗</span></button>`).join('')}</div>` : ''}`;
  dialog.querySelector('.close-dialog').onclick = () => dialog.close();
  dialog.querySelector('#close-detail')?.addEventListener('click', () => dialog.close());
  dialog.querySelector('#detail-favorite').onclick = e => {
    const saved = !preferences.favorites.includes(key);
    preferences.favorites = saved
      ? [...preferences.favorites, key]
      : preferences.favorites.filter(k => k !== key);
    savePreferences();
    e.currentTarget.setAttribute('aria-pressed', String(saved));
    e.currentTarget.textContent = saved ? '★ En favoritos' : '☆ Guardar en favoritos';
    renderMarkets();
  };
  dialog.querySelectorAll('[data-related]').forEach(button => {
    button.onclick = () => {
      showInstrument(button.dataset.related);
      $('#instrument-title').focus();
    };
  });
  dialog.onclose = () => document.querySelector(`[data-instrument="${CSS.escape(key)}"]`)?.focus();
  if (!dialog.open) dialog.showModal();
}
function buy(params) {
  const key = params.get('instrument');
  const x = CATALOG.find(i => i.key === key && capabilities(i).practice);
  content.innerHTML =
    header(
      'EXCHANGE / PRÁCTICA SPOT',
      'Compra e intercambio',
      'Aprende a revisar el importe, las comisiones y el resultado de una operación.',
      badge('SIMULACIÓN')
    ) +
    `<div class="notice"><span class="status-dot"></span> Los activos son ficticios. La práctica no abre una wallet ni solicita firmas.</div><iframe class="trade-frame" id="trade-frame" title="Simulador de compra e intercambio BitForward" src="./prototipo-tokens.html?embed=1${x ? '&instrument=' + encodeURIComponent(x.key) : ''}"></iframe>`;
  const frame = $('#trade-frame');
  const fit = () => {
    try {
      frame.style.height = frame.contentDocument.body.scrollHeight + 20 + 'px';
    } catch {
      /* Only same-origin demo content. */
    }
  };
  frame.onload = () => {
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame.contentDocument.body);
    frame._observer = observer;
  };
}
function holdings(kind) {
  const state = demoState();
  const available = balances(state);
  content.innerHTML =
    header(
      'MI ESPACIO / PRÁCTICA',
      kind === 'wallet' ? 'Tu wallet de práctica' : 'Tu portafolio de práctica',
      'Los movimientos y activos ficticios del ejercicio abierto en esta pestaña.',
      badge('ACTIVOS DEMO')
    ) +
    `<div class="notice">La wallet real se conectará en una etapa posterior. Aquí no se reciben depósitos.</div><div class="asset-grid">${Object.entries(
      available
    )
      .map(([asset, value]) => {
        const info = assetInfo(asset);
        return `<section class="asset-card"><p>${escape(info.label)} <span>DEMO</span></p><strong>${escape(format(value, info.decimals))}</strong><small>Unidades ficticias disponibles</small></section>`;
      })
      .join(
        ''
      )}</div><div class="actions"><a href="#comprar" class="button primary">Practicar intercambio ↗</a><button id="export-history" class="button secondary">Descargar historial</button></div><section class="panel history-panel"><div class="section-heading"><h2>Actividad de esta sesión</h2><span>${state.history.length} operaciones demo</span></div><div id="activity" aria-live="polite">${
      state.history.length
        ? state.history
            .map(row => {
              const p = PAIRS[row.quote.pairId];
              return `<article class="history-row"><div><strong>${row.id}</strong><small>${escape(format(row.quote.input, p.decimals))} ${p.input} → ${escape(format(row.quote.output, p.outputDecimals))} ${p.output} sintético</small></div><span class="tag">${{ confirmed: 'Confirmada · demo', pending: 'Pendiente · demo', failed: 'Fallida · sin cargo', rejected: 'Rechazada · sin cargo' }[row.status]}</span></article>`;
            })
            .join('')
        : '<div class="empty"><span class="empty-icon">↔</span><h3>Aquí empieza tu historial</h3><p>Completa un intercambio de práctica para ver su resultado y los activos de salida.</p><a href="#comprar">Ir al simulador →</a></div>'
    }</div></section>${kind === 'wallet' ? '<section class="panel learn-note"><h2>Antes de conectar una wallet real</h2><p>Una wallet permite firmar operaciones. La red, el token y el contrato deben coincidir. Tu frase de recuperación es privada: BitForward nunca te la pedirá.</p><a href="#academia">Aprender sobre wallets →</a></section>' : ''}`;
  $('#export-history').onclick = () =>
    download('bitforward-historial-demo.json', {
      environment: 'simulation',
      exportedAt: new Date().toISOString(),
      ...state,
    });
}
const lessons = [
  {
    title: 'Tu wallet y tus claves',
    time: '4 min',
    text: 'La wallet permite consultar activos y autorizar operaciones con una clave. Conectar una wallet no equivale a transferir fondos. Antes de firmar, revisa la red, el destinatario, el importe y los permisos. Nunca compartas tu frase de recuperación.',
    question: '¿Qué debes mantener siempre privado?',
    options: [
      'La dirección pública de recepción',
      'La frase de recuperación',
      'El nombre de la red',
    ],
    answer: 1,
  },
  {
    title: 'Qué hace un smart contract',
    time: '5 min',
    text: 'Un contrato inteligente es un programa que se ejecuta en una blockchain. Puede intercambiar activos o aplicar reglas, pero su código no garantiza seguridad ni ganancias. Autorizar el uso de un token y ejecutar una compra pueden ser pasos distintos; revisa a quién das permiso y por cuánto.',
    question: '¿Un smart contract garantiza ganancias?',
    options: [
      'Sí, porque es automático',
      'No, puede tener errores y riesgos',
      'Solo cuando el token es popular',
    ],
    answer: 1,
  },
  {
    title: 'Revisa antes de confirmar',
    time: '5 min',
    text: 'Compara el importe de entrada, la comisión, el coste de red y el mínimo que recibirías. Una cotización puede caducar. Una operación pendiente aún no confirma recepción; un rechazo no es una compra. En esta demo todo sucede con unidades ficticias.',
    question: 'Una operación pendiente significa…',
    options: [
      'Que ya recibiste los tokens',
      'Que el precio queda garantizado',
      'Que todavía falta confirmar su resultado',
    ],
    answer: 2,
  },
];
function academy() {
  content.innerHTML =
    header(
      'ACADEMIA / RUTA INICIAL',
      'Conocimiento antes de acción.',
      'Tres lecciones para entrar con confianza a tu primer ejercicio.',
      badge(`${preferences.lessons.length} / 3 COMPLETADAS`)
    ) +
    `<section class="academy-banner"><div><p class="eyebrow">MISIÓN DE INICIO</p><h2>Tu primera órbita.</h2><p>Entiende la wallet, conoce los contratos y revisa cada paso antes de confirmar.</p><div class="progress-track"><span style="width:${(preferences.lessons.length / 3) * 100}%"></span></div><small>Progreso guardado solo en este navegador.</small></div><img src="${astronaut}" alt="Astronauta de BitForward" loading="lazy"></section><div class="lesson-grid">${lessons.map((l, i) => `<button class="lesson-card" data-lesson="${i}"><span class="lesson-number">0${i + 1}</span><span class="tag">${preferences.lessons.includes(i) ? 'Completada' : l.time}</span><h3>${l.title}</h3><span class="module-link">${preferences.lessons.includes(i) ? 'Repasar lección' : 'Comenzar'} ↗</span></button>`).join('')}</div><section id="lesson-detail" class="panel" hidden></section><div class="actions"><a class="button secondary" href="#comprar">Pasar al ejercicio de compra →</a><a class="text-button" href="https://app.afortu.com.mx/academia-bitforward/primera-mision" target="_blank" rel="noopener">Abrir misión publicada ↗</a></div>`;
  document
    .querySelectorAll('[data-lesson]')
    .forEach(b => (b.onclick = () => lesson(Number(b.dataset.lesson))));
}
function lesson(index) {
  const l = lessons[index],
    panel = $('#lesson-detail');
  panel.hidden = false;
  panel.innerHTML = `<p class="eyebrow">LECCIÓN 0${index + 1}</p><h2>${l.title}</h2><p class="lesson-text">${l.text}</p><form id="quiz"><fieldset><legend>${l.question}</legend>${l.options.map((o, i) => `<label class="quiz-option"><input type="radio" name="answer" value="${i}" required> ${o}</label>`).join('')}</fieldset><button class="button primary">Comprobar respuesta</button><p id="quiz-result" role="status"></p></form>`;
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('#quiz').onsubmit = e => {
    e.preventDefault();
    const selected = Number(new FormData(e.target).get('answer'));
    if (selected === l.answer) {
      if (!preferences.lessons.includes(index)) preferences.lessons.push(index);
      const saved = savePreferences();
      $('#quiz-result').textContent = saved
        ? 'Correcto. Lección completada y progreso guardado.'
        : 'Correcto. Lección completada en esta vista; no se pudo guardar.';
      document.querySelector(`[data-lesson="${index}"] .tag`).textContent = 'Completada';
    } else
      $('#quiz-result').textContent = 'Todavía no. Revisa la explicación y vuelve a intentarlo.';
  };
}
function futures() {
  content.innerHTML =
    header(
      'LABORATORIO / FUTUROS',
      'Comprende el apalancamiento.',
      'Compara escenarios antes de aprender a operar contratos perpetuos.',
      badge('CALCULADORA EDUCATIVA')
    ) +
    `<div class="two-column"><section class="panel"><h2>Construye un escenario</h2><form id="futures-form" class="calculator"><label>Dirección<select name="side"><option value="1">Largo · sube el precio</option><option value="-1">Corto · baja el precio</option></select></label><label>Margen ficticio · USDT<input name="margin" type="number" value="100" min="1" max="1000000" step="0.01" required></label><label>Apalancamiento · <output id="leverage-value">2×</output><input name="leverage" type="range" min="1" max="20" value="2"></label><label>Precio de entrada hipotético<input name="entry" type="number" value="50000" min="0.01" step="0.01" required></label><label>Precio de salida hipotético<input name="exit" type="number" value="50500" min="0.01" step="0.01" required></label><button class="button primary">Calcular escenario</button></form></section><section class="panel scenario-panel"><p class="eyebrow">RESULTADO ILUSTRATIVO</p><h2>El precio cambia.<br>La exposición también.</h2><div id="futures-result" role="status" class="scenario-result"></div><p>No incluye comisiones, funding ni liquidación. No representa una operación ejecutable ni un precio de mercado. Si la pérdida consume el margen, una posición real puede liquidarse antes.</p><a href="#mercados?market=futures" class="button secondary">Explorar 14 contratos →</a></section></div>`;
  const form = $('#futures-form');
  form.leverage.oninput = () => {
    $('#leverage-value').value = form.leverage.value + '×';
  };
  const calc = () => {
    const f = new FormData(form),
      m = Number(f.get('margin')),
      lev = Number(f.get('leverage')),
      entry = Number(f.get('entry')),
      exit = Number(f.get('exit')),
      side = Number(f.get('side'));
    if (!form.checkValidity() || ![m, lev, entry, exit].every(Number.isFinite)) return;
    const pnl = m * lev * (exit / entry - 1) * side;
    $('#futures-result').innerHTML =
      `<span>Resultado bruto hipotético</span><strong class="${pnl >= 0 ? 'positive' : 'negative'}">${pnl >= 0 ? '+' : ''}${pnl.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <small>USDT demo</small></strong><dl class="compact"><dt>Exposición inicial</dt><dd>${(m * lev).toLocaleString('es-MX')} USDT demo</dd><dt>Resultado / margen</dt><dd>${((pnl / m) * 100).toFixed(2)} %</dd></dl>`;
  };
  form.onsubmit = e => {
    e.preventDefault();
    calc();
  };
  calc();
}
function community() {
  content.innerHTML =
    header(
      'COMUNIDAD / BITÁCORA PERSONAL',
      'Aprender también es compartir.',
      'Prepara tus preguntas y registra lo que aprendiste en la práctica.',
      badge('ESPACIO PERSONAL')
    ) +
    `<div class="community-top"><section class="panel"><p class="eyebrow">PRIMERA TRIPULACIÓN</p><h2>Un lugar para tus descubrimientos.</h2><p>Guarda tus notas aquí y llévalas a la próxima sesión. Los grupos y las conversaciones compartidas se habilitarán en una etapa posterior.</p><div class="topic-list"><span>Wallets y seguridad</span><span>Mi primer intercambio</span><span>Lectura de mercados</span></div></section><section class="panel"><p class="eyebrow">ALCANCE ACTUAL</p><h3>Tu bitácora es privada y local.</h3><p>Estas notas permanecen en este navegador. No se publican, no se envían a un asesor y no hay otros participantes conectados.</p></section></div><section class="panel notebook"><label for="notes">¿Qué entendiste, qué te costó y qué quieres preguntar?</label><textarea id="notes" maxlength="5000" rows="7" placeholder="Hoy aprendí…">${escape(preferences.notes)}</textarea><div class="actions"><button class="button primary" id="save-notes">Guardar mi bitácora</button><button class="button secondary" id="export-notes">Descargar notas</button></div><p id="notes-status" role="status"></p></section>`;
  $('#save-notes').onclick = () => {
    preferences.notes = $('#notes').value;
    if (savePreferences()) $('#notes-status').textContent = 'Bitácora guardada en este navegador.';
  };
  $('#export-notes').onclick = () =>
    download('bitforward-bitacora.json', {
      type: 'personal-local-notes',
      notes: $('#notes').value,
      exportedAt: new Date().toISOString(),
    });
}
function account() {
  content.innerHTML =
    header(
      'AJUSTES / AYUDA',
      'Tu espacio, bajo tu control.',
      'Consulta qué está activo y conserva tus ejercicios.',
      badge('VISTA PREVIA')
    ) +
    `<div class="two-column"><section class="panel"><h2>Disponible ahora</h2><ul class="feature-list"><li>43 mercados con buscador y favoritos</li><li>Intercambios Spot con activos ficticios</li><li>Wallet e historial del ejercicio</li><li>Ruta inicial con preguntas de comprensión</li><li>Calculadora de perpetuos y bitácora personal</li></ul><button class="button secondary" id="export-all">Descargar mi progreso</button></section><section class="panel"><h2>Próximas conexiones</h2><ul class="feature-list"><li>Identidad y acceso personal entre dispositivos</li><li>Wallet de prueba y confirmación en blockchain</li><li>Precios reales y proveedor de ejecución</li><li>Conversaciones compartidas y soporte</li></ul><p>Esta versión no acepta dinero, depósitos, claves privadas ni órdenes reales.</p></section></div><section class="panel faq"><h2>Preguntas frecuentes</h2><details><summary>¿Puedo comprar tokens reales aquí?</summary><p>Todavía no. El recorrido permite ensayar costes, errores y confirmaciones con activos ficticios.</p></details><details><summary>¿Dónde se guarda mi progreso?</summary><p>Favoritos, lecciones y notas en este navegador. Las operaciones demo se conservan al recargar esta pestaña; cerrarla puede finalizar esa sesión. Puedes descargar tu historial.</p></details><details><summary>¿Por qué un símbolo aparece dos veces?</summary><p>Un token al contado y un contrato perpetuo son instrumentos diferentes. BTW Alpha y BTWUSDT perpetuo se conservan por separado.</p></details></section>`;
  $('#export-all').onclick = () =>
    download('bitforward-progreso-demo.json', {
      environment: 'simulation',
      preferences,
      exercise: demoState(),
      exportedAt: new Date().toISOString(),
    });
}
function renderRoute() {
  const [routeName, search = ''] = location.hash.slice(1).split('?');
  const route = Object.hasOwn(routes, routeName) ? routeName : 'inicio';
  $('#trade-frame')?._observer?.disconnect();
  $('#crumb').textContent = routes[route];
  document.title = `${routes[route]} · BitForward`;
  document.querySelectorAll('[data-route]').forEach(a => {
    if (a.dataset.route === route) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  setNavigation(false);
  ({
    inicio: home,
    mercados: markets,
    comprar: buy,
    wallet: () => holdings('wallet'),
    portafolio: () => holdings('portafolio'),
    academia: academy,
    futuros: futures,
    comunidad: community,
    cuenta: account,
  })[route](new URLSearchParams(search));
  window.scrollTo(0, 0);
  content.focus({ preventScroll: true });
}
window.addEventListener('hashchange', renderRoute);
renderRoute();

// The iframe owns the active form. Once it unmounts, the shell completes only
// already submitted synthetic operations, using the same deterministic engine.
let settlementErrorReported = false;
function reconcilePendingDemo() {
  if ($('#trade-frame')) return;
  try {
    const state = restore(sessionStorage.getItem('bitforward-token-demo-v1'));
    const next = settleDemo(state, Date.now());
    if (next === state) return;
    sessionStorage.setItem('bitforward-token-demo-v1', JSON.stringify(next));
    settlementErrorReported = false;
    const route = location.hash.slice(1).split('?')[0];
    if (['wallet', 'portafolio'].includes(route)) {
      const exportFocused = document.activeElement === $('#export-history');
      holdings(route);
      if (exportFocused) $('#export-history').focus({ preventScroll: true });
    }
  } catch {
    if (!settlementErrorReported) {
      toast('No pudimos actualizar el ejercicio guardado. Vuelve a la práctica para revisarlo.');
      settlementErrorReported = true;
    }
  }
}
setInterval(reconcilePendingDemo, 250);
window.addEventListener('pageshow', reconcilePendingDemo);
