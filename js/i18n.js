/**
 * Sistema de Internacionalización (i18n) para BitForward
 * Soporte para español e inglés
 */

class BitForwardI18n {
    constructor() {
        this.currentLanguage = localStorage.getItem('bitforward-language') || 'es';
        this.translations = {
            es: {
                // Header
                'dashboard.title': 'Panel de BitForward',
                'user.updated': 'Actualizado',
                
                // Dashboard Widgets
                'portfolio.overview': 'Resumen de Cartera',
                'portfolio.total.contracts': 'Total Contratos',
                'portfolio.active': 'Activos',
                'portfolio.total.pnl': 'P&L Total',
                'portfolio.risk.level': 'Nivel de Riesgo',
                'portfolio.risk.low': 'BAJO',
                'portfolio.risk.medium': 'MEDIO',
                'portfolio.risk.high': 'ALTO',
                'portfolio.risk.very_high': 'MUY ALTO',
                
                'performance.title': 'Rendimiento',
                'performance.win.rate': 'Tasa de Éxito',
                'performance.avg.holding': 'Período Promedio',
                'performance.success.rate': 'Tasa de Éxito',
                'performance.days': 'días',
                
                'risk.metrics': 'Métricas de Riesgo',
                'market.overview': 'Resumen del Mercado',
                'contracts.active': 'Contratos Activos',
                
                // Login
                'login.title': 'BitForward',
                'login.subtitle': 'Plataforma Avanzada de Contratos Forward DeFi',
                'login.username': 'Usuario',
                'login.username.placeholder': 'Ingresa tu usuario',
                'login.password': 'Contraseña',
                'login.password.placeholder': 'Ingresa tu contraseña',
                'login.button': 'Iniciar Sesión',
                'login.demo.credentials': 'Credenciales de demostración',
                'login.wallet.connect': 'O conecta con billetera',
                'login.connect.wallet': 'Conectar Billetera',
                
                // Contract Creation
                'contract.create': 'Crear Contrato Forward',
                'contract.blockchain': 'Blockchain',
                'contract.blockchain.select': 'Seleccionar Blockchain',
                'contract.type': 'Tipo de Contrato',
                'contract.type.standard': 'Forward Estándar',
                'contract.type.american': 'Estilo Americano',
                'contract.type.european': 'Estilo Europeo',
                'contract.amount': 'Cantidad',
                'contract.strike.price': 'Precio de Ejercicio (USD)',
                'contract.counterparty': 'Dirección de Contraparte',
                'contract.counterparty.placeholder': 'Ingresa la dirección de la billetera de la contraparte',
                'contract.execution.date': 'Fecha de Ejecución',
                'contract.collateral': 'Colateral (%)',
                'contract.preview': 'Vista Previa',
                'contract.create.button': 'Crear Contrato',
                
                // Contract Preview
                'preview.title': 'Vista Previa del Contrato',
                'preview.asset': 'Activo',
                'preview.strike': 'Precio de Ejercicio',
                'preview.expiry': 'Vencimiento',
                'preview.risk': 'Nivel de Riesgo',
                'preview.creation.fee': 'Comisión de Creación',
                'preview.total.fees': 'Comisiones Totales',
                
                // Notifications
                'notification.login.success': '¡Inicio de sesión exitoso! Bienvenido al Panel de BitForward',
                'notification.login.failed': 'Error en el inicio de sesión',
                'notification.login.required': 'Debes iniciar sesión para acceder a este producto',
                'notification.wallet.connecting': 'Conectando a',
                'notification.wallet.connected': 'conectado exitosamente',
                'notification.wallet.failed': 'Error al conectar',
                'notification.wallet.options': '¡Opciones de conexión de billetera próximamente!',
                'notification.contract.created': 'creado exitosamente',
                'notification.contract.failed': 'Error al crear contrato',
                
                // FAB Menu
                'fab.new.contract': 'Nuevo Contrato',
                'fab.connect.wallet': 'Conectar Billetera',
                'fab.analytics': 'Analíticas',
                
                // Analytics
                'analytics.overview': 'Resumen de Analíticas',
                'analytics.portfolio.performance': 'Rendimiento de Cartera',
                'analytics.market.data': 'Datos del Mercado',
                'analytics.total.contracts': 'Total de Contratos',
                'analytics.success.rate': 'Tasa de Éxito',
                
                // Loading
                'loading.initializing': 'Inicializando Plataforma de Contratos Forward DeFi...',
                
                // Buttons
                'button.close': 'Cerrar',
                'button.cancel': 'Cancelar',
                'button.save': 'Guardar',
                'button.continue': 'Continuar',
                
                // Status
                'status.active': 'Activo',
                'status.pending': 'Pendiente',
                'status.completed': 'Completado',
                'status.failed': 'Fallido',
                
                // Language Selector
                'language.selector': 'Idioma',
                'language.spanish': 'Español',
                'language.english': 'English',
                
                // Time
                'time.minutes': 'minutos',
                'time.hours': 'horas',
                'time.days': 'días',
                'time.weeks': 'semanas',
                'time.months': 'meses'
            },
            
            en: {
                // Header
                'dashboard.title': 'BitForward Dashboard',
                'user.updated': 'Updated',
                
                // Dashboard Widgets
                'portfolio.overview': 'Portfolio Overview',
                'portfolio.total.contracts': 'Total Contracts',
                'portfolio.active': 'Active',
                'portfolio.total.pnl': 'Total P&L',
                'portfolio.risk.level': 'Risk Level',
                'portfolio.risk.low': 'LOW',
                'portfolio.risk.medium': 'MEDIUM',
                'portfolio.risk.high': 'HIGH',
                'portfolio.risk.very_high': 'VERY HIGH',
                
                'performance.title': 'Performance',
                'performance.win.rate': 'Win Rate',
                'performance.avg.holding': 'Avg Holding Period',
                'performance.success.rate': 'Success Rate',
                'performance.days': 'days',
                
                'risk.metrics': 'Risk Metrics',
                'market.overview': 'Market Overview',
                'contracts.active': 'Active Contracts',
                
                // Login
                'login.title': 'BitForward',
                'login.subtitle': 'Advanced DeFi Forward Contracts Platform',
                'login.username': 'Username',
                'login.username.placeholder': 'Enter your username',
                'login.password': 'Password',
                'login.password.placeholder': 'Enter your password',
                'login.button': 'Login to Dashboard',
                'login.demo.credentials': 'Demo credentials',
                'login.wallet.connect': 'Or connect with wallet',
                'login.connect.wallet': 'Connect Wallet',
                
                // Contract Creation
                'contract.create': 'Create Forward Contract',
                'contract.blockchain': 'Blockchain',
                'contract.blockchain.select': 'Select Blockchain',
                'contract.type': 'Contract Type',
                'contract.type.standard': 'Standard Forward',
                'contract.type.american': 'American Style',
                'contract.type.european': 'European Style',
                'contract.amount': 'Amount',
                'contract.strike.price': 'Strike Price (USD)',
                'contract.counterparty': 'Counterparty Address',
                'contract.counterparty.placeholder': 'Enter counterparty wallet address',
                'contract.execution.date': 'Execution Date',
                'contract.collateral': 'Collateral (%)',
                'contract.preview': 'Preview',
                'contract.create.button': 'Create Contract',
                
                // Contract Preview
                'preview.title': 'Contract Preview',
                'preview.asset': 'Asset',
                'preview.strike': 'Strike Price',
                'preview.expiry': 'Expiry',
                'preview.risk': 'Risk Level',
                'preview.creation.fee': 'Creation Fee',
                'preview.total.fees': 'Total Fees',
                
                // Notifications
                'notification.login.success': 'Login successful! Welcome to BitForward Dashboard',
                'notification.login.failed': 'Login failed',
                'notification.login.required': 'You must log in to access this product',
                'notification.wallet.connecting': 'Connecting to',
                'notification.wallet.connected': 'connected successfully',
                'notification.wallet.failed': 'Failed to connect',
                'notification.wallet.options': 'Wallet connection options coming soon!',
                'notification.contract.created': 'created successfully',
                'notification.contract.failed': 'Failed to create contract',
                
                // FAB Menu
                'fab.new.contract': 'New Contract',
                'fab.connect.wallet': 'Connect Wallet',
                'fab.analytics': 'Analytics',
                
                // Analytics
                'analytics.overview': 'Analytics Overview',
                'analytics.portfolio.performance': 'Portfolio Performance',
                'analytics.market.data': 'Market Data',
                'analytics.total.contracts': 'Total Contracts',
                'analytics.success.rate': 'Success Rate',
                
                // Loading
                'loading.initializing': 'Initializing DeFi Forward Contracts Platform...',
                
                // Buttons
                'button.close': 'Close',
                'button.cancel': 'Cancel',
                'button.save': 'Save',
                'button.continue': 'Continue',
                
                // Status
                'status.active': 'Active',
                'status.pending': 'Pending',
                'status.completed': 'Completed',
                'status.failed': 'Failed',
                
                // Language Selector
                'language.selector': 'Language',
                'language.spanish': 'Español',
                'language.english': 'English',
                
                // Time
                'time.minutes': 'minutes',
                'time.hours': 'hours',
                'time.days': 'days',
                'time.weeks': 'weeks',
                'time.months': 'months'
            }
        };
        
        this.init();
    }
    
