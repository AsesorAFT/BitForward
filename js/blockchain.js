/**
 * BitForward Blockchain Integration v2.0
 * Integración real con blockchains y smart contracts
 */

class BitForwardBlockchain {
  constructor() {
    this.contracts = new Map();
    this.providers = new Map();
    this.networks = new Map();
    this.cache = new Map();

    this.initializeNetworks();
    this.initializeProviders();
  }

  initializeNetworks() {
    // Ethereum networks
    this.networks.set('ethereum', {
      mainnet: {
        chainId: 1,
        name: 'Ethereum Mainnet',
        rpc: 'https://mainnet.infura.io/v3/',
        explorer: 'https://etherscan.io',
        currency: { symbol: 'ETH', decimals: 18 }
      },
      goerli: {
        chainId: 5,
        name: 'Goerli Testnet',
        rpc: 'https://goerli.infura.io/v3/',
        explorer: 'https://goerli.etherscan.io',
        currency: { symbol: 'ETH', decimals: 18 }
      }
    });

    // Solana networks
    this.networks.set('solana', {
      mainnet: {
        name: 'Solana Mainnet',
        rpc: 'https://api.mainnet-beta.solana.com',
        explorer: 'https://solscan.io',
        currency: { symbol: 'SOL', decimals: 9 }
      },
      devnet: {
        name: 'Solana Devnet',
        rpc: 'https://api.devnet.solana.com',
        explorer: 'https://solscan.io',
        currency: { symbol: 'SOL', decimals: 9 }
      }
    });

    // Bitcoin networks (via API)
    this.networks.set('bitcoin', {
      mainnet: {
        name: 'Bitcoin Mainnet',
        api: 'https://blockstream.info/api',
        explorer: 'https://blockstream.info',
        currency: { symbol: 'BTC', decimals: 8 }
      },
      testnet: {
        name: 'Bitcoin Testnet',
        api: 'https://blockstream.info/testnet/api',
        explorer: 'https://blockstream.info/testnet',
        currency: { symbol: 'tBTC', decimals: 8 }
      }
    });
  }

  async initializeProviders() {
    // Initialize Web3 providers based on available wallets
    if (typeof window.ethereum !== 'undefined') {
      const { ethers } = await import('https://cdn.skypack.dev/ethers@5.7.2');
      this.providers.set('ethereum', new ethers.providers.Web3Provider(window.ethereum));
    }

    if (typeof window.solana !== 'undefined') {
      // Solana Web3.js would be imported here
      console.log('Solana provider available');
    }
  }

  // === Contract Management ===

  async deployContract(blockchain, contractType, params) {
    switch (blockchain) {
      case 'ethereum':
        return await this.deployEthereumContract(contractType, params);
      case 'solana':
        return await this.deploySolanaContract(contractType, params);
      default:
        throw new Error(`Unsupported blockchain: ${blockchain}`);
    }
  }

  async deployEthereumContract(contractType, params) {
    const provider = this.providers.get('ethereum');
    if (!provider) {
      throw new Error('Ethereum provider not available');
    }

    const signer = provider.getSigner();

    // Contract ABI and bytecode would be imported here
    const contractABI = this.getContractABI(contractType);
    const contractBytecode = this.getContractBytecode(contractType);

    const { ethers } = await import('https://cdn.skypack.dev/ethers@5.7.2');
    const ContractFactory = new ethers.ContractFactory(contractABI, contractBytecode, signer);

    const contract = await ContractFactory.deploy(...params);
    await contract.deployed();

    this.contracts.set(`ethereum_${contractType}`, {
      address: contract.address,
      contract: contract,
      abi: contractABI
    });

    return {
      address: contract.address,
      transactionHash: contract.deployTransaction.hash,
      blockchain: 'ethereum'
    };
  }

  async deploySolanaContract(contractType, params) {
    // Solana contract deployment would be implemented here
    throw new Error('Solana contract deployment not yet implemented');
  }

  // === Transaction Management ===

  async createForwardContract(blockchain, contractParams) {
    const cacheKey = `create_forward_${blockchain}_${JSON.stringify(contractParams)}`;

    try {
      switch (blockchain) {
        case 'ethereum':
          return await this.createEthereumForward(contractParams);
        case 'solana':
          return await this.createSolanaForward(contractParams);
        case 'bitcoin':
          return await this.createBitcoinForward(contractParams);
        default:
          throw new Error(`Unsupported blockchain: ${blockchain}`);
      }
    } catch (error) {
      console.error(`Error creating forward contract on ${blockchain}:`, error);
      throw error;
    }
  }

