// BitForward - Main JavaScript

// Global App Object
const BitForward = {
    // App configuration
    config: {
        walletConnected: false,
        currentUser: null,
        theme: 'light'
    },
    
    // Initialize the application
    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.setupMobileMenu();
        this.setupContractForm();
        this.loadUserData();
        console.log('BitForward app initialized');
    },
    
    // Event listeners setup
    setupEventListeners() {
        // Wallet connection
        const connectWalletBtn = document.querySelector('.btn-primary');
        if (connectWalletBtn && connectWalletBtn.textContent.includes('Conectar Wallet')) {
            connectWalletBtn.addEventListener('click', this.handleWalletConnection.bind(this));
        }
        
        // Hero CTA buttons
        const heroButtons = document.querySelectorAll('.hero-cta .btn');
        heroButtons.forEach(btn => {
            btn.addEventListener('click', this.handleHeroCTA.bind(this));
        });
        
        // Form preview button
        const previewBtn = document.querySelector('.form-actions .btn-secondary');
        if (previewBtn) {
            previewBtn.addEventListener('click', this.handleContractPreview.bind(this));
        }
    },
    
    // Navigation setup
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all links
                navLinks.forEach(l => l.classList.remove('active'));
                
                // Add active class to clicked link
                link.classList.add('active');
                
                // Smooth scroll to section
                const targetId = link.getAttribute('href');
                if (targetId.startsWith('#')) {
                    const targetSection = document.querySelector(targetId);
                    if (targetSection) {
                        targetSection.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
        
        // Update active nav link on scroll
        window.addEventListener('scroll', this.updateActiveNavLink.bind(this));
    },
    
    // Mobile menu setup
    setupMobileMenu() {
        const hamburger = document.querySelector('.hamburger');
        const navMenu = document.querySelector('.nav-menu');
        
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }
    },
    
    // Contract form setup
    setupContractForm() {
        const contractForm = document.querySelector('.contract-form-container');
        if (contractForm) {
            contractForm.addEventListener('submit', this.handleContractSubmission.bind(this));
            
            // Real-time form validation
            const inputs = contractForm.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.addEventListener('blur', this.validateField.bind(this));
                input.addEventListener('input', this.clearFieldError.bind(this));
            });
            
            // Update price preview when amount changes
            const amountInput = document.getElementById('amount');
            const priceInput = document.getElementById('price');
            if (amountInput && priceInput) {
                [amountInput, priceInput].forEach(input => {
                    input.addEventListener('input', this.updatePricePreview.bind(this));
                });
            }
        }
    },
    
    // Update active navigation link based on scroll position
    updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link');
        
        let currentSection = '';
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    },
    
    // Handle wallet connection
    async handleWalletConnection(e) {
        e.preventDefault();
        
        try {
            // Show loading state
            const btn = e.target;
            const originalText = btn.textContent;
            btn.textContent = 'Conectando...';
            btn.disabled = true;
            
            // Simulate wallet connection process
            await this.simulateWalletConnection();
            
            // Update UI for connected state
            btn.textContent = 'Wallet Conectado ✓';
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-secondary');
            
            this.config.walletConnected = true;
            this.showNotification('Wallet conectado exitosamente', 'success');
            
        } catch (error) {
            console.error('Error connecting wallet:', error);
            e.target.textContent = 'Error al conectar';
            this.showNotification('Error al conectar wallet', 'error');
            
            // Reset button after delay
            setTimeout(() => {
                e.target.textContent = 'Conectar Wallet';
                e.target.disabled = false;
            }, 3000);
        }
    },
    
    // Simulate wallet connection
    simulateWalletConnection() {
        return new Promise((resolve, reject) => {
            // Simulate async wallet connection
            setTimeout(() => {
                if (Math.random() > 0.1) { // 90% success rate
                    this.config.currentUser = {
                        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
                        balance: 0.05432
                    };
                    resolve();
                } else {
                    reject(new Error('Wallet connection failed'));
                }
            }, 2000);
        });
    },
    
    // Handle hero CTA buttons
    handleHeroCTA(e) {
        e.preventDefault();
        
        if (e.target.textContent.includes('Comenzar')) {
            // Scroll to contract creation form
            document.getElementById('create-contract').scrollIntoView({
                behavior: 'smooth'
            });
        } else if (e.target.textContent.includes('Demo')) {
            // Show demo modal or redirect to demo
            this.showDemo();
        }
    },
    
    // Show demo
    showDemo() {
        this.showNotification('Demo próximamente disponible', 'info');
    },
    
    // Handle contract form submission
    async handleContractSubmission(e) {
        e.preventDefault();
        
        if (!this.config.walletConnected) {
            this.showNotification('Por favor conecta tu wallet primero', 'warning');
            return;
        }
        
        const formData = new FormData(e.target);
        const contractData = Object.fromEntries(formData.entries());
        
        // Validate form
        if (!this.validateContractForm(contractData)) {
            return;
        }
        
        try {
            // Show loading state
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Creando contrato...';
            submitBtn.disabled = true;
            
            // Simulate contract creation
            await this.createContract(contractData);
            
            this.showNotification('Contrato creado exitosamente', 'success');
            this.resetContractForm(e.target);
            
        } catch (error) {
            console.error('Error creating contract:', error);
            this.showNotification('Error al crear contrato', 'error');
        } finally {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Crear Contrato';
            submitBtn.disabled = false;
        }
    },
    
    // Handle contract preview
    handleContractPreview(e) {
        e.preventDefault();
        
        const form = document.querySelector('.contract-form-container');
        const formData = new FormData(form);
        const contractData = Object.fromEntries(formData.entries());
        
        this.showContractPreview(contractData);
    },
    
    // Show contract preview modal
    showContractPreview(contractData) {
        const preview = `
            <div class="contract-preview">
                <h3>Vista Previa del Contrato</h3>
                <div class="preview-details">
                    <p><strong>Tipo:</strong> ${contractData.contractType === 'buy' ? 'Compra' : 'Venta'} Forward</p>
                    <p><strong>Activo:</strong> ${contractData.asset}</p>
                    <p><strong>Cantidad:</strong> ${contractData.amount}</p>
                    <p><strong>Precio:</strong> $${contractData.price}</p>
                    <p><strong>Vencimiento:</strong> ${contractData.expiryDate}</p>
                    <p><strong>Valor Total:</strong> $${(parseFloat(contractData.amount) * parseFloat(contractData.price)).toFixed(2)}</p>
                </div>
            </div>
        `;
        
        this.showModal('Vista Previa del Contrato', preview);
    },
    
    // Validate individual form field
    validateField(e) {
        const field = e.target;
        const value = field.value.trim();
        
        // Remove existing error
        this.clearFieldError(e);
        
        // Validation rules
        let isValid = true;
        let errorMessage = '';
        
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'Este campo es requerido';
        } else if (field.type === 'number' && value && (isNaN(value) || parseFloat(value) <= 0)) {
            isValid = false;
            errorMessage = 'Debe ser un número positivo';
        } else if (field.type === 'date' && value) {
            const selectedDate = new Date(value);
            const today = new Date();
            if (selectedDate <= today) {
                isValid = false;
                errorMessage = 'La fecha debe ser futura';
            }
        }
        
        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }
        
        return isValid;
    },
    
    // Clear field error
    clearFieldError(e) {
        const field = e.target;
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
        field.classList.remove('error');
    },
    
    // Show field error
    showFieldError(field, message) {
        field.classList.add('error');
        
        const errorElement = document.createElement('span');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.style.color = 'var(--error-color)';
        errorElement.style.fontSize = 'var(--font-size-xs)';
        errorElement.style.marginTop = 'var(--spacing-xs)';
        
        field.parentNode.appendChild(errorElement);
    },
    
    // Validate entire contract form
    validateContractForm(data) {
        const requiredFields = ['contractType', 'asset', 'amount', 'price', 'expiryDate'];
        
        for (const field of requiredFields) {
            if (!data[field] || data[field].trim() === '') {
                this.showNotification(`El campo ${field} es requerido`, 'error');
                return false;
            }
        }
        
        // Validate amount and price are positive numbers
        if (parseFloat(data.amount) <= 0 || parseFloat(data.price) <= 0) {
            this.showNotification('La cantidad y precio deben ser positivos', 'error');
            return false;
        }
        
        // Validate expiry date is in the future
        const expiryDate = new Date(data.expiryDate);
        const today = new Date();
        if (expiryDate <= today) {
            this.showNotification('La fecha de vencimiento debe ser futura', 'error');
            return false;
        }
        
        return true;
    },
    
    // Update price preview
    updatePricePreview() {
        const amount = parseFloat(document.getElementById('amount').value) || 0;
        const price = parseFloat(document.getElementById('price').value) || 0;
        const total = amount * price;
        
        // You can add a preview element to show total value
        let previewElement = document.querySelector('.price-preview');
        if (!previewElement) {
            previewElement = document.createElement('div');
            previewElement.className = 'price-preview';
            previewElement.style.marginTop = 'var(--spacing-md)';
            previewElement.style.fontWeight = '500';
            previewElement.style.color = 'var(--primary-color)';
            
            const formGrid = document.querySelector('.form-grid');
            formGrid.parentNode.insertBefore(previewElement, formGrid.nextSibling);
        }
        
        if (amount && price) {
            previewElement.textContent = `Valor total del contrato: $${total.toFixed(2)}`;
        } else {
            previewElement.textContent = '';
        }
    },
    
    // Create contract (simulation)
    createContract(contractData) {
        return new Promise((resolve) => {
            // Simulate contract creation on blockchain
            setTimeout(() => {
                const contractId = 'FWD-' + Math.floor(Math.random() * 10000).toString().padStart(3, '0');
                console.log('Contract created:', contractId, contractData);
                resolve(contractId);
            }, 3000);
        });
    },
    
    // Reset contract form
    resetContractForm(form) {
        form.reset();
        const previewElement = document.querySelector('.price-preview');
        if (previewElement) {
            previewElement.textContent = '';
        }
    },
    
    // Load user data
    loadUserData() {
        // Simulate loading user data from localStorage or API
        const savedData = localStorage.getItem('bitforward-user');
        if (savedData) {
            try {
                const userData = JSON.parse(savedData);
                this.config.currentUser = userData;
                console.log('User data loaded:', userData);
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        }
    },
    
    // Save user data
    saveUserData() {
        if (this.config.currentUser) {
            localStorage.setItem('bitforward-user', JSON.stringify(this.config.currentUser));
        }
    },
    
    // Show notification
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Styling
        Object.assign(notification.style, {
            position: 'fixed',
            top: '100px',
            right: '20px',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--border-radius)',
            color: 'white',
            fontWeight: '500',
            zIndex: '9999',
            transform: 'translateX(100%)',
            transition: 'transform var(--transition-normal)',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });
        
        // Type-specific styling
        switch (type) {
            case 'success':
                notification.style.backgroundColor = 'var(--success-color)';
                break;
            case 'error':
                notification.style.backgroundColor = 'var(--error-color)';
                break;
            case 'warning':
                notification.style.backgroundColor = 'var(--warning-color)';
                break;
            default:
                notification.style.backgroundColor = 'var(--accent-color)';
        }
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    },
    
    // Show modal
    showModal(title, content) {
        // Remove existing modal
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            background: white;
            padding: var(--spacing-xl);
            border-radius: var(--border-radius-lg);
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        modal.innerHTML = `
            <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
                <h3 style="margin: 0;">${title}</h3>
                <button class="modal-close" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        `;
        
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
        
        // Close modal events
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modalOverlay.remove();
        });
        
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
            }
        });
        
        // ESC key to close
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                modalOverlay.remove();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    }
};

// Utility functions
const Utils = {
    // Format Bitcoin amount
    formatBTC(amount) {
        return parseFloat(amount).toFixed(8) + ' BTC';
    },
    
    // Format currency
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },
    
    // Format date
    formatDate(date) {
        return new Intl.DateTimeFormat('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    },
    
    // Debounce function
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
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    BitForward.init();
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Refresh data when page becomes visible
        console.log('Page became visible, refreshing data...');
    }
});

// Handle before page unload
window.addEventListener('beforeunload', () => {
    BitForward.saveUserData();
});

// Export for testing or external access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BitForward, Utils };
}