/**
 * @title BitForward Web3 Integration
 * @author BitForward Team - Audited by Senior DeFi Architect
 * @description Integración completa con contratos inteligentes
 */

class BitForwardWeb3 {
    constructor() {
        this.web3 = null;
        this.accounts = null;
        this.contracts = {};
        this.networkId = null;
        
        // Contract addresses (se actualizan después del deploy)
        this.contractAddresses = {
            31337: { // Hardhat local
                vault: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
                forwardEngine: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
                oracle: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
                wbtc: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9"
            },
            31: { // RSK Testnet
                vault: "",
                forwardEngine: "",
                oracle: "",
                wbtc: ""
            },
            30: { // RSK Mainnet
                vault: "",
                forwardEngine: "",
                oracle: "",
                wbtc: ""
            }
        };
        
        // ABIs simplificados para interacción
        this.abis = {
            vault: [
                "function deposit(uint256 assets, address receiver) external returns (uint256 shares)",
                "function withdraw(uint256 assets, address receiver, address owner) external returns (uint256 shares)",
                "function totalAssets() external view returns (uint256)",
                "function getVaultMetrics() external view returns (tuple(uint256 totalDeposits, uint256 totalShares, uint256 utilization, uint256 apy))",
                "function balanceOf(address account) external view returns (uint256)",
                "function asset() external view returns (address)"
            ],
            forwardEngine: [
                "function openForward(uint256 collateral, uint256 notionalUSD, uint256 expiry, uint256 leverage, bool isLong, uint256 targetPrice) external returns (uint256 forwardId)",
                "function executeForward(uint256 forwardId) external returns (int256 pnl)",
                "function closePosition(uint256 forwardId) external returns (int256 pnl)",
                "function liquidateForward(uint256 forwardId) external returns (uint256 liquidationReward)",
                "function getForward(uint256 forwardId) external view returns (tuple(uint256 id, address user, uint256 collateralAmount, uint256 notionalUSD, uint256 entryPrice, uint256 targetPrice, uint256 expiryTimestamp, uint256 leverageRatio, bool isLong, uint8 status, uint256 createdAt, uint256 executedAt))",
                "function calculatePnL(uint256 forwardId) external view returns (int256 currentPnl)",
                "function getUserActiveForwards(address user) external view returns (uint256[] memory)",
                "function getProtocolStats() external view returns (uint256 totalValueLocked, uint256 activeContracts, uint256 totalVolume)",
                "function isLiquidable(uint256 forwardId) external view returns (bool liquidable, uint256 healthRatio)"
            ],
            oracle: [
                "function getLatestPrice() external view returns (uint256 price)",
                "function isHealthy() external view returns (bool)",
                "function setPrice(uint256 price, uint256 confidence) external",
                "function simulatePriceMovement(uint256 volatilityBps, bool isPositive) external"
            ],
            wbtc: [
                "function balanceOf(address account) external view returns (uint256)",
                "function approve(address spender, uint256 amount) external returns (bool)",
                "function allowance(address owner, address spender) external view returns (uint256)",
                "function transfer(address to, uint256 amount) external returns (bool)",
                "function decimals() external view returns (uint8)",
                "function mint(address to, uint256 amount) external"
            ]
        };
    }
    
