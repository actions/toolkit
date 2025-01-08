import * as config from '../src/internal/shared/config'
import os from 'os'

// Mock the 'os' module
jest.mock('os', () => ({
  cpus: jest.fn()
}))

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

describe('uploadConcurrencyEnv', () => {
  it('should return default 32 when cpu num is <= 4', () => {
    ;(os.cpus as jest.Mock).mockReturnValue(new Array(4))
    expect(config.getConcurrency()).toBe(32)
  })

  it('should return 16 * num of cpu when cpu num is > 4', () => {
    ;(os.cpus as jest.Mock).mockReturnValue(new Array(6))
    expect(config.getConcurrency()).toBe(96)
  })

  it('should return up to 300 max value', () => {
    ;(os.cpus as jest.Mock).mockReturnValue(new Array(32))
    expect(config.getConcurrency()).toBe(300)
  })

  it('should return override value when ACTIONS_UPLOAD_CONCURRENCY is set', () => {
    ;(os.cpus as jest.Mock).mockReturnValue(new Array(4))
    process.env.ACTIONS_UPLOAD_CONCURRENCY = '10'
    expect(config.getConcurrency()).toBe(10)
  })

  it('should throw with invalid value of ACTIONS_UPLOAD_CONCURRENCY', () => {
    ;(os.cpus as jest.Mock).mockReturnValue(new Array(4))
    process.env.ACTIONS_UPLOAD_CONCURRENCY = 'abc'
    expect(() => {
      config.getConcurrency()
    }).toThrow()
  })

  it('should throw if ACTIONS_UPLOAD_CONCURRENCY is < 1', () => {
    ;(os.cpus as jest.Mock).mockReturnValue(new Array(4))
    process.env.ACTIONS_UPLOAD_CONCURRENCY = '0'
    expect(() => {
      config.getConcurrency()
    }).toThrow()
  })

  it('cannot go over currency cap when override value is greater', () => {
    ;(os.cpus as jest.Mock).mockReturnValue(new Array(4))
    process.env.ACTIONS_UPLOAD_CONCURRENCY = '40'
    expect(config.getConcurrency()).toBe(32)
  })
})
