/**
 * BitForward Event System
 * Sistema avanzado de eventos para comunicación en tiempo real
 * Versión 1.0.0 - Enterprise Ready
 *
 * Este módulo implementa un sistema de eventos robusto para BitForward,
 * permitiendo comunicación en tiempo real entre componentes y servicios.
 */

class EventSystem {
  constructor() {
    this.eventHandlers = new Map();
    this.eventQueue = [];
    this.processingQueue = false;
    this.subscribers = new Map();
    this.eventHistory = new Map();
    this.maxHistoryPerEvent = 100;
    this.debugMode = false;

    // Definir eventos principales del sistema
    this.EVENTS = {
      // Eventos de usuario
      USER_LOGIN: 'user:login',
      USER_LOGOUT: 'user:logout',
      USER_PROFILE_UPDATED: 'user:profile:updated',
      USER_PREFERENCES_CHANGED: 'user:preferences:changed',

      // Eventos de contratos
      CONTRACT_CREATED: 'contract:created',
      CONTRACT_UPDATED: 'contract:updated',
      CONTRACT_EXECUTED: 'contract:executed',
      CONTRACT_CANCELLED: 'contract:cancelled',
      CONTRACT_EXPIRED: 'contract:expired',

      // Eventos de blockchain
      BLOCKCHAIN_CONNECTED: 'blockchain:connected',
      BLOCKCHAIN_DISCONNECTED: 'blockchain:disconnected',
      BLOCKCHAIN_TX_SUBMITTED: 'blockchain:tx:submitted',
      BLOCKCHAIN_TX_CONFIRMED: 'blockchain:tx:confirmed',
      BLOCKCHAIN_TX_FAILED: 'blockchain:tx:failed',

      // Eventos de wallet
      WALLET_CONNECTED: 'wallet:connected',
      WALLET_DISCONNECTED: 'wallet:disconnected',
      WALLET_CHANGED: 'wallet:changed',
      WALLET_BALANCE_CHANGED: 'wallet:balance:changed',

      // Eventos de sistema
      SYSTEM_INITIALIZED: 'system:initialized',
      SYSTEM_ERROR: 'system:error',
      SYSTEM_WARNING: 'system:warning',
      SYSTEM_NOTIFICATION: 'system:notification',

      // Eventos de portfolio
      PORTFOLIO_UPDATED: 'portfolio:updated',
      PORTFOLIO_RISK_ALERT: 'portfolio:risk:alert',

      // Eventos de mercado
      MARKET_PRICE_UPDATED: 'market:price:updated',
      MARKET_VOLATILITY_ALERT: 'market:volatility:alert'
    };

    this.initialize();
  }

  initialize() {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Recuperar configuración previa si existe
      try {
        const savedConfig = JSON.parse(localStorage.getItem('bitforward_event_system') || '{}');
        if (savedConfig.debugMode !== undefined) {
          this.debugMode = savedConfig.debugMode;
        }
      } catch (error) {
        console.warn('Error al cargar la configuración del sistema de eventos:', error);
      }
    }

