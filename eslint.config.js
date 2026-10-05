const js = require('@eslint/js');
const globals = require('globals');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.expo/**',
      '**/coverage/**',
      '**/.turbo/**',
      'ReferenceResources/**',
      '.adera/**',
      'docs/**',
      'memory/**',
      '**/dist/**',
      '**/*.min.js',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        __DEV__: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      // Pragmatic monorepo rules — warnings for style, errors only for real bugs
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-undef': 'off', // RN/Metro globals are not statically resolvable in this setup
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      // Real bug catcher stays an error; the strict React-compiler-era rules are
      // advisory in this codebase (legacy patterns, empty catch blocks, etc.)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'preserve-caught-error': 'warn',
    },
  },
  {
    files: ['**/__tests__/**/*.js', '**/*.test.js', 'jest.setup.js', 'jest.config.js'],
    languageOptions: {
      globals: { ...globals.jest, ...globals.node },
    },
    rules: {
      'no-console': 'off',
    },
  },
  prettierConfig,
];
