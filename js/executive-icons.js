/**
 * BitForward - Executive Icons Library
 * Biblioteca de iconos SVG estilo ejecutivo/Zcash
 */

const ExecutiveIcons = {
  // Home Icon - Geometric house
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>`,

  // Dashboard Icon - Grid layout
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
    </svg>`,

  // Trading Icon - Trending up chart
  trading: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
        <polyline points="17 6 23 6 23 12"></polyline>
    </svg>`,

  // Lending Icon - Coins/Dollar
  lending: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>`,

  // Analytics Icon - Bar chart
  analytics: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>`,

  // Community Icon - Users
  community: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>`,

  // Enterprise Icon - Briefcase
  enterprise: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>`,

  // Wallet Icon - Credit card/wallet
  wallet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
        <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>`,

  // Search Icon
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
    </svg>`,

  // Notification Icon - Bell
  notification: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>`,

  // Settings Icon - Gear
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 1v6m0 6v6m7.071-1.071l-4.243-4.243M5.172 5.172L9.414 9.414m5.657-4.243L10.828 9.414M1 12h6m6 0h6m-1.071 7.071l-4.243-4.243M5.172 18.828l4.242-4.242"></path>
    </svg>`,

  // Security Icon - Shield
  security: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    </svg>`,

  // Info Icon
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>`,

  // Lock Icon
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>`,

  // Unlock Icon
  unlock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
    </svg>`,

  // Arrow Right
  arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>`,

  // Arrow Down
  arrowDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <polyline points="19 12 12 19 5 12"></polyline>
    </svg>`,

  // Check/Success
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`,

  // Close/X
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>`,

  // Menu/Hamburger
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>`,

  // Refresh/Reload
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="23 4 23 10 17 10"></polyline>
        <polyline points="1 20 1 14 7 14"></polyline>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>`,

  // External Link
  externalLink: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>`,

  // Lightning/Fast
  lightning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>`,

  // Star
  star: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>`,

  // Globe
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" y1="12" x2="22" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>`,

  // Download
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>`,

  // Upload
  upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>`,

  // Heart
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>`,

  // Cryptocurrency Icons - Minimal & Executive Style

  // Bitcoin
  bitcoin: `<svg viewBox="0 0 32 32" fill="currentColor">
        <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z"/>
    </svg>`,

  // Ethereum
  ethereum: `<svg viewBox="0 0 32 32" fill="currentColor">
        <path d="M15.927 23.959l-9.823-5.797 9.817 13.839 9.828-13.839-9.828 5.797zM16.073 0l-9.819 16.297 9.819 5.807 9.823-5.801z"/>
    </svg>`,

  // Solana
  solana: `<svg viewBox="0 0 32 32" fill="currentColor">
        <path d="M6.221 18.948c.174-.195.416-.305.674-.305h19.71c.445 0 .668.534.354.85l-3.725 3.726c-.174.195-.416.305-.674.305H2.85c-.445 0-.668-.534-.354-.85l3.725-3.726zm0-11.196c.178-.195.42-.304.674-.304h19.71c.445 0 .668.533.354.85l-3.725 3.725c-.174.195-.416.305-.674.305H2.85c-.445 0-.668-.534-.354-.85l3.725-3.726zm17.978 5.598c-.174-.195-.416-.305-.674-.305H3.815c-.445 0-.668.534-.354.85l3.725 3.726c.174.195.416.305.674.305h19.71c.445 0 .668-.534.354-.85l-3.725-3.726z"/>
    </svg>`,

  // Avalanche
  avalanche: `<svg viewBox="0 0 32 32" fill="currentColor">
        <path d="M11.377 22.85h-4.23c-.393 0-.658-.394-.496-.742l6.788-14.55c.16-.347.66-.347.82 0l1.92 4.11c.16.347.16.742 0 1.09l-3.908 8.377c-.16.348-.51.715-.894.715zm9.168 0h4.23c.393 0 .658-.394.496-.742l-4.015-8.377c-.16-.347-.16-.742 0-1.09l1.92-4.11c.16-.347.66-.347.82 0l6.788 14.55c.162.348-.103.742-.496.742h-8.85c-.384 0-.734-.367-.894-.715l-.898-1.923c-.16-.347.103-.74.496-.74h4.23l-1.92-4.11c-.16-.347-.66-.347-.82 0l-1.92 4.11-1.92 4.11c-.16.347.103.74.496.74h2.308z"/>
    </svg>`,

  // BNB
  bnb: `<svg viewBox="0 0 32 32" fill="currentColor">
        <path d="M16 6.4l-3.2 3.2-6.4-6.4L0 9.6l6.4 6.4L0 22.4l6.4 6.4 6.4-6.4 3.2 3.2 3.2-3.2 6.4 6.4 6.4-6.4-6.4-6.4 6.4-6.4-6.4-6.4-6.4 6.4-3.2-3.2zm0 6.4l3.2-3.2 3.2 3.2-3.2 3.2-3.2-3.2zm-6.4 0l-3.2-3.2 3.2-3.2 3.2 3.2-3.2 3.2zm12.8 0l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2zm-6.4 6.4l3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2z"/>
    </svg>`,

  // Cardano
  cardano: `<svg viewBox="0 0 32 32" fill="currentColor">
        <circle cx="16" cy="16" r="2"/>
        <circle cx="16" cy="6" r="1.5"/>
        <circle cx="16" cy="26" r="1.5"/>
        <circle cx="6" cy="16" r="1.5"/>
        <circle cx="26" cy="16" r="1.5"/>
        <circle cx="10" cy="10" r="1"/>
        <circle cx="22" cy="22" r="1"/>
        <circle cx="22" cy="10" r="1"/>
        <circle cx="10" cy="22" r="1"/>
    </svg>`
};

/**
 * Función helper para crear un icono
 * @param {string} name - Nombre del icono
 * @param {string} className - Clases CSS adicionales
 * @returns {string} - HTML del icono
 */
function createIcon(name, className = '') {
  const iconSVG = ExecutiveIcons[name];
  if (!iconSVG) {
    console.warn(`Icon "${name}" not found`);
    return '';
  }

  return `<span class="bf-icon ${className}">${iconSVG}</span>`;
}

/**
 * Renderizar icono en un elemento del DOM
 * @param {HTMLElement} element - Elemento donde renderizar
 * @param {string} iconName - Nombre del icono
 * @param {string} className - Clases CSS adicionales
 */
function renderIcon(element, iconName, className = '') {
  if (!element) {return;}
  element.innerHTML = createIcon(iconName, className);
}

/**
 * Reemplazar emojis con iconos SVG ejecutivos
 */
function replaceEmojisWithIcons() {
  const iconMap = {
    '🏠': 'home',
    '📊': 'dashboard',
    '📈': 'trading',
    '💰': 'lending',
    '💼': 'enterprise',
    '📉': 'analytics',
    '👥': 'community',
    '🔌': 'wallet',
    '🔍': 'search',
    '🔔': 'notification',
    'ℹ️': 'info',
    '⚙️': 'settings',
    '🛡️': 'security',
    '🏢': 'enterprise',
    '⚡': 'lightning',
    '🌐': 'globe',
    '⭐': 'star',
    '✓': 'check',
    '✗': 'close'
  };

  // Reemplazar en navigation links
  document.querySelectorAll('.bf-nav-icon').forEach(iconEl => {
    const emoji = iconEl.textContent.trim();
    if (iconMap[emoji]) {
      iconEl.innerHTML = ExecutiveIcons[iconMap[emoji]];
      iconEl.classList.add('executive-icon');
    }
  });

  // Reemplazar en botones y otros elementos
  document.querySelectorAll('[data-icon]').forEach(el => {
    const iconName = el.getAttribute('data-icon');
    if (ExecutiveIcons[iconName]) {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'bf-icon executive-icon';
      iconSpan.innerHTML = ExecutiveIcons[iconName];
      el.prepend(iconSpan);
    }
  });
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', replaceEmojisWithIcons);
} else {
  replaceEmojisWithIcons();
}

// Exportar para uso global
window.ExecutiveIcons = ExecutiveIcons;
window.createIcon = createIcon;
window.renderIcon = renderIcon;

console.log('✨ BitForward Executive Icons loaded');
