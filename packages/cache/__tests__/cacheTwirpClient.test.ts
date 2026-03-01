import * as http from 'http'
import * as net from 'net'
import {HttpClient} from '@actions/http-client'
import * as core from '@actions/core'
import * as config from '../src/internal/config'
import * as cacheUtils from '../src/internal/cacheUtils'
import {internalCacheTwirpClient} from '../src/internal/shared/cacheTwirpClient'

jest.mock('@actions/http-client')

const clientOptions = {
  maxAttempts: 5,
  retryIntervalMs: 1,
  retryMultiplier: 1.5
}

// noopLogs mocks the console.log and core.* functions to prevent output in the console while testing
const noopLogs = (): void => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(core, 'debug').mockImplementation(() => {})
  jest.spyOn(core, 'info').mockImplementation(() => {})
  jest.spyOn(core, 'warning').mockImplementation(() => {})
}

describe('cacheTwirpClient', () => {
  beforeAll(() => {
    noopLogs()
    jest
      .spyOn(config, 'getCacheServiceURL')
      .mockReturnValue('http://localhost:8080')
    jest.spyOn(cacheUtils, 'getRuntimeToken').mockReturnValue('token')
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fail immediately on 429 rate limit without retrying', async () => {
    const mockPost = jest.fn(() => {
      const msg = new http.IncomingMessage(new net.Socket())
      msg.statusCode = 429
      msg.statusMessage = 'Too Many Requests'
      return {
        message: msg,
        readBody: async () => {
          return Promise.resolve(`{"ok": false}`)
        }
      }
    })

    ;(HttpClient as unknown as jest.Mock).mockImplementation(() => {
      return {
        post: mockPost
      }
    })

    const client = internalCacheTwirpClient(clientOptions)
    await expect(
      client.CreateCacheEntry({
        key: 'test-key',
        version: 'test-version'
      })
    ).rejects.toThrow(
      'Failed to CreateCacheEntry: Rate limited: Failed request: (429) Too Many Requests'
    )

    // Should only be called once - no retries for 429
    expect(mockPost).toHaveBeenCalledTimes(1)
  })

  it('should log warning with retry-after header on 429', async () => {
    const warningSpy = jest.spyOn(core, 'warning')

    const mockPost = jest.fn(() => {
      const msg = new http.IncomingMessage(new net.Socket())
      msg.statusCode = 429
      msg.statusMessage = 'Too Many Requests'
      msg.headers = {'retry-after': '60'}
      return {
        message: msg,
        readBody: async () => {
          return Promise.resolve(`{"ok": false}`)
        }
      }
    })

    ;(HttpClient as unknown as jest.Mock).mockImplementation(() => {
      return {
        post: mockPost
      }
    })

    const client = internalCacheTwirpClient(clientOptions)
    await expect(
      client.CreateCacheEntry({
        key: 'test-key',
        version: 'test-version'
      })
    ).rejects.toThrow('Rate limited')

    expect(mockPost).toHaveBeenCalledTimes(1)
    expect(warningSpy).toHaveBeenCalledWith(
      "You've hit a rate limit, your rate limit will reset in 60 seconds"
    )
  })

  it('should not log warning if retry-after header is missing on 429', async () => {
    const warningSpy = jest.spyOn(core, 'warning')

    const mockPost = jest.fn(() => {
      const msg = new http.IncomingMessage(new net.Socket())
      msg.statusCode = 429
      msg.statusMessage = 'Too Many Requests'
      // No retry-after header
      return {
        message: msg,
        readBody: async () => {
          return Promise.resolve(`{"ok": false}`)
        }
      }
    })

    ;(HttpClient as unknown as jest.Mock).mockImplementation(() => {
      return {
        post: mockPost
      }
    })

    const client = internalCacheTwirpClient(clientOptions)
    await expect(
      client.CreateCacheEntry({
        key: 'test-key',
        version: 'test-version'
      })
    ).rejects.toThrow('Rate limited')

    expect(mockPost).toHaveBeenCalledTimes(1)
    expect(warningSpy).not.toHaveBeenCalled()
  })

  it('should not log warning if retry-after header is invalid on 429', async () => {
    const warningSpy = jest.spyOn(core, 'warning')

    const mockPost = jest.fn(() => {
      const msg = new http.IncomingMessage(new net.Socket())
      msg.statusCode = 429
      msg.statusMessage = 'Too Many Requests'
      msg.headers = {'retry-after': 'invalid'}
      return {
        message: msg,
        readBody: async () => {
          return Promise.resolve(`{"ok": false}`)
        }
      }
    })

    ;(HttpClient as unknown as jest.Mock).mockImplementation(() => {
      return {
        post: mockPost
      }
    })

    const client = internalCacheTwirpClient(clientOptions)
    await expect(
      client.CreateCacheEntry({
        key: 'test-key',
        version: 'test-version'
      })
    ).rejects.toThrow('Rate limited')

    expect(mockPost).toHaveBeenCalledTimes(1)
    expect(warningSpy).not.toHaveBeenCalled()
  })
})
