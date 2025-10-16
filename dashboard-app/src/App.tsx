import React from 'react';
import { useWeb3 } from './hooks/useWeb3';
import { WalletConnect } from './components/shared/WalletConnect';
import { PortfolioOverview } from './components/dashboard/PortfolioOverview';
import { StrategyExecutor } from './components/dashboard/StrategyExecutor';

function App() {
  const { isConnected } = useWeb3();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="app-title">
              <span className="logo-icon">🚀</span>
              BitForward DeFi
            </h1>
            <span className="version-badge">v2.0</span>
          </div>
          <WalletConnect />
        </div>
      </header>
      <main className="app-main">
        {isConnected ? (
          <div className="dashboard-container">
            <div className="dashboard-header">
              <h2>Your DeFi Portfolio</h2>
              <p>Manage your digital assets and execute advanced trading strategies</p>
            </div>
            <div className="dashboard-grid">
              <PortfolioOverview />
              <StrategyExecutor />
            </div>
          </div>
        ) : (
          <div className="connect-prompt">
            <div className="connect-card">
              <div className="connect-icon">🔗</div>
              <h2>Connect Your Wallet</h2>
              <p>Please connect your wallet to access the BitForward DeFi dashboard and start managing your portfolio</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
