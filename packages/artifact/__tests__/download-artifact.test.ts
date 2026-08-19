import fs from 'fs'
import * as crypto from 'crypto'
import * as http from 'http'
import * as net from 'net'
import * as path from 'path'
import * as stream from 'stream'
import {spawn} from 'child_process'
import * as github from '@actions/github'
import {HttpClient} from '@actions/http-client'
import type {RestEndpointMethods} from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/method-types'
import archiver from 'archiver'

import {
  downloadArtifactInternal,
  downloadArtifactPublic,
  streamExtractExternal
} from '../src/internal/download/download-artifact.js'
import {getUserAgentString} from '../src/internal/shared/user-agent.js'
import {noopLogs} from './common.js'
import * as config from '../src/internal/shared/config.js'
import {ArtifactServiceClientJSON} from '../src/generated/index.js'
import * as util from '../src/internal/shared/util.js'

type MockedDownloadArtifact = jest.MockedFunction<
  RestEndpointMethods['actions']['downloadArtifact']
>

const testDir = path.join(__dirname, '_temp', 'download-artifact')
const fixtures = {
  workspaceDir: path.join(testDir, 'workspace'),
  exampleArtifact: {
    path: path.join(testDir, 'artifact.zip'),
    files: [
      {
        path: 'hello.txt',
        content: 'Hello World!'
      },
      {
        path: 'goodbye.txt',
        content: 'Goodbye World!'
      }
    ]
  },
  artifactID: 1234,
  artifactName: 'my-artifact',
  artifactSize: 123456,
  repositoryOwner: 'actions',
  repositoryName: 'toolkit',
  token: 'ghp_1234567890',
  blobStorageUrl: 'https://blob-storage.local?signed=true',
  backendIds: {
    workflowRunBackendId: 'c4d7c21f-ba3f-4ddc-a8c8-6f2f626f8422',
    workflowJobRunBackendId: '760803a1-f890-4d25-9a6e-a3fc01a0c7cf'
  }
}

jest.mock('@actions/github', () => ({
  getOctokit: jest.fn().mockReturnValue({
    rest: {
      actions: {
        downloadArtifact: jest.fn()
      }
    }
  })
}))

jest.mock('@actions/http-client')

// Create a zip archive with the contents of the example artifact
const createTestArchive = async (): Promise<void> => {
  const archive = archiver('zip', {
    zlib: {level: 9}
  })
  for (const file of fixtures.exampleArtifact.files) {
    archive.append(file.content, {name: file.path})
  }
  archive.finalize()

  return new Promise((resolve, reject) => {
    archive.pipe(fs.createWriteStream(fixtures.exampleArtifact.path))
    archive.on('error', reject)
    archive.on('finish', resolve)
  })
}

const expectExtractedArchive = async (dir: string): Promise<void> => {
  for (const file of fixtures.exampleArtifact.files) {
    const filePath = path.join(dir, file.path)
    expect(fs.readFileSync(filePath, 'utf8')).toEqual(file.content)
  }
}

const runProcessFixture = async (
  mode: 'success' | 'failure'
): Promise<{code: number | null; stderr: string}> => {
  const fixture = path.join(
    __dirname,
    'fixtures',
    'download-attempt-process.mjs'
  )

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [fixture, mode], {
      stdio: ['ignore', 'ignore', 'pipe']
    })
    let stderr = ''
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', chunk => {
      stderr += chunk
    })

    const timer = setTimeout(() => {
      child.kill()
      reject(new Error(`${mode} fixture retained a handle after completion`))
    }, 5000)

    child.once('error', error => {
      clearTimeout(timer)
      reject(error)
    })
    child.once('exit', code => {
      clearTimeout(timer)
      resolve({code, stderr})
    })
  })
}

const setup = async (): Promise<void> => {
  noopLogs()
  await fs.promises.mkdir(testDir, {recursive: true})
  await createTestArchive()

  process.env['GITHUB_WORKSPACE'] = fixtures.workspaceDir
}

const cleanup = async (): Promise<void> => {
  jest.useRealTimers()
  jest.restoreAllMocks()
  await fs.promises.rm(testDir, {recursive: true, force: true})
  delete process.env['GITHUB_WORKSPACE']
}

const mockGetArtifactSuccess = jest.fn(() => {
  const message = new http.IncomingMessage(new net.Socket())
  message.statusCode = 200
  message.headers['content-type'] = 'application/zip'
  message.push(fs.readFileSync(fixtures.exampleArtifact.path))
  message.push(null)
  return {
    message
  }
})

const mockGetArtifactHung = jest.fn(() => {
  const message = new http.IncomingMessage(new net.Socket())
  message.statusCode = 200
  message.headers['content-type'] = 'application/zip'
  // Don't push any data or call push(null) to end the stream
  // This creates a stream that hangs and never completes
  return {
    message
  }
})

const mockGetArtifactFailure = jest.fn(() => {
  const message = new http.IncomingMessage(new net.Socket())
  message.statusCode = 500
  message.push('Internal Server Error')
  message.push(null)
  return {
    message
  }
})

const mockGetArtifactMalicious = jest.fn(() => {
  const message = new http.IncomingMessage(new net.Socket())
  message.statusCode = 200
  message.headers['content-type'] = 'application/zip'
  message.push(fs.readFileSync(path.join(__dirname, 'fixtures', 'evil.zip'))) // evil.zip contains files that are formatted x/../../etc/hosts
  message.push(null)
  return {
    message
  }
})

