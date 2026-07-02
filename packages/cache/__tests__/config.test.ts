import * as config from '../src/internal/config'

beforeEach(() => {
  jest.resetModules()
})

test('isGhes returns false for github.com', async () => {
  process.env.GITHUB_SERVER_URL = 'https://github.com'
  expect(config.isGhes()).toBe(false)
})

test('isGhes returns false for ghe.com', async () => {
  process.env.GITHUB_SERVER_URL = 'https://somedomain.ghe.com'
  expect(config.isGhes()).toBe(false)
})

test('isGhes returns true for enterprise URL', async () => {
  process.env.GITHUB_SERVER_URL = 'https://my-enterprise.github.com'
  expect(config.isGhes()).toBe(true)
})

test('isGhes returns false for ghe.localhost', () => {
  process.env.GITHUB_SERVER_URL = 'https://my.domain.ghe.localhost'
  expect(config.isGhes()).toBe(false)
})

describe('cache-mode helpers', () => {
  const original = process.env.ACTIONS_CACHE_MODE

  afterEach(() => {
    if (original === undefined) {
      delete process.env.ACTIONS_CACHE_MODE
    } else {
      process.env.ACTIONS_CACHE_MODE = original
    }
  })

  test('getCacheMode normalizes whitespace and case', () => {
    process.env.ACTIONS_CACHE_MODE = '  Write-Only  '
    expect(config.getCacheMode()).toBe('write-only')
  })

  test('getCacheMode returns empty string when unset', () => {
    delete process.env.ACTIONS_CACHE_MODE
    expect(config.getCacheMode()).toBe('')
  })

  test.each([
    ['', true, true],
    ['read', true, false],
    ['write', true, true],
    ['write-only', false, true],
    ['none', false, false],
    ['garbage', true, true]
  ])("mode '%s' -> readable=%s writable=%s", (mode, readable, writable) => {
    expect(config.isCacheReadable(mode)).toBe(readable)
    expect(config.isCacheWritable(mode)).toBe(writable)
  })
})
