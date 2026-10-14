import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const typescriptFiles = ['src/**/*.ts', 'types/**/*.d.ts'];
const browserOnlyGlobals = Object.keys(globals.browser).filter(
  (name) => !Object.hasOwn(globals.builtin, name),
);

export default [
  { ignores: ['node_modules/**', 'assets/**', 'artifacts/**', 'dist/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended.map((config) => ({ ...config, files: typescriptFiles })),
  {
    files: ['src/**/*.js', 'src/**/*.ts'],
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
  {
    files: typescriptFiles,
    languageOptions: { sourceType: 'script' },
    rules: {
      'no-undef': 'off', // The strict TS7 compiler checks cross-file ambient declarations.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'all', argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['types/**/*.d.ts'],
    rules: {
      'no-var': 'off', // Ambient declare var exposes the existing classic-script globalThis registry.
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' }, // Named handles participate in declaration merging.
      ],
    },
  },
  {
    files: ['src/adapters/world/showcase/materials.ts'],
    rules: {
      // Preserve the original Canvas call ternary; both branches must still have effects.
      '@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true }],
    },
  },
  ...['domain', 'application'].map((layer) => ({
    files: [`src/${layer}/**/*.{js,ts}`],
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
      'no-restricted-globals': [
        'error',
        { globals: [...browserOnlyGlobals, 'THREE'], checkGlobalObject: true },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: `MemberExpression[object.object.name='globalThis']:matches([object.property.name='TBS'], [object.property.value='TBS'])[property.name!='${layer}'][property.value!='${layer}']`,
          message: `${layer} must use its own registry and dependencies passed through arguments.`,
        },
        {
          selector:
            "ImportDeclaration[importKind!='type'], ImportExpression, CallExpression[callee.name='require']",
          message: 'Pure layers must receive runtime dependencies through arguments.',
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
