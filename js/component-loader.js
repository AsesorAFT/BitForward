/**
 * BitForward Component Loader
 * Sistema de carga y registro de componentes para BitForward
 * v1.0.0
 */

class ComponentLoader {
  constructor() {
    this.components = new Map();
    this.loadStatus = new Map();
    this.dependencies = new Map();
    this.eventSystem = null;
    this.initialized = false;

    // Estado de la carga
    this.loadingStarted = false;
    this.loadingComplete = false;
    this.onLoadCallbacks = [];

    // Manejar eventos de carga
    window.addEventListener('DOMContentLoaded', () => {
      this.detectComponents();
    });
  }

  /**
   * Detecta componentes ya cargados en la página
   */
  detectComponents() {
    console.log('🔍 Detectando componentes disponibles...');

    // Componentes principales
    const coreComponents = [
      { name: 'bitForward', global: window.bitForward, required: true },
      { name: 'bitforwardBlockchain', global: window.bitforwardBlockchain, required: false },
      { name: 'eventSystem', global: window.eventSystem, required: false },
      { name: 'portfolioManager', global: window.portfolioManager, required: false },
      { name: 'riskAnalyzer', global: window.riskAnalyzer, required: false },
      { name: 'crossChainBridge', global: window.crossChainBridge, required: false },
      { name: 'bitForwardCore', global: window.bitForwardCore, required: false },
    ];

    // Componentes de UI
    const uiComponents = [
      { name: 'logoManager', global: window.logoManager, required: false },
      { name: 'walletManager', global: window.walletManager, required: false },
    ];

    // Registrar componentes detectados
    [...coreComponents, ...uiComponents].forEach(component => {
      if (component.global) {
        this.registerComponent(component.name, component.global);
        this.loadStatus.set(component.name, true);
      } else if (component.required) {
        console.warn(`⚠️ Componente requerido '${component.name}' no está disponible`);
      }
    });

    // Detectar sistema de eventos para comunicación
    if (window.eventSystem) {
      this.eventSystem = window.eventSystem;
      console.log('✅ Sistema de eventos detectado');
    }

    if (this.components.size > 0) {
      console.log(`✅ Detectados ${this.components.size} componentes`);
    }

    this.setupDependencies();
    this.initialized = true;

    // Emitir evento de inicialización
    if (this.eventSystem) {
      this.eventSystem.emit('COMPONENT_LOADER_READY', {
        componentsLoaded: [...this.components.keys()],
      });
    }
  }

  /**
   * Configurar dependencias entre componentes
   */
  setupDependencies() {
    // Definir dependencias (qué componente necesita a otro)
    this.addDependency('portfolioManager', 'eventSystem');
    this.addDependency('riskAnalyzer', 'eventSystem');
    this.addDependency('riskAnalyzer', 'portfolioManager');
    this.addDependency('crossChainBridge', 'bitforwardBlockchain');
    this.addDependency('crossChainBridge', 'eventSystem');
    this.addDependency('bitForwardCore', 'eventSystem');

    // Verificar dependencias
    this.checkDependencies();
  }

  /**
   * Añadir una dependencia entre componentes
   * @param {string} component - El componente que tiene la dependencia
   * @param {string} dependency - El componente del que depende
   */
  addDependency(component, dependency) {
    if (!this.dependencies.has(component)) {
      this.dependencies.set(component, new Set());
    }

    this.dependencies.get(component).add(dependency);
  }

  /**
   * Verificar si se cumplen las dependencias
   * @returns {Object} Estado de las dependencias
   */
  checkDependencies() {
    const status = {
      satisfied: true,
      missing: [],
    };

    // Comprobar cada componente
    for (const [component, dependencies] of this.dependencies.entries()) {
      // Si el componente no está cargado, no importan sus dependencias
      if (!this.loadStatus.get(component)) {
        continue;
      }

      // Verificar dependencias
      for (const dependency of dependencies) {
        if (!this.loadStatus.get(dependency)) {
          status.satisfied = false;
          status.missing.push({
            component,
            dependency,
          });

          console.warn(
            `⚠️ El componente '${component}' depende de '${dependency}' que no está disponible`
          );
        }
      }
    }

    return status;
  }

