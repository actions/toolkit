// @ts-check

/** @type {import("eslint").Linter.Config} */
const config = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:unicorn/all',
    'turbo',
    'prettier'
  ],
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 'latest'
  },
  env: {
    browser: false,
    node: true,
    es2022: true
  },
  ignorePatterns: ['dist', 'node_modules'],
  overrides: [
    {
      env: {
        commonjs: true
      },
      files: ['*.cjs'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off'
      }
    },
    {
      files: ['*.test.ts'],
      plugins: ['vitest'],
      extends: ['plugin:vitest/all'],
      rules: {
        'vitest/consistent-test-it': ['error', {fn: 'test'}],
        'vitest/no-hooks': [
          'error',
          {allow: ['afterEach', 'beforeEach', 'afterAll', 'beforeAll']}
        ],
        'unicorn/no-null': 'off',
        'unicorn/numeric-separators-style': 'off',
        'vitest/max-expects': 'off',
        'vitest/no-mocks-import': 'off',
        'vitest/prefer-to-be-falsy': 'off',
        'vitest/prefer-to-be-truthy': 'off'
      }
    }
  ],
  rules: {
    'unicorn/prevent-abbreviations': 'off',
    'no-prototype-builtins': 'off'
  }
}

module.exports = config
