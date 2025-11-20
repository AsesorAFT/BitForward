import styles from '../../css/bf-header.css?inline';

class BFHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.walletConnected = false;
    this.menuOpen = false;
    this.render();
  }

  connectedCallback() {
    this.shadowRoot
      .querySelector('.bf-wallet-btn')
      .addEventListener('click', () => this.toggleWallet());
    this.shadowRoot
      .querySelector('.bf-menu-toggle')
      .addEventListener('click', () => this.toggleMenu());
    window.addEventListener('resize', () => this.closeMenuOnResize());
  }

  disconnectedCallback() {
    this.shadowRoot
      .querySelector('.bf-wallet-btn')
      .removeEventListener('click', () => this.toggleWallet());
    this.shadowRoot
      .querySelector('.bf-menu-toggle')
      .removeEventListener('click', () => this.toggleMenu());
    window.removeEventListener('resize', () => this.closeMenuOnResize());
  }

  toggleWallet() {
    this.walletConnected = !this.walletConnected;
    this.render();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    this.render();
  }

  closeMenuOnResize() {
    if (window.innerWidth > 900 && this.menuOpen) {
      this.menuOpen = false;
      this.render();
    }
  }

  render() {
    const logoSrc = this.getAttribute('logo-src') || 'assets/logo-astronaut-rocket.svg';
    const walletStatus = this.walletConnected ? 'Conectado' : 'Conectar Wallet';
    const walletClass = this.walletConnected ? 'connected' : '';
    const menuClass = this.menuOpen ? 'open' : '';
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <header>
        <div class="bf-logo">
          <img src="${logoSrc}" alt="BitForward logo" />
          <span>BitForward</span>
        </div>
        <button class="bf-menu-toggle" aria-label="Abrir menú">
          <span></span><span></span><span></span>
        </button>
        <nav class="bf-menu ${menuClass}">
          <a href="index.html">Inicio</a>
          <a href="markets.html">Mercados</a>
          <a href="dashboard.html">Dashboard</a>
          <a href="community.html">Comunidad</a>
          <slot></slot>
        </nav>
        <button class="bf-wallet-btn ${walletClass}">${walletStatus}</button>
      </header>
    `;
  }
}

if (!customElements.get('bf-header')) {
  customElements.define('bf-header', BFHeader);
}
