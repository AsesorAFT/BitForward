import React, { useState } from 'react';
import { useWeb3 } from '../../hooks/useWeb3';

export const StrategyExecutor = () => {
  const { isConnected } = useWeb3();
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  const strategies = [
    {
      id: 'hedge',
      icon: '🔄',
      title: 'Hedge Trading',
      description: 'Execute automated hedging strategies across multiple DEX protocols',
      riskLevel: 'Medium',
      estimatedAPY: '8-15%'
    },
    {
      id: 'lending',
      icon: '🏦',
      title: 'Yield Farming',
      description: 'Provide liquidity to earn yield from lending protocols',
      riskLevel: 'Low',
      estimatedAPY: '3-8%'
    },
    {
      id: 'leverage',
      icon: '📈',
      title: 'Leveraged Positions',
      description: 'Open collateralized positions with managed risk',
      riskLevel: 'High',
      estimatedAPY: '15-25%'
    },
    {
      id: 'arbitrage',
      icon: '⚡',
      title: 'Arbitrage',
      description: 'Capture price differences across exchanges',
      riskLevel: 'Medium',
      estimatedAPY: '5-12%'
    }
  ];

  const executeStrategy = (strategyId: string) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setSelectedStrategy(strategyId);
    // TODO: Implement strategy execution logic
    console.log(`Executing strategy: ${strategyId}`);
    alert(`Strategy "${strategyId}" execution started (demo mode)`);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'High': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="card">
      <h3>
        <span className="card-icon">⚡</span>
        Strategy Executor
      </h3>

      <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
        Choose from automated DeFi strategies to optimize your portfolio returns
      </p>

      <div className="strategy-grid">
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            className={`strategy-item ${selectedStrategy === strategy.id ? 'selected' : ''}`}
            onClick={() => executeStrategy(strategy.id)}
          >
            <div className="strategy-icon">{strategy.icon}</div>
            <div className="strategy-title">{strategy.title}</div>
            <div className="strategy-description">{strategy.description}</div>

            <div className="strategy-metrics">
              <div className="metric">
                <span className="metric-label">Risk:</span>
                <span
                  className="metric-value"
                  style={{ color: getRiskColor(strategy.riskLevel) }}
                >
                  {strategy.riskLevel}
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Est. APY:</span>
                <span className="metric-value" style={{ color: 'var(--accent)' }}>
                  {strategy.estimatedAPY}
                </span>
              </div>
            </div>

            <button
              className="btn btn-primary strategy-btn"
              onClick={(e) => {
                e.stopPropagation();
                executeStrategy(strategy.id);
              }}
            >
              Execute Strategy
            </button>
          </div>
        ))}
      </div>

      <div className="strategy-disclaimer">
        <p><strong>⚠️ Disclaimer:</strong> All strategies involve risk. Past performance does not guarantee future results. Please read our risk disclosure before proceeding.</p>
      </div>
    </div>
  );
};
