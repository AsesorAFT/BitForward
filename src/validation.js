/**
 * BitForward Validation Engine
 * Sistema de validación robusto para contratos forward
 * Versión: 2.0.0 - Enterprise Ready
 */

class BitForwardValidator {
  constructor() {
    this.rules = new Map();
    this.setupValidationRules();
  }

  setupValidationRules() {
    // Reglas de validación para diferentes tipos de datos
    this.rules.set('amount', {
      required: true,
      type: 'number',
      min: 0.0001,
      max: 1000000,
      precision: 8
    });

    this.rules.set('strikePrice', {
      required: true,
      type: 'number',
      min: 0.01,
      max: 10000000,
      precision: 2
    });

    this.rules.set('executionDate', {
      required: true,
      type: 'date',
      futureOnly: true,
      maxDaysAhead: 365
    });

    this.rules.set('blockchain', {
      required: true,
      type: 'string',
      allowedValues: ['bitcoin', 'ethereum', 'solana']
    });

    this.rules.set('counterparty', {
      required: true,
      type: 'address',
      validateFormat: true
    });

    this.rules.set('collateral', {
      required: false,
      type: 'number',
      min: 0,
      max: 100,
      precision: 2
    });
  }

  /**
     * Valida datos completos de contrato
     * @param {Object} contractData - Datos del contrato a validar
     * @returns {ValidationResult} Resultado de la validación
     */
  validateContract(contractData) {
    const errors = [];
    const warnings = [];

    try {
      // Validaciones básicas
      this.validateRequired(contractData, errors);
      this.validateTypes(contractData, errors);
      this.validateRanges(contractData, errors);
      this.validateFormats(contractData, errors);

      // Validaciones de negocio
      this.validateBusinessRules(contractData, errors, warnings);

      // Validaciones de seguridad
      this.validateSecurityRules(contractData, errors, warnings);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        data: this.sanitizeData(contractData)
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Error interno de validación: ${error.message}`],
        warnings: [],
        data: null
      };
    }
  }

  validateRequired(data, errors) {
    const requiredFields = ['blockchain', 'amount', 'strikePrice', 'executionDate', 'counterparty'];

    requiredFields.forEach(field => {
      if (!data[field] || data[field] === '' || data[field] === null || data[field] === undefined) {
        errors.push(`${this.getFieldDisplayName(field)} es requerido`);
      }
    });
  }

  validateTypes(data, errors) {
    // Validar amount
    if (data.amount !== undefined && data.amount !== '') {
      const amount = parseFloat(data.amount);
      if (isNaN(amount)) {
        errors.push('La cantidad debe ser un número válido');
      }
    }

    // Validar strikePrice
    if (data.strikePrice !== undefined && data.strikePrice !== '') {
      const price = parseFloat(data.strikePrice);
      if (isNaN(price)) {
        errors.push('El precio strike debe ser un número válido');
      }
    }

    // Validar executionDate
    if (data.executionDate) {
      const date = new Date(data.executionDate);
      if (isNaN(date.getTime())) {
        errors.push('La fecha de ejecución debe ser una fecha válida');
      }
    }
  }

  validateRanges(data, errors) {
    // Validar cantidad
    if (data.amount) {
      const amount = parseFloat(data.amount);
      if (!isNaN(amount)) {
        if (amount <= 0) {
          errors.push('La cantidad debe ser mayor a cero');
        } else if (amount > 1000000) {
          errors.push('La cantidad no puede exceder 1,000,000 unidades');
        } else if (data.blockchain && amount < this.getMinAmount(data.blockchain)) {
          errors.push(`La cantidad mínima para ${data.blockchain} es ${this.getMinAmount(data.blockchain)}`);
        }
      }
    }

    // Validar precio strike
    if (data.strikePrice) {
      const price = parseFloat(data.strikePrice);
      if (!isNaN(price)) {
        if (price <= 0) {
          errors.push('El precio strike debe ser mayor a cero');
        } else if (price > 10000000) {
          errors.push('El precio strike no puede exceder $10,000,000');
        }
      }
    }

    // Validar collateral si se proporciona
    if (data.collateral !== undefined && data.collateral !== '') {
      const collateral = parseFloat(data.collateral);
      if (!isNaN(collateral)) {
        if (collateral < 0 || collateral > 100) {
          errors.push('El colateral debe estar entre 0% y 100%');
        }
      }
    }
  }

  validateFormats(data, errors) {
    // Validar dirección de contraparte
    if (data.counterparty && data.blockchain) {
      if (!this.validateAddress(data.counterparty, data.blockchain)) {
        errors.push(`Dirección de ${data.blockchain} inválida`);
      }
    }

    // Validar blockchain soportada
    if (data.blockchain) {
      const supportedChains = ['bitcoin', 'ethereum', 'solana'];
      if (!supportedChains.includes(data.blockchain.toLowerCase())) {
        errors.push('Blockchain no soportada');
      }
    }
  }

  validateBusinessRules(data, errors, warnings) {
    // Validar fecha de ejecución
    if (data.executionDate) {
      const execDate = new Date(data.executionDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (execDate <= today) {
        errors.push('La fecha de ejecución debe ser futura');
      } else {
        const daysAhead = Math.ceil((execDate - today) / (1000 * 60 * 60 * 24));

        if (daysAhead > 365) {
          errors.push('La fecha de ejecución no puede ser más de 365 días en el futuro');
        } else if (daysAhead < 1) {
          errors.push('La fecha de ejecución debe ser al menos mañana');
        } else if (daysAhead < 7) {
          warnings.push('Contratos con vencimiento menor a 7 días tienen mayor riesgo');
        }
      }
    }

    // Validar relación precio/cantidad
    if (data.amount && data.strikePrice) {
      const amount = parseFloat(data.amount);
      const price = parseFloat(data.strikePrice);
      const totalValue = amount * price;

      if (totalValue > 1000000) {
        warnings.push('Contrato de alto valor - considere dividir en múltiples contratos');
      } else if (totalValue < 100) {
        warnings.push('Contrato de bajo valor - las fees pueden ser proporcionalmente altas');
      }
    }

    // Validar si es fin de semana para ejecución
    if (data.executionDate) {
      const execDate = new Date(data.executionDate);
      const dayOfWeek = execDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        warnings.push('La fecha de ejecución cae en fin de semana - considere un día laborable');
      }
    }
  }

  validateSecurityRules(data, errors, warnings) {
    // Validar que la dirección no sea la misma que el usuario
    if (data.counterparty && typeof window !== 'undefined' && window.bitForward?.currentUser) {
      const userWallets = window.bitForward.currentUser.wallets || {};
      const userWallet = userWallets[data.blockchain];

      if (userWallet && userWallet.address === data.counterparty) {
        errors.push('No puedes crear un contrato contigo mismo');
      }
    }

    // Validar patrones sospechosos
    if (data.counterparty) {
      // Direcciones conocidas como problemáticas (en producción sería una lista más completa)
      const blacklistedPatterns = [
        /^0x0+$/,  // Dirección cero en Ethereum
        /^1{10,}$/, // Patrones repetitivos
      ];

      if (blacklistedPatterns.some(pattern => pattern.test(data.counterparty))) {
        errors.push('Dirección de contraparte inválida o no permitida');
      }
    }
  }

  validateAddress(address, blockchain) {
    const patterns = {
      bitcoin: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
      ethereum: /^0x[a-fA-F0-9]{40}$/,
      solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
    };

    return patterns[blockchain]?.test(address) || false;
  }

  getMinAmount(blockchain) {
    const minimums = {
      bitcoin: 0.0001,
      ethereum: 0.001,
      solana: 0.01
    };
    return minimums[blockchain] || 0.001;
  }

  getFieldDisplayName(field) {
    const displayNames = {
      blockchain: 'Blockchain',
      amount: 'Cantidad',
      strikePrice: 'Precio Strike',
      executionDate: 'Fecha de Ejecución',
      counterparty: 'Dirección de Contraparte',
      collateral: 'Colateral',
      contractType: 'Tipo de Contrato'
    };
    return displayNames[field] || field;
  }

  sanitizeData(data) {
    const sanitized = { ...data };

    // Sanitizar números
    if (sanitized.amount) {sanitized.amount = parseFloat(sanitized.amount);}
    if (sanitized.strikePrice) {sanitized.strikePrice = parseFloat(sanitized.strikePrice);}
    if (sanitized.collateral) {sanitized.collateral = parseFloat(sanitized.collateral);}

    // Sanitizar strings
    if (sanitized.blockchain) {sanitized.blockchain = sanitized.blockchain.toLowerCase().trim();}
    if (sanitized.counterparty) {sanitized.counterparty = sanitized.counterparty.trim();}

    return sanitized;
  }

  /**
     * Validación en tiempo real para un campo específico
     */
  validateField(fieldName, value, context = {}) {
    const errors = [];

    switch (fieldName) {
      case 'amount':
        if (value && value !== '') {
          const amount = parseFloat(value);
          if (isNaN(amount)) {
            errors.push('Debe ser un número válido');
          } else if (amount <= 0) {
            errors.push('Debe ser mayor a cero');
          } else if (context.blockchain && amount < this.getMinAmount(context.blockchain)) {
            errors.push(`Mínimo: ${this.getMinAmount(context.blockchain)}`);
          }
        }
        break;

      case 'strikePrice':
        if (value && value !== '') {
          const price = parseFloat(value);
          if (isNaN(price)) {
            errors.push('Debe ser un número válido');
          } else if (price <= 0) {
            errors.push('Debe ser mayor a cero');
          }
        }
        break;

      case 'executionDate':
        if (value) {
          const date = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (date <= today) {
            errors.push('Debe ser una fecha futura');
          }
        }
        break;

      case 'counterparty':
        if (value && context.blockchain) {
          if (!this.validateAddress(value, context.blockchain)) {
            errors.push('Dirección inválida');
          }
        }
        break;
    }

    return errors;
  }
}

// Crear instancia global del validador
const bitForwardValidator = new BitForwardValidator();

// Exportar para uso en diferentes entornos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BitForwardValidator, bitForwardValidator };
}

if (typeof window !== 'undefined') {
  window.BitForwardValidator = BitForwardValidator;
  window.bitForwardValidator = bitForwardValidator;
}

console.log('🛡️ BitForward Validation Engine loaded');
