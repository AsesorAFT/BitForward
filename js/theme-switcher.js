/**
 * BitForward Theme Switcher
 * Allows users to toggle between dark crypto theme and light theme
 */

class ThemeSwitcher {
    constructor() {
        this.darkMode = true; // Default to dark mode (crypto theme)
        this.initTheme();
        this.setupListeners();
    }

    initTheme() {
        // Check if user has previously selected a theme
        const savedTheme = localStorage.getItem('bf-theme');
        if (savedTheme) {
            this.darkMode = savedTheme === 'dark';
        } else {
            // Check system preference as fallback
            this.darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        // Apply theme on load
        this.applyTheme();
    }

    setupListeners() {
        // Listen for system theme changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (!localStorage.getItem('bf-theme')) {
                    // Only auto-switch if user hasn't manually set preference
                    this.darkMode = e.matches;
                    this.applyTheme();
                }
            });
        }
        
        // Create event for other components to listen to theme changes
        window.addEventListener('bf-theme-changed', (e) => {
            console.log('Theme changed to:', e.detail.theme);
        });
    }

    toggle() {
        this.darkMode = !this.darkMode;
        this.applyTheme();
        
        // Store user preference
        localStorage.setItem('bf-theme', this.darkMode ? 'dark' : 'light');
        
        // Dispatch event for other components to react
        window.dispatchEvent(new CustomEvent('bf-theme-changed', {
            detail: { theme: this.darkMode ? 'dark' : 'light' }
        }));
        
        return this.darkMode;
    }

    applyTheme() {
        if (this.darkMode) {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        } else {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        }
        
        // Update theme meta tag for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', this.darkMode ? '#0F172A' : '#F8FAFC');
        }
        
        // Update icons if needed
        this.updateIcons();
    }
    
    updateIcons() {
        const themeToggles = document.querySelectorAll('.theme-toggle');
        themeToggles.forEach(toggle => {
            const iconElement = toggle.querySelector('i');
            if (iconElement) {
                // Update icon based on current theme
                if (this.darkMode) {
                    iconElement.className = 'fas fa-sun'; // Sun icon for dark mode (to switch to light)
                } else {
                    iconElement.className = 'fas fa-moon'; // Moon icon for light mode (to switch to dark)
                }
            }
        });
    }
    
    getCurrentTheme() {
        return this.darkMode ? 'dark' : 'light';
    }
}

// Initialize the theme switcher
const themeSwitcher = new ThemeSwitcher();

// Expose to global scope
window.themeSwitcher = themeSwitcher;