  async createEthereumForward(params) {
    const contract = this.contracts.get('ethereum_BitForwardContract');
    if (!contract) {
      throw new Error('BitForward contract not deployed on Ethereum');
    }

    const {
      seller,
      underlying,
      amount,
      strikePrice,
      duration,
      collateralAmount
    } = params;

    const tx = await contract.contract.createForwardContract(
      seller,
      underlying,
      ethers.utils.parseEther(amount.toString()),
      ethers.utils.parseEther(strikePrice.toString()),
      duration,
      {
        value: ethers.utils.parseEther(collateralAmount.toString())
      }
    );

    const receipt = await tx.wait();

    // Parse events to get contract ID
    const event = receipt.events?.find(e => e.event === 'ForwardCreated');
    const contractId = event?.args?.contractId?.toString();

    return {
      contractId,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      blockchain: 'ethereum'
    };
  }

  async createSolanaForward(params) {
    // Solana forward contract creation would be implemented here
    throw new Error('Solana forward contracts not yet implemented');
  }

  async createBitcoinForward(params) {
    // Bitcoin-based forward contract (using multisig or other mechanism)
    throw new Error('Bitcoin forward contracts not yet implemented');
  }

  // === Contract Queries ===

  async getForwardContract(blockchain, contractId) {
    const cacheKey = `contract_${blockchain}_${contractId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
      return cached.data;
    }

    let contractData;

    switch (blockchain) {
      case 'ethereum':
        contractData = await this.getEthereumContract(contractId);
        break;
      case 'solana':
        contractData = await this.getSolanaContract(contractId);
        break;
      default:
        throw new Error(`Unsupported blockchain: ${blockchain}`);
    }

    this.cache.set(cacheKey, {
      data: contractData,
      timestamp: Date.now()
    });

    return contractData;
  }

  async getEthereumContract(contractId) {
    const contract = this.contracts.get('ethereum_BitForwardContract');
    if (!contract) {
      throw new Error('BitForward contract not available');
    }

    const rawContract = await contract.contract.getContract(contractId);

    return {
      id: rawContract.id.toString(),
      buyer: rawContract.buyer,
      seller: rawContract.seller,
      underlying: rawContract.underlying,
      amount: ethers.utils.formatEther(rawContract.amount),
      strikePrice: ethers.utils.formatEther(rawContract.strikePrice),
      expiryTime: new Date(rawContract.expiryTime.toNumber() * 1000),
      createdAt: new Date(rawContract.createdAt.toNumber() * 1000),
      status: this.parseContractStatus(rawContract.status),
      buyerCollateral: ethers.utils.formatEther(rawContract.buyerCollateral),
      sellerCollateral: ethers.utils.formatEther(rawContract.sellerCollateral),
      settlementAmount: ethers.utils.formatEther(rawContract.settlementAmount),
      blockchain: 'ethereum'
    };
  }

  async getSolanaContract(contractId) {
    // Solana contract query would be implemented here
    throw new Error('Solana contract queries not yet implemented');
  }

  // === Price Feeds ===

  async getCurrentPrice(asset) {
    const cacheKey = `price_${asset}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 30000) { // 30 second cache
      return cached.data;
    }

    let price;

    try {
      // Use multiple price sources for reliability
      const prices = await Promise.allSettled([
        this.getCoinGeckoPrice(asset),
        this.getBinancePrice(asset),
        this.getCoinbasePrice(asset)
      ]);

      const validPrices = prices
        .filter(p => p.status === 'fulfilled')
        .map(p => p.value);

      if (validPrices.length === 0) {
        throw new Error('No valid prices found');
      }

      // Use median price for better accuracy
      price = this.calculateMedian(validPrices);

    } catch (error) {
      console.error('Error fetching price:', error);
      throw new Error(`Failed to fetch price for ${asset}`);
    }

    const priceData = {
      asset,
      price,
      timestamp: Date.now(),
      sources: ['coingecko', 'binance', 'coinbase']
    };

    this.cache.set(cacheKey, {
      data: priceData,
      timestamp: Date.now()
    });

