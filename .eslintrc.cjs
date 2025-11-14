module.exports = {
    root: true,
    env: {
        es2022: true
    },
    ignorePatterns: [
        'node_modules/',
        'dist/',
        'coverage/',
        'server/database/*.sqlite3',
        'bundle-analysis.json'
    ],
    overrides: [
        {
            files: ['src/**/*.js', 'js/**/*.js', 'pages/**/*.js'],
            env: {
                browser: true,
                es2022: true
            },
            extends: ['eslint:recommended'],
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module'
            },
            rules: {
                'no-unused-vars': ['warn', { args: 'after-used', ignoreRestSiblings: true }],
                'no-console': 'off',
                'no-undef': 'off',
                'no-case-declarations': 'off',
                'no-useless-escape': 'off',
                'no-prototype-builtins': 'off'
            }
        },
        {
            files: ['server/**/*.js', 'tools/**/*.js', 'scripts/**/*.js'],
            env: {
                node: true,
                es2022: true
            },
            extends: ['eslint:recommended'],
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'script'
            },
            rules: {
                'no-unused-vars': ['warn', { args: 'after-used', ignoreRestSiblings: true }],
                'no-console': 'off'
            }
        },
        {
            files: ['__tests__/**/*.js'],
            env: {
                jest: true,
                node: true,
                es2022: true
            },
            extends: ['eslint:recommended'],
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module'
            },
            rules: {
                'no-unused-vars': ['warn', { args: 'after-used', ignoreRestSiblings: true }],
                'no-console': 'off'
            }
        }
    ]
};