    // Inicializar procesamiento de la cola de eventos
    this.startQueueProcessor();
    this.log('Sistema de eventos inicializado');
  }

  /**
     * Registrar un manejador para un evento específico
     * @param {string} eventName - Nombre del evento
     * @param {Function} handler - Función manejadora
     * @param {Object} options - Opciones adicionales
     * @returns {string} ID del manejador para futuras referencias
     */
  on(eventName, handler, options = {}) {
    if (typeof handler !== 'function') {
      throw new Error('El manejador debe ser una función');
    }

    const handlerId = this.generateId();

    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Map());
    }

    this.eventHandlers.get(eventName).set(handlerId, {
      handler,
      options: {
        once: options.once || false,
        priority: options.priority || 0,
        async: options.async || false,
        filter: options.filter || null
      }
    });

    this.log(`Manejador registrado para ${eventName}`, handlerId);
    return handlerId;
  }

  /**
     * Registrar un manejador que se ejecuta solo una vez
     * @param {string} eventName - Nombre del evento
     * @param {Function} handler - Función manejadora
     * @param {Object} options - Opciones adicionales
     * @returns {string} ID del manejador
     */
  once(eventName, handler, options = {}) {
    return this.on(eventName, handler, { ...options, once: true });
  }

  /**
     * Eliminar un manejador específico de evento
     * @param {string} eventName - Nombre del evento
     * @param {string|Function} handlerOrId - ID del manejador o función
     * @returns {boolean} Si el manejador fue eliminado correctamente
     */
  off(eventName, handlerOrId) {
    if (!this.eventHandlers.has(eventName)) {
      return false;
    }

    const handlers = this.eventHandlers.get(eventName);

    if (typeof handlerOrId === 'string') {
      // Eliminar por ID
      return handlers.delete(handlerOrId);
    } else if (typeof handlerOrId === 'function') {
      // Eliminar por referencia de función
      for (const [id, entry] of handlers.entries()) {
        if (entry.handler === handlerOrId) {
          handlers.delete(id);
          return true;
        }
      }
    }

    return false;
  }

  /**
     * Emitir un evento con datos opcionales
     * @param {string} eventName - Nombre del evento a emitir
     * @param {any} data - Datos asociados al evento
     * @returns {Promise<Array>} Resultados de los manejadores
     */
  async emit(eventName, data = null) {
    this.log(`Emitiendo evento: ${eventName}`, data);

    // Guardar en historial
    this.addToHistory(eventName, data);

    // Si no hay manejadores, terminar
    if (!this.eventHandlers.has(eventName)) {
      return [];
    }

    const event = {
      name: eventName,
      data,
      timestamp: Date.now(),
      id: this.generateId(),
      source: this.getEventSource()
    };

    // Encolar el evento
    this.eventQueue.push(event);

    // Iniciar procesamiento si no está activo
    if (!this.processingQueue) {
      this.processEventQueue();
    }

    // Retornar una promesa que se resuelve cuando el evento es procesado
    return new Promise(resolve => {
      const checkHandler = this.on('__event_processed__', (processedEvent) => {
        if (processedEvent.id === event.id) {
          this.off('__event_processed__', checkHandler);
          resolve(processedEvent.results);
        }
      });
    });
  }

  /**
     * Procesar la cola de eventos
     * @private
     */
  async processEventQueue() {
    if (this.eventQueue.length === 0) {
      this.processingQueue = false;
      return;
    }

    this.processingQueue = true;
    const event = this.eventQueue.shift();

    try {
      const handlers = this.eventHandlers.get(event.name);
      if (!handlers || handlers.size === 0) {
        this.emit('__event_processed__', {
          ...event,
          results: []
        });
        return this.processEventQueue();
      }

      // Ordenar manejadores por prioridad
      const sortedHandlers = [...handlers.entries()]
        .sort((a, b) => b[1].options.priority - a[1].options.priority);

      const results = [];

      // Procesar manejadores
      for (const [id, { handler, options }] of sortedHandlers) {
        // Aplicar filtro si existe
        if (options.filter && !options.filter(event.data)) {
          continue;
        }

        try {
          let result;
          if (options.async) {
            result = await handler(event.data, event);
          } else {
            result = handler(event.data, event);
          }

          results.push(result);

          // Eliminar manejador si es 'once'
          if (options.once) {
            handlers.delete(id);
          }
        } catch (error) {
          console.error(`Error en manejador de evento ${event.name}:`, error);
          this.emit(this.EVENTS.SYSTEM_ERROR, {
            message: `Error en manejador de evento ${event.name}`,
            error,
            event
          });
        }
      }

      // Emitir evento de procesamiento completado
      this.emit('__event_processed__', {
        ...event,
        results
      });
    } catch (error) {
      console.error('Error procesando evento:', error);
      this.emit(this.EVENTS.SYSTEM_ERROR, {
        message: 'Error procesando evento',
        error,
        event
      });
    }

    // Procesar siguiente evento
    this.processEventQueue();
  }

  /**
     * Iniciar el procesador de cola
     * @private
     */
  startQueueProcessor() {
    if (!this.processingQueue && this.eventQueue.length > 0) {
      this.processEventQueue();
    }
  }

  /**
     * Suscribir a múltiples eventos a la vez
     * @param {Object} subscriptions - Mapa de eventos y manejadores
     * @returns {string} ID de suscripción
     */
  subscribe(subscriptions, options = {}) {
    const subscriptionId = this.generateId();
    const handlers = new Map();

    for (const [eventName, handler] of Object.entries(subscriptions)) {
      const handlerId = this.on(eventName, handler, options);
      handlers.set(eventName, handlerId);
    }

    this.subscribers.set(subscriptionId, handlers);
    return subscriptionId;
  }

  /**
     * Cancelar una suscripción
     * @param {string} subscriptionId - ID de suscripción
     * @returns {boolean} Si la cancelación fue exitosa
     */
  unsubscribe(subscriptionId) {
    if (!this.subscribers.has(subscriptionId)) {
      return false;
    }

    const handlers = this.subscribers.get(subscriptionId);

    for (const [eventName, handlerId] of handlers.entries()) {
      this.off(eventName, handlerId);
    }

    return this.subscribers.delete(subscriptionId);
  }

  /**
     * Añadir un evento al historial
     * @param {string} eventName - Nombre del evento
     * @param {any} data - Datos del evento
     * @private
     */
  addToHistory(eventName, data) {
    if (!this.eventHistory.has(eventName)) {
      this.eventHistory.set(eventName, []);
    }

    const history = this.eventHistory.get(eventName);

    // Añadir al inicio del historial
    history.unshift({
      data,
      timestamp: Date.now()
    });

    // Limitar tamaño del historial
    if (history.length > this.maxHistoryPerEvent) {
      history.pop();
    }
  }

  /**
     * Obtener el historial de un evento
     * @param {string} eventName - Nombre del evento
     * @param {number} limit - Límite de eventos a devolver
     * @returns {Array} Historial de eventos
     */
  getEventHistory(eventName, limit = this.maxHistoryPerEvent) {
    if (!this.eventHistory.has(eventName)) {
      return [];
    }

    return this.eventHistory.get(eventName).slice(0, limit);
  }

  /**
     * Limpiar todos los manejadores de un evento
     * @param {string} eventName - Nombre del evento
     * @returns {boolean} Si la operación fue exitosa
     */
  clearEvent(eventName) {
    if (!this.eventHandlers.has(eventName)) {
      return false;
    }

    return this.eventHandlers.delete(eventName);
  }

  /**
     * Restablecer todo el sistema de eventos
     */
  reset() {
    this.eventHandlers.clear();
    this.subscribers.clear();
    this.eventHistory.clear();
    this.eventQueue = [];
    this.processingQueue = false;
    this.log('Sistema de eventos restablecido');
  }

  /**
     * Activar/desactivar modo debug
     * @param {boolean} enabled - Si debe activarse el modo debug
     */
  setDebugMode(enabled) {
    this.debugMode = enabled;

    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('bitforward_event_system', JSON.stringify({
        debugMode: enabled
      }));
    }

    this.log(`Modo debug ${enabled ? 'activado' : 'desactivado'}`);
  }

  /**
     * Registrar mensaje de log si el debug está habilitado
     * @param {string} message - Mensaje a registrar
     * @param {any} data - Datos adicionales
     * @private
     */
  log(message, data = null) {
    if (this.debugMode) {
      if (data) {
        console.log(`[EventSystem] ${message}`, data);
      } else {
        console.log(`[EventSystem] ${message}`);
      }
    }
  }

  /**
     * Generar un ID único para manejadores y eventos
     * @returns {string} ID único
     * @private
     */
  generateId() {
    return 'evt_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  /**
     * Detectar la fuente del evento (cliente, servidor, etc)
     * @returns {string} Fuente del evento
     * @private
     */
  getEventSource() {
    if (typeof window !== 'undefined') {
      return 'client';
    } else if (typeof process !== 'undefined') {
      return 'server';
    } else {
      return 'unknown';
    }
  }
}

// Crear instancia singleton
const eventSystem = new EventSystem();

// Exportar para diferentes entornos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EventSystem,
    eventSystem,
    EVENTS: eventSystem.EVENTS
  };
} else if (typeof window !== 'undefined') {
  window.BitForwardEventSystem = EventSystem;
  window.eventSystem = eventSystem;
  window.EVENTS = eventSystem.EVENTS;
}

// Emitir evento de inicialización
eventSystem.emit(eventSystem.EVENTS.SYSTEM_INITIALIZED, {
  version: '1.0.0',
  timestamp: Date.now()
});

console.log('🚀 BitForward Event System 1.0.0 inicializado');
