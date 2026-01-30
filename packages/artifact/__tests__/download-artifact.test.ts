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
    }, 38000)
  })

  describe('streamExtractExternal', () => {
    beforeEach(async () => {
      await setup()
      // Create workspace directory for streamExtractExternal tests
      await fs.promises.mkdir(fixtures.workspaceDir, {recursive: true})
    })
    afterEach(cleanup)

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
            get: mockGetArtifactSuccess
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
            get: mockGetRawFile
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
            get: mockGetRawFileNoDisposition
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
            get: mockGetPngFile
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
            get: mockGetZipCompressed
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
            get: mockGetZipByUrl
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
            get: mockGetArtifactSuccess
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
            get: mockGetMaliciousFile
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
            get: mockGetEncodedMaliciousFile
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
  })
})
