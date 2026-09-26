import { membershipBody, routeBody } from '../src/commerce/templates.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
import prettier from 'prettier';
import { missions, tracks, assets } from '../src/ecosystem/data.mjs';
import { content } from '../src/ecosystem/content.mjs';
const writeHtml = async (path, html) => {
  writeFileSync(path, await prettier.format(html, { parser: 'html', printWidth: 100 }));
};
const esc = value =>
  String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const toolUrl = (m, base = '.') =>
  `${base}/laboratorio.html?herramienta=${m.tool}${m.asset ? `&amp;activo=${m.asset}` : ''}`;
const head = (title, description, base = '.', path = '', script = 'src/editorial/main.js') =>
  `<!doctype html><html lang="es-MX"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | BitForward — By AFORTU</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#070a13"><meta name="color-scheme" content="dark"><link rel="canonical" href="https://www.afortu.com.mx/bitforward/${path}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)} | BitForward"><meta property="og:description" content="${esc(description)}"><link rel="icon" href="${base}/assets/brand/bitforward-app-icon-192.png"><script type="module" src="${base}/${script}"></script></head><body><a class="skip-link" href="#contenido">Saltar al contenido</a>`;
const header = (base = '.') =>
  `<header class="site-header"><a class="brand" href="${base}/" aria-label="BitForward, inicio"><strong class="brand-wordmark">BitForward<small>LABORATORIO</small></strong><span>BY AFORTU</span></a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav" hidden>Menú <span class="menu-icon" aria-hidden="true"><span></span><span></span><span></span></span></button><nav class="main-nav" id="main-nav" aria-label="Navegación principal"><a href="${base}/ruta.html">Desde cero</a><a href="${base}/laboratorio.html">Laboratorio</a><a href="${base}/atf.html">Aprende con ATF</a><a href="${base}/laboratorio.html?herramienta=bitacora">Mi bitácora</a><a href="${base}/membresias.html">Planes</a><a href="https://afortu.com.mx/">AFORTU</a><a class="nav-community" href="${base}/acceso.html">AFORTU OS</a></nav></header>`;
const footer = (base = '.') =>
  `<footer class="site-footer wrap"><div class="footer-top"><div><a class="footer-brand" href="${base}/">BitForward<span>BY AFORTU</span></a><p>Formación y análisis de criptoactivos.</p></div><nav aria-label="Comunidad y recursos"><a href="https://afortu.com.mx/">Volver a AFORTU</a><a href="https://www.instagram.com/bitforward_aft/" target="_blank" rel="noopener noreferrer">Instagram<span class="sr-only"> (nueva pestaña)</span></a><a href="${base}/misiones.html">Misiones</a><a href="${base}/laboratorio.html">Laboratorio</a><a href="${base}/membresias.html">Membresías</a></nav></div><div class="footer-bottom"><p>© 2026 BitForward | By AFORTU</p><p>Contenido educativo, no asesoría de inversión. El sitio no conecta wallets ni solicita fondos. Tu progreso y tus notas se guardan sólo en este navegador cuando eliges hacerlo.</p></div></footer></body></html>`;
