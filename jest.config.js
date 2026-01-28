module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  roots: ['<rootDir>/packages'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/*.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@actions/io$': '<rootDir>/packages/io/lib/io.js',
    '^@actions/io/lib/io-util$': '<rootDir>/packages/io/lib/io-util.js',
    '^@actions/http-client$': '<rootDir>/packages/http-client/lib/index.js',
    '^@actions/http-client/lib/auth$': '<rootDir>/packages/http-client/lib/auth.js',
    '^@actions/github$': '<rootDir>/packages/github/lib/github.js',
    '^@actions/github/lib/utils$': '<rootDir>/packages/github/lib/utils.js'
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
    '/node_modules/(?!(@octokit|@actions/github|@actions/http-client|@actions/io|universal-user-agent|before-after-hook)/)'
  ],
  verbose: true
}
