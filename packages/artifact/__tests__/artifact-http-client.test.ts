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

    it('should honor Retry-After on 429', async () => {
      const mockPost = mockPostResponses(rateLimitedResponse('30'))

      const client = internalArtifactTwirpClient()
      const artifact = await client.CreateArtifact(createArtifactRequest)

      expect(artifact.ok).toBe(true)
      expect(mockPost).toHaveBeenCalledTimes(2)
      expect(sleepTimes()).toEqual([30000])
    })

    it.each([
      ['1.5', 1000],
      ['10 ', 10000]
    ])(
      'should parse a Retry-After of %p with parseInt',
      async (retryAfter, expectedWait) => {
        mockPostResponses(rateLimitedResponse(retryAfter))

        const client = internalArtifactTwirpClient()
        await client.CreateArtifact(createArtifactRequest)

        expect(sleepTimes()).toEqual([expectedWait])
      }
    )

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
        rateLimitedResponse('116')
      )

      const client = internalArtifactTwirpClient()
      await expect(
        client.CreateArtifact(createArtifactRequest)
      ).rejects.toThrow(
        'Retry wait of 116000 ms would exceed the maximum total retry wait of 120000 ms: Failed request: (429) Too Many Requests: rate limit exceeded'
      )
      expect(mockPost).toHaveBeenCalledTimes(2)
      expect(sleepTimes()).toEqual([8000])
    })

    it('should honor Retry-After on 429 with a non-JSON body', async () => {
      const mockPost = mockPostResponses(
        failedResponse(
          429,
          'Too Many Requests',
          {'retry-after': '20'},
          '<html>rate limited</html>'
        )
      )

      const client = internalArtifactTwirpClient()
      const artifact = await client.CreateArtifact(createArtifactRequest)

      expect(artifact.ok).toBe(true)
      expect(mockPost).toHaveBeenCalledTimes(2)
      expect(sleepTimes()).toEqual([20000])
    })

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
      const mockPost = mockPostResponses(...serverErrors(4))

      const client = internalArtifactTwirpClient()
      const artifact = await client.CreateArtifact(createArtifactRequest)

      expect(artifact.ok).toBe(true)
      expect(mockPost).toHaveBeenCalledTimes(5)
      expect(sleepTimes()).toEqual([8000, 12000, 18000, 27000])
    })

    it('should use the maximum default backoff waits and complete within the total wait budget', async () => {
      randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.9999999)
      const mockPost = mockPostResponses(...serverErrors(4))

      const client = internalArtifactTwirpClient()
      const artifact = await client.CreateArtifact(createArtifactRequest)

      expect(artifact.ok).toBe(true)
      expect(mockPost).toHaveBeenCalledTimes(5)
      expect(sleepTimes()).toEqual([8000, 17999, 26999, 40499])
      const totalWait = sleepTimes().reduce((sum, wait) => sum + wait, 0)
      expect(totalWait).toBeLessThanOrEqual(110000)
    })

    it('should fail fast when a custom backoff wait exceeds the remaining wait budget', async () => {
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
      mockPostResponses(...serverErrors(5))

      const client = internalArtifactTwirpClient()
      await expect(
        client.CreateArtifact(createArtifactRequest)
      ).rejects.toThrow('Failed to make request after 5 attempts')

      const totalWait = sleepTimes().reduce((sum, wait) => sum + wait, 0)
      expect(sleepTimes()).toHaveLength(4)
      expect(totalWait).toBeGreaterThanOrEqual(60000)
      expect(totalWait).toBe(65000)
    })

    it('should let constructor options override the default backoff', async () => {
      randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0)
      mockPostResponses(...serverErrors(5))

      const client = internalArtifactTwirpClient({
        retryIntervalMs: 1000,
        retryMultiplier: 3
      })
      await expect(
        client.CreateArtifact(createArtifactRequest)
      ).rejects.toThrow('Failed to make request after 5 attempts')
      expect(sleepTimes()).toEqual([1000, 3000, 9000, 27000])
    })

    it.each([
      ['missing', undefined],
      ['empty', ''],
      ['zero', '0'],
      ['negative', '-5'],
      ['non-numeric', 'abc'],
      ['HTTP-date', 'Wed, 21 Oct 2015 07:28:00 GMT']
    ])(
      'should fall back to backoff when Retry-After is %s',
      async (_, retryAfter) => {
        const mockPost = mockPostResponses(rateLimitedResponse(retryAfter))

        const client = internalArtifactTwirpClient()
        const artifact = await client.CreateArtifact(createArtifactRequest)

        expect(artifact.ok).toBe(true)
        expect(mockPost).toHaveBeenCalledTimes(2)
        expect(sleepTimes()).toEqual([8000])
      }
    )

    describe('Retry-After logging', () => {
      const infoMessages = (): string[] =>
        (core.info as jest.Mock).mock.calls.map(call => call[0] as string)

      const retryAfterMessages = (): string[] =>
        infoMessages().filter(message => message.includes('Retry-After'))

      it('should not log a valid Retry-After', async () => {
        mockPostResponses(rateLimitedResponse('30'))

        const client = internalArtifactTwirpClient()
        await client.CreateArtifact(createArtifactRequest)

        expect(sleepTimes()).toEqual([30000])
        expect(retryAfterMessages()).toEqual([])
      })

      it('should log a missing Retry-After', async () => {
        mockPostResponses(rateLimitedResponse())

        const client = internalArtifactTwirpClient()
        await client.CreateArtifact(createArtifactRequest)

        expect(infoMessages()).toContain(
          'No Retry-After header provided, falling back to exponential backoff'
        )
      })

      it.each([
        ['empty', ''],
        ['zero', '0'],
        ['negative', '-5'],
        ['non-numeric', 'abc'],
        ['HTTP-date', 'Wed, 21 Oct 2015 07:28:00 GMT']
      ])('should log an invalid %s Retry-After', async (_, retryAfter) => {
        mockPostResponses(rateLimitedResponse(retryAfter))

        const client = internalArtifactTwirpClient()
        await client.CreateArtifact(createArtifactRequest)

        expect(infoMessages()).toContain(
          `Invalid Retry-After header value '${retryAfter}', falling back to exponential backoff`
        )
      })

      it.each([
        [
          '503 with a Retry-After',
          503,
          'Service Unavailable',
          {'retry-after': '30'}
        ],
        ['503 without a Retry-After', 503, 'Service Unavailable', {}],
        [
          '500 with a Retry-After',
          500,
          'Internal Server Error',
          {'retry-after': '30'}
        ]
      ])(
        'should not log Retry-After on a %s',
        async (_, statusCode, statusMessage, headers) => {
          mockPostResponses(failedResponse(statusCode, statusMessage, headers))

          const client = internalArtifactTwirpClient()
          await client.CreateArtifact(createArtifactRequest)

          expect(retryAfterMessages()).toEqual([])
        }
      )
    })

    it.each([
      [503, 'Service Unavailable'],
      [500, 'Internal Server Error']
    ])(
      'should ignore Retry-After on %s and use backoff',
      async (statusCode, statusMessage) => {
        mockPostResponses(
          failedResponse(statusCode, statusMessage, {'retry-after': '30'})
        )

        const client = internalArtifactTwirpClient()
        await client.CreateArtifact(createArtifactRequest)

        expect(sleepTimes()).toEqual([8000])
      }
    )

    describe('rate limit warnings', () => {
      const warningMessages = (): string[] =>
        (core.warning as jest.Mock).mock.calls.map(call => call[0] as string)

      const succeededWarning =
        'This artifact operation (CreateArtifact) was rate limited but succeeded on retry. See https://docs.github.com/en/actions/reference/limits'
      const failedWarning =
        'This artifact operation (CreateArtifact) was rate limited and failed after retrying. See https://docs.github.com/en/actions/reference/limits'

      it('should warn once when a rate limited operation succeeds on retry', async () => {
        mockPostResponses(rateLimitedResponse('1'), rateLimitedResponse())

        const client = internalArtifactTwirpClient()
        const artifact = await client.CreateArtifact(createArtifactRequest)

        expect(artifact.ok).toBe(true)
        expect(warningMessages()).toEqual([succeededWarning])
        expect(
          (core.info as jest.Mock).mock.calls.filter(([message]) =>
            (message as string).startsWith('Attempt ')
          )
        ).toHaveLength(2)
      })

      it('should warn once when a rate limited operation fails after max attempts', async () => {
        mockPostResponses(
          ...Array.from({length: 5}, () => rateLimitedResponse('1'))
        )

        const client = internalArtifactTwirpClient()
        await expect(
          client.CreateArtifact(createArtifactRequest)
        ).rejects.toThrow('Failed to make request after 5 attempts')

        expect(warningMessages()).toEqual([failedWarning])
      })

      it('should warn once when a rate limited operation exceeds the retry timeout', async () => {
        mockPostResponses(
          rateLimitedResponse('60'),
          rateLimitedResponse('60'),
          rateLimitedResponse('60')
        )

        const client = internalArtifactTwirpClient()
        await expect(
          client.CreateArtifact(createArtifactRequest)
        ).rejects.toThrow('would exceed the maximum total retry wait')

        expect(warningMessages()).toEqual([failedWarning])
      })

      it('should warn once when a later attempt fails with a non-retryable error', async () => {
        mockPostResponses(
          rateLimitedResponse('1'),
          failedResponse(400, 'Bad Request')
        )

        const client = internalArtifactTwirpClient()
        await expect(
          client.CreateArtifact(createArtifactRequest)
        ).rejects.toThrow('Received non-retryable error')

        expect(warningMessages()).toEqual([failedWarning])
      })

      it.each([
        [503, 'Service Unavailable'],
        [500, 'Internal Server Error']
      ])(
        'should not warn when a %s is retried successfully',
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

      it('should not warn when an operation without a 429 fails', async () => {
        mockPostResponses(...serverErrors(5))

        const client = internalArtifactTwirpClient()
        await expect(
          client.CreateArtifact(createArtifactRequest)
        ).rejects.toThrow('Failed to make request after 5 attempts')

        expect(core.warning).not.toHaveBeenCalled()
      })
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
