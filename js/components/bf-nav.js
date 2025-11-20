import styles from '../../css/bf-nav.css?inline';

class BFNav extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const logoSrc = this.getAttribute('logo-src') || 'assets/logo-astronaut-rocket.svg';

    const template = `
      <nav>
        <div class="bf-logo">
          <img src="${logoSrc}" alt="BitForward logo" />
          <span>BitForward</span>
        </div>

        <div class="bf-menu">
          <a href="index.html">Inicio</a>
          <a href="trading.html">Exchange</a>
          <a href="markets.html">Mercados</a>
          <a href="dashboard.html">Dashboard</a>
          <a href="community.html">Comunidad</a>
          <slot></slot>
        </div>
      </nav>
    `;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${template}
    `;
  }
}

if (!customElements.get('bf-nav')) {
  customElements.define('bf-nav', BFNav);
}
