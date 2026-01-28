module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/*.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@actions/http-client$': '<rootDir>/../http-client/lib/index.js',
    '^@actions/http-client/lib/auth$': '<rootDir>/../http-client/lib/auth.js',
    '^@actions/github$': '<rootDir>/../github/lib/github.js',
    '^@actions/github/lib/utils$': '<rootDir>/../github/lib/utils.js'
  },
  transform: {
    '^.+\\.(ts|js)$': ['ts-jest', {
      isolatedModules: true,
      diagnostics: {warnOnly: true},
      tsconfig: {
        allowJs: true,
        esModuleInterop: true,
        module: 'commonjs',
        moduleResolution: 'node'
      }
    }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@octokit|@actions/github|@actions/http-client|universal-user-agent|before-after-hook)/)'
  ],
  verbose: true
}