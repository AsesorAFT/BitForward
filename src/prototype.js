// BitForward Core Engine
// Fecha: 2025-09-19
// Versión: 2.0.0 - Enterprise Ready

class BitForward {
    constructor() {
        this.projects = [];
        this.contracts = [];
        this.currentUser = null;
        this.config = {
            supportedChains: ['bitcoin', 'solana', 'ethereum'],
            minContractAmount: {
                bitcoin: 0.0001,
                solana: 0.01,
                ethereum: 0.001
            },
            maxContractDuration: 365, // días
            feeStructure: {
                creation: 0.005, // 0.5%
                execution: 0.002 // 0.2%
            }
        };
        this.eventListeners = new Map();
        this.initialize();
    }

    initialize() {
        this.loadFromStorage();
        this.setupEventSystem();
        console.log('🚀 BitForward Core Engine iniciado');
    }

    // --- Sistema de Eventos ---
    
    setupEventSystem() {
        this.events = {
            CONTRACT_CREATED: 'contract_created',
            CONTRACT_EXECUTED: 'contract_executed',
            USER_LOGIN: 'user_login',
            USER_LOGOUT: 'user_logout',
            PORTFOLIO_UPDATED: 'portfolio_updated'
        };
    }

    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => callback(data));
        }
    }

    // --- Persistencia de Datos ---
    
    saveToStorage() {
        try {
            const data = {
                projects: this.projects,
                contracts: this.contracts,
                currentUser: this.currentUser,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('bitforward_data', JSON.stringify(data));
        } catch (error) {
            console.error('Error guardando datos:', error);
        }
    }

    loadFromStorage() {
        try {
            const data = JSON.parse(localStorage.getItem('bitforward_data') || '{}');
            this.projects = data.projects || [];
            this.contracts = data.contracts || [];
            // No cargar currentUser por seguridad
        } catch (error) {
            console.warn('No se pudieron cargar datos previos:', error);
        }
    }

    // --- Métodos de Autenticación Avanzada ---

    async login(username, password) {
        try {
            // Simulación de autenticación más robusta
            if (!username || !password) {
                throw new Error('Credenciales requeridas');
            }

            // En producción: validar contra backend/blockchain
            const user = await this.validateUser(username, password);
            
            this.currentUser = {
                username: user.username,
                id: user.id || Date.now(),
                wallets: user.wallets || {},
                permissions: user.permissions || ['basic'],
                loginTime: new Date().toISOString(),
                portfolio: this.calculatePortfolio(user.id)
            };

            this.emit(this.events.USER_LOGIN, this.currentUser);
            this.saveToStorage();
            
            console.log(`✅ Bienvenido, ${username}. Portfolio: ${this.currentUser.portfolio.total} USD`);
            return { success: true, user: this.currentUser };
        } catch (error) {
            console.error('❌ Error en login:', error.message);
            return { success: false, error: error.message };
        }
    }

    async validateUser(username, password) {
        // Simulación - en producción sería una llamada a API/blockchain
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (username.length >= 3 && password.length >= 6) {
                    resolve({
                        username,
                        id: `user_${Date.now()}`,
                        wallets: {
                            bitcoin: null,
                            solana: null,
                            ethereum: null
                        }
                    });
                } else {
                    reject(new Error('Credenciales inválidas'));
                }
            }, 500);
        });
    }

    logout() {
        if (this.currentUser) {
            console.log(`👋 Hasta luego, ${this.currentUser.username}.`);
            this.emit(this.events.USER_LOGOUT, this.currentUser);
            this.currentUser = null;
            this.saveToStorage();
        }
    }

    // --- Gestión de Wallets ---
    
    async connectWallet(blockchain, walletAddress) {
        if (!this.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        if (!this.config.supportedChains.includes(blockchain)) {
            throw new Error(`Blockchain ${blockchain} no soportada`);
        }

        // Validar dirección según blockchain
        if (!this.validateWalletAddress(walletAddress, blockchain)) {
            throw new Error('Dirección de wallet inválida');
        }

        this.currentUser.wallets[blockchain] = {
            address: walletAddress,
            connected: true,
            connectedAt: new Date().toISOString()
        };

        this.saveToStorage();
        console.log(`🔗 Wallet ${blockchain} conectada: ${walletAddress}`);
        return true;
    }

    validateWalletAddress(address, blockchain) {
        const patterns = {
            bitcoin: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
            solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
            ethereum: /^0x[a-fA-F0-9]{40}$/
        };
        return patterns[blockchain]?.test(address) || false;
    }

    // --- Métodos de Gestión de Proyectos ---

    createProject(projectName, description) {
        if (!this.currentUser) {
            console.log("Error: Debes iniciar sesión para crear un proyecto.");
            return null;
        }
        const project = {
            id: Date.now(),
            name: projectName,
            description: description,
            owner: this.currentUser.username,
            tasks: [],
            files: []
        };
        this.projects.push(project);
        console.log(`Proyecto "${projectName}" creado exitosamente.`);
        return project;
    }

    getProjects() {
        return this.projects.filter(project => project.owner === this.currentUser.username);
    }

    deleteProject(projectId) {
        if (!this.currentUser) {
            console.log("Error: Debes iniciar sesión.");
            return false;
        }
        
        const projectIndex = this.projects.findIndex(p => p.id === projectId && p.owner === this.currentUser.username);
        if (projectIndex === -1) {
            console.log("Proyecto no encontrado o no tienes permisos.");
            return false;
        }
        
        this.projects.splice(projectIndex, 1);
        console.log("Proyecto eliminado exitosamente.");
        return true;
    }

    // --- Métodos de Contratos Forward Avanzados ---

    async createForwardContract(contractData) {
        if (!this.currentUser) {
            throw new Error("Usuario no autenticado");
        }

        const {
            blockchain,
            amount,
            counterparty,
            executionDate,
            strikePrice,
            contractType = 'standard',
            collateral = null
        } = contractData;

        // Validaciones exhaustivas
        await this.validateContractData(contractData);

        const contractId = this.generateContractId();
        const fees = this.calculateFees(amount, blockchain);
        
        const contract = {
            id: contractId,
            blockchain,
            amount: parseFloat(amount),
            counterparty,
            executionDate,
            strikePrice: parseFloat(strikePrice),
            contractType,
            collateral,
            creator: this.currentUser.username,
            creatorId: this.currentUser.id,
            status: 'pending_counterparty',
            fees,
            createdAt: new Date().toISOString(),
            expiresAt: this.calculateExpirationDate(executionDate),
            metadata: {
                version: '2.0',
                chainSpecific: await this.generateChainSpecificData(blockchain, contractData)
            },
            riskMetrics: this.calculateRiskMetrics(contractData),
            smartContractAddress: null // Se asignará al desplegar
        };

        this.contracts.push(contract);
        this.saveToStorage();
        
        this.emit(this.events.CONTRACT_CREATED, contract);
        
        console.log(`📄 Contrato forward creado: ${contractId} en ${blockchain} por ${amount} unidades`);
        return contract;
    }

    async validateContractData(data) {
        const { blockchain, amount, counterparty, executionDate, strikePrice } = data;

        // Validar blockchain soportada
        if (!this.config.supportedChains.includes(blockchain)) {
            throw new Error(`Blockchain ${blockchain} no soportada`);
        }

        // Validar cantidad mínima
        if (amount < this.config.minContractAmount[blockchain]) {
            throw new Error(`Cantidad mínima para ${blockchain}: ${this.config.minContractAmount[blockchain]}`);
        }

        // Validar dirección de contraparte
        if (!this.validateWalletAddress(counterparty, blockchain)) {
            throw new Error('Dirección de contraparte inválida');
        }

        // Validar fecha de ejecución
        const execDate = new Date(executionDate);
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + this.config.maxContractDuration);
        
        if (execDate <= new Date() || execDate > maxDate) {
            throw new Error(`Fecha de ejecución debe ser entre hoy y ${this.config.maxContractDuration} días`);
        }

        // Validar strike price
        if (strikePrice <= 0) {
            throw new Error('Precio strike debe ser positivo');
        }

        return true;
    }

    generateContractId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `BF_${timestamp}_${random}`.toUpperCase();
    }

    calculateFees(amount, blockchain) {
        const creationFee = amount * this.config.feeStructure.creation;
        const executionFee = amount * this.config.feeStructure.execution;
        
        return {
            creation: creationFee,
            execution: executionFee,
            total: creationFee + executionFee,
            currency: blockchain
        };
    }

    calculateExpirationDate(executionDate) {
        const execDate = new Date(executionDate);
        execDate.setDate(execDate.getDate() + 7); // 7 días después de ejecución
        return execDate.toISOString();
    }

    async generateChainSpecificData(blockchain, contractData) {
        switch (blockchain) {
            case 'bitcoin':
                return await this.generateBitcoinScript(contractData);
            case 'solana':
                return await this.generateSolanaProgram(contractData);
            case 'ethereum':
                return await this.generateEthereumContract(contractData);
            default:
                return {};
        }
    }

    async generateBitcoinScript(contractData) {
        // Generar Bitcoin Script para contrato forward
        return {
            scriptType: 'P2WSH',
            witnessScript: this.createTimelockedScript(contractData),
            redeemConditions: ['timelock', 'multisig'],
            estimatedSize: 250 // bytes
        };
    }

    createTimelockedScript(contractData) {
        // Pseudocódigo de Bitcoin Script
        return `
            OP_IF
                <${contractData.executionDate}> OP_CHECKLOCKTIMEVERIFY OP_DROP
                <creator_pubkey> OP_CHECKSIG
            OP_ELSE
                <counterparty_pubkey> OP_CHECKSIG
            OP_ENDIF
        `;
    }

    async generateSolanaProgram(contractData) {
        return {
            programId: 'BitForward1111111111111111111111111111111',
            accountStructure: {
                contract: 'ContractAccount',
                escrow: 'EscrowAccount',
                oracle: 'PriceOracle'
            },
            instructions: ['initialize', 'execute', 'cancel']
        };
    }

    async generateEthereumContract(contractData) {
        return {
            contractAddress: null, // Se asignará al desplegar
            abi: 'ForwardContract_ABI',
            bytecode: 'ForwardContract_Bytecode',
            gasEstimate: 150000
        };
    }

    calculateRiskMetrics(contractData) {
        const { amount, strikePrice, executionDate } = contractData;
        const daysToExpiry = Math.ceil((new Date(executionDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        return {
            exposureLevel: amount > 1 ? 'HIGH' : amount > 0.1 ? 'MEDIUM' : 'LOW',
            timeToExpiry: daysToExpiry,
            volatilityRisk: this.calculateVolatilityRisk(contractData.blockchain),
            counterpartyRisk: 'UNKNOWN', // En producción: scoring de contraparte
            liquidityRisk: 'MEDIUM'
        };
    }

    calculateVolatilityRisk(blockchain) {
        const volatilityScores = {
            bitcoin: 'MEDIUM',
            ethereum: 'HIGH',
            solana: 'VERY_HIGH'
        };
        return volatilityScores[blockchain] || 'UNKNOWN';
    }

    async executeContract(contractId, executionData = {}) {
        const contract = this.contracts.find(c => c.id === contractId);
        
        if (!contract) {
            throw new Error('Contrato no encontrado');
        }

        if (contract.status !== 'active') {
            throw new Error(`Contrato no está activo. Estado: ${contract.status}`);
        }

        const currentDate = new Date();
        const executionDate = new Date(contract.executionDate);
        
        if (currentDate < executionDate) {
            throw new Error('Contrato no ha alcanzado la fecha de ejecución');
        }

        try {
            // Ejecutar según blockchain
            const result = await this.executeOnChain(contract, executionData);
            
            contract.status = 'executed';
            contract.executedAt = currentDate.toISOString();
            contract.executionResult = result;
            contract.actualPrice = executionData.currentPrice || contract.strikePrice;
            contract.pnl = this.calculatePnL(contract);

            this.saveToStorage();
            this.emit(this.events.CONTRACT_EXECUTED, contract);
            
            console.log(`✅ Contrato ${contractId} ejecutado exitosamente. PnL: ${contract.pnl}`);
            return { success: true, contract, result };
            
        } catch (error) {
            contract.status = 'failed';
            contract.executionError = error.message;
            this.saveToStorage();
            
            console.error(`❌ Error ejecutando contrato ${contractId}:`, error.message);
            throw error;
        }
    }

    async executeOnChain(contract, executionData) {
        switch (contract.blockchain) {
            case 'bitcoin':
                return await this.executeBitcoinContract(contract, executionData);
            case 'solana':
                return await this.executeSolanaContract(contract, executionData);
            case 'ethereum':
                return await this.executeEthereumContract(contract, executionData);
            default:
                throw new Error(`Ejecución no implementada para ${contract.blockchain}`);
        }
    }

    async executeBitcoinContract(contract, executionData) {
        // Simulación de ejecución en Bitcoin
        return {
            txid: `btc_${Date.now()}_${Math.random().toString(36)}`,
            confirmations: 0,
            fee: 0.00001,
            executed: true
        };
    }

    async executeSolanaContract(contract, executionData) {
        // Simulación de ejecución en Solana
        return {
            signature: `sol_${Date.now()}_${Math.random().toString(36)}`,
            slot: Math.floor(Math.random() * 1000000),
            fee: 0.000005,
            executed: true
        };
    }

    async executeEthereumContract(contract, executionData) {
        // Simulación de ejecución en Ethereum
        return {
            txHash: `eth_${Date.now()}_${Math.random().toString(36)}`,
            gasUsed: 120000,
            gasPrice: 20,
            executed: true
        };
    }

    calculatePnL(contract) {
        const { amount, strikePrice, actualPrice } = contract;
        const priceDiff = actualPrice - strikePrice;
        return amount * priceDiff;
    }

    // --- Gestión de Portfolio ---
    
    calculatePortfolio(userId = null) {
        const targetUserId = userId || this.currentUser?.id;
        if (!targetUserId) return { total: 0, contracts: 0, pnl: 0 };

        const userContracts = this.contracts.filter(c => 
            c.creatorId === targetUserId || c.counterpartyId === targetUserId
        );

        const portfolio = {
            total: 0,
            contracts: userContracts.length,
            active: userContracts.filter(c => c.status === 'active').length,
            executed: userContracts.filter(c => c.status === 'executed').length,
            pending: userContracts.filter(c => c.status.includes('pending')).length,
            totalPnL: 0,
            byBlockchain: {},
            riskExposure: 'LOW'
        };

        userContracts.forEach(contract => {
            if (!portfolio.byBlockchain[contract.blockchain]) {
                portfolio.byBlockchain[contract.blockchain] = {
                    count: 0,
                    totalAmount: 0,
                    pnl: 0
                };
            }

            portfolio.byBlockchain[contract.blockchain].count++;
            portfolio.byBlockchain[contract.blockchain].totalAmount += contract.amount;
            
            if (contract.pnl) {
                portfolio.totalPnL += contract.pnl;
                portfolio.byBlockchain[contract.blockchain].pnl += contract.pnl;
            }
        });

        // Calcular exposición total
        portfolio.total = Object.values(portfolio.byBlockchain)
            .reduce((sum, chain) => sum + chain.totalAmount, 0);

        // Determinar nivel de riesgo
        if (portfolio.total > 10) portfolio.riskExposure = 'VERY_HIGH';
        else if (portfolio.total > 5) portfolio.riskExposure = 'HIGH';
        else if (portfolio.total > 1) portfolio.riskExposure = 'MEDIUM';

        return portfolio;
    }

    getContractsByStatus(status) {
        if (!this.currentUser) return [];
        
        return this.contracts.filter(c => 
            (c.creatorId === this.currentUser.id || c.counterpartyId === this.currentUser.id) &&
            c.status === status
        );
    }

    // --- Analytics y Reporting ---
    
    generateAnalytics() {
        const portfolio = this.calculatePortfolio();
        const contracts = this.contracts;
        
        return {
            portfolio,
            marketData: {
                totalContracts: contracts.length,
                totalVolume: contracts.reduce((sum, c) => sum + c.amount, 0),
                averageContractSize: contracts.length > 0 ? 
                    contracts.reduce((sum, c) => sum + c.amount, 0) / contracts.length : 0,
                successRate: this.calculateSuccessRate(),
                popularBlockchains: this.getBlockchainStats()
            },
            performance: {
                totalPnL: portfolio.totalPnL,
                winRate: this.calculateWinRate(),
                avgHoldingPeriod: this.calculateAvgHoldingPeriod()
            }
        };
    }

    calculateSuccessRate() {
        const executed = this.contracts.filter(c => c.status === 'executed').length;
        const total = this.contracts.filter(c => 
            ['executed', 'failed', 'expired'].includes(c.status)
        ).length;
        
        return total > 0 ? (executed / total) * 100 : 0;
    }

    getBlockchainStats() {
        const stats = {};
        this.contracts.forEach(contract => {
            if (!stats[contract.blockchain]) {
                stats[contract.blockchain] = { count: 0, volume: 0 };
            }
            stats[contract.blockchain].count++;
            stats[contract.blockchain].volume += contract.amount;
        });
        return stats;
    }

    calculateWinRate() {
        const executedContracts = this.contracts.filter(c => c.status === 'executed' && c.pnl !== undefined);
        if (executedContracts.length === 0) return 0;
        
        const wins = executedContracts.filter(c => c.pnl > 0).length;
        return (wins / executedContracts.length) * 100;
    }

    calculateAvgHoldingPeriod() {
        const executedContracts = this.contracts.filter(c => c.status === 'executed');
        if (executedContracts.length === 0) return 0;
        
        const totalDays = executedContracts.reduce((sum, contract) => {
            const created = new Date(contract.createdAt);
            const executed = new Date(contract.executedAt);
            return sum + Math.ceil((executed - created) / (1000 * 60 * 60 * 24));
        }, 0);
        
        return totalDays / executedContracts.length;
    }
}

// --- Factory y Utilidades ---

class BitForwardFactory {
    static createInstance(config = {}) {
        const instance = new BitForward();
        
        // Aplicar configuración personalizada
        if (config.supportedChains) {
            instance.config.supportedChains = config.supportedChains;
        }
        
        if (config.feeStructure) {
            instance.config.feeStructure = { ...instance.config.feeStructure, ...config.feeStructure };
        }
        
        return instance;
    }
    
    static getVersion() {
        return '2.0.0';
    }
    
    static getSupportedFeatures() {
        return [
            'multi_blockchain',
            'forward_contracts',
            'risk_analytics',
            'portfolio_management',
            'real_time_execution',
            'event_system',
            'data_persistence'
        ];
    }
}

// --- Utilidades y Helpers ---

class BitForwardUtils {
    static formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }
    
    static formatPercentage(value) {
        return `${(value * 100).toFixed(2)}%`;
    }
    
    static calculateTimeToExpiry(executionDate) {
        const now = new Date();
        const expiry = new Date(executionDate);
        const diffMs = expiry - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return 'Expirado';
        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Mañana';
        return `${diffDays} días`;
    }
    
    static generateQRCode(contractId) {
        // En producción: generar QR real
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=bitforward:${contractId}`;
    }
    
    static validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    static generateSecureId() {
        return crypto.getRandomValues(new Uint32Array(4)).join('-');
    }
}

// Instancia global para uso en la aplicación
const bitForward = new BitForward();

// Configurar eventos globales
bitForward.on(bitForward.events.CONTRACT_CREATED, (contract) => {
    console.log('🎉 Nuevo contrato creado:', contract.id);
});

bitForward.on(bitForward.events.CONTRACT_EXECUTED, (contract) => {
    console.log('⚡ Contrato ejecutado:', contract.id, 'PnL:', contract.pnl);
});

bitForward.on(bitForward.events.USER_LOGIN, (user) => {
    console.log('👤 Usuario conectado:', user.username);
});

// Exportar para uso en diferentes entornos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BitForward,
        BitForwardFactory,
        BitForwardUtils,
        bitForward
    };
}

// Para uso en browser
if (typeof window !== 'undefined') {
    window.BitForward = BitForward;
    window.BitForwardFactory = BitForwardFactory;
    window.BitForwardUtils = BitForwardUtils;
    window.bitForward = bitForward;
}

console.log('🚀 BitForward v2.0.0 cargado exitosamente - Enterprise Ready!');