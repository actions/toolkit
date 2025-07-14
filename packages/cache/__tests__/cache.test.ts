import * as cache from '../src/cache'

describe('isFeatureAvailable', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = {...originalEnv}
    // Clean cache-related environment variables
    delete process.env['ACTIONS_CACHE_URL']
    delete process.env['ACTIONS_RESULTS_URL']
    delete process.env['ACTIONS_CACHE_SERVICE_V2']
    delete process.env['GITHUB_SERVER_URL']
  })

  afterAll(() => {
    process.env = originalEnv
  })

  test('returns true for cache service v1 when ACTIONS_CACHE_URL is set', () => {
    process.env['ACTIONS_CACHE_URL'] = 'http://cache.com'
    expect(cache.isFeatureAvailable()).toBe(true)
  })

  test('returns false for cache service v1 when only ACTIONS_RESULTS_URL is set', () => {
    process.env['ACTIONS_RESULTS_URL'] = 'http://results.com'
    expect(cache.isFeatureAvailable()).toBe(false)
  })

  test('returns true for cache service v1 when both URLs are set', () => {
    process.env['ACTIONS_CACHE_URL'] = 'http://cache.com'
    process.env['ACTIONS_RESULTS_URL'] = 'http://results.com'
    expect(cache.isFeatureAvailable()).toBe(true)
  })

  test('returns true for cache service v2 when ACTIONS_RESULTS_URL is set', () => {
    process.env['ACTIONS_CACHE_SERVICE_V2'] = 'true'
    process.env['ACTIONS_RESULTS_URL'] = 'http://results.com'
    expect(cache.isFeatureAvailable()).toBe(true)
  })

  test('returns false for cache service v2 when only ACTIONS_CACHE_URL is set', () => {
    process.env['ACTIONS_CACHE_SERVICE_V2'] = 'true'
    process.env['ACTIONS_CACHE_URL'] = 'http://cache.com'
    expect(cache.isFeatureAvailable()).toBe(false)
  })

  test('returns false when no cache URLs are set', () => {
    expect(cache.isFeatureAvailable()).toBe(false)
  })

  test('returns false for cache service v2 when no URLs are set', () => {
    process.env['ACTIONS_CACHE_SERVICE_V2'] = 'true'
    expect(cache.isFeatureAvailable()).toBe(false)
  })

  test('returns true for GHES with v1 even when v2 flag is set', () => {
    process.env['GITHUB_SERVER_URL'] = 'https://my-enterprise.github.com'
    process.env['ACTIONS_CACHE_SERVICE_V2'] = 'true'
    process.env['ACTIONS_CACHE_URL'] = 'http://cache.com'
    expect(cache.isFeatureAvailable()).toBe(true)
  })

  test('returns false for GHES with only ACTIONS_RESULTS_URL', () => {
    process.env['GITHUB_SERVER_URL'] = 'https://my-enterprise.github.com'
    process.env['ACTIONS_RESULTS_URL'] = 'http://results.com'
    expect(cache.isFeatureAvailable()).toBe(false)
  })
})
