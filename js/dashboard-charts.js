document.addEventListener('DOMContentLoaded', function () {
  console.log('📊 Dashboard Charts Initializing...');

  // Opciones para un gráfico de área de ejemplo que simula el valor de un portafolio
  const portfolioChartOptions = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: {
        show: false, // Ocultar la barra de herramientas para un look más limpio
      },
      zoom: {
        enabled: false,
      },
      fontFamily: 'JetBrains Mono, Inter, sans-serif',
    },
    series: [
      {
        name: 'Portfolio Value',
        data: generateRandomData(30), // Generar 30 puntos de datos
      },
    ],
    colors: ['var(--bf-accent-primary)'], // Usar el color de acento del sistema de diseño
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 100],
      },
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.1)',
      strokeDashArray: 4,
      yaxis: {
        lines: {
          show: true,
        },
      },
      xaxis: {
        lines: {
          show: false,
        },
      },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: 'var(--bf-text-tertiary)',
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      opposite: true,
      labels: {
        style: {
          colors: 'var(--bf-text-tertiary)',
        },
        formatter: function (value) {
          return '$' + value.toFixed(2);
        },
      },
    },
    tooltip: {
      theme: 'dark',
      x: {
        format: 'dd MMM yyyy',
      },
    },
    theme: {
      mode: 'dark',
    },
  };

  const chartContainer = document.querySelector('#market-overview-container');
  if (chartContainer) {
    const chart = new ApexCharts(chartContainer, portfolioChartOptions);
    chart.render();
    console.log('📊 Portfolio chart rendered successfully.');
  } else {
    console.error('Error: Market overview container not found.');
  }

  /**
   * Genera datos aleatorios para simular la fluctuación de un valor.
   * @param {number} count - El número de puntos de datos a generar.
   * @returns {Array<Array<number>>} - Un array de pares [timestamp, value].
   */
  function generateRandomData(count) {
    const data = [];
    let value = 50000;
    const today = new Date();
    for (let i = 0; i < count; i++) {
      const newDate = new Date(today.getTime() - (count - 1 - i) * 24 * 60 * 60 * 1000);
      value += (Math.random() - 0.5) * 2000;
      if (value < 20000) value = 20000; // Mínimo valor
      data.push([newDate.getTime(), parseFloat(value.toFixed(2))]);
    }
    return data;
  }
});
