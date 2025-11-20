import styles from '../../css/bf-footer.css?inline';

class BFFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    const year = new Date().getFullYear();
    const template = `
      <footer>
        <p>© ${year} <strong>BitForward</strong> — Innovación Financiera Descentralizada</p>
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
