/**
 * BitForward Admin Panel
 * Main JavaScript functionality for the admin interface
 * v1.0 - 2025
 */

// Import from core modules
import { EventSystem } from '../src/event-system.js';
import { ComponentLoader } from '../js/component-loader.js';
import { BlockchainService } from '../server/services/BlockchainService.js';

// Initialize the admin panel when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initAdminPanel();
});

// Global variables
let eventSystem;
let componentLoader;
let currentPage = 'dashboard';
let notificationCount = 0;
let adminUser = null;
let systemStatus = {
  server: 'online',
  database: 'online',
  blockchain: 'online',
  api: 'online',
  contracts: 'online',
};

/**
 * Initialize the admin panel and all required components
 */
async function initAdminPanel() {
  // Show loading screen
  showLoadingScreen();

  try {
    // Initialize core components
    eventSystem = new EventSystem();
    componentLoader = new ComponentLoader();

    // Register admin panel components
    registerComponents();

    // Setup event listeners
    setupEventListeners();

    // Load mock data for demonstration
    loadMockData();

    // Initialize charts and visualizations
    initCharts();

    // Check system status
    await checkSystemStatus();

    // Update system health indicators
    updateSystemHealth();

    // Load user info
    loadUserInfo();

    // Update notifications
    updateNotifications();

    // Hide loading screen after initialization
    setTimeout(hideLoadingScreen, 800);

    // Subscribe to blockchain events
    subscribeToBlockchainEvents();

    // Log initialization complete
    console.log('BitForward Admin Panel initialized successfully');

    // Publish event that admin is ready
    eventSystem.publish('admin:ready', { timestamp: new Date() });
  } catch (error) {
    console.error('Failed to initialize admin panel:', error);
    document.querySelector('.loading-content').innerHTML = `
            <div class="error-message">
                <h3>Failed to initialize admin panel</h3>
                <p>${error.message}</p>
                <button onclick="location.reload()" class="btn-primary">Retry</button>
            </div>
        `;
  }
}

/**
 * Register admin panel components with the component loader
 */
function registerComponents() {
  componentLoader.register('admin-dashboard', {
    selector: '#dashboard-content',
    init: initDashboard,
  });

  componentLoader.register('admin-users', {
    selector: '#users-content',
    init: initUsersManagement,
  });

  componentLoader.register('admin-contracts', {
    selector: '#contracts-content',
    init: initContractsManagement,
  });

  componentLoader.register('admin-system', {
    selector: '#system-content',
    init: initSystemConfig,
  });

  componentLoader.register('admin-security', {
    selector: '#security-content',
    init: initSecuritySettings,
  });

  componentLoader.register('admin-analytics', {
    selector: '#analytics-content',
    init: initAnalytics,
  });

  // Initialize the current page component
  componentLoader.initComponent(`admin-${currentPage}`);
}

/**
 * Setup event listeners for the admin panel UI
 */
