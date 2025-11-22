import styles from '../../css/bf-deposit-modal.css?inline';

class BFDepositModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.open = false;
    this.address = this.getAttribute('address') || '0x...';
    this.network = this.getAttribute('network') || 'Ethereum';
    this.qr = this.getAttribute('qr') || '';
    this.render();
  }

  static get observedAttributes() {
    return ['address', 'network', 'qr'];
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal !== newVal) {
      this[name] = newVal;
      this.render();
    }
  }

  connectedCallback() {
    this.shadowRoot.querySelector('.bf-deposit-close').addEventListener('click', () => this.hide());
    this.shadowRoot.querySelector('.bf-deposit-overlay').addEventListener('click', e => {
      if (e.target.classList.contains('bf-deposit-overlay')) this.hide();
    });
    this.shadowRoot.querySelector('.bf-deposit-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(this.address);
      this.shadowRoot.querySelector('.bf-deposit-copy').textContent = 'Copiado!';
      setTimeout(() => {
        this.shadowRoot.querySelector('.bf-deposit-copy').textContent = 'Copiar';
      }, 1200);
    });
  }

  show(address, network, qr) {
    this.address = address || this.address;
    this.network = network || this.network;
    this.qr = qr || this.qr;
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
      <div class="bf-deposit-overlay${this.open ? ' open' : ''}">
        <div class="bf-deposit-modal">
          <button class="bf-deposit-close" aria-label="Cerrar">×</button>
          <h2 class="bf-deposit-title">Depósito</h2>
          <div class="bf-deposit-network">Red: <strong>${this.network}</strong></div>
          <div class="bf-deposit-qr">
            <img src="${this.qr}" alt="QR de depósito" />
          </div>
          <div class="bf-deposit-address">
            <span>${this.address}</span>
            <button class="bf-deposit-copy">Copiar</button>
          </div>
          <div class="bf-deposit-warning">
            Esta dirección solo puede recibir USDC o ETH en la red <strong>${this.network}</strong>.<br/>
            <span class="min">Mínimo: $20 (mismo), $50 (por interne), $100K Depósito máximo</span>
          </div>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('bf-deposit-modal')) {
  customElements.define('bf-deposit-modal', BFDepositModal);
}
