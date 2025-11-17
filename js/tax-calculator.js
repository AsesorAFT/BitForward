/**
 * BitForward Tax Calculator
 * Simple tool to estimate taxes on crypto transactions
 */

class TaxCalculator {
  constructor() {
    this.countries = {
      'AR': {
        name: 'Argentina',
        shortTermRate: 15,
        longTermRate: 10,
        thresholds: {
          exempt: 100000, // ARS equivalent
          low: 1000000,   // ARS equivalent
          high: 10000000  // ARS equivalent
        },
        longTermMonths: 12,
        currency: 'ARS'
      },
      'ES': {
        name: 'España',
        shortTermRate: 26,
        longTermRate: 24,
        thresholds: {
          exempt: 1000,    // EUR
          low: 6000,       // EUR
          medium: 50000,   // EUR
          high: 300000     // EUR
        },
        rates: {
          low: 19,
          medium: 21,
          high: 23,
          veryHigh: 26
        },
        longTermMonths: 12,
        currency: 'EUR'
      },
      'MX': {
        name: 'México',
        shortTermRate: 30,
        longTermRate: 10,
        longTermMonths: 12,
        currency: 'MXN'
      },
      'US': {
        name: 'Estados Unidos',
        shortTermRate: 37,
        longTermRate: 20,
        longTermMonths: 12,
        currency: 'USD'
      },
      'CO': {
        name: 'Colombia',
        shortTermRate: 10,
        longTermRate: 0,
        thresholds: {
          exempt: 38400000 // COP (approx 38.4M COP)
        },
        longTermMonths: 24,
        currency: 'COP'
      },
      'CL': {
        name: 'Chile',
        shortTermRate: 27,
        longTermRate: 27,
        currency: 'CLP'
      },
      'PE': {
        name: 'Perú',
        shortTermRate: 30,
        longTermRate: 5,
        longTermMonths: 12,
        currency: 'PEN'
      },
    };

    // Default values
    this.selectedCountry = 'AR';
    this.purchaseAmount = 0;
    this.saleAmount = 0;
    this.purchaseDate = new Date();
    this.saleDate = new Date();
    this.currency = 'USD';

    // Exchange rates (simulated for this example)
    this.exchangeRates = {
      'USD': 1,
      'ARS': 900,
      'EUR': 0.92,
      'MXN': 17.05,
      'COP': 3900,
      'CLP': 880,
      'PEN': 3.70
    };

    this.init();
  }

  init() {
    this.renderCalculator();
    this.setupEventListeners();
  }

  renderCalculator() {
    // Create calculator modal if it doesn't exist
    if (!document.getElementById('tax-calculator-modal')) {
      const modal = document.createElement('div');
      modal.id = 'tax-calculator-modal';
      modal.className = 'modal';
      modal.innerHTML = `
                <div class="modal-content tax-calculator">
                    <div class="modal-header">
                        <h3>Calculadora de Impuestos Crypto</h3>
                        <button class="modal-close"><i class="fas fa-times"></i></button>
                    </div>
                    <div class="modal-body">
                        <div class="tax-form">
                            <div class="form-group">
                                <label for="tax-country">País de Residencia Fiscal</label>
                                <select id="tax-country" class="form-control">
                                    ${Object.entries(this.countries).map(([code, country]) =>
    `<option value="${code}">${country.name}</option>`
  ).join('')}
                                </select>
                                <small class="form-text text-muted">La legislación varía según el país</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="tax-currency">Moneda de Cálculo</label>
                                <select id="tax-currency" class="form-control">
                                    <option value="USD">USD - Dólar Estadounidense</option>
                                    <option value="EUR">EUR - Euro</option>
                                    <option value="ARS">ARS - Peso Argentino</option>
                                    <option value="MXN">MXN - Peso Mexicano</option>
                                    <option value="COP">COP - Peso Colombiano</option>
                                    <option value="CLP">CLP - Peso Chileno</option>
                                    <option value="PEN">PEN - Sol Peruano</option>
                                </select>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="tax-purchase-amount">Monto de Compra</label>
                                    <div class="input-group">
                                        <span class="input-group-text" id="purchase-currency">$</span>
                                        <input type="number" id="tax-purchase-amount" class="form-control" step="0.01" min="0">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="tax-purchase-date">Fecha de Compra</label>
                                    <input type="date" id="tax-purchase-date" class="form-control">
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="tax-sale-amount">Monto de Venta</label>
                                    <div class="input-group">
                                        <span class="input-group-text" id="sale-currency">$</span>
                                        <input type="number" id="tax-sale-amount" class="form-control" step="0.01" min="0">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="tax-sale-date">Fecha de Venta</label>
                                    <input type="date" id="tax-sale-date" class="form-control">
                                </div>
                            </div>
                            
                            <button id="calculate-tax-btn" class="btn btn-primary w-100">Calcular Impuesto</button>
                        </div>
                        
                        <div id="tax-results" class="tax-results hidden">
                            <h4>Resultados del Cálculo</h4>
                            <div class="results-grid">
                                <div class="result-item">
                                    <div class="result-label">Ganancia/Pérdida</div>
                                    <div id="result-profit-loss" class="result-value">$0.00</div>
                                </div>
                                <div class="result-item">
                                    <div class="result-label">Tipo de Ganancia</div>
                                    <div id="result-term-type" class="result-value">Corto Plazo</div>
                                </div>
                                <div class="result-item">
                                    <div class="result-label">Tasa Impositiva</div>
                                    <div id="result-tax-rate" class="result-value">0%</div>
                                </div>
                                <div class="result-item highlight">
                                    <div class="result-label">Impuesto Estimado</div>
                                    <div id="result-tax-amount" class="result-value">$0.00</div>
                                </div>
                                <div class="result-item">
                                    <div class="result-label">Ganancia Neta</div>
                                    <div id="result-net-profit" class="result-value">$0.00</div>
                                </div>
                            </div>
                            
                            <div class="tax-disclaimer">
                                <i class="fas fa-info-circle"></i>
                                <small>Esta es una estimación simple. Las leyes fiscales varían por país y los cálculos exactos pueden requerir consideraciones adicionales. Consulte con un profesional fiscal para asesoramiento específico.</small>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" id="tax-reset-btn">Limpiar</button>
                        <button class="btn btn-primary" id="tax-save-btn">Guardar PDF</button>
                    </div>
                </div>
            `;

      document.body.appendChild(modal);

      // Set today as the default sale date
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('tax-sale-date').value = today;

      // Set default purchase date as 1 year ago
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      document.getElementById('tax-purchase-date').value = lastYear.toISOString().split('T')[0];
    }
  }

