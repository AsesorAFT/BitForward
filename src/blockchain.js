// BitForward Blockchain Integration Layer
// Sistema de integración con múltiples blockchains

class BlockchainIntegration {
    constructor() {
        this.providers = new Map();
        this.config = {
            bitcoin: {
                network: 'mainnet', // 'testnet' for development
                feeRate: 'medium',
                confirmations: 3
            },
            ethereum: {
                chainId: 1, // Mainnet
                gasPrice: 'standard',
                confirmations: 12
            },
            solana: {
                cluster: 'mainnet-beta',
                commitment: 'finalized'
            }
        };
        this.initialize();
    }

    async initialize() {
        try {
            await this.setupBitcoinProvider();
            await this.setupEthereumProvider();
            await this.setupSolanaProvider();
            console.log('🔗 Blockchain providers initialized');
        } catch (error) {
            console.error('Error initializing blockchain providers:', error);
        }
    }

    // --- Bitcoin Integration ---
    async setupBitcoinProvider() {
        // En producción: usar bibliotecas como bitcoinjs-lib
        this.providers.set('bitcoin', {
            type: 'bitcoin',
            connected: true,
            network: this.config.bitcoin.network
        });
    }

    async createBitcoinForwardContract(contractData) {
        const { amount, counterparty, executionDate, strikePrice } = contractData;
        
        // Crear script de contrato forward
        const script = this.generateBitcoinForwardScript({
            creatorPubkey: contractData.creatorWallet,
            counterpartyPubkey: counterparty,
            amount,
            executionTimestamp: new Date(executionDate).getTime() / 1000,
            strikePrice
        });

        // Crear transacción multisig
        const transaction = await this.createBitcoinMultisigTransaction(script, amount);
        
        return {
            scriptHash: script.hash,
            transaction: transaction.hex,
            address: script.address,
            redeemScript: script.redeemScript,
            estimatedFee: transaction.fee
        };
    }

    generateBitcoinForwardScript(params) {
        // Pseudocódigo de Bitcoin Script para contrato forward
        const script = `
            OP_IF
                // Ejecución en fecha acordada
                ${params.executionTimestamp} OP_CHECKLOCKTIMEVERIFY OP_DROP
                OP_DUP OP_HASH160 <oracle_pubkey_hash> OP_EQUALVERIFY OP_CHECKSIG
                OP_IF
                    // Precio actual >= strike price
                    <creator_pubkey> OP_CHECKSIG
                OP_ELSE
                    // Precio actual < strike price
                    <counterparty_pubkey> OP_CHECKSIG
                OP_ENDIF
            OP_ELSE
                // Cancelación antes de vencimiento (ambas firmas)
                OP_2 <creator_pubkey> <counterparty_pubkey> OP_2 OP_CHECKMULTISIG
            OP_ENDIF
        `;

        return {
            script,
            hash: this.hashScript(script),
            address: this.scriptToAddress(script),
            redeemScript: script
        };
    }

    async createBitcoinMultisigTransaction(script, amount) {
        // Simular creación de transacción
        return {
            hex: '0100000001...',
            fee: 0.00001,
            size: 250,
            inputs: [],
            outputs: []
        };
    }

    hashScript(script) {
        // Simular hash SHA256
        return `sha256_${Date.now()}`;
    }

    scriptToAddress(script) {
        // Convertir script a dirección P2WSH
        return `bc1q${Math.random().toString(36).substring(2, 32)}`;
    }

    // --- Ethereum Integration ---
    async setupEthereumProvider() {
        // En producción: usar web3.js o ethers.js
        this.providers.set('ethereum', {
            type: 'ethereum',
            connected: true,
            chainId: this.config.ethereum.chainId
        });
    }

    async deployEthereumForwardContract(contractData) {
        const contractCode = this.generateEthereumForwardContract(contractData);
        
        // Simular deploy de contrato
        const deployment = await this.deployContract(contractCode, contractData);
        
        return {
            contractAddress: deployment.address,
            transactionHash: deployment.txHash,
            gasUsed: deployment.gasUsed,
            abi: contractCode.abi
        };
    }

