// Public entry points use the same maintained academy. Only known learning context travels.
export const CANONICAL = 'https://app.afortu.com.mx/academia-bitforward';
export function destination(path, search='') {
  const url=new URL(CANONICAL), params=new URLSearchParams(search);
  const name=path.split('/').filter(Boolean).pop()||'';
  if(name==='laboratorio.html'||name==='mercado.html'||name==='simulador.html') {
    url.searchParams.set('view','tools');
    const tool=params.get('herramienta');
    if(['comparar','riesgo','gas','ficha','bitacora'].includes(tool))url.searchParams.set('tool',tool);
    else if(name==='simulador.html')url.searchParams.set('tool','riesgo');
  } else if(name==='misiones.html'||/^00[1-9]-.*\.html$/.test(name)) {
    url.searchParams.set('view','missions');
    if(/^00[1-9]-/.test(name))url.searchParams.set('mission',name.slice(0,3));
  } else if(['ruta.html','practica.html','diagnostico.html'].includes(name))url.searchParams.set('view','route');
  else if(name==='membresias.html')url.searchParams.set('view','account');
  return url.href;
}
const shell=(title,body,head='')=>`<!doctype html><html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><title>${title} · BitForward</title>${head}<style>body{margin:0;background:#f6f8fc;color:#203651;font:16px/1.7 system-ui,sans-serif}main{max-width:680px;margin:10vh auto;padding:34px;background:white;border:1px solid #dee6f0;border-radius:24px}h1{font-size:36px;line-height:1.15;letter-spacing:-1px}a{color:#245da9}button,.primary{display:inline-block;background:#215dbe;color:white;border:0;border-radius:12px;padding:14px 20px;font:600 15px system-ui;cursor:pointer;text-decoration:none}small{color:#697b90}#status{padding-top:16px}@media(max-width:730px){main{margin:30px 15px;padding:24px}h1{font-size:30px}}</style></head><body><main>${body}</main></body></html>`;
export function redirectHtml(path) {
  const target=destination(path),attr=target.replaceAll('&','&amp;');
  return shell('Una sola academia',`<small>BITFORWARD · AFORTU</small><h1>Tu academia, en un solo lugar.</h1><p>Abriendo la versión actual con proyectos DeFi, biblioteca, herramientas y acceso al Centro BTC.</p><a class="primary" href="${attr}">Entrar a la academia</a><p><a href="${path.includes('misiones/')?'../':''}recuperar.html">Recuperar apuntes del navegador anterior</a></p><script>const destination=${destination.toString()};const CANONICAL=${JSON.stringify(CANONICAL)};location.replace(destination(location.pathname,location.search));</script>`,`<link rel="canonical" href="${CANONICAL}"><meta http-equiv="refresh" content="2;url=${attr}">`);
}
export function recoveryHtml() {
  return shell('Recuperar mis apuntes',`<small>BITFORWARD · ARCHIVO DEL NAVEGADOR</small><h1>Conserva tus apuntes.</h1><p>Esta página recupera lo guardado en este navegador y en este dominio. No envía datos, no borra tus apuntes y no registra evaluaciones.</p><button id="export">Descargar mi respaldo</button><p id="status" role="status"></p><p>En la academia abre <strong>Herramientas → Mi bitácora → Traer apuntes del laboratorio anterior</strong>. Selecciona el respaldo, revisa cada borrador y guarda las copias que quieras conservar. El respaldo también conserva tus hipótesis BTC.</p><a class="primary" href="${CANONICAL}?view=tools&amp;tool=bitacora">Ir a la academia actual</a><script>document.getElementById('export').addEventListener('click',()=>{const status=document.getElementById('status');try{const learning=JSON.parse(localStorage.getItem('bitforward-learning-v1')||'null');const marketNotes=JSON.parse(localStorage.getItem('bitforward-btc-hypotheses-v1')||'[]');if(!learning&&!marketNotes.length){status.textContent='No hay apuntes en este origen y navegador. Prueba el navegador donde estudiaste y la dirección exacta que usabas (con o sin www).';return;}const backup={format:'bitforward-learning-backup-v1',exportedAt:new Date().toISOString(),origin:location.origin,learning:learning||{entries:[],analysis:null},marketNotes};const url=URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='bitforward-respaldo.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Respaldo preparado. Tus apuntes originales siguen en este navegador.';}catch{status.textContent='No fue posible leer el almacenamiento. No se ha borrado nada. Revisa el permiso de almacenamiento de este navegador.';}});</script>`,`<meta name="robots" content="noindex">`);
}
