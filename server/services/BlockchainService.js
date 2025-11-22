const { ethers } = require('ethers');
const WebSocket = require('ws');
const winston = require('winston');

/**
 * BitForward Blockchain Service
 * Implementa la arquitectura de middleware propuesta por el auditor senior
 * Maneja la interacción con smart contracts y eventos blockchain
 */
class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contracts = {};
    this.eventListeners = new Map();
    this.wsServer = null;

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      transports: [
        new winston.transports.File({ filename: 'blockchain.log' }),
        new winston.transports.Console(),
      ],
    });
  }

  validateConfig() {
    const issues = [];
    const rpcUrl = process.env.ETHEREUM_RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;

    if (!rpcUrl || rpcUrl.includes('your-api-key')) {
      issues.push('ETHEREUM_RPC_URL is missing or still using the placeholder');
    }

    const sanitizedKey = (privateKey || '').replace(/^0x/, '');
    if (!sanitizedKey || /^0+$/.test(sanitizedKey)) {
      issues.push('PRIVATE_KEY is missing or still using the placeholder');
    }

    return issues;
  }

  async initialize() {
    try {
      const configIssues = this.validateConfig();
      if (configIssues.length) {
        throw new Error(`Blockchain configuration invalid: ${configIssues.join('; ')}`);
      }

      // Conectar al provider (Ethereum mainnet/testnet)
      this.provider = new ethers.JsonRpcProvider(
        process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/your-api-key'
      );

      // Configurar wallet (en producción usar HSM/KMS)
      this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);

      // Inicializar contratos
      await this.initializeContracts();

      // Configurar listeners de eventos
      await this.setupEventListeners();

      // Inicializar WebSocket server
      if (process.env.BLOCKCHAIN_WS_ENABLED === 'true') {
        this.initializeWebSocket();
      } else {
        this.logger.info(
          'Blockchain WebSocket server disabled (set BLOCKCHAIN_WS_ENABLED=true to enable)'
        );
      }

      this.logger.info('BlockchainService initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize BlockchainService:', error);
      throw error;
    }
  }

  async initializeContracts() {
    // ABIs simplificados (en producción cargar desde archivos compilados)
    const vaultABI = [
      'function depositAsset(address asset, uint256 amount)',
      'function withdrawAsset(address asset, uint256 amount, address recipient)',
      'function executeStrategy(address adapter, bytes calldata callData)',
      'function getAssetBalance(address asset) view returns (uint256)',
      'function getVaultInfo() view returns (uint256 tvl, uint256 supportedAssetCount, uint256 authorizedAdapterCount)',
      'event AssetDeposited(address indexed asset, uint256 amount, address indexed depositor)',
      'event StrategyExecuted(address indexed adapter, bytes callData, uint256 gasUsed)',
    ];

    const strategyExecutorABI = [
      'function executeHedge(address assetIn, address assetOut, uint256 amount, uint256 minAmountOut) returns (uint256)',
      'function openCollateralizedLoan(address collateralAsset, address debtAsset, uint256 collateralAmount, uint256 debtAmount) returns (uint256)',
      'function closeLoan(uint256 loanId)',
      'function getLoanHealth(uint256 loanId) view returns (uint256)',
      'function getLoanInfo(uint256 loanId) view returns (tuple(address,address,uint256,uint256,uint256,bool))',
      'function getActiveLoans() view returns (uint256[])',
      'event HedgeExecuted(address indexed assetIn, address indexed assetOut, uint256 amountIn, uint256 amountOut, address indexed user)',
      'event LoanOpened(uint256 indexed loanId, address indexed collateralAsset, address indexed debtAsset, uint256 collateralAmount, uint256 debtAmount)',
    ];

    // Direcciones de contratos (configurables por entorno)
    const VAULT_ADDRESS = process.env.VAULT_ADDRESS || '0x1234567890123456789012345678901234567890';
    const STRATEGY_EXECUTOR_ADDRESS =
      process.env.STRATEGY_EXECUTOR_ADDRESS || '0x2345678901234567890123456789012345678901';

    this.contracts.vault = new ethers.Contract(VAULT_ADDRESS, vaultABI, this.wallet);
    this.contracts.strategyExecutor = new ethers.Contract(
      STRATEGY_EXECUTOR_ADDRESS,
      strategyExecutorABI,
      this.wallet
    );

    this.logger.info('Smart contracts initialized');
  }

  async setupEventListeners() {
    // Escuchar eventos del Vault
    this.contracts.vault.on('AssetDeposited', (asset, amount, depositor, event) => {
      this.handleVaultEvent('AssetDeposited', { asset, amount, depositor }, event);
    });

    this.contracts.vault.on('StrategyExecuted', (adapter, callData, gasUsed, event) => {
      this.handleVaultEvent('StrategyExecuted', { adapter, callData, gasUsed }, event);
    });

    // Escuchar eventos del Strategy Executor
    this.contracts.strategyExecutor.on(
      'HedgeExecuted',
      (assetIn, assetOut, amountIn, amountOut, user, event) => {
        this.handleStrategyEvent(
          'HedgeExecuted',
          { assetIn, assetOut, amountIn, amountOut, user },
          event
        );
      }
    );

    this.contracts.strategyExecutor.on(
      'LoanOpened',
      (loanId, collateralAsset, debtAsset, collateralAmount, debtAmount, event) => {
        this.handleStrategyEvent(
          'LoanOpened',
          { loanId, collateralAsset, debtAsset, collateralAmount, debtAmount },
          event
        );
      }
    );

    this.logger.info('Event listeners configured');
  }

  handleVaultEvent(eventName, data, event) {
    const eventData = {
      type: 'vault',
      name: eventName,
      data: data,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      timestamp: Date.now(),
    };

    this.logger.info(`Vault event: ${eventName}`, eventData);
    this.broadcastToClients(eventData);
  }

  handleStrategyEvent(eventName, data, event) {
    const eventData = {
      type: 'strategy',
      name: eventName,
      data: data,
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      timestamp: Date.now(),
    };

    this.logger.info(`Strategy event: ${eventName}`, eventData);
    this.broadcastToClients(eventData);
  }

  initializeWebSocket() {
    const wsPort = process.env.WS_PORT || 8080;
    const requiredToken = process.env.BLOCKCHAIN_WS_TOKEN;
    this.wsServer = new WebSocket.Server({ port: wsPort });

    this.wsServer.on('connection', (ws, request) => {
      // Autenticación simple por token en la primer conexión (querystring ?token=)
      try {
        const url = request?.url || '';
        const parsedToken = new URL(`http://localhost${url}`).searchParams.get('token');

        if (!requiredToken || parsedToken !== requiredToken) {
          this.logger.warn('WebSocket connection rejected: missing/invalid token');
          ws.close(4401, 'Unauthorized');
          return;
        }
      } catch (error) {
        this.logger.warn('WebSocket connection rejected (token parse failed)', {
          error: error.message,
        });
        ws.close(4401, 'Unauthorized');
        return;
      }

      this.logger.info('Client connected to WebSocket');

      ws.on('message', message => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          this.logger.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.logger.info('Client disconnected from WebSocket');
      });
    });

    this.logger.info(`WebSocket server started on port ${wsPort} (token protected)`);
  }

  handleWebSocketMessage(ws, data) {
    // Manejar mensajes del cliente (subscripciones a eventos específicos, etc.)
    if (data.type === 'subscribe') {
      // Implementar lógica de suscripción
      ws.send(JSON.stringify({ type: 'subscription_confirmed', topic: data.topic }));
    }
  }

  broadcastToClients(data) {
    if (this.wsServer) {
      this.wsServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }
  }

  // ============ API METHODS ============

  async getVaultBalance(assetAddress) {
    try {
      const balance = await this.contracts.vault.getAssetBalance(assetAddress);
      return { success: true, balance: balance.toString() };
    } catch (error) {
      this.logger.error('Error getting vault balance:', error);
      return { success: false, error: error.message };
    }
  }

  async getVaultInfo() {
    try {
      const [tvl, supportedAssetCount, authorizedAdapterCount] =
        await this.contracts.vault.getVaultInfo();
      return {
        success: true,
        data: {
          totalValueLocked: tvl.toString(),
          supportedAssetCount: supportedAssetCount.toString(),
          authorizedAdapterCount: authorizedAdapterCount.toString(),
        },
      };
    } catch (error) {
      this.logger.error('Error getting vault info:', error);
      return { success: false, error: error.message };
    }
  }

  async executeHedge(assetIn, assetOut, amount, minAmountOut) {
    try {
      // Optimizar gas fee
      const gasPrice = await this.optimizeGasPrice();

      const tx = await this.contracts.strategyExecutor.executeHedge(
        assetIn,
        assetOut,
        amount,
        minAmountOut,
        { gasPrice }
      );

      this.logger.info(`Hedge transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      this.logger.error('Error executing hedge:', error);
      return { success: false, error: error.message };
    }
  }

  async openLoan(collateralAsset, debtAsset, collateralAmount, debtAmount) {
    try {
      const gasPrice = await this.optimizeGasPrice();

      const tx = await this.contracts.strategyExecutor.openCollateralizedLoan(
        collateralAsset,
        debtAsset,
        collateralAmount,
        debtAmount,
        { gasPrice }
      );

      const receipt = await tx.wait();

      // Extraer loan ID del evento
      const loanOpenedEvent = receipt.logs.find(
        log =>
          log.topics[0] === this.contracts.strategyExecutor.interface.getEventTopic('LoanOpened')
      );

      const decodedEvent = this.contracts.strategyExecutor.interface.parseLog(loanOpenedEvent);
      const loanId = decodedEvent.args.loanId;

      return {
        success: true,
        loanId: loanId.toString(),
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      this.logger.error('Error opening loan:', error);
      return { success: false, error: error.message };
    }
  }

  async getLoanInfo(loanId) {
    try {
      const loanData = await this.contracts.strategyExecutor.getLoanInfo(loanId);
      const healthFactor = await this.contracts.strategyExecutor.getLoanHealth(loanId);

      return {
        success: true,
        data: {
          collateralAsset: loanData[0],
          debtAsset: loanData[1],
          collateralAmount: loanData[2].toString(),
          debtAmount: loanData[3].toString(),
          timestamp: loanData[4].toString(),
          isActive: loanData[5],
          healthFactor: healthFactor.toString(),
        },
      };
    } catch (error) {
      this.logger.error('Error getting loan info:', error);
      return { success: false, error: error.message };
    }
  }

  async getActiveLoans() {
    try {
      const loanIds = await this.contracts.strategyExecutor.getActiveLoans();
      return {
        success: true,
        data: loanIds.map(id => id.toString()),
      };
    } catch (error) {
      this.logger.error('Error getting active loans:', error);
      return { success: false, error: error.message };
    }
  }

  async optimizeGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();
      // Usar el gas price recomendado o un 10% más para prioridad
      return (feeData.gasPrice * 110n) / 100n;
    } catch (error) {
      this.logger.error('Error optimizing gas price:', error);
      // Fallback a gas price manual
      return ethers.parseUnits('20', 'gwei');
    }
  }

  async getTransactionStatus(txHash) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      return {
        success: true,
        status: receipt ? (receipt.status === 1 ? 'success' : 'failed') : 'pending',
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed?.toString(),
      };
    } catch (error) {
      this.logger.error('Error getting transaction status:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = BlockchainService;
