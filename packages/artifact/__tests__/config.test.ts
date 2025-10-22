import * as config from '../src/internal/shared/config'
import os from 'os'

// Mock the `cpus()` function in the `os` module
jest.mock('os', () => {
  const osActual = jest.requireActual('os')
  return {
    ...osActual,
    cpus: jest.fn()
  }
})

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

  it('should return value set in ACTIONS_ARTIFACT_UPLOAD_TIMEOUT_MS', () => {
    process.env.ACTIONS_ARTIFACT_UPLOAD_TIMEOUT_MS = '150000'
    expect(config.getUploadChunkTimeout()).toBe(150000)
  })

  it('should throw if value set in ACTIONS_ARTIFACT_UPLOAD_TIMEOUT_MS is invalid', () => {
    process.env.ACTIONS_ARTIFACT_UPLOAD_TIMEOUT_MS = 'abc'
    expect(() => {
      config.getUploadChunkTimeout()
    }).toThrow()
  })
})

describe('uploadConcurrencyEnv', () => {
  it('Concurrency default to 5', () => {
    ;(os.cpus as jest.Mock).mockReturnValue(new Array(4))
    expect(config.getConcurrency()).toBe(5)
  })

  it('Concurrency max out at 300 on systems with many CPUs', () => {
    ;(os.cpus as jest.Mock).mockReturnValue(new Array(32))
    process.env.ACTIONS_ARTIFACT_UPLOAD_CONCURRENCY = '301'
    expect(config.getConcurrency()).toBe(300)
  })

  it('Concurrency can be set to 32 when cpu num is <= 4', () => {
    ;(os.cpus as jest.Mock).mockReturnValue(new Array(4))
    process.env.ACTIONS_ARTIFACT_UPLOAD_CONCURRENCY = '32'
    expect(config.getConcurrency()).toBe(32)
  })

  it('Concurrency can be set 16 * num of cpu when cpu num is > 4', () => {
    ;(os.cpus as jest.Mock).mockReturnValue(new Array(6))
    process.env.ACTIONS_ARTIFACT_UPLOAD_CONCURRENCY = '96'
    expect(config.getConcurrency()).toBe(96)
  })

  it('Concurrency can be overridden by env var ACTIONS_ARTIFACT_UPLOAD_CONCURRENCY', () => {
    ;(os.cpus as jest.Mock).mockReturnValue(new Array(4))
    process.env.ACTIONS_ARTIFACT_UPLOAD_CONCURRENCY = '10'
    expect(config.getConcurrency()).toBe(10)
  })

  it('should throw with invalid value of ACTIONS_ARTIFACT_UPLOAD_CONCURRENCY', () => {
    ;(os.cpus as jest.Mock).mockReturnValue(new Array(4))
    process.env.ACTIONS_ARTIFACT_UPLOAD_CONCURRENCY = 'abc'
    expect(() => {
      config.getConcurrency()
    }).toThrow()
  })

  it('should throw if ACTIONS_ARTIFACT_UPLOAD_CONCURRENCY is < 1', () => {
    ;(os.cpus as jest.Mock).mockReturnValue(new Array(4))
    process.env.ACTIONS_ARTIFACT_UPLOAD_CONCURRENCY = '0'
    expect(() => {
      config.getConcurrency()
    }).toThrow()
  })
})

describe('getMaxArtifactListCount', () => {
  beforeEach(() => {
    delete process.env.ACTIONS_ARTIFACT_MAX_ARTIFACT_COUNT
  })

  it('should return default 1000 when no env set', () => {
    expect(config.getMaxArtifactListCount()).toBe(1000)
  })

  it('should return value set in ACTIONS_ARTIFACT_MAX_ARTIFACT_COUNT', () => {
    process.env.ACTIONS_ARTIFACT_MAX_ARTIFACT_COUNT = '2000'
    expect(config.getMaxArtifactListCount()).toBe(2000)
  })

  it('should throw if value set in ACTIONS_ARTIFACT_MAX_ARTIFACT_COUNT is invalid', () => {
    process.env.ACTIONS_ARTIFACT_MAX_ARTIFACT_COUNT = 'abc'
    expect(() => {
      config.getMaxArtifactListCount()
    }).toThrow(
      'Invalid value set for ACTIONS_ARTIFACT_MAX_ARTIFACT_COUNT env variable'
    )
  })

  it('should throw if ACTIONS_ARTIFACT_MAX_ARTIFACT_COUNT is < 1', () => {
    process.env.ACTIONS_ARTIFACT_MAX_ARTIFACT_COUNT = '0'
    expect(() => {
      config.getMaxArtifactListCount()
    }).toThrow(
      'Invalid value set for ACTIONS_ARTIFACT_MAX_ARTIFACT_COUNT env variable'
    )
  })

  it('should throw if ACTIONS_ARTIFACT_MAX_ARTIFACT_COUNT is negative', () => {
    process.env.ACTIONS_ARTIFACT_MAX_ARTIFACT_COUNT = '-100'
    expect(() => {
      config.getMaxArtifactListCount()
    }).toThrow(
      'Invalid value set for ACTIONS_ARTIFACT_MAX_ARTIFACT_COUNT env variable'
    )
  })
})
