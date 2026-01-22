module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.(ts|js)$': ['ts-jest', {
      useESM: false,
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