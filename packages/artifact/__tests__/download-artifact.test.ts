import fs from 'fs'
import * as http from 'http'
import * as net from 'net'
import * as path from 'path'
import * as core from '@actions/core'
import * as github from '@actions/github'
import {HttpClient} from '@actions/http-client'
import type {RestEndpointMethods} from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/method-types'
import archiver from 'archiver'

import {downloadArtifact} from '../src/internal/download/download-artifact'
import {getUserAgentString} from '../src/internal/shared/user-agent'

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
  repositoryOwner: 'actions',
  repositoryName: 'toolkit',
  token: 'ghp_1234567890',
  blobStorageUrl: 'https://blob-storage.local?signed=true'
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

describe('download-artifact', () => {
  beforeEach(async () => {
    jest.spyOn(core, 'debug').mockImplementation(() => {})
    jest.spyOn(core, 'info').mockImplementation(() => {})
    jest.spyOn(core, 'warning').mockImplementation(() => {})

    await fs.promises.mkdir(testDir, {recursive: true})
    await createTestArchive()

    process.env['GITHUB_WORKSPACE'] = fixtures.workspaceDir
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    await fs.promises.rm(testDir, {recursive: true})
    delete process.env['GITHUB_WORKSPACE']
  })

  it('should successfully download an artifact to $GITHUB_WORKSPACE', async () => {
    const downloadArtifactMock = github.getOctokit(fixtures.token).rest.actions
      .downloadArtifact as MockedDownloadArtifact
    downloadArtifactMock.mockResolvedValueOnce({
      headers: {
        location: fixtures.blobStorageUrl
      },
      status: 302,
      url: '',
      data: Buffer.from('')
    })

    const getMock = jest.fn(() => {
      const message = new http.IncomingMessage(new net.Socket())
      message.statusCode = 200
      message.push(fs.readFileSync(fixtures.exampleArtifact.path))
      return {
        message
      }
    })
    const httpClientMock = (HttpClient as jest.Mock).mockImplementation(() => {
      return {
        get: getMock
      }
    })

    const response = await downloadArtifact(
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
    expect(httpClientMock).toHaveBeenCalledWith(getUserAgentString())
    expect(getMock).toHaveBeenCalledWith(fixtures.blobStorageUrl)

    expectExtractedArchive(fixtures.workspaceDir)

    expect(response.success).toBe(true)
    expect(response.downloadPath).toBe(fixtures.workspaceDir)
  })

  it('should successfully download an artifact to user defined path', async () => {
    const customPath = path.join(testDir, 'custom')

    const downloadArtifactMock = github.getOctokit(fixtures.token).rest.actions
      .downloadArtifact as MockedDownloadArtifact
    downloadArtifactMock.mockResolvedValueOnce({
      headers: {
        location: fixtures.blobStorageUrl
      },
      status: 302,
      url: '',
      data: Buffer.from('')
    })

    const getMock = jest.fn(() => {
      const message = new http.IncomingMessage(new net.Socket())
      message.statusCode = 200
      message.push(fs.readFileSync(fixtures.exampleArtifact.path))
      return {
        message
      }
    })
    const httpClientMock = (HttpClient as jest.Mock).mockImplementation(() => {
      return {
        get: getMock
      }
    })

    const response = await downloadArtifact(
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
    expect(httpClientMock).toHaveBeenCalledWith(getUserAgentString())
    expect(getMock).toHaveBeenCalledWith(fixtures.blobStorageUrl)

    expectExtractedArchive(customPath)

    expect(response.success).toBe(true)
    expect(response.downloadPath).toBe(customPath)
  })

  it('should fail if download artifact API does not respond with location', async () => {
    const downloadArtifactMock = github.getOctokit(fixtures.token).rest.actions
      .downloadArtifact as MockedDownloadArtifact
    downloadArtifactMock.mockResolvedValueOnce({
      headers: {},
      status: 302,
      url: '',
      data: Buffer.from('')
    })

    await expect(
      downloadArtifact(
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

  it('should fail if blob storage response is non-200', async () => {
    const downloadArtifactMock = github.getOctokit(fixtures.token).rest.actions
      .downloadArtifact as MockedDownloadArtifact
    downloadArtifactMock.mockResolvedValueOnce({
      headers: {
        location: fixtures.blobStorageUrl
      },
      status: 302,
      url: '',
      data: Buffer.from('')
    })

    const getMock = jest.fn(() => {
      const message = new http.IncomingMessage(new net.Socket())
      message.statusCode = 500
      message.push('Internal Server Error')
      return {
        message
      }
    })
    const httpClientMock = (HttpClient as jest.Mock).mockImplementation(() => {
      return {
        get: getMock
      }
    })

    await expect(
      downloadArtifact(
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
    expect(httpClientMock).toHaveBeenCalledWith(getUserAgentString())
    expect(getMock).toHaveBeenCalledWith(fixtures.blobStorageUrl)
  })
})
