/**
 * BitForward Customizable Dashboard
 * Allows users to reorganize and personalize widgets according to their preferences
 */

class DashboardCustomizer {
  constructor() {
    this.draggableOptions = {
      draggable: '.widget',
      handle: '.widget-header',
      animation: 150,
      ghostClass: 'widget-ghost',
      chosenClass: 'widget-chosen',
      dragClass: 'widget-drag',
      forceFallback: true  // Better mobile support
    };

    this.layoutKey = 'bf-dashboard-layout';
    this.visibilityKey = 'bf-widget-visibility';
    this.layoutSettings = this.loadLayoutSettings();
    this.widgetSettings = this.loadWidgetSettings();

    this.init();
  }

  init() {
    // Initialize once DOM is fully loaded
    document.addEventListener('DOMContentLoaded', () => {
      this.renderCustomizeButton();
      this.setupDashboard();
    });

    // Re-initialize if page content changes
    document.addEventListener('page-content-updated', () => {
      this.renderCustomizeButton();
      this.setupDashboard();
    });
  }

  renderCustomizeButton() {
    const dashboardHeader = document.querySelector('.dashboard-header');
    if (!dashboardHeader) {return;}

    // Check if button already exists
    if (dashboardHeader.querySelector('.customize-dashboard-btn')) {return;}

    // Create the customize button
    const customizeBtn = document.createElement('button');
    customizeBtn.className = 'customize-dashboard-btn';
    customizeBtn.innerHTML = '<i class="fas fa-cog"></i> Personalizar';

    // Insert button
    const actions = dashboardHeader.querySelector('.dashboard-actions') || dashboardHeader;
    actions.appendChild(customizeBtn);

    // Add click event
    customizeBtn.addEventListener('click', () => this.openCustomizeModal());
  }