    init() {
        this.createLanguageSelector();
        this.translatePage();
    }
    
    createLanguageSelector() {
        // Crear selector de idioma en el header
        const header = document.querySelector('.dashboard-header');
        if (header) {
            const userInfo = header.querySelector('.user-info');
            if (userInfo) {
                const langSelector = document.createElement('div');
                langSelector.className = 'language-selector';
                langSelector.innerHTML = `
                    <select id="language-select" class="language-select">
                        <option value="es" ${this.currentLanguage === 'es' ? 'selected' : ''}>🇪🇸 Español</option>
                        <option value="en" ${this.currentLanguage === 'en' ? 'selected' : ''}>🇺🇸 English</option>
                    </select>
                `;
                
                userInfo.appendChild(langSelector);
                
                // Event listener para cambio de idioma
                document.getElementById('language-select').addEventListener('change', (e) => {
                    this.changeLanguage(e.target.value);
                });
            }
        }
        
        // También crear en la pantalla de login
        const loginContainer = document.querySelector('.login-container');
        if (loginContainer) {
            const langSelector = document.createElement('div');
            langSelector.className = 'language-selector login-language';
            langSelector.innerHTML = `
                <select id="login-language-select" class="language-select">
                    <option value="es" ${this.currentLanguage === 'es' ? 'selected' : ''}>🇪🇸 Español</option>
                    <option value="en" ${this.currentLanguage === 'en' ? 'selected' : ''}>🇺🇸 English</option>
                </select>
            `;
            
            loginContainer.insertBefore(langSelector, loginContainer.firstChild);
            
            document.getElementById('login-language-select').addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });
        }
    }
    
    changeLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('bitforward-language', lang);
            this.translatePage();
        }
    }
    
    t(key, params = {}) {
        const translation = this.translations[this.currentLanguage][key] || key;
        
        // Reemplazar parámetros en la traducción
        let result = translation;
        Object.keys(params).forEach(param => {
            result = result.replace(`{${param}}`, params[param]);
        });
        
        return result;
    }
    
    translatePage() {
        // Traducir elementos con atributo data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });
        
        // Traducir placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });
        
        // Traducir títulos
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });
        
        // Actualizar textos específicos del dashboard
        this.updateDashboardTexts();
    }
    
    updateDashboardTexts() {
        // Header del dashboard
        const dashboardTitle = document.querySelector('.dashboard-header h1');
        if (dashboardTitle) {
            dashboardTitle.textContent = this.t('dashboard.title');
        }
        
        // Actualizar timestamp
        const lastUpdate = document.querySelector('.last-update');
        if (lastUpdate) {
            const time = lastUpdate.textContent.split(': ')[1];
            if (time) {
                lastUpdate.textContent = `${this.t('user.updated')}: ${time}`;
            }
        }
        
        // Widgets del dashboard
        this.updateWidgetTitles();
        this.updatePortfolioWidget();
        this.updatePerformanceWidget();
    }
    
    updateWidgetTitles() {
        const widgets = [
            { selector: '#portfolio-widget h3', key: 'portfolio.overview' },
            { selector: '#performance-widget h3', key: 'performance.title' },
            { selector: '#risk-widget h3', key: 'risk.metrics' },
            { selector: '#market-widget h3', key: 'market.overview' },
            { selector: '#contracts-widget h3', key: 'contracts.active' }
        ];
        
        widgets.forEach(widget => {
            const element = document.querySelector(widget.selector);
            if (element) {
                element.textContent = this.t(widget.key);
            }
        });
    }
    
    updatePortfolioWidget() {
        const labels = document.querySelectorAll('#portfolio-widget .label');
        const labelKeys = [
            'portfolio.total.contracts',
            'portfolio.active',
            'portfolio.total.pnl',
            'portfolio.risk.level'
        ];
        
        labels.forEach((label, index) => {
            if (labelKeys[index]) {
                label.textContent = this.t(labelKeys[index]);
            }
        });
        
        // Actualizar el nivel de riesgo
        const riskValue = document.querySelector('#portfolio-widget .risk-low');
        if (riskValue && riskValue.textContent === 'LOW') {
            riskValue.textContent = this.t('portfolio.risk.low');
        }
    }
    
    updatePerformanceWidget() {
        const metricCards = document.querySelectorAll('#performance-widget .metric-card h4');
        const cardKeys = [
            'performance.win.rate',
            'performance.avg.holding',
            'performance.success.rate'
        ];
        
        metricCards.forEach((card, index) => {
            if (cardKeys[index]) {
                card.textContent = this.t(cardKeys[index]);
            }
        });
        
        // Actualizar "days" text
        const daysText = document.querySelector('#performance-widget .big-number:contains("days")');
        if (daysText && daysText.textContent.includes('days')) {
            daysText.textContent = daysText.textContent.replace('days', this.t('performance.days'));
        }
    }
    
    formatTime(value, unit) {
        return `${value} ${this.t(`time.${unit}`)}`;
    }
    
    formatCurrency(amount, currency = 'USD') {
        const locale = this.currentLanguage === 'es' ? 'es-ES' : 'en-US';
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    }
    
    formatNumber(number) {
        const locale = this.currentLanguage === 'es' ? 'es-ES' : 'en-US';
        return new Intl.NumberFormat(locale).format(number);
    }
}

// Crear instancia global
window.i18n = new BitForwardI18n();

// CSS para el selector de idioma
const style = document.createElement('style');
style.textContent = `
    .language-selector {
        margin-left: 1rem;
    }
    
    .language-selector.login-language {
        position: absolute;
        top: 1rem;
        right: 1rem;
        margin: 0;
        z-index: 10;
    }
    
    .language-select {
        background: rgba(255, 255, 255, 0.9);
        border: 2px solid #FFD700;
        border-radius: 6px;
        padding: 0.5rem;
        font-size: 0.9rem;
        color: #1e3c72;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .language-select:hover {
        background: white;
        border-color: #FFA500;
    }
    
    .language-select:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.3);
    }
    
    @media (max-width: 768px) {
        .language-selector {
            margin-left: 0;
            margin-top: 0.5rem;
        }
        
        .language-selector.login-language {
            position: static;
            text-align: center;
            margin-bottom: 1rem;
        }
    }
`;
document.head.appendChild(style);
