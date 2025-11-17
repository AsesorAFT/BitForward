/**
 * BitForward Notification System
 * Sistema profesional de notificaciones con múltiples tipos y animaciones
 */

class NotificationSystem {
  constructor() {
    this.container = null;
    this.notifications = new Map();
    this.config = {
      duration: 5000,
      maxNotifications: 5,
      position: 'top-right',
      animationDuration: 300
    };
    this.initialize();
  }

  initialize() {
    this.createContainer();
    this.setupStyles();
    console.log('📢 Notification System initialized');
  }

  createContainer() {
    // Crear contenedor si no existe
    this.container = document.getElementById('notification-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notification-container';
      this.container.className = 'notification-container';
      document.body.appendChild(this.container);
    }
  }

  setupStyles() {
    // Verificar si los estilos ya están aplicados
    if (document.getElementById('notification-styles')) {return;}

    const styles = document.createElement('style');
    styles.id = 'notification-styles';
    styles.textContent = `
            .notification-container {
                position: fixed;
                top: 1rem;
                right: 1rem;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                max-width: 400px;
                pointer-events: none;
            }

            .notification {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                overflow: hidden;
                min-width: 300px;
                max-width: 400px;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: all;
                position: relative;
            }

            .notification.show {
                opacity: 1;
                transform: translateX(0);
            }

            .notification.hide {
                opacity: 0;
                transform: translateX(100%);
                margin-top: -4rem;
            }

            .notification-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem 1rem 0.5rem 1rem;
            }

            .notification-title {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-weight: 600;
                font-size: 0.9rem;
            }

            .notification-close {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                color: #7f8c8d;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
            }

            .notification-close:hover {
                background: #f8f9fa;
                color: #2c3e50;
            }

            .notification-body {
                padding: 0 1rem 1rem 1rem;
            }

            .notification-message {
                font-size: 0.85rem;
                line-height: 1.4;
                color: #2c3e50;
                margin-bottom: 0.5rem;
            }

            .notification-details {
                font-size: 0.8rem;
                color: #7f8c8d;
                margin-top: 0.5rem;
            }

            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(255, 255, 255, 0.3);
                transition: width linear;
            }

            /* Tipos de notificación */
            .notification.success {
                border-left: 4px solid #27ae60;
            }

            .notification.success .notification-progress {
                background: #27ae60;
            }

            .notification.error {
                border-left: 4px solid #e74c3c;
            }

            .notification.error .notification-progress {
                background: #e74c3c;
            }

            .notification.warning {
                border-left: 4px solid #f39c12;
            }

            .notification.warning .notification-progress {
                background: #f39c12;
            }

            .notification.info {
                border-left: 4px solid #3498db;
            }

            .notification.info .notification-progress {
                background: #3498db;
            }

            .notification.validation {
                border-left: 4px solid #9b59b6;
            }

            .notification.validation .notification-progress {
                background: #9b59b6;
            }

            /* Lista de errores */
            .notification-errors {
                list-style: none;
                padding: 0;
                margin: 0.5rem 0 0 0;
            }

            .notification-errors li {
                padding: 0.25rem 0;
                font-size: 0.8rem;
                color: #e74c3c;
                display: flex;
                align-items: flex-start;
                gap: 0.5rem;
            }

            .notification-errors li::before {
                content: '•';
                color: #e74c3c;
                font-weight: bold;
                margin-top: 0.1rem;
            }

            /* Lista de warnings */
            .notification-warnings {
                list-style: none;
                padding: 0;
                margin: 0.5rem 0 0 0;
            }

            .notification-warnings li {
                padding: 0.25rem 0;
                font-size: 0.8rem;
                color: #f39c12;
                display: flex;
                align-items: flex-start;
                gap: 0.5rem;
            }

            .notification-warnings li::before {
                content: '⚠';
                margin-top: 0.1rem;
            }

            /* Responsive */
            @media (max-width: 768px) {
                .notification-container {
                    top: 1rem;
                    right: 1rem;
                    left: 1rem;
                    max-width: none;
                }

                .notification {
                    min-width: auto;
                    max-width: none;
                }
            }

            /* Animaciones adicionales */
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }

            .notification.shake {
                animation: shake 0.5s ease-in-out;
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.02); }
                100% { transform: scale(1); }
            }

            .notification.pulse {
                animation: pulse 0.3s ease-in-out;
            }
        `;
    document.head.appendChild(styles);
  }

  /**
     * Muestra una notificación
     * @param {string} message - Mensaje principal
     * @param {string} type - Tipo de notificación (success, error, warning, info, validation)
     * @param {Object} options - Opciones adicionales
     */
  show(message, type = 'info', options = {}) {
    const config = { ...this.config, ...options };
    const id = this.generateId();

    const notification = this.createNotification(id, message, type, config);
    this.addToContainer(notification);

    // Mostrar con animación
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Auto-remover si se especifica duración
    if (config.duration > 0) {
      this.startProgress(notification, config.duration);
      setTimeout(() => {
        this.remove(id);
      }, config.duration);
    }

    // Limitar número de notificaciones
    this.limitNotifications();

    return id;
  }

  /**
     * Muestra notificación de éxito
     */
  success(message, options = {}) {
    return this.show(message, 'success', {
      title: '✅ Éxito',
      ...options
    });
  }

  /**
     * Muestra notificación de error
     */
  error(message, options = {}) {
    return this.show(message, 'error', {
      title: '❌ Error',
      duration: 8000, // Errores duran más tiempo
      ...options
    });
  }

