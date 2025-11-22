import styles from '../../css/bf-welcome-modal.css?inline';

class BFWelModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.email = this.getAttribute('email') || '';
    this.provider = this.getAttribute('provider') || 'Google';
    this.open = false;
    this.render();
  }

  static get observedAttributes() {
    return ['email', 'provider'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal) {
      this[name] = newVal;
      this.render();
    }
  }

  connectedCallback() {
    this.shadowRoot.querySelector('.bf-welcome-close').addEventListener('click', () => this.hide());
    this.shadowRoot.querySelector('.bf-welcome-overlay').addEventListener('click', e => {
      if (e.target.classList.contains('bf-welcome-overlay')) this.hide();
    });
    this.shadowRoot
      .querySelector('.bf-welcome-continue')
      .addEventListener('click', () => this.hide());
  }

  show(email, provider) {
    this.email = email || this.email;
    this.provider = provider || this.provider;
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
      <div class="bf-welcome-overlay${this.open ? ' open' : ''}">
        <div class="bf-welcome-modal">
          <button class="bf-welcome-close" aria-label="Cerrar">×</button>
          <div class="bf-welcome-icon">✨</div>
          <h2 class="bf-welcome-title">¡Bienvenido de</h2>
          <p class="bf-welcome-desc">Ahora has firmado con</p>
          <div class="bf-welcome-account">
            <img src="assets/google.svg" alt="${this.provider}" />
            <span>${this.email}</span>
          </div>
          <button class="bf-welcome-continue">Continuar</button>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('bf-welcome-modal')) {
  customElements.define('bf-welcome-modal', BFWelModal);
}
