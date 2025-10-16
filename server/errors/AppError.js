/**
 * Sistema de Errores Centralizados BitForward v2.0
 * Manejo robusto de errores con logging y códigos estandarizados
 */

class AppError extends Error {
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = true;
        this.timestamp = new Date().toISOString();

        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            success: false,
            error: this.message,
            code: this.code,
            statusCode: this.statusCode,
            timestamp: this.timestamp,
            ...(this.details && { details: this.details })
        };
    }
}

// Errores específicos de la aplicación
class ValidationError extends AppError {
    constructor(message, field = null, value = null) {
        super(message, 400, 'VALIDATION_ERROR', { field, value });
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR');
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND');
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message, 409, 'CONFLICT_ERROR');
    }
}

class BlockchainError extends AppError {
    constructor(message, blockchain = null, txHash = null) {
        super(message, 422, 'BLOCKCHAIN_ERROR', { blockchain, txHash });
    }
}

class ContractError extends AppError {
    constructor(message, contractId = null, action = null) {
        super(message, 422, 'CONTRACT_ERROR', { contractId, action });
    }
}

class RateLimitError extends AppError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 429, 'RATE_LIMIT_ERROR');
    }
}

// Factory para crear errores comunes
class ErrorFactory {
    static validation(field, message, value = null) {
        return new ValidationError(`Validation failed for '${field}': ${message}`, field, value);
    }

    static authentication(message = 'Invalid credentials') {
        return new AuthenticationError(message);
    }

    static authorization(action = null) {
        const message = action ? `Not authorized to ${action}` : 'Insufficient permissions';
        return new AuthorizationError(message);
    }

    static notFound(resource = 'Resource', id = null) {
        const message = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
        return new NotFoundError(message);
    }

    static blockchain(message, blockchain = null, txHash = null) {
        return new BlockchainError(message, blockchain, txHash);
    }

    static contract(message, contractId = null, action = null) {
        return new ContractError(message, contractId, action);
    }

    static rateLimit(message = 'Too many requests, please try again later') {
        return new RateLimitError(message);
    }
}

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    BlockchainError,
    ContractError,
    RateLimitError,
    ErrorFactory
};