function setupEventListeners() {
  // Navigation links
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();

      // Get the page ID from the href
      const pageId = this.getAttribute('href').substring(1);

      // Don't reload if already on this page
      if (pageId === currentPage) return;

      // Update active link
      document.querySelectorAll('.sidebar-nav li').forEach(item => {
        item.classList.remove('active');
      });
      this.parentNode.classList.add('active');

      // Show loading for page change
      showPageLoading();

      // Update current page
      currentPage = pageId;

      // Hide all content sections
      document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
      });

      // Show selected content section
      const targetSection = document.getElementById(`${pageId}-content`);
      if (targetSection) {
        setTimeout(() => {
          targetSection.style.display = 'block';

          // Initialize the component for this page
          componentLoader.initComponent(`admin-${pageId}`);

          // Update page header
          updatePageHeader(pageId);

          // Hide loading
          hidePageLoading();

          // Publish page change event
          eventSystem.publish('admin:pageChanged', { page: pageId });
        }, 300);
      }
    });
  });

  // Mobile sidebar toggle
  document.querySelector('.sidebar-toggle').addEventListener('click', () => {
    document.querySelector('.admin-container').classList.toggle('sidebar-collapsed');
  });

  // Notification bell
  document.querySelector('#notifications-btn').addEventListener('click', () => {
    showNotificationsModal();
  });

  // Settings button
  document.querySelector('#settings-btn').addEventListener('click', () => {
    showSettingsModal();
  });

  // Help button
  document.querySelector('#help-btn').addEventListener('click', () => {
    showHelpModal();
  });

  // Logout button
  document.querySelector('.logout-btn').addEventListener('click', () => {
    showLogoutConfirmation();
  });

  // Close any modal when clicking outside
  document.addEventListener('click', e => {
    const modals = document.querySelectorAll('.modal.show');
    modals.forEach(modal => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  // Close modal buttons
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', function () {
      const modal = this.closest('.modal');
      closeModal(modal);
    });
  });

  // Subscribe to window resize for responsive adjustments
  window.addEventListener('resize', handleResize);

  // Handle initial resize
  handleResize();

  // Set up ESC key to close modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const activeModal = document.querySelector('.modal.show');
      if (activeModal) {
        closeModal(activeModal);
      }
    }
  });
}

/**
 * Initialize the dashboard components
 */
function initDashboard() {
  console.log('Dashboard initialized');

  // Update stats
  updateDashboardStats();

  // Load recent activity
  loadRecentActivity();

  // Initialize dashboard charts
  initDashboardCharts();

  // Set up dashboard refresh interval
  const refreshInterval = setInterval(() => {
    updateDashboardStats();
    loadRecentActivity();
  }, 60000); // Refresh every minute

  // Clean up interval when navigating away
  eventSystem.subscribe('admin:pageChanged', data => {
    if (data.page !== 'dashboard') {
      clearInterval(refreshInterval);
    }
  });

  // Set up quick action buttons
  document.querySelectorAll('.action-card').forEach(card => {
    card.addEventListener('click', function () {
      const action = this.dataset.action;
      handleQuickAction(action);
    });
  });
}

/**
 * Initialize user management components
 */
function initUsersManagement() {
  console.log('Users Management initialized');

  // Load users data
  loadUsersData();

  // Set up user search
  const searchInput = document.querySelector('#user-search');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      filterUsers(this.value);
    });
  }

  // Set up user actions
  document.querySelectorAll('.user-action').forEach(btn => {
    btn.addEventListener('click', function () {
      const action = this.dataset.action;
      const userId = this.dataset.userid;
      handleUserAction(action, userId);
    });
  });

  // Add user button
  const addUserBtn = document.querySelector('#add-user-btn');
  if (addUserBtn) {
    addUserBtn.addEventListener('click', () => {
      showAddUserModal();
    });
  }
}

/**
 * Initialize contracts management components
 */
function initContractsManagement() {
  console.log('Contracts Management initialized');

  // Load contracts data
  loadContractsData();

  // Set up contract search
  const searchInput = document.querySelector('#contract-search');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      filterContracts(this.value);
    });
  }

  // Set up contract actions
  document.querySelectorAll('.contract-action').forEach(btn => {
    btn.addEventListener('click', function () {
      const action = this.dataset.action;
      const contractId = this.dataset.contractid;
      handleContractAction(action, contractId);
    });
  });

  // Add contract button
  const addContractBtn = document.querySelector('#add-contract-btn');
  if (addContractBtn) {
    addContractBtn.addEventListener('click', () => {
      showAddContractModal();
    });
  }
}

/**
 * Initialize system configuration components
 */
function initSystemConfig() {
  console.log('System Configuration initialized');

  // Load system settings
  loadSystemSettings();

  // Set up form submission
  const systemForm = document.querySelector('#system-settings-form');
  if (systemForm) {
    systemForm.addEventListener('submit', function (e) {
      e.preventDefault();
      saveSystemSettings(this);
    });
  }

  // Set up backup button
  const backupBtn = document.querySelector('#backup-system-btn');
  if (backupBtn) {
    backupBtn.addEventListener('click', () => {
      createSystemBackup();
    });
  }

  // Set up restore button
  const restoreBtn = document.querySelector('#restore-system-btn');
  if (restoreBtn) {
    restoreBtn.addEventListener('click', () => {
      showRestoreModal();
    });
  }
}

