/**
 * BitForward - Modern Navigation JavaScript
 * Funcionalidad completa del menú de navegación
 */

class ModernNavigation {
  constructor() {
    this.nav = null;
    this.mobileToggle = null;
    this.navLinks = null;
    this.isScrolled = false;
    this.isMobileMenuOpen = false;

    this.init();
  }

  init() {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.nav = document.querySelector('.bf-modern-nav');
    this.mobileToggle = document.querySelector('.bf-mobile-toggle');
    this.navLinks = document.querySelector('.bf-nav-links');

    if (!this.nav) {return;}

    this.setupScrollEffect();
    this.setupMobileMenu();
    this.setupActiveLink();
    this.setupDropdowns();
    this.setupSearch();
    this.setupWalletButton();
  }

  /**
     * Efecto de scroll en el navbar
     */
  setupScrollEffect() {
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;

      // Añadir clase 'scrolled' cuando se hace scroll
      if (currentScroll > 50) {
        this.nav.classList.add('scrolled');
      } else {
        this.nav.classList.remove('scrolled');
      }

      // Auto-hide en mobile cuando se hace scroll hacia abajo
      if (window.innerWidth <= 768) {
        if (currentScroll > lastScroll && currentScroll > 100) {
          this.nav.style.transform = 'translateY(-100%)';
        } else {
          this.nav.style.transform = 'translateY(0)';
        }
      }

      lastScroll = currentScroll;
    });
  }

  /**
     * Menú móvil toggle
     */
  setupMobileMenu() {
    if (!this.mobileToggle || !this.navLinks) {return;}

    this.mobileToggle.addEventListener('click', () => {
      this.toggleMobileMenu();
    });

    // Cerrar menú al hacer click en un link
    const links = this.navLinks.querySelectorAll('.bf-nav-link');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && !e.target.closest('.bf-nav-dropdown')) {
          this.closeMobileMenu();
        }
      });
    });

    // Cerrar menú al hacer click fuera
    document.addEventListener('click', (e) => {
      if (this.isMobileMenuOpen &&
                !e.target.closest('.bf-nav-links') &&
                !e.target.closest('.bf-mobile-toggle')) {
        this.closeMobileMenu();
      }
    });

    // Cerrar menú al cambiar a desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768 && this.isMobileMenuOpen) {
        this.closeMobileMenu();
      }
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.mobileToggle.classList.toggle('active');
    this.navLinks.classList.toggle('active');
    document.body.style.overflow = this.isMobileMenuOpen ? 'hidden' : '';
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    this.mobileToggle.classList.remove('active');
    this.navLinks.classList.remove('active');
    document.body.style.overflow = '';
  }

  /**
     * Marcar link activo según la página actual
     */
  setupActiveLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.bf-nav-link');

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.includes(currentPage)) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /**
     * Funcionalidad de dropdowns
     */
  setupDropdowns() {
    const dropdownItems = document.querySelectorAll('.bf-nav-item:has(.bf-nav-dropdown)');

    dropdownItems.forEach(item => {
      const dropdown = item.querySelector('.bf-nav-dropdown');

      // En mobile, hacer toggle con click
      if (window.innerWidth <= 768) {
        const trigger = item.querySelector('.bf-nav-link');
        trigger.addEventListener('click', (e) => {
          e.preventDefault();
          dropdown.classList.toggle('show');
        });
      }
    });
  }

  /**
     * Funcionalidad de búsqueda
     */
  setupSearch() {
    const searchInput = document.querySelector('.bf-search-input');
    if (!searchInput) {return;}

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          this.performSearch(query);
        }
      }
    });

    // Búsqueda en tiempo real (opcional)
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const query = e.target.value.trim();
        if (query.length >= 3) {
          this.showSearchSuggestions(query);
        }
      }, 300);
    });
  }

  performSearch(query) {
    console.log('Buscando:', query);
    // Aquí implementarías la lógica de búsqueda real
    // Por ahora, redirigir a una página de resultados
    window.location.href = `search.html?q=${encodeURIComponent(query)}`;
  }

  showSearchSuggestions(query) {
    // Implementar sugerencias de búsqueda
    console.log('Sugerencias para:', query);
  }

  /**
     * Botón de wallet connection
     */
  setupWalletButton() {
    const walletBtn = document.querySelector('.bf-wallet-btn');
    if (!walletBtn) {return;}

    walletBtn.addEventListener('click', () => {
      this.handleWalletConnection();
    });

    // Verificar si ya hay wallet conectada
    this.checkWalletConnection();
  }

  async handleWalletConnection() {
    const walletBtn = document.querySelector('.bf-wallet-btn');

    if (walletBtn.classList.contains('connected')) {
      // Desconectar
      this.disconnectWallet();
    } else {
      // Conectar
      await this.connectWallet();
    }
  }

  async connectWallet() {
    const walletBtn = document.querySelector('.bf-wallet-btn');

    try {
      // Mostrar loading
      walletBtn.innerHTML = '<span>🔄</span> Conectando...';
      walletBtn.disabled = true;

      // Simular conexión (aquí integrarías MetaMask, WalletConnect, etc.)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simular dirección de wallet
      const address = '0x1234...5678';

      // Actualizar UI
      walletBtn.classList.add('connected');
      walletBtn.innerHTML = `<span>✓</span> ${address}`;
      walletBtn.disabled = false;

      // Guardar en localStorage
      localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', address);

      // Mostrar notificación
      this.showNotification('Wallet conectada exitosamente', 'success');

      // Disparar evento personalizado
      window.dispatchEvent(new CustomEvent('walletConnected', {
        detail: { address }
      }));

    } catch (error) {
      console.error('Error conectando wallet:', error);
      walletBtn.innerHTML = '<span>🔌</span> Conectar Wallet';
      walletBtn.disabled = false;
      this.showNotification('Error al conectar wallet', 'error');
    }
  }

  disconnectWallet() {
    const walletBtn = document.querySelector('.bf-wallet-btn');

    walletBtn.classList.remove('connected');
    walletBtn.innerHTML = '<span>🔌</span> Conectar Wallet';

    // Limpiar localStorage
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');

    this.showNotification('Wallet desconectada', 'info');

    // Disparar evento
    window.dispatchEvent(new Event('walletDisconnected'));
  }

  checkWalletConnection() {
    const isConnected = localStorage.getItem('walletConnected') === 'true';
    const address = localStorage.getItem('walletAddress');

    if (isConnected && address) {
      const walletBtn = document.querySelector('.bf-wallet-btn');
      if (walletBtn) {
        walletBtn.classList.add('connected');
        walletBtn.innerHTML = `<span>✓</span> ${address}`;
      }
    }
  }

  /**
     * Sistema de notificaciones
     */
  showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `bf-notification bf-notification-${type}`;
    notification.innerHTML = `
            <span class="bf-notification-icon">
                ${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}
            </span>
            <span class="bf-notification-message">${message}</span>
        `;

    // Estilos inline para notificación
    notification.style.cssText = `
            position: fixed;
            top: calc(var(--nav-height) + 1rem);
            right: 1rem;
            background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 600;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
        `;

    document.body.appendChild(notification);

    // Auto-remover después de 3 segundos
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
     * Utilidad: Actualizar badge de notificaciones
     */
  updateNotificationBadge(count) {
    const badge = document.querySelector('.bf-nav-badge');
    if (badge) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = count > 0 ? 'block' : 'none';
    }
  }
}

// Inicializar navegación
const modernNav = new ModernNavigation();

// Exportar para uso global
window.BitForwardNav = modernNav;

// Agregar estilos de animación para notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('🚀 BitForward Modern Navigation loaded');
