document.addEventListener('DOMContentLoaded', () => {
  const markets = [
    { name: 'Bitcoin', symbol: 'BTC', price: 67530.45, change: 2.5, volume: 45000, icon: 'https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=029' },
    { name: 'Ethereum', symbol: 'ETH', price: 3510.80, change: -1.2, volume: 890000, icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.svg?v=029' },
    { name: 'Solana', symbol: 'SOL', price: 165.20, change: 5.8, volume: 7500000, icon: 'https://cryptologos.cc/logos/solana-sol-logo.svg?v=029' },
    { name: 'BNB', symbol: 'BNB', price: 580.50, change: 0.5, volume: 1200000, icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=029' },
    { name: 'Cardano', symbol: 'ADA', price: 0.45, change: -3.1, volume: 250000000, icon: 'https://cryptologos.cc/logos/cardano-ada-logo.svg?v=029' },
    { name: 'XRP', symbol: 'XRP', price: 0.52, change: 1.1, volume: 1800000000, icon: 'https://cryptologos.cc/logos/xrp-xrp-logo.svg?v=029' },
    { name: 'Dogecoin', symbol: 'DOGE', price: 0.15, change: 10.2, volume: 950000000, icon: 'https://cryptologos.cc/logos/dogecoin-doge-logo.svg?v=029' },
  ];

  const marketsListContainer = document.getElementById('markets-list');

  function renderMarkets() {
    if (!marketsListContainer) {return;}

    const marketRows = markets.map(market => {
      const changeClass = market.change >= 0 ? 'positive' : 'negative';
      const changeSign = market.change >= 0 ? '+' : '';

      return `
                <tr>
                    <td data-label="Activo">
                        <div class="market-pair">
                            <img src="${market.icon}" alt="${market.name} logo" class="market-icon">
                            <div>
                                <span class="market-name">${market.name}</span>
                                <span class="market-symbol">${market.symbol}/USD</span>
                            </div>
                        </div>
                    </td>
                    <td data-label="Precio">$${market.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td data-label="Cambio (24h)" class="${changeClass}">${changeSign}${market.change.toFixed(2)}%</td>
                    <td data-label="Volumen (24h)">${(market.volume / 1000000).toFixed(2)}M ${market.symbol}</td>
                    <td data-label="Acción">
                        <a href="trading.html?pair=${market.symbol}" class="btn btn-outline btn-sm">Trade</a>
                    </td>
                </tr>
            `;
    }).join('');

    marketsListContainer.innerHTML = marketRows;
  }

  renderMarkets();
});
