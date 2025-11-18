// === exchange-simulator.js ===
// Simula datos de mercado en tiempo real para la interfaz de trading.

document.addEventListener('DOMContentLoaded', () => {
  console.log('📈 Exchange Simulator Initializing...');

  const currentPriceElement = document.getElementById('current-price');
  const priceChangeElement = document.getElementById('price-change');
  const volumeElement = document.getElementById('volume-24h');
  const orderBookBids = document.getElementById('order-book-bids');
  const orderBookAsks = document.getElementById('order-book-asks');
  const tradeHistoryContainer = document.getElementById('trade-history-list');

  let currentPrice = 67500.5;
  let lastTrades = [];

  function updateHeader() {
    const change = (Math.random() - 0.5) * 100;
    const changePercent = (change / currentPrice) * 100;

    currentPriceElement.textContent = `$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    priceChangeElement.textContent = `${change.toFixed(2)} (${changePercent.toFixed(2)}%)`;
    priceChangeElement.className = `value ${change >= 0 ? 'positive' : 'negative'}`;

    volumeElement.textContent = `${(1500 + Math.random() * 500).toFixed(2)} BTC`;
  }

  function generateOrderBook() {
    orderBookBids.innerHTML = '';
    orderBookAsks.innerHTML = '';

    let bidPrice = currentPrice - 0.5;
    for (let i = 0; i < 15; i++) {
      const amount = (Math.random() * 2).toFixed(4);
      const total = (bidPrice * amount).toFixed(4);
      const depth = Math.random() * 100;
      const row = `
                <div class="data-table-row order-book-row bid" style="--depth: ${depth}%">
                    <span class="price positive">${bidPrice.toFixed(2)}</span>
                    <span>${amount}</span>
                    <span>${total}</span>
                </div>
            `;
      orderBookBids.innerHTML += row;
      bidPrice -= Math.random() * 2;
    }

    let askPrice = currentPrice + 0.5;
    for (let i = 0; i < 15; i++) {
      const amount = (Math.random() * 2).toFixed(4);
      const total = (askPrice * amount).toFixed(4);
      const depth = Math.random() * 100;
      const row = `
                <div class="data-table-row order-book-row ask" style="--depth: ${depth}%">
                    <span class="price negative">${askPrice.toFixed(2)}</span>
                    <span>${amount}</span>
                    <span>${total}</span>
                </div>
            `;
      orderBookAsks.innerHTML += row;
      askPrice += Math.random() * 2;
    }
  }

  function generateTradeHistory() {
    const newTrade = {
      price: currentPrice + (Math.random() - 0.5) * 5,
      amount: (Math.random() * 0.5).toFixed(4),
      time: new Date().toLocaleTimeString(),
      side: Math.random() > 0.5 ? 'buy' : 'sell',
    };

    lastTrades.unshift(newTrade);
    if (lastTrades.length > 20) {
      lastTrades.pop();
    }

    tradeHistoryContainer.innerHTML = '';
    lastTrades.forEach(trade => {
      const row = `
                <div class="data-table-row">
                    <span class="price ${trade.side === 'buy' ? 'positive' : 'negative'}">${trade.price.toFixed(2)}</span>
                    <span>${trade.amount}</span>
                    <span>${trade.time}</span>
                </div>
            `;
      tradeHistoryContainer.innerHTML += row;
    });
  }

  function updateMarket() {
    // Simular fluctuación de precio
    currentPrice += (Math.random() - 0.5) * 10;

    updateHeader();
    generateOrderBook();
    generateTradeHistory();
  }

  // Inicializar y actualizar cada 2 segundos
  updateMarket();
  setInterval(updateMarket, 2000);

  // Inicializar el gráfico
  const chartOptions = {
    series: [
      {
        data: Array.from({ length: 50 }, () => 67000 + Math.random() * 1000),
      },
    ],
    chart: {
      type: 'candlestick',
      height: '100%',
      parentHeightOffset: 0,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    xaxis: { labels: { show: false } },
    yaxis: { labels: { show: false } },
    grid: {
      show: false,
      padding: { left: 0, right: 0, top: 0, bottom: 0 },
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: 'var(--green)',
          downward: 'var(--red)',
        },
      },
    },
    tooltip: { theme: 'dark' },
  };

  const chart = new ApexCharts(document.querySelector('#chart-container'), chartOptions);
  chart.render();
});