describe('download-artifact', () => {
  describe('process cleanup', () => {
    it('should exit naturally after a timeout followed by success', async () => {
      await expect(runProcessFixture('success')).resolves.toEqual({
        code: 0,
        stderr: ''
      })
    })

    it('should exit nonzero naturally after timeout exhaustion', async () => {
      const result = await runProcessFixture('failure')
      expect(result.code).toBe(1)
      expect(result.stderr).toContain('did not respond in 25ms')
    })
  })

  describe('public', () => {
    beforeEach(setup)
    afterEach(cleanup)

    it('should successfully download an artifact to $GITHUB_WORKSPACE', async () => {
      const downloadArtifactMock = github.getOctokit(fixtures.token).rest
        .actions.downloadArtifact as MockedDownloadArtifact
      downloadArtifactMock.mockResolvedValueOnce({
        headers: {
          location: fixtures.blobStorageUrl
        },
        status: 302,
        url: '',
        data: Buffer.from('')
      })

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGetArtifactSuccess,
            dispose: jest.fn()
          }
        }
      )

      const response = await downloadArtifactPublic(
        fixtures.artifactID,
        fixtures.repositoryOwner,
        fixtures.repositoryName,
        fixtures.token
      )

      expect(downloadArtifactMock).toHaveBeenCalledWith({
        owner: fixtures.repositoryOwner,
        repo: fixtures.repositoryName,
        artifact_id: fixtures.artifactID,
        archive_format: 'zip',
        request: {
          redirect: 'manual'
        }
      })
      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
      expect(mockGetArtifactSuccess).toHaveBeenCalledWith(
        fixtures.blobStorageUrl
      )
      expectExtractedArchive(fixtures.workspaceDir)
      expect(response.downloadPath).toBe(fixtures.workspaceDir)
    })

    it('should not allow path traversal from malicious artifacts', async () => {
      const downloadArtifactMock = github.getOctokit(fixtures.token).rest
        .actions.downloadArtifact as MockedDownloadArtifact
      downloadArtifactMock.mockResolvedValueOnce({
        headers: {
          location: fixtures.blobStorageUrl
        },
        status: 302,
        url: '',
        data: Buffer.from('')
      })

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGetArtifactMalicious,
            dispose: jest.fn()
          }
        }
      )

      const response = await downloadArtifactPublic(
        fixtures.artifactID,
        fixtures.repositoryOwner,
        fixtures.repositoryName,
        fixtures.token
      )

      expect(downloadArtifactMock).toHaveBeenCalledWith({
        owner: fixtures.repositoryOwner,
        repo: fixtures.repositoryName,
        artifact_id: fixtures.artifactID,
        archive_format: 'zip',
        request: {
          redirect: 'manual'
        }
      })

      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
      expect(mockGetArtifactMalicious).toHaveBeenCalledWith(
        fixtures.blobStorageUrl
      )

      // ensure path traversal was not possible
      expect(
        fs.existsSync(path.join(fixtures.workspaceDir, 'x/etc/hosts'))
      ).toBe(true)
      expect(
        fs.existsSync(path.join(fixtures.workspaceDir, 'y/etc/hosts'))
      ).toBe(true)

      expect(response.downloadPath).toBe(fixtures.workspaceDir)
    })

    it('should successfully download an artifact to user defined path', async () => {
      const customPath = path.join(testDir, 'custom')

      const downloadArtifactMock = github.getOctokit(fixtures.token).rest
        .actions.downloadArtifact as MockedDownloadArtifact
      downloadArtifactMock.mockResolvedValueOnce({
        headers: {
          location: fixtures.blobStorageUrl
        },
        status: 302,
        url: '',
        data: Buffer.from('')
      })

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGetArtifactSuccess,
            dispose: jest.fn()
          }
        }
      )

      const response = await downloadArtifactPublic(
        fixtures.artifactID,
        fixtures.repositoryOwner,
        fixtures.repositoryName,
        fixtures.token,
        {
          path: customPath
        }
      )

      expect(downloadArtifactMock).toHaveBeenCalledWith({
        owner: fixtures.repositoryOwner,
        repo: fixtures.repositoryName,
        artifact_id: fixtures.artifactID,
        archive_format: 'zip',
        request: {
          redirect: 'manual'
        }
      })
      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
      expect(mockGetArtifactSuccess).toHaveBeenCalledWith(
        fixtures.blobStorageUrl
      )
      expectExtractedArchive(customPath)
      expect(response.downloadPath).toBe(customPath)
    })

    it('should fail if download artifact API does not respond with location', async () => {
      const downloadArtifactMock = github.getOctokit(fixtures.token).rest
        .actions.downloadArtifact as MockedDownloadArtifact
      downloadArtifactMock.mockResolvedValueOnce({
        headers: {},
        status: 302,
        url: '',
        data: Buffer.from('')
      })

      await expect(
        downloadArtifactPublic(
          fixtures.artifactID,
          fixtures.repositoryOwner,
          fixtures.repositoryName,
          fixtures.token
        )
      ).rejects.toBeInstanceOf(Error)

      expect(downloadArtifactMock).toHaveBeenCalledWith({
        owner: fixtures.repositoryOwner,
        repo: fixtures.repositoryName,
        artifact_id: fixtures.artifactID,
        archive_format: 'zip',
        request: {
          redirect: 'manual'
        }
      })
    })

    it('should fail if blob storage storage chunk does not respond within 30s', async () => {
      // mock http client to delay response data by 30s
      const msg = new http.IncomingMessage(new net.Socket())
      msg.statusCode = 200

      const mockGet = jest.fn(async () => {
        return new Promise((resolve, reject) => {
          // Reject with an error after 31 seconds
          setTimeout(() => {
            reject(new Error('Request timeout'))
          }, 31000) // Timeout after 31 seconds
        })
      })

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGet,
            dispose: jest.fn()
          }
        }
      )

      await expect(
        streamExtractExternal(fixtures.blobStorageUrl, fixtures.workspaceDir)
      ).rejects.toBeInstanceOf(Error)

      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
    }, 35000) // add longer timeout to allow for timer to run out

    it('should fail if blob storage response is non-200 after 5 retries', async () => {
      const downloadArtifactMock = github.getOctokit(fixtures.token).rest
        .actions.downloadArtifact as MockedDownloadArtifact
      downloadArtifactMock.mockResolvedValueOnce({
        headers: {
          location: fixtures.blobStorageUrl
        },
        status: 302,
        url: '',
        data: Buffer.from('')
      })

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGetArtifactFailure,
            dispose: jest.fn()
          }
        }
      )

      await expect(
        downloadArtifactPublic(
          fixtures.artifactID,
          fixtures.repositoryOwner,
          fixtures.repositoryName,
          fixtures.token
        )
      ).rejects.toBeInstanceOf(Error)

      expect(downloadArtifactMock).toHaveBeenCalledWith({
        owner: fixtures.repositoryOwner,
        repo: fixtures.repositoryName,
        artifact_id: fixtures.artifactID,
        archive_format: 'zip',
        request: {
          redirect: 'manual'
        }
      })
      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
      expect(mockGetArtifactFailure).toHaveBeenCalledWith(
        fixtures.blobStorageUrl
      )
      expect(mockGetArtifactFailure).toHaveBeenCalledTimes(5)
    }, 38000)

    it('should retry if blob storage response is non-200 and then succeed with a 200', async () => {
      const downloadArtifactMock = github.getOctokit(fixtures.token).rest
        .actions.downloadArtifact as MockedDownloadArtifact
      downloadArtifactMock.mockResolvedValueOnce({
        headers: {
          location: fixtures.blobStorageUrl
        },
        status: 302,
        url: '',
        data: Buffer.from('')
      })

      const mockGetArtifact = jest
        .fn(mockGetArtifactSuccess)
        .mockImplementationOnce(mockGetArtifactFailure)

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGetArtifact,
            dispose: jest.fn()
          }
        }
      )

      const response = await downloadArtifactPublic(
        fixtures.artifactID,
        fixtures.repositoryOwner,
        fixtures.repositoryName,
        fixtures.token
      )

      expect(downloadArtifactMock).toHaveBeenCalledWith({
        owner: fixtures.repositoryOwner,
        repo: fixtures.repositoryName,
        artifact_id: fixtures.artifactID,
        archive_format: 'zip',
        request: {
          redirect: 'manual'
        }
      })
      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
      expect(mockGetArtifactFailure).toHaveBeenCalledWith(
        fixtures.blobStorageUrl
      )
      expect(mockGetArtifactFailure).toHaveBeenCalledTimes(1)
      expect(mockGetArtifactSuccess).toHaveBeenCalledWith(
        fixtures.blobStorageUrl
      )
      expect(mockGetArtifactSuccess).toHaveBeenCalledTimes(1)
      expect(response.downloadPath).toBe(fixtures.workspaceDir)
    }, 28000)
  })

  describe('internal', () => {
    beforeEach(async () => {
      await setup()

      jest.spyOn(config, 'getRuntimeToken').mockReturnValue('test-token')

      jest
        .spyOn(util, 'getBackendIdsFromToken')
        .mockReturnValue(fixtures.backendIds)

      jest
        .spyOn(config, 'getResultsServiceUrl')
        .mockReturnValue('https://results.local')
    })
    afterEach(async () => {
      await cleanup()
    })

    it('should successfully download an artifact to $GITHUB_WORKSPACE', async () => {
      const mockListArtifacts = jest
        .spyOn(ArtifactServiceClientJSON.prototype, 'ListArtifacts')
        .mockResolvedValue({
          artifacts: [
            {
              ...fixtures.backendIds,
              databaseId: fixtures.artifactID.toString(),
              name: fixtures.artifactName,
              size: fixtures.artifactSize.toString()
            }
          ]
        })

      const mockGetSignedArtifactURL = jest
        .spyOn(ArtifactServiceClientJSON.prototype, 'GetSignedArtifactURL')
        .mockReturnValue(
          Promise.resolve({
            signedUrl: fixtures.blobStorageUrl
          })
        )

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGetArtifactSuccess,
            dispose: jest.fn()
          }
        }
      )

      const response = await downloadArtifactInternal(fixtures.artifactID)

      expectExtractedArchive(fixtures.workspaceDir)
      expect(response.downloadPath).toBe(fixtures.workspaceDir)
      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
      expect(mockListArtifacts).toHaveBeenCalledWith({
        idFilter: {
          value: fixtures.artifactID.toString()
        },
        ...fixtures.backendIds
      })
      expect(mockGetSignedArtifactURL).toHaveBeenCalledWith({
        ...fixtures.backendIds,
        name: fixtures.artifactName
      })
    })

    it('should successfully download an artifact to user defined path', async () => {
      const customPath = path.join(testDir, 'custom')

      const mockListArtifacts = jest
        .spyOn(ArtifactServiceClientJSON.prototype, 'ListArtifacts')
        .mockResolvedValue({
          artifacts: [
            {
              ...fixtures.backendIds,
              databaseId: fixtures.artifactID.toString(),
              name: fixtures.artifactName,
              size: fixtures.artifactSize.toString()
            }
          ]
        })

      const mockGetSignedArtifactURL = jest
        .spyOn(ArtifactServiceClientJSON.prototype, 'GetSignedArtifactURL')
        .mockReturnValue(
          Promise.resolve({
            signedUrl: fixtures.blobStorageUrl
          })
        )

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGetArtifactSuccess,
            dispose: jest.fn()
          }
        }
      )

      const response = await downloadArtifactInternal(fixtures.artifactID, {
        path: customPath
      })

      expectExtractedArchive(customPath)
      expect(response.downloadPath).toBe(customPath)
      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
      expect(mockListArtifacts).toHaveBeenCalledWith({
        idFilter: {
          value: fixtures.artifactID.toString()
        },
        ...fixtures.backendIds
      })
      expect(mockGetSignedArtifactURL).toHaveBeenCalledWith({
        ...fixtures.backendIds,
        name: fixtures.artifactName
      })
    })

    it('should fail if download artifact API does not respond with location', async () => {
      jest
        .spyOn(ArtifactServiceClientJSON.prototype, 'ListArtifacts')
        .mockRejectedValue(new Error('boom'))

      await expect(
        downloadArtifactInternal(fixtures.artifactID)
      ).rejects.toBeInstanceOf(Error)
    })

    it('should fail if blob storage response is non-200', async () => {
      const mockListArtifacts = jest
        .spyOn(ArtifactServiceClientJSON.prototype, 'ListArtifacts')
        .mockResolvedValue({
          artifacts: [
            {
              ...fixtures.backendIds,
              databaseId: fixtures.artifactID.toString(),
              name: fixtures.artifactName,
              size: fixtures.artifactSize.toString()
            }
          ]
        })

      const mockGetSignedArtifactURL = jest
        .spyOn(ArtifactServiceClientJSON.prototype, 'GetSignedArtifactURL')
        .mockReturnValue(
          Promise.resolve({
            signedUrl: fixtures.blobStorageUrl
          })
        )

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGetArtifactFailure,
            dispose: jest.fn()
          }
        }
      )

      await expect(
        downloadArtifactInternal(fixtures.artifactID)
      ).rejects.toBeInstanceOf(Error)
      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
      expect(mockListArtifacts).toHaveBeenCalledWith({
        idFilter: {
          value: fixtures.artifactID.toString()
        },
        ...fixtures.backendIds
      })
      expect(mockGetSignedArtifactURL).toHaveBeenCalledWith({
        ...fixtures.backendIds,
        name: fixtures.artifactName
      })
    }, 38000)
  })

  describe('streamExtractExternal', () => {
    beforeEach(async () => {
      await setup()
      // Create workspace directory for streamExtractExternal tests
      await fs.promises.mkdir(fixtures.workspaceDir, {recursive: true})
    })
    afterEach(cleanup)

    const mockClient = (
      get: jest.Mock
    ): {get: jest.Mock; dispose: jest.Mock} => ({
      get,
      dispose: jest.fn()
    })

    const waitForTimer = async (): Promise<void> => {
      for (let turn = 0; turn < 20; turn++) {
        if (jest.getTimerCount() > 0) {
          return
        }
        await jest.advanceTimersByTimeAsync(0)
      }
      throw new Error('Attempt did not install its timer')
    }

    it('should dispose a timed-out attempt before a later attempt succeeds', async () => {
      jest.useFakeTimers()
      const downloadArtifactMock = github.getOctokit(fixtures.token).rest
        .actions.downloadArtifact as MockedDownloadArtifact
      downloadArtifactMock.mockResolvedValueOnce({
        headers: {location: fixtures.blobStorageUrl},
        status: 302,
        url: '',
        data: Buffer.from('')
      })

      const clients = [
        mockClient(jest.fn(mockGetArtifactHung)),
        mockClient(jest.fn(mockGetArtifactSuccess))
      ]
      ;(HttpClient as jest.Mock).mockImplementation(() => clients.shift())

      const download = downloadArtifactPublic(
        fixtures.artifactID,
        fixtures.repositoryOwner,
        fixtures.repositoryName,
        fixtures.token,
        {skipDecompress: true}
      )
      await waitForTimer()
      await jest.advanceTimersByTimeAsync(30 * 1000)
      await waitForTimer()
      await jest.advanceTimersByTimeAsync(5 * 1000)

      await expect(download).resolves.toMatchObject({
        downloadPath: fixtures.workspaceDir,
        digestMismatch: false
      })
      expect(HttpClient).toHaveBeenCalledTimes(2)
      expect(clients).toHaveLength(0)
      expect(mockGetArtifactHung.mock.results[0].value.message.destroyed).toBe(
        true
      )
      for (const client of (HttpClient as jest.Mock).mock.results) {
        expect(client.value.dispose).toHaveBeenCalledTimes(1)
      }
      expect(jest.getTimerCount()).toBe(0)
    })

    it('should dispose every attempt when all attempts time out', async () => {
      jest.useFakeTimers()
      const downloadArtifactMock = github.getOctokit(fixtures.token).rest
        .actions.downloadArtifact as MockedDownloadArtifact
      downloadArtifactMock.mockResolvedValueOnce({
        headers: {location: fixtures.blobStorageUrl},
        status: 302,
        url: '',
        data: Buffer.from('')
      })

      const clients = Array.from({length: 5}, () =>
        mockClient(jest.fn(mockGetArtifactHung))
      )
      const pendingClients = [...clients]
      ;(HttpClient as jest.Mock).mockImplementation(() =>
        pendingClients.shift()
      )

      const outcome = downloadArtifactPublic(
        fixtures.artifactID,
        fixtures.repositoryOwner,
        fixtures.repositoryName,
        fixtures.token
      ).catch(error => error as Error)
      for (let attempt = 0; attempt < 5; attempt++) {
        await waitForTimer()
        await jest.advanceTimersByTimeAsync(30 * 1000)
        await waitForTimer()
        await jest.advanceTimersByTimeAsync(5 * 1000)
      }

      await expect(outcome).resolves.toThrow(
        'Unable to download and extract artifact: Artifact download failed after 5 retries.'
      )
      expect(HttpClient).toHaveBeenCalledTimes(5)
      for (const client of clients) {
        expect(client.dispose).toHaveBeenCalledTimes(1)
        expect(client.get.mock.results[0].value.message.destroyed).toBe(true)
      }
      expect(jest.getTimerCount()).toBe(0)
    })

    it('should clean up a response error before completion', async () => {
      jest.useFakeTimers()
      const responseError = new Error('response failed')
      const message = mockGetArtifactHung().message
      const client = mockClient(jest.fn(() => ({message})))
      ;(HttpClient as jest.Mock).mockImplementation(() => client)

      const extraction = streamExtractExternal(
        fixtures.blobStorageUrl,
        fixtures.workspaceDir,
        {timeout: 1000}
      )
      await waitForTimer()
      message.destroy(responseError)

      await expect(extraction).rejects.toBe(responseError)
      expect(message.destroyed).toBe(true)
      expect(client.dispose).toHaveBeenCalledTimes(1)
      expect(jest.getTimerCount()).toBe(0)
    })

    it('should destroy every stream owned by a timed-out attempt', async () => {
      jest.useFakeTimers()
      const passThroughDestroy = jest.spyOn(
        stream.PassThrough.prototype,
        'destroy'
      )
      const transformDestroy = jest.spyOn(stream.Transform.prototype, 'destroy')
      const message = mockGetArtifactHung().message
      const client = mockClient(jest.fn(() => ({message})))
      ;(HttpClient as jest.Mock).mockImplementation(() => client)

      const outcome = streamExtractExternal(
        fixtures.blobStorageUrl,
        fixtures.workspaceDir,
        {timeout: 1000}
      ).catch(error => error as Error)
      await waitForTimer()
      await jest.advanceTimersByTimeAsync(1000)

      await expect(outcome).resolves.toBeInstanceOf(Error)
      expect(message.destroyed).toBe(true)
      expect(passThroughDestroy).toHaveBeenCalledTimes(1)
      expect(transformDestroy).toHaveBeenCalledTimes(2)
      expect(client.dispose).toHaveBeenCalledTimes(1)
      expect(jest.getTimerCount()).toBe(0)
    })

    it('should dispose the client and response for a non-200 response', async () => {
      const response = mockGetArtifactFailure()
      const client = mockClient(jest.fn(() => response))
      ;(HttpClient as jest.Mock).mockImplementation(() => client)

      await expect(
        streamExtractExternal(fixtures.blobStorageUrl, fixtures.workspaceDir)
      ).rejects.toThrow('Unexpected HTTP response from blob storage: 500')
      expect(response.message.destroyed).toBe(true)
      expect(client.dispose).toHaveBeenCalledTimes(1)
    })

    it('should clean up an extraction failure', async () => {
      jest.useFakeTimers()
      const message = new http.IncomingMessage(new net.Socket())
      message.statusCode = 200
      message.headers['content-type'] = 'application/zip'
      message.push(Buffer.from('not a zip archive'))
      message.push(null)
      const client = mockClient(jest.fn(() => ({message})))
      ;(HttpClient as jest.Mock).mockImplementation(() => client)

      await expect(
        streamExtractExternal(fixtures.blobStorageUrl, fixtures.workspaceDir, {
          timeout: 1000
        })
      ).rejects.toBeInstanceOf(Error)
      expect(client.dispose).toHaveBeenCalledTimes(1)
      expect(jest.getTimerCount()).toBe(0)
    })

    it('should clean up an output write failure', async () => {
      jest.useFakeTimers()
      const writeError = new Error('write failed')
      const failingOutput = new stream.Writable({
        write(_chunk, _encoding, callback) {
          callback(writeError)
        }
      })
      jest
        .spyOn(fs, 'createWriteStream')
        .mockReturnValue(failingOutput as fs.WriteStream)

      const message = new http.IncomingMessage(new net.Socket())
      message.statusCode = 200
      message.headers['content-type'] = 'text/plain'
      message.push(Buffer.from('artifact contents'))
      message.push(null)
      const client = mockClient(jest.fn(() => ({message})))
      ;(HttpClient as jest.Mock).mockImplementation(() => client)

      await expect(
        streamExtractExternal(fixtures.blobStorageUrl, fixtures.workspaceDir, {
          timeout: 1000
        })
      ).rejects.toBe(writeError)
      expect(failingOutput.destroyed).toBe(true)
      expect(client.dispose).toHaveBeenCalledTimes(1)
      expect(jest.getTimerCount()).toBe(0)
    })

    it('should not clean up a successful attempt before output completes', async () => {
      jest.useFakeTimers()
      let completeWrite: (() => void) | undefined
      const controlledOutput = new stream.Writable({
        write(_chunk, _encoding, callback) {
          completeWrite = callback
        }
      })
      jest
        .spyOn(fs, 'createWriteStream')
        .mockReturnValue(controlledOutput as fs.WriteStream)

      const message = new http.IncomingMessage(new net.Socket())
      message.statusCode = 200
      message.headers['content-type'] = 'text/plain'
      message.push(Buffer.from('artifact contents'))
      message.push(null)
      const client = mockClient(jest.fn(() => ({message})))
      ;(HttpClient as jest.Mock).mockImplementation(() => client)

      const extraction = streamExtractExternal(
        fixtures.blobStorageUrl,
        fixtures.workspaceDir,
        {timeout: 1000}
      )
      for (let turn = 0; turn < 20 && !completeWrite; turn++) {
        await jest.advanceTimersByTimeAsync(0)
      }

      expect(completeWrite).toBeDefined()
      expect(controlledOutput.destroyed).toBe(false)
      expect(client.dispose).not.toHaveBeenCalled()

      completeWrite?.()
      await expect(extraction).resolves.toMatchObject({
        sha256Digest: expect.stringMatching(/^sha256:[0-9a-f]{64}$/)
      })
      expect(client.dispose).toHaveBeenCalledTimes(1)
      expect(jest.getTimerCount()).toBe(0)
    })

    it('should clean up a hash failure', async () => {
      jest.useFakeTimers()
      const hashPrototype = Object.getPrototypeOf(crypto.createHash('sha256'))
      jest.spyOn(hashPrototype, 'update').mockImplementationOnce(() => {
        throw new Error('hash failed')
      })
      const client = mockClient(jest.fn(mockGetArtifactSuccess))
      ;(HttpClient as jest.Mock).mockImplementation(() => client)

      await expect(
        streamExtractExternal(fixtures.blobStorageUrl, fixtures.workspaceDir, {
          timeout: 1000
        })
      ).rejects.toThrow('hash failed')
      expect(client.dispose).toHaveBeenCalledTimes(1)
      expect(jest.getTimerCount()).toBe(0)
    })

    it('should settle cleanup once when timeout races response completion', async () => {
      jest.useFakeTimers()
      const message = mockGetArtifactHung().message
      const client = mockClient(jest.fn(() => ({message})))
      ;(HttpClient as jest.Mock).mockImplementation(() => client)

      const outcome = streamExtractExternal(
        fixtures.blobStorageUrl,
        fixtures.workspaceDir,
        {timeout: 1000}
      ).catch(error => error as Error)
      await waitForTimer()
      message.push(fs.readFileSync(fixtures.exampleArtifact.path))
      message.push(null)
      await jest.advanceTimersByTimeAsync(1000)

      await expect(outcome).resolves.toBeDefined()
      expect(client.dispose).toHaveBeenCalledTimes(1)
      expect(jest.getTimerCount()).toBe(0)
    })

    it('should settle cleanup once when timeout races a response error', async () => {
      jest.useFakeTimers()
      const message = mockGetArtifactHung().message
      const client = mockClient(jest.fn(() => ({message})))
      ;(HttpClient as jest.Mock).mockImplementation(() => client)

      const outcome = streamExtractExternal(
        fixtures.blobStorageUrl,
        fixtures.workspaceDir,
        {timeout: 1000}
      ).catch(error => error as Error)
      await waitForTimer()
      message.destroy(new Error('response failed during timeout'))
      await jest.advanceTimersByTimeAsync(1000)

      await expect(outcome).resolves.toBeInstanceOf(Error)
      expect(client.dispose).toHaveBeenCalledTimes(1)
      expect(jest.getTimerCount()).toBe(0)
    })

    it('should fail if the timeout is exceeded', async () => {
      const mockSlowGetArtifact = jest.fn(mockGetArtifactHung)

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockSlowGetArtifact,
            dispose: jest.fn()
          }
        }
      )

      try {
        await streamExtractExternal(
          fixtures.blobStorageUrl,
          fixtures.workspaceDir,
          {timeout: 2}
        )
        expect(true).toBe(false) // should not be called
      } catch (error: unknown) {
        const e = error as Error
        expect(e).toBeInstanceOf(Error)
        expect(e.message).toContain('did not respond in 2ms')
        expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
        expect(mockSlowGetArtifact).toHaveBeenCalledTimes(1)
      }
    })

    it('should extract zip file when content-type is application/zip', async () => {
      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGetArtifactSuccess,
            dispose: jest.fn()
          }
        }
      )

      await streamExtractExternal(
        fixtures.blobStorageUrl,
        fixtures.workspaceDir
      )

      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
      // Verify files were extracted (not saved as a single file)
      await expectExtractedArchive(fixtures.workspaceDir)
    })

    it('should save raw file without extracting when content-type is not a zip', async () => {
      const rawFileContent = 'This is a raw text file, not a zip'
      const rawFileName = 'my-artifact.txt'

      const mockGetRawFile = jest.fn(() => {
        const message = new http.IncomingMessage(new net.Socket())
        message.statusCode = 200
        message.headers['content-type'] = 'text/plain'
        message.headers['content-disposition'] =
          `attachment; filename="${rawFileName}"`
        message.push(Buffer.from(rawFileContent))
        message.push(null)
        return {
          message
        }
      })

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGetRawFile,
            dispose: jest.fn()
          }
        }
      )

      await streamExtractExternal(
        fixtures.blobStorageUrl,
        fixtures.workspaceDir
      )

      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
      // Verify file was saved as-is, not extracted
      const savedFilePath = path.join(fixtures.workspaceDir, rawFileName)
      expect(fs.existsSync(savedFilePath)).toBe(true)
      expect(fs.readFileSync(savedFilePath, 'utf8')).toBe(rawFileContent)
    })

    it('should save raw file with default name when content-disposition is missing', async () => {
      const rawFileContent = 'Binary content here'

      const mockGetRawFileNoDisposition = jest.fn(() => {
        const message = new http.IncomingMessage(new net.Socket())
        message.statusCode = 200
        message.headers['content-type'] = 'application/octet-stream'
        // No content-disposition header
        message.push(Buffer.from(rawFileContent))
        message.push(null)
        return {
          message
        }
      })

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGetRawFileNoDisposition,
            dispose: jest.fn()
          }
        }
      )

      await streamExtractExternal(
        fixtures.blobStorageUrl,
        fixtures.workspaceDir
      )

      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
      // Verify file was saved with default name 'artifact'
      const savedFilePath = path.join(fixtures.workspaceDir, 'artifact')
      expect(fs.existsSync(savedFilePath)).toBe(true)
      expect(fs.readFileSync(savedFilePath, 'utf8')).toBe(rawFileContent)
    })

    it('should not attempt to unzip when content-type is image/png', async () => {
      const pngFileName = 'screenshot.png'
      // Simple PNG header bytes for testing
      const pngContent = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
      ])

      const mockGetPngFile = jest.fn(() => {
        const message = new http.IncomingMessage(new net.Socket())
        message.statusCode = 200
        message.headers['content-type'] = 'image/png'
        message.headers['content-disposition'] =
          `attachment; filename="${pngFileName}"`
        message.push(pngContent)
        message.push(null)
        return {
          message
        }
      })

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGetPngFile,
            dispose: jest.fn()
          }
        }
      )

      await streamExtractExternal(
        fixtures.blobStorageUrl,
        fixtures.workspaceDir
      )

      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
      // Verify PNG was saved as-is
      const savedFilePath = path.join(fixtures.workspaceDir, pngFileName)
      expect(fs.existsSync(savedFilePath)).toBe(true)
      expect(fs.readFileSync(savedFilePath)).toEqual(pngContent)
    })

    it('should extract when content-type is application/x-zip-compressed', async () => {
      const mockGetZipCompressed = jest.fn(() => {
        const message = new http.IncomingMessage(new net.Socket())
        message.statusCode = 200
        message.headers['content-type'] = 'application/x-zip-compressed'
        message.push(fs.readFileSync(fixtures.exampleArtifact.path))
        message.push(null)
        return {
          message
        }
      })

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGetZipCompressed,
            dispose: jest.fn()
          }
        }
      )

      await streamExtractExternal(
        fixtures.blobStorageUrl,
        fixtures.workspaceDir
      )

      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
      // Verify files were extracted
      await expectExtractedArchive(fixtures.workspaceDir)
    })

    it('should extract zip when URL ends with .zip even if content-type is not application/zip', async () => {
      const blobUrlWithZipExtension =
        'https://blob-storage.local/artifact.zip?sig=abc123'

      const mockGetZipByUrl = jest.fn(() => {
        const message = new http.IncomingMessage(new net.Socket())
        message.statusCode = 200
        // Azure Blob Storage may return a generic content-type
        message.headers['content-type'] = 'application/octet-stream'
        message.push(fs.readFileSync(fixtures.exampleArtifact.path))
        message.push(null)
        return {
          message
        }
      })

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGetZipByUrl,
            dispose: jest.fn()
          }
        }
      )

      await streamExtractExternal(
        blobUrlWithZipExtension,
        fixtures.workspaceDir
      )

      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
      // Verify files were extracted based on URL .zip extension
      await expectExtractedArchive(fixtures.workspaceDir)
    })

    it('should skip decompression when skipDecompress option is true even for zip content-type', async () => {
      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGetArtifactSuccess,
            dispose: jest.fn()
          }
        }
      )

      await streamExtractExternal(
        fixtures.blobStorageUrl,
        fixtures.workspaceDir,
        {skipDecompress: true}
      )

      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
      // Verify zip was saved as-is, not extracted
      // When skipDecompress is true, the file should be saved with default name 'artifact'
      const savedFilePath = path.join(fixtures.workspaceDir, 'artifact')
      expect(fs.existsSync(savedFilePath)).toBe(true)
      // The saved file should be the raw zip content
      const savedContent = fs.readFileSync(savedFilePath)
      const originalZipContent = fs.readFileSync(fixtures.exampleArtifact.path)
      expect(savedContent).toEqual(originalZipContent)
    })

    it('should sanitize path traversal attempts in Content-Disposition filename', async () => {
      const rawFileContent = 'malicious content'
      const maliciousFileName = '../../../etc/passwd'

      const mockGetMaliciousFile = jest.fn(() => {
        const message = new http.IncomingMessage(new net.Socket())
        message.statusCode = 200
        message.headers['content-type'] = 'text/plain'
        message.headers['content-disposition'] =
          `attachment; filename="${maliciousFileName}"`
        message.push(Buffer.from(rawFileContent))
        message.push(null)
        return {
          message
        }
      })

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGetMaliciousFile,
            dispose: jest.fn()
          }
        }
      )

      await streamExtractExternal(
        fixtures.blobStorageUrl,
        fixtures.workspaceDir
      )

      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
      // Verify file was saved with sanitized name (just 'passwd', not the full path)
      const sanitizedFileName = 'passwd'
      const savedFilePath = path.join(fixtures.workspaceDir, sanitizedFileName)
      expect(fs.existsSync(savedFilePath)).toBe(true)
      expect(fs.readFileSync(savedFilePath, 'utf8')).toBe(rawFileContent)

      // Verify the file was NOT written outside the workspace directory
      const maliciousPath = path.resolve(
        fixtures.workspaceDir,
        maliciousFileName
      )
      expect(fs.existsSync(maliciousPath)).toBe(false)
    })

    it('should handle encoded path traversal attempts in Content-Disposition filename', async () => {
      const rawFileContent = 'encoded malicious content'
      // URL encoded version of ../../../etc/passwd
      const encodedMaliciousFileName = '..%2F..%2F..%2Fetc%2Fpasswd'

      const mockGetEncodedMaliciousFile = jest.fn(() => {
        const message = new http.IncomingMessage(new net.Socket())
        message.statusCode = 200
        message.headers['content-type'] = 'application/octet-stream'
        message.headers['content-disposition'] =
          `attachment; filename="${encodedMaliciousFileName}"`
        message.push(Buffer.from(rawFileContent))
        message.push(null)
        return {
          message
        }
      })

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGetEncodedMaliciousFile,
            dispose: jest.fn()
          }
        }
      )

      await streamExtractExternal(
        fixtures.blobStorageUrl,
        fixtures.workspaceDir
      )

      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
      // After decoding and sanitizing, should just be 'passwd'
      const sanitizedFileName = 'passwd'
      const savedFilePath = path.join(fixtures.workspaceDir, sanitizedFileName)
      expect(fs.existsSync(savedFilePath)).toBe(true)
      expect(fs.readFileSync(savedFilePath, 'utf8')).toBe(rawFileContent)

      // Verify the file was NOT written outside the workspace directory
      const maliciousPathEncoded = path.resolve(
        fixtures.workspaceDir,
        encodedMaliciousFileName
      )
      expect(fs.existsSync(maliciousPathEncoded)).toBe(false)

      const maliciousPath = path.resolve(
        fixtures.workspaceDir,
        '../../../etc/passwd'
      )
      expect(fs.existsSync(maliciousPath)).toBe(false)
    })

    it('should correctly handle Content-Disposition with filename* parameter (RFC 5987)', async () => {
      const rawFileContent = 'content with rfc5987 encoding'
      const expectedFileName = '报告-土-x.txt'
      const asciiFileName = '__-_-x.txt'

      const mockGetRfc5987File = jest.fn(() => {
        const message = new http.IncomingMessage(new net.Socket())
        message.statusCode = 200
        message.headers['content-type'] = 'text/plain'
        // Server sends both: filename with _ fallbacks, filename* with UTF-8 encoding
        message.headers['content-disposition'] =
          `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodeURIComponent(expectedFileName)}`
        message.push(Buffer.from(rawFileContent, 'utf8'))
        message.push(null)
        return {
          message
        }
      })

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGetRfc5987File,
            dispose: jest.fn()
          }
        }
      )

      await streamExtractExternal(
        fixtures.blobStorageUrl,
        fixtures.workspaceDir
      )

      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
      const savedFilePath = path.join(fixtures.workspaceDir, expectedFileName)
      expect(fs.existsSync(savedFilePath)).toBe(true)
      expect(fs.readFileSync(savedFilePath, 'utf8')).toBe(rawFileContent)
    })

    it('should handle zip artifacts with Chinese characters in the artifact name', async () => {
      // Simulate Azure Blob Storage URL with rscd containing Chinese filename
      const chineseArtifactName = 'probe-土-x'
      const asciiArtifactName = 'probe-_-x'
      const blobUrlWithChineseName = `https://blob-storage.local/artifact.zip?rscd=${encodeURIComponent(`attachment; filename="${asciiArtifactName}.zip"; filename*=UTF-8''${encodeURIComponent(`${chineseArtifactName}.zip`)}`)}&rsct=application%2Fzip&sig=abc123`

      const mockGetZip = jest.fn(() => {
        const message = new http.IncomingMessage(new net.Socket())
        message.statusCode = 200
        message.headers['content-type'] = 'application/zip'
        message.headers['content-disposition'] =
          `attachment; filename="${asciiArtifactName}.zip"; filename*=UTF-8''${encodeURIComponent(`${chineseArtifactName}.zip`)}`
        message.push(fs.readFileSync(fixtures.exampleArtifact.path))
        message.push(null)
        return {
          message
        }
      })

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockGetZip,
            dispose: jest.fn()
          }
        }
      )

      await streamExtractExternal(blobUrlWithChineseName, fixtures.workspaceDir)

      expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
      // Zip should be extracted normally regardless of Chinese artifact name
      await expectExtractedArchive(fixtures.workspaceDir)
    })

    it.each([
      ['土', '_'], // U+571F - known to cause 400 errors
      ['日', '_'], // U+65E5 - reported to work fine
      ['中文测试', '____'], // multiple Chinese characters
      ['文件-2026年', '__-2026_'], // mixed Chinese and numbers
      ['データ', '___'], // Japanese katakana
      ['테스트', '___'] // Korean characters
    ])(
      'should prefer filename* over filename for non-ASCII character %s (%s)',
      async (chars, asciiReplacement) => {
        const rawFileContent = `content for ${chars}`
        const expectedFileName = `artifact-${chars}.txt`
        const asciiFileName = `artifact-${asciiReplacement}.txt`

        const mockGetFile = jest.fn(() => {
          const message = new http.IncomingMessage(new net.Socket())
          message.statusCode = 200
          message.headers['content-type'] = 'text/plain'
          // Server sends filename with _ replacing non-ASCII, filename* with proper encoding
          message.headers['content-disposition'] =
            `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodeURIComponent(expectedFileName)}`
          message.push(Buffer.from(rawFileContent, 'utf8'))
          message.push(null)
          return {
            message
          }
        })

        const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
          () => {
            return {
              get: mockGetFile,
              dispose: jest.fn()
            }
          }
        )

        await streamExtractExternal(
          fixtures.blobStorageUrl,
          fixtures.workspaceDir
        )

        expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
        const savedFilePath = path.join(fixtures.workspaceDir, expectedFileName)
        expect(fs.existsSync(savedFilePath)).toBe(true)
        expect(fs.readFileSync(savedFilePath, 'utf8')).toBe(rawFileContent)
      }
    )
  })
})