    generateEthereumForwardContract(params) {
        // Solidity contract para forward
        const solidityCode = `
        pragma solidity ^0.8.19;

        contract ForwardContract {
            address public creator;
            address public counterparty;
            uint256 public amount;
            uint256 public strikePrice;
            uint256 public executionDate;
            bool public executed;
            
            address public oracle;
            
            modifier onlyParties() {
                require(msg.sender == creator || msg.sender == counterparty, "Not authorized");
                _;
            }
            
            modifier onlyAfterExpiry() {
                require(block.timestamp >= executionDate, "Contract not yet expired");
                _;
            }
            
            constructor(
                address _counterparty,
                uint256 _amount,
                uint256 _strikePrice,
                uint256 _executionDate,
                address _oracle
            ) payable {
                require(msg.value == _amount, "Incorrect amount sent");
                creator = msg.sender;
                counterparty = _counterparty;
                amount = _amount;
                strikePrice = _strikePrice;
                executionDate = _executionDate;
                oracle = _oracle;
            }
            
            function execute(uint256 currentPrice) external onlyAfterExpiry {
                require(!executed, "Already executed");
                require(msg.sender == oracle, "Only oracle can execute");
                
                executed = true;
                
                if (currentPrice >= strikePrice) {
                    payable(creator).transfer(amount);
                } else {
                    payable(counterparty).transfer(amount);
                }
            }
            
            function emergencyCancel() external onlyParties {
                require(!executed, "Already executed");
                require(block.timestamp < executionDate, "Past execution date");
                
                executed = true;
                payable(creator).transfer(amount);
            }
        }
        `;

        return {
            sourceCode: solidityCode,
            bytecode: '0x608060405234801561001057600080fd5b50...',
            abi: [
                {
                    "inputs": [
                        {"internalType": "address", "name": "_counterparty", "type": "address"},
                        {"internalType": "uint256", "name": "_amount", "type": "uint256"},
                        {"internalType": "uint256", "name": "_strikePrice", "type": "uint256"},
                        {"internalType": "uint256", "name": "_executionDate", "type": "uint256"},
                        {"internalType": "address", "name": "_oracle", "type": "address"}
                    ],
                    "stateMutability": "payable",
                    "type": "constructor"
                },
                {
                    "inputs": [{"internalType": "uint256", "name": "currentPrice", "type": "uint256"}],
                    "name": "execute",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                }
            ]
        };
    }

    async deployContract(contractCode, params) {
        // Simular deploy
        return {
            address: `0x${Math.random().toString(16).substring(2, 42)}`,
            txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
            gasUsed: 150000
        };
    }

    // --- Solana Integration ---
    async setupSolanaProvider() {
        // En producción: usar @solana/web3.js
        this.providers.set('solana', {
            type: 'solana',
            connected: true,
            cluster: this.config.solana.cluster
        });
    }

    async createSolanaForwardProgram(contractData) {
        const programCode = this.generateSolanaForwardProgram(contractData);
        
        // Simular deploy de programa
        const deployment = await this.deploySolanaProgram(programCode);
        
        return {
            programId: deployment.programId,
            signature: deployment.signature,
            accounts: deployment.accounts
        };
    }

    generateSolanaForwardProgram(params) {
        // Rust code para programa Solana
        const rustCode = `
        use solana_program::{
            account_info::{next_account_info, AccountInfo},
            entrypoint,
            entrypoint::ProgramResult,
            pubkey::Pubkey,
            clock::Clock,
            sysvar::Sysvar,
        };

        entrypoint!(process_instruction);

        pub fn process_instruction(
            program_id: &Pubkey,
            accounts: &[AccountInfo],
            instruction_data: &[u8],
        ) -> ProgramResult {
            let accounts_iter = &mut accounts.iter();
            let contract_account = next_account_info(accounts_iter)?;
            let creator_account = next_account_info(accounts_iter)?;
            let counterparty_account = next_account_info(accounts_iter)?;
            let oracle_account = next_account_info(accounts_iter)?;

            match instruction_data[0] {
                0 => initialize_contract(contract_account, creator_account, counterparty_account),
                1 => execute_contract(contract_account, oracle_account),
                _ => Err(ProgramError::InvalidInstructionData),
            }
        }

        fn initialize_contract(
            contract_account: &AccountInfo,
            creator_account: &AccountInfo,
            counterparty_account: &AccountInfo,
        ) -> ProgramResult {
            // Initialize forward contract
            Ok(())
        }

        fn execute_contract(
            contract_account: &AccountInfo,
            oracle_account: &AccountInfo,
        ) -> ProgramResult {
            let clock = Clock::get()?;
            // Execute contract based on current price from oracle
            Ok(())
        }
        `;

        return {
            sourceCode: rustCode,
            programId: 'BitForward1111111111111111111111111111111',
            instructions: ['initialize', 'execute', 'cancel']
        };
    }

