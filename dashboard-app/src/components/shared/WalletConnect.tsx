import React from 'react';
import { useWeb3 } from '../../hooks/useWeb3';

export const WalletConnect = () => {
  const { isConnected, account, connectWallet, disconnectWallet } = useWeb3();

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (isConnected && account) {
    return (
      <div className="wallet-info">
        <div className="wallet-address">
          <span className="wallet-label">Connected:</span>
          <span className="address-text">{formatAddress(account)}</span>
        </div>
        <button onClick={disconnectWallet} className="btn btn-secondary">
          <span>🔌</span>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button onClick={connectWallet} className="btn btn-primary">
      <span>🔗</span>
      Connect Wallet
    </button>
  );
};
