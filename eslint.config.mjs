import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'assets/**', 'artifacts/**'] },
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: { sourceType: 'script', globals: globals.browser },
    rules: {
      'no-unused-vars': ['error', { args: 'all', argsIgnorePattern: '^_' }],
      eqeqeq: 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-implicit-globals': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-throw-literal': 'error',
      'no-constant-binary-expression': 'error',
      'no-duplicate-imports': 'error',
    },
  },
  ...['domain', 'application'].map((layer) => ({
    files: [`src/${layer}/**/*.js`],
    languageOptions: {
      globals: {
        ...Object.fromEntries(Object.keys(globals.browser).map((name) => [name, 'off'])),
        ...globals.builtin,
      },
    },
    rules: {
      complexity: ['error', 15],
      'max-depth': ['error', 4],
      'max-statements': ['error', 25],
      'no-restricted-syntax': [
        'error',
        {
          selector: `MemberExpression[object.object.name='globalThis'][object.property.name='TBS'][property.name!='${layer}']`,
          message: `${layer} must use its own registry and dependencies passed through arguments.`,
        },
      ],
    },
  })),
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },
  {
    files: ['tools/check-browser.cjs'],
    languageOptions: { globals: globals.browser },
  },
];
