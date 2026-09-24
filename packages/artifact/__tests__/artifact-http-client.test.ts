import * as http from 'http'
import * as core from '@actions/core'
import * as net from 'net'
import {HttpClient} from '@actions/http-client'
import * as config from '../src/internal/shared/config.js'
import {internalArtifactTwirpClient} from '../src/internal/shared/artifact-twirp-client.js'
import {noopLogs} from './common.js'
import {NetworkError, UsageError} from '../src/internal/shared/errors.js'

jest.mock('@actions/http-client')

const clientOptions = {
  maxAttempts: 4,
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

  it('should fail if the request fails 4 times', async () => {
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
      'Failed to make request after 4 attempts: Failed request: (500) Internal Server Error'
    )
    expect(mockHttpClient).toHaveBeenCalledTimes(1)
    expect(mockPost).toHaveBeenCalledTimes(4)
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

    it('should honor Retry-After on 429', async () => {
      const mockPost = mockPostResponses(rateLimitedResponse('30'))

      const client = internalArtifactTwirpClient()
      const artifact = await client.CreateArtifact(createArtifactRequest)

      expect(artifact.ok).toBe(true)
      expect(mockPost).toHaveBeenCalledTimes(2)
      expect(sleepTimes()).toEqual([30000])
    })

    it('should honor Retry-After on 503', async () => {
      const mockPost = mockPostResponses(
        failedResponse(503, 'Service Unavailable', {'retry-after': '10'})
      )

      const client = internalArtifactTwirpClient()
      const artifact = await client.CreateArtifact(createArtifactRequest)

      expect(artifact.ok).toBe(true)
      expect(mockPost).toHaveBeenCalledTimes(2)
      expect(sleepTimes()).toEqual([10000])
    })

    it('should fail without sleeping once Retry-After waits exhaust the total wait budget', async () => {
      const mockPost = mockPostResponses(
        rateLimitedResponse('60'),
        rateLimitedResponse('60'),
        rateLimitedResponse('60')
      )

      const client = internalArtifactTwirpClient()
      await expect(
        client.CreateArtifact(createArtifactRequest)
      ).rejects.toThrow(
        'Failed to CreateArtifact: Retry wait of 60000 ms would exceed the maximum total retry wait of 120000 ms: Failed request: (429) Too Many Requests: rate limit exceeded'
      )
      expect(mockPost).toHaveBeenCalledTimes(3)
      expect(sleepTimes()).toEqual([60000, 60000])
    })

    it('should fail immediately when a single Retry-After exceeds the total wait budget', async () => {
      const mockPost = mockPostResponses(rateLimitedResponse('121'))

      const client = internalArtifactTwirpClient()
      await expect(
        client.CreateArtifact(createArtifactRequest)
      ).rejects.toThrow(
        'Retry wait of 121000 ms would exceed the maximum total retry wait of 120000 ms: Failed request: (429) Too Many Requests: rate limit exceeded'
      )
      expect(mockPost).toHaveBeenCalledTimes(1)
      expect(sleepSpy).not.toHaveBeenCalled()
    })

    it('should honor a Retry-After that exactly fills the total wait budget', async () => {
      const mockPost = mockPostResponses(rateLimitedResponse('120'))

      const client = internalArtifactTwirpClient()
      const artifact = await client.CreateArtifact(createArtifactRequest)

      expect(artifact.ok).toBe(true)
      expect(mockPost).toHaveBeenCalledTimes(2)
      expect(sleepTimes()).toEqual([120000])
    })

    it('should count backoff waits toward the total wait budget', async () => {
      randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0)
      const mockPost = mockPostResponses(
        failedResponse(500, 'Internal Server Error'),
        failedResponse(503, 'Service Unavailable', {'retry-after': '107'})
      )

      const client = internalArtifactTwirpClient()
      await expect(
        client.CreateArtifact(createArtifactRequest)
      ).rejects.toThrow(
        'Retry wait of 107000 ms would exceed the maximum total retry wait of 120000 ms: Failed request: (503) Service Unavailable'
      )
      expect(mockPost).toHaveBeenCalledTimes(2)
      expect(sleepTimes()).toEqual([14000])
    })

    it.each([
      [429, 'Too Many Requests'],
      [503, 'Service Unavailable']
    ])(
      'should honor Retry-After on %s with a non-JSON body',
      async (statusCode, statusMessage) => {
        const mockPost = mockPostResponses(
          failedResponse(
            statusCode,
            statusMessage,
            {'retry-after': '20'},
            '<html>rate limited</html>'
          )
        )

        const client = internalArtifactTwirpClient()
        const artifact = await client.CreateArtifact(createArtifactRequest)

        expect(artifact.ok).toBe(true)
        expect(mockPost).toHaveBeenCalledTimes(2)
        expect(sleepTimes()).toEqual([20000])
      }
    )

    it('should fail fast when Retry-After exceeds the total wait budget with a non-JSON body', async () => {
      const mockPost = mockPostResponses(
        failedResponse(
          429,
          'Too Many Requests',
          {'retry-after': '121'},
          '<html>rate limited</html>'
        )
      )

      const client = internalArtifactTwirpClient()
      await expect(
        client.CreateArtifact(createArtifactRequest)
      ).rejects.toThrow(
        'Retry wait of 121000 ms would exceed the maximum total retry wait of 120000 ms'
      )
      expect(mockPost).toHaveBeenCalledTimes(1)
      expect(sleepSpy).not.toHaveBeenCalled()
    })

    const serverErrors = (count: number): object[] =>
      Array.from({length: count}, () =>
        failedResponse(500, 'Internal Server Error')
      )

    it('should use the minimum default backoff waits and complete within the total wait budget', async () => {
      randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0)
      const mockPost = mockPostResponses(...serverErrors(3))

      const client = internalArtifactTwirpClient()
      const artifact = await client.CreateArtifact(createArtifactRequest)

      expect(artifact.ok).toBe(true)
      expect(mockPost).toHaveBeenCalledTimes(4)
      expect(sleepTimes()).toEqual([14000, 21000, 31500])
    })

    it('should use the maximum default backoff waits and complete within 110s', async () => {
      randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.9999999)
      const mockPost = mockPostResponses(...serverErrors(3))

      const client = internalArtifactTwirpClient()
      const artifact = await client.CreateArtifact(createArtifactRequest)

      expect(artifact.ok).toBe(true)
      expect(mockPost).toHaveBeenCalledTimes(4)
      expect(sleepTimes()).toEqual([14000, 31499, 47249])
      const totalWait = sleepTimes().reduce((sum, wait) => sum + wait, 0)
      expect(totalWait).toBeLessThanOrEqual(110000)
    })

    it('should fail fast when the next backoff wait exceeds the remaining wait budget', async () => {
      randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0)
      const mockPost = mockPostResponses(...serverErrors(4))

      const client = internalArtifactTwirpClient({
        retryIntervalMs: 10000,
        retryMultiplier: 3
      })
      await expect(
        client.CreateArtifact(createArtifactRequest)
      ).rejects.toThrow(
        'Retry wait of 90000 ms would exceed the maximum total retry wait of 120000 ms: Failed request: (500) Internal Server Error'
      )
      expect(mockPost).toHaveBeenCalledTimes(3)
      expect(sleepTimes()).toEqual([10000, 30000])
    })

    it('should wait at least 60s in total across default backoff retries', async () => {
      randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0)
      mockPostResponses(...serverErrors(4))

      const client = internalArtifactTwirpClient()
      await expect(
        client.CreateArtifact(createArtifactRequest)
      ).rejects.toThrow('Failed to make request after 4 attempts')

      const totalWait = sleepTimes().reduce((sum, wait) => sum + wait, 0)
      expect(sleepTimes()).toHaveLength(3)
      expect(totalWait).toBeGreaterThanOrEqual(60000)
      expect(totalWait).toBe(66500)
    })

    it('should let constructor options override the default backoff', async () => {
      randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0)
      mockPostResponses(...serverErrors(4))

      const client = internalArtifactTwirpClient({
        retryIntervalMs: 1000,
        retryMultiplier: 3
      })
      await expect(
        client.CreateArtifact(createArtifactRequest)
      ).rejects.toThrow('Failed to make request after 4 attempts')
      expect(sleepTimes()).toEqual([1000, 3000, 9000])
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
        expect(sleepTimes()).toEqual([14000])
      }
    )

    it('should ignore Retry-After on other retryable statuses', async () => {
      mockPostResponses(
        failedResponse(500, 'Internal Server Error', {'retry-after': '30'})
      )

      const client = internalArtifactTwirpClient()
      await client.CreateArtifact(createArtifactRequest)

      expect(sleepTimes()).toEqual([14000])
    })

    describe('rate limit warnings', () => {
      const warningMessages = (): string[] =>
        (core.warning as jest.Mock).mock.calls.map(call => call[0] as string)

      it('should warn on every 429 response', async () => {
        mockPostResponses(
          rateLimitedResponse('60'),
          rateLimitedResponse('60'),
          rateLimitedResponse('60')
        )

        const client = internalArtifactTwirpClient()
        await expect(
          client.CreateArtifact(createArtifactRequest)
        ).rejects.toThrow('would exceed the maximum total retry wait')

        expect(warningMessages()).toEqual([
          'Request was rate limited (HTTP 429). Retrying in 60 seconds (attempt 2 of 4)',
          'Request was rate limited (HTTP 429). Retrying in 60 seconds (attempt 3 of 4)',
          'Request was rate limited (HTTP 429). Not retrying: waiting 60 seconds would exceed the maximum total retry wait of 120 seconds'
        ])
      })

      it('should warn with the backoff wait when a 429 has no Retry-After', async () => {
        mockPostResponses(rateLimitedResponse())

        const client = internalArtifactTwirpClient()
        await client.CreateArtifact(createArtifactRequest)

        expect(warningMessages()).toEqual([
          'Request was rate limited (HTTP 429). Retrying in 14 seconds (attempt 2 of 4)'
        ])
      })

      it('should warn that it will not retry a 429 on the last attempt', async () => {
        const mockPost = mockPostResponses(
          ...Array.from({length: 4}, () => rateLimitedResponse('1'))
        )

        const client = internalArtifactTwirpClient()
        await expect(
          client.CreateArtifact(createArtifactRequest)
        ).rejects.toThrow('Failed to make request after 4 attempts')

        expect(mockPost).toHaveBeenCalledTimes(4)
        expect(warningMessages()).toHaveLength(4)
        expect(warningMessages()[3]).toBe(
          'Request was rate limited (HTTP 429). Not retrying: reached the maximum of 4 attempts'
        )
      })

      it.each([
        [503, 'Service Unavailable'],
        [500, 'Internal Server Error']
      ])(
        'should not warn on %s responses',
        async (statusCode, statusMessage) => {
          mockPostResponses(
            failedResponse(statusCode, statusMessage, {'retry-after': '1'})
          )

          const client = internalArtifactTwirpClient()
          await client.CreateArtifact(createArtifactRequest)

          expect(sleepTimes()).toHaveLength(1)
          expect(core.warning).not.toHaveBeenCalled()
        }
      )
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
