/**
 * Sistema de Validación Robusta BitForward v2.0
 * Validaciones exhaustivas para datos de entrada y seguridad
 */

const Joi = require('joi');
const { ErrorFactory } = require('../errors/AppError');

class ValidationService {
    constructor() {
        this.customValidators = this.setupCustomValidators();
    }

    /**
     * Configurar validadores personalizados
     */
    setupCustomValidators() {
        return {
            // Validador de dirección Bitcoin
            bitcoinAddress: Joi.string().custom((value, helpers) => {
                const bitcoinRegex = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/;
                if (!bitcoinRegex.test(value)) {
                    return helpers.error('any.invalid');
                }
                return value;
            }, 'Bitcoin address validation'),

            // Validador de dirección Ethereum
            ethereumAddress: Joi.string().custom((value, helpers) => {
                const ethRegex = /^0x[a-fA-F0-9]{40}$/;
                if (!ethRegex.test(value)) {
                    return helpers.error('any.invalid');
                }
                return value;
            }, 'Ethereum address validation'),

            // Validador de dirección Solana
            solanaAddress: Joi.string().custom((value, helpers) => {
                const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
                if (!solanaRegex.test(value)) {
                    return helpers.error('any.invalid');
                }
                return value;
            }, 'Solana address validation'),

            // Validador de blockchain dinámico (simplificado)
            blockchainAddress: Joi.string().required(),

            // Validador de fecha futura
            futureDate: Joi.date().custom((value, helpers) => {
                const now = new Date();
                const inputDate = new Date(value);
                
                if (inputDate <= now) {
                    return helpers.error('date.future');
                }
                
                // No más de 5 años en el futuro
                const maxDate = new Date(now.getTime() + (5 * 365 * 24 * 60 * 60 * 1000));
                if (inputDate > maxDate) {
                    return helpers.error('date.tooFar');
                }
                
                return value;
            }, 'Future date validation').messages({
                'date.future': 'Date must be in the future',
                'date.tooFar': 'Date cannot be more than 5 years in the future'
            }),

            // Validador de contraseña fuerte
            strongPassword: Joi.string()
                .min(8)
                .max(128)
                .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
                .messages({
                    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
                }),

            // Validador de montos financieros
            financialAmount: Joi.number()
                .positive()
                .precision(8)
                .max(1000000)
                .messages({
                    'number.positive': 'Amount must be positive',
                    'number.max': 'Amount cannot exceed 1,000,000'
                })
        };
    }

    /**
     * Schema para creación de contratos
     */
    get contractCreationSchema() {
        return Joi.object({
            blockchain: Joi.string()
                .valid('bitcoin', 'ethereum', 'solana')
                .required()
                .messages({
                    'any.only': 'Blockchain must be one of: bitcoin, ethereum, solana'
                }),
            
            amount: this.customValidators.financialAmount.required(),
            
            strikePrice: this.customValidators.financialAmount.required(),
            
            counterpartyAddress: Joi.when('blockchain', {
                is: 'bitcoin',
                then: this.customValidators.bitcoinAddress,
                otherwise: Joi.when('blockchain', {
                    is: 'ethereum',
                    then: this.customValidators.ethereumAddress,
                    otherwise: this.customValidators.solanaAddress
                })
            }).required(),
            
            executionDate: this.customValidators.futureDate.required(),
            
            contractType: Joi.string()
                .valid('standard', 'american', 'european')
                .default('standard'),
            
            metadata: Joi.object().optional()
        }).options({ stripUnknown: true });
    }

    /**
     * Schema para autenticación de usuario
     */
    get userAuthSchema() {
        return Joi.object({
            username: Joi.string()
                .alphanum()
                .min(3)
                .max(30)
                .required()
                .messages({
                    'string.alphanum': 'Username must contain only alphanumeric characters',
                    'string.min': 'Username must be at least 3 characters long',
                    'string.max': 'Username cannot exceed 30 characters'
                }),
            
            password: Joi.string()
                .min(6)
                .max(128)
                .required()
                .messages({
                    'string.min': 'Password must be at least 6 characters long'
                })
        }).options({ stripUnknown: true });
    }

