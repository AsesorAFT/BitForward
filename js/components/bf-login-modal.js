import styles from '../../css/bf-login-modal.css?inline';

class BFLoginModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.open = false;
    this.render();
  }

  connectedCallback() {
    this.shadowRoot.querySelector('.bf-login-close').addEventListener('click', () => this.hide());
    this.shadowRoot.querySelector('.bf-login-overlay').addEventListener('click', e => {
      if (e.target.classList.contains('bf-login-overlay')) this.hide();
    });
  }

  show() {
    this.open = true;
    this.render();
  }

  hide() {
    this.open = false;
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <div class="bf-login-overlay${this.open ? ' open' : ''}">
        <div class="bf-login-modal">
          <button class="bf-login-close" aria-label="Cerrar">×</button>
          <h2 class="bf-login-title">Inicia sesión</h2>
          <p class="bf-login-desc">Para empezar, inicia sesión con tus cuentas sociales, correo electrónico o conecta tu wallet.</p>
          <div class="bf-login-socials">
            <button class="bf-login-btn google"><img src="assets/google.svg" alt="Google"/> Google</button>
            <button class="bf-login-btn apple"><img src="assets/apple.svg" alt="Apple"/> Apple</button>
          </div>
          <div class="bf-login-divider"><span>o</span></div>
          <form class="bf-login-form" onsubmit="event.preventDefault();">
            <input type="email" placeholder="Ingresa tu correo electrónico" required />
            <button class="bf-login-btn email" type="submit">Continuar con Email</button>
          </form>
          <div class="bf-login-divider"><span>o</span></div>
          <div class="bf-login-wallets">
            <button class="bf-login-btn wallet"><img src="assets/metamask.svg" alt="MetaMask"/> MetaMask</button>
            <button class="bf-login-btn wallet"><img src="assets/phantom.svg" alt="Phantom"/> Fantasma (Solana)</button>
            <button class="bf-login-btn wallet"><img src="assets/walletconnect.svg" alt="WalletConnect"/> CartillaConnect</button>
          </div>
          <div class="bf-login-more">
            <a href="#">Ver más carteras</a>
          </div>
          <div class="bf-login-terms">
            Al registrarte, aceptas los <a href="#">Términos de uso</a> y la <a href="#">Política de privacidad</a>.
          </div>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('bf-login-modal')) {
  customElements.define('bf-login-modal', BFLoginModal);
}
