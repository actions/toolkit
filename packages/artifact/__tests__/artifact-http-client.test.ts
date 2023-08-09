import * as http from 'http'
import * as net from 'net'
import {HttpClient} from '@actions/http-client'
import * as config from '../src/internal/shared/config'
import {createArtifactTwirpClient} from '../src/internal/shared/artifact-twirp-client'
import * as core from '@actions/core'

jest.mock('@actions/http-client')

describe('artifact-http-client', () => {
  beforeAll(() => {
    // mock all output so that there is less noise when running tests
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(core, 'debug').mockImplementation(() => {})
    jest.spyOn(core, 'info').mockImplementation(() => {})
    jest.spyOn(core, 'warning').mockImplementation(() => {})
    jest
      .spyOn(config, 'getResultsServiceUrl')
      .mockReturnValue('http://localhost:8080')
    jest.spyOn(config, 'getRuntimeToken').mockReturnValue('token')
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully create a client', () => {
    const client = createArtifactTwirpClient('upload')
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

    const client = createArtifactTwirpClient('upload')
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

    const client = createArtifactTwirpClient(
      'upload',
      5, // retry 5 times
      1, // wait 1 ms
      1.5 // backoff factor
    )
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
    const client = createArtifactTwirpClient(
      'upload',
      5, // retry 5 times
      1, // wait 1 ms
      1.5 // backoff factor
    )
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
    const client = createArtifactTwirpClient(
      'upload',
      5, // retry 5 times
      1, // wait 1 ms
      1.5 // backoff factor
    )
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
})