/**
 * Initialize security settings components
 */
function initSecuritySettings() {
  console.log('Security Settings initialized');

  // Load security settings
  loadSecuritySettings();

  // Set up form submission
  const securityForm = document.querySelector('#security-settings-form');
  if (securityForm) {
    securityForm.addEventListener('submit', function (e) {
      e.preventDefault();
      saveSecuritySettings(this);
    });
  }

  // Set up security scan button
  const scanBtn = document.querySelector('#security-scan-btn');
  if (scanBtn) {
    scanBtn.addEventListener('click', () => {
      runSecurityScan();
    });
  }
}

/**
 * Initialize analytics components
 */
function initAnalytics() {
  console.log('Analytics initialized');

  // Load analytics data
  loadAnalyticsData();

  // Initialize analytics charts
  initAnalyticsCharts();

  // Set up date range filters
  const dateFilters = document.querySelectorAll('.filter-btn');
  if (dateFilters) {
    dateFilters.forEach(btn => {
      btn.addEventListener('click', function () {
        // Remove active class from all buttons
        dateFilters.forEach(b => b.classList.remove('active'));

        // Add active class to clicked button
        this.classList.add('active');

        // Update analytics with selected date range
        const range = this.dataset.range;
        updateAnalyticsData(range);
      });
    });
  }

  // Set up export buttons
  const exportBtn = document.querySelector('#export-analytics-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportAnalyticsData();
    });
  }
}

/**
 * Update the page header based on the current page
 */
function updatePageHeader(pageId) {
  const pageHeaders = {
    dashboard: {
      title: 'Admin Dashboard',
      description: 'Overview of platform performance and key metrics',
    },
    users: {
      title: 'User Management',
      description: 'Manage user accounts, permissions, and activity',
    },
    contracts: {
      title: 'Forward Contracts',
      description: 'Manage and monitor blockchain contracts and transactions',
    },
    system: {
      title: 'System Configuration',
      description: 'Configure platform settings and operational parameters',
    },
    security: {
      title: 'Security Settings',
      description: 'Manage platform security, access controls, and audit logs',
    },
    analytics: {
      title: 'Analytics & Reports',
      description: 'View detailed analytics and generate performance reports',
    },
  };

  const header = pageHeaders[pageId] || {
    title: 'BitForward Admin',
    description: 'Advanced DeFi Platform Management',
  };

  const pageHeaderEl = document.querySelector('.page-header');
  if (pageHeaderEl) {
    pageHeaderEl.innerHTML = `
            <h1>${header.title}</h1>
            <p>${header.description}</p>
        `;
  }
}

/**
 * Handle window resize for responsive adjustments
 */
function handleResize() {
  const windowWidth = window.innerWidth;
  const adminContainer = document.querySelector('.admin-container');

  if (windowWidth < 992) {
    adminContainer.classList.add('sidebar-collapsed');
  } else {
    adminContainer.classList.remove('sidebar-collapsed');
  }
}

/**
 * Show loading screen
 */
function showLoadingScreen() {
  const loader = document.querySelector('.loading-spinner');
  if (loader) {
    loader.style.display = 'flex';
  }
}

/**
 * Hide loading screen
 */
function hideLoadingScreen() {
  const loader = document.querySelector('.loading-spinner');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
      loader.style.opacity = '1';
    }, 500);
  }
}

/**
 * Show page loading state
 */
function showPageLoading() {
  // Add loading class to main content
  document.querySelector('.admin-main').classList.add('loading');
}

/**
 * Hide page loading state
 */
function hidePageLoading() {
  // Remove loading class from main content
  document.querySelector('.admin-main').classList.remove('loading');
}

