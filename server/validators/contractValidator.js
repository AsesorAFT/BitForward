/**
 * Validador de Contratos BitForward - Lado del Servidor
 * Versión backend del sistema "Guardián de Contratos"
 */

const config = require('../config/config');

class BitForwardValidator {
    /**
     * Valida un contrato completo
     */
    static validateContract(contractData) {
        const errors = [];
        
        // Validar campos requeridos
        const requiredFields = ['blockchain', 'amount', 'counterpartyAddress', 'executionDate'];
        for (const field of requiredFields) {
            if (!contractData[field]) {
                errors.push(`Campo requerido faltante: ${field}`);
            }
        }

        if (errors.length > 0) {
            return errors;
        }

        // Validar blockchain
        const blockchainErrors = this.validateBlockchain(contractData.blockchain);
        errors.push(...blockchainErrors);

        // Validar monto
        const amountErrors = this.validateAmount(contractData.amount, contractData.blockchain);
        errors.push(...amountErrors);

        // Validar dirección
        const addressErrors = this.validateAddress(contractData.counterpartyAddress, contractData.blockchain);
        errors.push(...addressErrors);

        // Validar fecha
        const dateErrors = this.validateExecutionDate(contractData.executionDate);
        errors.push(...dateErrors);

        // Validar precio de strike (opcional)
        if (contractData.strikePrice) {
            const priceErrors = this.validateStrikePrice(contractData.strikePrice);
            errors.push(...priceErrors);
        }

        return errors;
    }

    /**
     * Valida la blockchain seleccionada
     */
    static validateBlockchain(blockchain) {
        const errors = [];
        
        if (!blockchain) {
            errors.push('Blockchain es requerida');
            return errors;
        }

        if (!config.CONTRACTS.SUPPORTED_BLOCKCHAINS.includes(blockchain)) {
            errors.push(`Blockchain no soportada: ${blockchain}. Blockchains válidas: ${config.CONTRACTS.SUPPORTED_BLOCKCHAINS.join(', ')}`);
        }

        return errors;
    }

    /**
     * Valida el monto del contrato
     */
    static validateAmount(amount, blockchain) {
        const errors = [];
        
        if (amount === null || amount === undefined) {
            errors.push('Monto es requerido');
            return errors;
        }

        const numericAmount = parseFloat(amount);
        
        if (isNaN(numericAmount)) {
            errors.push('Monto debe ser un número válido');
            return errors;
        }

        if (numericAmount <= 0) {
            errors.push('Monto debe ser mayor que cero');
            return errors;
        }

        // Validar límites globales
        if (numericAmount < config.CONTRACTS.MIN_AMOUNT) {
            errors.push(`Monto mínimo: ${config.CONTRACTS.MIN_AMOUNT}`);
        }

        if (numericAmount > config.CONTRACTS.MAX_AMOUNT) {
            errors.push(`Monto máximo: ${config.CONTRACTS.MAX_AMOUNT}`);
        }

        // Validar límites específicos por blockchain
        if (blockchain && config.CONTRACTS.LIMITS[blockchain]) {
            const limits = config.CONTRACTS.LIMITS[blockchain];
            
            if (numericAmount < limits.min) {
                errors.push(`Monto mínimo para ${blockchain}: ${limits.min}`);
            }
            
            if (numericAmount > limits.max) {
                errors.push(`Monto máximo para ${blockchain}: ${limits.max}`);
            }
        }

        // Validar precisión decimal
        const decimalPlaces = (numericAmount.toString().split('.')[1] || '').length;
        const maxDecimals = blockchain === 'bitcoin' ? 8 : blockchain === 'ethereum' ? 18 : 9;
        
        if (decimalPlaces > maxDecimals) {
            errors.push(`Máximo ${maxDecimals} decimales permitidos para ${blockchain}`);
        }

        return errors;
    }

    /**
     * Valida la dirección de la contraparte
     */
    static validateAddress(address, blockchain) {
        const errors = [];
        
        if (!address) {
            errors.push('Dirección de contraparte es requerida');
            return errors;
        }

        if (typeof address !== 'string') {
            errors.push('Dirección debe ser una cadena de texto');
            return errors;
        }

        const trimmedAddress = address.trim();
        
        if (trimmedAddress.length === 0) {
            errors.push('Dirección no puede estar vacía');
            return errors;
        }

        // Validaciones específicas por blockchain
        switch (blockchain) {
            case 'bitcoin':
                if (!this.isValidBitcoinAddress(trimmedAddress)) {
                    errors.push('Dirección de Bitcoin inválida');
                }
                break;
                
            case 'ethereum':
                if (!this.isValidEthereumAddress(trimmedAddress)) {
                    errors.push('Dirección de Ethereum inválida');
                }
                break;
                
            case 'solana':
                if (!this.isValidSolanaAddress(trimmedAddress)) {
                    errors.push('Dirección de Solana inválida');
                }
                break;
        }

        return errors;
    }

