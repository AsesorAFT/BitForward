import { readFileSync, writeFileSync } from 'node:fs';
import { missions, tracks, assets } from '../src/ecosystem/data.mjs';
import { content } from '../src/ecosystem/content.mjs';
const esc = value =>
  String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const toolUrl = (m, base = '.') =>
  `${base}/laboratorio.html?herramienta=${m.tool}${m.asset ? `&amp;activo=${m.asset}` : ''}`;
const head = (title, description, base = '.', path = '', script = 'src/editorial/main.js') =>
  `<!doctype html><html lang="es-MX"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | BitForward — By AFORTU</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#070a13"><meta name="color-scheme" content="dark"><link rel="canonical" href="https://asesoraft.github.io/BitForward/${path}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)} | BitForward"><meta property="og:description" content="${esc(description)}"><link rel="icon" href="${base}/assets/brand/bitforward-app-icon-192.png"><script type="module" src="${base}/${script}"></script></head><body><a class="skip-link" href="#contenido">Saltar al contenido</a>`;
const header = (base = '.') =>
  `<header class="site-header"><a class="brand" href="${base}/" aria-label="BitForward, inicio"><img src="${base}/assets/brand/bitforward-logo-v2.webp" width="1000" height="560" alt="BitForward"><span>BY AFORTU</span></a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav" hidden>Menú <span aria-hidden="true">☰</span></button><nav class="main-nav" id="main-nav" aria-label="Navegación principal"><a href="${base}/misiones.html">Misiones Cripto</a><a href="${base}/laboratorio.html">Laboratorio</a><a href="${base}/atf.html">Aprende con ATF</a><a href="${base}/laboratorio.html?herramienta=bitacora">Mi bitácora</a><a class="nav-community" href="${base}/acceso.html">AFORTU OS ↗</a></nav></header>`;
const footer = (base = '.') =>
  `<footer class="site-footer wrap"><div class="footer-top"><div><a class="footer-brand" href="${base}/">BitForward<span>BY AFORTU</span></a><p>Tu misión cripto empieza con criterio.</p></div><nav aria-label="Comunidad y recursos"><a href="https://www.instagram.com/bitforward_aft/" target="_blank" rel="noopener noreferrer">Instagram ↗<span class="sr-only"> (nueva pestaña)</span></a><a href="${base}/misiones.html">Misiones</a><a href="${base}/laboratorio.html">Laboratorio</a><a href="${base}/membresias.html">Membresías</a></nav></div><div class="footer-bottom"><p>© 2026 BitForward | By AFORTU</p><p>Contenido educativo, no asesoría de inversión. El sitio no conecta wallets ni solicita fondos. Tu progreso y tus notas se guardan sólo en este navegador cuando eliges hacerlo.</p></div></footer></body></html>`;