    /**
     * Schema para registro de usuario
     */
    get userRegistrationSchema() {
        return Joi.object({
            username: Joi.string()
                .alphanum()
                .min(3)
                .max(30)
                .required(),
            
            email: Joi.string()
                .email()
                .required()
                .messages({
                    'string.email': 'Please provide a valid email address'
                }),
            
            password: this.customValidators.strongPassword.required(),
            
            confirmPassword: Joi.string()
                .valid(Joi.ref('password'))
                .required()
                .messages({
                    'any.only': 'Password confirmation does not match'
                }),
            
            walletAddress: Joi.string().optional()
        }).options({ stripUnknown: true });
    }

    /**
     * Schema para parámetros de consulta
     */
    get queryParamsSchema() {
        return Joi.object({
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(100).default(10),
            sortBy: Joi.string().valid('created_at', 'amount', 'execution_date').default('created_at'),
            sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
            status: Joi.string().valid('pending', 'active', 'completed', 'cancelled').optional(),
            blockchain: Joi.string().valid('bitcoin', 'ethereum', 'solana').optional()
        }).options({ stripUnknown: true });
    }

    /**
     * Middleware de validación genérico
     */
    createValidationMiddleware(schema, source = 'body') {
        return async (req, res, next) => {
            try {
                const dataToValidate = req[source];
                const { error, value } = schema.validate(dataToValidate, {
                    abortEarly: false,
                    allowUnknown: false
                });

                if (error) {
                    const validationErrors = error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message,
                        value: detail.context?.value
                    }));

                    return res.status(400).json({
                        success: false,
                        error: 'Validation Error',
                        message: 'Los datos proporcionados no son válidos',
                        details: validationErrors,
                        code: 'VALIDATION_ERROR',
                        timestamp: new Date().toISOString()
                    });
                }

                // Reemplazar los datos validados y sanitizados
                req[source] = value;
                next();

            } catch (err) {
                next(ErrorFactory.validation('validation', err.message));
            }
        };
    }

    /**
     * Sanitización de datos de entrada
     */
    sanitizeInput(data) {
        if (typeof data === 'string') {
            return data
                .trim()
                .replace(/[<>]/g, '') // Prevenir XSS básico
                .substring(0, 1000); // Limitar longitud
        }
        
        if (typeof data === 'object' && data !== null) {
            const sanitized = {};
            for (const [key, value] of Object.entries(data)) {
                sanitized[key] = this.sanitizeInput(value);
            }
            return sanitized;
        }
        
        return data;
    }

    /**
     * Validación específica para direcciones blockchain
     */
    validateBlockchainAddress(address, blockchain) {
        const validators = {
            bitcoin: (addr) => /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(addr),
            ethereum: (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr),
            solana: (addr) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr)
        };

        const validator = validators[blockchain];
        if (!validator) {
            throw ErrorFactory.validation('blockchain', `Unsupported blockchain: ${blockchain}`);
        }

        if (!validator(address)) {
            throw ErrorFactory.validation('address', `Invalid ${blockchain} address format`);
        }

        return true;
    }

    /**
     * Validación de límites financieros
     */
    validateFinancialLimits(amount, blockchain) {
        const limits = {
            bitcoin: { min: 0.00001, max: 21 },
            ethereum: { min: 0.001, max: 10000 },
            solana: { min: 0.01, max: 1000000 }
        };

        const limit = limits[blockchain];
        if (!limit) {
            throw ErrorFactory.validation('blockchain', `Unsupported blockchain: ${blockchain}`);
        }

        if (amount < limit.min) {
            throw ErrorFactory.validation('amount', `Amount too small. Minimum: ${limit.min} ${blockchain.toUpperCase()}`);
        }

        if (amount > limit.max) {
            throw ErrorFactory.validation('amount', `Amount too large. Maximum: ${limit.max} ${blockchain.toUpperCase()}`);
        }

        return true;
    }

    /**
     * Middleware de sanitización
     */
    createSanitizationMiddleware() {
        return (req, res, next) => {
            if (req.body) {
                req.body = this.sanitizeInput(req.body);
            }
            if (req.query) {
                req.query = this.sanitizeInput(req.query);
            }
            if (req.params) {
                req.params = this.sanitizeInput(req.params);
            }
            next();
        };
    }
}

// Crear instancia singleton
const validationService = new ValidationService();

module.exports = validationService;
