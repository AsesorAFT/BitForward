import styles from '../../css/bf-sidebar.css?inline';

class BFSidebar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${styles}</style>
      <aside class="bf-sidebar">
        <div class="bf-sidebar-logo">
          <img src="assets/logo-astronaut-rocket.svg" alt="BitForward Logo" />
          <span>BitForward</span>
        </div>
        <nav class="bf-sidebar-menu">
          <a href="dashboard.html" class="active"><i class="icon-dashboard"></i> Dashboard</a>
          <a href="trading.html"><i class="icon-trading"></i> Trading</a>
          <a href="lending.html"><i class="icon-lending"></i> Lending</a>
          <a href="analytics.html"><i class="icon-analytics"></i> Analytics</a>
          <a href="community.html"><i class="icon-community"></i> Comunidad</a>
        </nav>
        <div class="bf-sidebar-footer">
          <a href="settings.html"><i class="icon-settings"></i> Ajustes</a>
        </div>
      </aside>
    `;
  }
}

if (!customElements.get('bf-sidebar')) {
  customElements.define('bf-sidebar', BFSidebar);
}