  setupEventListeners() {
    // Close modal
    document.querySelector('#tax-calculator-modal .modal-close')?.addEventListener('click', () => {
      this.hideCalculator();
    });

    // Calculate button
    document.getElementById('calculate-tax-btn')?.addEventListener('click', () => {
      this.calculateTax();
    });

    // Reset button
    document.getElementById('tax-reset-btn')?.addEventListener('click', () => {
      this.resetCalculator();
    });

    // Save PDF button
    document.getElementById('tax-save-btn')?.addEventListener('click', () => {
      this.savePDF();
    });

    // Country change
    document.getElementById('tax-country')?.addEventListener('change', (e) => {
      this.selectedCountry = e.target.value;
      // Update currency to match country
      const countryCurrency = this.countries[this.selectedCountry].currency;
      document.getElementById('tax-currency').value = countryCurrency;
      this.updateCurrencySymbols(countryCurrency);
    });

    // Currency change
    document.getElementById('tax-currency')?.addEventListener('change', (e) => {
      this.updateCurrencySymbols(e.target.value);
    });
  }

  showCalculator() {
    const modal = document.getElementById('tax-calculator-modal');
    if (modal) {
      modal.classList.add('open');
    }
  }

  hideCalculator() {
    const modal = document.getElementById('tax-calculator-modal');
    if (modal) {
      modal.classList.remove('open');
    }
  }

  resetCalculator() {
    // Reset form inputs
    document.getElementById('tax-purchase-amount').value = '';
    document.getElementById('tax-sale-amount').value = '';

    // Reset dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tax-sale-date').value = today;

    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    document.getElementById('tax-purchase-date').value = lastYear.toISOString().split('T')[0];

    // Hide results
    document.getElementById('tax-results').classList.add('hidden');
  }

