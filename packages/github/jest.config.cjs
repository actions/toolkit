/** @type {import('jest').Config} */
module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.(ts|js)$': ['ts-jest', {
      tsconfig: {
        allowJs: true,
        esModuleInterop: true,
        module: 'node16',
        moduleResolution: 'node16'
      }
    }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@octokit|universal-user-agent|before-after-hook)/)'
  ],
  verbose: true
}