    async deploySolanaProgram(programCode) {
        // Simular deploy
        return {
            programId: programCode.programId,
            signature: `${Math.random().toString(36).substring(2, 44)}`,
            accounts: {
                contract: `${Math.random().toString(36).substring(2, 44)}`,
                escrow: `${Math.random().toString(36).substring(2, 44)}`
            }
        };
    }

    // --- Oracle Integration ---
    async getPriceFromOracle(asset, timestamp = null) {
        // Simular llamada a oracle de precios
        const mockPrices = {
            'BTC': 45000 + (Math.random() - 0.5) * 5000,
            'ETH': 3000 + (Math.random() - 0.5) * 500,
            'SOL': 100 + (Math.random() - 0.5) * 20
        };

        return {
            asset,
            price: mockPrices[asset.toUpperCase()] || 0,
            timestamp: timestamp || Date.now(),
            source: 'BitForward_Oracle_v1'
        };
    }

    // --- Transaction Monitoring ---
    async monitorTransaction(blockchain, txHash) {
        const provider = this.providers.get(blockchain);
        if (!provider) {
            throw new Error(`Provider for ${blockchain} not found`);
        }

        // Simular monitoreo de transacción
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    confirmed: true,
                    confirmations: 6,
                    blockHeight: Math.floor(Math.random() * 1000000),
                    status: 'success'
                });
            }, 2000);
        });
    }

    // --- Fee Estimation ---
    async estimateFees(blockchain, transactionData) {
        const feeEstimates = {
            bitcoin: {
                slow: 0.00001,
                medium: 0.00002,
                fast: 0.00005
            },
            ethereum: {
                slow: 0.001,
                medium: 0.002,
                fast: 0.005
            },
            solana: {
                slow: 0.000005,
                medium: 0.000005,
                fast: 0.000005
            }
        };

        return feeEstimates[blockchain] || { medium: 0.001 };
    }

    // --- Wallet Integration ---
    async connectWallet(blockchain, walletType = 'injected') {
        switch (blockchain) {
            case 'bitcoin':
                return await this.connectBitcoinWallet(walletType);
            case 'ethereum':
                return await this.connectEthereumWallet(walletType);
            case 'solana':
                return await this.connectSolanaWallet(walletType);
            default:
                throw new Error(`Wallet connection not supported for ${blockchain}`);
        }
    }

    async disconnectWallet(blockchain) {
        switch (blockchain) {
            case 'ethereum':
                return await this.disconnectEthereumWallet();
            case 'solana':
                return await this.disconnectSolanaWallet();
            case 'bitcoin':
                // Bitcoin wallets generalmente no tienen desconexión explícita
                return { disconnected: true };
            default:
                throw new Error(`Wallet disconnection not supported for ${blockchain}`);
        }
    }

    async disconnectEthereumWallet() {
        // MetaMask no tiene un método de desconexión oficial
        // La desconexión se hace desde la extensión del navegador
        if (typeof window !== 'undefined' && window.ethereum) {
            // Limpiar el estado local
            this.ethereumListenersSet = false;
            console.log('Ethereum wallet disconnected locally');
        }
        return { disconnected: true };
    }

    async disconnectSolanaWallet() {
        if (typeof window !== 'undefined' && window.solana) {
            try {
                await window.solana.disconnect();
                this.solanaListenersSet = false;
                console.log('Solana wallet disconnected');
                return { disconnected: true };
            } catch (error) {
                console.error('Error disconnecting Solana wallet:', error);
                throw new Error('Failed to disconnect wallet');
            }
        }
        return { disconnected: true };
    }

    // Handlers para eventos de wallet
    handleWalletDisconnect(blockchain) {
        console.log(`Wallet disconnected: ${blockchain}`);
        // Emitir evento personalizado para que la UI pueda reaccionar
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('walletDisconnected', {
                detail: { blockchain }
            }));
        }
    }

    handleAccountChange(blockchain, newAccount) {
        console.log(`Account changed on ${blockchain}: ${newAccount}`);
        // Emitir evento personalizado
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('walletAccountChanged', {
                detail: { blockchain, account: newAccount }
            }));
        }
    }

    handleChainChange(blockchain, chainId) {
        console.log(`Chain changed on ${blockchain}: ${chainId}`);
        // Emitir evento personalizado
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('walletChainChanged', {
                detail: { blockchain, chainId }
            }));
        }
    }

    // Método para verificar si una wallet está instalada
    isWalletInstalled(walletType) {
        if (typeof window === 'undefined') return false;
        
        switch (walletType) {
            case 'metamask':
                return !!window.ethereum;
            case 'phantom':
                return !!window.solana;
            default:
                return false;
        }
    }

    // Método para obtener el link de instalación de una wallet
    getWalletInstallUrl(walletType) {
        const urls = {
            'metamask': 'https://metamask.io/download/',
            'phantom': 'https://phantom.app/download'
        };
        return urls[walletType] || '';
    }

    // Método para cambiar de red en MetaMask
    async switchEthereumNetwork(chainId) {
        if (typeof window === 'undefined' || !window.ethereum) {
            throw new Error('MetaMask not available');
        }

        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId }]
            });
            return { switched: true, chainId };
        } catch (error) {
            // Error 4902 significa que la red no está agregada
            if (error.code === 4902) {
                // Intentar agregar la red
                return await this.addEthereumNetwork(chainId);
            }
            throw new Error(`Failed to switch network: ${error.message}`);
        }
    }

    // Método para agregar una red personalizada en MetaMask
    async addEthereumNetwork(chainId) {
        if (typeof window === 'undefined' || !window.ethereum) {
            throw new Error('MetaMask not available');
        }

        // Configuración de redes comunes
        const networkConfigs = {
            '0x1': {
                chainId: '0x1',
                chainName: 'Ethereum Mainnet',
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://mainnet.infura.io/v3/'],
                blockExplorerUrls: ['https://etherscan.io']
            },
            '0x5': {
                chainId: '0x5',
                chainName: 'Goerli Testnet',
                nativeCurrency: { name: 'Goerli ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://goerli.infura.io/v3/'],
                blockExplorerUrls: ['https://goerli.etherscan.io']
            },
            '0xaa36a7': {
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io']
            },
            '0x89': {
                chainId: '0x89',
                chainName: 'Polygon Mainnet',
                nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                rpcUrls: ['https://polygon-rpc.com/'],
                blockExplorerUrls: ['https://polygonscan.com']
            }
        };

        const config = networkConfigs[chainId];
        if (!config) {
            throw new Error(`Network configuration not found for chainId: ${chainId}`);
        }

        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [config]
            });
            return { added: true, chainId };
        } catch (error) {
            throw new Error(`Failed to add network: ${error.message}`);
        }
    }

    // Obtener información de la red actual de Ethereum
    async getEthereumNetworkInfo() {
        if (typeof window === 'undefined' || !window.ethereum) {
            throw new Error('MetaMask not available');
        }

        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const networkNames = {
                '0x1': 'Ethereum Mainnet',
                '0x5': 'Goerli Testnet',
                '0xaa36a7': 'Sepolia Testnet',
                '0x89': 'Polygon Mainnet',
                '0xa4b1': 'Arbitrum One',
                '0xa': 'Optimism'
            };

            return {
                chainId,
                name: networkNames[chainId] || 'Unknown Network'
            };
        } catch (error) {
            throw new Error(`Failed to get network info: ${error.message}`);
        }
    }

    async connectBitcoinWallet(walletType) {
        // Simular conexión a wallet Bitcoin
        return {
            connected: true,
            address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            balance: 0.1,
            walletType
        };
    }

    async connectEthereumWallet(walletType) {
        // Integración con MetaMask u otros wallets
        if (typeof window !== 'undefined' && window.ethereum) {
            try {
                // Solicitar acceso a las cuentas
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts'
                });
                
                if (!accounts || accounts.length === 0) {
                    throw new Error('No accounts found');
                }
                
                // Obtener el chainId actual
                const chainId = await window.ethereum.request({
                    method: 'eth_chainId'
                });
                
                // Obtener el balance
                let balance = 0;
                try {
                    const balanceWei = await window.ethereum.request({
                        method: 'eth_getBalance',
                        params: [accounts[0], 'latest']
                    });
                    // Convertir de Wei a ETH
                    balance = parseInt(balanceWei, 16) / 1e18;
                } catch (balanceError) {
                    console.warn('Could not fetch balance:', balanceError);
                }
                
                // Configurar listeners para cambios
                this.setupEthereumListeners();
                
                return {
                    connected: true,
                    address: accounts[0],
                    chainId: chainId,
                    balance: balance,
                    walletType: 'metamask',
                    provider: window.ethereum
                };
            } catch (error) {
                if (error.code === 4001) {
                    throw new Error('User rejected wallet connection');
                } else if (error.code === -32002) {
                    throw new Error('Connection request already pending. Please check MetaMask.');
                } else {
                    throw new Error(`Failed to connect: ${error.message}`);
                }
            }
        }
        
        // Fallback simulado para desarrollo
        console.warn('MetaMask not detected, using simulated wallet');
        return {
            connected: true,
            address: `0x${Math.random().toString(16).substring(2, 42)}`,
            balance: 1.5,
            walletType,
            simulated: true
        };
    }

    setupEthereumListeners() {
        if (typeof window !== 'undefined' && window.ethereum && !this.ethereumListenersSet) {
            // Detectar cambios de cuenta
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log('Accounts changed:', accounts);
                if (accounts.length === 0) {
                    // Usuario desconectó la wallet
                    this.handleWalletDisconnect('ethereum');
                } else {
                    // Usuario cambió de cuenta
                    this.handleAccountChange('ethereum', accounts[0]);
                }
            });
            
            // Detectar cambios de red
            window.ethereum.on('chainChanged', (chainId) => {
                console.log('Chain changed:', chainId);
                this.handleChainChange('ethereum', chainId);
                // Recargar la página es recomendado por MetaMask
                window.location.reload();
            });
            
            // Detectar desconexión
            window.ethereum.on('disconnect', (error) => {
                console.log('Ethereum wallet disconnected:', error);
                this.handleWalletDisconnect('ethereum');
            });
            
            this.ethereumListenersSet = true;
        }
    }

    async connectSolanaWallet(walletType) {
        // Integración con Phantom u otros wallets Solana
        if (typeof window !== 'undefined' && window.solana) {
            try {
                // Verificar si es Phantom
                if (window.solana.isPhantom) {
                    console.log('Phantom wallet detected');
                }
                
                // Conectar a la wallet
                const response = await window.solana.connect();
                
                if (!response || !response.publicKey) {
                    throw new Error('Failed to get wallet public key');
                }
                
                // Obtener el balance
                let balance = 0;
                try {
                    // En producción, usar @solana/web3.js para obtener balance real
                    // const connection = new Connection(clusterApiUrl('mainnet-beta'));
                    // const balanceLamports = await connection.getBalance(response.publicKey);
                    // balance = balanceLamports / 1e9;
                    balance = 25.5; // Simulado por ahora
                } catch (balanceError) {
                    console.warn('Could not fetch balance:', balanceError);
                }
                
                // Configurar listeners para cambios
                this.setupSolanaListeners();
                
                return {
                    connected: true,
                    address: response.publicKey.toString(),
                    balance: balance,
                    walletType: 'phantom',
                    provider: window.solana
                };
            } catch (error) {
                if (error.code === 4001 || error.message.includes('User rejected')) {
                    throw new Error('User rejected wallet connection');
                } else if (error.code === -32002) {
                    throw new Error('Connection request already pending. Please check Phantom.');
                } else {
                    throw new Error(`Failed to connect: ${error.message}`);
                }
            }
        }

        // Fallback simulado para desarrollo
        console.warn('Phantom wallet not detected, using simulated wallet');
        return {
            connected: true,
            address: `${Math.random().toString(36).substring(2, 44)}`,
            balance: 25.5,
            walletType,
            simulated: true
        };
    }

    setupSolanaListeners() {
        if (typeof window !== 'undefined' && window.solana && !this.solanaListenersSet) {
            // Detectar cambios de cuenta
            window.solana.on('accountChanged', (publicKey) => {
                console.log('Solana account changed:', publicKey);
                if (publicKey) {
                    this.handleAccountChange('solana', publicKey.toString());
                } else {
                    // Usuario desconectó la wallet
                    this.handleWalletDisconnect('solana');
                }
            });
            
            // Detectar desconexión
            window.solana.on('disconnect', () => {
                console.log('Solana wallet disconnected');
                this.handleWalletDisconnect('solana');
            });
            
            this.solanaListenersSet = true;
        }
    }

    // --- Utilities ---
    isValidAddress(address, blockchain) {
        const patterns = {
            bitcoin: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
            ethereum: /^0x[a-fA-F0-9]{40}$/,
            solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
        };

        return patterns[blockchain]?.test(address) || false;
    }

    getExplorerUrl(blockchain, txHash) {
        const explorers = {
            bitcoin: `https://blockstream.info/tx/${txHash}`,
            ethereum: `https://etherscan.io/tx/${txHash}`,
            solana: `https://solscan.io/tx/${txHash}`
        };

        return explorers[blockchain];
    }
}

