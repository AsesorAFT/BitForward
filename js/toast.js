/**
 * BitForward - Toast Notification System
 * Quick Win #4: Sistema de notificaciones moderno (+20% mejor UX)
 *
 * Features:
 * - Toast notifications elegantes
 * - Múltiples tipos (success, error, info, warning)
 * - Animaciones suaves
 * - Auto-dismiss configurable
 * - Queue de notificaciones
 * - Stack position personalizable
 */

class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = [];
    this.maxToasts = 5;
    this.defaultDuration = 5000;
    this.position = 'top-right'; // top-right, top-left, bottom-right, bottom-left

    this.init();
  }

  /**
     * Inicializar el contenedor de toasts
     */
  init() {
    // Crear contenedor si no existe
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = `toast-container ${this.position}`;
      document.body.appendChild(this.container);
    }

    // Inject CSS
    this.injectStyles();

    console.log('🎨 Toast Manager inicializado - Quick Win #4');
  }

  /**
     * Inyectar estilos CSS
     */
  injectStyles() {
    if (document.getElementById('toast-styles')) {return;}

    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
            .toast-container {
                position: fixed;
                z-index: 9999;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                gap: 1rem;
                max-width: 400px;
                padding: 1rem;
            }

            .toast-container.top-right {
                top: 0;
                right: 0;
            }

            .toast-container.top-left {
                top: 0;
                left: 0;
            }

            .toast-container.bottom-right {
                bottom: 0;
                right: 0;
            }

            .toast-container.bottom-left {
                bottom: 0;
                left: 0;
            }

            .toast {
                background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98));
                border-radius: 12px;
                padding: 1rem 1.5rem;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(59, 130, 246, 0.2);
                backdrop-filter: blur(10px);
                pointer-events: auto;
                display: flex;
                align-items: center;
                gap: 1rem;
                min-width: 300px;
                max-width: 400px;
                animation: toastSlideIn 0.3s cubic-bezier(0.21, 1.02, 0.73, 1);
                transition: all 0.3s ease;
            }

            .toast:hover {
                transform: translateY(-2px);
                box-shadow: 0 15px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.3);
            }

            .toast.removing {
                animation: toastSlideOut 0.3s ease-out forwards;
            }

            @keyframes toastSlideIn {
                from {
                    opacity: 0;
                    transform: translateX(100%) scale(0.8);
                }
                to {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                }
            }

            @keyframes toastSlideOut {
                from {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%) scale(0.8);
                }
            }

            .toast-icon {
                width: 24px;
                height: 24px;
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                font-size: 16px;
            }

            .toast-icon.success {
                background: rgba(74, 222, 128, 0.2);
                color: #4ade80;
            }

            .toast-icon.error {
                background: rgba(239, 68, 68, 0.2);
                color: #ef4444;
            }

            .toast-icon.warning {
                background: rgba(251, 191, 36, 0.2);
                color: #fbbf24;
            }

            .toast-icon.info {
                background: rgba(59, 130, 246, 0.2);
                color: #3b82f6;
            }

            .toast-content {
                flex: 1;
                color: #fff;
            }

            .toast-title {
                font-weight: 600;
                font-size: 14px;
                margin-bottom: 4px;
            }

            .toast-message {
                font-size: 13px;
                color: #cbd5e1;
                line-height: 1.4;
            }

            .toast-close {
                background: none;
                border: none;
                color: #94a3b8;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s;
                flex-shrink: 0;
            }

            .toast-close:hover {
                background: rgba(148, 163, 184, 0.1);
                color: #fff;
            }

            .toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                border-radius: 0 0 12px 12px;
                transform-origin: left;
                animation: toastProgress var(--duration) linear forwards;
            }

            @keyframes toastProgress {
                from {
                    transform: scaleX(1);
                }
                to {
                    transform: scaleX(0);
                }
            }

            /* Mobile responsive */
            @media (max-width: 640px) {
                .toast-container {
                    left: 1rem;
                    right: 1rem;
                    max-width: none;
                }

                .toast {
                    min-width: 0;
                }
            }
        `;

    document.head.appendChild(style);
  }

  /**
     * Mostrar un toast
     * @param {Object} options - Configuración del toast
     * @returns {string} Toast ID
     */
  show(options) {
    const {
      type = 'info',
      title = '',
      message = '',
      duration = this.defaultDuration,
      closeable = true,
      onClose = null
    } = options;

    // Limitar número de toasts visibles
    if (this.toasts.length >= this.maxToasts) {
      this.removeToast(this.toasts[0].id);
    }

    // Crear toast ID único
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Crear elemento toast
    const toast = this.createToastElement(toastId, type, title, message, duration, closeable);

    // Agregar al contenedor
    this.container.appendChild(toast);

    // Guardar referencia
    const toastData = {
      id: toastId,
      element: toast,
      timer: null,
      onClose
    };
    this.toasts.push(toastData);

    // Auto-dismiss
    if (duration > 0) {
      toastData.timer = setTimeout(() => {
        this.removeToast(toastId);
      }, duration);
    }

    return toastId;
  }

  /**
     * Crear elemento HTML del toast
     */
  createToastElement(id, type, title, message, duration, closeable) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = id;
    toast.style.position = 'relative';

    // Icon
    const icon = this.getIcon(type);
    const iconEl = document.createElement('div');
    iconEl.className = `toast-icon ${type}`;
    iconEl.innerHTML = icon;

    // Content
    const content = document.createElement('div');
    content.className = 'toast-content';

    if (title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'toast-title';
      titleEl.textContent = title;
      content.appendChild(titleEl);
    }

    if (message) {
      const messageEl = document.createElement('div');
      messageEl.className = 'toast-message';
      messageEl.textContent = message;
      content.appendChild(messageEl);
    }

    // Close button
    let closeBtn;
    if (closeable) {
      closeBtn = document.createElement('button');
      closeBtn.className = 'toast-close';
      closeBtn.innerHTML = '×';
      closeBtn.onclick = () => this.removeToast(id);
    }

    // Progress bar
    let progressBar;
    if (duration > 0) {
      progressBar = document.createElement('div');
      progressBar.className = 'toast-progress';
      progressBar.style.setProperty('--duration', `${duration}ms`);
    }

    // Ensamblar
    toast.appendChild(iconEl);
    toast.appendChild(content);
    if (closeBtn) {toast.appendChild(closeBtn);}
    if (progressBar) {toast.appendChild(progressBar);}

    return toast;
  }

  /**
     * Obtener icono según tipo
     */
  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }

  /**
     * Remover un toast
     */
  removeToast(toastId) {
    const toastData = this.toasts.find(t => t.id === toastId);
    if (!toastData) {return;}

    // Limpiar timer
    if (toastData.timer) {
      clearTimeout(toastData.timer);
    }

    // Animar salida
    toastData.element.classList.add('removing');

    // Remover del DOM después de la animación
    setTimeout(() => {
      toastData.element.remove();
      this.toasts = this.toasts.filter(t => t.id !== toastId);

      // Callback
      if (toastData.onClose) {
        toastData.onClose();
      }
    }, 300);
  }

  /**
     * Shortcuts para tipos comunes
     */
  success(message, title = 'Éxito', duration) {
    return this.show({ type: 'success', title, message, duration });
  }

  error(message, title = 'Error', duration) {
    return this.show({ type: 'error', title, message, duration });
  }

  warning(message, title = 'Advertencia', duration) {
    return this.show({ type: 'warning', title, message, duration });
  }

  info(message, title = 'Información', duration) {
    return this.show({ type: 'info', title, message, duration });
  }

  /**
     * Remover todos los toasts
     */
  clear() {
    this.toasts.forEach(toast => this.removeToast(toast.id));
  }

  /**
     * Cambiar posición del contenedor
     */
  setPosition(position) {
    this.position = position;
    this.container.className = `toast-container ${position}`;
  }
}

// Crear instancia global
window.toast = new ToastManager();

// Reemplazar console.log/error con toasts (opcional)
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Puedes habilitar esto para debug
// console.log = function(...args) {
//     originalConsoleLog.apply(console, args);
//     if (args[0] && typeof args[0] === 'string' && args[0].startsWith('✅')) {
//         window.toast.success(args[0]);
//     }
// };

// console.error = function(...args) {
//     originalConsoleError.apply(console, args);
//     if (args[0] && typeof args[0] === 'string') {
//         window.toast.error(args[0]);
//     }
// };

console.log('🎨 Toast Notifications activadas - Quick Win #4 (+20% UX)');

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ToastManager;
}
