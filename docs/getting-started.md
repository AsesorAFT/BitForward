# Getting Started with BitForward

This guide will help you get started with BitForward, the forward contract system built on Bitcoin.

## Installation

```bash
npm install bitforward
```

## Basic Usage

### Creating a Forward Contract

```javascript
const { BitForwardManager } = require('bitforward');

// Initialize the manager
const manager = new BitForwardManager();

// Define contract parameters
const contractOptions = {
  buyerAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  sellerAddress: '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX',
  assetAmount: 1.5,        // Amount of asset (e.g., BTC)
  agreedPrice: 50000,      // Price in USD
  maturityDate: '2025-12-31T23:59:59Z'  // ISO date string
};

// Create the contract
const contract = manager.createContract(contractOptions);
console.log('Contract ID:', contract.contractId);
```

### Managing Contracts

```javascript
// Get a specific contract
const retrievedContract = manager.getContract(contract.contractId);

// List all contracts
const allContracts = manager.listContracts();

// Execute a contract
const executionResult = manager.executeContract(contract.contractId);
```

## Contract Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `buyerAddress` | string | Bitcoin address of the buyer |
| `sellerAddress` | string | Bitcoin address of the seller |
| `assetAmount` | number | Amount of the asset being traded |
| `agreedPrice` | number | Agreed upon price for the asset |
| `maturityDate` | string | ISO date string for when the contract matures |

## Running the Demo

To see BitForward in action, run the included demo:

```bash
node src/demo.js
```

## Next Steps

- Read the [API Reference](./api.md) for detailed method documentation
- Check out [Examples](./examples.md) for more complex use cases
- Review the [Architecture](./architecture.md) to understand how BitForward works