// Price Oracle Service
class BitForwardOracle {
    constructor() {
        this.priceFeeds = new Map();
        this.subscribers = new Map();
        this.updateInterval = null;
        this.initialize();
    }

    initialize() {
        this.startPriceUpdates();
        console.log('📊 BitForward Oracle initialized');
    }

    startPriceUpdates() {
        this.updateInterval = setInterval(async () => {
            await this.updatePrices();
        }, 30000); // Actualizar cada 30 segundos
    }

    async updatePrices() {
        const assets = ['BTC', 'ETH', 'SOL'];
        
        for (const asset of assets) {
            const price = await this.fetchPrice(asset);
            this.priceFeeds.set(asset, {
                price,
                timestamp: Date.now(),
                change24h: (Math.random() - 0.5) * 0.1 // ±10%
            });
            
            // Notificar a suscriptores
            this.notifySubscribers(asset, price);
        }
    }

    async fetchPrice(asset) {
        // En producción: integrar con APIs reales como CoinGecko, Chainlink, etc.
        const mockPrices = {
            'BTC': 45000 + (Math.random() - 0.5) * 2000,
            'ETH': 3000 + (Math.random() - 0.5) * 200,
            'SOL': 100 + (Math.random() - 0.5) * 10
        };

        return mockPrices[asset] || 0;
    }

    subscribe(asset, callback) {
        if (!this.subscribers.has(asset)) {
            this.subscribers.set(asset, []);
        }
        this.subscribers.get(asset).push(callback);
    }

    notifySubscribers(asset, price) {
        const callbacks = this.subscribers.get(asset) || [];
        callbacks.forEach(callback => {
            try {
                callback(price, asset);
            } catch (error) {
                console.error('Error in price subscriber:', error);
            }
        });
    }

    getPrice(asset) {
        return this.priceFeeds.get(asset.toUpperCase());
    }

    getAllPrices() {
        return Object.fromEntries(this.priceFeeds);
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Exportar para uso
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BlockchainIntegration,
        BitForwardOracle
    };
}

if (typeof window !== 'undefined') {
    window.BlockchainIntegration = BlockchainIntegration;
    window.BitForwardOracle = BitForwardOracle;
}

console.log('🔗 BitForward Blockchain Integration loaded');
