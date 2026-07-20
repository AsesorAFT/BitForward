import styles from '../../css/bf-header.css?inline';

class BFHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.menuOpen = false;
    this.handleResize = this.handleResize.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleLightDomClick = this.handleLightDomClick.bind(this);
  }

  connectedCallback() {
    this.renderAndBind();
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeydown);
    this.addEventListener('click', this.handleLightDomClick);
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeydown);
    this.removeEventListener('click', this.handleLightDomClick);
  }

  handleResize() {
    if (window.innerWidth > 900 && this.menuOpen) this.setMenuOpen(false);
  }

  handleKeydown(event) {
    if (event.key === 'Escape' && this.menuOpen) {
      this.setMenuOpen(false);
      this.shadowRoot.querySelector('.bf-menu-toggle')?.focus();
    }
  }

  handleLightDomClick(event) {
    if (event.target.closest('a') && this.menuOpen) this.setMenuOpen(false);
  }

  setMenuOpen(open) {
    this.menuOpen = open;
    this.renderAndBind();
  }

  renderAndBind() {
    this.render();
    this.shadowRoot
      .querySelector('.bf-menu-toggle')
      ?.addEventListener('click', () => this.setMenuOpen(!this.menuOpen));
    this.shadowRoot.querySelector('.bf-menu')?.addEventListener('click', event => {
      if (event.target.closest('a')) this.setMenuOpen(false);
    });
  }

  render() {
    const logoSrc = this.getAttribute('logo-src') || 'assets/logo-astronaut-rocket.svg';
    const menuClass = this.menuOpen ? 'open' : '';
    const hideLogo = this.hasAttribute('hide-logo');
    const hideWallet = this.hasAttribute('hide-wallet');
    const hasCustomNavigation = this.childElementCount > 0;
    const menuLabel = this.menuOpen ? 'Cerrar menú' : 'Abrir menú';
    const defaultNavigation = hasCustomNavigation
      ? ''
      : `
          <a href="index.html">Inicio</a>
          <a href="mission-control.html">Simulador</a>
          <a href="about.html">Metodología</a>
        `;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <header>
        ${
          hideLogo
            ? ''
            : `<a class="bf-logo" href="index.html" aria-label="BitForward, inicio">
                <img src="${logoSrc}" alt="" />
                <span>BitForward</span>
              </a>`
        }
        <button
          class="bf-menu-toggle"
          type="button"
          aria-label="${menuLabel}"
          aria-expanded="${this.menuOpen}"
          aria-controls="bf-primary-navigation"
        >
          <span></span><span></span><span></span>
        </button>
        <nav id="bf-primary-navigation" class="bf-menu ${menuClass}" aria-label="Navegación principal">
          ${defaultNavigation}
          <slot></slot>
        </nav>
        ${hideWallet ? '' : '<a class="bf-wallet-btn" href="login.html">Acceso</a>'}
      </header>
    `;
  }
}

if (!customElements.get('bf-header')) {
  customElements.define('bf-header', BFHeader);
}