    /**
     * Valida la fecha de ejecución
     */
    static validateExecutionDate(executionDate) {
        const errors = [];
        
        if (!executionDate) {
            errors.push('Fecha de ejecución es requerida');
            return errors;
        }

        const date = new Date(executionDate);
        
        if (isNaN(date.getTime())) {
            errors.push('Fecha de ejecución inválida');
            return errors;
        }

        const now = new Date();
        const minDate = new Date(now.getTime() + (config.CONTRACTS.MIN_EXECUTION_HOURS * 60 * 60 * 1000));
        const maxDate = new Date(now.getTime() + (config.CONTRACTS.MAX_EXECUTION_DAYS * 24 * 60 * 60 * 1000));

        if (date < minDate) {
            errors.push(`Fecha de ejecución debe ser al menos ${config.CONTRACTS.MIN_EXECUTION_HOURS} horas en el futuro`);
        }

        if (date > maxDate) {
            errors.push(`Fecha de ejecución no puede ser más de ${config.CONTRACTS.MAX_EXECUTION_DAYS} días en el futuro`);
        }

        return errors;
    }

    /**
     * Valida el precio de strike (opcional)
     */
    static validateStrikePrice(strikePrice) {
        const errors = [];
        
        const numericPrice = parseFloat(strikePrice);
        
        if (isNaN(numericPrice)) {
            errors.push('Precio de strike debe ser un número válido');
            return errors;
        }

        if (numericPrice <= 0) {
            errors.push('Precio de strike debe ser mayor que cero');
        }

        if (numericPrice > 10000000) { // 10 millones como límite arbitrario
            errors.push('Precio de strike excede el límite máximo');
        }

        return errors;
    }

    /**
     * Valida dirección de Bitcoin
     */
    static isValidBitcoinAddress(address) {
        // Regex básico para direcciones Bitcoin (Legacy, SegWit, Bech32)
        const patterns = [
            /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Legacy (P2PKH, P2SH)
            /^bc1[a-z0-9]{39,59}$/, // Bech32 (SegWit v0)
            /^bc1p[a-z0-9]{58}$/ // Bech32m (SegWit v1, Taproot)
        ];
        
        return patterns.some(pattern => pattern.test(address));
    }

    /**
     * Valida dirección de Ethereum
     */
    static isValidEthereumAddress(address) {
        // Regex para direcciones Ethereum (40 caracteres hex con 0x)
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    /**
     * Valida dirección de Solana
     */
    static isValidSolanaAddress(address) {
        // Dirección Solana típicamente es base58 de 32-44 caracteres
        const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
        return base58Regex.test(address);
    }

    /**
     * Valida metadatos opcionales del contrato
     */
    static validateMetadata(metadata) {
        const errors = [];
        
        if (metadata === null || metadata === undefined) {
            return errors;
        }

        if (typeof metadata !== 'object') {
            errors.push('Metadatos deben ser un objeto');
            return errors;
        }

        // Verificar tamaño de metadatos (máximo 10KB)
        const metadataString = JSON.stringify(metadata);
        if (metadataString.length > 10240) {
            errors.push('Metadatos exceden el tamaño máximo de 10KB');
        }

        // Validar campos específicos si existen
        if (metadata.description && typeof metadata.description !== 'string') {
            errors.push('Descripción en metadatos debe ser texto');
        }

        if (metadata.tags && !Array.isArray(metadata.tags)) {
            errors.push('Tags en metadatos deben ser un array');
        }

        return errors;
    }

    /**
     * Valida un campo específico (para validación en tiempo real)
     */
    static validateField(fieldName, value, context = {}) {
        switch (fieldName) {
            case 'blockchain':
                return this.validateBlockchain(value);
                
            case 'amount':
                return this.validateAmount(value, context.blockchain);
                
            case 'counterpartyAddress':
                return this.validateAddress(value, context.blockchain);
                
            case 'executionDate':
                return this.validateExecutionDate(value);
                
            case 'strikePrice':
                return this.validateStrikePrice(value);
                
            case 'metadata':
                return this.validateMetadata(value);
                
            default:
                return [`Campo desconocido: ${fieldName}`];
        }
    }
}

module.exports = {
    BitForwardValidator
};
