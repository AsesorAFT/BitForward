import DOMPurify from 'isomorphic-dompurify';
import { body, param, query, validationResult } from 'express-validator';

// Sanitizador personalizado
export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    // Remover HTML peligroso
    let clean = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No permitir ningún tag HTML
      ALLOWED_ATTR: []
    });

    // Remover caracteres de control
    clean = clean.replace(/[\x00-\x1F\x7F]/g, '');

    // Trimear espacios
    clean = clean.trim();

    return clean;
  }
  return input;
};

// Middleware para sanitizar todo el body
export const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (Array.isArray(value)) {
        sanitized[key] = value.map(sanitizeInput);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = JSON.parse(JSON.stringify(value, (k, v) => sanitizeInput(v)));
      } else {
        sanitized[key] = sanitizeInput(value);
      }
    }
    req.body = sanitized;
  }
  next();
};

// Validador de dirección Ethereum
export const isEthereumAddress = (value) => {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
};

// Validador de firma
export const isValidSignature = (value) => {
  return /^0x[a-fA-F0-9]{130}$/.test(value);
};

// Reglas de validación comunes
export const validateContractCreation = [
  body('asset')
    .trim()
    .notEmpty().withMessage('El activo es requerido')
    .isIn(['BTC', 'ETH', 'USDT', 'USDC', 'DAI', 'SOL'])
    .withMessage('Activo no válido'),

  body('amount')
    .isFloat({ min: 0.000001, max: 1000000 })
    .withMessage('Monto inválido'),

  body('price')
    .isFloat({ min: 0 })
    .withMessage('Precio inválido'),

  body('expirationDate')
    .isISO8601()
    .withMessage('Fecha de expiración inválida')
    .custom((value) => {
      const expDate = new Date(value);
      const now = new Date();
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1); // Máximo 1 año

      if (expDate <= now) {
        throw new Error('La fecha de expiración debe ser futura');
      }
      if (expDate > maxDate) {
        throw new Error('La fecha de expiración no puede ser mayor a 1 año');
      }
      return true;
    }),

  body('walletAddress')
    .custom((value) => {
      if (!isEthereumAddress(value)) {
        throw new Error('Dirección de wallet inválida');
      }
      return true;
    }),

  sanitizeBody
];

export const validateAuthentication = [
  body('address')
    .custom((value) => {
      if (!isEthereumAddress(value)) {
        throw new Error('Dirección Ethereum inválida');
      }
      return true;
    }),

  body('signature')
    .custom((value) => {
      if (!isValidSignature(value)) {
        throw new Error('Firma inválida');
      }
      return true;
    }),

  body('message')
    .trim()
    .notEmpty().withMessage('Mensaje requerido')
    .isLength({ max: 500 }).withMessage('Mensaje demasiado largo'),

  sanitizeBody
];

export const validateTransaction = [
  param('contractId')
    .isUUID().withMessage('ID de contrato inválido'),

  body('action')
    .isIn(['execute', 'cancel', 'settle'])
    .withMessage('Acción inválida'),

  body('signature')
    .custom(isValidSignature)
    .withMessage('Firma inválida'),

  sanitizeBody
];

// Middleware para manejar errores de validación
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }

  next();
};
