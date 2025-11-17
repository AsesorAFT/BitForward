/**
 * BitForward State Management v2.0
 * Store centralizado para gestión de estado de la aplicación
 */

class BitForwardStore {
  constructor() {
    this.state = {
      user: null,
      contracts: [],
      portfolio: {},
      prices: {},
      notifications: [],
      loading: {
        auth: false,
        contracts: false,
        portfolio: false
      },
      errors: {},
      ui: {
        activeModal: null,
        sidebarOpen: false,
        theme: 'light'
      }
    };

    this.listeners = new Map();
    this.middleware = [];
    this.persistConfig = {
      key: 'bitforward_state',
      whitelist: ['user', 'ui.theme']
    };

    this.loadPersistedState();
  }

  // === Core State Management ===

  /**
     * Actualiza el estado y notifica a los listeners
     */
  setState(updates, source = 'unknown') {
    const previousState = { ...this.state };

    // Aplicar middleware antes de la actualización
    const processedUpdates = this.applyMiddleware(updates, previousState);

    // Merge profundo del estado
    this.state = this.deepMerge(this.state, processedUpdates);

    // Persistir estado si es necesario
    this.persistState();

    // Notificar a los listeners
    this.notifyListeners(previousState, this.state, source);

    // Log para debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Store] State updated by ${source}:`, {
        previous: previousState,
        updates: processedUpdates,
        current: this.state
      });
    }
  }

  /**
     * Obtiene el estado actual
     */
  getState() {
    return { ...this.state };
  }

  /**
     * Obtiene una parte específica del estado
     */
  getStateSlice(path) {
    return this.getNestedProperty(this.state, path);
  }

  // === Subscriptions ===

  /**
     * Suscribe un listener a cambios de estado
     */
  subscribe(listener, selector = null) {
    const id = Date.now() + Math.random();
    this.listeners.set(id, { listener, selector });

    // Devolver función de desuscripción
    return () => {
      this.listeners.delete(id);
    };
  }

  /**
     * Notifica a todos los listeners
     */
  notifyListeners(previousState, currentState, source) {
    this.listeners.forEach(({ listener, selector }) => {
      if (selector) {
        const prevSelected = selector(previousState);
        const currSelected = selector(currentState);

        if (prevSelected !== currSelected) {
          listener(currSelected, prevSelected, source);
        }
      } else {
        listener(currentState, previousState, source);
      }
    });
  }

  // === Actions para User ===

  setUser(user) {
    this.setState({ user }, 'setUser');
  }

  clearUser() {
    this.setState({
      user: null,
      contracts: [],
      portfolio: {}
    }, 'clearUser');
  }

  updateUserProfile(updates) {
    if (this.state.user) {
      this.setState({
        user: { ...this.state.user, ...updates }
      }, 'updateUserProfile');
    }
  }

  // === Actions para Contracts ===

  setContracts(contracts) {
    this.setState({ contracts }, 'setContracts');
  }

  addContract(contract) {
    const contracts = [...this.state.contracts, contract];
    this.setState({ contracts }, 'addContract');
  }

  updateContract(contractId, updates) {
    const contracts = this.state.contracts.map(contract =>
      contract.id === contractId
        ? { ...contract, ...updates }
        : contract
    );
    this.setState({ contracts }, 'updateContract');
  }

  removeContract(contractId) {
    const contracts = this.state.contracts.filter(
      contract => contract.id !== contractId
    );
    this.setState({ contracts }, 'removeContract');
  }

  // === Actions para Portfolio ===

  setPortfolio(portfolio) {
    this.setState({ portfolio }, 'setPortfolio');
  }

  updatePortfolioMetric(metric, value) {
    this.setState({
      portfolio: {
        ...this.state.portfolio,
        [metric]: value
      }
    }, 'updatePortfolioMetric');
  }

  // === Actions para Prices ===

  setPrices(prices) {
    this.setState({ prices }, 'setPrices');
  }

  updatePrice(asset, price) {
    this.setState({
      prices: {
        ...this.state.prices,
        [asset]: {
          ...this.state.prices[asset],
          price,
          lastUpdated: Date.now()
        }
      }
    }, 'updatePrice');
  }

  // === Actions para Loading States ===

  setLoading(key, loading) {
    this.setState({
      loading: {
        ...this.state.loading,
        [key]: loading
      }
    }, 'setLoading');
  }

  // === Actions para Errors ===

  setError(key, error) {
    this.setState({
      errors: {
        ...this.state.errors,
        [key]: error
      }
    }, 'setError');
  }

  clearError(key) {
    const errors = { ...this.state.errors };
    delete errors[key];
    this.setState({ errors }, 'clearError');
  }

  clearAllErrors() {
    this.setState({ errors: {} }, 'clearAllErrors');
  }

  // === Actions para UI ===

  setActiveModal(modal) {
    this.setState({
      ui: {
        ...this.state.ui,
        activeModal: modal
      }
    }, 'setActiveModal');
  }

  toggleSidebar() {
    this.setState({
      ui: {
        ...this.state.ui,
        sidebarOpen: !this.state.ui.sidebarOpen
      }
    }, 'toggleSidebar');
  }

  setTheme(theme) {
    this.setState({
      ui: {
        ...this.state.ui,
        theme
      }
    }, 'setTheme');
  }

  // === Notifications ===

  addNotification(notification) {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      timestamp: Date.now(),
      ...notification
    };

    this.setState({
      notifications: [...this.state.notifications, newNotification]
    }, 'addNotification');

    // Auto-remove después de cierto tiempo
    if (notification.autoRemove !== false) {
      setTimeout(() => {
        this.removeNotification(id);
      }, notification.duration || 5000);
    }

    return id;
  }

  removeNotification(id) {
    const notifications = this.state.notifications.filter(
      notif => notif.id !== id
    );
    this.setState({ notifications }, 'removeNotification');
  }

  clearAllNotifications() {
    this.setState({ notifications: [] }, 'clearAllNotifications');
  }

  // === Middleware Support ===

  use(middleware) {
    this.middleware.push(middleware);
  }

  applyMiddleware(updates, previousState) {
    return this.middleware.reduce((acc, middleware) => {
      return middleware(acc, previousState, this);
    }, updates);
  }

  // === Persistence ===

  persistState() {
    try {
      const stateToPersist = this.selectPersistedState();
      localStorage.setItem(
        this.persistConfig.key,
        JSON.stringify(stateToPersist)
      );
    } catch (error) {
      console.warn('Failed to persist state:', error);
    }
  }

  loadPersistedState() {
    try {
      const persistedState = localStorage.getItem(this.persistConfig.key);
      if (persistedState) {
        const parsed = JSON.parse(persistedState);
        this.state = this.deepMerge(this.state, parsed);
      }
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
    }
  }

  selectPersistedState() {
    const result = {};

    this.persistConfig.whitelist.forEach(path => {
      const value = this.getNestedProperty(this.state, path);
      if (value !== undefined) {
        this.setNestedProperty(result, path, value);
      }
    });

    return result;
  }

  // === Utility Methods ===

  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      current[key] = current[key] || {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  // === Computed Properties ===

  get computed() {
    return {
      // Portfolio computations
      totalPortfolioValue: () => {
        return this.state.contracts.reduce((total, contract) => {
          return total + (contract.value || 0);
        }, 0);
      },

      activeContractsCount: () => {
        return this.state.contracts.filter(
          contract => contract.status === 'active'
        ).length;
      },

      portfolioByBlockchain: () => {
        return this.state.contracts.reduce((acc, contract) => {
          const blockchain = contract.blockchain;
          acc[blockchain] = acc[blockchain] || { count: 0, value: 0 };
          acc[blockchain].count++;
          acc[blockchain].value += contract.value || 0;
          return acc;
        }, {});
      },

      // Risk metrics
      riskLevel: () => {
        const totalValue = this.computed.totalPortfolioValue();
        if (totalValue > 100000) {return 'high';}
        if (totalValue > 10000) {return 'medium';}
        return 'low';
      }
    };
  }

  // === Selectors (para uso con subscribe) ===

  static selectors = {
    getUser: (state) => state.user,
    getContracts: (state) => state.contracts,
    getPortfolio: (state) => state.portfolio,
    getActiveContracts: (state) => state.contracts.filter(c => c.status === 'active'),
    getLoadingState: (key) => (state) => state.loading[key],
    getError: (key) => (state) => state.errors[key],
    getNotifications: (state) => state.notifications,
    getTheme: (state) => state.ui.theme
  };
}

// Middleware para logging
const loggingMiddleware = (updates, previousState, store) => {
  if (process.env.NODE_ENV === 'development') {
    console.group('🔄 State Update');
    console.log('Previous:', previousState);
    console.log('Updates:', updates);
    console.log('New State:', store.deepMerge(previousState, updates));
    console.groupEnd();
  }
  return updates;
};

// Middleware para validación
const validationMiddleware = (updates, previousState, store) => {
  // Validar que el usuario tenga campos requeridos
  if (updates.user && updates.user.id && !updates.user.username) {
    console.warn('User update missing required field: username');
  }

  // Validar contratos
  if (updates.contracts) {
    updates.contracts.forEach(contract => {
      if (!contract.id || !contract.blockchain) {
        console.warn('Invalid contract detected:', contract);
      }
    });
  }

  return updates;
};

// Crear instancia global del store
const store = new BitForwardStore();

// Aplicar middleware
store.use(loggingMiddleware);
store.use(validationMiddleware);

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BitForwardStore, store };
} else {
  window.BitForwardStore = BitForwardStore;
  window.store = store;
}
