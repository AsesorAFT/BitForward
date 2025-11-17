/**
 * BitForward - Frontend Input Sanitizer
 * Sanitización de inputs del lado del cliente usando DOMPurify
 *
 * Protecciones:
 * - XSS (Cross-Site Scripting)
 * - HTML Injection
 * - Script Injection
 * - Event Handler Injection
 */

import DOMPurify from 'dompurify';

class InputSanitizer {
  constructor() {
    this.config = {
      // Configuración por defecto - muy restrictiva
      strict: {
        ALLOWED_TAGS: [], // No permitir HTML
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
      },

      // Configuración para rich text (si se necesita en futuro)
      richText: {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
      },

      // Configuración para URLs
      url: {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      },
    };

    this.init();
  }

  /**
   * Inicializar DOMPurify con hooks
   */
  init() {
    // Hook para detectar intentos de XSS
    DOMPurify.addHook('uponSanitizeElement', (node, data) => {
      if (data.allowedTags[data.tagName] === false) {
        console.warn('⚠️ XSS attempt blocked:', {
          tag: data.tagName,
          content: node.textContent?.substring(0, 100)
        });
      }
    });

    // Hook para detectar atributos maliciosos
    DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
      if (data.attrName && data.attrValue) {
        // Bloquear event handlers
        if (data.attrName.match(/^on/i)) {
          console.warn('⚠️ Event handler blocked:', {
            attribute: data.attrName,
            value: data.attrValue
          });
        }

        // Bloquear javascript: URLs
        if (data.attrValue.match(/javascript:/i)) {
          console.warn('⚠️ JavaScript URL blocked:', data.attrValue);
          data.attrValue = '';
        }
      }
    });

    console.log('🛡️ InputSanitizer initialized');
  }

  /**
   * Sanitizar texto simple (más común)
   */
  sanitizeText(input, options = {}) {
    if (typeof input !== 'string') {
      return input;
    }

    const config = options.strict !== false ? this.config.strict : this.config.richText;

    return DOMPurify.sanitize(input, {
      ...config,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
    });
  }

  /**
   * Sanitizar HTML (para casos específicos donde se permite)
   */
  sanitizeHTML(html, allowedTags = []) {
    if (typeof html !== 'string') {
      return html;
    }

    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: ['class', 'id'],
      KEEP_CONTENT: true,
    });
  }

  /**
   * Sanitizar URL
   */
  sanitizeURL(url) {
    if (typeof url !== 'string') {
      return '';
    }

    // Eliminar espacios
    url = url.trim();

    // Verificar protocolo seguro
    if (!url.match(/^https?:\/\//i)) {
      return '';
    }

    // Sanitizar con DOMPurify
    const sanitized = DOMPurify.sanitize(url, this.config.url);

    // Validar que sea una URL válida
    try {
      new URL(sanitized);
      return sanitized;
    } catch {
      return '';
    }
  }

  /**
   * Sanitizar email
   */
  sanitizeEmail(email) {
    if (typeof email !== 'string') {
      return '';
    }

    email = email.trim().toLowerCase();

    // Regex básico para email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      return '';
    }

    return DOMPurify.sanitize(email, this.config.strict);
  }

  /**
   * Sanitizar wallet address (Ethereum format)
   */
  sanitizeWalletAddress(address) {
    if (typeof address !== 'string') {
      return '';
    }

    address = address.trim();

    // Ethereum address: 0x + 40 caracteres hexadecimales
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;

    if (!addressRegex.test(address)) {
      return '';
    }

    return address;
  }

  /**
   * Sanitizar número
   */
  sanitizeNumber(input, options = {}) {
    const {
      min = -Infinity,
      max = Infinity,
      decimals = null,
      integer = false,
    } = options;

    let num = parseFloat(input);

    if (isNaN(num)) {
      return null;
    }

    // Validar rango
    if (num < min) {num = min;}
    if (num > max) {num = max;}

    // Integer only
    if (integer) {
      num = Math.floor(num);
    }

    // Limitar decimales
    if (decimals !== null) {
      num = parseFloat(num.toFixed(decimals));
    }

    return num;
  }

  /**
   * Sanitizar objeto completo (recursivo)
   */
  sanitizeObject(obj, config = {}) {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeText(obj, config);
    }

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Sanitizar la key también
        const sanitizedKey = this.sanitizeText(key, { strict: true });

        // Sanitizar el valor recursivamente
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitized[sanitizedKey] = this.sanitizeObject(obj[key], config);
        } else {
          sanitized[sanitizedKey] = this.sanitizeText(obj[key], config);
        }
      }
    }

    return sanitized;
  }

  /**
   * Validar y sanitizar input de formulario
   */
  sanitizeFormData(formData) {
    const sanitized = {};

    for (const [key, value] of formData.entries()) {
      const sanitizedKey = this.sanitizeText(key, { strict: true });

      // Detectar tipo de campo y aplicar sanitización apropiada
      if (key.includes('email')) {
        sanitized[sanitizedKey] = this.sanitizeEmail(value);
      } else if (key.includes('url') || key.includes('link')) {
        sanitized[sanitizedKey] = this.sanitizeURL(value);
      } else if (key.includes('address') || key.includes('wallet')) {
        sanitized[sanitizedKey] = this.sanitizeWalletAddress(value);
      } else if (key.includes('amount') || key.includes('price')) {
        sanitized[sanitizedKey] = this.sanitizeNumber(value, { min: 0 });
      } else {
        sanitized[sanitizedKey] = this.sanitizeText(value);
      }
    }

    return sanitized;
  }

  /**
   * Escape HTML entities (alternativa ligera a DOMPurify)
   */
  escapeHTML(str) {
    if (typeof str !== 'string') {
      return str;
    }

    const htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
    };

    return str.replace(/[&<>"'\/]/g, char => htmlEntities[char]);
  }

  /**
   * Validar input contra patrones comunes de ataque
   */
  validateInput(input) {
    if (typeof input !== 'string') {
      return { valid: true, threats: [] };
    }

    const threats = [];

    // SQL Injection
    if (input.match(/(\%27)|(\')|(\-\-)|(\%23)|(#)/i)) {
      threats.push('SQL_INJECTION');
    }

    // XSS
    if (input.match(/<script|<iframe|javascript:|onerror=|onload=/i)) {
      threats.push('XSS');
    }

    // Path Traversal
    if (input.match(/(\.\.\/|\.\.\\)/)) {
      threats.push('PATH_TRAVERSAL');
    }

    // Command Injection
    if (input.match(/(\||;|\&|\$\(|\`)/)) {
      threats.push('COMMAND_INJECTION');
    }

    // NoSQL Injection
    if (input.match(/(\$ne|\$gt|\$lt|\$regex)/i)) {
      threats.push('NOSQL_INJECTION');
    }

    if (threats.length > 0) {
      console.warn('⚠️ Security threats detected:', threats, input.substring(0, 50));
    }

    return {
      valid: threats.length === 0,
      threats,
    };
  }

  /**
   * Sanitizar búsqueda/query
   */
  sanitizeSearch(query) {
    if (typeof query !== 'string') {
      return '';
    }

    // Remover operadores especiales
    query = query.replace(/[+\-&|!(){}[\]^"~*?:\\]/g, ' ');

    // Limitar longitud
    query = query.substring(0, 200);

    // Sanitizar
    return this.sanitizeText(query);
  }
}

// Crear instancia global
const inputSanitizer = new InputSanitizer();

// Exportar para uso en módulos
export default inputSanitizer;

// También disponible globalmente
if (typeof window !== 'undefined') {
  window.inputSanitizer = inputSanitizer;
}

/**
 * Helper functions para uso rápido
 */

export function sanitize(input, options) {
  return inputSanitizer.sanitizeText(input, options);
}

export function sanitizeHTML(html, allowedTags) {
  return inputSanitizer.sanitizeHTML(html, allowedTags);
}

export function sanitizeURL(url) {
  return inputSanitizer.sanitizeURL(url);
}

export function sanitizeEmail(email) {
  return inputSanitizer.sanitizeEmail(email);
}

export function sanitizeWalletAddress(address) {
  return inputSanitizer.sanitizeWalletAddress(address);
}

export function escapeHTML(str) {
  return inputSanitizer.escapeHTML(str);
}

export function validateInput(input) {
  return inputSanitizer.validateInput(input);
}