    return priceData;
  }

  async getCoinGeckoPrice(asset) {
    const assetMap = {
      'bitcoin': 'bitcoin',
      'ethereum': 'ethereum',
      'solana': 'solana'
    };

    const coinId = assetMap[asset.toLowerCase()];
    if (!coinId) {
      throw new Error(`Asset ${asset} not supported`);
    }

    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
    const data = await response.json();

    return data[coinId]?.usd;
  }

  async getBinancePrice(asset) {
    const symbolMap = {
      'bitcoin': 'BTCUSDT',
      'ethereum': 'ETHUSDT',
      'solana': 'SOLUSDT'
    };

    const symbol = symbolMap[asset.toLowerCase()];
    if (!symbol) {
      throw new Error(`Asset ${asset} not supported`);
    }

    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const data = await response.json();

    return parseFloat(data.price);
  }

  async getCoinbasePrice(asset) {
    const symbolMap = {
      'bitcoin': 'BTC-USD',
      'ethereum': 'ETH-USD',
      'solana': 'SOL-USD'
    };

    const symbol = symbolMap[asset.toLowerCase()];
    if (!symbol) {
      throw new Error(`Asset ${asset} not supported`);
    }

    const response = await fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${symbol.split('-')[0]}`);
    const data = await response.json();

    return parseFloat(data.data.rates.USD);
  }

  // === Contract Execution ===

  async executeContract(blockchain, contractId, currentPrice) {
    switch (blockchain) {
      case 'ethereum':
        return await this.executeEthereumContract(contractId, currentPrice);
      case 'solana':
        return await this.executeSolanaContract(contractId, currentPrice);
      default:
        throw new Error(`Unsupported blockchain: ${blockchain}`);
    }
  }

  async executeEthereumContract(contractId, currentPrice) {
    const contract = this.contracts.get('ethereum_BitForwardContract');
    if (!contract) {
      throw new Error('BitForward contract not available');
    }

    const priceInWei = ethers.utils.parseEther(currentPrice.toString());

    const tx = await contract.contract.executeContract(contractId, priceInWei);
    const receipt = await tx.wait();

    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      blockchain: 'ethereum'
    };
  }

  async executeSolanaContract(contractId, currentPrice) {
    // Solana contract execution would be implemented here
    throw new Error('Solana contract execution not yet implemented');
  }

  // === Utility Methods ===

  parseContractStatus(status) {
    const statuses = ['Active', 'Executed', 'Cancelled', 'Expired'];
    return statuses[status] || 'Unknown';
  }

  calculateMedian(numbers) {
    const sorted = numbers.sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }

  getContractABI(contractType) {
    // Return the ABI for the specified contract type
    // This would normally be imported from compiled contracts
    return []; // Placeholder
  }

  getContractBytecode(contractType) {
    // Return the bytecode for the specified contract type
    // This would normally be imported from compiled contracts
    return '0x'; // Placeholder
  }

  // === Network Utilities ===

  async getNetworkInfo(blockchain) {
    return this.networks.get(blockchain);
  }

  async switchNetwork(blockchain, network = 'mainnet') {
    if (blockchain === 'ethereum') {
      const networkInfo = this.networks.get('ethereum')[network];
      if (!networkInfo) {
        throw new Error(`Network ${network} not supported for ${blockchain}`);
      }

      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${networkInfo.chainId.toString(16)}` }]
        });
      } catch (error) {
        if (error.code === 4902) {
          // Network not added, add it
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${networkInfo.chainId.toString(16)}`,
              chainName: networkInfo.name,
              rpcUrls: [networkInfo.rpc],
              nativeCurrency: networkInfo.currency,
              blockExplorerUrls: [networkInfo.explorer]
            }]
          });
        } else {
          throw error;
        }
      }
    }
  }

  // === Event Listening ===

  async subscribeToContractEvents(blockchain, contractId, callback) {
    if (blockchain === 'ethereum') {
      const contract = this.contracts.get('ethereum_BitForwardContract');
      if (!contract) {
        throw new Error('Contract not available');
      }

      // Listen for specific contract events
      const filter = contract.contract.filters.ForwardExecuted(contractId);
      contract.contract.on(filter, callback);
    }
  }

  // === Transaction Monitoring ===

  async waitForTransaction(blockchain, txHash) {
    switch (blockchain) {
      case 'ethereum':
        const provider = this.providers.get('ethereum');
        return await provider.waitForTransaction(txHash);
      default:
        throw new Error(`Transaction monitoring not implemented for ${blockchain}`);
    }
  }

  async getTransactionStatus(blockchain, txHash) {
    switch (blockchain) {
      case 'ethereum':
        const provider = this.providers.get('ethereum');
        const receipt = await provider.getTransactionReceipt(txHash);
        return receipt ? 'confirmed' : 'pending';
      default:
        throw new Error(`Transaction status not implemented for ${blockchain}`);
    }
  }
}

// Initialize blockchain integration
const bitforwardBlockchain = new BitForwardBlockchain();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BitForwardBlockchain, bitforwardBlockchain };
} else {
  window.BitForwardBlockchain = BitForwardBlockchain;
  window.bitforwardBlockchain = bitforwardBlockchain;
}
