module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  roots: ['<rootDir>/packages'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/*.test.ts'],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  verbose: true
}