/**
 * Close a modal
 */
function closeModal(modal) {
  if (modal) {
    modal.classList.remove('show');
  }
}

/**
 * Show notifications modal
 */
function showNotificationsModal() {
  const modal = document.querySelector('#notifications-modal');
  if (modal) {
    modal.classList.add('show');

    // Reset notification count
    notificationCount = 0;
    updateNotificationBadge();
  }
}

/**
 * Show settings modal
 */
function showSettingsModal() {
  const modal = document.querySelector('#settings-modal');
  if (modal) {
    modal.classList.add('show');
  }
}

/**
 * Show help modal
 */
function showHelpModal() {
  const modal = document.querySelector('#help-modal');
  if (modal) {
    modal.classList.add('show');
  }
}

/**
 * Show logout confirmation
 */
function showLogoutConfirmation() {
  const modal = document.querySelector('#logout-modal');
  if (modal) {
    modal.classList.add('show');

    // Set up confirm button
    const confirmBtn = modal.querySelector('.confirm-logout');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        // Perform logout
        logout();
      });
    }
  }
}

/**
 * Logout the user
 */
function logout() {
  showLoadingScreen();

  // Simulate logout request
  setTimeout(() => {
    window.location.href = '../login.html';
  }, 1000);
}

/**
 * Update notification badge
 */