  setupDashboard() {
    const dashboard = document.querySelector('.dashboard-widgets');
    if (!dashboard) {return;}

    // Add customizable class
    dashboard.classList.add('customizable-dashboard');

    // Find all widgets and mark them
    const widgets = dashboard.querySelectorAll('.card, .panel, .widget-container');
    widgets.forEach((widget, index) => {
      if (!widget.classList.contains('widget')) {
        widget.classList.add('widget');
      }

      // Add ID if not present
      if (!widget.id) {
        widget.id = `widget-${index}`;
      }

      // Add widget header if not present
      if (!widget.querySelector('.widget-header')) {
        const title = widget.querySelector('.card-title, .panel-title, h2, h3') || { textContent: 'Widget' };
        const titleText = title.textContent;

        const header = document.createElement('div');
        header.className = 'widget-header';
        header.innerHTML = `
                    <div class="widget-drag-handle">
                        <i class="fas fa-grip-lines"></i>
                    </div>
                    <div class="widget-title">${titleText}</div>
                    <div class="widget-actions">
                        <button class="widget-minimize" title="Minimizar">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="widget-maximize" title="Expandir">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button class="widget-close" title="Cerrar">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;

        // Insert header at the beginning of the widget
        widget.insertBefore(header, widget.firstChild);

        // Add click handlers
        header.querySelector('.widget-minimize').addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleWidgetMinimize(widget.id);
        });

        header.querySelector('.widget-maximize').addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleWidgetMaximize(widget.id);
        });

        header.querySelector('.widget-close').addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleWidgetVisibility(widget.id, false);
        });
      }

      // Apply saved settings
      this.applyWidgetSettings(widget);
    });

    // Initialize drag and drop
    if (typeof Sortable !== 'undefined') {
      this.initSortable(dashboard);
    } else {
      // Dynamically load Sortable.js if not available
      this.loadSortableJS().then(() => {
        this.initSortable(dashboard);
      });
    }

    // Apply saved layout
    this.applyLayoutSettings(dashboard);
  }

  initSortable(dashboard) {
    if (!window.Sortable) {return;}

    // Initialize Sortable on the dashboard
    const sortable = new Sortable(dashboard, this.draggableOptions);

    // Save layout when order changes
    sortable.options.onSort = () => {
      this.saveCurrentLayout(dashboard);
    };
  }

  loadSortableJS() {
    return new Promise((resolve, reject) => {
      if (window.Sortable) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  saveCurrentLayout(dashboard) {
    const widgets = dashboard.querySelectorAll('.widget');
    const layout = Array.from(widgets).map(widget => widget.id);

    this.layoutSettings = layout;
    localStorage.setItem(this.layoutKey, JSON.stringify(layout));

    console.log('Dashboard layout saved', layout);
  }

  applyLayoutSettings(dashboard) {
    if (!this.layoutSettings || this.layoutSettings.length === 0) {return;}

    const widgetMap = {};
    dashboard.querySelectorAll('.widget').forEach(widget => {
      widgetMap[widget.id] = widget;
    });

    // Reorder according to saved layout
    this.layoutSettings.forEach(widgetId => {
      const widget = widgetMap[widgetId];
      if (widget) {
        dashboard.appendChild(widget);
      }
    });
  }

  applyWidgetSettings(widget) {
    const widgetId = widget.id;
    const settings = this.widgetSettings[widgetId];

    if (!settings) {return;}

    // Apply visibility
    if (settings.visible === false) {
      widget.classList.add('widget-hidden');
    } else {
      widget.classList.remove('widget-hidden');
    }

    // Apply minimize state
    if (settings.minimized) {
      widget.classList.add('widget-minimized');
    } else {
      widget.classList.remove('widget-minimized');
    }

    // Apply maximize state
    if (settings.maximized) {
      widget.classList.add('widget-maximized');
    } else {
      widget.classList.remove('widget-maximized');
    }
  }

  toggleWidgetMinimize(widgetId) {
    const widget = document.getElementById(widgetId);
    if (!widget) {return;}

    widget.classList.toggle('widget-minimized');

    // Update settings
    this.widgetSettings[widgetId] = {
      ...this.widgetSettings[widgetId] || {},
      minimized: widget.classList.contains('widget-minimized'),
      maximized: false  // Can't be both minimized and maximized
    };

    // Save settings
    this.saveWidgetSettings();
  }

  toggleWidgetMaximize(widgetId) {
    const widget = document.getElementById(widgetId);
    if (!widget) {return;}

    // Remove maximized class from all widgets first
    document.querySelectorAll('.widget-maximized').forEach(w => {
      if (w.id !== widgetId) {
        w.classList.remove('widget-maximized');
        if (this.widgetSettings[w.id]) {
          this.widgetSettings[w.id].maximized = false;
        }
      }
    });

    // Toggle for this widget
    widget.classList.toggle('widget-maximized');

    // Update settings
    this.widgetSettings[widgetId] = {
      ...this.widgetSettings[widgetId] || {},
      maximized: widget.classList.contains('widget-maximized'),
      minimized: false  // Can't be both minimized and maximized
    };

    // Save settings
    this.saveWidgetSettings();
  }

  toggleWidgetVisibility(widgetId, visible) {
    const widget = document.getElementById(widgetId);
    if (!widget) {return;}

    if (visible === undefined) {
      // Toggle if no value provided
      visible = !widget.classList.contains('widget-hidden');
    }

    if (visible) {
      widget.classList.remove('widget-hidden');
    } else {
      widget.classList.add('widget-hidden');
    }

    // Update settings
    this.widgetSettings[widgetId] = {
      ...this.widgetSettings[widgetId] || {},
      visible: visible
    };

    // Save settings
    this.saveWidgetSettings();
  }

  openCustomizeModal() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('customize-dashboard-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'customize-dashboard-modal';
      modal.className = 'modal';
      modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Personalizar Dashboard</h3>
                        <button class="modal-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <div class="customize-tabs">
                            <button class="tab-btn active" data-tab="widgets">Widgets</button>
                            <button class="tab-btn" data-tab="layout">Layout</button>
                            <button class="tab-btn" data-tab="theme">Apariencia</button>
                        </div>
                        
                        <div class="tab-content" id="widgets-tab">
                            <h4>Gestionar Widgets</h4>
                            <p>Activa o desactiva widgets para personalizar tu dashboard.</p>
                            <div class="widget-toggles"></div>
                        </div>
                        
                        <div class="tab-content hidden" id="layout-tab">
                            <h4>Ajustes de Layout</h4>
                            <p>Personaliza la distribución de tu dashboard.</p>
                            <div class="layout-options">
                                <label>
                                    <input type="radio" name="layout" value="grid">
                                    Cuadrícula
                                </label>
                                <label>
                                    <input type="radio" name="layout" value="stack">
                                    Lista
                                </label>
                                <label>
                                    <input type="radio" name="layout" value="columns">
                                    Columnas
                                </label>
                            </div>
                            <div class="column-settings">
                                <h5>Ancho de Columnas</h5>
                                <div class="column-slider">
                                    <input type="range" min="1" max="12" value="6" class="slider" id="column-width">
                                    <span id="column-value">6/12</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="tab-content hidden" id="theme-tab">
                            <h4>Personalización Visual</h4>
                            <div class="theme-settings">
                                <div class="color-scheme">
                                    <h5>Esquema de Color</h5>
                                    <div class="color-options">
                                        <button class="color-option" data-color="default" style="background: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)"></button>
                                        <button class="color-option" data-color="emerald" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%)"></button>
                                        <button class="color-option" data-color="amber" style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"></button>
                                        <button class="color-option" data-color="rose" style="background: linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)"></button>
                                        <button class="color-option" data-color="violet" style="background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)"></button>
                                    </div>
                                </div>
                                <div class="background-effect">
                                    <h5>Efecto de Fondo</h5>
                                    <div class="effect-options">
                                        <button class="effect-option" data-effect="none">Ninguno</button>
                                        <button class="effect-option" data-effect="particles">Partículas</button>
                                        <button class="effect-option" data-effect="gradient">Gradiente Dinámico</button>
                                        <button class="effect-option" data-effect="waves">Ondas</button>
                                    </div>
                                </div>
                                <div class="card-style">
                                    <h5>Estilo de Tarjetas</h5>
                                    <div class="card-options">
                                        <button class="card-option" data-style="glass">Vidrio</button>
                                        <button class="card-option" data-style="solid">Sólido</button>
                                        <button class="card-option" data-style="bordered">Bordes</button>
                                        <button class="card-option" data-style="minimal">Minimalista</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-reset">Restablecer Valores</button>
                        <button class="btn-save">Guardar Cambios</button>
                    </div>
                </div>
            `;

      document.body.appendChild(modal);

      // Add event listeners
      modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.classList.remove('open');
      });

      // Tab navigation
      const tabs = modal.querySelectorAll('.tab-btn');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          // Deactivate all tabs
          tabs.forEach(t => t.classList.remove('active'));
          modal.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

          // Activate selected tab
          tab.classList.add('active');
          const tabContent = document.getElementById(`${tab.dataset.tab}-tab`);
          tabContent.classList.remove('hidden');
        });
      });

      // Save button
      modal.querySelector('.btn-save').addEventListener('click', () => {
        this.saveCustomizationSettings(modal);
        modal.classList.remove('open');
      });

      // Reset button
      modal.querySelector('.btn-reset').addEventListener('click', () => {
        if (confirm('¿Estás seguro de que quieres restablecer todos los ajustes personalizados?')) {
          this.resetCustomizationSettings();
          modal.classList.remove('open');
        }
      });

      // Layout option changes
      const layoutOptions = modal.querySelectorAll('input[name="layout"]');
      layoutOptions.forEach(option => {
        option.addEventListener('change', () => {
          this.updateLayoutPreview(option.value);
        });
      });

      // Column width slider
      const columnSlider = modal.querySelector('#column-width');
      if (columnSlider) {
        columnSlider.addEventListener('input', () => {
          const value = columnSlider.value;
          modal.querySelector('#column-value').textContent = `${value}/12`;
        });
      }

      // Theme options
      modal.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
          modal.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
          option.classList.add('selected');
        });
      });

      modal.querySelectorAll('.effect-option').forEach(option => {
        option.addEventListener('click', () => {
          modal.querySelectorAll('.effect-option').forEach(o => o.classList.remove('selected'));
          option.classList.add('selected');
        });
      });

      modal.querySelectorAll('.card-option').forEach(option => {
        option.addEventListener('click', () => {
          modal.querySelectorAll('.card-option').forEach(o => o.classList.remove('selected'));
          option.classList.add('selected');
        });
      });
    }

    // Update widget toggles
    this.updateWidgetToggles(modal);

    // Update theme settings
    this.updateThemeSettings(modal);

    // Open the modal
    modal.classList.add('open');
  }

  updateWidgetToggles(modal) {
    const container = modal.querySelector('.widget-toggles');
    if (!container) {return;}

    container.innerHTML = '';

    // Get all available widgets
    const dashboard = document.querySelector('.dashboard-widgets');
    if (!dashboard) {return;}

    const widgets = dashboard.querySelectorAll('.widget');

    widgets.forEach(widget => {
      const widgetId = widget.id;
      const widgetTitle = widget.querySelector('.widget-title')?.textContent ||
                               widget.querySelector('.card-title')?.textContent ||
                               'Widget';

      // Create toggle item
      const toggleItem = document.createElement('div');
      toggleItem.className = 'widget-toggle-item';
      toggleItem.innerHTML = `
                <div class="toggle-info">
                    <span class="toggle-title">${widgetTitle}</span>
                    <span class="toggle-id">${widgetId}</span>
                </div>
                <label class="switch">
                    <input type="checkbox" id="toggle-${widgetId}" ${!widget.classList.contains('widget-hidden') ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
            `;

      // Add event listener
      toggleItem.querySelector(`#toggle-${widgetId}`).addEventListener('change', (e) => {
        this.toggleWidgetVisibility(widgetId, e.target.checked);
      });

      container.appendChild(toggleItem);
    });
  }

  updateThemeSettings(modal) {
    // Load saved theme settings
    const themeSettings = this.loadThemeSettings();

    // Apply color scheme selection
    if (themeSettings.colorScheme) {
      modal.querySelectorAll('.color-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.color === themeSettings.colorScheme);
      });
    }

    // Apply background effect selection
    if (themeSettings.backgroundEffect) {
      modal.querySelectorAll('.effect-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.effect === themeSettings.backgroundEffect);
      });
    }

    // Apply card style selection
    if (themeSettings.cardStyle) {
      modal.querySelectorAll('.card-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.style === themeSettings.cardStyle);
      });
    }
  }

  saveCustomizationSettings(modal) {
    // Save layout type
    const layoutType = modal.querySelector('input[name="layout"]:checked')?.value || 'grid';

    // Save column width
    const columnWidth = modal.querySelector('#column-width')?.value || 6;

    // Save theme settings
    const colorScheme = modal.querySelector('.color-option.selected')?.dataset.color || 'default';
    const backgroundEffect = modal.querySelector('.effect-option.selected')?.dataset.effect || 'none';
    const cardStyle = modal.querySelector('.card-option.selected')?.dataset.style || 'glass';

    const themeSettings = {
      colorScheme,
      backgroundEffect,
      cardStyle
    };

    // Save to localStorage
    localStorage.setItem('bf-layout-type', layoutType);
    localStorage.setItem('bf-column-width', columnWidth);
    localStorage.setItem('bf-theme-settings', JSON.stringify(themeSettings));

    // Apply settings
    this.applyLayoutType(layoutType);
    this.applyColumnWidth(columnWidth);
    this.applyThemeSettings(themeSettings);

    // Notify success
    this.showToast('Configuración guardada con éxito');
  }

  resetCustomizationSettings() {
    // Clear layout settings
    localStorage.removeItem(this.layoutKey);
    localStorage.removeItem(this.visibilityKey);
    localStorage.removeItem('bf-layout-type');
    localStorage.removeItem('bf-column-width');
    localStorage.removeItem('bf-theme-settings');

    // Reset widget settings
    this.widgetSettings = {};

    // Reset layout settings
    this.layoutSettings = [];

    // Reload the page to apply defaults
    window.location.reload();
  }

  updateLayoutPreview(layoutType) {
    // Show/hide column settings based on layout type
    const columnSettings = document.querySelector('.column-settings');
    if (columnSettings) {
      columnSettings.style.display = layoutType === 'columns' ? 'block' : 'none';
    }
  }

  applyLayoutType(layoutType) {
    const dashboard = document.querySelector('.dashboard-widgets');
    if (!dashboard) {return;}

    // Remove existing layout classes
    dashboard.classList.remove('layout-grid', 'layout-stack', 'layout-columns');

    // Add selected layout class
    dashboard.classList.add(`layout-${layoutType}`);
  }

  applyColumnWidth(width) {
    document.documentElement.style.setProperty('--dashboard-column-width', `${width}/12`);
  }

  applyThemeSettings(settings) {
    const { colorScheme, backgroundEffect, cardStyle } = settings;

    // Apply color scheme
    document.body.dataset.colorScheme = colorScheme;

    // Apply card style
    document.body.dataset.cardStyle = cardStyle;

    // Apply background effect
    this.applyBackgroundEffect(backgroundEffect);
  }

  applyBackgroundEffect(effect) {
    // Remove existing effect
    const existingEffect = document.getElementById('background-effect');
    if (existingEffect) {
      existingEffect.remove();
    }

    // Add new effect if not 'none'
    if (effect && effect !== 'none') {
      const effectElement = document.createElement('div');
      effectElement.id = 'background-effect';
      effectElement.className = `bg-effect bg-effect-${effect}`;
      document.body.appendChild(effectElement);

      // Initialize the effect
      switch (effect) {
        case 'particles':
          this.initParticlesEffect(effectElement);
          break;
        case 'gradient':
          this.initGradientEffect(effectElement);
          break;
        case 'waves':
          this.initWavesEffect(effectElement);
          break;
      }
    }
  }

  initParticlesEffect(element) {
    // Basic particles effect
    element.innerHTML = '';
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${Math.random() * 30 + 10}s`;
      particle.style.animationDelay = `${Math.random() * 5}s`;
      element.appendChild(particle);
    }
  }

  initGradientEffect(element) {
    element.innerHTML = '<div class="gradient-animation"></div>';
  }

  initWavesEffect(element) {
    for (let i = 1; i <= 3; i++) {
      const wave = document.createElement('div');
      wave.className = `wave wave-${i}`;
      element.appendChild(wave);
    }
  }

  loadLayoutSettings() {
    try {
      const saved = localStorage.getItem(this.layoutKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error loading layout settings', e);
      return [];
    }
  }

  loadWidgetSettings() {
    try {
      const saved = localStorage.getItem(this.visibilityKey);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error('Error loading widget settings', e);
      return {};
    }
  }

  loadThemeSettings() {
    try {
      const saved = localStorage.getItem('bf-theme-settings');
      return saved ? JSON.parse(saved) : {
        colorScheme: 'default',
        backgroundEffect: 'none',
        cardStyle: 'glass'
      };
    } catch (e) {
      console.error('Error loading theme settings', e);
      return {
        colorScheme: 'default',
        backgroundEffect: 'none',
        cardStyle: 'glass'
      };
    }
  }

  saveWidgetSettings() {
    localStorage.setItem(this.visibilityKey, JSON.stringify(this.widgetSettings));
  }

  showToast(message, type = 'success') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `dashboard-toast toast-${type}`;
    toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

    // Add to document
    document.body.appendChild(toast);

    // Add close event
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    });

    // Show toast with animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto hide after 3 seconds
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
      }
    }, 3000);
  }
}

// Add styles for customizable dashboard
const styleElement = document.createElement('style');
styleElement.textContent = `
    /* Customizable Dashboard */
    .customizable-dashboard {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        padding: 1rem 0;
    }
    
    .customizable-dashboard.layout-grid {
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    }
    
    .customizable-dashboard.layout-stack {
        grid-template-columns: 1fr;
    }
    
    .customizable-dashboard.layout-columns {
        grid-template-columns: var(--dashboard-column-width, 6/12) 1fr;
    }
    
    /* Widgets */
    .widget {
        transition: all 0.3s ease, transform 0.2s ease;
        position: relative;
        opacity: 1;
        overflow: hidden;
    }
    
    .widget-hidden {
        display: none;
    }
    
    .widget-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--border);
        cursor: move;
    }
    
    .dark-theme .widget-header {
        border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    }
    
    .widget-drag-handle {
        cursor: grab;
        padding: 0.25rem;
        border-radius: 4px;
    }
    
    .widget-drag-handle:hover {
        background-color: rgba(var(--accent-primary-rgb, 6, 182, 212), 0.1);
    }
    
    .widget-title {
        font-weight: 600;
        flex: 1;
        margin: 0 1rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .widget-actions {
        display: flex;
        gap: 0.5rem;
    }
    
    .widget-actions button {
        background: transparent;
        border: none;
        cursor: pointer;
        width: 24px;
        height: 24px;
        border-radius: 4px;
        color: var(--text-tertiary);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .widget-actions button:hover {
        background-color: rgba(var(--accent-primary-rgb, 6, 182, 212), 0.1);
        color: var(--accent-primary);
    }
    
    /* Widget States */
    .widget-minimized .widget-body {
        display: none;
    }
    
    .widget-minimized .widget-header {
        border-bottom: none;
    }
    
    .widget-maximized {
        position: fixed;
        top: 60px;
        left: 0;
        width: 100%;
        height: calc(100vh - 60px);
        z-index: 1000;
        margin: 0;
        display: flex;
        flex-direction: column;
    }
    
    .widget-maximized .widget-body {
        flex: 1;
        overflow: auto;
    }
    
    /* Drag and drop styles */
    .widget-ghost {
        opacity: 0.6;
        background-color: var(--bg-secondary) !important;
        border: 2px dashed var(--accent-primary) !important;
    }
    
    .widget-chosen {
        box-shadow: 0 0 0 2px var(--accent-primary) !important;
    }
    
    .widget-drag {
        opacity: 0.8;
        transform: scale(0.98);
    }
    
    /* Customize Modal */
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
    }
    
    .modal.open {
        opacity: 1;
        pointer-events: auto;
    }
    
    .modal-content {
        width: 100%;
        max-width: 600px;
        max-height: 80vh;
        background: var(--card-bg);
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    
    .dark-theme .modal-content {
        backdrop-filter: blur(20px);
        background: rgba(15, 23, 42, 0.8);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(148, 163, 184, 0.1);
    }
    
    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border-bottom: 1px solid var(--border);
    }
    
    .modal-header h3 {
        margin: 0;
    }
    
    .modal-close {
        background: transparent;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        color: var(--text-tertiary);
    }
    
    .modal-body {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
    }
    
    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding: 1rem;
        border-top: 1px solid var(--border);
    }
    
    /* Tabs */
    .customize-tabs {
        display: flex;
        border-bottom: 1px solid var(--border);
        margin-bottom: 1rem;
    }
    
    .tab-btn {
        background: transparent;
        border: none;
        padding: 0.75rem 1rem;
        cursor: pointer;
        color: var(--text-secondary);
        position: relative;
    }
    
    .tab-btn.active {
        color: var(--accent-primary);
    }
    
    .tab-btn.active:after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        width: 100%;
        height: 2px;
        background-color: var(--accent-primary);
    }
    
    .tab-content {
        display: block;
        margin-top: 1rem;
    }
    
    .tab-content.hidden {
        display: none;
    }
    
    /* Widget Toggle List */
    .widget-toggles {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    
    .widget-toggle-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: 6px;
    }
    
    .dark-theme .widget-toggle-item {
        border-color: rgba(148, 163, 184, 0.1);
    }
    
    .toggle-info {
        display: flex;
        flex-direction: column;
    }
    
    .toggle-title {
        font-weight: 500;
    }
    
    .toggle-id {
        font-size: 0.8rem;
        color: var(--text-tertiary);
    }
    
    /* Toggle Switch */
    .switch {
        position: relative;
        display: inline-block;
        width: 48px;
        height: 24px;
    }
    
    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }
    
    .switch .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--bg-tertiary);
        transition: .4s;
        border-radius: 24px;
    }
    
    .switch .slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
    }
    
    .switch input:checked + .slider {
        background-color: var(--accent-primary);
    }
    
    .switch input:checked + .slider:before {
        transform: translateX(24px);
    }
    
    /* Layout Options */
    .layout-options, .column-settings, .effect-options, .color-options, .card-options {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin: 1rem 0;
    }
    
    .layout-options label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }
    
    .column-slider {
        display: flex;
        align-items: center;
        gap: 1rem;
        width: 100%;
    }
    
    .slider {
        width: 100%;
    }
    
    /* Theme Options */
    .color-option {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        border: 2px solid var(--border);
        transition: all 0.3s ease;
        position: relative;
    }
    
    .color-option.selected {
        transform: scale(1.1);
        box-shadow: 0 0 0 2px var(--accent-primary);
    }
    
    .color-option.selected:after {
        content: '✓';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        color: white;
        font-size: 16px;
        text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
    }
    
    .effect-option, .card-option {
        padding: 0.5rem 1rem;
        border-radius: 4px;
        background-color: var(--bg-secondary);
        border: 1px solid var(--border);
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .effect-option.selected, .card-option.selected {
        background-color: var(--accent-primary);
        color: white;
        border-color: var(--accent-primary);
    }
    
    /* Background Effects */
    #background-effect {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        pointer-events: none;
        overflow: hidden;
    }
    
    .bg-effect-particles .particle {
        position: absolute;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--accent-primary);
        opacity: 0.3;
        animation: float 30s linear infinite;
    }
    
    .bg-effect-gradient .gradient-animation {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(120deg, 
            var(--dark-bg-primary), 
            var(--dark-bg-secondary),
            rgba(6, 182, 212, 0.1),
            var(--dark-bg-secondary),
            var(--dark-bg-primary));
        background-size: 400% 400%;
        animation: gradient-shift 15s ease infinite;
    }
    
    .bg-effect-waves .wave {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 100px;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".1" fill="%2306B6D4" /></svg>');
        background-size: 1200px 100px;
        opacity: 0.3;
    }
    
    .bg-effect-waves .wave-1 {
        animation: wave 30s linear infinite;
        z-index: 1;
        opacity: 0.2;
        animation-delay: 0s;
        bottom: 0;
    }
    
    .bg-effect-waves .wave-2 {
        animation: wave 15s linear reverse infinite;
        z-index: 2;
        opacity: 0.1;
        animation-delay: -5s;
        bottom: 10px;
    }
    
    .bg-effect-waves .wave-3 {
        animation: wave 20s linear infinite;
        z-index: 3;
        opacity: 0.05;
        animation-delay: -2s;
        bottom: 20px;
    }
    
    @keyframes wave {
        0% { background-position-x: 0; }
        100% { background-position-x: 1200px; }
    }
    
    @keyframes float {
        0% {
            transform: translateY(0) translateX(0);
        }
        50% {
            transform: translateY(-100vh) translateX(100vw);
        }
        100% {
            transform: translateY(-200vh) translateX(0);
        }
    }
    
    @keyframes gradient-shift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }
    
    /* Toast */
    .dashboard-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 0.75rem 1rem;
        background: var(--card-bg);
        border-left: 4px solid var(--accent-primary);
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 300px;
        max-width: 90vw;
        transform: translateX(120%);
        transition: transform 0.3s ease;
        z-index: 2000;
    }
    
    .dark-theme .dashboard-toast {
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    
    .dashboard-toast.toast-error {
        border-left-color: var(--error);
    }
    
    .dashboard-toast.show {
        transform: translateX(0);
    }
    
    .dashboard-toast.hiding {
        transform: translateX(120%);
    }
    
    .toast-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    
    .toast-content i {
        color: var(--accent-primary);
    }
    
    .toast-error .toast-content i {
        color: var(--error);
    }
    
    .toast-close {
        background: transparent;
        border: none;
        color: var(--text-tertiary);
        cursor: pointer;
    }
    
    /* Responsive */
    @media (max-width: 768px) {
        .customizable-dashboard {
            grid-template-columns: 1fr !important;
        }
        
        .modal-content {
            width: 95%;
            max-height: 95vh;
        }
    }
    
    /* Color Scheme Variations */
    body[data-color-scheme="emerald"] {
        --accent-primary: #10B981;
        --accent-secondary: #059669;
        --accent-primary-rgb: 16, 185, 129;
        --accent-secondary-rgb: 5, 150, 105;
    }
    
    body[data-color-scheme="amber"] {
        --accent-primary: #F59E0B;
        --accent-secondary: #D97706;
        --accent-primary-rgb: 245, 158, 11;
        --accent-secondary-rgb: 217, 119, 6;
    }
    
    body[data-color-scheme="rose"] {
        --accent-primary: #F43F5E;
        --accent-secondary: #E11D48;
        --accent-primary-rgb: 244, 63, 94;
        --accent-secondary-rgb: 225, 29, 72;
    }
    
    body[data-color-scheme="violet"] {
        --accent-primary: #8B5CF6;
        --accent-secondary: #7C3AED;
        --accent-primary-rgb: 139, 92, 246;
        --accent-secondary-rgb: 124, 58, 237;
    }
    
    /* Card Style Variations */
    body[data-card-style="solid"] .card, 
    body[data-card-style="solid"] .panel,
    body[data-card-style="solid"] .widget {
        background: var(--bg-secondary);
        backdrop-filter: none;
    }
    
    body[data-card-style="bordered"] .card,
    body[data-card-style="bordered"] .panel,
    body[data-card-style="bordered"] .widget {
        background: transparent;
        backdrop-filter: none;
        border: 1px solid var(--border);
        box-shadow: none;
    }
    
    body[data-card-style="minimal"] .card,
    body[data-card-style="minimal"] .panel,
    body[data-card-style="minimal"] .widget {
        background: transparent;
        backdrop-filter: none;
        border: none;
        box-shadow: none;
    }
`;

document.head.appendChild(styleElement);

// Initialize dashboard customizer
const dashboardCustomizer = new DashboardCustomizer();

// Expose to global scope
window.dashboardCustomizer = dashboardCustomizer;
