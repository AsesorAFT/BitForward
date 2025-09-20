/**
 * BitForward Authentication System
 * Sistema completo de autenticación con JWT
 */

class BitForwardAuth {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.currentUser = null;
        this.token = null;
        
        this.init();
    }

    async init() {
        console.log('🔐 Inicializando sistema de autenticación BiT-ID...');
        
        // Verificar si hay un token guardado
        this.loadStoredAuth();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Verificar token existente
        if (this.token) {
            await this.verifyToken();
        }
        
        // Actualizar UI inicial
        this.updateAuthUI();
        
        console.log('✅ Sistema BiT-ID inicializado');
    }

    loadStoredAuth() {
        this.token = localStorage.getItem('bitforward_token');
        const userData = localStorage.getItem('bitforward_user');
        
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
            } catch (error) {
                console.error('Error parsing stored user data:', error);
                this.clearStoredAuth();
            }
        }
    }

    clearStoredAuth() {
        localStorage.removeItem('bitforward_token');
        localStorage.removeItem('bitforward_user');
        this.token = null;
        this.currentUser = null;
    }

    async verifyToken() {
        if (!this.token) {
            return false;
        }

        try {
            const response = await fetch(`${this.apiUrl}/auth/verify`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': this.token
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.currentUser = data.user;
                localStorage.setItem('bitforward_user', JSON.stringify(this.currentUser));
                return true;
            } else {
                // Token inválido o expirado
                this.clearStoredAuth();
                return false;
            }
        } catch (error) {
            console.error('Error verificando token:', error);
            this.clearStoredAuth();
            return false;
        }
    }

    setupEventListeners() {
        // Botones principales de auth
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.openModal('login-modal'));
        }
        
        if (registerBtn) {
            registerBtn.addEventListener('click', () => this.openModal('register-modal'));
        }
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Formularios
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Switches entre modales
        const switchToRegister = document.getElementById('switch-to-register');
        const switchToLogin = document.getElementById('switch-to-login');

        if (switchToRegister) {
            switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeModal('login-modal');
                this.openModal('register-modal');
            });
        }
        
        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeModal('register-modal');
                this.openModal('login-modal');
            });
        }

        // Cerrar modales
        document.querySelectorAll('.bf-modal-close, .bf-modal-backdrop').forEach(element => {
            element.addEventListener('click', (e) => {
                const modal = e.target.closest('.bf-modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Toggle de contraseña
        document.querySelectorAll('.bf-password-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => this.togglePassword(e));
        });

        // Validación de contraseña en tiempo real
        const registerPassword = document.getElementById('register-password');
        if (registerPassword) {
            registerPassword.addEventListener('input', (e) => this.checkPasswordStrength(e.target.value));
        }

        // Validación de confirmación de contraseña
        const confirmPassword = document.getElementById('register-confirm-password');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', (e) => this.validatePasswordMatch());
        }

        // Cerrar modal con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const submitBtn = document.getElementById('login-submit');
        const email = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            this.showNotification('Por favor completa todos los campos', 'error');
            return;
        }

        this.setLoading(submitBtn, true);

        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Error de autenticación');
            }

            // Guardar token y usuario
            this.token = data.token;
            this.currentUser = data.user;
            
            localStorage.setItem('bitforward_token', this.token);
            localStorage.setItem('bitforward_user', JSON.stringify(this.currentUser));

            // Cerrar modal y actualizar UI
            this.closeModal('login-modal');
            this.updateAuthUI();
            
            this.showNotification(`¡Bienvenido, ${this.currentUser.username}!`, 'success');
            
            // Limpiar formulario
            document.getElementById('login-form').reset();

        } catch (error) {
            console.error('Error en login:', error);
            this.showNotification(error.message, 'error');
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const submitBtn = document.getElementById('register-submit');
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const agreeTerms = document.getElementById('agree-terms').checked;

        // Validaciones
        if (!username || !email || !password || !confirmPassword) {
            this.showNotification('Por favor completa todos los campos', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Las contraseñas no coinciden', 'error');
            return;
        }

        if (password.length < 8) {
            this.showNotification('La contraseña debe tener al menos 8 caracteres', 'error');
            return;
        }

        if (!agreeTerms) {
            this.showNotification('Debes aceptar los términos y condiciones', 'error');
            return;
        }

        this.setLoading(submitBtn, true);

        try {
            const response = await fetch(`${this.apiUrl}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, email, password, confirmPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.msg || 'Error al crear la cuenta');
            }

            // Cerrar modal de registro
            this.closeModal('register-modal');
            
            // Mostrar modal de verificación
            document.getElementById('verification-email').textContent = email;
            this.openModal('verification-modal');
            
            this.showNotification('Cuenta creada exitosamente. Revisa tu email.', 'success');
            
            // Limpiar formulario
            document.getElementById('register-form').reset();

        } catch (error) {
            console.error('Error en registro:', error);
            this.showNotification(error.message, 'error');
        } finally {
            this.setLoading(submitBtn, false);
        }
    }

    logout() {
        this.clearStoredAuth();
        this.updateAuthUI();
        this.showNotification('Sesión cerrada exitosamente', 'info');
        
        // Redirigir a la página principal o recargar
        if (window.location.pathname !== '/enterprise.html') {
            window.location.href = '/enterprise.html';
        }
    }

    updateAuthUI() {
        const authButtons = document.getElementById('auth-buttons');
        const authenticatedMenu = document.getElementById('authenticated-menu');
        const userNameEl = document.getElementById('user-name');
        const userBalanceEl = document.getElementById('user-balance');

        if (this.isAuthenticated()) {
            // Mostrar menú autenticado
            if (authButtons) authButtons.style.display = 'none';
            if (authenticatedMenu) authenticatedMenu.style.display = 'flex';
            
            // Actualizar datos del usuario
            if (userNameEl && this.currentUser) {
                userNameEl.textContent = this.currentUser.username;
            }
            
            // Simular balance (en producción vendría de la API)
            if (userBalanceEl) {
                userBalanceEl.textContent = '$1,234,567.89';
            }
            
        } else {
            // Mostrar botones de auth
            if (authButtons) authButtons.style.display = 'flex';
            if (authenticatedMenu) authenticatedMenu.style.display = 'none';
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Focus en el primer input
            const firstInput = modal.querySelector('input[type="text"], input[type="email"]');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.bf-modal.active').forEach(modal => {
            this.closeModal(modal.id);
        });
    }

    togglePassword(event) {
        const toggle = event.currentTarget;
        const targetId = toggle.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = toggle.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    checkPasswordStrength(password) {
        const strengthBar = document.getElementById('password-strength');
        const strengthText = document.getElementById('password-strength-text');
        
        if (!strengthBar || !strengthText) return;

        let strength = 0;
        let feedback = '';

        if (password.length >= 6) strength++;
        if (password.match(/[a-z]/)) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^a-zA-Z0-9]/)) strength++;

        // Limpiar clases anteriores
        strengthBar.className = 'bf-strength-fill';

        switch (strength) {
            case 0:
            case 1:
                strengthBar.classList.add('weak');
                feedback = 'Muy débil';
                break;
            case 2:
                strengthBar.classList.add('fair');
                feedback = 'Débil';
                break;
            case 3:
                strengthBar.classList.add('good');
                feedback = 'Buena';
                break;
            case 4:
            case 5:
                strengthBar.classList.add('strong');
                feedback = 'Muy fuerte';
                break;
        }

        strengthText.textContent = password ? feedback : 'Ingresa una contraseña';
    }

    validatePasswordMatch() {
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const confirmInput = document.getElementById('register-confirm-password');

        if (confirmPassword && password !== confirmPassword) {
            confirmInput.classList.add('error');
            confirmInput.classList.remove('success');
        } else if (confirmPassword && password === confirmPassword) {
            confirmInput.classList.add('success');
            confirmInput.classList.remove('error');
        } else {
            confirmInput.classList.remove('error', 'success');
        }
    }

    setLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    showNotification(message, type = 'info') {
        // Remover notificaciones anteriores
        document.querySelectorAll('.bf-notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `bf-notification bf-notification-${type}`;
        notification.innerHTML = `
            <div class="bf-notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Mostrar animación
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto-remover
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    isAuthenticated() {
        return !!(this.token && this.currentUser);
    }

    getAuthToken() {
        return this.token;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    // Método para hacer peticiones autenticadas
    async authenticatedRequest(url, options = {}) {
        if (!this.isAuthenticated()) {
            throw new Error('Usuario no autenticado');
        }

        const headers = {
            'Content-Type': 'application/json',
            'x-auth-token': this.token,
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (response.status === 401) {
            this.clearStoredAuth();
            this.updateAuthUI();
            this.showNotification('Sesión expirada. Por favor inicia sesión nuevamente.', 'warning');
            throw new Error('Sesión expirada');
        }

        return response;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('login-btn') || document.getElementById('register-btn')) {
        window.BitForwardAuth = new BitForwardAuth();
    }
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BitForwardAuth;
}
