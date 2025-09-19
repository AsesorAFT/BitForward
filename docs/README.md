# BitForward Documentation

Welcome to the BitForward documentation. This directory contains comprehensive guides and references for the BitForward forward contract system.

## Contents

- [API Reference](./api.md) - Complete API documentation
- [Getting Started](./getting-started.md) - Quick start guide
- [Architecture](./architecture.md) - System architecture overview
- [Examples](./examples.md) - Usage examples and tutorials

## Overview

BitForward is a system for creating and managing forward contracts on the Bitcoin network using Bitcoin Script. It provides a secure, transparent, and easy-to-use platform for creating financial agreements that execute automatically without intermediaries.

## Key Features

- **Secure**: Built on Bitcoin's robust network
- **Transparent**: All contracts are verifiable on the blockchain
- **Automated**: Self-executing contracts using Bitcoin Script
- **Decentralized**: No trusted intermediaries required

## Quick Start

```javascript
const { BitForwardManager } = require('bitforward');

const manager = new BitForwardManager();

const contract = manager.createContract({
  buyerAddress: 'buyer_btc_address',
  sellerAddress: 'seller_btc_address',
  assetAmount: 1.5,
  agreedPrice: 50000,
  maturityDate: '2025-12-31T23:59:59Z'
});

console.log('Contract created:', contract.getDetails());
```

## Support

For questions, issues, or contributions, please visit our [GitHub repository](https://github.com/AsesorAFT/BitForward).