/**
 * BitForward Enhanced Responsive Design
 * Ensures all pages look perfect on mobile devices and tablets
 */

(function() {
    const breakpoints = {
        xs: 0,
        sm: 576,
        md: 768,
        lg: 992,
        xl: 1200,
        xxl: 1400
    };
    
    class ResponsiveDesign {
        constructor() {
            this.currentBreakpoint = this.getCurrentBreakpoint();
            this.initMediaQueries();
            this.applyResponsiveEnhancements();
            
            // Re-apply on window resize
            window.addEventListener('resize', this.debounce(() => {
                const newBreakpoint = this.getCurrentBreakpoint();
                if (newBreakpoint !== this.currentBreakpoint) {
                    this.currentBreakpoint = newBreakpoint;
                    this.applyResponsiveEnhancements();
                }
            }, 250));
            
            // Also apply when page content is updated
            document.addEventListener('page-content-updated', () => {
                this.applyResponsiveEnhancements();
            });
        }
        
        getCurrentBreakpoint() {
            const width = window.innerWidth;
            if (width < breakpoints.sm) return 'xs';
            if (width < breakpoints.md) return 'sm';
            if (width < breakpoints.lg) return 'md';
            if (width < breakpoints.xl) return 'lg';
            if (width < breakpoints.xxl) return 'xl';
            return 'xxl';
        }
        
        initMediaQueries() {
            // Create media query listeners for each breakpoint
            Object.entries(breakpoints).forEach(([name, width], index, array) => {
                if (index < array.length - 1) {
                    const maxWidth = array[index + 1][1] - 1;
                    const mediaQuery = window.matchMedia(`(min-width: ${width}px) and (max-width: ${maxWidth}px)`);
                    
                    mediaQuery.addEventListener('change', e => {
                        if (e.matches) {
                            this.currentBreakpoint = name;
                            this.applyResponsiveEnhancements();
                        }
                    });
                } else {
                    const mediaQuery = window.matchMedia(`(min-width: ${width}px)`);
                    
                    mediaQuery.addEventListener('change', e => {
                        if (e.matches) {
                            this.currentBreakpoint = name;
                            this.applyResponsiveEnhancements();
                        }
                    });
                }
            });
        }
        
        applyResponsiveEnhancements() {
            console.log(`Applying responsive enhancements for breakpoint: ${this.currentBreakpoint}`);
            
            // Apply modifications based on current breakpoint
            this.adjustLayout();
            this.optimizeNavigationForMobile();
            this.optimizeTables();
            this.optimizeCharts();
            this.adjustFontSizes();
            this.improveFormElementsOnMobile();
            
            // Dispatch event for other components to respond
            window.dispatchEvent(new CustomEvent('bf-responsive-updated', {
                detail: { breakpoint: this.currentBreakpoint }
            }));
        }
        
        adjustLayout() {
            const isSmall = ['xs', 'sm'].includes(this.currentBreakpoint);
            const isMedium = this.currentBreakpoint === 'md';
            
            // Adjust container paddings
            document.querySelectorAll('.container, .container-fluid, section').forEach(el => {
                if (isSmall) {
                    el.style.padding = el.classList.contains('hero') ? '2rem 1rem' : '1rem';
                } else {
                    el.style.padding = '';  // Reset to CSS default
                }
            });
            
            // Adjust grid layouts
            document.querySelectorAll('.row, .grid').forEach(el => {
                if (isSmall) {
                    el.style.gap = '1rem';
                } else {
                    el.style.gap = '';  // Reset to CSS default
                }
            });
            
            // Stack cards on small screens
            document.querySelectorAll('.card-grid, .stats-grid').forEach(el => {
                if (isSmall) {
                    el.style.gridTemplateColumns = '1fr';
                } else if (isMedium) {
                    el.style.gridTemplateColumns = '1fr 1fr';
                } else {
                    el.style.gridTemplateColumns = '';  // Reset to CSS default
                }
            });
            
            // Adjust dashboard layout
            const dashboard = document.querySelector('.dashboard-layout');
            if (dashboard) {
                if (isSmall) {
                    dashboard.classList.add('mobile-layout');
                    dashboard.classList.remove('tablet-layout', 'desktop-layout');
                } else if (isMedium) {
                    dashboard.classList.add('tablet-layout');
                    dashboard.classList.remove('mobile-layout', 'desktop-layout');
                } else {
                    dashboard.classList.add('desktop-layout');
                    dashboard.classList.remove('mobile-layout', 'tablet-layout');
                }
            }
            
            // Adjust hero sections
            document.querySelectorAll('.hero-content').forEach(el => {
                if (isSmall) {
                    el.style.maxWidth = '100%';
                    el.style.textAlign = 'center';
                } else {
                    el.style.maxWidth = '';
                    el.style.textAlign = '';
                }
            });
        }
        
        optimizeNavigationForMobile() {
            const isSmall = ['xs', 'sm'].includes(this.currentBreakpoint);
            
            // Get the header and nav elements
            const header = document.querySelector('header');
            const nav = header?.querySelector('nav');
            
            if (!header || !nav) return;
            
            // Check if mobile menu already exists
            let mobileMenuBtn = header.querySelector('.mobile-menu-toggle');
            
            if (isSmall) {
                // If small screen and no mobile button, create one
                if (!mobileMenuBtn) {
                    mobileMenuBtn = document.createElement('button');
                    mobileMenuBtn.className = 'mobile-menu-toggle';
                    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                    header.insertBefore(mobileMenuBtn, header.firstChild);
                    
                    // Add event listener to toggle menu
                    mobileMenuBtn.addEventListener('click', () => {
                        nav.classList.toggle('mobile-nav-open');
                        const icon = mobileMenuBtn.querySelector('i');
                        if (nav.classList.contains('mobile-nav-open')) {
                            icon.className = 'fas fa-times';
                        } else {
                            icon.className = 'fas fa-bars';
                        }
                    });
                }
                
                // Ensure nav has mobile classes
                nav.classList.add('mobile-nav');
                
                // Close menu when clicking outside
                document.addEventListener('click', (e) => {
                    if (nav.classList.contains('mobile-nav-open') && 
                        !nav.contains(e.target) && 
                        !mobileMenuBtn.contains(e.target)) {
                        nav.classList.remove('mobile-nav-open');
                        mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
                    }
                });
                
                // Close menu when clicking a nav link
                const navLinks = nav.querySelectorAll('a');
                navLinks.forEach(link => {
                    link.addEventListener('click', () => {
                        nav.classList.remove('mobile-nav-open');
                        mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
                    });
                });
                
            } else {
                // Remove mobile menu on larger screens
                if (mobileMenuBtn) {
                    mobileMenuBtn.remove();
                }
                
                nav.classList.remove('mobile-nav', 'mobile-nav-open');
            }
        }
        
        optimizeTables() {
            const isSmall = ['xs', 'sm'].includes(this.currentBreakpoint);
            
            // Make tables responsive
            document.querySelectorAll('table').forEach(table => {
                const parentEl = table.parentElement;
                
                // Skip if already wrapped
                if (parentEl.classList.contains('table-responsive')) return;
                
                if (isSmall) {
                    // Wrap table in responsive container if not already
                    const wrapper = document.createElement('div');
                    wrapper.className = 'table-responsive';
                    table.parentNode.insertBefore(wrapper, table);
                    wrapper.appendChild(table);
                    
                    // Add data attributes for mobile labels
                    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
                    
                    table.querySelectorAll('tbody tr').forEach(row => {
                        Array.from(row.cells).forEach((cell, i) => {
                            if (headers[i]) {
                                cell.setAttribute('data-label', headers[i]);
                            }
                        });
                    });
                    
                } else {
                    // Unwrap table if screen is larger
                    if (parentEl.classList.contains('table-responsive')) {
                        parentEl.replaceWith(table);
                    }
                    
                    // Remove data attributes
                    table.querySelectorAll('tbody td').forEach(cell => {
                        cell.removeAttribute('data-label');
                    });
                }
            });
        }
        
        optimizeCharts() {
            const isSmall = ['xs', 'sm'].includes(this.currentBreakpoint);
            const isMedium = this.currentBreakpoint === 'md';
            
            // Resize charts for better mobile display
            document.querySelectorAll('.chart-container').forEach(container => {
                const chart = window.Chart?.instances?.[container.querySelector('canvas')?.id];
                
                if (chart) {
                    if (isSmall) {
                        // Simplify legends on mobile
                        if (chart.options.plugins?.legend) {
                            chart.options.plugins.legend.position = 'bottom';
                            chart.options.plugins.legend.labels = {
                                boxWidth: 10,
                                font: {
                                    size: 10
                                }
                            };
                        }
                        
                        // Reduce padding
                        chart.options.layout = {
                            padding: {
                                left: 10,
                                right: 10,
                                top: 10,
                                bottom: 10
                            }
                        };
                        
                        // Simplify tooltips
                        if (chart.options.plugins?.tooltip) {
                            chart.options.plugins.tooltip.displayColors = false;
                        }
                        
                    } else if (isMedium) {
                        // Medium screen adjustments
                        if (chart.options.plugins?.legend) {
                            chart.options.plugins.legend.position = 'bottom';
                            chart.options.plugins.legend.labels = {
                                boxWidth: 12,
                                font: {
                                    size: 12
                                }
                            };
                        }
                        
                    } else {
                        // Reset to defaults for larger screens
                        if (chart.options.plugins?.legend) {
                            chart.options.plugins.legend.position = 'top';
                            chart.options.plugins.legend.labels = {
                                boxWidth: 15,
                                font: {
                                    size: 14
                                }
                            };
                        }
                        
                        chart.options.layout = {
                            padding: {
                                left: 20,
                                right: 20,
                                top: 20,
                                bottom: 20
                            }
                        };
                        
                        if (chart.options.plugins?.tooltip) {
                            chart.options.plugins.tooltip.displayColors = true;
                        }
                    }
                    
                    chart.update();
                }
            });
        }
        
        adjustFontSizes() {
            const isSmall = ['xs', 'sm'].includes(this.currentBreakpoint);
            
            if (isSmall) {
                document.querySelectorAll('h1').forEach(el => {
                    el.style.fontSize = '1.8rem';
                });
                
                document.querySelectorAll('h2').forEach(el => {
                    el.style.fontSize = '1.5rem';
                });
                
                document.querySelectorAll('h3').forEach(el => {
                    el.style.fontSize = '1.3rem';
                });
                
                document.querySelectorAll('.card-title').forEach(el => {
                    el.style.fontSize = '1.1rem';
                });
                
                document.querySelectorAll('.value-large, .stat-value').forEach(el => {
                    el.style.fontSize = '1.5rem';
                });
                
            } else {
                // Reset to CSS defaults
                document.querySelectorAll('h1, h2, h3, .card-title, .value-large, .stat-value').forEach(el => {
                    el.style.fontSize = '';
                });
            }
        }
        
        improveFormElementsOnMobile() {
            const isSmall = ['xs', 'sm'].includes(this.currentBreakpoint);
            
            // Adjust form elements for better touch experience
            if (isSmall) {
                document.querySelectorAll('input, select, textarea, button:not(.icon-btn)').forEach(el => {
                    el.style.minHeight = '44px'; // Apple's recommended minimum touch target
                });
                
                document.querySelectorAll('button.icon-btn, .btn-icon').forEach(el => {
                    el.style.minWidth = '44px';
                    el.style.minHeight = '44px';
                });
                
                // Stack form layouts on mobile
                document.querySelectorAll('.form-row, .form-group').forEach(el => {
                    el.style.flexDirection = 'column';
                    el.style.marginBottom = '1rem';
                });
                
                document.querySelectorAll('.form-row > *, .form-group > *').forEach(el => {
                    el.style.width = '100%';
                    el.style.marginBottom = '0.5rem';
                });
                
            } else {
                // Reset to CSS defaults
                document.querySelectorAll('input, select, textarea, button, .form-row, .form-group, .form-row > *, .form-group > *').forEach(el => {
                    el.style.minHeight = '';
                    el.style.minWidth = '';
                    el.style.flexDirection = '';
                    el.style.marginBottom = '';
                    el.style.width = '';
                });
            }
        }
        
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    }
    
    // Add responsive CSS
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        /* Mobile Navigation Styles */
        .mobile-menu-toggle {
            display: none;
            background: transparent;
            border: none;
            color: var(--text-primary);
            font-size: 1.5rem;
            cursor: pointer;
            width: 44px;
            height: 44px;
            align-items: center;
            justify-content: center;
            z-index: 100;
        }
        
        @media (max-width: 767px) {
            .mobile-menu-toggle {
                display: flex;
            }
            
            .mobile-nav {
                position: fixed;
                top: 0;
                left: -100%;
                width: 80%;
                max-width: 300px;
                height: 100vh;
                background: var(--card-bg);
                z-index: 99;
                padding: 5rem 1rem 1rem;
                transition: left 0.3s ease;
                box-shadow: 5px 0 15px rgba(0, 0, 0, 0.1);
                overflow-y: auto;
                flex-direction: column !important;
                align-items: flex-start !important;
            }
            
            .dark-theme .mobile-nav {
                backdrop-filter: blur(20px);
                background: rgba(15, 23, 42, 0.95);
                box-shadow: 5px 0 15px rgba(0, 0, 0, 0.3);
                border-right: 1px solid rgba(148, 163, 184, 0.1);
            }
            
            .mobile-nav-open {
                left: 0;
            }
            
            .mobile-nav .nav-link {
                width: 100%;
                padding: 0.75rem 0;
                border-bottom: 1px solid var(--border);
            }
            
            /* Hide desktop elements on mobile */
            .desktop-only {
                display: none !important;
            }
        }
        
        /* Responsive Tables */
        .table-responsive {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }
        
        @media (max-width: 767px) {
            /* Convert tables to cards on mobile */
            table.responsive-card-table {
                border: none;
                box-shadow: none;
                background: transparent;
            }
            
            table.responsive-card-table thead {
                display: none;
            }
            
            table.responsive-card-table tbody tr {
                display: block;
                margin-bottom: 1rem;
                border-radius: 8px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
                background: var(--card-bg);
                border: 1px solid var(--border);
            }
            
            table.responsive-card-table tbody td {
                display: flex;
                justify-content: space-between;
                align-items: center;
                text-align: right;
                padding: 0.75rem;
                border: none;
                border-bottom: 1px solid var(--border);
            }
            
            table.responsive-card-table tbody td:last-child {
                border-bottom: none;
            }
            
            table.responsive-card-table tbody td:before {
                content: attr(data-label);
                font-weight: 600;
                margin-right: 1rem;
                text-align: left;
            }
        }
        
        /* Responsive Grid Layouts */
        @media (max-width: 767px) {
            .mobile-stack {
                flex-direction: column !important;
            }
            
            .mobile-full-width {
                width: 100% !important;
                max-width: 100% !important;
                flex-basis: 100% !important;
            }
            
            .mobile-text-center {
                text-align: center !important;
            }
            
            .mobile-hidden {
                display: none !important;
            }
            
            .mobile-p-sm {
                padding: 0.5rem !important;
            }
            
            .mobile-m-sm {
                margin: 0.5rem !important;
            }
            
            /* Dashboard Specific */
            .dashboard-layout.mobile-layout {
                grid-template-columns: 1fr !important;
                grid-template-areas:
                    "header"
                    "main"
                    "sidebar" !important;
            }
            
            /* Cards on mobile */
            .card-grid {
                grid-template-columns: 1fr !important;
            }
            
            .card {
                margin-bottom: 1rem !important;
            }
        }
        
        /* Tablet Layouts */
        @media (min-width: 768px) and (max-width: 991px) {
            .tablet-two-columns {
                grid-template-columns: 1fr 1fr !important;
            }
            
            .dashboard-layout.tablet-layout {
                grid-template-columns: 3fr 1fr !important;
            }
            
            .tablet-hidden {
                display: none !important;
            }
        }
        
        /* Touch-friendly inputs */
        @media (max-width: 767px) {
            input, select, button, .btn {
                min-height: 44px;
            }
            
            .form-group {
                margin-bottom: 1rem;
            }
            
            /* Increase spacing for touch */
            .btn-group .btn {
                padding-left: 1rem;
                padding-right: 1rem;
            }
            
            /* Enhance select elements */
            select {
                padding-right: 2rem !important;
                background-position: right 0.75rem center !important;
                background-size: 0.75rem !important;
            }
        }
        
        /* Fix viewport issues */
        @media screen and (max-width: 767px) {
            .container {
                padding-left: 1rem !important;
                padding-right: 1rem !important;
            }
            
            .row {
                margin-left: -0.5rem !important;
                margin-right: -0.5rem !important;
            }
            
            .col, [class^="col-"] {
                padding-left: 0.5rem !important;
                padding-right: 0.5rem !important;
            }
        }
    `;
    
    document.head.appendChild(styleElement);
    
    // Initialize responsive design
    const responsiveDesign = new ResponsiveDesign();
    
    // Expose to global scope
    window.responsiveDesign = responsiveDesign;
})();
