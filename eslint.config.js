// @ts-check
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'error',
      'no-console': 'warn',
    },
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'scripts/**', 'src/dashboard/static/**'],
  },
);
