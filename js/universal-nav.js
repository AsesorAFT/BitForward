/**
 * BitForward - Universal Navigation Component
 * Componente de navegación unificado para todas las páginas
 */

const UniversalNav = {
    /**
     * Renderizar navegación en un elemento
     */
    render: function(containerId = 'bf-nav-container', activePage = '') {
        const container = document.getElementById(containerId) || document.body;
        
        const navHTML = `
            <!-- Modern Navigation -->
            <nav class="bf-modern-nav">
                <div class="bf-nav-container">
                    <!-- Logo -->
                    <a href="index.html" class="bf-nav-logo">
                        <img src="assets/logo-astronaut-rocket.svg" alt="BitForward Logo" class="bf-logo-img">
                        <div class="bf-logo-text">
                            <span class="bf-brand-name">BitForward</span>
                            <span class="bf-brand-tagline">by AFORTU</span>
                        </div>
                    </a>

                    <!-- Navigation Links -->
                    <ul class="bf-nav-links">
                        <li class="bf-nav-item">
                            <a href="index.html" class="bf-nav-link ${activePage === 'home' ? 'active' : ''}" data-page="home">
                                <span class="bf-nav-icon"></span>
                                <span>Inicio</span>
                            </a>
                        </li>
                        
                        <li class="bf-nav-item">
                            <a href="dashboard.html" class="bf-nav-link ${activePage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
                                <span class="bf-nav-icon"></span>
                                <span>Dashboard</span>
                            </a>
                        </li>

                        <li class="bf-nav-item">
                            <a href="markets.html" class="bf-nav-link ${activePage === 'markets' ? 'active' : ''}" data-page="markets">
                                <span class="bf-nav-icon"></span>
                                <span>Mercados</span>
                            </a>
                        </li>
                        
                        <li class="bf-nav-item bf-nav-dropdown-item">
                            <a href="#" class="bf-nav-link ${['trading', 'lending', 'analytics'].includes(activePage) ? 'active' : ''}" data-page="products">
                                <span class="bf-nav-icon"></span>
                                <span>Productos</span>
                                <span class="bf-dropdown-arrow">▼</span>
                            </a>
                            <div class="bf-nav-dropdown">
                                <a href="trading.html" class="bf-dropdown-link ${activePage === 'trading' ? 'active' : ''}">
                                    <span class="bf-dropdown-icon"></span>
                                    <span>Trading</span>
                                </a>
                                <a href="lending.html" class="bf-dropdown-link ${activePage === 'lending' ? 'active' : ''}">
                                    <span class="bf-dropdown-icon"></span>
                                    <span>Préstamos</span>
                                </a>
                                <a href="analytics.html" class="bf-dropdown-link ${activePage === 'analytics' ? 'active' : ''}">
                                    <span class="bf-dropdown-icon"></span>
                                    <span>Analytics</span>
                                </a>
                            </div>
                        </li>
                        
                        <li class="bf-nav-item">
                            <a href="about.html" class="bf-nav-link ${activePage === 'about' ? 'active' : ''}" data-page="about">
                                <span class="bf-nav-icon"></span>
                                <span>Nosotros</span>
                            </a>
                        </li>
                        
                        <li class="bf-nav-item">
                            <a href="community.html" class="bf-nav-link ${activePage === 'community' ? 'active' : ''}" data-page="community">
                                <span class="bf-nav-icon"></span>
                                <span>Comunidad</span>
                            </a>
                        </li>
                        
                        <li class="bf-nav-item">
                            <a href="enterprise.html" class="bf-nav-link ${activePage === 'enterprise' ? 'active' : ''}" data-page="enterprise">
                                <span class="bf-nav-icon"></span>
                                <span>Enterprise</span>
                            </a>
                        </li>
                    </ul>

                    <!-- Right Actions -->
                    <div class="bf-nav-actions">
                        <!-- Search Bar -->
                        <div class="bf-search-container">
                            <input 
                                type="text" 
                                class="bf-search-input" 
                                placeholder="Buscar..."
                                aria-label="Buscar">
                            <span class="bf-search-icon"></span>
                        </div>

                        <!-- Notifications -->
                        <button class="bf-notification-btn" aria-label="Notificaciones">
                            <span></span>
                            <span class="bf-nav-badge">3</span>
                        </button>

                        <!-- Wallet Connect Button -->
                        <button class="bf-wallet-btn">
                            <span></span>
                            <span>Conectar Wallet</span>
                        </button>

                        <!-- User Avatar -->
                        <div class="bf-user-avatar">
                            <img src="https://ui-avatars.com/api/?name=User&background=667eea&color=fff" alt="User">
                        </div>
                    </div>

                    <!-- Mobile Toggle -->
                    <button class="bf-mobile-toggle" aria-label="Toggle Menu">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </nav>
        `;
        
        container.innerHTML = navHTML;
        
        // Cargar iconos después de renderizar
        setTimeout(() => {
            this.loadIcons();
        }, 100);
    },
    
    /**
     * Detectar página activa automáticamente
     */
    detectActivePage: function() {
        const path = window.location.pathname;
        const filename = path.split('/').pop() || 'index.html';
        
        if (filename.includes('index')) return 'home';
        if (filename.includes('dashboard')) return 'dashboard';
        if (filename.includes('markets')) return 'markets';
        if (filename.includes('trading')) return 'trading';
        if (filename.includes('lending')) return 'lending';
        if (filename.includes('analytics')) return 'analytics';
        if (filename.includes('about')) return 'about';
        if (filename.includes('community')) return 'community';
        if (filename.includes('enterprise')) return 'enterprise';
        
        return '';
    },
    
    /**
     * Cargar iconos en los elementos de navegación
     */
    loadIcons: function() {
        if (typeof ExecutiveIcons === 'undefined') {
            console.warn('ExecutiveIcons not loaded yet');
            return;
        }
        
        const iconMap = {
            'home': 'home',
            'dashboard': 'dashboard',
            'markets': 'trading', // Usando un icono existente relevante
            'products': 'enterprise',
            'trading': 'trading',
            'lending': 'lending',
            'analytics': 'analytics',
            'about': 'info',
            'community': 'community',
            'enterprise': 'enterprise'
        };
        
        // Navigation links
        document.querySelectorAll('.bf-nav-link[data-page]').forEach(link => {
            const page = link.getAttribute('data-page');
            const iconEl = link.querySelector('.bf-nav-icon');
            if (iconEl && iconMap[page]) {
                iconEl.innerHTML = ExecutiveIcons[iconMap[page]] || '';
            }
        });
        
        // Dropdown links
        const dropdownIconMap = {
            'trading': 'trading',
            'lending': 'lending',
            'analytics': 'analytics'
        };
        
        document.querySelectorAll('.bf-dropdown-link').forEach(link => {
            const href = link.getAttribute('href');
            const iconEl = link.querySelector('.bf-dropdown-icon');
            
            for (let [key, icon] of Object.entries(dropdownIconMap)) {
                if (href.includes(key) && iconEl) {
                    iconEl.innerHTML = ExecutiveIcons[icon] || '';
                    break;
                }
            }
        });
        
        // Search icon
        const searchIcon = document.querySelector('.bf-search-icon');
        if (searchIcon) {
            searchIcon.innerHTML = ExecutiveIcons.search || '🔍';
        }
        
        // Notification icon
        const notificationBtn = document.querySelector('.bf-notification-btn > span:first-child');
        if (notificationBtn) {
            notificationBtn.innerHTML = ExecutiveIcons.notification || '🔔';
        }
        
        // Wallet icon
        const walletBtn = document.querySelector('.bf-wallet-btn > span:first-child');
        if (walletBtn) {
            walletBtn.innerHTML = ExecutiveIcons.wallet || '🔌';
        }
    },
    
    /**
     * Inicializar navegación automáticamente
     */
    init: function() {
        const activePage = this.detectActivePage();
        this.render('bf-nav-container', activePage);
    }
};

// Auto-inicializar si encuentra el contenedor
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('bf-nav-container')) {
        UniversalNav.init();
    }
});

// Exportar para uso global
window.UniversalNav = UniversalNav;

console.log('🧭 BitForward Universal Navigation loaded');
