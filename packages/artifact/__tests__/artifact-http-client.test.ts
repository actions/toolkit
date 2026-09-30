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

  describe('retry waits', () => {
    let sleepSpy: jest.SpyInstance
    let randomSpy: jest.SpyInstance | undefined

    const createArtifact = async (
      options?: Parameters<typeof internalArtifactTwirpClient>[0]
    ): Promise<unknown> =>
      internalArtifactTwirpClient(options).CreateArtifact({
        workflowRunBackendId: '1234',
        workflowJobRunBackendId: '5678',
        name: 'artifact',
        version: 4
      })

    const response = (
      statusCode: number,
      statusMessage: string,
      headers: http.IncomingHttpHeaders = {},
      body = `{"ok": false}`
    ): object => {
      const msg = new http.IncomingMessage(new net.Socket())
      msg.statusCode = statusCode
      msg.statusMessage = statusMessage
      msg.headers = headers
      return {message: msg, readBody: async () => Promise.resolve(body)}
    }

    const rateLimited = (retryAfter?: string, body = `{"ok": false}`): object =>
      response(
        429,
        'Too Many Requests',
        retryAfter === undefined ? {} : {'retry-after': retryAfter},
        body
      )

    const serverError = (): object => response(500, 'Internal Server Error')

    const mockResponses = (...responses: object[]): jest.Mock => {
      const mockPost = jest.fn(() => response(200, 'OK', {}, `{"ok": true}`))
      for (const r of responses) {
        mockPost.mockImplementationOnce(() => r)
      }
      ;(HttpClient as unknown as jest.Mock).mockImplementation(() => ({
        post: mockPost
      }))
      return mockPost
    }

    const sleepTimes = (): number[] =>
      sleepSpy.mock.calls.map(call => call[1] as number)

    const sum = (values: number[]): number =>
      values.reduce((total, value) => total + value, 0)

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

    it.each([
      ['30', 30000],
      ['1.5', 1000],
      ['10 ', 10000]
    ])('should wait for a Retry-After of %p on 429', async (header, wait) => {
      const mockPost = mockResponses(rateLimited(header))

      await createArtifact()

      expect(mockPost).toHaveBeenCalledTimes(2)
      expect(sleepTimes()).toEqual([wait])
    })

    it('should read Retry-After before parsing the body', async () => {
      mockResponses(rateLimited('20', '<html>rate limited</html>'))

      await createArtifact()

      expect(sleepTimes()).toEqual([20000])
    })

    it.each([
      ['missing', undefined],
      ['empty', ''],
      ['zero', '0'],
      ['negative', '-5'],
      ['non-numeric', 'abc'],
      ['an HTTP-date', 'Wed, 21 Oct 2015 07:28:00 GMT']
    ])('should use backoff when Retry-After is %s', async (_, header) => {
      mockResponses(rateLimited(header))

      await createArtifact()

      expect(sleepTimes()).toEqual([8000])
    })

    it.each([
      [503, 'Service Unavailable'],
      [500, 'Internal Server Error']
    ])('should ignore Retry-After on %s', async (statusCode, statusMessage) => {
      mockResponses(response(statusCode, statusMessage, {'retry-after': '30'}))

      await createArtifact()

      expect(sleepTimes()).toEqual([8000])
    })

    it('should fail without sleeping once the retry timeout is exhausted', async () => {
      const mockPost = mockResponses(
        rateLimited('60'),
        rateLimited('60'),
        rateLimited('60')
      )

      await expect(createArtifact()).rejects.toThrow(
        'Failed to CreateArtifact: Retry wait of 60000 ms would exceed the maximum total retry wait of 120000 ms: Failed request: (429) Too Many Requests'
      )
      expect(mockPost).toHaveBeenCalledTimes(3)
      expect(sleepTimes()).toEqual([60000, 60000])
    })

    it.each([
      ['a 121s Retry-After', [rateLimited('121')], []],
      [
        'a 113s Retry-After after an 8s backoff',
        [serverError(), rateLimited('113')],
        [8000]
      ]
    ])(
      'should fail before sleeping when %s would exceed the retry timeout',
      async (_, responses, waits) => {
        mockResponses(...responses)

        await expect(createArtifact()).rejects.toThrow(
          'would exceed the maximum total retry wait of 120000 ms'
        )
        expect(sleepTimes()).toEqual(waits)
      }
    )

    it('should allow a wait that exactly fills the retry timeout', async () => {
      mockResponses(rateLimited('120'))

      await createArtifact()

      expect(sleepTimes()).toEqual([120000])
    })

    it.each([
      ['minimum', 0, [8000, 12000, 18000, 27000]],
      ['maximum', 0.9999999, [8000, 17999, 26999, 40499]]
    ])(
      'should use the %s default backoff waits within the retry timeout',
      async (_, random, waits) => {
        randomSpy = jest.spyOn(Math, 'random').mockReturnValue(random)
        const mockPost = mockResponses(
          serverError(),
          serverError(),
          serverError(),
          serverError()
        )

        await createArtifact()

        expect(mockPost).toHaveBeenCalledTimes(5)
        expect(sleepTimes()).toEqual(waits)
        expect(sum(sleepTimes())).toBeGreaterThanOrEqual(60000)
        expect(sum(sleepTimes())).toBeLessThanOrEqual(110000)
      }
    )

    it('should fail when a custom backoff wait exceeds the retry timeout', async () => {
      randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0)
      mockResponses(serverError(), serverError(), serverError())

      await expect(
        createArtifact({retryIntervalMs: 10000, retryMultiplier: 3})
      ).rejects.toThrow(
        'Retry wait of 90000 ms would exceed the maximum total retry wait of 120000 ms: Failed request: (500) Internal Server Error'
      )
      expect(sleepTimes()).toEqual([10000, 30000])
    })
  })
})