  calculateTax() {
    // Get input values
    const purchaseAmount = parseFloat(document.getElementById('tax-purchase-amount').value) || 0;
    const saleAmount = parseFloat(document.getElementById('tax-sale-amount').value) || 0;
    const purchaseDate = new Date(document.getElementById('tax-purchase-date').value);
    const saleDate = new Date(document.getElementById('tax-sale-date').value);
    const currency = document.getElementById('tax-currency').value;

    // Validate inputs
    if (purchaseAmount <= 0 || saleAmount <= 0) {
      this.showError('Por favor ingrese montos válidos para la compra y venta.');
      return;
    }

    if (isNaN(purchaseDate) || isNaN(saleDate)) {
      this.showError('Por favor ingrese fechas válidas.');
      return;
    }

    if (saleDate < purchaseDate) {
      this.showError('La fecha de venta debe ser posterior a la fecha de compra.');
      return;
    }

    // Calculate holding period in months
    const holdingPeriodMs = saleDate - purchaseDate;
    const holdingPeriodMonths = holdingPeriodMs / (1000 * 60 * 60 * 24 * 30.44);

    // Get country tax rules
    const countryRules = this.countries[this.selectedCountry];

    // Determine if short or long term
    const isLongTerm = holdingPeriodMonths >= countryRules.longTermMonths;

    // Calculate profit/loss
    const profitLoss = saleAmount - purchaseAmount;

    // Determine tax rate based on term
    const taxRate = isLongTerm ? countryRules.longTermRate : countryRules.shortTermRate;

    // Calculate tax amount (simplified)
    let taxAmount = 0;
    if (profitLoss > 0) {
      // Only tax positive gains
      taxAmount = profitLoss * (taxRate / 100);
    }

    // Calculate net profit
    const netProfit = profitLoss - taxAmount;

    // Format currency
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency
    });

    // Update results
    document.getElementById('result-profit-loss').textContent = formatter.format(profitLoss);
    document.getElementById('result-profit-loss').classList.toggle('positive', profitLoss > 0);
    document.getElementById('result-profit-loss').classList.toggle('negative', profitLoss < 0);

    document.getElementById('result-term-type').textContent = isLongTerm ? 'Largo Plazo' : 'Corto Plazo';
    document.getElementById('result-tax-rate').textContent = `${taxRate}%`;
    document.getElementById('result-tax-amount').textContent = formatter.format(taxAmount);
    document.getElementById('result-net-profit').textContent = formatter.format(netProfit);
    document.getElementById('result-net-profit').classList.toggle('positive', netProfit > 0);
    document.getElementById('result-net-profit').classList.toggle('negative', netProfit < 0);

    // Show results
    document.getElementById('tax-results').classList.remove('hidden');
  }

  updateCurrencySymbols(currencyCode) {
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'ARS': '$',
      'MXN': '$',
      'COP': '$',
      'CLP': '$',
      'PEN': 'S/'
    };

    const symbol = symbols[currencyCode] || '$';
    document.getElementById('purchase-currency').textContent = symbol;
    document.getElementById('sale-currency').textContent = symbol;
    this.currency = currencyCode;
  }

  showError(message) {
    // Create toast notification
    if (window.bitForwardApp?.showToast) {
      window.bitForwardApp.showToast(message, 'error');
    } else {
      alert(message);
    }
  }

  savePDF() {
    // In a real implementation, this would generate a PDF
    // For this demo, we'll just show a success message
    if (window.bitForwardApp?.showToast) {
      window.bitForwardApp.showToast('Reporte de impuestos guardado en PDF', 'success');
    } else {
      alert('Reporte de impuestos guardado en PDF');
    }

    this.hideCalculator();
  }
}

// Add CSS styles
const styleElement = document.createElement('style');
styleElement.textContent = `
    .tax-calculator {
        max-width: 700px;
    }
    
    .tax-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    
    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .form-row {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }
    
    .form-row .form-group {
        flex: 1;
        min-width: 200px;
    }
    
    .input-group {
        display: flex;
        align-items: stretch;
    }
    
    .input-group-text {
        display: flex;
        align-items: center;
        padding: 0.5rem 1rem;
        background: var(--bg-tertiary);
        border: 1px solid var(--border);
        border-right: none;
        border-radius: 4px 0 0 4px;
    }
    
    .input-group .form-control {
        border-radius: 0 4px 4px 0;
        flex: 1;
    }
    
    .form-control {
        padding: 0.5rem;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: var(--bg-secondary);
        color: var(--text-primary);
    }
    
    .btn {
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
        border: none;
    }
    
    .btn-primary {
        background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
        color: white;
    }
    
    .btn-outline {
        background: transparent;
        border: 1px solid var(--border);
        color: var(--text-primary);
    }
    
    .w-100 {
        width: 100%;
    }
    
    .tax-results {
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid var(--border);
    }
    
    .tax-results.hidden {
        display: none;
    }
    
    .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        margin: 1.5rem 0;
    }
    
    .result-item {
        padding: 1rem;
        border-radius: 8px;
        background: var(--bg-secondary);
        border: 1px solid var(--border);
    }
    
    .result-item.highlight {
        background: rgba(var(--accent-primary-rgb, 6, 182, 212), 0.1);
        border: 1px solid var(--accent-primary);
    }
    
    .result-label {
        font-size: 0.9rem;
        color: var(--text-tertiary);
        margin-bottom: 0.5rem;
    }
    
    .result-value {
        font-size: 1.25rem;
        font-weight: 600;
    }
    
    .result-value.positive {
        color: #10B981;
    }
    
    .result-value.negative {
        color: #EF4444;
    }
    
    .tax-disclaimer {
        display: flex;
        gap: 0.5rem;
        padding: 1rem;
        border-radius: 8px;
        background: rgba(var(--accent-primary-rgb, 6, 182, 212), 0.05);
        color: var(--text-tertiary);
    }
    
    .text-muted {
        color: var(--text-tertiary);
        font-size: 0.9rem;
    }
    
    @media (max-width: 576px) {
        .results-grid {
            grid-template-columns: 1fr;
        }
        
        .form-row {
            flex-direction: column;
        }
    }
`;

document.head.appendChild(styleElement);

// Initialize calculator
const taxCalculator = new TaxCalculator();

// Create a global function to show the calculator
window.showTaxCalculator = function() {
  taxCalculator.showCalculator();
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TaxCalculator;
}
