/**
 * BitForward Lending Platf    init() {
        console.log('🚀 Inicializando BiT Lending Platform...');
        
        // Verificar autenticación
        if (!this.isUserAuthenticated()) {
            this.showAuthRequired();
            return;
        }
        
        this.setupEventListeners();
        this.updateSummary();
        console.log('✅ Plataforma de préstamos lista');
    }t
 * Sistema de préstamos con colateral
 */

class BitForwardLending {
  constructor() {
    this.selectedCollateral = null;
    this.selectedTerm = null;
    this.loanAmount = 0;
    this.currentLTV = 0;
    this.maxLTV = 0;

    // Datos de mercado simulados
    this.marketData = {
      BTC: { price: 67234.56, ltv: 80, liquidationThreshold: 85 },
      ETH: { price: 3456.78, ltv: 75, liquidationThreshold: 80 },
      SOL: { price: 156.78, ltv: 70, liquidationThreshold: 75 },
    };

    // Términos de préstamo
    this.loanTerms = {
      30: { apr: 3.5, label: '30 días' },
      90: { apr: 4.2, label: '90 días' },
      180: { apr: 5.8, label: '6 meses' },
      365: { apr: 7.5, label: '1 año' },
    };

    this.init();
  }

  init() {
    console.log('💰 Inicializando BitForward Lending Platform...');

    // Verificar autenticación
    if (!this.isUserAuthenticated()) {
      this.showAuthRequired();
      return;
    }

    this.setupEventListeners();
    this.updateSummary();
    console.log('✅ Plataforma de préstamos lista');
  }

  setupEventListeners() {
    // Selección de colateral
    document.querySelectorAll('.bf-collateral-option').forEach(option => {
      option.addEventListener('click', this.handleCollateralSelection.bind(this));
    });

    // Términos del préstamo
    document.querySelectorAll('.bf-term-option').forEach(option => {
      option.addEventListener('click', this.handleTermSelection.bind(this));
    });

    // Input de monto
    const loanAmountInput = document.getElementById('loanAmount');
    if (loanAmountInput) {
      loanAmountInput.addEventListener('input', this.handleAmountChange.bind(this));
    }

    // Slider LTV
    const ltvSlider = document.getElementById('ltvSlider');
    if (ltvSlider) {
      ltvSlider.addEventListener('input', this.handleLTVChange.bind(this));
    }

    // Checkbox de términos
    const agreeTerms = document.getElementById('agreeTerms');
    if (agreeTerms) {
      agreeTerms.addEventListener('change', this.handleTermsAgreement.bind(this));
    }

    // Botón de solicitar préstamo
    const requestBtn = document.getElementById('requestLoanBtn');
    if (requestBtn) {
      requestBtn.addEventListener('click', this.handleLoanRequest.bind(this));
    }
  }

  handleCollateralSelection(event) {
    const option = event.currentTarget;
    const asset = option.getAttribute('data-asset');

    // Remover selección anterior
    document.querySelectorAll('.bf-collateral-option').forEach(opt => {
      opt.classList.remove('selected');
    });

    // Seleccionar nueva opción
    option.classList.add('selected');
    this.selectedCollateral = asset;
    this.maxLTV = this.marketData[asset].ltv;

    // Actualizar slider máximo
    const ltvSlider = document.getElementById('ltvSlider');
    if (ltvSlider) {
      ltvSlider.max = this.maxLTV;
      ltvSlider.value = 0;
      this.currentLTV = 0;
    }

    // Limpiar monto del préstamo
    this.loanAmount = 0;
    const loanAmountInput = document.getElementById('loanAmount');
    if (loanAmountInput) {
      loanAmountInput.value = '';
    }

    this.updateSummary();
    this.showNotification(`Colateral ${asset} seleccionado`, 'success');
  }

  handleTermSelection(event) {
    const option = event.currentTarget;
    const duration = parseInt(option.getAttribute('data-duration'));

    // Remover selección anterior
    document.querySelectorAll('.bf-term-option').forEach(opt => {
      opt.classList.remove('selected');
    });

    // Seleccionar nueva opción
    option.classList.add('selected');
    this.selectedTerm = duration;

    this.updateSummary();
    this.showNotification(`Término de ${this.loanTerms[duration].label} seleccionado`, 'success');
  }

