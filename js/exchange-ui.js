document.addEventListener('DOMContentLoaded', () => {
  const simulator = BitForward.ExchangeSimulator;

  // --- Elementos del DOM ---
  const elements = {
    currentPrice: document.getElementById('current-price'),
    priceChange: document.getElementById('price-change'),
    volume24h: document.getElementById('volume-24h'),
    orderBookBids: document.getElementById('order-book-bids'),
    orderBookAsks: document.getElementById('order-book-asks'),
    spreadValue: document.getElementById('spread-value'),
    tradeHistoryList: document.getElementById('trade-history-list'),
    chartContainer: document.getElementById('chart-container')
  };

  // --- Configuración del Gráfico ---
  const chartOptions = {
    chart: {
      type: 'candlestick',
      height: '100%',
      foreColor: 'var(--bf-text-secondary)',
      toolbar: {
        show: true,
        tools: {
          download: false,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
        }
      },
      background: 'transparent'
    },
    series: [{
      name: 'Precio',
      data: simulator.getInitialChartData()
    }],
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: 'var(--bf-text-secondary)'
        }
      }
    },
    yaxis: {
      labels: {
        formatter: (value) => `$${value.toFixed(2)}`,
        style: {
          colors: 'var(--bf-text-secondary)'
        }
      },
      opposite: true
    },
    grid: {
      borderColor: 'var(--bf-border-color)'
    },
    tooltip: {
      theme: 'dark'
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: 'var(--bf-success-color)',
          downward: 'var(--bf-danger-color)'
        }
      }
    }
  };

  const chart = new ApexCharts(elements.chartContainer, chartOptions);
  chart.render();

  // --- Funciones de Renderizado ---

  function updateMarketStats(priceData) {
    const change = priceData.change;
    const changePercent = priceData.changePercent;

    elements.currentPrice.textContent = `$${priceData.price.toFixed(2)}`;
    elements.volume24h.textContent = `${priceData.volume.toFixed(2)} BTC`;

    const changeText = `${change.toFixed(2)} (${changePercent.toFixed(2)}%)`;
    elements.priceChange.textContent = changeText;

    if (change >= 0) {
      elements.priceChange.classList.remove('negative');
      elements.priceChange.classList.add('positive');
      elements.currentPrice.classList.remove('negative');
      elements.currentPrice.classList.add('positive');
    } else {
      elements.priceChange.classList.remove('positive');
      elements.priceChange.classList.add('negative');
      elements.currentPrice.classList.remove('positive');
      elements.currentPrice.classList.add('negative');
    }
  }

  function renderOrderBook(orderBook) {
    const formatRow = (order) => `
            <div class="data-table-row">
                <span>${order.price.toFixed(2)}</span>
                <span>${order.amount.toFixed(4)}</span>
                <span>${(order.price * order.amount).toFixed(2)}</span>
            </div>
        `;

    elements.orderBookAsks.innerHTML = orderBook.asks.map(formatRow).join('');
    elements.orderBookBids.innerHTML = orderBook.bids.map(formatRow).join('');

    const spread = orderBook.asks[0].price - orderBook.bids[0].price;
    elements.spreadValue.textContent = `$${spread.toFixed(2)}`;
  }

  function renderTradeHistory(trades) {
    const formatRow = (trade) => `
            <div class="data-table-row ${trade.type === 'buy' ? 'positive' : 'negative'}">
                <span>${trade.price.toFixed(2)}</span>
                <span>${trade.amount.toFixed(4)}</span>
                <span>${trade.time}</span>
            </div>
        `;
    elements.tradeHistoryList.innerHTML = trades.map(formatRow).join('');
  }

  // --- Ciclo de Actualización ---

  function updateUI() {
    const priceData = simulator.getCurrentPriceData();
    const orderBook = simulator.getOrderBook();
    const trades = simulator.getTradeHistory();

    updateMarketStats(priceData);
    renderOrderBook(orderBook);
    renderTradeHistory(trades);

    // Actualizar el gráfico con el último punto de datos
    const latestCandle = simulator.getLatestCandle();
    chart.appendData([{
      x: new Date(latestCandle.x),
      y: latestCandle.y
    }]);
  }

  // Iniciar el simulador y el ciclo de actualización de la UI
  simulator.start();
  setInterval(updateUI, 2000); // Actualizar cada 2 segundos
});