function checkpoint(m) {
  return `<section class="mission-checkpoint" data-checkpoint="${m.id}" hidden aria-labelledby="checkpoint-title"><p class="eyebrow">EVALUACIÓN DE LA MISIÓN</p><h2 id="checkpoint-title">Revisa lo aprendido.</h2><form><fieldset><legend>${m.question}</legend>${m.options.map((o, i) => `<label class="quiz-option"><input type="radio" name="checkpoint-${m.id}" value="${i}" required><span>${o}</span></label>`).join('')}</fieldset><button class="button button-primary" type="submit">Comprobar y guardar progreso</button><p class="quiz-feedback" role="status" aria-live="polite"></p><small>Al comprobar una respuesta correcta, guardas el progreso en este navegador. No equivale a una certificación ni se sincroniza con una cuenta.</small></form></section><noscript><p>Activa JavaScript para comprobar la respuesta y guardar tu progreso. Puedes leer toda la misión sin activarlo.</p></noscript>`;
}
function practice(m) {
  return `<section class="mission-practice" aria-labelledby="practice-title"><p class="eyebrow">DE LA MISIÓN AL LABORATORIO</p><h2 id="practice-title">Tu resultado: ${m.deliverable.toLowerCase()}.</h2><p>${m.outcome} Abre la herramienta y aplica lo que acabas de aprender.</p><a class="button button-primary" href="${toolUrl(m, '..')}">Llevarlo a la práctica</a></section>`;
}
function next(m) {
  const n = missions[missions.indexOf(m) + 1];
  return `<nav class="next-mission" aria-label="Continuar explorando"><div><p>${n ? 'SIGUIENTE MISIÓN' : 'RUTA COMPLETADA'}</p><strong>${n ? n.title : 'Vuelve a tu bitácora'}</strong></div><a class="button button-primary" href="${n ? './' + n.slug + '.html' : '../laboratorio.html?herramienta=bitacora'}">${n ? 'Continuar la misión' : 'Registrar mi conclusión'}</a></nav>`;
}
for (const m of missions) {
  const path = `misiones/${m.slug}.html`;
  if (content[m.id]) {
    const c = content[m.id];
    const coin = assets.find(a => a.symbol === m.asset);
    await writeHtml(
      path,
      head(m.title, m.outcome, '..', path) +
        header('..') +
        `<main id="contenido" tabindex="-1"><header class="article-hero wrap"><a class="breadcrumb" href="../misiones.html"> Volver a mi ruta</a><p class="eyebrow">MISIÓN ${m.id} / ${m.topic.toUpperCase()}</p><h1>${m.title}<span class="accent">.</span></h1><p class="article-lead">${c.intro}</p><div class="metadata"><span>${m.track.toUpperCase()}</span><span>${m.minutes} min + práctica</span><span>Revisión: <time datetime="2026-09-25">25 SEP 2026</time></span></div></header><article class="article-content wrap" aria-label="Bitácora de la misión ${m.id}">${coin ? `<p class="coin-name"><img src="../assets/crypto/${coin.symbol.toLowerCase()}.svg" width="42" height="42" alt="">${coin.name} / ${coin.symbol}</p>` : ''}${c.sections.map(([title, text]) => `<h2>${title}</h2><p>${text}</p>`).join('')}${practice(m)}${checkpoint(m)}<section class="article-sources" aria-labelledby="fuentes"><h2 id="fuentes">Fuentes para profundizar</h2><ul>${c.sources.map(([label, url]) => `<li><a href="${url}" target="_blank" rel="noopener noreferrer">${label}<span class="sr-only"> (nueva pestaña)</span></a></li>`).join('')}</ul><p>Consultadas el 25 de septiembre de 2026. Los ejercicios y el método de trabajo son contenido editorial de BitForward. Las escenas de ATF son una metáfora narrativa.</p></section>${next(m)}<p class="security-disclaimer">Contenido educativo. No es asesoría de inversión ni promesa de rendimiento. No necesitas comprar activos para completar esta misión.</p></article></main><script type="module" src="../src/ecosystem/learning.js"></script>` +
        footer('..')
    );
  } else {
    let html = readFileSync(path, 'utf8')
      .replaceAll('../#misiones', '../misiones.html')
      .replaceAll('#080c0f', '#070a13')
      .replaceAll(
        'Tu misión cripto empieza con criterio.',
        'Formación y análisis de criptoactivos.'
      );
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
    await writeHtml(path, html);
  }
}
await writeHtml(
  'misiones.html',
  head(
    'Misiones Cripto',
    'Nueve misiones, tres rutas y herramientas para aprender, analizar y documentar con criterio.',
    '.',
    'misiones.html'
  ) +
    header() +
    `<main class="wrap" id="contenido" tabindex="-1"><div class="portal-hero"><p class="eyebrow">PROGRAMA DE FORMACIÓN <span class="access-tag">ACCESO ABIERTO</span></p><h1>Misiones de<br><em>aprendizaje cripto.</em></h1><p>ATF te acompaña en nueve misiones. Cada una conecta una idea con una herramienta y termina en algo que puedes usar: un cálculo, una ficha o una conclusión escrita.</p></div><div class="learning-progress"><div><strong id="progress-label">0 de 9 comprobaciones completadas</strong><p>Tu avance se guarda en este navegador al responder correctamente una comprobación.</p></div><a class="text-link" href="./laboratorio.html?herramienta=bitacora">Abrir mi bitácora</a><progress id="learning-progress" value="0" max="9" aria-label="Comprobaciones completadas"></progress></div>${tracks
      .map(
        t =>
          `<section class="track-section" id="${t.id}" aria-labelledby="title-${t.id}"><div class="track-heading"><span>${t.number}</span><div><h2 id="title-${t.id}">${t.title}</h2><p>${t.description}</p></div></div><div class="curriculum-grid">${missions
            .filter(m => m.track === t.id)
            .map(
              m =>
                `<a class="curriculum-card" href="./misiones/${m.slug}.html"><div class="metadata"><span>MISIÓN ${m.id} · ${m.topic.toUpperCase()}</span><span>${m.minutes} min</span></div><h3>${m.title}</h3><p>${m.outcome}</p><p class="deliverable"><strong>TE LLEVAS</strong> / ${m.deliverable}</p><span class="mission-status" data-mission-status="${m.id}">Por explorar</span><span class="card-link">Comenzar misión</span></a>`
            )
            .join('')}</div></section>`
      )
      .join(
        ''
      )}<div class="member-banner"><div><p class="eyebrow">PRÁCTICA Y HERRAMIENTAS</p><h2>Tu siguiente paso: el laboratorio.</h2><p>Practica las veces que necesites. Las herramientas gratuitas están disponibles sin registro.</p></div><a class="button button-primary" href="./laboratorio.html">Entrar al laboratorio</a></div></main><script type="module" src="./src/ecosystem/learning.js"></script>` +
    footer()
);
await writeHtml(
  'laboratorio.html',
  head(
    'Laboratorio Cripto',
    'Compara activos, calcula exposición y gas, documenta una tesis y lleva tu bitácora de aprendizaje.',
    '.',
    'laboratorio.html',
    'src/ecosystem/lab.jsx'
  ) +
    header() +
    `<main class="wrap" id="contenido" tabindex="-1"><div class="portal-hero"><p class="eyebrow">LABORATORIO BITFORWARD <span class="access-tag">GRATUITO / SIN REGISTRO</span></p><h1>Laboratorio de<br><em>análisis cripto.</em></h1><p>Cinco herramientas para entender lo que estás analizando. Trabaja con tus propios supuestos, documenta tus fuentes y llévate el resultado.</p></div><div id="lab-root"><div class="tool-notice"><h2>Tu espacio de trabajo</h2><p>El laboratorio necesita JavaScript para realizar los cálculos y guardar datos locales. Mientras tanto, puedes explorar todas las misiones como artículos de lectura.</p><ul><li>Comparar: Bitcoin, Ethereum, Tether, Cardano, Solana y USDC.</li><li>Exposición: introduce valores en USD y calcula pérdidas bajo dos supuestos explícitos.</li><li>Gas: convierte unidades y precio efectivo en una comisión de Ethereum.</li><li>Ficha: documenta propósito, evidencia, fuente y riesgo.</li><li>Bitácora: guarda notas en este navegador y descarga una copia.</li></ul><p>No hay cotizaciones en vivo, conexión de wallet ni sincronización entre dispositivos.</p><a class="text-link" href="./misiones.html">Explorar las misiones</a></div></div></main>` +
    footer()
);
await writeHtml(
  'membresias.html',
  head(
    'Formación y membresías',
    'Empieza desde cero y explora los planes de formación, práctica y acompañamiento de BitForward.',
    '.',
    'membresias.html',
    'src/commerce/memberships.jsx'
  ) +
    header() +
    membershipBody +
    footer()
);
await writeHtml(
  'ruta.html',
  head(
    'Tu ruta desde cero',
    'Aprende qué es una criptomoneda y explora una ruta desde seguridad y análisis hasta trading simulado y derivados.',
    '.',
    'ruta.html',
    'src/commerce/route.jsx'
  ) +
    header() +
    routeBody +
    footer()
);
console.log('Nine missions, curriculum, lab and memberships generated.');
await writeHtml(
  'atf.html',
  head(
    'Aprende con ATF',
    'Capacitación guiada, tema por tema: explica, practica, comprueba y continúa.',
    '.',
    'atf.html',
    'src/ecosystem/tutor.jsx'
  ) +
    header() +
    `<main class="wrap" id="contenido" tabindex="-1"><div class="portal-hero"><p class="eyebrow">ATF / ADVISOR OF THE FUTURE <span class="access-tag">RUTA PERSONAL</span></p><h1>Tu campus cripto.<br><em>Aprende con ATF.</em></h1><p>Conoce tus bases, explora tu mapa de conceptos y trabaja en las misiones. ATF adapta los ejercicios a tus respuestas y te ayuda a decidir qué estudiar después.</p></div><div id="tutor-root"><div class="tool-notice"><h2>Tu capacitación con ATF</h2><p>Activa JavaScript para elegir una ruta y realizar las comprobaciones. También puedes leer todas las lecciones desde Misiones Cripto. El campus usa un diagnóstico y ejercicios adaptados con contenido preparado, sin un chat de inteligencia artificial.</p><p>Comienza por entender activos y redes, continúa con custodia y exposición, y termina con una ficha de análisis y una nota de bitácora. Puedes repetir cada tema y consultar sus fuentes antes de avanzar.</p><p>El progreso que elijas guardar permanece en este navegador. El inicio de sesión con AFORTU OS todavía no está conectado.</p><a class="text-link" href="./misiones.html">Leer las misiones</a></div></div></main>` +
    footer()
);
await writeHtml(
  'acceso.html',
  head(
    'Tu cuenta AFORTU OS',
    'Un acceso compartido para el futuro ecosistema de aprendizaje de BitForward.',
    '.',
    'acceso.html'
  ) +
    header() +
    `<main class="wrap" id="contenido" tabindex="-1"><div class="portal-hero"><p class="eyebrow">AFORTU OS × BITFORWARD <span class="access-tag" data-afortu-learning-status>ACCESO CON CUENTA / PRÓXIMAMENTE</span></p><h1>Acceso con<br><em>AFORTU OS.</em></h1><p data-afortu-learning-intro>Usarás tu cuenta de AFORTU OS para continuar tu capacitación con ATF y conservar tu avance.</p></div><div class="account-panel"><p class="eyebrow">PORTAL OFICIAL IDENTIFICADO</p><h2>Puedes empezar a aprender hoy.</h2><p data-afortu-learning-detail>AFORTU OS tiene su propio acceso con llave del dispositivo y Authenticator. El acceso a la capacitación de BitForward con esa cuenta estará disponible próximamente. Mientras tanto, las misiones y herramientas gratuitas están disponibles sin registro.</p><p data-afortu-learning-local>En este modo, el progreso y las notas que guardes permanecen únicamente en este navegador. Todavía no se vinculan a una cuenta ni se sincronizan entre dispositivos.</p><div class="action-row"><a class="button button-primary" href="./atf.html">Comenzar con ATF sin cuenta</a><a class="button button-outline" data-afortu-learning-link href="https://app.afortu.com.mx/" target="_blank" rel="noopener noreferrer">Abrir portal AFORTU OS<span class="sr-only"> (nueva pestaña)</span></a></div></div><section class="membership-faq" aria-labelledby="access-faq"><h2 id="access-faq">Una experiencia conectada.</h2><details open><summary>¿Para qué servirá la misma cuenta?</summary><p data-afortu-learning-faq>La cuenta permitirá retomar tus comprobaciones con ATF desde otro dispositivo. Las membresías de pago se presentarán por separado cuando sus servicios estén disponibles.</p></details><details><summary>¿Necesito volver a registrarme aquí?</summary><p>La experiencia prevista utiliza la identidad de AFORTU OS. Esta versión de BitForward no solicita tu contraseña ni crea una segunda cuenta.</p></details><details><summary>¿Puedo guardar lo que haga mientras tanto?</summary><p>Sí. Completa las comprobaciones para guardar progreso local y utiliza las opciones de guardar o descargar del laboratorio para conservar tus fichas y notas. La futura integración deberá permitirte elegir si quieres importar ese trabajo.</p></details></section></main><script type="module" src="./src/ecosystem/access.js"></script>` +
    footer()
);