function checkpoint(m) {
  return `<section class="mission-checkpoint" data-checkpoint="${m.id}" hidden aria-labelledby="checkpoint-title"><p class="eyebrow">COMPRUEBA TU CRITERIO</p><h2 id="checkpoint-title">Antes de la siguiente coordenada.</h2><form><fieldset><legend>${m.question}</legend>${m.options.map((o, i) => `<label class="quiz-option"><input type="radio" name="checkpoint-${m.id}" value="${i}" required><span>${o}</span></label>`).join('')}</fieldset><button class="button button-primary" type="submit">Comprobar y guardar progreso →</button><p class="quiz-feedback" role="status" aria-live="polite"></p><small>Al comprobar una respuesta correcta, guardas el progreso en este navegador. No equivale a una certificación ni se sincroniza con una cuenta.</small></form></section><noscript><p>Activa JavaScript para comprobar la respuesta y guardar tu progreso. Puedes leer toda la misión sin activarlo.</p></noscript>`;
}
function practice(m) {
  return `<section class="mission-practice" aria-labelledby="practice-title"><p class="eyebrow">DE LA MISIÓN AL LABORATORIO</p><h2 id="practice-title">Tu resultado: ${m.deliverable.toLowerCase()}.</h2><p>${m.outcome} Abre la herramienta y aplica lo que acabas de aprender.</p><a class="button button-primary" href="${toolUrl(m, '..')}">Llevarlo a la práctica ↗</a></section>`;
}
function next(m) {
  const n = missions[missions.indexOf(m) + 1];
  return `<nav class="next-mission" aria-label="Continuar explorando"><div><p>${n ? 'SIGUIENTE COORDENADA' : 'RUTA COMPLETADA'}</p><strong>${n ? n.title : 'Vuelve a tu bitácora'}</strong></div><a class="button button-primary" href="${n ? './' + n.slug + '.html' : '../laboratorio.html?herramienta=bitacora'}">${n ? 'Continuar la misión' : 'Registrar mi conclusión'} ↗</a></nav>`;
}
for (const m of missions) {
  const path = `misiones/${m.slug}.html`;
  if (content[m.id]) {
    const c = content[m.id];
    const coin = assets.find(a => a.symbol === m.asset);
    writeFileSync(
      path,
      head(m.title, m.outcome, '..', path) +
        header('..') +
        `<main id="contenido" tabindex="-1"><header class="article-hero wrap"><a class="breadcrumb" href="../misiones.html">← Volver a mi ruta</a><p class="eyebrow">MISIÓN ${m.id} / ${m.topic.toUpperCase()}</p><h1>${m.title}<span class="accent">.</span></h1><p class="article-lead">${c.intro}</p><div class="metadata"><span>${m.track.toUpperCase()}</span><span>${m.minutes} min + práctica</span><span>Revisión: <time datetime="2026-09-25">25 SEP 2026</time></span></div></header><article class="article-content wrap" aria-label="Bitácora de la misión ${m.id}">${coin ? `<p class="coin-name"><img src="../assets/crypto/${coin.symbol.toLowerCase()}.svg" width="42" height="42" alt="">${coin.name} / ${coin.symbol}</p>` : ''}${c.sections.map(([title, text]) => `<h2>${title}</h2><p>${text}</p>`).join('')}${practice(m)}${checkpoint(m)}<section class="article-sources" aria-labelledby="fuentes"><h2 id="fuentes">Fuentes para profundizar</h2><ul>${c.sources.map(([label, url]) => `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗<span class="sr-only"> (nueva pestaña)</span></a></li>`).join('')}</ul><p>Consultadas el 25 de septiembre de 2026. Los ejercicios y el método de trabajo son contenido editorial de BitForward. Las escenas de ATF son una metáfora narrativa.</p></section>${next(m)}<p class="security-disclaimer">Contenido educativo. No es asesoría de inversión ni promesa de rendimiento. No necesitas comprar activos para completar esta misión.</p></article></main><script type="module" src="../src/ecosystem/learning.js"></script>` +
        footer('..')
    );
  } else {
    let html = readFileSync(path, 'utf8')
      .replaceAll('../#misiones', '../misiones.html')
      .replaceAll('#080c0f', '#070a13');
    html = html.replace(/<!-- LEARNING START -->[\s\S]*?<!-- LEARNING END -->/, '');
    html = html.replace(
      '<section class="article-sources"',
      `<!-- LEARNING START -->${practice(m)}${checkpoint(m)}<!-- LEARNING END --><section class="article-sources"`
    );
    html = html.replace(/<nav class="next-mission"[\s\S]*?<\/nav>/, next(m));
    if (!html.includes('src/ecosystem/learning.js'))
      html = html.replace(
        '</body>',
        '<script type="module" src="../src/ecosystem/learning.js"></script></body>'
      );
    writeFileSync(path, html);
  }
}
writeFileSync(
  'misiones.html',
  head(
    'Misiones Cripto',
    'Nueve misiones, tres rutas y herramientas para aprender, analizar y documentar con criterio.',
    '.',
    'misiones.html'
  ) +
    header() +
    `<main class="wrap" id="contenido" tabindex="-1"><div class="portal-hero"><p class="eyebrow">ACADEMIA DE EXPLORACIÓN <span class="access-tag">ACCESO ABIERTO</span></p><h1>Aprende. Ponlo a prueba.<br><em>Hazlo tuyo.</em></h1><p>ATF te acompaña en nueve misiones. Cada una conecta una idea con una herramienta y termina en algo que puedes usar: un cálculo, una ficha o una conclusión escrita.</p></div><div class="learning-progress"><div><strong id="progress-label">0 de 9 comprobaciones completadas</strong><p>Tu avance se guarda en este navegador al responder correctamente una comprobación.</p></div><a class="text-link" href="./laboratorio.html?herramienta=bitacora">Abrir mi bitácora ↗</a><progress id="learning-progress" value="0" max="9" aria-label="Comprobaciones completadas"></progress></div>${tracks
      .map(
        t =>
          `<section class="track-section" id="${t.id}" aria-labelledby="title-${t.id}"><div class="track-heading"><span>${t.number}</span><div><h2 id="title-${t.id}">${t.title}</h2><p>${t.description}</p></div></div><div class="curriculum-grid">${missions
            .filter(m => m.track === t.id)
            .map(
              m =>
                `<a class="curriculum-card" href="./misiones/${m.slug}.html"><div class="metadata"><span>MISIÓN ${m.id} · ${m.topic.toUpperCase()}</span><span>${m.minutes} min</span></div><h3>${m.title}</h3><p>${m.outcome}</p><p class="deliverable"><strong>TE LLEVAS</strong> / ${m.deliverable}</p><span class="mission-status" data-mission-status="${m.id}">Por explorar</span><span class="card-link">Comenzar misión ↗</span></a>`
            )
            .join('')}</div></section>`
      )
      .join(
        ''
      )}<div class="member-banner"><div><p class="eyebrow">UN MÉTODO QUE PUEDE CRECER CONTIGO</p><h2>Tu siguiente paso: el laboratorio.</h2><p>Practica las veces que necesites. Las herramientas gratuitas están disponibles sin registro.</p></div><a class="button button-primary" href="./laboratorio.html">Entrar al laboratorio ↗</a></div></main><script type="module" src="./src/ecosystem/learning.js"></script>` +
    footer()
);
writeFileSync(
  'laboratorio.html',
  head(
    'Laboratorio Cripto',
    'Compara activos, calcula exposición y gas, documenta una tesis y lleva tu bitácora de aprendizaje.',
    '.',
    'laboratorio.html',
    'src/ecosystem/lab.jsx'
  ) +
    header() +
    `<main class="wrap" id="contenido" tabindex="-1"><div class="portal-hero"><p class="eyebrow">LABORATORIO BITFORWARD <span class="access-tag">GRATUITO / SIN REGISTRO</span></p><h1>Convierte curiosidad<br>en <em>criterio.</em></h1><p>Cinco herramientas para entender lo que estás analizando. Trabaja con tus propios supuestos, documenta tus fuentes y llévate el resultado.</p></div><div id="lab-root"><div class="tool-notice"><h2>Tu espacio de trabajo</h2><p>El laboratorio necesita JavaScript para realizar los cálculos y guardar datos locales. Mientras tanto, puedes explorar todas las misiones como artículos de lectura.</p><ul><li>Comparar: Bitcoin, Ethereum, Tether, Cardano, Solana y USDC.</li><li>Exposición: introduce valores en USD y calcula pérdidas bajo dos supuestos explícitos.</li><li>Gas: convierte unidades y precio efectivo en una comisión de Ethereum.</li><li>Ficha: documenta propósito, evidencia, fuente y riesgo.</li><li>Bitácora: guarda notas en este navegador y descarga una copia.</li></ul><p>No hay cotizaciones en vivo, conexión de wallet ni sincronización entre dispositivos.</p><a class="text-link" href="./misiones.html">Explorar las misiones →</a></div></div></main>` +
    footer()
);
writeFileSync(
  'membresias.html',
  head(
    'Membresías',
    'Empieza gratis con Explorador. Conoce la propuesta de membresías para profundizar en el análisis cripto.',
    '.',
    'membresias.html'
  ) +
    header() +
    `<main class="wrap" id="contenido" tabindex="-1"><div class="portal-hero"><p class="eyebrow">UN ECOSISTEMA PARA APRENDER Y TRABAJAR</p><h1>Más método.<br><em>Más criterio propio.</em></h1><p>Empieza con las misiones y herramientas abiertas. Estamos definiendo cómo acompañarte después, con análisis documentado y espacios de aprendizaje.</p></div><div class="plans-grid"><article class="plan plan-live"><p class="eyebrow">DISPONIBLE AHORA</p><h2>Explorador</h2><p>Para dar tus primeros pasos y construir un método.</p><p class="plan-price">Acceso gratuito</p><ul><li>9 misiones con explicación, práctica y comprobación.</li><li>Comparador de 6 activos y calculadoras de gas y exposición.</li><li>Ficha de análisis y bitácora descargables.</li><li>Progreso y notas guardados en tu navegador.</li></ul><a class="button button-primary" href="./misiones.html">Comenzar gratis ↗</a></article><article class="plan"><p class="eyebrow">PROPUESTA / EN DESARROLLO</p><h2>Analista</h2><p>Para desarrollar un proceso de investigación constante.</p><p class="plan-price">Por definir</p><ul><li>Propuesta: biblioteca de casos con fuentes y metodología.</li><li>Propuesta: plantillas avanzadas y seguimiento de tesis.</li><li>Propuesta: cuenta para sincronizar tu trabajo.</li><li>Propuesta: sesiones de revisión del método de análisis.</li></ul><small>Sin contratación ni cobros habilitados. Precio, calendario y alcance pendientes de definir.</small></article><article class="plan"><p class="eyebrow">PROPUESTA / EN DESARROLLO</p><h2>Círculo AFORTU</h2><p>Para aprender en una comunidad con conversación y contexto.</p><p class="plan-price">Por definir</p><ul><li>Propuesta: encuentros educativos sobre temas cripto.</li><li>Propuesta: misiones temáticas y casos colaborativos.</li><li>Propuesta: biblioteca de sesiones y preguntas frecuentes.</li><li>Propuesta: participación en la selección de futuras misiones.</li></ul><small>Sin contratación ni cobros habilitados. No incluye gestión de fondos ni señales de compra.</small></article></div><section class="membership-faq" aria-labelledby="membership-questions"><h2 id="membership-questions">Antes de comenzar.</h2><details open><summary>¿Qué puedo usar hoy?</summary><p>Las nueve misiones y las cinco herramientas del laboratorio son gratuitas. No necesitas una cuenta, una wallet ni realizar una compra. Los cálculos utilizan valores manuales, no datos de mercado en tiempo real.</p></details><details><summary>¿Dónde se guarda mi trabajo?</summary><p>El progreso se guarda cuando completas una comprobación. Las fichas y notas se guardan cuando eliges hacerlo, sólo en este navegador. No hay sincronización. Descarga tus documentos para conservar una copia y usa las opciones de borrado de Mi bitácora cuando lo necesites.</p></details><details><summary>¿Ya puedo pagar una membresía?</summary><p>No. Analista y Círculo AFORTU son una propuesta de producto. Se publicarán precio, alcance, calendario, condiciones y disponibilidad cuando esos servicios estén preparados. Esta página no cobra ni activa suscripciones.</p></details><details><summary>¿Se trata de señales de inversión?</summary><p>El objetivo es aprender a analizar fuentes, riesgos y supuestos. Los contenidos y herramientas son educativos. No prometen rentabilidad ni ejecutan operaciones con tus activos.</p></details></section></main>` +
    footer()
);
console.log('Nine missions, curriculum, lab and memberships generated.');
writeFileSync(
  'atf.html',
  head(
    'Aprende con ATF',
    'Capacitación guiada, tema por tema: explica, practica, comprueba y continúa.',
    '.',
    'atf.html',
    'src/ecosystem/tutor.jsx'
  ) +
    header() +
    `<main class="wrap" id="contenido" tabindex="-1"><div class="portal-hero"><p class="eyebrow">ATF / ADVISOR OF THE FUTURE <span class="access-tag">RUTA PERSONAL</span></p><h1>Un tema a la vez.<br><em>A tu ritmo.</em></h1><p>Elige qué quieres entender. ATF te acompaña con una explicación breve, una práctica y una comprobación antes del siguiente tema.</p></div><div id="tutor-root"><div class="tool-notice"><h2>Tu capacitación con ATF</h2><p>Activa JavaScript para elegir una ruta y realizar las comprobaciones. También puedes leer todas las lecciones desde Misiones Cripto. Esta primera versión usa lecciones y respuestas preparadas, sin un chat de inteligencia artificial.</p><p>Comienza por entender activos y redes, continúa con custodia y exposición, y termina con una ficha de análisis y una nota de bitácora. Puedes repetir cada tema y consultar sus fuentes antes de avanzar.</p><p>El progreso que elijas guardar permanece en este navegador. El inicio de sesión con AFORTU OS todavía no está conectado.</p><a class="text-link" href="./misiones.html">Leer las misiones →</a></div></div></main>` +
    footer()
);
writeFileSync(
  'acceso.html',
  head(
    'Tu cuenta AFORTU OS',
    'Un acceso compartido para el futuro ecosistema de aprendizaje de BitForward.',
    '.',
    'acceso.html'
  ) +
    header() +
    `<main class="wrap" id="contenido" tabindex="-1"><div class="portal-hero"><p class="eyebrow">AFORTU OS × BITFORWARD <span class="access-tag" data-afortu-learning-status>ACCESO CON CUENTA / PRÓXIMAMENTE</span></p><h1>Una cuenta.<br><em>Tu camino de aprendizaje.</em></h1><p data-afortu-learning-intro>Usarás tu cuenta de AFORTU OS para continuar tu capacitación con ATF y conservar tu avance.</p></div><div class="account-panel"><p class="eyebrow">PORTAL OFICIAL IDENTIFICADO</p><h2>Puedes empezar a aprender hoy.</h2><p data-afortu-learning-detail>AFORTU OS tiene su propio acceso con llave del dispositivo y Authenticator. El acceso a la capacitación de BitForward con esa cuenta estará disponible próximamente. Mientras tanto, las misiones y herramientas gratuitas están disponibles sin registro.</p><p data-afortu-learning-local>En este modo, el progreso y las notas que guardes permanecen únicamente en este navegador. Todavía no se vinculan a una cuenta ni se sincronizan entre dispositivos.</p><div class="action-row"><a class="button button-primary" href="./atf.html">Comenzar con ATF sin cuenta ↗</a><a class="button button-outline" data-afortu-learning-link href="https://app.afortu.com.mx/" target="_blank" rel="noopener noreferrer">Abrir portal AFORTU OS ↗<span class="sr-only"> (nueva pestaña)</span></a></div></div><section class="membership-faq" aria-labelledby="access-faq"><h2 id="access-faq">Una experiencia conectada.</h2><details open><summary>¿Para qué servirá la misma cuenta?</summary><p data-afortu-learning-faq>La cuenta permitirá retomar tus comprobaciones con ATF desde otro dispositivo. Las membresías de pago se presentarán por separado cuando sus servicios estén disponibles.</p></details><details><summary>¿Necesito volver a registrarme aquí?</summary><p>La experiencia prevista utiliza la identidad de AFORTU OS. Esta versión de BitForward no solicita tu contraseña ni crea una segunda cuenta.</p></details><details><summary>¿Puedo guardar lo que haga mientras tanto?</summary><p>Sí. Completa las comprobaciones para guardar progreso local y utiliza las opciones de guardar o descargar del laboratorio para conservar tus fichas y notas. La futura integración deberá permitirte elegir si quieres importar ese trabajo.</p></details></section></main><script type="module" src="./src/ecosystem/access.js"></script>` +
    footer()
);
