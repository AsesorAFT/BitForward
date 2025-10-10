# Wallet Integration Documentation

## Overview

BitForward supports integration with popular cryptocurrency wallets for Ethereum and Solana blockchains. This document provides details on how the wallet integration works and how to use it.

## Supported Wallets

### MetaMask (Ethereum)
- **Type**: Browser Extension Wallet
- **Blockchain**: Ethereum and EVM-compatible chains
- **Website**: https://metamask.io
- **Features**:
  - Account management
  - Network switching
  - Balance display
  - Transaction signing

### Phantom (Solana)
- **Type**: Browser Extension Wallet
- **Blockchain**: Solana
- **Website**: https://phantom.app
- **Features**:
  - Account management
  - Automatic reconnection
  - Balance display
  - Transaction signing

## Features Implemented

### 1. Wallet Detection
The system automatically detects if the wallet extension is installed in the user's browser:
- Checks for `window.ethereum` (MetaMask)
- Checks for `window.solana` (Phantom)
- Provides installation prompts if not detected

### 2. Secure Connection
- User consent required for all connections
- Proper error handling for rejected connections
- Handles pending connection requests

### 3. Account Management
- Automatic detection of account changes
- Support for multiple accounts
- Address validation

### 4. Network Detection (MetaMask)
- Detects current Ethereum network
- Supports network switching
- Handles network change events
- Supports multiple networks:
  - Ethereum Mainnet
  - Goerli Testnet
  - Sepolia Testnet
  - Polygon Mainnet
  - Arbitrum One
  - Optimism

### 5. Event Listeners
Both wallets implement event listeners for:
- Account changes
- Network changes (Ethereum)
- Disconnection events

### 6. Balance Retrieval
- Fetches wallet balance on connection
- Displays balance in native currency (ETH/SOL)

### 7. Disconnection Support
- Clean disconnection for Solana wallets
- Local state cleanup for Ethereum wallets

## Usage

### For Users

#### Connecting a Wallet

1. **From Login Screen**:
   - Click on the "MetaMask" or "Phantom" button
   - If the wallet is not installed, you'll be prompted to install it
   - Approve the connection in the wallet popup
   - You'll be automatically logged in with your wallet address

2. **Error Handling**:
   - If you reject the connection, you'll see an error message
   - If a connection is already pending, you'll be notified
   - All errors are displayed with clear messages

#### Switching Accounts
- When you switch accounts in your wallet, the application will detect the change
- A notification will appear showing the new account
- The application state will update automatically

#### Switching Networks (MetaMask)
- When you switch networks in MetaMask, the application will detect the change
- The page will reload to ensure consistency
- A notification will show the new network

### For Developers

#### Connection Flow

```javascript
// Initialize blockchain integration
const blockchain = new BlockchainIntegration();

// Connect to MetaMask
try {
    const connection = await blockchain.connectWallet('ethereum', 'metamask');
    console.log('Connected:', connection.address);
    console.log('Balance:', connection.balance);
    console.log('Network:', connection.chainId);
} catch (error) {
    console.error('Connection failed:', error.message);
}

// Connect to Phantom
try {
    const connection = await blockchain.connectWallet('solana', 'phantom');
    console.log('Connected:', connection.address);
    console.log('Balance:', connection.balance);
} catch (error) {
    console.error('Connection failed:', error.message);
}
```

#### Check if Wallet is Installed

```javascript
const blockchain = new BlockchainIntegration();

if (blockchain.isWalletInstalled('metamask')) {
    console.log('MetaMask is installed');
} else {
    const installUrl = blockchain.getWalletInstallUrl('metamask');
    console.log('Install MetaMask:', installUrl);
}
```

#### Switch Ethereum Network

```javascript
const blockchain = new BlockchainIntegration();

try {
    // Switch to Polygon
    await blockchain.switchEthereumNetwork('0x89');
    console.log('Switched to Polygon');
} catch (error) {
    console.error('Network switch failed:', error.message);
}
```

#### Listen to Wallet Events

```javascript
// Account changed
window.addEventListener('walletAccountChanged', (event) => {
    console.log('New account:', event.detail.account);
    console.log('Blockchain:', event.detail.blockchain);
});

// Network changed
window.addEventListener('walletChainChanged', (event) => {
    console.log('New chain:', event.detail.chainId);
});

// Wallet disconnected
window.addEventListener('walletDisconnected', (event) => {
    console.log('Disconnected from:', event.detail.blockchain);
});
```

#### Disconnect Wallet

```javascript
const blockchain = new BlockchainIntegration();

// Disconnect Ethereum wallet
await blockchain.disconnectWallet('ethereum');

// Disconnect Solana wallet
await blockchain.disconnectWallet('solana');
```

## Error Handling

### Common Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| 4001 | User rejected the request | Ask user to approve the connection |
| -32002 | Request already pending | Check wallet extension |
| No accounts found | No accounts available | Create/import an account in the wallet |
| Wallet not detected | Extension not installed | Install the wallet extension |

### Error Messages

All errors are user-friendly and provide clear guidance:
- "User rejected wallet connection" - User clicked "Cancel" in wallet
- "Connection request already pending. Please check MetaMask." - Another request is waiting
- "MetaMask not detected, using simulated wallet" - Development fallback

## Security Considerations

### Best Practices

1. **Never Store Private Keys**: The integration only requests addresses and public information
2. **User Consent**: All connections require explicit user approval
3. **Secure Communication**: All wallet communication uses the official wallet APIs
4. **State Management**: Connection state is properly managed and cleaned up
5. **Event Handling**: All events are properly handled to prevent memory leaks

### Development Mode

When wallets are not detected, the system falls back to simulated wallets with:
- Random addresses
- Simulated balances
- `simulated: true` flag in the response

This allows development without actual wallet installations.

## Testing

### Manual Testing

1. **Without Wallets**:
   - Open the application
   - Click wallet buttons
   - Verify installation prompts appear
   - Verify simulated fallback works

2. **With MetaMask**:
   - Install MetaMask
   - Connect to the application
   - Switch accounts
   - Switch networks
   - Verify all events are detected

3. **With Phantom**:
   - Install Phantom
   - Connect to the application
   - Switch accounts
   - Disconnect from Phantom settings
   - Verify all events are detected

## Future Enhancements

- [ ] Support for WalletConnect (mobile wallets)
- [ ] Support for Ledger hardware wallets
- [ ] Support for Coinbase Wallet
- [ ] ENS (Ethereum Name Service) resolution
- [ ] Transaction signing and submission
- [ ] Multi-signature wallet support
- [ ] Wallet connection persistence (remember preference)

## Troubleshooting

### MetaMask Issues

**Problem**: Connection fails even after approval
- **Solution**: Refresh the page and try again
- **Solution**: Check if MetaMask is unlocked

**Problem**: Network doesn't switch
- **Solution**: Manually switch in MetaMask extension
- **Solution**: Try again after page reload

### Phantom Issues

**Problem**: Connection fails silently
- **Solution**: Check if Phantom is unlocked
- **Solution**: Refresh the page and try again

**Problem**: Account changes not detected
- **Solution**: Disconnect and reconnect
- **Solution**: Check browser console for errors

## Support

For issues or questions:
- Open an issue on GitHub: https://github.com/AsesorAFT/BitForward/issues
- Check existing issues for similar problems
- Provide browser and wallet version information

## References

- [MetaMask Documentation](https://docs.metamask.io/)
- [Phantom Documentation](https://docs.phantom.app/)
- [EIP-1193: Ethereum Provider JavaScript API](https://eips.ethereum.org/EIPS/eip-1193)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
