import * as config from '../src/internal/shared/config'

beforeEach(() => {
  jest.resetModules()
})

describe('isGhes', () => {
  it('should return false when the request domain is github.com', () => {
    process.env.GITHUB_SERVER_URL = 'https://github.com'
    expect(config.isGhes()).toBe(false)
  })

  it('should return false when the request domain ends with ghe.com', () => {
    process.env.GITHUB_SERVER_URL = 'https://my.domain.ghe.com'
    expect(config.isGhes()).toBe(false)
  })

  it('should return false when the request domain ends with ghe.localhost', () => {
    process.env.GITHUB_SERVER_URL = 'https://my.domain.ghe.localhost'
    expect(config.isGhes()).toBe(false)
  })

  it('should return false when the request domain ends with .localhost', () => {
    process.env.GITHUB_SERVER_URL = 'https://github.localhost'
    expect(config.isGhes()).toBe(false)
  })

  it('should return false when the request domain is specific to an enterprise', () => {
    process.env.GITHUB_SERVER_URL = 'https://my-enterprise.github.com'
    expect(config.isGhes()).toBe(true)
  })
})

describe('uploadChunkTimeoutEnv', () => {
  it('should return default 300000 when no env set', () => {
    expect(config.getUploadChunkTimeout()).toBe(300000)
  })
  it('should return value set in ACTIONS_UPLOAD_TIMEOUT_MS', () => {
    process.env.ACTIONS_UPLOAD_TIMEOUT_MS = '150000'
    expect(config.getUploadChunkTimeout()).toBe(150000)
  })
  it('should throw if value set in ACTIONS_UPLOAD_TIMEOUT_MS is invalid', () => {
    process.env.ACTIONS_UPLOAD_TIMEOUT_MS = 'abc'
    expect(() => {
      config.getUploadChunkTimeout()
    }).toThrow()
  })
})
