/**
 * BitForward Logo Manager
 * Gestiona la inyección y visualización del logo en toda la plataforma
 */

class BitForwardLogoManager {
  constructor() {
    this.logoPath = 'assets/logo-astronaut-rocket.svg';
    this.faviconPath = 'assets/logo-astronaut-rocket.svg';
    this.animatedLogoPath = 'assets/logo-astronaut-rocket.svg';
    this.originalLogoPath = 'assets/logo-astronaut-rocket.svg';
    this.init();
  }

  /**
   * Inicializa el gestor de logos
   */
  init() {
    this.updateFavicon();
    this.injectLogosIntoElements();
    this.setupLogoEventListeners();

    // Ejecutar después de que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.injectLogosIntoElements();
      });
    }
  }

  /**
   * Actualiza el favicon de la página
   */
  updateFavicon() {
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/svg+xml';
      document.head.appendChild(favicon);
    }
    favicon.href = this.faviconPath;
  }

  /**
   * Inyecta logos en elementos específicos que los necesiten
   */
  injectLogosIntoElements() {
    // Elementos con clase .bf-logo-icon sin imagen
    const logoIcons = document.querySelectorAll(
      '.bf-logo-icon:not(:has(img)):not(:has(.logo-injected))'
    );
    logoIcons.forEach(element => {
      const logoImg = this.createLogoElement('logo-icon logo-injected');
      logoImg.style.width = '24px';
      logoImg.style.height = '24px';
      logoImg.style.filter = 'brightness(0) invert(1)';
      element.innerHTML = '';
      element.appendChild(logoImg);
    });

    // Headers sin logo - DESHABILITADO para evitar duplicados
    // const headers = document.querySelectorAll('header:not(:has(.logo-icon))');
    // headers.forEach(header => {
    //     const logoContainer = document.createElement('div');
    //     logoContainer.className = 'header-logo';
    //     logoContainer.style.cssText = 'display: flex; align-items: center; gap: 10px;';
    //
    //     const logoImg = this.createLogoElement('logo-icon header-logo-img');
    //     logoImg.style.width = '32px';
    //     logoImg.style.height = '32px';
    //
    //     logoContainer.appendChild(logoImg);
    //
    //     // Insertar al inicio del header
    //     header.insertBefore(logoContainer, header.firstChild);
    // });

    // Modales y dialogs
    const modals = document.querySelectorAll(
      '.modal-header:not(:has(.logo-icon)), .dialog-header:not(:has(.logo-icon))'
    );
    modals.forEach(modal => {
      const logoImg = this.createLogoElement('logo-icon modal-logo');
      logoImg.style.width = '20px';
      logoImg.style.height = '20px';
      logoImg.style.marginRight = '8px';
      modal.insertBefore(logoImg, modal.firstChild);
    });
  }

  /**
   * Crea un elemento de imagen del logo
   */
  createLogoElement(className = 'logo-icon') {
    const img = document.createElement('img');
    img.src = this.logoPath;
    img.alt = 'BitForward';
    img.className = className;
    img.style.transition = 'transform 0.3s ease, filter 0.3s ease';

    // Asegurar que el logo sea visible
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';

    // Si el logo no se carga, intentar con el logo alternativo
    img.onerror = () => {
      console.log('Error al cargar el logo principal, intentando con alternativo');
      img.src = 'assets/logo-astronaut-rocket.svg';

      // Si aún falla, cargar el logo original
      img.onerror = () => {
        console.log('Error al cargar el logo alternativo, intentando con el logo original');
        img.src = 'assets/logo.svg';
      };
    };

    return img;
  }

  /**
   * Configura event listeners para efectos de hover
   */
  setupLogoEventListeners() {
    document.addEventListener('mouseover', e => {
      if (e.target.classList.contains('logo-icon')) {
        e.target.style.transform = 'scale(1.1)';
        e.target.style.filter =
          (e.target.style.filter || '') + ' drop-shadow(0 2px 8px rgba(74, 144, 226, 0.4))';
      }
    });

    document.addEventListener('mouseout', e => {
      if (e.target.classList.contains('logo-icon')) {
        e.target.style.transform = 'scale(1)';
        e.target.style.filter = e.target.style.filter.replace(
          ' drop-shadow(0 2px 8px rgba(74, 144, 226, 0.4))',
          ''
        );
      }
    });
  }

  /**
   * Agrega logo a un elemento específico
   */
  addLogoToElement(element, options = {}) {
    const { size = '24px', position = 'before', className = 'logo-icon dynamic-logo' } = options;

    const logoImg = this.createLogoElement(className);
    logoImg.style.width = size;
    logoImg.style.height = size;

    if (position === 'before') {
      element.insertBefore(logoImg, element.firstChild);
    } else if (position === 'after') {
      element.appendChild(logoImg);
    } else if (position === 'replace') {
      element.innerHTML = '';
      element.appendChild(logoImg);
    }

    return logoImg;
  }

  /**
   * Actualiza todos los logos en la página
   */
  refreshLogos() {
    // Remover logos inyectados dinámicamente
    const dynamicLogos = document.querySelectorAll('.logo-injected, .dynamic-logo');
    dynamicLogos.forEach(logo => logo.remove());

    // Volver a inyectar
    this.injectLogosIntoElements();
  }
}

// Instancia global del gestor de logos
window.bitForwardLogoManager = new BitForwardLogoManager();

// Función de utilidad para agregar logos manualmente
window.addBitForwardLogo = (element, options) => {
  return window.bitForwardLogoManager.addLogoToElement(element, options);
};

console.log('🚀 BitForward Logo Manager cargado exitosamente');
