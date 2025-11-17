/**
 * BitForward - Universal Footer Component
 * Componente de footer unificado para todas las páginas
 */

const UniversalFooter = {
  render: function(containerId = 'bf-universal-footer-container') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Footer container #${containerId} not found.`);
      return;
    }

    const currentYear = new Date().getFullYear();

    const footerHTML = `
            <footer class="bf-universal-footer">
                <div class="bf-footer-container">
                    
                    <div class="bf-footer-column bf-footer-logo-section">
                        <a href="index.html" class="bf-footer-logo">
                            <img src="assets/logo-astronaut-rocket.svg" alt="BitForward Logo">
                            <span>BitForward</span>
                        </a>
                        <p class="bf-footer-tagline">La plataforma para la próxima generación de finanzas.</p>
                    </div>

                    <div class="bf-footer-column">
                        <h4>Productos</h4>
                        <ul>
                            <li><a href="trading.html">Exchange</a></li>
                            <li><a href="markets.html">Mercados</a></li>
                            <li><a href="dashboard.html">Dashboard</a></li>
                            <li><a href="lending.html">Préstamos</a></li>
                        </ul>
                    </div>

                    <div class="bf-footer-column">
                        <h4>Compañía</h4>
                        <ul>
                            <li><a href="about.html">Sobre Nosotros</a></li>
                            <li><a href="community.html">Comunidad</a></li>
                            <li><a href="enterprise.html">Enterprise</a></li>
                        </ul>
                    </div>

                    <div class="bf-footer-column">
                        <h4>Recursos</h4>
                        <ul>
                            <li><a href="#">Documentación</a></li>
                            <li><a href="#">Soporte</a></li>
                            <li><a href="#">FAQ</a></li>
                        </ul>
                    </div>

                    <div class="bf-footer-bottom">
                        <p>&copy; ${currentYear} BitForward by AFORTU. Todos los derechos reservados.</p>
                        <div class="bf-footer-socials">
                            <a href="#" target="_blank" aria-label="Twitter">${this.getIcon('twitter')}</a>
                            <a href="#" target="_blank" aria-label="Telegram">${this.getIcon('telegram')}</a>
                            <a href="#" target="_blank" aria-label="Discord">${this.getIcon('discord')}</a>
                            <a href="#" target="_blank" aria-label="GitHub">${this.getIcon('github')}</a>
                        </div>
                    </div>

                </div>
            </footer>
        `;

    container.innerHTML = footerHTML;
  },

  getIcon: function(name) {
    const icons = {
      twitter: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>',
      telegram: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
      discord: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.201 1.429.86 2.815 1.789 3.969a.05.05 0 0 0 .041.01c1.05-.174 2.125-.552 3.158-.966a.05.05 0 0 0-.007-.084c-.22-.163-.43-.34-.633-.525a.05.05 0 0 0-.062-.003c-.149.094-.292.195-.435.307a.05.05 0 0 0 .002.086c.361.214.775.38 1.202.504a.05.05 0 0 0 .047-.01c.61-1.17.998-2.48 1.1-3.828a.05.05 0 0 0-.044-.054c-.533-.06-1.07-.158-1.594-.278a.05.05 0 0 0-.053.018c-.01.02-.02.03-.02.05c-.149 1.114-.76 2.09-1.541 2.89a.05.05 0 0 0 .03.084c.281.07.57.135.86.19a.05.05 0 0 0 .049-.01c1.422-1.108 2.403-2.73 2.77-4.545a.05.05 0 0 0-.04-.057c-.533-.06-1.07-.158-1.594-.278a.05.05 0 0 0-.053.018c-.01.02-.02.03-.02.05c-.076.574-.29 1.113-.652 1.59a.05.05 0 0 0 .03.084c.281.07.57.135.86.19a.05.05 0 0 0 .049-.01c.72-1.92 1.04-4.06 1.04-6.31 0-1.39-.14-2.77-.4-4.05a.05.05 0 0 0-.05-.042c-.42.09-.83.2-1.22.32a.05.05 0 0 0-.022.051c.01.02.01.04.02.06a8.31 8.31 0 0 0 .462.855.05.05 0 0 0 .063.014c.14-.094.282-.195.422-.307a.05.05 0 0 0 .002-.086c-.36-.214-.77-.38-1.19-.504a.05.05 0 0 0-.047-.01z"/></svg>',
      github: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>'
    };
    return icons[name] || '';
  }
};

// Initialize the footer when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('bf-universal-footer-container')) {
    UniversalFooter.render('bf-universal-footer-container');
  }
});

window.UniversalFooter = UniversalFooter;
console.log('🦶 BitForward Universal Footer loaded');