  handleAmountChange(event) {
    const value = parseFloat(event.target.value) || 0;
    this.loanAmount = value;

    // Calcular LTV basado en el monto
    if (this.selectedCollateral && value > 0) {
      const collateralValue = this.getCollateralValue();
      const newLTV = (value / collateralValue) * 100;

      if (newLTV <= this.maxLTV) {
        this.currentLTV = newLTV;
        const ltvSlider = document.getElementById('ltvSlider');
        if (ltvSlider) {
          ltvSlider.value = newLTV;
        }
      } else {
        // Limitar al LTV máximo
        const maxAmount = (collateralValue * this.maxLTV) / 100;
        event.target.value = maxAmount.toFixed(2);
        this.loanAmount = maxAmount;
        this.currentLTV = this.maxLTV;
      }
    }

    this.updateSummary();
  }

  handleLTVChange(event) {
    const ltv = parseFloat(event.target.value);
    this.currentLTV = ltv;

    // Actualizar monto basado en LTV
    if (this.selectedCollateral) {
      const collateralValue = this.getCollateralValue();
      const newAmount = (collateralValue * ltv) / 100;
      this.loanAmount = newAmount;

      const loanAmountInput = document.getElementById('loanAmount');
      if (loanAmountInput) {
        loanAmountInput.value = newAmount.toFixed(2);
      }
    }

    // Actualizar etiqueta del slider
    const currentLTVLabel = document.getElementById('currentLTV');
    if (currentLTVLabel) {
      currentLTVLabel.textContent = `${ltv.toFixed(1)}%`;
    }

    this.updateSummary();
  }

  handleTermsAgreement(event) {
    const agreed = event.target.checked;
    const requestBtn = document.getElementById('requestLoanBtn');

    if (requestBtn) {
      requestBtn.disabled = !agreed || !this.canRequestLoan();
    }
  }

  handleLoanRequest() {
    if (!this.canRequestLoan()) {
      this.showNotification('Complete todos los campos requeridos', 'warning');
      return;
    }

    if (!this.isUserAuthenticated()) {
      this.showNotification('Debes iniciar sesión para solicitar un préstamo', 'warning');
      if (window.BitForwardAuth) {
        window.BitForwardAuth.openModal('login-modal');
      }
      return;
    }

    const loanData = {
      collateral: this.selectedCollateral,
      collateralValue: this.getCollateralValue(),
      loanAmount: this.loanAmount,
      ltv: this.currentLTV,
      term: this.selectedTerm,
      apr: this.loanTerms[this.selectedTerm].apr,
      totalRepayment: this.calculateTotalRepayment(),
      totalInterest: this.calculateTotalInterest(),
      user: this.getCurrentUser(),
    };

    console.log('📋 Solicitud de préstamo:', loanData);
    this.showNotification('Procesando solicitud de préstamo...', 'info');

    // Simular procesamiento con backend
    this.submitLoanRequest(loanData);
  }

  getCollateralValue() {
    if (!this.selectedCollateral) return 0;

    // Simular balance del usuario
    const balances = {
      BTC: 2.45,
      ETH: 15.8,
      SOL: 125.5,
    };

    const balance = balances[this.selectedCollateral];
    const price = this.marketData[this.selectedCollateral].price;

    return balance * price;
  }

  calculateTotalRepayment() {
    if (!this.selectedTerm || this.loanAmount === 0) return 0;

    const apr = this.loanTerms[this.selectedTerm].apr / 100;
    const days = this.selectedTerm;
    const dailyRate = apr / 365;
    const interest = this.loanAmount * dailyRate * days;

    return this.loanAmount + interest;
  }

  calculateTotalInterest() {
    return this.calculateTotalRepayment() - this.loanAmount;
  }

  calculateLoanHealth() {
    if (this.currentLTV === 0) return 100;

    const liquidationThreshold = this.selectedCollateral
      ? this.marketData[this.selectedCollateral].liquidationThreshold
      : 85;

    // Salud = (liquidationThreshold - currentLTV) / liquidationThreshold * 100
    const health = Math.max(
      0,
      ((liquidationThreshold - this.currentLTV) / liquidationThreshold) * 100
    );
    return health;
  }

