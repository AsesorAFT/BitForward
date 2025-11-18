/**
 * BitForward Initialization
 * Archivo principal de inicialización y carga de componentes
 * Versión 2.0.0 - Utiliza ComponentLoader
 */

document.addEventListener('DOMContentLoaded', function () {
  console.log('🚀 Inicializando BitForward...');

  // Inicialización principal utilizando el cargador de componentes
  const init = async () => {
    try {
      // Verificar si el cargador de componentes está disponible
      if (!window.componentLoader) {
        console.error(
          '❌ Component Loader no está disponible. Asegúrate de incluir component-loader.js antes de init.js'
        );

        // Intenta cargar el Component Loader dinámicamente
        await loadScript('/js/component-loader.js');

        if (!window.componentLoader) {
          throw new Error('No se pudo cargar el Component Loader');
        }
      }

      // Mostrar pantalla de carga
      showLoadingScreen();

      // Cargar e inicializar componentes
      await window.componentLoader.loadEssentialComponents();
      await window.componentLoader.initializeComponents();

      console.log('🚀 Componentes cargados e inicializados');

      // Inicializar interfaz de usuario
      initUI();

      console.log('🚀 BitForward inicializado exitosamente!');

      // Emitir evento de inicialización completa si existe el sistema de eventos
      if (window.eventSystem) {
        window.eventSystem.emit(window.eventSystem.EVENTS.SYSTEM_READY, {
          timestamp: Date.now(),
          version: window.bitForwardCore ? window.bitForwardCore.getVersion() : '2.0.0',
        });
      }
    } catch (error) {
      console.error('❌ Error durante la inicialización:', error);
      showErrorMessage('Error al inicializar BitForward. Por favor, recarga la página.');
    } finally {
      // Ocultar pantalla de carga incluso si hay error
      hideLoadingScreen();
    }
  };

  // Función auxiliar para cargar scripts
  const loadScript = src => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Error cargando script: ${src}`));
      document.head.appendChild(script);
    });
  };

  // Mostrar pantalla de carga
  const showLoadingScreen = () => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.display = 'flex';
    } else {
      // Crear pantalla de carga si no existe
      const newLoadingScreen = document.createElement('div');
      newLoadingScreen.id = 'loading-screen';
      newLoadingScreen.className = 'loading-spinner';
      newLoadingScreen.style.display = 'flex';
      newLoadingScreen.style.position = 'fixed';
      newLoadingScreen.style.top = '0';
      newLoadingScreen.style.left = '0';
      newLoadingScreen.style.width = '100%';
      newLoadingScreen.style.height = '100%';
      newLoadingScreen.style.backgroundColor = 'rgba(15, 23, 42, 0.9)';
      newLoadingScreen.style.zIndex = '9999';
      newLoadingScreen.style.alignItems = 'center';
      newLoadingScreen.style.justifyContent = 'center';
      newLoadingScreen.innerHTML = `
                <div style="text-align: center;">
                    <svg style="width: 4rem; height: 4rem; color: #3b82f6; animation: spin 1.5s linear infinite;" fill="none" viewBox="0 0 24 24">
                        <circle style="opacity: 0.25;" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path style="opacity: 0.75;" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p style="color: white; margin-top: 1rem;">Cargando BitForward...</p>
                </div>
            `;

      document.body.appendChild(newLoadingScreen);
    }
  };

  // Ocultar pantalla de carga
  const hideLoadingScreen = () => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      // Animación de desvanecimiento
      loadingScreen.style.transition = 'opacity 0.5s ease-out';
      loadingScreen.style.opacity = '0';

      // Eliminar después de la animación
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
  };

  // Inicializar interfaz de usuario
  const initUI = () => {
    // Mostrar/ocultar elementos según componentes disponibles
    const componentLoader = window.componentLoader;

    if (componentLoader.hasComponent('portfolioManager')) {
      document.querySelectorAll('.portfolio-feature').forEach(el => el.classList.remove('hidden'));
    }

    if (componentLoader.hasComponent('riskAnalyzer')) {
      document.querySelectorAll('.risk-feature').forEach(el => el.classList.remove('hidden'));
    }

    if (componentLoader.hasComponent('crossChainBridge')) {
      document.querySelectorAll('.bridge-feature').forEach(el => el.classList.remove('hidden'));
    }

    // Actualizar badges de la versión
    const coreVersion = componentLoader.hasComponent('bitForwardCore')
      ? componentLoader.getComponent('bitForwardCore').getVersion()
      : { core: 'N/A' };

    document.querySelectorAll('.bitforward-version').forEach(el => {
      el.textContent = coreVersion.core || '2.0.0';
    });

    // Si estamos en la página del dashboard, inicializar
    const dashboardContainer = document.getElementById('dashboard-container');
    if (dashboardContainer && componentLoader.hasComponent('bitForwardCore')) {
      loadDashboard();
    }

    // Si estamos en la página de wallet, inicializar
    const walletContainer = document.getElementById('wallet-container');
    if (walletContainer && componentLoader.hasComponent('bitforwardBlockchain')) {
      initWallet();
    }

    // Remover pantalla de carga adicional si existe
    const loader = document.getElementById('bitforward-loader');
    if (loader) {
      setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => {
          loader.style.display = 'none';
        }, 500);
      }, 800);
    }

    // Inicializar tooltips y otros elementos de UI
    initTooltips();
    initDropdowns();

    // Verificar si se necesita actualizar la pantalla
    updateUIBasedOnLocation();
  };

  // Cargar dashboard si estamos en esa página
  const loadDashboard = async () => {
    try {
      const userId = getCurrentUserId();

      if (!userId) {
        console.warn('⚠️ No hay usuario autenticado para cargar el dashboard');
        return;
      }

      const bitForwardCore = window.componentLoader.getComponent('bitForwardCore');

      if (bitForwardCore) {
        // Mostrar indicador de carga
        const dashboardContainer = document.getElementById('dashboard-container');
        if (dashboardContainer) {
          dashboardContainer.innerHTML = '<div class="loading-spinner">Cargando dashboard...</div>';
        }

        try {
          // Cargar datos del dashboard
          const dashboardData = await bitForwardCore.generateDashboard(userId);

          // Renderizar dashboard (utilizando función existente si está disponible)
          if (window.renderDashboard) {
            window.renderDashboard(dashboardData);
          } else {
            console.warn('⚠️ Función renderDashboard no disponible, usando renderizado básico');

            // Implementación básica de renderizado
            if (dashboardContainer) {
              dashboardContainer.innerHTML = `
                                <h2>BitForward Dashboard</h2>
                                <p>Usuario: ${dashboardData.user.id}</p>
                                <div class="dashboard-sections">
                                    ${
                                      dashboardData.portfolio
                                        ? `
                                        <div class="dashboard-section">
                                            <h3>Portfolio</h3>
                                            <p>Valor total: ${dashboardData.portfolio.totalValue || 'N/A'}</p>
                                        </div>
                                    `
                                        : ''
                                    }
                                    
                                    ${
                                      dashboardData.riskAnalysis
                                        ? `
                                        <div class="dashboard-section">
                                            <h3>Análisis de Riesgo</h3>
                                            <p>Nivel de riesgo: ${dashboardData.riskAnalysis.level || 'N/A'}</p>
                                        </div>
                                    `
                                        : ''
                                    }
                                    
                                    ${
                                      dashboardData.crossChainTransactions?.length
                                        ? `
                                        <div class="dashboard-section">
                                            <h3>Transacciones Cross-Chain</h3>
                                            <p>${dashboardData.crossChainTransactions.length} transacciones</p>
                                        </div>
                                    `
                                        : ''
                                    }
                                </div>
                            `;
            }
          }
        } catch (dashboardError) {
          console.error('❌ Error generando datos del dashboard:', dashboardError);
          dashboardContainer.innerHTML = `
                        <div class="error-message">
                            <p>Error al cargar los datos del dashboard. Por favor, intenta de nuevo.</p>
                            <button onclick="window.location.reload()">Reintentar</button>
                        </div>
                    `;
        }
      }
    } catch (error) {
      console.error('❌ Error cargando dashboard:', error);
      showErrorMessage('Error al cargar el dashboard. Por favor, intenta de nuevo.');
    }
  };

  // Inicializar wallet si estamos en esa página
  const initWallet = () => {
    // Verificar si el gestor de wallet ya está disponible
    if (window.walletManager) {
      window.walletManager.initialize();
    } else {
      // Buscar elemento contenedor de wallet
      const walletContainer = document.getElementById('wallet-container');
      if (walletContainer) {
        walletContainer.innerHTML = `
                    <div class="wallet-error">
                        <p>Error al cargar el wallet. El componente walletManager no está disponible.</p>
                        <button onclick="window.location.reload()">Reintentar</button>
                    </div>
                `;
      }
    }
  };

  // Función para mostrar mensajes de error
  const showErrorMessage = message => {
    const errorContainer = document.getElementById('error-container');

    if (errorContainer) {
      errorContainer.textContent = message;
      errorContainer.classList.remove('hidden');
    } else {
      // Crear un contenedor de error si no existe
      const newErrorContainer = document.createElement('div');
      newErrorContainer.id = 'error-container';
      newErrorContainer.className = 'error-message';
      newErrorContainer.style.position = 'fixed';
      newErrorContainer.style.top = '1rem';
      newErrorContainer.style.left = '50%';
      newErrorContainer.style.transform = 'translateX(-50%)';
      newErrorContainer.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
      newErrorContainer.style.color = 'white';
      newErrorContainer.style.padding = '1rem 2rem';
      newErrorContainer.style.borderRadius = '0.5rem';
      newErrorContainer.style.zIndex = '9999';
      newErrorContainer.textContent = message;

      // Botón para cerrar
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '&times;';
      closeButton.style.marginLeft = '1rem';
      closeButton.style.background = 'none';
      closeButton.style.border = 'none';
      closeButton.style.color = 'white';
      closeButton.style.fontSize = '1.5rem';
      closeButton.style.cursor = 'pointer';
      closeButton.style.verticalAlign = 'middle';
      closeButton.onclick = () => {
        newErrorContainer.remove();
      };

      newErrorContainer.appendChild(closeButton);
      document.body.appendChild(newErrorContainer);

      // Auto-ocultar después de 5 segundos
      setTimeout(() => {
        newErrorContainer.style.opacity = '0';
        newErrorContainer.style.transition = 'opacity 0.5s ease-out';
        setTimeout(() => {
          if (newErrorContainer.parentNode) {
            newErrorContainer.parentNode.removeChild(newErrorContainer);
          }
        }, 500);
      }, 5000);
    }
  };

  // Inicializar tooltips
  const initTooltips = () => {
    document.querySelectorAll('[data-tooltip]').forEach(el => {
      el.addEventListener('mouseenter', function () {
        const tooltipText = this.getAttribute('data-tooltip');

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = tooltipText;
        tooltip.style.position = 'absolute';
        tooltip.style.backgroundColor = 'rgba(15, 23, 42, 0.9)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '0.5rem 1rem';
        tooltip.style.borderRadius = '0.25rem';
        tooltip.style.fontSize = '0.875rem';
        tooltip.style.zIndex = '1000';
        tooltip.style.pointerEvents = 'none';

        document.body.appendChild(tooltip);

        const rect = this.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + 5 + window.scrollY}px`;
        tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + window.scrollX}px`;

        this.addEventListener(
          'mouseleave',
          function () {
            tooltip.remove();
          },
          { once: true }
        );
      });
    });
  };

  // Inicializar dropdowns
  const initDropdowns = () => {
    document.querySelectorAll('[data-dropdown]').forEach(el => {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        const dropdownId = this.getAttribute('data-dropdown');
        const dropdown = document.getElementById(dropdownId);

        if (dropdown) {
          dropdown.classList.toggle('show');
        }
      });
    });

    // Cerrar dropdowns al hacer click fuera
    document.addEventListener('click', function (e) {
      document.querySelectorAll('.dropdown-menu.show').forEach(dropdown => {
        const trigger = document.querySelector(`[data-dropdown="${dropdown.id}"]`);
        if (trigger && !trigger.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.classList.remove('show');
        }
      });
    });
  };

  // Actualizar la UI basado en la ubicación actual
  const updateUIBasedOnLocation = () => {
    const path = window.location.pathname;
    const filename = path.split('/').pop();

    // Marcar el link activo en la navegación
    document.querySelectorAll('nav a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === filename || (filename === '' && href === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Inicialización específica por página
    switch (filename) {
      case 'dashboard.html':
      case 'simple-dashboard.html':
      case 'test-dashboard.html':
        console.log('🔄 Inicializando página de dashboard');
        loadDashboard();
        break;

      case 'lending.html':
        console.log('🔄 Inicializando página de préstamos');
        // Inicialización específica para préstamos aquí
        break;

      case 'enterprise.html':
        console.log('🔄 Inicializando página empresarial');
        // Inicialización específica para enterprise aquí
        break;

      default:
        // Página de inicio o desconocida
        break;
    }
  };

  // Función para obtener el ID del usuario actual (simulada)
  const getCurrentUserId = () => {
    // Primero intentar obtenerlo del objeto Core
    if (window.bitForward && window.bitForward.currentUser) {
      return window.bitForward.currentUser.id;
    }

    // Luego intentar obtenerlo del localStorage (si se guarda ahí)
    const storedUser = localStorage.getItem('bitforward_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        return userData.id || storedUser;
      } catch (e) {
        // Si no es JSON, usar el string directamente
        return storedUser;
      }
    }

    // Por último, valor de desarrollo por defecto
    return 'user-123';
  };

  // Iniciar el proceso de inicialización
  init();
});
