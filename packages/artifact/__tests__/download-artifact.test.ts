import fs from 'fs'
import * as http from 'http'
import * as net from 'net'
import * as path from 'path'
import * as github from '@actions/github'
import {HttpClient} from '@actions/http-client'
import type {RestEndpointMethods} from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/method-types'
import archiver from 'archiver'

import {
  downloadArtifactInternal,
  downloadArtifactPublic,
  streamExtractExternal
} from '../src/internal/download/download-artifact'
import {getUserAgentString} from '../src/internal/shared/user-agent'
import {noopLogs} from './common'
import * as config from '../src/internal/shared/config'
import {ArtifactServiceClientJSON} from '../src/generated'
import * as util from '../src/internal/shared/util'

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

const setup = async (): Promise<void> => {
  noopLogs()
  await fs.promises.mkdir(testDir, {recursive: true})
  await createTestArchive()

  process.env['GITHUB_WORKSPACE'] = fixtures.workspaceDir
}

const cleanup = async (): Promise<void> => {
  jest.restoreAllMocks()
  await fs.promises.rm(testDir, {recursive: true})
  delete process.env['GITHUB_WORKSPACE']
}

const mockGetArtifactSuccess = jest.fn(() => {
  const message = new http.IncomingMessage(new net.Socket())
  message.statusCode = 200
  message.push(fs.readFileSync(fixtures.exampleArtifact.path))
  message.push(null)
  return {
    message
  }
})

const mockGetArtifactHung = jest.fn(() => {
  const message = new http.IncomingMessage(new net.Socket())
  message.statusCode = 200
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
  message.push(fs.readFileSync(path.join(__dirname, 'fixtures', 'evil.zip'))) // evil.zip contains files that are formatted x/../../etc/hosts
  message.push(null)
  return {
    message
  }
})

describe('download-artifact', () => {
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
            get: mockGetArtifactSuccess
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
            get: mockGetArtifactMalicious
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
            get: mockGetArtifactSuccess
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
            get: mockGet
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
            get: mockGetArtifactFailure
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
            get: mockGetArtifact
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
            get: mockGetArtifactSuccess
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
            get: mockGetArtifactSuccess
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
            get: mockGetArtifactFailure
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
    })
  })

  describe('streamExtractExternal', () => {
    it('should fail if the timeout is exceeded', async () => {
      const mockSlowGetArtifact = jest.fn(mockGetArtifactHung)

      const mockHttpClient = (HttpClient as jest.Mock).mockImplementation(
        () => {
          return {
            get: mockSlowGetArtifact
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
      } catch (e) {
        expect(e).toBeInstanceOf(Error)
        expect(e.message).toContain('did not respond in 2ms')
        expect(mockHttpClient).toHaveBeenCalledWith(getUserAgentString())
        expect(mockSlowGetArtifact).toHaveBeenCalledTimes(1)
      }
    })
  })
})
