module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    // Code Style
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // Best Practices
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    
    // ES6+
    'arrow-spacing': 'error',
    'template-curly-spacing': 'error',
    
    // Electron specific
    'no-process-env': 'off'
  },
  overrides: [
    {
      files: ['main/**/*.js'],
      env: {
        browser: false,
        node: true
      }
    },
    {
      files: ['renderer/**/*.js'],
      env: {
        browser: true,
        node: false
      },
      globals: {
        'Chart': 'readonly',
        'window': 'readonly',
        'document': 'readonly'
      }
    }
  ]
};
