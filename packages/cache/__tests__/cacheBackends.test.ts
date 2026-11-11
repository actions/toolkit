import {getCacheBackend} from '../src/internal/backends'
import {v1Backend} from '../src/internal/backends/v1'
import {v2Backend} from '../src/internal/backends/v2'

describe('getCacheBackend', () => {
  const env = process.env

  beforeEach(() => {
    process.env = {...env}
    delete process.env['ACTIONS_CACHE_URL']
    delete process.env['ACTIONS_RESULTS_URL']
  })

  afterAll(() => {
    process.env = env
  })

  test('returns the v2 backend for v2', () => {
    expect(getCacheBackend('v2')).toBe(v2Backend)
  })

  test('returns the v1 backend for v1', () => {
    expect(getCacheBackend('v1')).toBe(v1Backend)
  })

  test('falls back to the v1 backend for an unknown version', () => {
    expect(getCacheBackend('unknown')).toBe(v1Backend)
  })

  test('v1 is available only with ACTIONS_CACHE_URL', () => {
    expect(v1Backend.isAvailable()).toBe(false)
    process.env['ACTIONS_RESULTS_URL'] = 'https://results.example.com/'
    expect(v1Backend.isAvailable()).toBe(false)
    process.env['ACTIONS_CACHE_URL'] = 'https://cache.example.com/'
    expect(v1Backend.isAvailable()).toBe(true)
  })

  test('v2 is available only with ACTIONS_RESULTS_URL', () => {
    expect(v2Backend.isAvailable()).toBe(false)
    process.env['ACTIONS_CACHE_URL'] = 'https://cache.example.com/'
    expect(v2Backend.isAvailable()).toBe(false)
    process.env['ACTIONS_RESULTS_URL'] = 'https://results.example.com/'
    expect(v2Backend.isAvailable()).toBe(true)
  })
})
