import * as config from '../src/internal/shared/config'

beforeEach(() => {
  jest.resetModules()
})

describe('isGhes', () => {
  it('should return false when the request domain is github.com', () => {
    process.env.GITHUB_SERVER_URL = 'https://github.com'
    expect(config.isGhes()).toBe(false)
  })

  it('should return false when the request has ACTIONS_RESULTS_URL set', () => {
    process.env.ACTIONS_RESULTS_URL = 'my.results.url'
    expect(config.isGhes()).toBe(false)
  })

  it('should return false when the request domain is specific to an enterprise', () => {
    process.env.GITHUB_SERVER_URL = 'https://my-enterprise.github.com'
    expect(config.isGhes()).toBe(true)
  })
})
