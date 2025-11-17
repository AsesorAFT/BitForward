// Configuración de pruebas para BitForward
// Este archivo contiene configuraciones y datos de prueba

const TEST_CONFIG = {
  // Direcciones de prueba válidas
  VALID_ADDRESSES: {
    bitcoin: [
      'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
      '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy'
    ],
    solana: [
      '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      'So11111111111111111111111111111111111111112',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    ]
  },

  // Direcciones inválidas para pruebas
  INVALID_ADDRESSES: {
    bitcoin: [
      'invalid_address',
      '1234567890',
      'bc1invalidaddress',
      ''
    ],
    solana: [
      'invalid_solana_address',
      'short',
      'toolongaddressthatisinvalidforsolana123456789',
      ''
    ]
  },

  // Datos de prueba para contratos
  TEST_CONTRACTS: [
    {
      blockchain: 'bitcoin',
      amount: 0.01,
      counterparty: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      executionDate: '2024-12-31'
    },
    {
      blockchain: 'solana',
      amount: 1.5,
      counterparty: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      executionDate: '2024-11-15'
    }
  ]
};

// Exportar para uso en pruebas
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TEST_CONFIG;
}
