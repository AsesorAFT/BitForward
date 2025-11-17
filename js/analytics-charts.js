document.addEventListener('DOMContentLoaded', () => {
  console.log('📊 Analytics Charts Initialized');

  /**
     * Generates random data for sparkline charts.
     * @param {number} count - The number of data points to generate.
     * @param {number} min - The minimum value.
     * @param {number} max - The maximum value.
     * @returns {number[]} - An array of random numbers.
     */
  const generateSparklineData = (count, min, max) => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return data;
  };

  /**
     * Creates a sparkline chart.
     * @param {string} selector - The CSS selector for the chart container.
     * @param {number[]} data - The data series for the chart.
     * @param {string} color - The color of the sparkline.
     * @param {string} type - The type of chart ('area' or 'line').
     */
  const createSparkline = (selector, data, color, type = 'area') => {
    const options = {
      series: [{
        data: data
      }],
      chart: {
        type: type,
        height: '100%',
        sparkline: {
          enabled: true
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
        }
      },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'vertical',
          shadeIntensity: 0.5,
          gradientToColors: undefined,
          inverseColors: true,
          opacityFrom: (type === 'area') ? 0.55 : 0,
          opacityTo: 0.05,
          stops: [0, 90, 100]
        }
      },
      colors: [color],
      tooltip: {
        enabled: false
      },
      xaxis: {
        categories: Array.from({ length: data.length }, (_, i) => i + 1),
      },
      yaxis: {
        min: Math.min(...data) * 0.95,
        max: Math.max(...data) * 1.05
      }
    };

    const chart = new ApexCharts(document.querySelector(selector), options);
    chart.render();
  };

  // --- Render KPI Sparklines ---
  createSparkline('#btc-dominance-sparkline', generateSparklineData(30, 53, 55), 'var(--color-orange-400)');
  createSparkline('#market-cap-sparkline', generateSparklineData(30, 2.2, 2.5), 'var(--color-purple-400)');
  createSparkline('#volume-sparkline', generateSparklineData(30, 110, 140), 'var(--color-yellow-400)', 'line');

  // --- Render On-Chain Metrics Sparklines ---
  createSparkline('#active-addresses-sparkline', generateSparklineData(30, 1.1, 1.3), 'var(--color-green-400)');
  createSparkline('#hash-rate-sparkline', generateSparklineData(30, 410, 430), 'var(--color-blue-400)');
  createSparkline('#netflow-sparkline', generateSparklineData(30, -20, 5), 'var(--color-purple-400)', 'line');
  createSparkline('#stablecoin-sparkline', generateSparklineData(30, 140, 148), 'var(--color-yellow-400)');
});