function updateNotificationBadge() {
  const badge = document.querySelector('#notifications-badge');
  if (badge) {
    if (notificationCount > 0) {
      badge.textContent = notificationCount > 9 ? '9+' : notificationCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

/**
 * Load user information
 */
function loadUserInfo() {
  // This would normally be loaded from an API
  adminUser = {
    id: 'admin-1',
    name: 'Alexandra Chen',
    role: 'System Administrator',
    avatar: '../assets/admin-avatar.png',
    permissions: ['full_access'],
  };

  // Update UI with user info
  const adminName = document.querySelector('.admin-name');
  const adminRole = document.querySelector('.admin-role');
  const adminAvatar = document.querySelector('.admin-avatar img');

  if (adminName) adminName.textContent = adminUser.name;
  if (adminRole) adminRole.textContent = adminUser.role;
  if (adminAvatar && adminUser.avatar) {
    adminAvatar.src = adminUser.avatar;
  }
}

/**
 * Update notification count and data
 */
function updateNotifications() {
  // This would normally come from an API or websocket
  notificationCount = 3;
  updateNotificationBadge();
}

/**
 * Check system status (mock)
 */
async function checkSystemStatus() {
  // This would normally be an API call
  return new Promise(resolve => {
    setTimeout(() => {
      systemStatus = {
        server: 'online',
        database: 'online',
        blockchain: 'online',
        api: 'online',
        contracts: 'online',
      };
      resolve(systemStatus);
    }, 500);
  });
}

/**
 * Update system health indicators
 */
function updateSystemHealth() {
  const healthItems = document.querySelectorAll('.health-item');

  healthItems.forEach(item => {
    const system = item.dataset.system;
    const status = systemStatus[system] || 'unknown';
    const icon = item.querySelector('.health-icon');
    const info = item.querySelector('.health-info p');

    // Clear all classes
    icon.classList.remove('green', 'yellow', 'red');

    if (status === 'online') {
      icon.classList.add('green');
      info.textContent = 'Running normally';
    } else if (status === 'degraded') {
      icon.classList.add('yellow');
      info.textContent = 'Performance issues';
    } else if (status === 'offline') {
      icon.classList.add('red');
      info.textContent = 'System offline';
    } else {
      icon.classList.add('yellow');
      info.textContent = 'Status unknown';
    }
  });
}

/**
 * Load mock data for the dashboard
 */
function loadMockData() {
  console.log('Loading mock data for demo purposes');
  // This function would normally pull real data from APIs
}

/**
 * Initialize charts and visualizations
 */
function initCharts() {
  // This would normally use a charting library like Chart.js
  console.log('Charts initialized with mock data');
}

/**
 * Initialize dashboard-specific charts
 */
function initDashboardCharts() {
  // This would normally use a charting library
  console.log('Dashboard charts initialized');
}

/**
 * Initialize analytics-specific charts
 */
function initAnalyticsCharts() {
  // This would normally use a charting library
  console.log('Analytics charts initialized');
}

/**
 * Update dashboard statistics
 */
function updateDashboardStats() {
  // Mock data - would normally come from API
  const stats = {
    users: {
      total: 1248,
      change: '+5.2%',
    },
    contracts: {
      total: 583,
      change: '+2.8%',
    },
    volume: {
      total: '$3.2M',
      change: '+12.5%',
    },
    revenue: {
      total: '$128.5K',
      change: '+8.7%',
    },
  };

  // Update the stat cards
  Object.keys(stats).forEach(key => {
    const card = document.querySelector(`[data-stat="${key}"]`);
    if (card) {
      const valueEl = card.querySelector('.stat-value');
      const changeEl = card.querySelector('.stat-change');

      if (valueEl) valueEl.textContent = stats[key].total;
      if (changeEl) {
        changeEl.textContent = stats[key].change;

        // Add appropriate class based on whether it's positive or negative
        changeEl.classList.remove('positive', 'negative');
        if (stats[key].change.startsWith('+')) {
          changeEl.classList.add('positive');
        } else if (stats[key].change.startsWith('-')) {
          changeEl.classList.add('negative');
        }
      }
    }
  });
}

/**
 * Load recent activity data
 */
function loadRecentActivity() {
  // Mock data - would normally come from API
  const activities = [
    {
      type: 'user',
      icon: 'user',
      iconClass: 'blue',
      text: 'New user registered: James Wilson',
      time: '5 minutes ago',
    },
    {
      type: 'contract',
      icon: 'file-contract',
      iconClass: 'purple',
      text: 'Forward contract #45782 was created',
      time: '12 minutes ago',
    },
    {
      type: 'transaction',
      icon: 'exchange-alt',
      iconClass: 'green',
      text: 'Transaction of 0.5 ETH completed',
      time: '25 minutes ago',
    },
    {
      type: 'alert',
      icon: 'exclamation-triangle',
      iconClass: 'yellow',
      text: 'System alert: High gas prices detected',
      time: '1 hour ago',
    },
  ];

  // Get the activity list container
  const activityList = document.querySelector('.activity-list');
  if (!activityList) return;

  // Clear current list
  // activityList.innerHTML = '';

  // Populate with new activities
  // This would be implemented in a real application
}

/**
 * Load users data for the users management page
 */
function loadUsersData() {
  // This would normally be an API call
  console.log('Loading users data');
  // Populate users table
}

/**
 * Load contracts data for the contracts management page
 */
function loadContractsData() {
  // This would normally be an API call
  console.log('Loading contracts data');
  // Populate contracts table
}

/**
 * Load system settings
 */
function loadSystemSettings() {
  // This would normally be an API call
  console.log('Loading system settings');
  // Populate settings form
}

/**
 * Load security settings
 */
function loadSecuritySettings() {
  // This would normally be an API call
  console.log('Loading security settings');
  // Populate security form
}

/**
 * Load analytics data
 */
function loadAnalyticsData() {
  // This would normally be an API call
  console.log('Loading analytics data');
  // Update analytics charts and tables
}

/**
 * Update analytics data based on date range
 */
function updateAnalyticsData(range) {
  console.log(`Updating analytics with range: ${range}`);
  // This would normally be an API call with the selected range
}

/**
 * Filter users based on search input
 */
function filterUsers(query) {
  console.log(`Filtering users with query: ${query}`);
  // Implement search logic
}

/**
 * Filter contracts based on search input
 */
function filterContracts(query) {
  console.log(`Filtering contracts with query: ${query}`);
  // Implement search logic
}

/**
 * Handle user actions (edit, delete, etc.)
 */
function handleUserAction(action, userId) {
  console.log(`User action: ${action} for user ${userId}`);
  // Implement user action logic
}

/**
 * Handle contract actions
 */
function handleContractAction(action, contractId) {
  console.log(`Contract action: ${action} for contract ${contractId}`);
  // Implement contract action logic
}

/**
 * Handle quick actions from dashboard
 */
function handleQuickAction(action) {
  console.log(`Quick action triggered: ${action}`);

  switch (action) {
    case 'new-user':
      showAddUserModal();
      break;
    case 'new-contract':
      showAddContractModal();
      break;
    case 'system-status':
      navigateTo('system');
      break;
    case 'generate-report':
      showReportModal();
      break;
    default:
      console.warn(`Unknown action: ${action}`);
  }
}

/**
 * Navigate to a specific page
 */
function navigateTo(pageId) {
  const navLink = document.querySelector(`.sidebar-nav a[href="#${pageId}"]`);
  if (navLink) {
    navLink.click();
  }
}

/**
 * Save system settings
 */
function saveSystemSettings(form) {
  // Gather form data
  const formData = new FormData(form);
  const settings = Object.fromEntries(formData.entries());

  console.log('Saving system settings:', settings);
  // This would normally be an API call

  // Show success message
  showToast('System settings saved successfully', 'success');
}

/**
 * Save security settings
 */
function saveSecuritySettings(form) {
  // Gather form data
  const formData = new FormData(form);
  const settings = Object.fromEntries(formData.entries());

  console.log('Saving security settings:', settings);
  // This would normally be an API call

  // Show success message
  showToast('Security settings saved successfully', 'success');
}

/**
 * Create system backup
 */
function createSystemBackup() {
  console.log('Creating system backup');
  // This would normally be an API call

  // Show progress modal
  const modal = document.createElement('div');
  modal.className = 'modal backup-modal show';
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Creating System Backup</h3>
                <button type="button" class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="progress-container">
                    <p>Creating backup of system data...</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <p class="progress-text">0%</p>
                </div>
            </div>
        </div>
    `;
  document.body.appendChild(modal);

  // Simulate backup progress
  let progress = 0;
  const progressFill = modal.querySelector('.progress-fill');
  const progressText = modal.querySelector('.progress-text');

  const progressInterval = setInterval(() => {
    progress += 5;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;

    if (progress >= 100) {
      clearInterval(progressInterval);

      // Update modal content
      modal.querySelector('.modal-body').innerHTML = `
                <div class="success-message">
                    <p>System backup created successfully!</p>
                    <p>Backup file: <strong>bitforward_backup_${new Date().toISOString().split('T')[0]}.zip</strong></p>
                    <button class="btn-primary download-backup">Download Backup</button>
                </div>
            `;

      // Add event listener to download button
      modal.querySelector('.download-backup').addEventListener('click', () => {
        // Simulate download
        showToast('Backup download started', 'success');
        closeModal(modal);
      });
    }
  }, 100);

  // Add event listener to close button
  modal.querySelector('.close-modal').addEventListener('click', () => {
    clearInterval(progressInterval);
    closeModal(modal);
    document.body.removeChild(modal);
  });
}

/**
 * Run security scan
 */
function runSecurityScan() {
  console.log('Running security scan');
  // This would normally be an API call

  // Show progress modal
  const modal = document.createElement('div');
  modal.className = 'modal security-scan-modal show';
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Security Scan in Progress</h3>
                <button type="button" class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="scan-progress">
                    <p>Scanning system for vulnerabilities...</p>
                    <div class="scan-animation">
                        <div class="scan-line"></div>
                    </div>
                    <p class="scan-status">Checking user authentication...</p>
                </div>
            </div>
        </div>
    `;
  document.body.appendChild(modal);

  // Simulate scan progress
  const scanSteps = [
    'Checking user authentication...',
    'Scanning API endpoints...',
    'Analyzing contract security...',
    'Checking for outdated dependencies...',
    'Validating access controls...',
    'Running penetration tests...',
    'Generating security report...',
  ];

  let currentStep = 0;
  const scanStatus = modal.querySelector('.scan-status');

  const scanInterval = setInterval(() => {
    scanStatus.textContent = scanSteps[currentStep];
    currentStep++;

    if (currentStep >= scanSteps.length) {
      clearInterval(scanInterval);

      // Update modal content
      modal.querySelector('.modal-body').innerHTML = `
                <div class="success-message">
                    <h4>Security Scan Complete</h4>
                    <p>The security scan found:</p>
                    <ul>
                        <li class="text-success">Authentication: <strong>Secure</strong></li>
                        <li class="text-success">API Endpoints: <strong>Protected</strong></li>
                        <li class="text-warning">Smart Contracts: <strong>1 Medium Risk Issue Found</strong></li>
                        <li class="text-warning">Dependencies: <strong>2 Updates Required</strong></li>
                        <li class="text-success">Access Controls: <strong>Properly Configured</strong></li>
                    </ul>
                    <button class="btn-primary view-security-report">View Full Report</button>
                </div>
            `;

      // Add event listener to report button
      modal.querySelector('.view-security-report').addEventListener('click', () => {
        closeModal(modal);
        document.body.removeChild(modal);
        // Navigate to security report page or show report modal
        navigateTo('security');
        showToast('Security report generated', 'success');
      });
    }
  }, 800);

  // Add event listener to close button
  modal.querySelector('.close-modal').addEventListener('click', () => {
    clearInterval(scanInterval);
    closeModal(modal);
    document.body.removeChild(modal);
  });
}

/**
 * Export analytics data
 */
function exportAnalyticsData() {
  console.log('Exporting analytics data');
  // This would normally be an API call

  // Show export options modal
  const modal = document.createElement('div');
  modal.className = 'modal export-modal show';
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Export Analytics Data</h3>
                <button type="button" class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="export-form">
                    <div class="form-group">
                        <label>Export Format</label>
                        <select class="form-control">
                            <option value="csv">CSV</option>
                            <option value="json">JSON</option>
                            <option value="pdf">PDF Report</option>
                            <option value="excel">Excel</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Date Range</label>
                        <select class="form-control">
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                            <option value="ytd">Year to Date</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Data to Include</label>
                        <div class="checkbox-group">
                            <label>
                                <input type="checkbox" checked> User Statistics
                            </label>
                            <label>
                                <input type="checkbox" checked> Contract Activity
                            </label>
                            <label>
                                <input type="checkbox" checked> Financial Metrics
                            </label>
                            <label>
                                <input type="checkbox"> System Performance
                            </label>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="closeModal(this.closest('.modal'))">Cancel</button>
                <button type="button" class="btn-primary" id="confirm-export">Export</button>
            </div>
        </div>
    `;
  document.body.appendChild(modal);

  // Add event listeners
  modal.querySelector('#confirm-export').addEventListener('click', () => {
    showToast('Analytics export started', 'success');
    closeModal(modal);

    // Simulate download after a short delay
    setTimeout(() => {
      showToast('Analytics export completed', 'success');
    }, 2000);
  });

  modal.querySelector('.close-modal').addEventListener('click', () => {
    closeModal(modal);
    document.body.removeChild(modal);
  });
}

/**
 * Show a toast notification
 */
function showToast(message, type = 'info') {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-message">${message}</span>
        </div>
    `;

  // Add to the document
  const toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    const newContainer = document.createElement('div');
    newContainer.className = 'toast-container';
    document.body.appendChild(newContainer);
    newContainer.appendChild(toast);
  } else {
    toastContainer.appendChild(toast);
  }

  // Auto remove after delay
  setTimeout(() => {
    toast.classList.add('toast-hiding');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

/**
 * Show add user modal
 */
function showAddUserModal() {
  const modal = document.createElement('div');
  modal.className = 'modal add-user-modal show';
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Add New User</h3>
                <button type="button" class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="add-user-form">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email Address</label>
                        <input type="email" id="email" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="role">Role</label>
                        <select id="role" class="form-control">
                            <option value="user">Standard User</option>
                            <option value="admin">Administrator</option>
                            <option value="analyst">Financial Analyst</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="password">Initial Password</label>
                        <input type="password" id="password" class="form-control" required>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="closeModal(this.closest('.modal'))">Cancel</button>
                <button type="button" class="btn-primary" id="save-user">Create User</button>
            </div>
        </div>
    `;
  document.body.appendChild(modal);

  // Add event listeners
  modal.querySelector('#save-user').addEventListener('click', () => {
    // Implement user creation logic
    showToast('User created successfully', 'success');
    closeModal(modal);
    document.body.removeChild(modal);

    // Refresh users list
    if (currentPage === 'users') {
      loadUsersData();
    }
  });

  modal.querySelector('.close-modal').addEventListener('click', () => {
    closeModal(modal);
    document.body.removeChild(modal);
  });
}

/**
 * Show add contract modal
 */
function showAddContractModal() {
  const modal = document.createElement('div');
  modal.className = 'modal add-contract-modal show';
  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Create New Forward Contract</h3>
                <button type="button" class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="add-contract-form">
                    <div class="form-group">
                        <label for="contract-type">Contract Type</label>
                        <select id="contract-type" class="form-control">
                            <option value="standard">Standard Forward</option>
                            <option value="leveraged">Leveraged Forward</option>
                            <option value="basket">Basket Forward</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="contract-asset">Asset</label>
                        <select id="contract-asset" class="form-control">
                            <option value="eth">Ethereum (ETH)</option>
                            <option value="btc">Bitcoin (BTC)</option>
                            <option value="sol">Solana (SOL)</option>
                            <option value="usdc">USD Coin (USDC)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="contract-amount">Amount</label>
                        <input type="number" id="contract-amount" class="form-control" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="contract-maturity">Maturity Date</label>
                        <input type="date" id="contract-maturity" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label for="contract-strike">Strike Price</label>
                        <input type="number" id="contract-strike" class="form-control" step="0.01" required>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="closeModal(this.closest('.modal'))">Cancel</button>
                <button type="button" class="btn-primary" id="create-contract">Create Contract</button>
            </div>
        </div>
    `;
  document.body.appendChild(modal);

  // Add event listeners
  modal.querySelector('#create-contract').addEventListener('click', () => {
    // Implement contract creation logic
    showToast('Contract created successfully', 'success');
    closeModal(modal);
    document.body.removeChild(modal);

    // Refresh contracts list
    if (currentPage === 'contracts') {
      loadContractsData();
    }
  });

  modal.querySelector('.close-modal').addEventListener('click', () => {
    closeModal(modal);
    document.body.removeChild(modal);
  });
}

/**
 * Subscribe to blockchain events
 */
function subscribeToBlockchainEvents() {
  // This would normally use web3 or similar library
  console.log('Subscribed to blockchain events');

  // Mock event handler
  setTimeout(() => {
    // Simulate receiving a blockchain event
    handleBlockchainEvent({
      type: 'contract_created',
      data: {
        contractId: 'fwd_' + Math.floor(Math.random() * 10000),
        timestamp: new Date().toISOString(),
      },
    });
  }, 10000);
}

/**
 * Handle blockchain event
 */
function handleBlockchainEvent(event) {
  console.log('Blockchain event received:', event);

  // Add notification for the event
  notificationCount++;
  updateNotificationBadge();

  // Show toast notification
  if (event.type === 'contract_created') {
    showToast(`New forward contract created: ${event.data.contractId}`, 'info');
  }
}

// Export the admin panel API for external use
window.AdminPanel = {
  init: initAdminPanel,
  navigateTo,
  showToast,
};

// For development/testing - Initialize the admin panel automatically
// In production, this would be triggered by a proper initialization flow
document.addEventListener('DOMContentLoaded', initAdminPanel);
