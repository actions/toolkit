import * as cache from '../src/cache'

test('isFeatureAvailable returns true if server url is set', () => {
  try {
    process.env['WARPBUILD_CACHE_URL'] = 'http://cache.com'
    expect(cache.isFeatureAvailable()).toBe(true)
  } finally {
    delete process.env['WARPBUILD_CACHE_URL']
  }
})

test('isFeatureAvailable returns false if server url is not set', () => {
  expect(cache.isFeatureAvailable()).toBe(false)
})
