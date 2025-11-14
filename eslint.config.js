const eslint = require('@eslint/js')
const tseslint = require('typescript-eslint')
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended')
const github = require('eslint-plugin-github')
const jest = require('eslint-plugin-jest')

module.exports = [
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    ignores: ['packages/glob/__tests__/_temp/**/*', '**/lib/**', '**/node_modules/**']
  },
  {
    plugins: {
      github: github,
      jest: jest
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 9,
        sourceType: 'module',
        projectService: {
          allowDefaultProject: ['*.js', '*.mjs'],
          defaultProject: './tsconfig.eslint.json'
        },
        tsconfigRootDir: __dirname
      },
      globals: {
        node: true,
        es6: true,
        'jest/globals': true
      }
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto'
        }
      ],
      'eslint-comments/no-use': 'off',
      'no-constant-condition': ['error', {checkLoops: false}],
      'github/no-then': 'off',
      'import/no-namespace': 'off',
      'no-shadow': 'off',
      'no-unused-vars': 'off',
      'i18n-text/no-en': 'off',
      'filenames/match-regex': 'off',
      'import/no-commonjs': 'off',
      'import/named': 'off',
      'no-sequences': 'off',
      'import/no-unresolved': 'off',
      'no-undef': 'off',
      'no-only-tests/no-only-tests': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'no-public'
        }
      ],
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/array-type': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      camelcase: 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true
        }
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          format: null,
          filter: {
            regex: '^[A-Z][A-Za-z]*$',
            match: true
          },
          selector: 'memberLike'
        }
      ],
      '@typescript-eslint/no-array-constructor': 'error',
      '@typescript-eslint/no-empty-interface': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-extraneous-class': 'error',
      '@typescript-eslint/no-for-in-array': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-misused-new': 'error',
      '@typescript-eslint/no-namespace': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-unnecessary-qualifier': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/prefer-for-of': 'warn',
      '@typescript-eslint/prefer-function-type': 'warn',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/require-array-sort-compare': 'error',
      semi: 'off',
      '@typescript-eslint/semi': ['error', 'never'],
      '@typescript-eslint/type-annotation-spacing': 'error',
      '@typescript-eslint/unbound-method': 'error'
    }
  }
]
