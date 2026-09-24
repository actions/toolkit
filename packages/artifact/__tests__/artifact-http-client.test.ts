import * as http from 'http'
import * as net from 'net'
import {HttpClient} from '@actions/http-client'
import * as config from '../src/internal/shared/config.js'
import {internalArtifactTwirpClient} from '../src/internal/shared/artifact-twirp-client.js'
import {noopLogs} from './common.js'
import {NetworkError, UsageError} from '../src/internal/shared/errors.js'

jest.mock('@actions/http-client')

const clientOptions = {
  maxAttempts: 5,
  retryIntervalMs: 1,
  retryMultiplier: 1.5
}

describe('artifact-http-client', () => {
  beforeAll(() => {
    noopLogs()
    jest
      .spyOn(config, 'getResultsServiceUrl')
      .mockReturnValue('http://localhost:8080')
    jest.spyOn(config, 'getRuntimeToken').mockReturnValue('token')
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully create a client', () => {
    const client = internalArtifactTwirpClient()
    expect(client).toBeDefined()
  })

  it('should make a request', async () => {
    const mockPost = jest.fn(() => {
      const msg = new http.IncomingMessage(new net.Socket())
      msg.statusCode = 200
      return {
        message: msg,
        readBody: async () => {
          return Promise.resolve(
            `{"ok": true, "signedUploadUrl": "http://localhost:8080/upload"}`
          )
        }
      }
    })
    const mockHttpClient = (
      HttpClient as unknown as jest.Mock
    ).mockImplementation(() => {
      return {
        post: mockPost
      }
    })

    const client = internalArtifactTwirpClient()
    const artifact = await client.CreateArtifact({
      workflowRunBackendId: '1234',
      workflowJobRunBackendId: '5678',
      name: 'artifact',
      version: 4
    })

    expect(mockHttpClient).toHaveBeenCalledTimes(1)
    expect(mockPost).toHaveBeenCalledTimes(1)
    expect(artifact).toBeDefined()
    expect(artifact.ok).toBe(true)
    expect(artifact.signedUploadUrl).toBe('http://localhost:8080/upload')
  })

  it('should retry if the request fails', async () => {
    const mockPost = jest
      .fn(() => {
        const msgSucceeded = new http.IncomingMessage(new net.Socket())
        msgSucceeded.statusCode = 200
        return {
          message: msgSucceeded,
          readBody: async () => {
            return Promise.resolve(
              `{"ok": true, "signedUploadUrl": "http://localhost:8080/upload"}`
            )
          }
        }
      })
      .mockImplementationOnce(() => {
        const msgFailed = new http.IncomingMessage(new net.Socket())
        msgFailed.statusCode = 500
        msgFailed.statusMessage = 'Internal Server Error'
        return {
          message: msgFailed,
          readBody: async () => {
            return Promise.resolve(`{"ok": false}`)
          }
        }
      })
    const mockHttpClient = (
      HttpClient as unknown as jest.Mock
    ).mockImplementation(() => {
      return {
        post: mockPost
      }
    })

    const client = internalArtifactTwirpClient(clientOptions)
    const artifact = await client.CreateArtifact({
      workflowRunBackendId: '1234',
      workflowJobRunBackendId: '5678',
      name: 'artifact',
      version: 4
    })

    expect(mockHttpClient).toHaveBeenCalledTimes(1)
    expect(artifact).toBeDefined()
    expect(artifact.ok).toBe(true)
    expect(artifact.signedUploadUrl).toBe('http://localhost:8080/upload')
    expect(mockPost).toHaveBeenCalledTimes(2)
  })

  it('should retry if invalid body response', async () => {
    const mockPost = jest
      .fn(() => {
        const msgSucceeded = new http.IncomingMessage(new net.Socket())
        msgSucceeded.statusCode = 200
        return {
          message: msgSucceeded,
          readBody: async () => {
            return Promise.resolve(
              `{"ok": true, "signedUploadUrl": "http://localhost:8080/upload"}`
            )
          }
        }
      })
      .mockImplementationOnce(() => {
        const msgFailed = new http.IncomingMessage(new net.Socket())
        msgFailed.statusCode = 502
        msgFailed.statusMessage = 'Bad Gateway'
        return {
          message: msgFailed,
          readBody: async () => {
            return Promise.resolve('💥')
          }
        }
      })
    const mockHttpClient = (
      HttpClient as unknown as jest.Mock
    ).mockImplementation(() => {
      return {
        post: mockPost
      }
    })

    const client = internalArtifactTwirpClient(clientOptions)
    const artifact = await client.CreateArtifact({
      workflowRunBackendId: '1234',
      workflowJobRunBackendId: '5678',
      name: 'artifact',
      version: 4
    })

    expect(mockHttpClient).toHaveBeenCalledTimes(1)
    expect(artifact).toBeDefined()
    expect(artifact.ok).toBe(true)
    expect(artifact.signedUploadUrl).toBe('http://localhost:8080/upload')
    expect(mockPost).toHaveBeenCalledTimes(2)
  })

  it('should fail if the request fails 5 times', async () => {
    const mockPost = jest.fn(() => {
      const msgFailed = new http.IncomingMessage(new net.Socket())
      msgFailed.statusCode = 500
      msgFailed.statusMessage = 'Internal Server Error'
      return {
        message: msgFailed,
        readBody: async () => {
          return Promise.resolve(`{"ok": false}`)
        }
      }
    })

    const mockHttpClient = (
      HttpClient as unknown as jest.Mock
    ).mockImplementation(() => {
      return {
        post: mockPost
      }
    })
    const client = internalArtifactTwirpClient(clientOptions)
    await expect(async () => {
      await client.CreateArtifact({
        workflowRunBackendId: '1234',
        workflowJobRunBackendId: '5678',
        name: 'artifact',
        version: 4
      })
    }).rejects.toThrowError(
      'Failed to make request after 5 attempts: Failed request: (500) Internal Server Error'
    )
    expect(mockHttpClient).toHaveBeenCalledTimes(1)
    expect(mockPost).toHaveBeenCalledTimes(5)
  })

  it('should fail immediately if there is a non-retryable error', async () => {
    const mockPost = jest.fn(() => {
      const msgFailed = new http.IncomingMessage(new net.Socket())
      msgFailed.statusCode = 401
      msgFailed.statusMessage = 'Unauthorized'
      return {
        message: msgFailed,
        readBody: async () => {
          return Promise.resolve(`{"ok": false}`)
        }
      }
    })

    const mockHttpClient = (
      HttpClient as unknown as jest.Mock
    ).mockImplementation(() => {
      return {
        post: mockPost
      }
    })
    const client = internalArtifactTwirpClient(clientOptions)
    await expect(async () => {
      await client.CreateArtifact({
        workflowRunBackendId: '1234',
        workflowJobRunBackendId: '5678',
        name: 'artifact',
        version: 4
      })
    }).rejects.toThrowError(
      'Received non-retryable error: Failed request: (401) Unauthorized'
    )
    expect(mockHttpClient).toHaveBeenCalledTimes(1)
    expect(mockPost).toHaveBeenCalledTimes(1)
  })

  it('should fail with a descriptive error', async () => {
    // 409 duplicate error
    const mockPost = jest.fn(() => {
      const msgFailed = new http.IncomingMessage(new net.Socket())
      msgFailed.statusCode = 409
      msgFailed.statusMessage = 'Conflict'
      return {
        message: msgFailed,
        readBody: async () => {
          return Promise.resolve(
            `{"msg": "an artifact with this name already exists on the workflow run"}`
          )
        }
      }
    })

    const mockHttpClient = (
      HttpClient as unknown as jest.Mock
    ).mockImplementation(() => {
      return {
        post: mockPost
      }
    })
    const client = internalArtifactTwirpClient(clientOptions)
    await expect(async () => {
      await client.CreateArtifact({
        workflowRunBackendId: '1234',
        workflowJobRunBackendId: '5678',
        name: 'artifact',
        version: 4
      })
      await client.CreateArtifact({
        workflowRunBackendId: '1234',
        workflowJobRunBackendId: '5678',
        name: 'artifact',
        version: 4
      })
    }).rejects.toThrowError(
      'Failed to CreateArtifact: Received non-retryable error: Failed request: (409) Conflict: an artifact with this name already exists on the workflow run'
    )
    expect(mockHttpClient).toHaveBeenCalledTimes(1)
    expect(mockPost).toHaveBeenCalledTimes(1)
  })

  it('should properly describe a network failure', async () => {
    class FakeNodeError extends Error {
      code: string
      constructor(code: string) {
        super()
        this.code = code
      }
    }

    const mockPost = jest.fn(() => {
      throw new FakeNodeError('ENOTFOUND')
    })

    const mockHttpClient = (
      HttpClient as unknown as jest.Mock
    ).mockImplementation(() => {
      return {
        post: mockPost
      }
    })
    const client = internalArtifactTwirpClient()
    await expect(async () => {
      await client.CreateArtifact({
        workflowRunBackendId: '1234',
        workflowJobRunBackendId: '5678',
        name: 'artifact',
        version: 4
      })
    }).rejects.toThrowError(new NetworkError('ENOTFOUND').message)
    expect(mockHttpClient).toHaveBeenCalledTimes(1)
    expect(mockPost).toHaveBeenCalledTimes(1)
  })

  it('should properly describe a usage error', async () => {
    const mockPost = jest.fn(() => {
      const msgFailed = new http.IncomingMessage(new net.Socket())
      msgFailed.statusCode = 403
      msgFailed.statusMessage = 'Forbidden'
      return {
        message: msgFailed,
        readBody: async () => {
          return Promise.resolve(
            `{"msg": "insufficient usage to create artifact"}`
          )
        }
      }
    })

    const mockHttpClient = (
      HttpClient as unknown as jest.Mock
    ).mockImplementation(() => {
      return {
        post: mockPost
      }
    })
    const client = internalArtifactTwirpClient()
    await expect(async () => {
      await client.CreateArtifact({
        workflowRunBackendId: '1234',
        workflowJobRunBackendId: '5678',
        name: 'artifact',
        version: 4
      })
    }).rejects.toThrowError(new UsageError().message)
    expect(mockHttpClient).toHaveBeenCalledTimes(1)
    expect(mockPost).toHaveBeenCalledTimes(1)
  })
  describe('retry wait times', () => {
    let sleepSpy: jest.SpyInstance
    let randomSpy: jest.SpyInstance | undefined

    const createArtifactRequest = {
      workflowRunBackendId: '1234',
      workflowJobRunBackendId: '5678',
      name: 'artifact',
      version: 4
    }

    const successResponse = (): object => {
      const msg = new http.IncomingMessage(new net.Socket())
      msg.statusCode = 200
      return {
        message: msg,
        readBody: async () =>
          Promise.resolve(
            `{"ok": true, "signedUploadUrl": "http://localhost:8080/upload"}`
          )
      }
    }

    const failedResponse = (
      statusCode: number,
      statusMessage: string,
      headers: http.IncomingHttpHeaders = {},
      body = `{"ok": false}`
    ): object => {
      const msg = new http.IncomingMessage(new net.Socket())
      msg.statusCode = statusCode
      msg.statusMessage = statusMessage
      msg.headers = headers
      return {
        message: msg,
        readBody: async () => Promise.resolve(body)
      }
    }

    const rateLimitedResponse = (retryAfter?: string): object =>
      failedResponse(
        429,
        'Too Many Requests',
        retryAfter === undefined ? {} : {'retry-after': retryAfter},
        `{"code": "resource_exhausted", "msg": "rate limit exceeded"}`
      )

    const mockPostResponses = (...responses: object[]): jest.Mock => {
      const mockPost = jest.fn(successResponse)
      for (const response of responses) {
        mockPost.mockImplementationOnce(() => response)
      }
      ;(HttpClient as unknown as jest.Mock).mockImplementation(() => ({
        post: mockPost
      }))
      return mockPost
    }

    const sleepTimes = (): number[] =>
      sleepSpy.mock.calls.map(call => call[1] as number)

    beforeEach(() => {
      sleepSpy = jest.spyOn(global, 'setTimeout').mockImplementation(((
        callback: () => void
      ) => {
        callback()
        return undefined
      }) as unknown as typeof setTimeout)
    })

    afterEach(() => {
      sleepSpy.mockRestore()
      randomSpy?.mockRestore()
      randomSpy = undefined
    })

    it('should honor Retry-After on 429 with jitter', async () => {
      randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5)
      const mockPost = mockPostResponses(rateLimitedResponse('30'))

      const client = internalArtifactTwirpClient()
      const artifact = await client.CreateArtifact(createArtifactRequest)

      expect(artifact.ok).toBe(true)
      expect(mockPost).toHaveBeenCalledTimes(2)
      expect(sleepTimes()).toEqual([32500])
    })

    it('should keep Retry-After jitter within bounds', async () => {
      mockPostResponses(rateLimitedResponse('30'))

      const client = internalArtifactTwirpClient()
      await client.CreateArtifact(createArtifactRequest)

      const [waitTime] = sleepTimes()
      expect(waitTime).toBeGreaterThanOrEqual(30000)
      expect(waitTime).toBeLessThan(35000)
    })

    it('should honor Retry-After on 503 with jitter', async () => {
      randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.999)
      const mockPost = mockPostResponses(
        failedResponse(503, 'Service Unavailable', {'retry-after': '10'})
      )

      const client = internalArtifactTwirpClient()
      const artifact = await client.CreateArtifact(createArtifactRequest)

      expect(artifact.ok).toBe(true)
      expect(mockPost).toHaveBeenCalledTimes(2)
      expect(sleepTimes()).toEqual([14995])
    })

    it('should add jitter to the first backoff retry', async () => {
      randomSpy = jest
        .spyOn(Math, 'random')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.999)
      mockPostResponses(
        failedResponse(500, 'Internal Server Error'),
        failedResponse(500, 'Internal Server Error'),
        successResponse(),
        failedResponse(500, 'Internal Server Error')
      )

      const client = internalArtifactTwirpClient()
      await client.CreateArtifact(createArtifactRequest)
      await client.CreateArtifact(createArtifactRequest)

      // first call: attempt 0 and attempt 1, second call: attempt 0
      const [firstMin, , firstMax] = sleepTimes()
      expect(firstMin).toBe(3000)
      expect(firstMax).toBeGreaterThanOrEqual(3000)
      expect(firstMax).toBeLessThan(4500)
    })

    it('should honor a 60s Retry-After on consecutive attempts', async () => {
      randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0)
      const mockPost = mockPostResponses(
        rateLimitedResponse('60'),
        rateLimitedResponse('60'),
        rateLimitedResponse('60'),
        rateLimitedResponse('60')
      )

      const client = internalArtifactTwirpClient()
      const artifact = await client.CreateArtifact(createArtifactRequest)

      expect(artifact.ok).toBe(true)
      expect(mockPost).toHaveBeenCalledTimes(5)
      expect(sleepTimes()).toEqual([60000, 60000, 60000, 60000])
    })

    it('should fail fast when Retry-After plus jitter exceeds the maximum wait', async () => {
      randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5)
      const mockPost = mockPostResponses(rateLimitedResponse('148'))

      const client = internalArtifactTwirpClient()
      await expect(
        client.CreateArtifact(createArtifactRequest)
      ).rejects.toThrow(
        'Failed to CreateArtifact: Retry-After of 148 seconds (150500 ms with jitter) exceeds the maximum wait of 150000 ms: Failed request: (429) Too Many Requests: rate limit exceeded'
      )
      expect(mockPost).toHaveBeenCalledTimes(1)
      expect(sleepSpy).not.toHaveBeenCalled()
    })

    it('should fail fast after an honored Retry-After when the next one is too long', async () => {
      randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0)
      const mockPost = mockPostResponses(
        rateLimitedResponse('60'),
        rateLimitedResponse('151')
      )

      const client = internalArtifactTwirpClient()
      await expect(
        client.CreateArtifact(createArtifactRequest)
      ).rejects.toThrow('Retry-After of 151 seconds')
      expect(mockPost).toHaveBeenCalledTimes(2)
      expect(sleepTimes()).toEqual([60000])
    })

    it('should honor a Retry-After wait equal to the maximum wait', async () => {
      randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0)
      mockPostResponses(rateLimitedResponse('150'))

      const client = internalArtifactTwirpClient()
      const artifact = await client.CreateArtifact(createArtifactRequest)

      expect(artifact.ok).toBe(true)
      expect(sleepTimes()).toEqual([150000])
    })

    it('should not cap backoff waits', async () => {
      randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0)
      mockPostResponses(failedResponse(500, 'Internal Server Error'))

      const client = internalArtifactTwirpClient({retryIntervalMs: 200000})
      const artifact = await client.CreateArtifact(createArtifactRequest)

      expect(artifact.ok).toBe(true)
      expect(sleepTimes()).toEqual([200000])
    })

    it.each([
      ['missing', undefined],
      ['empty', ''],
      ['zero', '0'],
      ['negative', '-5'],
      ['non-numeric', 'abc'],
      ['decimal', '1.5'],
      ['HTTP-date', 'Wed, 21 Oct 2015 07:28:00 GMT']
    ])(
      'should fall back to backoff when Retry-After is %s',
      async (_, retryAfter) => {
        const mockPost = mockPostResponses(rateLimitedResponse(retryAfter))

        const client = internalArtifactTwirpClient()
        const artifact = await client.CreateArtifact(createArtifactRequest)

        expect(artifact.ok).toBe(true)
        expect(mockPost).toHaveBeenCalledTimes(2)
        const [waitTime] = sleepTimes()
        expect(waitTime).toBeGreaterThanOrEqual(3000)
        expect(waitTime).toBeLessThan(4500)
      }
    )

    it('should ignore Retry-After on other retryable statuses', async () => {
      mockPostResponses(
        failedResponse(500, 'Internal Server Error', {'retry-after': '30'})
      )

      const client = internalArtifactTwirpClient()
      await client.CreateArtifact(createArtifactRequest)

      const [waitTime] = sleepTimes()
      expect(waitTime).toBeGreaterThanOrEqual(3000)
      expect(waitTime).toBeLessThan(4500)
    })

    it('should fail immediately on non-retryable status with Retry-After', async () => {
      const mockPost = mockPostResponses(
        failedResponse(400, 'Bad Request', {'retry-after': '5'})
      )

      const client = internalArtifactTwirpClient()
      await expect(
        client.CreateArtifact(createArtifactRequest)
      ).rejects.toThrow(
        'Received non-retryable error: Failed request: (400) Bad Request'
      )
      expect(mockPost).toHaveBeenCalledTimes(1)
      expect(sleepSpy).not.toHaveBeenCalled()
    })
  })
})
