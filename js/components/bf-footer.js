import styles from '../../css/bf-footer.css?inline';

class BFFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const year = new Date().getFullYear();
    const template = `
      <footer>
        <div class="bf-footer-main">
          <div class="bf-footer-col">
            <h4>Productos</h4>
            <ul>
              <li><a href="trading.html">Trading</a></li>
              <li><a href="lending.html">Lending</a></li>
              <li><a href="analytics.html">Analytics</a></li>
              <li><a href="community.html">Comunidad</a></li>
            </ul>
          </div>
          <div class="bf-footer-col">
            <h4>Soporte</h4>
            <ul>
              <li><a href="about.html">Acerca de</a></li>
              <li><a href="mailto:soporte@bitforward.com">Contacto</a></li>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Términos</a></li>
            </ul>
          </div>
          <div class="bf-footer-col">
            <h4>Newsletter</h4>
            <form class="bf-footer-newsletter" onsubmit="event.preventDefault();this.querySelector('input').value='';alert('¡Gracias por suscribirte!');">
              <input type="email" placeholder="Tu email" required />
              <button type="submit">Suscribirme</button>
            </form>
            <div class="bf-footer-status">
              <span class="status-dot online"></span> Sistema operativo
            </div>
          </div>
        </div>
        <div class="bf-footer-bottom">
          <p>© ${year} <strong>BitForward</strong> — Innovación Financiera Descentralizada</p>
        </div>
        <slot></slot>
      </footer>
    `;

    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      ${template}
    `;
  }
}

if (!customElements.get('bf-footer')) {
  customElements.define('bf-footer', BFFooter);
}
