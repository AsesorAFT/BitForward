// bf-toast.js
// Componente web para notificaciones tipo toast

class BfToast extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.timeout = null;
  }

  connectedCallback() {
    this.render();
  }

  show(message, type = 'info', duration = 3000) {
    this.render(message, type);
    this.style.display = 'block';
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      this.style.display = 'none';
    }, duration);
  }

  render(message = '', type = 'info') {
    const colors = {
      info: '#3b82f6',
      success: '#22c55e',
      error: '#ef4444',
      warning: '#f59e42',
    };
    this.shadowRoot.innerHTML = `
      <style>
        .toast {
          min-width: 220px;
          max-width: 340px;
          background: rgba(30,32,40,0.97);
          color: #fff;
          border-left: 6px solid ${colors[type] || colors.info};
          border-radius: 10px;
          box-shadow: 0 4px 24px 0 #0008;
          padding: 1rem 1.2rem;
          font-size: 1rem;
          position: fixed;
          bottom: 32px;
          right: 32px;
          z-index: 9999;
          opacity: 0.98;
          display: flex;
          align-items: center;
          gap: 0.7em;
          animation: fadein 0.2s;
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 0.98; transform: translateY(0); }
        }
      </style>
      <div class="toast">${message}</div>
    `;
  }
}

customElements.define('bf-toast', BfToast);