  getHealthStatus(health) {
    if (health > 80) return { text: 'Muy Seguro', color: 'var(--bf-success)' };
    if (health > 60) return { text: 'Seguro', color: 'var(--bf-success)' };
    if (health > 40) return { text: 'Moderado', color: 'var(--bf-warning)' };
    if (health > 20) return { text: 'Riesgoso', color: 'var(--bf-error)' };
    return { text: 'Crítico', color: 'var(--bf-error)' };
  }

  updateSummary() {
    // Actualizar colateral seleccionado
    const selectedCollateralEl = document.getElementById('selectedCollateral');
    if (selectedCollateralEl) {
      selectedCollateralEl.textContent = this.selectedCollateral || '-';
    }

    // Actualizar valor del colateral
    const collateralValueEl = document.getElementById('collateralValue');
    if (collateralValueEl) {
      const value = this.getCollateralValue();
      collateralValueEl.textContent = `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }

    // Actualizar monto del préstamo
    const loanAmountSummaryEl = document.getElementById('loanAmountSummary');
    if (loanAmountSummaryEl) {
      loanAmountSummaryEl.textContent = `$${this.loanAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }

    // Actualizar LTV ratio
    const ltvRatioEl = document.getElementById('ltvRatio');
    if (ltvRatioEl) {
      ltvRatioEl.textContent = `${this.currentLTV.toFixed(1)}%`;
    }

    // Actualizar tasa de interés
    const interestRateEl = document.getElementById('interestRate');
    if (interestRateEl) {
      const rate = this.selectedTerm ? this.loanTerms[this.selectedTerm].apr : 0;
      interestRateEl.textContent = `${rate}%`;
    }

    // Actualizar duración
    const loanDurationEl = document.getElementById('loanDuration');
    if (loanDurationEl) {
      const duration = this.selectedTerm ? this.loanTerms[this.selectedTerm].label : '-';
      loanDurationEl.textContent = duration;
    }

    // Actualizar total a repagar
    const totalRepaymentEl = document.getElementById('totalRepayment');
    if (totalRepaymentEl) {
      const total = this.calculateTotalRepayment();
      totalRepaymentEl.textContent = `$${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }

    // Actualizar interés total
    const totalInterestEl = document.getElementById('totalInterest');
    if (totalInterestEl) {
      const interest = this.calculateTotalInterest();
      totalInterestEl.textContent = `$${interest.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    }

    // Actualizar salud del préstamo
    this.updateLoanHealth();

    // Actualizar estado del botón
    this.updateRequestButton();
  }

  updateLoanHealth() {
    const health = this.calculateLoanHealth();
    const healthStatus = this.getHealthStatus(health);

    // Actualizar barra de salud
    const healthBar = document.getElementById('healthBar');
    if (healthBar) {
      healthBar.style.width = `${health}%`;
    }

    // Actualizar texto de estado
    const healthStatusEl = document.getElementById('healthStatus');
    if (healthStatusEl) {
      healthStatusEl.textContent = healthStatus.text;
      healthStatusEl.style.color = healthStatus.color;
    }
  }

  updateRequestButton() {
    const requestBtn = document.getElementById('requestLoanBtn');
    const agreeTerms = document.getElementById('agreeTerms');

    if (requestBtn) {
      const canRequest = this.canRequestLoan() && agreeTerms?.checked;
      requestBtn.disabled = !canRequest;
    }
  }

  canRequestLoan() {
    return (
      this.selectedCollateral &&
      this.selectedTerm &&
      this.loanAmount > 0 &&
      this.currentLTV > 0 &&
      this.currentLTV <= this.maxLTV
    );
  }

  resetForm() {
    // Reset state
    this.selectedCollateral = null;
    this.selectedTerm = null;
    this.loanAmount = 0;
    this.currentLTV = 0;
    this.maxLTV = 0;

    // Reset UI
    document.querySelectorAll('.bf-collateral-option').forEach(opt => {
      opt.classList.remove('selected');
    });

    document.querySelectorAll('.bf-term-option').forEach(opt => {
      opt.classList.remove('selected');
    });

    const loanAmountInput = document.getElementById('loanAmount');
    if (loanAmountInput) {
      loanAmountInput.value = '';
    }

    const ltvSlider = document.getElementById('ltvSlider');
    if (ltvSlider) {
      ltvSlider.value = 0;
    }

    const agreeTerms = document.getElementById('agreeTerms');
    if (agreeTerms) {
      agreeTerms.checked = false;
    }

    this.updateSummary();
  }

  showNotification(message, type = 'info') {
    // Crear notificación toast
    const notification = document.createElement('div');
    notification.className = `bf-notification bf-notification-${type}`;
    notification.innerHTML = `
            <div class="bf-notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

    // Estilos para la notificación
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '16px 24px',
      borderRadius: '12px',
      backgroundColor: this.getNotificationColor(type),
      color: 'white',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      zIndex: '9999',
      transform: 'translateX(100%)',
      transition: 'transform 0.3s ease',
    });

    document.body.appendChild(notification);

    // Animar entrada
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(0)';
    });

    // Auto-remover después de 3 segundos
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  getNotificationIcon(type) {
    const icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle',
    };
    return icons[type] || 'info-circle';
  }

  getNotificationColor(type) {
    const colors = {
      success: '#00d4aa',
      error: '#e84393',
      warning: '#fdcb6e',
      info: '#74b9ff',
    };
    return colors[type] || '#74b9ff';
  }

  // Verificar autenticación
  isUserAuthenticated() {
    return window.BitForwardAuth && window.BitForwardAuth.isAuthenticated();
  }

  // Obtener usuario actual
  getCurrentUser() {
    return window.BitForwardAuth ? window.BitForwardAuth.getCurrentUser() : null;
  }

  // Mostrar mensaje de autenticación requerida
  showAuthRequired() {
    const calculator = document.querySelector('.bf-loan-calculator');
    if (calculator) {
      calculator.innerHTML = `
                <div class="bf-auth-required">
                    <div class="bf-auth-required-content">
                        <div class="bf-auth-icon">
                            <i class="fas fa-lock"></i>
                        </div>
                        <h3>Autenticación Requerida</h3>
                        <p>Para acceder a la plataforma de préstamos, necesitas iniciar sesión o crear una cuenta.</p>
                        <div class="bf-auth-actions">
                            <button class="bf-btn bf-btn-primary" id="auth-login-btn">
                                <i class="fas fa-sign-in-alt"></i>
                                Iniciar Sesión
                            </button>
                            <button class="bf-btn bf-btn-secondary" id="auth-register-btn">
                                <i class="fas fa-user-plus"></i>
                                Crear Cuenta
                            </button>
                        </div>
                    </div>
                </div>
            `;

      // Configurar event listeners para los botones de auth
      const loginBtn = document.getElementById('auth-login-btn');
      const registerBtn = document.getElementById('auth-register-btn');

      if (loginBtn && window.BitForwardAuth) {
        loginBtn.addEventListener('click', () => {
          window.BitForwardAuth.openModal('login-modal');
        });
      }

      if (registerBtn && window.BitForwardAuth) {
        registerBtn.addEventListener('click', () => {
          window.BitForwardAuth.openModal('register-modal');
        });
      }
    }
  }

  // Procesar solicitud de préstamo con el backend
  async submitLoanRequest(loanData) {
    try {
      if (window.BitForwardAuth) {
        const response = await window.BitForwardAuth.authenticatedRequest(
          `${window.BitForwardAuth.apiUrl}/loans/request`,
          {
            method: 'POST',
            body: JSON.stringify(loanData),
          }
        );

        if (response.ok) {
          const result = await response.json();
          this.showNotification('¡Préstamo aprobado! Revisa tu dashboard.', 'success');
          this.resetForm();
        } else {
          throw new Error('Error procesando la solicitud');
        }
      } else {
        // Fallback para simulación
        setTimeout(() => {
          this.showNotification('¡Préstamo aprobado! Revisa tu dashboard.', 'success');
          this.resetForm();
        }, 2000);
      }
    } catch (error) {
      console.error('Error en solicitud de préstamo:', error);
      this.showNotification('Error procesando la solicitud. Intenta nuevamente.', 'error');
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  if (window.location.pathname.includes('lending.html')) {
    window.BitForwardLending = new BitForwardLending();
  }
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BitForwardLending;
}
