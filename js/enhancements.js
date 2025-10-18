/**
 * BitForward App Enhancements
 * Integrates all UI/UX improvements and new functionality
 */

// Initialize components when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('BitForward Enhancements Loaded');
    
    // Load utility scripts
    loadScripts([
        '../js/theme-switcher.js',
        '../js/page-transitions.js',
        '../js/notification-system.js',
        '../js/responsive-design.js',
        '../js/dashboard-customizer.js',
        '../js/news-feed.js',
        '../js/tax-calculator.js'
    ]).then(() => {
        console.log('All enhancement scripts loaded successfully');
        
        // Add theme toggle to header
        addThemeToggleToHeader();
        
        // Initialize components that require multiple features
        initializeEnhancements();
    }).catch(err => {
        console.error('Error loading enhancement scripts:', err);
    });
});

// Helper to load scripts asynchronously
function loadScripts(urls) {
    return Promise.all(urls.map(url => {
        return new Promise((resolve, reject) => {
            // Skip if script already loaded
            if (document.querySelector(`script[src="${url}"]`)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }));
}

// Add theme toggle button to header
function addThemeToggleToHeader() {
    const header = document.querySelector('header');
    if (!header) return;
    
    // Find user menu or action area in header
    const userArea = header.querySelector('.user-actions, .user-menu, .header-actions') || 
                    header.querySelector('nav') || header;
    
    // Create theme toggle if it doesn't exist
    if (!header.querySelector('.theme-toggle')) {
        const themeToggle = document.createElement('button');
        themeToggle.className = 'theme-toggle';
        themeToggle.title = 'Cambiar tema';
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        themeToggle.addEventListener('click', () => {
            if (window.themeSwitcher) {
                const isDark = window.themeSwitcher.toggle();
                themeToggle.querySelector('i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
        });
        
        // Insert before the last child or as last element
        userArea.insertBefore(themeToggle, userArea.lastElementChild || null);
        
        // Update initial icon based on current theme
        if (window.themeSwitcher) {
            const isDark = window.themeSwitcher.getCurrentTheme() === 'dark';
            themeToggle.querySelector('i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

// Initialize additional enhancements that need multiple components
function initializeEnhancements() {
    // Apply current theme
    if (window.themeSwitcher) {
        window.themeSwitcher.applyTheme();
    }
    
    // Extend dashboard functionality if on dashboard page
    if (document.querySelector('.dashboard-widgets')) {
        enhanceDashboard();
    }
    
    // Initialize news feed if we're on a page that should display news
    initializeNewsFeed();
    
    // Add convenience functions to global scope
    window.bitForwardApp = {
        showNotification: showNotification,
        showToast: showToast,
        toggleTheme: toggleTheme,
        refreshPage: refreshPageWithTransition,
        refreshNews: refreshNewsFeed
    };
}

// Dashboard specific enhancements
function enhanceDashboard() {
    if (!window.dashboardCustomizer) return;
    
    // Add drag-and-drop capability to widget containers
    const widgetContainers = document.querySelectorAll('.widget-container, .card-grid, .dashboard-grid');
    widgetContainers.forEach(container => {
        if (!container.classList.contains('customizable-dashboard')) {
            container.classList.add('customizable-dashboard');
        }
    });
}

// Helper function to show a notification
function showNotification(options) {
    if (window.notificationSystem) {
        window.notificationSystem.addNotification({
            type: options.type || 'info',
            title: options.title || 'Notificación',
            message: options.message,
            action: options.action,
            icon: options.icon
        });
    }
}

// Helper function to show a toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `bf-toast ${type}-toast`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(toast);
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    });
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

function getToastIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

// Helper function to toggle theme
function toggleTheme() {
    if (window.themeSwitcher) {
        return window.themeSwitcher.toggle();
    }
    return false;
}

// Helper function to refresh page with transition
function refreshPageWithTransition() {
    if (window.pageTransitions) {
        window.pageTransitions.transitionToPage(window.location.href);
    } else {
        window.location.reload();
    }
}

/**
 * Initialize the news feed component
 */
function initializeNewsFeed() {
    // Check if the news feed script is loaded
    if (typeof NewsFeed === 'undefined') {
        console.warn('News feed component requires news-feed.js');
        return;
    }
    
    // Add CSS if not already added
    if (!document.querySelector('link[href="css/news-feed.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/news-feed.css';
        document.head.appendChild(link);
    }
    
    // Check if we're on dashboard or main page
    const isMainOrDashboard = document.querySelector('main') || 
                             document.querySelector('.dashboard-container') || 
                             document.getElementById('dashboard-container');
    
    if (!isMainOrDashboard) return;
    
    // Check if news feed container exists, if not create one
    let newsFeedContainer = document.getElementById('news-feed-container');
    
    if (!newsFeedContainer) {
        // Find a suitable location to add the news feed
        const main = document.querySelector('main') || document.querySelector('.dashboard-container');
        if (!main) return;
        
        // Create a new section for the news feed
        const section = document.createElement('section');
        section.className = 'mb-8';
        section.id = 'news-feed-section';
        
        // Create title and container
        section.innerHTML = `
            <h2 class="section-title-md">Noticias de DeFi y Cripto</h2>
            <div id="news-feed-container" class="news-feed-container" style="height: 400px;"></div>
        `;
        
        // Add the section to the page
        const lastSection = Array.from(main.querySelectorAll('section')).pop();
        if (lastSection) {
            main.insertBefore(section, lastSection);
        } else {
            main.appendChild(section);
        }
        
        newsFeedContainer = document.getElementById('news-feed-container');
    }
    
    // Initialize the news feed component
    if (newsFeedContainer) {
        window.bitforwardNewsFeed = new NewsFeed({
            container: '#news-feed-container',
            apiKey: 'demo-api-key', // Replace with real API key in production
            limit: 5,
            refreshInterval: 300000 // 5 minutes
        });
        
        window.bitforwardNewsFeed.init();
        console.log('News feed initialized');
    }
}

/**
 * Refresh the news feed manually
 */
function refreshNewsFeed() {
    if (window.bitforwardNewsFeed) {
        window.bitforwardNewsFeed.refreshNews();
        
        // Show notification
        showToast('Noticias actualizadas', 'success');
    }
}

// Add global styles for toasts
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    .bf-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--card-bg);
        color: var(--text-primary);
        padding: 0.75rem 1rem;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 300px;
        max-width: 90vw;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        z-index: 9999;
        border-left: 4px solid var(--info);
    }
    
    .dark-theme .bf-toast {
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    .bf-toast.success-toast {
        border-color: var(--success);
    }
    
    .bf-toast.error-toast {
        border-color: var(--error);
    }
    
    .bf-toast.warning-toast {
        border-color: var(--warning);
    }
    
    .bf-toast.show {
        transform: translateX(0);
    }
    
    .bf-toast.removing {
        transform: translateX(120%);
    }
    
    .toast-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .toast-content i {
        color: var(--info);
    }
    
    .success-toast .toast-content i {
        color: var(--success);
    }
    
    .error-toast .toast-content i {
        color: var(--error);
    }
    
    .warning-toast .toast-content i {
        color: var(--warning);
    }
    
    .toast-close {
        background: transparent;
        border: none;
        color: var(--text-tertiary);
        cursor: pointer;
    }
`;

document.head.appendChild(toastStyles);
