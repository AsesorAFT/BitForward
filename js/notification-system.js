/**
 * BitForward Notification System
 * Handles real-time notifications, alerts and user messages
 */

class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.maxNotifications = 50; // Max number to store
    this.unreadCount = 0;

    // Initialize DOM elements
    this.initializeUI();

    // Load saved notifications
    this.loadNotifications();

    // Setup event listeners
    this.setupListeners();

    // Check for new notifications periodically
    this.startPolling();
  }

  initializeUI() {
    // Create notification panel if it doesn't exist
    if (!document.querySelector('.notification-panel')) {
      this.createNotificationPanel();
    }

    // Create notification bell in header
    if (!document.querySelector('.notification-bell')) {
      this.createNotificationBell();
    }
  }

  createNotificationPanel() {
    const panel = document.createElement('div');
    panel.className = 'notification-panel';
    panel.innerHTML = `
            <div class="notification-header">
                <h3>Notificaciones</h3>
                <div class="notification-actions">
                    <button class="mark-all-read">Marcar todo como leído</button>
                    <button class="settings-btn"><i class="fas fa-cog"></i></button>
                    <button class="close-btn"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <div class="notification-filters">
                <button data-filter="all" class="active">Todas</button>
                <button data-filter="alerts">Alertas</button>
                <button data-filter="updates">Actualizaciones</button>
                <button data-filter="transactions">Transacciones</button>
            </div>
            <div class="notifications-list"></div>
            <div class="notification-footer">
                <button class="load-more">Cargar más</button>
                <button class="clear-all">Limpiar todo</button>
            </div>
        `;

    document.body.appendChild(panel);

    // Add event listeners to notification panel buttons
    panel.querySelector('.mark-all-read').addEventListener('click', () => this.markAllAsRead());
    panel.querySelector('.close-btn').addEventListener('click', () => this.togglePanel());
    panel.querySelector('.clear-all').addEventListener('click', () => this.clearAllNotifications());

    // Filter buttons
    const filterButtons = panel.querySelectorAll('.notification-filters button');
    filterButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        this.filterNotifications(e.target.dataset.filter);
      });
    });

    // Load more button
    panel.querySelector('.load-more').addEventListener('click', () => this.loadMoreNotifications());

    // Add theme transition class
    panel.classList.add('theme-transition');
  }

  createNotificationBell() {
    // Find header element
    const header = document.querySelector('header');
    if (!header) {return;}

    // Find user menu or action area in header
    const userArea = header.querySelector('.user-actions, .user-menu, .header-actions') ||
                        header.querySelector('nav') || header;

    // Create notification bell element
    const bell = document.createElement('div');
    bell.className = 'notification-bell';
    bell.innerHTML = `
            <button class="notification-toggle">
                <i class="fas fa-bell"></i>
                <span class="notification-badge">0</span>
            </button>
        `;

    // Insert before the last child (usually user profile)
    userArea.insertBefore(bell, userArea.lastElementChild);

    // Add event listener
    bell.querySelector('.notification-toggle').addEventListener('click', () => this.togglePanel());

    // Add theme transition class
    bell.classList.add('theme-transition');
  }

  togglePanel() {
    const panel = document.querySelector('.notification-panel');
    if (panel.classList.contains('open')) {
      panel.classList.remove('open');
      // If panel is closing, mark viewed notifications as read
      this.updateReadStatus();
    } else {
      panel.classList.add('open');
      this.renderNotifications();
    }
  }

  loadNotifications() {
    // Try to load from localStorage first
    const savedNotifications = localStorage.getItem('bf-notifications');
    if (savedNotifications) {
      this.notifications = JSON.parse(savedNotifications);
      this.updateUnreadCount();
      this.updateBadge();
    }

    // Demo data if no notifications exist
    if (this.notifications.length === 0) {
      this.addDemoNotifications();
    }
  }

  addDemoNotifications() {
    const now = new Date();
    const demoNotifications = [
      {
        id: 'demo-1',
        type: 'alert',
        title: 'Alerta de Precio',
        message: 'BTC ha subido más de 5% en las últimas 24 horas',
        timestamp: now.getTime() - 1800000, // 30 minutes ago
        read: false,
        icon: 'fa-chart-line',
        action: '/pages/portafolio.html'
      },
      {
        id: 'demo-2',
        type: 'transaction',
        title: 'Transacción Completada',
        message: 'Tu compra de 0.25 ETH se ha completado exitosamente',
        timestamp: now.getTime() - 3600000, // 1 hour ago
        read: true,
        icon: 'fa-check-circle',
        action: '/pages/contratos.html'
      },
      {
        id: 'demo-3',
        type: 'update',
        title: 'Actualización de Sistema',
        message: 'BitForward ha sido actualizado a la versión 2.5',
        timestamp: now.getTime() - 86400000, // 1 day ago
        read: true,
        icon: 'fa-sync',
        action: null
      }
    ];

    this.notifications = demoNotifications;
    this.saveNotifications();
    this.updateUnreadCount();
    this.updateBadge();
  }

  addNotification(notification) {
    // Generate unique ID if not provided
    if (!notification.id) {
      notification.id = 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    }

    // Add timestamp if not provided
    if (!notification.timestamp) {
      notification.timestamp = Date.now();
    }

    // Set as unread by default
    if (notification.read === undefined) {
      notification.read = false;
    }

    // Add to beginning of array
    this.notifications.unshift(notification);

    // Trim array if too long
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    // Save notifications
    this.saveNotifications();

    // Update UI
    this.updateUnreadCount();
    this.updateBadge();
    this.showToast(notification);

    // If panel is open, re-render
    const panel = document.querySelector('.notification-panel');
    if (panel && panel.classList.contains('open')) {
      this.renderNotifications();
    }

    // Dispatch event
    window.dispatchEvent(new CustomEvent('bf-notification-added', {
      detail: { notification }
    }));
  }

  renderNotifications() {
    const container = document.querySelector('.notifications-list');
    if (!container) {return;}

    const activeFilter = document.querySelector('.notification-filters button.active').dataset.filter;
    const filteredNotifications = this.getFilteredNotifications(activeFilter);

    // Show only the most recent 10 notifications initially
    const notifications = filteredNotifications.slice(0, 10);

    if (notifications.length === 0) {
      container.innerHTML = '<div class="no-notifications">No hay notificaciones</div>';
      return;
    }

    container.innerHTML = '';

    notifications.forEach(notification => {
      const notificationEl = document.createElement('div');
      notificationEl.className = `notification-item ${notification.type} ${notification.read ? 'read' : 'unread'}`;
      notificationEl.dataset.id = notification.id;

      // Calculate relative time
      const relativeTime = this.getRelativeTime(notification.timestamp);

      notificationEl.innerHTML = `
                <div class="notification-icon">
                    <i class="fas ${notification.icon || this.getIconForType(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-header">
                        <h4>${notification.title}</h4>
                        <span class="notification-time">${relativeTime}</span>
                    </div>
                    <p>${notification.message}</p>
                    ${notification.action ? `<a href="${notification.action}" class="notification-action">Ver detalles</a>` : ''}
                </div>
                <div class="notification-actions">
                    <button class="mark-read" title="Marcar como leído">
                        <i class="fas ${notification.read ? 'fa-envelope-open' : 'fa-envelope'}"></i>
                    </button>
                    <button class="delete-notification" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

      container.appendChild(notificationEl);

      // Add event listeners
      notificationEl.querySelector('.mark-read').addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleReadStatus(notification.id);
      });

      notificationEl.querySelector('.delete-notification').addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeNotification(notification.id);
      });

      // Make entire notification clickable if it has an action
      if (notification.action) {
        notificationEl.addEventListener('click', () => {
          if (!notification.read) {
            this.markAsRead(notification.id);
          }
          window.location.href = notification.action;
        });
      }
    });
  }

  getIconForType(type) {
    switch(type) {
      case 'alert': return 'fa-exclamation-circle';
      case 'transaction': return 'fa-exchange-alt';
      case 'update': return 'fa-info-circle';
      default: return 'fa-bell';
    }
  }

  getRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    // Convert to seconds
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) {
      return 'ahora';
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `hace ${minutes} min`;
    } else if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `hace ${hours}h`;
    } else {
      const days = Math.floor(seconds / 86400);
      return `hace ${days}d`;
    }
  }

  filterNotifications(filter) {
    const container = document.querySelector('.notifications-list');
    if (!container) {return;}

    // Re-render with the new filter
    this.renderNotifications();
  }

  getFilteredNotifications(filter) {
    if (filter === 'all') {
      return this.notifications;
    }

    return this.notifications.filter(notification => notification.type === filter);
  }

  markAsRead(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      this.saveNotifications();
      this.updateUnreadCount();
      this.updateBadge();

      // Update UI if panel open
      const notificationEl = document.querySelector(`.notification-item[data-id="${id}"]`);
      if (notificationEl) {
        notificationEl.classList.remove('unread');
        notificationEl.classList.add('read');
        notificationEl.querySelector('.mark-read i').className = 'fas fa-envelope-open';
      }
    }
  }

  toggleReadStatus(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = !notification.read;
      this.saveNotifications();
      this.updateUnreadCount();
      this.updateBadge();

      // Update UI
      const notificationEl = document.querySelector(`.notification-item[data-id="${id}"]`);
      if (notificationEl) {
        notificationEl.classList.toggle('unread');
        notificationEl.classList.toggle('read');
        notificationEl.querySelector('.mark-read i').className = `fas ${notification.read ? 'fa-envelope-open' : 'fa-envelope'}`;
      }
    }
  }

  markAllAsRead() {
    let updated = false;

    this.notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
        updated = true;
      }
    });

    if (updated) {
      this.saveNotifications();
      this.updateUnreadCount();
      this.updateBadge();

      // Update UI
      const unreadNotifications = document.querySelectorAll('.notification-item.unread');
      unreadNotifications.forEach(el => {
        el.classList.remove('unread');
        el.classList.add('read');
        el.querySelector('.mark-read i').className = 'fas fa-envelope-open';
      });
    }
  }

  updateReadStatus() {
    // Mark notifications as read when panel is viewed
    const visibleNotifications = document.querySelectorAll('.notification-item.unread');
    visibleNotifications.forEach(el => {
      const id = el.dataset.id;
      this.markAsRead(id);
    });
  }

  removeNotification(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      // Check if it was unread before removing
      const wasUnread = !this.notifications[index].read;

      // Remove from array
      this.notifications.splice(index, 1);
      this.saveNotifications();

      // Update UI
      const notificationEl = document.querySelector(`.notification-item[data-id="${id}"]`);
      if (notificationEl) {
        notificationEl.classList.add('removing');
        setTimeout(() => {
          notificationEl.remove();

          // Check if we need to show "no notifications" message
          const container = document.querySelector('.notifications-list');
          if (container && container.children.length === 0) {
            container.innerHTML = '<div class="no-notifications">No hay notificaciones</div>';
          }
        }, 300);
      }

      // Update badge if needed
      if (wasUnread) {
        this.updateUnreadCount();
        this.updateBadge();
      }
    }
  }

  clearAllNotifications() {
    if (confirm('¿Estás seguro de que quieres eliminar todas las notificaciones?')) {
      this.notifications = [];
      this.saveNotifications();
      this.updateUnreadCount();
      this.updateBadge();

      // Update UI
      const container = document.querySelector('.notifications-list');
      if (container) {
        container.innerHTML = '<div class="no-notifications">No hay notificaciones</div>';
      }
    }
  }

  loadMoreNotifications() {
    const container = document.querySelector('.notifications-list');
    if (!container) {return;}

    const activeFilter = document.querySelector('.notification-filters button.active').dataset.filter;
    const filteredNotifications = this.getFilteredNotifications(activeFilter);

    // Count current notifications
    const currentCount = container.querySelectorAll('.notification-item').length;

    // Load next 10
    const nextBatch = filteredNotifications.slice(currentCount, currentCount + 10);

    if (nextBatch.length === 0) {
      // No more to load
      return;
    }

    // Remove "no notifications" message if it exists
    const noNotificationsMsg = container.querySelector('.no-notifications');
    if (noNotificationsMsg) {
      noNotificationsMsg.remove();
    }

    nextBatch.forEach(notification => {
      const notificationEl = document.createElement('div');
      notificationEl.className = `notification-item ${notification.type} ${notification.read ? 'read' : 'unread'}`;
      notificationEl.dataset.id = notification.id;

      // Calculate relative time
      const relativeTime = this.getRelativeTime(notification.timestamp);

      notificationEl.innerHTML = `
                <div class="notification-icon">
                    <i class="fas ${notification.icon || this.getIconForType(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-header">
                        <h4>${notification.title}</h4>
                        <span class="notification-time">${relativeTime}</span>
                    </div>
                    <p>${notification.message}</p>
                    ${notification.action ? `<a href="${notification.action}" class="notification-action">Ver detalles</a>` : ''}
                </div>
                <div class="notification-actions">
                    <button class="mark-read" title="Marcar como leído">
                        <i class="fas ${notification.read ? 'fa-envelope-open' : 'fa-envelope'}"></i>
                    </button>
                    <button class="delete-notification" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

      // Add with animation
      notificationEl.style.opacity = '0';
      container.appendChild(notificationEl);

      // Trigger animation
      setTimeout(() => {
        notificationEl.style.opacity = '1';
      }, 10);

      // Add event listeners
      notificationEl.querySelector('.mark-read').addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleReadStatus(notification.id);
      });

      notificationEl.querySelector('.delete-notification').addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeNotification(notification.id);
      });

      // Make entire notification clickable if it has an action
      if (notification.action) {
        notificationEl.addEventListener('click', () => {
          if (!notification.read) {
            this.markAsRead(notification.id);
          }
          window.location.href = notification.action;
        });
      }
    });

    // Hide "load more" button if no more notifications
    if (currentCount + nextBatch.length >= filteredNotifications.length) {
      const loadMoreBtn = document.querySelector('.load-more');
      if (loadMoreBtn) {
        loadMoreBtn.style.display = 'none';
      }
    }
  }

  updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  updateBadge() {
    const badge = document.querySelector('.notification-badge');
    if (badge) {
      badge.textContent = this.unreadCount;
      badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
    }
  }

  showToast(notification) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
            <div class="notification-toast-icon">
                <i class="fas ${notification.icon || this.getIconForType(notification.type)}"></i>
            </div>
            <div class="notification-toast-content">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
            </div>
            <button class="notification-toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;

    // Add to document
    document.body.appendChild(toast);

    // Add event listeners
    toast.querySelector('.notification-toast-close').addEventListener('click', () => {
      toast.classList.add('hiding');
      setTimeout(() => toast.remove(), 300);
    });

    // Make clickable if it has an action
    if (notification.action) {
      toast.addEventListener('click', (e) => {
        if (!e.target.closest('.notification-toast-close')) {
          this.markAsRead(notification.id);
          window.location.href = notification.action;
        }
      });
    }

    // Show toast with animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto hide after 5 seconds
    setTimeout(() => {
      if (document.body.contains(toast)) {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  saveNotifications() {
    localStorage.setItem('bf-notifications', JSON.stringify(this.notifications));
  }

  setupListeners() {
    // Listen for page updates
    document.addEventListener('page-content-updated', () => {
      // Re-initialize UI elements if needed
      this.initializeUI();
    });

    // Listen for theme changes
    window.addEventListener('bf-theme-changed', () => {
      // Re-render notifications with new theme
      if (document.querySelector('.notification-panel.open')) {
        this.renderNotifications();
      }
    });
  }

  startPolling() {
    // Check for new price alerts, updates, etc. every minute
    setInterval(() => this.checkForNewNotifications(), 60000);
  }

  checkForNewNotifications() {
    // In a real app, this would make API calls to check for new notifications
    // For demo purposes, we'll occasionally add random notifications

    // 10% chance to get a new notification every minute
    if (Math.random() < 0.1) {
      this.addRandomNotification();
    }
  }

  addRandomNotification() {
    const now = Date.now();
    const types = ['alert', 'transaction', 'update'];
    const type = types[Math.floor(Math.random() * types.length)];

    let notification;

    switch (type) {
      case 'alert':
        const coins = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT'];
        const coin = coins[Math.floor(Math.random() * coins.length)];
        const percent = (Math.random() * 10).toFixed(1);
        const direction = Math.random() > 0.5 ? 'subido' : 'bajado';

        notification = {
          type: 'alert',
          title: `Alerta de Precio: ${coin}`,
          message: `${coin} ha ${direction} ${percent}% en las últimas 24 horas`,
          timestamp: now,
          icon: 'fa-chart-line',
          action: '/pages/portafolio.html'
        };
        break;

      case 'transaction':
        const actions = ['compra', 'venta', 'transferencia', 'conversión', 'stake'];
        const action = actions[Math.floor(Math.random() * actions.length)];
        const amount = (Math.random() * 2).toFixed(3);
        const tokens = ['ETH', 'BTC', 'USDT', 'SOL', 'MATIC'];
        const token = tokens[Math.floor(Math.random() * tokens.length)];

        notification = {
          type: 'transaction',
          title: `${action.charAt(0).toUpperCase() + action.slice(1)} Completada`,
          message: `Tu ${action} de ${amount} ${token} se ha completado exitosamente`,
          timestamp: now,
          icon: 'fa-check-circle',
          action: '/pages/contratos.html'
        };
        break;

      case 'update':
        const updates = [
          'BitForward ha sido actualizado a la versión 2.5.1',
          'Nueva funcionalidad disponible: Trading automático',
          'Mantenimiento programado para mañana a las 02:00',
          'Se ha agregado soporte para 5 nuevas criptomonedas',
          'Tu KYC ha sido verificado exitosamente'
        ];

        notification = {
          type: 'update',
          title: 'Actualización del Sistema',
          message: updates[Math.floor(Math.random() * updates.length)],
          timestamp: now,
          icon: 'fa-info-circle',
          action: null
        };
        break;
    }

    this.addNotification(notification);
  }
}

// Add notification styles to document
const styleElement = document.createElement('style');
styleElement.textContent = `
    /* Notification Bell */
    .notification-bell {
        position: relative;
        margin: 0 1rem;
    }
    
    .notification-toggle {
        background: transparent;
        border: none;
        color: var(--text-primary);
        font-size: 1.2rem;
        cursor: pointer;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
    }
    
    .dark-theme .notification-toggle {
        color: var(--accent-primary);
    }
    
    .notification-toggle:hover {
        background-color: rgba(var(--accent-primary-rgb, 6, 182, 212), 0.1);
    }
    
    .notification-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: var(--accent-primary);
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 0.7rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        box-shadow: 0 0 0 2px var(--bg-primary);
    }
    
    /* Notification Panel */
    .notification-panel {
        position: fixed;
        top: 60px;
        right: -400px;
        width: 380px;
        max-width: 90vw;
        height: calc(100vh - 70px);
        background: var(--card-bg);
        border-left: 1px solid var(--border);
        border-top: 1px solid var(--border);
        box-shadow: -5px 0 20px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        border-radius: 10px 0 0 0;
        overflow: hidden;
    }
    
    .dark-theme .notification-panel {
        backdrop-filter: blur(20px);
        background: rgba(15, 23, 42, 0.8);
        box-shadow: -5px 0 20px rgba(6, 182, 212, 0.1);
    }
    
    .notification-panel.open {
        right: 0;
    }
    
    .notification-header {
        padding: 1rem;
        border-bottom: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .notification-header h3 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 600;
    }
    
    .notification-actions {
        display: flex;
        gap: 10px;
    }
    
    .notification-actions button {
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--text-secondary);
    }
    
    .notification-actions button:hover {
        color: var(--accent-primary);
    }
    
    .notification-filters {
        padding: 0.5rem 1rem;
        border-bottom: 1px solid var(--border);
        display: flex;
        gap: 10px;
        overflow-x: auto;
    }
    
    .notification-filters button {
        background: transparent;
        border: none;
        padding: 0.3rem 1rem;
        border-radius: 15px;
        cursor: pointer;
        font-size: 0.9rem;
        white-space: nowrap;
        color: var(--text-secondary);
    }
    
    .notification-filters button.active {
        background-color: var(--accent-primary);
        color: white;
    }
    
    .notifications-list {
        flex: 1;
        overflow-y: auto;
        padding: 0.5rem 0;
    }
    
    .notification-item {
        padding: 1rem;
        border-bottom: 1px solid var(--border);
        display: flex;
        cursor: pointer;
        transition: all 0.3s ease;
        opacity: 1;
        gap: 10px;
    }
    
    .notification-item:hover {
        background-color: rgba(var(--accent-primary-rgb, 6, 182, 212), 0.05);
    }
    
    .notification-item.removing {
        opacity: 0;
        transform: translateX(30px);
    }
    
    .notification-item.unread {
        border-left: 3px solid var(--accent-primary);
    }
    
    .notification-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(var(--accent-primary-rgb, 6, 182, 212), 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    
    .notification-item.unread .notification-icon {
        background: var(--accent-primary);
        color: white;
    }
    
    .notification-content {
        flex: 1;
    }
    
    .notification-content h4 {
        margin: 0 0 0.3rem 0;
        font-size: 1rem;
    }
    
    .notification-content p {
        margin: 0;
        font-size: 0.9rem;
        color: var(--text-tertiary);
    }
    
    .notification-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .notification-time {
        font-size: 0.8rem;
        color: var(--text-tertiary);
    }
    
    .notification-action {
        display: inline-block;
        margin-top: 0.5rem;
        font-size: 0.8rem;
        color: var(--accent-primary);
        text-decoration: none;
    }
    
    .notification-item .notification-actions {
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .notification-item:hover .notification-actions {
        opacity: 1;
    }
    
    .notification-footer {
        padding: 1rem;
        border-top: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
    }
    
    .notification-footer button {
        background: transparent;
        border: 1px solid var(--border);
        border-radius: 15px;
        padding: 0.5rem 1rem;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.3s ease;
    }
    
    .notification-footer button:hover {
        background-color: rgba(var(--accent-primary-rgb, 6, 182, 212), 0.1);
        border-color: var(--accent-primary);
        color: var(--accent-primary);
    }
    
    .no-notifications {
        padding: 2rem;
        text-align: center;
        color: var(--text-tertiary);
    }
    
    /* Toast Notifications */
    .notification-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 300px;
        background: var(--card-bg);
        border: 1px solid var(--border);
        border-left: 3px solid var(--accent-primary);
        border-radius: 5px;
        padding: 1rem;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        z-index: 1100;
        display: flex;
        gap: 10px;
        transform: translateX(120%);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
    }
    
    .dark-theme .notification-toast {
        backdrop-filter: blur(20px);
        background: rgba(15, 23, 42, 0.9);
        box-shadow: 0 5px 15px rgba(6, 182, 212, 0.1);
    }
    
    .notification-toast.show {
        transform: translateX(0);
    }
    
    .notification-toast.hiding {
        transform: translateX(120%);
    }
    
    .notification-toast-icon {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: rgba(var(--accent-primary-rgb, 6, 182, 212), 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        color: var(--accent-primary);
    }
    
    .notification-toast-content {
        flex: 1;
    }
    
    .notification-toast-content h4 {
        margin: 0 0 0.2rem 0;
        font-size: 0.95rem;
    }
    
    .notification-toast-content p {
        margin: 0;
        font-size: 0.85rem;
        color: var(--text-tertiary);
    }
    
    .notification-toast-close {
        background: transparent;
        border: none;
        color: var(--text-tertiary);
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
    }
    
    .notification-toast-close:hover {
        color: var(--text-primary);
    }
    
    /* Mobile Responsive */
    @media (max-width: 576px) {
        .notification-panel {
            top: 50px;
            width: 100%;
            max-width: 100%;
            height: calc(100vh - 50px);
            border-radius: 0;
        }
    }
`;

document.head.appendChild(styleElement);

// Initialize notification system
const notificationSystem = new NotificationSystem();

// Expose to global scope
window.notificationSystem = notificationSystem;