  /**
   * Registra un componente en el sistema
   * @param {string} name - Nombre del componente
   * @param {Object} instance - Instancia del componente
   */
  registerComponent(name, instance) {
    if (this.components.has(name)) {
      console.warn(`⚠️ Componente '${name}' ya está registrado`);
      return false;
    }

    this.components.set(name, instance);
    this.loadStatus.set(name, true);

    console.log(`✅ Componente '${name}' registrado correctamente`);

    // Notificar a través del sistema de eventos
    if (this.eventSystem) {
      this.eventSystem.emit('COMPONENT_REGISTERED', {
        name,
        instance,
      });
    }

    return true;
  }

  /**
   * Obtiene un componente por su nombre
   * @param {string} name - Nombre del componente
   * @returns {Object|null} Instancia del componente o null si no existe
   */
  getComponent(name) {
    return this.components.get(name) || null;
  }

  /**
   * Verifica si un componente está disponible
   * @param {string} name - Nombre del componente
   * @returns {boolean} True si el componente existe
   */
  hasComponent(name) {
    return this.components.has(name);
  }

  /**
   * Cargar un componente de forma dinámica
   * @param {string} name - Nombre del componente
   * @param {string} path - Ruta al archivo JavaScript
   * @returns {Promise<Object>} Promesa con el resultado de la carga
   */
  async loadComponent(name, path) {
    // Si ya está cargado, devolver promesa resuelta
    if (this.loadStatus.get(name)) {
      return Promise.resolve({
        name,
        instance: this.getComponent(name),
        status: 'already-loaded',
      });
    }

    console.log(`🔄 Cargando componente '${name}' desde ${path}`);

    try {
      // Crear script tag para cargar el componente
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = path;

        script.onload = () => {
          // Buscar componente en window después de la carga
          const instance = this.findComponentInGlobal(name);

          if (instance) {
            this.registerComponent(name, instance);
            resolve({
              name,
              instance,
              status: 'loaded',
            });
          } else {
            reject(new Error(`Componente '${name}' no encontrado después de cargar ${path}`));
          }
        };

        script.onerror = () => {
          reject(new Error(`Error al cargar el componente '${name}' desde ${path}`));
        };

        document.head.appendChild(script);
      });
    } catch (error) {
      console.error(`❌ Error cargando componente '${name}':`, error);
      throw error;
    }
  }

  /**
   * Busca un componente en el objeto global window
   * @param {string} name - Nombre del componente
   * @returns {Object|null} Instancia del componente
   */
  findComponentInGlobal(name) {
    // Convención de nomenclatura
    const variations = [
      name, // exacto
      window[name], // variable global directa
      window[`${name.charAt(0).toUpperCase()}${name.slice(1)}`], // PascalCase
      window[`${name}Instance`], // con sufijo Instance
    ];

    for (const variant of variations) {
      if (variant) {
        return variant;
      }
    }

    return null;
  }

  /**
   * Carga todos los componentes esenciales
   * @returns {Promise} Promesa que se resuelve cuando todos los componentes están cargados
   */
  async loadEssentialComponents() {
    if (this.loadingStarted) {
      return new Promise(resolve => {
        if (this.loadingComplete) {
          resolve();
        } else {
          this.onLoadCallbacks.push(resolve);
        }
      });
    }

    this.loadingStarted = true;

    try {
      console.log('🚀 Cargando componentes esenciales...');

      const componentPaths = {
        prototype: '/src/prototype.js',
        blockchain: '/src/blockchain.js',
        'event-system': '/src/event-system.js',
        'portfolio-management': '/src/portfolio-management.js',
        'risk-analytics': '/src/risk-analytics.js',
        'cross-chain-bridge': '/src/cross-chain-bridge.js',
        'core-integration': '/src/core-integration.js',
      };

      const loadPromises = [];

      // Cargar componentes que no estén ya registrados
      if (!this.hasComponent('bitForward')) {
        loadPromises.push(this.loadComponent('bitForward', componentPaths['prototype']));
      }

      if (!this.hasComponent('bitforwardBlockchain')) {
        loadPromises.push(this.loadComponent('bitforwardBlockchain', componentPaths['blockchain']));
      }

      if (!this.hasComponent('eventSystem')) {
        loadPromises.push(this.loadComponent('eventSystem', componentPaths['event-system']));
      }

      // Esperar a que se carguen los componentes base antes de continuar
      await Promise.all(loadPromises);

      // Segunda fase - componentes que dependen de los anteriores
      const secondPhasePromises = [];

      if (!this.hasComponent('portfolioManager')) {
        secondPhasePromises.push(
          this.loadComponent('portfolioManager', componentPaths['portfolio-management'])
        );
      }

      if (!this.hasComponent('riskAnalyzer')) {
        secondPhasePromises.push(
          this.loadComponent('riskAnalyzer', componentPaths['risk-analytics'])
        );
      }

      if (!this.hasComponent('crossChainBridge')) {
        secondPhasePromises.push(
          this.loadComponent('crossChainBridge', componentPaths['cross-chain-bridge'])
        );
      }

      await Promise.all(secondPhasePromises);

      // Cargar integración al final
      if (!this.hasComponent('bitForwardCore')) {
        await this.loadComponent('bitForwardCore', componentPaths['core-integration']);
      }

      console.log('✅ Todos los componentes esenciales cargados');

      this.loadingComplete = true;

      // Ejecutar callbacks pendientes
      this.onLoadCallbacks.forEach(callback => callback());
      this.onLoadCallbacks = [];
    } catch (error) {
      console.error('❌ Error cargando componentes esenciales:', error);
      throw error;
    }
  }

  /**
   * Inicializar todos los componentes en el orden correcto
   */
  async initializeComponents() {
    if (!this.loadingComplete) {
      await this.loadEssentialComponents();
    }

    console.log('🚀 Inicializando componentes...');

    // Ordenar componentes por dependencias
    const initOrder = this.getInitializationOrder();

    for (const componentName of initOrder) {
      const component = this.getComponent(componentName);

      if (component && typeof component.initialize === 'function') {
        try {
          console.log(`🔄 Inicializando '${componentName}'...`);
          await component.initialize();
          console.log(`✅ '${componentName}' inicializado correctamente`);
        } catch (error) {
          console.error(`❌ Error inicializando '${componentName}':`, error);
        }
      }
    }

    console.log('✅ Todos los componentes inicializados');

    // Notificar a través del sistema de eventos
    if (this.eventSystem) {
      this.eventSystem.emit('COMPONENTS_INITIALIZED', {
        components: [...this.components.keys()],
      });
    }
  }

  /**
   * Obtiene el orden correcto para inicializar componentes basado en dependencias
   * @returns {Array} Array con nombres de componentes en orden
   */
  getInitializationOrder() {
    // Implementación simplificada de ordenamiento topológico
    const visited = new Set();
    const temp = new Set();
    const order = [];

    // Función recursiva para ordenamiento topológico
    const visit = node => {
      // Si ya está en el resultado, saltar
      if (visited.has(node)) return;

      // Detectar ciclos
      if (temp.has(node)) {
        console.warn(`⚠️ Detectado ciclo de dependencia en '${node}'`);
        return;
      }

      // Marcar como visitado temporalmente
      temp.add(node);

      // Visitar dependencias primero
      const dependencies = this.dependencies.get(node) || new Set();
      for (const dep of dependencies) {
        visit(dep);
      }

      // Marcar como visitado permanentemente
      temp.delete(node);
      visited.add(node);
      order.push(node);
    };

    // Visitar todos los nodos
    for (const componentName of this.components.keys()) {
      visit(componentName);
    }

    return order;
  }

  /**
   * Obtener información del estado actual del sistema
   * @returns {Object} Estado del sistema de componentes
   */
  getStatus() {
    const componentStatus = {};

    for (const [name, loaded] of this.loadStatus.entries()) {
      componentStatus[name] = {
        loaded,
        hasDependencies: this.dependencies.has(name),
        dependencies: this.dependencies.has(name) ? [...this.dependencies.get(name)] : [],
      };
    }

    return {
      initialized: this.initialized,
      loadingComplete: this.loadingComplete,
      componentsCount: this.components.size,
      components: componentStatus,
    };
  }
}

// Crear instancia única
const componentLoader = new ComponentLoader();

// Exportar para diferentes entornos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ComponentLoader,
    componentLoader,
  };
} else if (typeof window !== 'undefined') {
  window.ComponentLoader = ComponentLoader;
  window.componentLoader = componentLoader;
}

console.log('✅ BitForward Component Loader inicializado');
