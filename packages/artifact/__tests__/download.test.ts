import * as core from '@actions/core'
import * as http from 'http'
import * as io from '../../io/src/io'
import * as net from 'net'
import * as path from 'path'
import * as configVariables from '../src/internal/config-variables'
import {promises as fs} from 'fs'
import {DownloadItem} from '../src/internal/download-specification'
import {HttpClient, HttpClientResponse} from '@actions/http-client'
import {DownloadHttpClient} from '../src/internal/download-http-client'
import {
  ListArtifactsResponse,
  QueryArtifactResponse
} from '../src/internal/contracts'
import * as stream from 'stream'
import {gzip} from 'zlib'
import {promisify} from 'util'

const root = path.join(__dirname, '_temp', 'artifact-download-tests')
const defaultEncoding = 'utf8'

jest.mock('../src/internal/config-variables')
jest.mock('@actions/http-client')

describe('Download Tests', () => {
  beforeAll(async () => {
    await io.rmRF(root)
    await fs.mkdir(path.join(root), {
      recursive: true
    })

    // mock all output so that there is less noise when running tests
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(core, 'debug').mockImplementation(() => {})
    jest.spyOn(core, 'info').mockImplementation(() => {})
    jest.spyOn(core, 'warning').mockImplementation(() => {})
    jest.spyOn(core, 'error').mockImplementation(() => {})
  })

  /**
   * Test Listing Artifacts
   */
  it('List Artifacts - Success', async () => {
    setupSuccessfulListArtifactsResponse()
    const downloadHttpClient = new DownloadHttpClient()
    const artifacts = await downloadHttpClient.listArtifacts()
    expect(artifacts.count).toEqual(2)

    const artifactNames = artifacts.value.map(item => item.name)
    expect(artifactNames).toContain('artifact1-name')
    expect(artifactNames).toContain('artifact2-name')

    for (const artifact of artifacts.value) {
      if (artifact.name === 'artifact1-name') {
        expect(artifact.url).toEqual(
          `${configVariables.getRuntimeUrl()}_apis/pipelines/1/runs/1/artifacts?artifactName=artifact1-name`
        )
      } else if (artifact.name === 'artifact2-name') {
        expect(artifact.url).toEqual(
          `${configVariables.getRuntimeUrl()}_apis/pipelines/1/runs/1/artifacts?artifactName=artifact2-name`
        )
      } else {
        throw new Error(
          'Invalid artifact combination. This should never be reached'
        )
      }
    }
  })

  it('List Artifacts - Failure', async () => {
    setupFailedResponse()
    const downloadHttpClient = new DownloadHttpClient()
    expect(downloadHttpClient.listArtifacts()).rejects.toThrow(
      'List Artifacts failed: Artifact service responded with 400'
    )
  })

  /**
   * Test Container Items
   */
  it('Container Items - Success', async () => {
    setupSuccessfulContainerItemsResponse()
    const downloadHttpClient = new DownloadHttpClient()
    const response = await downloadHttpClient.getContainerItems(
      'artifact-name',
      configVariables.getRuntimeUrl()
    )
    expect(response.count).toEqual(2)

    const itemPaths = response.value.map(item => item.path)
    expect(itemPaths).toContain('artifact-name')
    expect(itemPaths).toContain('artifact-name/file1.txt')

    for (const containerEntry of response.value) {
      if (containerEntry.path === 'artifact-name') {
        expect(containerEntry.itemType).toEqual('folder')
      } else if (containerEntry.path === 'artifact-name/file1.txt') {
        expect(containerEntry.itemType).toEqual('file')
      } else {
        throw new Error(
          'Invalid container combination. This should never be reached'
        )
      }
    }
  })

  it('Container Items - Failure', async () => {
    setupFailedResponse()
    const downloadHttpClient = new DownloadHttpClient()
    expect(
      downloadHttpClient.getContainerItems(
        'artifact-name',
        configVariables.getRuntimeUrl()
      )
    ).rejects.toThrow(
      `Get Container Items failed: Artifact service responded with 400`
    )
  })

  it('Test downloading an individual artifact with gzip', async () => {
    const fileContents = Buffer.from(
      'gzip worked on the first try\n',
      defaultEncoding
    )
    const targetPath = path.join(root, 'FileA.txt')

    setupDownloadItemResponse(fileContents, true, 200, false, false)
    const downloadHttpClient = new DownloadHttpClient()

    const items: DownloadItem[] = []
    items.push({
      sourceLocation: `${configVariables.getRuntimeUrl()}_apis/resources/Containers/13?itemPath=my-artifact%2FFileA.txt`,
      targetPath
    })

    await expect(
      downloadHttpClient.downloadSingleArtifact(items)
    ).resolves.not.toThrow()

    await checkDestinationFile(targetPath, fileContents)
  })

  it('Test downloading an individual artifact without gzip', async () => {
    const fileContents = Buffer.from(
      'plaintext worked on the first try\n',
      defaultEncoding
    )
    const targetPath = path.join(root, 'FileB.txt')

    setupDownloadItemResponse(fileContents, false, 200, false, false)
    const downloadHttpClient = new DownloadHttpClient()

    const items: DownloadItem[] = []
    items.push({
      sourceLocation: `${configVariables.getRuntimeUrl()}_apis/resources/Containers/13?itemPath=my-artifact%2FFileB.txt`,
      targetPath
    })

    await expect(
      downloadHttpClient.downloadSingleArtifact(items)
    ).resolves.not.toThrow()

    await checkDestinationFile(targetPath, fileContents)
  })

  it('Test retryable status codes during artifact download', async () => {
    // The first http response should return a retryable status call while the subsequent call should return a 200 so
    // the download should successfully finish
    const retryableStatusCodes = [429, 500, 502, 503, 504]
    for (const statusCode of retryableStatusCodes) {
      const fileContents = Buffer.from('try, try again\n', defaultEncoding)
      const targetPath = path.join(root, `FileC-${statusCode}.txt`)

      setupDownloadItemResponse(fileContents, false, statusCode, false, true)
      const downloadHttpClient = new DownloadHttpClient()

      const items: DownloadItem[] = []
      items.push({
        sourceLocation: `${configVariables.getRuntimeUrl()}_apis/resources/Containers/13?itemPath=my-artifact%2FFileC.txt`,
        targetPath
      })

      await expect(
        downloadHttpClient.downloadSingleArtifact(items)
      ).resolves.not.toThrow()

      await checkDestinationFile(targetPath, fileContents)
    }
  })

  it('Test retry on truncated response with gzip', async () => {
    const fileContents = Buffer.from(
      'Sometimes gunzip fails on the first try\n',
      defaultEncoding
    )
    const targetPath = path.join(root, 'FileD.txt')

    setupDownloadItemResponse(fileContents, true, 200, true, true)
    const downloadHttpClient = new DownloadHttpClient()

    const items: DownloadItem[] = []
    items.push({
      sourceLocation: `${configVariables.getRuntimeUrl()}_apis/resources/Containers/13?itemPath=my-artifact%2FFileD.txt`,
      targetPath
    })

    await expect(
      downloadHttpClient.downloadSingleArtifact(items)
    ).resolves.not.toThrow()

    await checkDestinationFile(targetPath, fileContents)
  })

  it('Test retry on truncated response without gzip', async () => {
    const fileContents = Buffer.from(
      'You have to inspect the content-length header to know if you got everything\n',
      defaultEncoding
    )
    const targetPath = path.join(root, 'FileE.txt')

    setupDownloadItemResponse(fileContents, false, 200, true, true)
    const downloadHttpClient = new DownloadHttpClient()

    const items: DownloadItem[] = []
    items.push({
      sourceLocation: `${configVariables.getRuntimeUrl()}_apis/resources/Containers/13?itemPath=my-artifact%2FFileD.txt`,
      targetPath
    })

    await expect(
      downloadHttpClient.downloadSingleArtifact(items)
    ).resolves.not.toThrow()

    await checkDestinationFile(targetPath, fileContents)
  })

  /**
   * Helper used to setup mocking for the HttpClient
   */
  async function emptyMockReadBody(): Promise<string> {
    return new Promise(resolve => {
      resolve()
    })
  }

  /**
   * Setups up HTTP GET response for a successful listArtifacts() call
   */
  function setupSuccessfulListArtifactsResponse(): void {
    jest.spyOn(HttpClient.prototype, 'get').mockImplementationOnce(async () => {
      const mockMessage = new http.IncomingMessage(new net.Socket())
      let mockReadBody = emptyMockReadBody

      mockMessage.statusCode = 201
      const response: ListArtifactsResponse = {
        count: 2,
        value: [
          {
            containerId: '13',
            size: -1,
            signedContent: 'false',
            fileContainerResourceUrl: `${configVariables.getRuntimeUrl()}_apis/resources/Containers/13`,
            type: 'actions_storage',
            name: 'artifact1-name',
            url: `${configVariables.getRuntimeUrl()}_apis/pipelines/1/runs/1/artifacts?artifactName=artifact1-name`
          },
          {
            containerId: '13',
            size: -1,
            signedContent: 'false',
            fileContainerResourceUrl: `${configVariables.getRuntimeUrl()}_apis/resources/Containers/13`,
            type: 'actions_storage',
            name: 'artifact2-name',
            url: `${configVariables.getRuntimeUrl()}_apis/pipelines/1/runs/1/artifacts?artifactName=artifact2-name`
          }
        ]
      }
      const returnData: string = JSON.stringify(response, null, 2)
      mockReadBody = async function(): Promise<string> {
        return new Promise(resolve => {
          resolve(returnData)
        })
      }

      return new Promise<HttpClientResponse>(resolve => {
        resolve({
          message: mockMessage,
          readBody: mockReadBody
        })
      })
    })
  }

  /**
   * Setups up HTTP GET response for downloading items
   * @param isGzip is the downloaded item gzip encoded
   * @param firstHttpResponseCode the http response code that should be returned
   */
  function setupDownloadItemResponse(
    fileContents: Buffer,
    isGzip: boolean,
    firstHttpResponseCode: number,
    truncateFirstResponse: boolean,
    retryExpected: boolean
  ): void {
    const spyInstance = jest
      .spyOn(HttpClient.prototype, 'get')
      .mockImplementationOnce(async () => {
        if (firstHttpResponseCode === 200) {
          const fullResponse = await constructResponse(isGzip, fileContents)
          const actualResponse = truncateFirstResponse
            ? fullResponse.subarray(0, 3)
            : fullResponse

          return {
            message: getDownloadResponseMessage(
              firstHttpResponseCode,
              isGzip,
              fullResponse.length,
              actualResponse
            ),
            readBody: emptyMockReadBody
          }
        } else {
          return {
            message: getDownloadResponseMessage(
              firstHttpResponseCode,
              false,
              0,
              null
            ),
            readBody: emptyMockReadBody
          }
        }
      })

    // set up a second mock only if we expect a retry. Otherwise this mock will affect other tests.
    if (retryExpected) {
      spyInstance.mockImplementationOnce(async () => {
        // chained response, if the HTTP GET function gets called again, return a successful response
        const fullResponse = await constructResponse(isGzip, fileContents)
        return {
          message: getDownloadResponseMessage(
            200,
            isGzip,
            fullResponse.length,
            fullResponse
          ),
          readBody: emptyMockReadBody
        }
      })
    }
  }

  async function constructResponse(
    isGzip: boolean,
    plaintext: Buffer | string
  ): Promise<Buffer> {
    if (isGzip) {
      return await promisify(gzip)(plaintext)
    } else if (typeof plaintext === 'string') {
      return Buffer.from(plaintext, defaultEncoding)
    } else {
      return plaintext
    }
  }

  function getDownloadResponseMessage(
    httpResponseCode: number,
    isGzip: boolean,
    contentLength: number,
    response: Buffer | null
  ): http.IncomingMessage {
    let readCallCount = 0
    const mockMessage = <http.IncomingMessage>new stream.Readable({
      read(size) {
        switch (readCallCount++) {
          case 0:
            if (!!response && response.byteLength > size) {
              throw new Error(
                `test response larger than requested size (${size})`
              )
            }
            this.push(response)
            break

          default:
            // end the stream
            this.push(null)
            break
        }
      }
    })

    mockMessage.statusCode = httpResponseCode
    mockMessage.headers = {
      'content-length': contentLength.toString()
    }

    if (isGzip) {
      mockMessage.headers['content-encoding'] = 'gzip'
    }

    return mockMessage
  }

  /**
   * Setups up HTTP GET response when querying for container items
   */
  function setupSuccessfulContainerItemsResponse(): void {
    jest.spyOn(HttpClient.prototype, 'get').mockImplementationOnce(async () => {
      const mockMessage = new http.IncomingMessage(new net.Socket())
      let mockReadBody = emptyMockReadBody

      mockMessage.statusCode = 201
      const response: QueryArtifactResponse = {
        count: 2,
        value: [
          {
            containerId: 10000,
            scopeIdentifier: '00000000-0000-0000-0000-000000000000',
            path: 'artifact-name',
            itemType: 'folder',
            status: 'created',
            dateCreated: '2020-02-06T22:13:35.373Z',
            dateLastModified: '2020-02-06T22:13:35.453Z',
            createdBy: '82f0bf89-6e55-4e5a-b8b6-f75eb992578c',
            lastModifiedBy: '82f0bf89-6e55-4e5a-b8b6-f75eb992578c',
            itemLocation: `${configVariables.getRuntimeUrl()}/_apis/resources/Containers/10000?itemPath=artifact-name&metadata=True`,
            contentLocation: `${configVariables.getRuntimeUrl()}/_apis/resources/Containers/10000?itemPath=artifact-name`,
            contentId: ''
          },
          {
            containerId: 10000,
            scopeIdentifier: '00000000-0000-0000-0000-000000000000',
            path: 'artifact-name/file1.txt',
            itemType: 'file',
            status: 'created',
            dateCreated: '2020-02-06T22:13:35.373Z',
            dateLastModified: '2020-02-06T22:13:35.453Z',
            createdBy: '82f0bf89-6e55-4e5a-b8b6-f75eb992578c',
            lastModifiedBy: '82f0bf89-6e55-4e5a-b8b6-f75eb992578c',
            itemLocation: `${configVariables.getRuntimeUrl()}/_apis/resources/Containers/10000?itemPath=artifact-name%2Ffile1.txt&metadata=True`,
            contentLocation: `${configVariables.getRuntimeUrl()}/_apis/resources/Containers/10000?itemPath=artifact-name%2Ffile1.txt`,
            contentId: ''
          }
        ]
      }
      const returnData: string = JSON.stringify(response, null, 2)
      mockReadBody = async function(): Promise<string> {
        return new Promise(resolve => {
          resolve(returnData)
        })
      }

      return new Promise<HttpClientResponse>(resolve => {
        resolve({
          message: mockMessage,
          readBody: mockReadBody
        })
      })
    })
  }

  /**
   * Setups up HTTP GET response for a generic failed request
   */
  function setupFailedResponse(): void {
    jest.spyOn(HttpClient.prototype, 'get').mockImplementationOnce(async () => {
      const mockMessage = new http.IncomingMessage(new net.Socket())
      mockMessage.statusCode = 400
      return new Promise<HttpClientResponse>(resolve => {
        resolve({
          message: mockMessage,
          readBody: emptyMockReadBody
        })
      })
    })
  }

  async function checkDestinationFile(
    targetPath: string,
    expectedContents: Buffer
  ): Promise<void> {
    const fileContents = await fs.readFile(targetPath)

    expect(fileContents.byteLength).toEqual(expectedContents.byteLength)
    expect(fileContents.equals(expectedContents)).toBeTruthy()
  }
})
