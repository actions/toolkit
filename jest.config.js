module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  roots: ['<rootDir>/packages'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/*.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.(ts|js)$': ['ts-jest', {
      isolatedModules: true,
      diagnostics: {warnOnly: true},
      tsconfig: {
        allowJs: true,
        esModuleInterop: true
      }
    }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@octokit|universal-user-agent|before-after-hook)/)'
  ],
  verbose: true
}
