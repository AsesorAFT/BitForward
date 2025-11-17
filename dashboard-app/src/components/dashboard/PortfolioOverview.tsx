import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../hooks/useWeb3';

export const PortfolioOverview = () => {
  const { account, provider } = useWeb3();
  const [balance, setBalance] = useState('0.0');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      if (account && provider) {
        try {
          const balance = await provider.getBalance(account);
          setBalance((parseFloat(balance.toString()) / 1e18).toFixed(4));
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      }
      setLoading(false);
    };

    fetchBalance();
  }, [account, provider]);

  return (
    <div className="card">
      <h3>
        <span className="card-icon">💼</span>
        Portfolio Overview
      </h3>

      <div className="portfolio-stats">
        <div className="stat-item">
          <div className={`stat-value ${loading ? 'loading' : ''}`}>
            {loading ? '...' : `${balance} ETH`}
          </div>
          <div className="stat-label">Wallet Balance</div>
        </div>

        <div className="stat-item">
          <div className="stat-value">$0.00</div>
          <div className="stat-label">Total USD Value</div>
        </div>

        <div className="stat-item">
          <div className="stat-value">0</div>
          <div className="stat-label">Active Positions</div>
        </div>

        <div className="stat-item">
          <div className="stat-value">+0.00%</div>
          <div className="stat-label">24h Change</div>
        </div>
      </div>

      <div className="portfolio-actions">
        <button className="btn btn-primary">
          <span>💰</span>
          Deposit
        </button>
        <button className="btn btn-secondary">
          <span>💸</span>
          Withdraw
        </button>
        <button className="btn btn-secondary">
          <span>🔄</span>
          Refresh
        </button>
      </div>

      <div className="portfolio-note">
        <p><strong>Note:</strong> Connect to a supported network to view your DeFi positions and execute strategies.</p>
      </div>
    </div>
  );
};