  /**
     * Muestra notificación de warning
     */
  warning(message, options = {}) {
    return this.show(message, 'warning', {
      title: '⚠️ Advertencia',
      duration: 6000,
      ...options
    });
  }

  /**
     * Muestra notificación informativa
     */
  info(message, options = {}) {
    return this.show(message, 'info', {
      title: 'ℹ️ Información',
      ...options
    });
  }

  /**
     * Muestra errores de validación
     */
  validationErrors(errors, warnings = [], options = {}) {
    const message = errors.length === 1 ?
      'Se encontró un error en el formulario:' :
      `Se encontraron ${errors.length} errores en el formulario:`;

    const notification = this.createValidationNotification(message, errors, warnings, options);
    const id = this.generateId();
    notification.dataset.id = id;

    this.addToContainer(notification);

    setTimeout(() => {
      notification.classList.add('show');
      notification.classList.add('shake'); // Efecto de shake para errores
    }, 10);

    // Auto-remover después de tiempo extendido para errores de validación
    setTimeout(() => {
      this.remove(id);
    }, 10000);

    return id;
  }

  createNotification(id, message, type, config) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.dataset.id = id;

    const title = config.title || this.getDefaultTitle(type);
    const details = config.details || '';

    notification.innerHTML = `
            <div class="notification-header">
                <div class="notification-title">${title}</div>
                <button class="notification-close" onclick="notificationSystem.remove('${id}')">&times;</button>
            </div>
            <div class="notification-body">
                <div class="notification-message">${message}</div>
                ${details ? `<div class="notification-details">${details}</div>` : ''}
            </div>
            <div class="notification-progress"></div>
        `;

    return notification;
  }

  createValidationNotification(message, errors, warnings, options) {
    const notification = document.createElement('div');
    notification.className = 'notification validation';

    let errorsHtml = '';
    if (errors.length > 0) {
      errorsHtml = `
                <ul class="notification-errors">
                    ${errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            `;
    }

    let warningsHtml = '';
    if (warnings.length > 0) {
      warningsHtml = `
                <ul class="notification-warnings">
                    ${warnings.map(warning => `<li>${warning}</li>`).join('')}
                </ul>
            `;
    }

    notification.innerHTML = `
            <div class="notification-header">
                <div class="notification-title">🔍 Errores de Validación</div>
                <button class="notification-close" onclick="notificationSystem.remove(this.closest('.notification').dataset.id)">&times;</button>
            </div>
            <div class="notification-body">
                <div class="notification-message">${message}</div>
                ${errorsHtml}
                ${warningsHtml}
            </div>
            <div class="notification-progress"></div>
        `;

    return notification;
  }

  addToContainer(notification) {
    this.container.appendChild(notification);
    this.notifications.set(notification.dataset.id, notification);
  }

  startProgress(notification, duration) {
    const progressBar = notification.querySelector('.notification-progress');
    if (progressBar) {
      progressBar.style.width = '100%';
      progressBar.style.transition = `width ${duration}ms linear`;
      setTimeout(() => {
        progressBar.style.width = '0%';
      }, 10);
    }
  }

  remove(id) {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.classList.add('hide');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        this.notifications.delete(id);
      }, this.config.animationDuration);
    }
  }

  removeAll() {
    this.notifications.forEach((notification, id) => {
      this.remove(id);
    });
  }

  limitNotifications() {
    const notificationElements = Array.from(this.container.children);
    while (notificationElements.length > this.config.maxNotifications) {
      const oldest = notificationElements.shift();
      if (oldest.dataset.id) {
        this.remove(oldest.dataset.id);
      }
    }
  }

  generateId() {
    return `notification_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  getDefaultTitle(type) {
    const titles = {
      success: '✅ Éxito',
      error: '❌ Error',
      warning: '⚠️ Advertencia',
      info: 'ℹ️ Información',
      validation: '🔍 Validación'
    };
    return titles[type] || 'ℹ️ Notificación';
  }

  // Métodos de utilidad para contratos
  contractCreated(contractId, blockchain, amount) {
    this.success(
      `Contrato creado exitosamente en ${blockchain.toUpperCase()}`,
      {
        details: `ID: ${contractId.substring(0, 12)}... | Cantidad: ${amount}`,
        duration: 4000
      }
    );
  }

  contractExecuted(contractId, pnl) {
    const isProfitable = pnl >= 0;
    const method = isProfitable ? 'success' : 'warning';

    this[method](
      `Contrato ejecutado ${isProfitable ? 'con ganancias' : 'con pérdidas'}`,
      {
        details: `ID: ${contractId.substring(0, 12)}... | P&L: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(4)}`,
        duration: 6000
      }
    );
  }

  walletConnected(blockchain, address) {
    this.success(
      `Wallet ${blockchain.toUpperCase()} conectada`,
      {
        details: `${address.substring(0, 8)}...${address.substring(-6)}`,
        duration: 3000
      }
    );
  }

  networkError(message) {
    this.error(
      'Error de conexión con la blockchain',
      {
        details: message,
        duration: 8000
      }
    );
  }
}

// Crear instancia global
const notificationSystem = new NotificationSystem();

// Exportar para uso en diferentes entornos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotificationSystem, notificationSystem };
}

if (typeof window !== 'undefined') {
  window.NotificationSystem = NotificationSystem;
  window.notificationSystem = notificationSystem;
}

console.log('📢 BitForward Notification System loaded');
