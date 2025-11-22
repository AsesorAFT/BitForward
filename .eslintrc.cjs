module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
    // ELIMINADO: cypress, mocha, jest
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  globals: {
    // Testing frameworks (para casos donde se usen fuera de cypress/)
    cy: 'readonly',
    Cypress: 'readonly',
    describe: 'readonly',
    it: 'readonly',
    expect: 'readonly',
    beforeEach: 'readonly',
    afterEach: 'readonly',
    before: 'readonly',
    after: 'readonly',
    // Blockchain/Web3
    ethers: 'readonly',
    ethereum: 'readonly',
    web3: 'readonly',
    // Analytics
    gtag: 'readonly',
    ga: 'readonly',
    // Charts/Libs
    ApexCharts: 'readonly',
    Chart: 'readonly',
    // Sentry
    Sentry: 'readonly',
    // Process (for build configs)
    process: 'readonly'
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-undef': 'warn',
    'no-console': 'off',
    'semi': 'off',
    'quotes': 'off'
  },
  ignorePatterns: [
    'dist/**',
    'node_modules/**',
    '*.config.js',
    '*.config.cjs',
    'public/**',
    'coverage/**',
    'cypress/**',
    'tests/**',
    'test/**',
    '__tests__/**',
    '**/*.test.js',
    '**/*.spec.js'
  ],
  overrides: [
    {
      files: ['*.config.js', '*.config.cjs', 'vite.config.*'],
      env: {
        node: true
      },
      rules: {
        'no-undef': 'off',
        'no-unused-vars': 'off'
      }
    },
    {
      files: ['**/*.jsx', '**/*.tsx'],
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      rules: {
        'no-undef': 'warn'
      }
    }
  ]
};
