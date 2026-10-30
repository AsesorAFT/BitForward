import { createWalletSession, discoverWallets } from './wallet-session.mjs';
const escape = value =>
  String(value).replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
let root = null,
  stopDiscovery = null,
  wallets = [];
const session = createWalletSession({ onChange: () => render() });
function stop() {
  stopDiscovery?.();
  stopDiscovery = null;
  wallets = [];
}
const statuses = {
  disconnected: 'Sin conectar',
  connecting: 'Confirma en tu wallet',
  reading: 'Consultando la red',
  connected: 'Lectura disponible',
  unsupported: 'Red sin soporte',
  error: 'Lectura pendiente',
};
function render() {
  if (!root?.isConnected) return;
  const s = session.getState();
  const busy = ['connecting', 'reading'].includes(s.status);
  root.innerHTML = `<section class="panel own-wallet"><div class="section-heading"><div><p class="eyebrow">TU WALLET / BAJO TU CONTROL</p><h2>Las llaves se quedan contigo.</h2></div><span class="tag">SOLO CONSULTA</span></div>
    <p class="wallet-intro">Conecta tu wallet para consultar su dirección, red y saldo nativo. La autorización se hace en tu wallet. BitForward no pide tu frase de recuperación ni tu clave privada.</p>
    <div class="wallet-status" role="status"><span class="status-dot"></span><span>${statuses[s.status]}</span></div>
    ${s.error ? `<p class="wallet-error" role="alert">${escape(s.error)}</p>` : ''}
    ${s.account ? `<dl class="wallet-details"><div><dt>Cuenta autorizada</dt><dd class="wallet-address">${escape(s.account)}</dd></div><div><dt>Wallet</dt><dd>${escape(s.providerName)}</dd></div><div><dt>Red</dt><dd>${escape(s.network?.name || 'Red no compatible')} <small>${escape(s.chainId)}</small>${s.network?.testnet ? ' · PRUEBA' : ''}</dd></div><div><dt>Saldo nativo${s.network?.testnet ? ' · fondos de prueba' : ''}</dt><dd class="wallet-balance">${s.balance === null ? '—' : `${escape(s.balance)} <small>${escape(s.network.symbol)}</small>`}</dd></div>${s.readAt ? `<div><dt>Consultado</dt><dd>${escape(new Date(s.readAt).toLocaleString('es-MX'))}</dd></div><div><dt>Bloque de lectura</dt><dd>${escape(s.block)}</dd></div>` : ''}</dl>` : ''}
    ${s.status === 'unsupported' ? '<p class="wallet-error">Cambia de red desde tu wallet: Ethereum, Base, Arbitrum, Optimism, Polygon, BNB Smart Chain, Avalanche C-Chain o Sepolia.</p>' : ''}
    <div class="actions">${s.status === 'disconnected' ? '<button class="button primary" id="discover-wallets">Elegir mi wallet →</button>' : `<button class="button primary" id="refresh-wallet" ${busy ? 'disabled' : ''}>Actualizar lectura</button><button class="button secondary" id="disconnect-wallet">Desconectar de BitForward</button>`}</div>
    <div id="wallet-picker" class="wallet-picker" ${s.status !== 'disconnected' || !stopDiscovery ? 'hidden' : ''}><h3>Wallets de este navegador</h3><p>Selecciona la wallet que reconoces. Su nombre lo proporciona la extensión.</p><div id="wallet-options"></div><p id="no-wallet" ${wallets.length ? 'hidden' : ''}>No detectamos una wallet compatible. Abre BitForward en un navegador con tu extensión o dentro del navegador de tu wallet móvil. Puedes seguir usando la práctica.</p><button class="text-button" id="retry-wallet">Volver a buscar</button></div>
    <p class="wallet-scope">Se consulta únicamente el activo nativo de la red seleccionada; no es el total de tus tokens. Actualiza para obtener otra lectura. No se solicitan firmas ni autorizaciones de gasto.</p></section>
    <div class="wallet-control-grid"><section class="panel"><p class="eyebrow">01 / CUSTODIA</p><h3>Tu wallet conserva las llaves</h3><p>La dirección y la lectura se mantienen en memoria durante esta visita. No se guardan en el historial de práctica.</p></section><section class="panel"><p class="eyebrow">02 / PERMISOS</p><h3>Conectar es consultar</h3><p>Esta versión no puede enviar órdenes, transferencias ni aprobaciones de tokens.</p></section><section class="panel"><p class="eyebrow">03 / PRÁCTICA</p><h3>Un espacio independiente</h3><p>El saldo demo y las operaciones ficticias permanecen separados de tu wallet.</p><a href="#wallet?modo=demo">Ver wallet de práctica →</a></section></div>
    <details class="wallet-help"><summary>Qué ocurre al desconectar</summary><p>BitForward borra la conexión y la lectura de esta visita. Si quieres retirar también el permiso de compartir tu dirección, hazlo desde las conexiones de tu wallet. Al recargar la página tendrás que conectar otra vez.</p></details>`;
  root.querySelector('#discover-wallets')?.addEventListener('click', discover);
  root.querySelector('#retry-wallet')?.addEventListener('click', discover);
  root.querySelector('#disconnect-wallet')?.addEventListener('click', () => {
    stop();
    session.disconnect();
  });
  root.querySelector('#refresh-wallet')?.addEventListener('click', () => session.refresh());
  renderOptions();
}
function renderOptions() {
  const container = root?.querySelector('#wallet-options');
  if (!container) return;
  container.innerHTML = wallets
    .map(
      w =>
        `<button class="wallet-option" data-wallet="${w.id}"><span class="wallet-glyph" aria-hidden="true">↗</span><span>${escape(w.name)}</span><span>Conectar →</span></button>`
    )
    .join('');
  container.querySelectorAll('[data-wallet]').forEach(
    button =>
      (button.onclick = () => {
        const wallet = wallets.find(w => w.id === Number(button.dataset.wallet));
        if (!wallet) return;
        stop();
        void session.connect(wallet.provider, wallet.name);
      })
  );
  root.querySelector('#no-wallet').hidden = wallets.length > 0;
}
function discover() {
  stop();
  // Set a sentinel before synchronous announce events arrive.
  stopDiscovery = () => {};
  render();
  stopDiscovery = discoverWallets(window, entries => {
    wallets = entries;
    renderOptions();
  });
}
export function mountOwnWallet(element) {
  root = element;
  render();
}
export function unmountOwnWallet() {
  stop();
  root = null;
}
window.addEventListener('pagehide', () => {
  stop();
  session.disconnect();
});