    async init() {
        try {
            // Detectar Web3 provider
            if (typeof window.ethereum !== 'undefined') {
                this.web3 = new ethers.BrowserProvider(window.ethereum);
                console.log('✅ Web3 provider detected');
            } else {
                console.warn('⚠️ No Web3 provider found');
                return false;
            }
            
            // Obtener network
            const network = await this.web3.getNetwork();
            this.networkId = Number(network.chainId);
            console.log('🌐 Network ID:', this.networkId);
            
            // Verificar si tenemos contratos para esta red
            if (!this.contractAddresses[this.networkId]) {
                console.warn('⚠️ Contracts not deployed on this network');
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('❌ Web3 initialization failed:', error);
            return false;
        }
    }
    
    async connectWallet() {
        try {
            // Solicitar conexión
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            const signer = await this.web3.getSigner();
            this.accounts = [await signer.getAddress()];
            
            console.log('🔗 Wallet connected:', this.accounts[0]);
            
            // Inicializar contratos
            await this.initContracts();
            
            return {
                success: true,
                address: this.accounts[0]
            };
        } catch (error) {
            console.error('❌ Wallet connection failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async initContracts() {
        try {
            const signer = await this.web3.getSigner();
            const addresses = this.contractAddresses[this.networkId];
            
            // Inicializar contratos con signer
            this.contracts.vault = new ethers.Contract(addresses.vault, this.abis.vault, signer);
            this.contracts.forwardEngine = new ethers.Contract(addresses.forwardEngine, this.abis.forwardEngine, signer);
            this.contracts.oracle = new ethers.Contract(addresses.oracle, this.abis.oracle, signer);
            this.contracts.wbtc = new ethers.Contract(addresses.wbtc, this.abis.wbtc, signer);
            
            console.log('📋 Contracts initialized');
        } catch (error) {
            console.error('❌ Contract initialization failed:', error);
        }
    }
    
    // ========== VAULT FUNCTIONS ==========
    
    async getVaultMetrics() {
        try {
            const metrics = await this.contracts.vault.getVaultMetrics();
            return {
                totalDeposits: ethers.formatUnits(metrics.totalDeposits, 8),
                totalShares: ethers.formatUnits(metrics.totalShares, 18),
                utilization: (Number(metrics.utilization) / 100).toFixed(2),
                apy: (Number(metrics.apy) / 100).toFixed(2)
            };
        } catch (error) {
            console.error('❌ Error getting vault metrics:', error);
            return null;
        }
    }
    
    async depositToVault(amount) {
        try {
            const amountWei = ethers.parseUnits(amount.toString(), 8);
            
            // Aprobar tokens primero
            const approveTx = await this.contracts.wbtc.approve(
                await this.contracts.vault.getAddress(), 
                amountWei
            );
            await approveTx.wait();
            
            // Depositar
            const depositTx = await this.contracts.vault.deposit(amountWei, this.accounts[0]);
            const receipt = await depositTx.wait();
            
            return {
                success: true,
                txHash: receipt.hash,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            console.error('❌ Deposit failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // ========== FORWARD ENGINE FUNCTIONS ==========
    
    async createForward(params) {
        try {
            const {
                collateral,
                notionalUSD,
                expiryDays,
                leverage,
                isLong,
                targetPrice = 0
            } = params;
            
            const collateralWei = ethers.parseUnits(collateral.toString(), 8);
            const notionalWei = ethers.parseUnits(notionalUSD.toString(), 8);
            const expiry = Math.floor(Date.now() / 1000) + (expiryDays * 86400);
            const leverageMultiplied = leverage * 100; // 2x -> 200
            const targetPriceWei = targetPrice ? ethers.parseUnits(targetPrice.toString(), 8) : 0;
            
            // Aprobar colateral
            const approveTx = await this.contracts.wbtc.approve(
                await this.contracts.forwardEngine.getAddress(),
                collateralWei
            );
            await approveTx.wait();
            
            // Crear forward
            const tx = await this.contracts.forwardEngine.openForward(
                collateralWei,
                notionalWei,
                expiry,
                leverageMultiplied,
                isLong,
                targetPriceWei
            );
            
            const receipt = await tx.wait();
            
            // Extraer forward ID del evento
            const event = receipt.logs.find(log => {
                try {
                    const parsed = this.contracts.forwardEngine.interface.parseLog(log);
                    return parsed.name === 'ForwardOpened';
                } catch {
                    return false;
                }
            });
            
            const forwardId = event ? 
                this.contracts.forwardEngine.interface.parseLog(event).args.forwardId :
                null;
            
            return {
                success: true,
                txHash: receipt.hash,
                forwardId: forwardId ? Number(forwardId) : null,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            console.error('❌ Forward creation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async getUserForwards() {
        try {
            const forwardIds = await this.contracts.forwardEngine.getUserActiveForwards(this.accounts[0]);
            const forwards = [];
            
            for (const id of forwardIds) {
                const forward = await this.contracts.forwardEngine.getForward(id);
                const pnl = await this.contracts.forwardEngine.calculatePnL(id);
                
                forwards.push({
                    id: Number(forward.id),
                    collateralAmount: ethers.formatUnits(forward.collateralAmount, 8),
                    notionalUSD: ethers.formatUnits(forward.notionalUSD, 8),
                    entryPrice: ethers.formatUnits(forward.entryPrice, 8),
                    leverage: Number(forward.leverageRatio) / 100,
                    isLong: forward.isLong,
                    status: Number(forward.status),
                    currentPnL: ethers.formatUnits(pnl, 8),
                    expiryTimestamp: Number(forward.expiryTimestamp)
                });
            }
            
            return forwards;
        } catch (error) {
            console.error('❌ Error getting user forwards:', error);
            return [];
        }
    }
    
    async executeForward(forwardId) {
        try {
            const tx = await this.contracts.forwardEngine.executeForward(forwardId);
            const receipt = await tx.wait();
            
            return {
                success: true,
                txHash: receipt.hash,
                gasUsed: receipt.gasUsed.toString()
            };
        } catch (error) {
            console.error('❌ Forward execution failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // ========== ORACLE FUNCTIONS ==========
    
    async getCurrentPrice() {
        try {
            const price = await this.contracts.oracle.getLatestPrice();
            return ethers.formatUnits(price, 8);
        } catch (error) {
            console.error('❌ Error getting price:', error);
            return "0";
        }
    }
    
    async simulatePrice(volatility, isPositive) {
        try {
            const tx = await this.contracts.oracle.simulatePriceMovement(
                volatility * 100, // Convert to basis points
                isPositive
            );
            await tx.wait();
            return true;
        } catch (error) {
            console.error('❌ Price simulation failed:', error);
            return false;
        }
    }
    
    // ========== TOKEN FUNCTIONS ==========
    
    async getWBTCBalance() {
        try {
            const balance = await this.contracts.wbtc.balanceOf(this.accounts[0]);
            return ethers.formatUnits(balance, 8);
        } catch (error) {
            console.error('❌ Error getting WBTC balance:', error);
            return "0";
        }
    }
    
    async mintTestWBTC(amount) {
        try {
            const amountWei = ethers.parseUnits(amount.toString(), 8);
            const tx = await this.contracts.wbtc.mint(this.accounts[0], amountWei);
            await tx.wait();
            return true;
        } catch (error) {
            console.error('❌ WBTC minting failed:', error);
            return false;
        }
    }
    
    // ========== PROTOCOL STATS ==========
    
    async getProtocolStats() {
        try {
            const stats = await this.contracts.forwardEngine.getProtocolStats();
            return {
                totalValueLocked: ethers.formatUnits(stats.totalValueLocked, 8),
                activeContracts: Number(stats.activeContracts),
                totalVolume: ethers.formatUnits(stats.totalVolume, 8)
            };
        } catch (error) {
            console.error('❌ Error getting protocol stats:', error);
            return {
                totalValueLocked: "0",
                activeContracts: 0,
                totalVolume: "0"
            };
        }
    }
}

// Instancia global
window.BitForwardWeb3 = new BitForwardWeb3();
