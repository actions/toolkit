module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  roots: ['<rootDir>/packages'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/*.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@actions/core$': '<rootDir>/packages/core/lib/core.js',
    '^@actions/exec$': '<rootDir>/packages/exec/lib/exec.js',
    '^@actions/io$': '<rootDir>/packages/io/lib/io.js',
    '^@actions/io/lib/io-util$': '<rootDir>/packages/io/lib/io-util.js',
    '^@actions/http-client$': '<rootDir>/packages/http-client/lib/index.js',
    '^@actions/http-client/lib/auth$': '<rootDir>/packages/http-client/lib/auth.js',
    '^@actions/http-client/lib/interfaces$': '<rootDir>/packages/http-client/lib/interfaces.js',
    '^@actions/github$': '<rootDir>/packages/github/lib/github.js',
    '^@actions/github/lib/utils$': '<rootDir>/packages/github/lib/utils.js',
    '^@actions/glob$': '<rootDir>/packages/glob/lib/glob.js',
    '^@actions/tool-cache$': '<rootDir>/packages/tool-cache/lib/tool-cache.js',
    '^@actions/cache$': '<rootDir>/packages/cache/lib/cache.js',
    '^@actions/attest$': '<rootDir>/packages/attest/lib/index.js'
  },
  transform: {
    '^.+\\.(ts|js)$': ['ts-jest', {
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
    '/node_modules/(?!(@octokit|@actions/github|@actions/http-client|@actions/io|@actions/exec|@actions/core|@actions/glob|@actions/tool-cache|@actions/cache|@actions/attest|universal-user-agent|before-after-hook)/)'
  ],
  verbose: true
}
