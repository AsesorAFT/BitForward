require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
const RSK_TESTNET_RPC = process.env.RSK_TESTNET_RPC || "https://public-node.testnet.rsk.co";
const RSK_MAINNET_RPC = process.env.RSK_MAINNET_RPC || "https://public-node.rsk.co";
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  
  networks: {
    hardhat: {
      chainId: 31337,
      gas: "auto",
      gasPrice: "auto",
      initialBaseFeePerGas: 0,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        count: 20,
      },
    },
    
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    
    "rsk-testnet": {
      url: RSK_TESTNET_RPC,
      chainId: 31,
      accounts: [PRIVATE_KEY],
      gas: 6800000,
      gasPrice: 60000000, // 0.06 gwei
      timeout: 60000,
    },
    
    "rsk-mainnet": {
      url: RSK_MAINNET_RPC,
      chainId: 30,
      accounts: [PRIVATE_KEY],
      gas: 6800000,
      gasPrice: 60000000, // 0.06 gwei
      timeout: 60000,
    },
  },
  
  etherscan: {
    apiKey: {
      "rsk-testnet": "not-needed",
      "rsk-mainnet": "not-needed",
    },
    customChains: [
      {
        network: "rsk-testnet",
        chainId: 31,
        urls: {
          apiURL: "https://rootstock-testnet.blockscout.com/api",
          browserURL: "https://rootstock-testnet.blockscout.com",
        },
      },
      {
        network: "rsk-mainnet",
        chainId: 30,
        urls: {
          apiURL: "https://rootstock.blockscout.com/api",
          browserURL: "https://rootstock.blockscout.com",
        },
      },
    ],
  },
  
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    gasPrice: 1, // gwei
    coinmarketcap: COINMARKETCAP_API_KEY,
    token: "RBTC",
    showTimeSpent: true,
    showMethodSig: true,
    maxMethodDiff: 10,
  },
  
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: [":BitForward", ":Vault", ":ForwardEngine", ":Oracle"],
  },
  
  mocha: {
    timeout: 60000,
    bail: false,
  },
  
  typechain: {
    outDir: "typechain",
    target: "ethers-v6",
    alwaysGenerateOverloads: false,
    discriminateTypes: true,
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
