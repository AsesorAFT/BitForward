module.exports = {module.exports = {module.exports = {module.exports = {

  root: true,

  env: {  root: true,

    browser: true,

    es2021: true,  env: {  root: true,  root: true,

    node: true,

  },    browser: true,

  extends: [

    'eslint:recommended',    es2021: true,  env: {  env: {

  ],

  parserOptions: {    node: true,

    ecmaVersion: 'latest',

    sourceType: 'module',  },    browser: true,    browser: true,

  },

  rules: {  extends: [

    'no-console': 'off',

  },    'eslint:recommended',    es2021: true,    es2021: true,

};

    'plugin:react/recommended',

  ],    node: true,    node: true,

  parserOptions: {

    ecmaVersion: 'latest',  },  },

    sourceType: 'module',

    ecmaFeatures: {  extends: [  extends: [

      jsx: true,

    },    'eslint:recommended',    'eslint:recommended',

  },

  settings: {    'plugin:react/recommended',    'plugin:react/recommended',

    react: {

      version: 'detect',  ],  ],

    },

  },  parserOptions: {  parserOptions: {

  globals: {

    ApexCharts: 'readonly',    ecmaVersion: 'latest',    ecmaVersion: 'latest',

    Sentry: 'readonly',

    plausible: 'readonly',    sourceType: 'module',    sourceType: 'module',

    ethers: 'readonly',

    ethereum: 'readonly',    ecmaFeatures: {    ecmaFeatures: {

    web3: 'readonly',

    Sortable: 'readonly',      jsx: true,      jsx: true,

    TradingView: 'readonly',

    gsap: 'readonly',    },    },

    UniversalNav: 'writable',

    UniversalFooter: 'writable',  },  },

    ExecutiveIcons: 'readonly',

    notificationSystem: 'writable',  settings: {  settings: {

    BitForwardUtils: 'readonly',

    walletManager: 'readonly',    react: {    react: {

    showNotification: 'readonly',

    logger: 'readonly',      version: 'detect',      version: 'detect',

    clients: 'readonly',

    __APP_VERSION__: 'readonly',    },    },

    __BUILD_TIME__: 'readonly',

    gtag: 'readonly',  },  },

  },

  rules: {  globals: {  globals: {

    'no-console': 'off',

    'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],    ApexCharts: 'readonly',    ApexCharts: 'readonly',

    'require-await': 'off',

    'react/react-in-jsx-scope': 'off',    Sentry: 'readonly',    Sentry: 'readonly',

    'react/prop-types': 'off',

    'no-case-declarations': 'off',    plausible: 'readonly',    plausible: 'readonly',

    'no-control-regex': 'off',

    'no-dupe-keys': 'error',    ethers: 'readonly',    ethers: 'readonly',

    'no-undef': 'warn',

    'no-useless-escape': 'warn',    ethereum: 'readonly',    ethereum: 'readonly',

    'no-prototype-builtins': 'warn',

  },    web3: 'readonly',    web3: 'readonly',

  overrides: [

    {    Sortable: 'readonly',    Sortable: 'readonly',

      files: ['server/**/*.js', 'contracts/**/*.js', 'scripts/**/*.js', '*.cjs'],

      env: {    TradingView: 'readonly',    TradingView: 'readonly',

        node: true,

        browser: false,    gsap: 'readonly',    gsap: 'readonly',

      },

      rules: {    UniversalNav: 'writable',    UniversalNav: 'writable',

        'no-undef': 'off'

      }    UniversalFooter: 'writable',    UniversalFooter: 'writable',

    },

    {    ExecutiveIcons: 'readonly',    ExecutiveIcons: 'readonly',

      files: ['**/__tests__/**/*.test.js', '**/tests/**/*.test.js', '**/*.spec.js', 'test-*.cjs'],

      env: {    notificationSystem: 'writable',    notificationSystem: 'writable',

        jest: true,

        node: true,    BitForwardUtils: 'readonly',    BitForwardUtils: 'readonly',

      },

      globals: {    walletManager: 'readonly',    walletManager: 'readonly',

        before: 'readonly',

        after: 'readonly',    showNotification: 'readonly',    showNotification: 'readonly',

        describe: 'readonly',

        it: 'readonly',    logger: 'readonly',    logger: 'readonly',

        expect: 'readonly',

      },    clients: 'readonly',    clients: 'readonly',

      rules: {

        'no-undef': 'off'    __APP_VERSION__: 'readonly',    __APP_VERSION__: 'readonly',

      }

    },    __BUILD_TIME__: 'readonly',    __BUILD_TIME__: 'readonly',

  ],

  ignorePatterns: ["dist/", "node_modules/", "coverage/", "*.min.js", "src/"],    gtag: 'readonly',    gtag: 'readonly',

};

  },  },

  rules: {  rules: {

    'no-console': 'off',    'no-console': 'off',

    'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],    'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_', 'varsIgnorePattern': '^_' }],

    'require-await': 'off',    'require-await': 'off',

    'react/react-in-jsx-scope': 'off',    'react/react-in-jsx-scope': 'off',

    'react/prop-types': 'off',    'react/prop-types': 'off',

    'no-case-declarations': 'off',    'no-case-declarations': 'off',

    'no-control-regex': 'off',    'no-control-regex': 'off',

    'no-dupe-keys': 'error',    'no-dupe-keys': 'error',

    'no-undef': 'warn',    'no-undef': 'warn',

    'no-useless-escape': 'warn',    'no-useless-escape': 'warn',

    'no-prototype-builtins': 'warn',    'no-prototype-builtins': 'warn',

  },  },

  overrides: [  overrides: [

    {    {

      files: ['server/**/*.js', 'contracts/**/*.js', 'scripts/**/*.js', '*.cjs'],      files: ['server/**/*.js', 'contracts/**/*.js', 'scripts/**/*.js', '*.cjs'],

      env: {      env: {

        node: true,        node: true,

        browser: false,        browser: false,

      },      },

      rules: {      rules: {

        'no-undef': 'off'        'no-undef': 'off'

      }      }

    },    },

    {    {

      files: ['**/__tests__/**/*.test.js', '**/tests/**/*.test.js', '**/*.spec.js', 'test-*.cjs'],      files: ['**/__tests__/**/*.test.js', '**/tests/**/*.test.js', '**/*.spec.js', 'test-*.cjs'],

      env: {      env: {

        jest: true,        jest: true,

        node: true,        node: true,

      },      },

      globals: {      globals: {

        before: 'readonly',        before: 'readonly',

        after: 'readonly',        after: 'readonly',

        describe: 'readonly',        describe: 'readonly',

        it: 'readonly',        it: 'readonly',

        expect: 'readonly',        expect: 'readonly',

      },      },

      rules: {      rules: {

        'no-undef': 'off'        'no-undef': 'off'

      }      }

    },    },

  ],  ],

  ignorePatterns: ["dist/", "node_modules/", "coverage/", "*.min.js", "src/"],  ignorePatterns: ["dist/", "node_modules/", "coverage/", "*.min.js", "src/"],

};};

