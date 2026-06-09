import github from 'eslint-plugin-github'
import jest from 'eslint-plugin-jest'
import prettier from 'eslint-plugin-prettier/recommended'

const githubConfigs = github.getFlatConfigs()

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/lib/**',
      '**/dist/**',
      'packages/glob/__tests__/_temp/**',
      '**/generated/**'
    ]
  },
  githubConfigs.recommended,
  ...githubConfigs.typescript,
  prettier,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json'
      }
    },
    rules: {
      // Prettier
      'prettier/prettier': ['error', {endOfLine: 'auto'}],

      // Disable rules that conflict with project style
      'eslint-comments/no-use': 'off',
      'github/no-then': 'off',
      'github/filenames-match-regex': 'off',
      'import/no-namespace': 'off',
      'import/no-commonjs': 'off',
      'import/named': 'off',
      'import/no-unresolved': 'off',
      'i18n-text/no-en': 'off',
      'filenames/match-regex': 'off',
      'no-shadow': 'off',
      'no-unused-vars': 'off',
      'no-sequences': 'off',
      'no-undef': 'off',
      'no-only-tests/no-only-tests': 'off',
      'no-constant-condition': ['error', {checkLoops: false}],
      camelcase: 'off',

      // Disable stricter rules from eslint-plugin-github v6
      '@typescript-eslint/no-shadow': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',

      // TypeScript rules
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {accessibility: 'no-public'}
      ],
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/consistent-type-assertions': 'off',
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {allowExpressions: true}
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
      '@typescript-eslint/no-empty-object-type': 'error',
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
      '@typescript-eslint/prefer-for-of': 'warn',
      '@typescript-eslint/prefer-function-type': 'warn',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/require-array-sort-compare': 'error',
      '@typescript-eslint/unbound-method': 'error'
    }
  },
  {
    files: ['**/__tests__/**/*.ts'],
    ...jest.configs['flat/recommended'],
    rules: {
      ...jest.configs['flat/recommended'].rules,
      'jest/expect-expect': 'off',
      'jest/no-conditional-expect': 'off',
      'jest/no-standalone-expect': 'off',
      'jest/no-alias-methods': 'off',
      'jest/valid-expect': 'off',
      'jest/no-export': 'off',
      'jest/no-done-callback': 'off',
      'jest/no-jasmine-globals': 'off',
      'jest/no-identical-title': 'off',
      'jest/no-commented-out-tests': 'off'
    }
  }
]
