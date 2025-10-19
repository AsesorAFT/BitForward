/**
 * BitForward Service Worker Registration
 * Registra y gestiona el ciclo de vida del Service Worker
 * 
 * @version 1.0.0
 */

class ServiceWorkerManager {
    constructor() {
        this.registration = null;
        this.updateAvailable = false;
    }

    /**
     * Inicializar Service Worker
     */
    async init() {
        if (!('serviceWorker' in navigator)) {
            console.log('[SW Manager] Service Worker no soportado');
            return false;
        }

        try {
            // Usar Service Worker avanzado con estrategias de cache
            this.registration = await navigator.serviceWorker.register('/js/sw-advanced.js', {
                scope: '/',
                updateViaCache: 'none' // Siempre buscar actualizaciones
            });

            console.log('[SW Manager] Advanced Service Worker registrado:', this.registration.scope);

            // Escuchar actualizaciones
            this.registration.addEventListener('updatefound', () => {
                this.handleUpdate();
            });

            // Verificar actualizaciones cada 1 hora
            setInterval(() => {
                this.checkForUpdates();
            }, 60 * 60 * 1000);

            // Verificar si ya hay actualización disponible
            if (this.registration.waiting) {
                this.showUpdateNotification();
            }

            return true;

        } catch (error) {
            console.error('[SW Manager] Error al registrar Service Worker:', error);
            return false;
        }
    }

    /**
     * Manejar actualización del Service Worker
     */
    handleUpdate() {
        const newWorker = this.registration.installing;
        console.log('[SW Manager] Nueva versión del Service Worker detectada');

        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.updateAvailable = true;
                this.showUpdateNotification();
            }
        });
    }

    /**
     * Mostrar notificación de actualización
     */
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.id = 'sw-update-notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 10000;
                max-width: 400px;
                animation: slideIn 0.3s ease-out;
            ">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                    <div style="flex: 1;">
                        <div style="font-weight: 600; margin-bottom: 4px;">Nueva versión disponible</div>
                        <div style="font-size: 14px; opacity: 0.9;">Actualiza para obtener las últimas mejoras</div>
                    </div>
                </div>
                <div style="margin-top: 12px; display: flex; gap: 8px;">
                    <button id="sw-update-btn" style="
                        background: white;
                        color: #667eea;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 14px;
                    ">Actualizar ahora</button>
                    <button id="sw-dismiss-btn" style="
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Más tarde</button>
                </div>
            </div>
            <style>
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            </style>
        `;

        document.body.appendChild(notification);

        // Botón actualizar
        document.getElementById('sw-update-btn').addEventListener('click', () => {
            this.activateUpdate();
        });

        // Botón cerrar
        document.getElementById('sw-dismiss-btn').addEventListener('click', () => {
            notification.remove();
        });
    }

    /**
     * Activar actualización del Service Worker
     */
    activateUpdate() {
        if (!this.registration || !this.registration.waiting) {
            return;
        }

        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Recargar cuando el nuevo SW tome control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    }

    /**
     * Verificar actualizaciones manualmente
     */
    async checkForUpdates() {
        if (!this.registration) {
            return;
        }

        try {
            await this.registration.update();
            console.log('[SW Manager] Verificación de actualización completada');
        } catch (error) {
            console.error('[SW Manager] Error al verificar actualización:', error);
        }
    }

    /**
     * Limpiar cache manualmente
     */
    async clearCache() {
        if (!this.registration) {
            return false;
        }

        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data.success);
            };

            this.registration.active.postMessage(
                { type: 'CLEAR_CACHE' },
                [messageChannel.port2]
            );
        });
    }

    /**
     * Obtener tamaño del cache
     */
    async getCacheSize() {
        if (!this.registration) {
            return 0;
        }

        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data.size);
            };

            this.registration.active.postMessage(
                { type: 'GET_CACHE_SIZE' },
                [messageChannel.port2]
            );
        });
    }

    /**
     * Desregistrar Service Worker
     */
    async unregister() {
        if (!this.registration) {
            return false;
        }

        try {
            const result = await this.registration.unregister();
            console.log('[SW Manager] Service Worker desregistrado');
            return result;
        } catch (error) {
            console.error('[SW Manager] Error al desregistrar:', error);
            return false;
        }
    }
}

// Instancia global
const swManager = new ServiceWorkerManager();

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        swManager.init();
    });
} else {
    swManager.init();
}

// Exportar para uso externo
window.swManager = swManager;
