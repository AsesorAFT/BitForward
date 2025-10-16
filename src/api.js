/**
 * Cliente API BitForward
 * Maneja todas las comunicaciones con el backend
 */

class BitForwardAPI {
    constructor() {
        this.baseURL = window.location.origin;
        this.apiURL = `${this.baseURL}/api`;
        this.token = localStorage.getItem('bitforward_token');
    }

    /**
     * Realiza una petición HTTP
     */
    async request(endpoint, options = {}) {
        const url = `${this.apiURL}${endpoint}`;
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Agregar token de autenticación si existe
        if (this.token) {
            config.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Error en la petición');
            }

            return data;

        } catch (error) {
            console.error('Error en API request:', error);
            
            // Si el token expiró, limpiar almacenamiento local
            if (error.message.includes('Token') || error.message.includes('401')) {
                this.clearAuth();
            }
            
            throw error;
        }
    }

    /**
     * Obtiene el estado de salud de la API
     */
    async getHealth() {
        return this.request('/health');
    }

    /**
     * Obtiene estadísticas del dashboard
     */
    async getDashboardStats() {
        return this.request('/stats/dashboard');
    }

    /**
     * Obtiene lista de contratos
     */
    async getContracts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/contracts${queryString ? '?' + queryString : ''}`;
        return this.request(endpoint);
    }

    /**
     * Obtiene un contrato específico
     */
    async getContract(id) {
        return this.request(`/contracts/${id}`);
    }

    /**
     * Crea un nuevo contrato
     */
    async createContract(contractData) {
        return this.request('/contracts', {
            method: 'POST',
            body: JSON.stringify(contractData)
        });
    }

    /**
     * Actualiza un contrato existente
     */
    async updateContract(id, updateData) {
        return this.request(`/contracts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    }

    /**
     * Se une a un contrato como contraparte
     */
    async joinContract(id, participantData) {
        return this.request(`/contracts/${id}/join`, {
            method: 'POST',
            body: JSON.stringify(participantData)
        });
    }

    /**
     * Cancela un contrato
     */
    async cancelContract(id) {
        return this.request(`/contracts/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Registra un nuevo usuario
     */
    async register(userData) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response.success && response.data.token) {
            this.setAuth(response.data.token, response.data.user);
        }

        return response;
    }

    /**
     * Inicia sesión
     */
    async login(credentials) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (response.success && response.data.token) {
            this.setAuth(response.data.token, response.data.user);
        }

        return response;
    }

    /**
     * Cierra sesión
     */
    async logout() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.warn('Error al hacer logout:', error);
        } finally {
            this.clearAuth();
        }
    }

    /**
     * Obtiene el perfil del usuario
     */
    async getProfile() {
        return this.request('/auth/profile');
    }

    /**
     * Renueva el token de autenticación
     */
    async refreshToken() {
        if (!this.token) {
            throw new Error('No hay token para renovar');
        }

        const response = await this.request('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ token: this.token })
        });

        if (response.success && response.data.token) {
            this.token = response.data.token;
            localStorage.setItem('bitforward_token', this.token);
        }

        return response;
    }

    /**
     * Establece la autenticación
     */
    setAuth(token, user) {
        this.token = token;
        localStorage.setItem('bitforward_token', token);
        
        if (user) {
            localStorage.setItem('bitforward_user', JSON.stringify(user));
        }

        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('bitforward:auth:login', {
            detail: { user, token }
        }));
    }

    /**
     * Limpia la autenticación
     */
    clearAuth() {
        this.token = null;
        localStorage.removeItem('bitforward_token');
        localStorage.removeItem('bitforward_user');

        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('bitforward:auth:logout'));
    }

    /**
     * Verifica si el usuario está autenticado
     */
    isAuthenticated() {
        return !!this.token;
    }

    /**
     * Obtiene el usuario actual del localStorage
     */
    getCurrentUser() {
        const userStr = localStorage.getItem('bitforward_user');
        return userStr ? JSON.parse(userStr) : null;
    }

    /**
     * Maneja errores de red y muestra notificaciones
     */
    handleError(error, context = '') {
        console.error(`Error en ${context}:`, error);
        
        let message = 'Ha ocurrido un error inesperado';
        
        if (error.message.includes('fetch')) {
            message = 'Error de conexión. Verifica tu conexión a internet.';
        } else if (error.message.includes('401') || error.message.includes('Token')) {
            message = 'Sesión expirada. Por favor, inicia sesión nuevamente.';
        } else if (error.message.includes('403')) {
            message = 'No tienes permisos para realizar esta acción.';
        } else if (error.message.includes('404')) {
            message = 'Recurso no encontrado.';
        } else if (error.message.includes('429')) {
            message = 'Demasiadas peticiones. Intenta nuevamente en unos minutos.';
        } else {
            message = error.message;
        }

        // Mostrar notificación si el sistema está disponible
        if (window.notificationSystem) {
            window.notificationSystem.error(message, {
                title: '❌ Error',
                duration: 5000
            });
        } else {
            console.error('Notification system not available:', message);
        }

        return message;
    }
}

// Crear instancia global
window.bitForwardAPI = new BitForwardAPI();

// Export para módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BitForwardAPI;
}
