import * as http from 'http'
import * as io from '../../io/src/io'
import * as net from 'net'
import * as path from 'path'
import * as uploadHttpClient from '../src/upload-artifact-http-client'
import {promises as fs} from 'fs'
import {getRuntimeUrl} from '../src/config-variables'
import {HttpClient, HttpClientResponse} from '@actions/http-client/index'
import {
  CreateArtifactResponse,
  PatchArtifactSizeSuccessResponse
} from '../src/contracts'
import {SearchResult} from '../src/search'

const root = path.join(__dirname, '_temp', 'artifact-upload')
const file1Path = path.join(root, 'file1.txt')
const file2Path = path.join(root, 'file2.txt')
const file3Path = path.join(root, 'folder1', 'file3.txt')
const file4Path = path.join(root, 'folder1', 'file4.txt')
const file5Path = path.join(root, 'folder1', 'folder2', 'folder3', 'file5.txt')

let file1Size = 0
let file2Size = 0
let file3Size = 0
let file4Size = 0
let file5Size = 0

// mock env variables that will not always be available along with certain http methods
jest.mock('../src/config-variables')
jest.mock('@actions/http-client')

describe('Upload Tests', () => {
  // setup mocking for HTTP calls and prepare some test files for mock uploading
  beforeAll(async () => {
    mockHttpPost()
    mockHttpSendStream()
    mockHttpPatch()

    // clear temp directory and create files that will be "uploaded"
    await io.rmRF(root)
    await fs.mkdir(path.join(root, 'folder1', 'folder2', 'folder3'), {
      recursive: true
    })
    await fs.writeFile(file1Path, 'this is file 1')
    await fs.writeFile(file2Path, 'this is file 2')
    await fs.writeFile(file3Path, 'this is file 3')
    await fs.writeFile(file4Path, 'this is file 4')
    await fs.writeFile(file5Path, 'this is file 5')
    /*
      Directory structure for files that were created:
      root/
        file1.txt
        file2.txt
        folder1/
          file3.txt
          file4.txt
          folder2/
            folder3/
              file5.txt
    */

    file1Size = (await fs.stat(file1Path)).size
    file2Size = (await fs.stat(file2Path)).size
    file3Size = (await fs.stat(file3Path)).size
    file4Size = (await fs.stat(file4Path)).size
    file5Size = (await fs.stat(file5Path)).size
  })

  afterAll(async () => {
    await io.rmRF(root)
  })

  /**
   * Artifact Creation Tests
   */
  it('Create Artifact - Success', async () => {
    const artifactName = 'valid-artifact-name'
    const response = await uploadHttpClient.createArtifactInFileContainer(
      artifactName
    )
    expect(response.containerId).toEqual('13')
    expect(response.size).toEqual(-1)
    expect(response.signedContent).toEqual('false')
    expect(response.fileContainerResourceUrl).toEqual(
      `${getRuntimeUrl()}_apis/resources/Containers/13`
    )
    expect(response.type).toEqual('actions_storage')
    expect(response.name).toEqual(artifactName)
    expect(response.url).toEqual(
      `${getRuntimeUrl()}_apis/pipelines/1/runs/1/artifacts?artifactName=${artifactName}`
    )
  })

  it('Create Artifact - Failure', async () => {
    const artifactName = 'invalid-artifact-name'
    expect(
      uploadHttpClient.createArtifactInFileContainer(artifactName)
    ).rejects.toEqual(
      new Error(
        'Unable to create a container for the artifact invalid-artifact-name'
      )
    )
  })

  /**
   * Artifact Upload Tests
   */
  it('Upload Artifact - Success', async () => {
    /**
     * Normally search.findFilesToUpload() would be used for providing information about what to upload. These tests however
     * focuses solely on the upload APIs so searchResult[] will be hard-coded
     */
    const artifactName = 'successful-artifact'
    const searchResult: SearchResult[] = [
      {
        absoluteFilePath: file1Path,
        uploadFilePath: `${artifactName}/file1.txt`
      },
      {
        absoluteFilePath: file2Path,
        uploadFilePath: `${artifactName}/file2.txt`
      },
      {
        absoluteFilePath: file3Path,
        uploadFilePath: `${artifactName}/folder1/file3.txt`
      },
      {
        absoluteFilePath: file4Path,
        uploadFilePath: `${artifactName}/folder1/file4.txt`
      },
      {
        absoluteFilePath: file5Path,
        uploadFilePath: `${artifactName}/folder1/folder2/folder3/file5.txt`
      }
    ]

    const expectedTotalSize =
      file1Size + file2Size + file3Size + file4Size + file5Size
    const uploadUrl = `${getRuntimeUrl()}_apis/resources/Containers/13`
    const uploadResult = await uploadHttpClient.uploadArtifactToFileContainer(
      uploadUrl,
      searchResult
    )
    expect(uploadResult.failedItems.length).toEqual(0)
    expect(uploadResult.size).toEqual(expectedTotalSize)
  })

  it('Upload Artifact - Failed Single File Upload', async () => {
    const searchResult: SearchResult[] = [
      {
        absoluteFilePath: file1Path,
        uploadFilePath: `this-file-upload-will-fail`
      }
    ]

    const uploadUrl = `${getRuntimeUrl()}_apis/resources/Containers/13`
    const uploadResult = await uploadHttpClient.uploadArtifactToFileContainer(
      uploadUrl,
      searchResult
    )
    expect(uploadResult.failedItems.length).toEqual(1)
    expect(uploadResult.size).toEqual(0)
  })

  it('Upload Artifact - Partial Upload Continue On Error', async () => {
    const artifactName = 'partial-artifact'
    const searchResult: SearchResult[] = [
      {
        absoluteFilePath: file1Path,
        uploadFilePath: `${artifactName}/file1.txt`
      },
      {
        absoluteFilePath: file2Path,
        uploadFilePath: `${artifactName}/file2.txt`
      },
      {
        absoluteFilePath: file3Path,
        uploadFilePath: `${artifactName}/folder1/file3.txt`
      },
      {
        absoluteFilePath: file4Path,
        uploadFilePath: `this-file-upload-will-fail`
      },
      {
        absoluteFilePath: file5Path,
        uploadFilePath: `${artifactName}/folder1/folder2/folder3/file5.txt`
      }
    ]

    const expectedPartialSize = file1Size + file2Size + file4Size + file5Size
    const uploadUrl = `${getRuntimeUrl()}_apis/resources/Containers/13`
    const uploadResult = await uploadHttpClient.uploadArtifactToFileContainer(
      uploadUrl,
      searchResult,
      {continueOnError: true}
    )
    expect(uploadResult.failedItems.length).toEqual(1)
    expect(uploadResult.size).toEqual(expectedPartialSize)
  })

  it('Upload Artifact - Partial Upload Fail Fast', async () => {
    const artifactName = 'partial-artifact'
    const searchResult: SearchResult[] = [
      {
        absoluteFilePath: file1Path,
        uploadFilePath: `${artifactName}/file1.txt`
      },
      {
        absoluteFilePath: file2Path,
        uploadFilePath: `${artifactName}/file2.txt`
      },
      {
        absoluteFilePath: file3Path,
        uploadFilePath: `${artifactName}/folder1/file3.txt`
      },
      {
        absoluteFilePath: file4Path,
        uploadFilePath: `this-file-upload-will-fail`
      },
      {
        absoluteFilePath: file5Path,
        uploadFilePath: `${artifactName}/folder1/folder2/folder3/file5.txt`
      }
    ]

    const expectedPartialSize = file1Size + file2Size + file3Size
    const uploadUrl = `${getRuntimeUrl()}_apis/resources/Containers/13`
    const uploadResult = await uploadHttpClient.uploadArtifactToFileContainer(
      uploadUrl,
      searchResult,
      {continueOnError: false}
    )
    expect(uploadResult.failedItems.length).toEqual(2)
    expect(uploadResult.size).toEqual(expectedPartialSize)
  })

  /**
   * Artifact Association Tests
   */
  it('Associate Artifact - Success', async () => {
    expect(async () => {
      uploadHttpClient.patchArtifactSize(130, 'my-artifact')
    }).not.toThrow()
  })

  it('Associate Artifact - Not Found', async () => {
    expect(
      uploadHttpClient.patchArtifactSize(100, 'non-existent-artifact')
    ).rejects.toThrow(
      'An Artifact with the name non-existent-artifact was not found'
    )
  })

  it('Associate Artifact - Error', async () => {
    expect(
      uploadHttpClient.patchArtifactSize(-2, 'my-artifact')
    ).rejects.toThrow('Unable to finish uploading artifact my-artifact')
  })

  /**
   * Helpers used to setup mocking all the required HTTP calls
   */
  async function mockReadBodyEmpty(): Promise<string> {
    return new Promise(resolve => {
      resolve()
    })
  }

  function mockHttpPost(): void {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    HttpClient.prototype.post = async (
      requestdata,
      data
    ): Promise<HttpClientResponse> => {
      // parse the input data and use the provided artifact name as part of the response
      const inputData = JSON.parse(data)
      const mockMessage = new http.IncomingMessage(new net.Socket())
      let mockReadBody = mockReadBodyEmpty

      if (inputData.Name === 'invalid-artifact-name') {
        mockMessage.statusCode = 400
      } else {
        mockMessage.statusCode = 201
        const response: CreateArtifactResponse = {
          containerId: '13',
          size: -1,
          signedContent: 'false',
          fileContainerResourceUrl: `${getRuntimeUrl()}_apis/resources/Containers/13`,
          type: 'actions_storage',
          name: inputData.Name,
          url: `${getRuntimeUrl()}_apis/pipelines/1/runs/1/artifacts?artifactName=${
            inputData.Name
          }`
        }
        const returnData: string = JSON.stringify(response, null, 2)
        mockReadBody = async function(): Promise<string> {
          return new Promise(resolve => {
            resolve(returnData)
          })
        }
      }
      return new Promise<HttpClientResponse>(resolve => {
        resolve({
          message: mockMessage,
          readBody: mockReadBody
        })
      })
    }
  }

  function mockHttpSendStream(): void {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    HttpClient.prototype.sendStream = jest.fn(
      async (verb, requestUrl, stream) => {
        const mockMessage = new http.IncomingMessage(new net.Socket())
        mockMessage.statusCode = 200
        if (!stream.readable) {
          throw new Error('Unable to read provided stream')
        }
        if (requestUrl.includes('fail')) {
          mockMessage.statusCode = 500
        }
        return new Promise<HttpClientResponse>(resolve => {
          resolve({
            message: mockMessage,
            readBody: mockReadBodyEmpty
          })
        })
      }
    )
  }

  function mockHttpPatch(): void {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    HttpClient.prototype.patch = jest.fn(async (requestdata, data) => {
      const inputData = JSON.parse(data)
      const mockMessage = new http.IncomingMessage(new net.Socket())

      // Get the name from the end of requestdata. Will be something like https://www.example.com/_apis/pipelines/workflows/15/artifacts?api-version=6.0-preview&artifactName=my-artifact
      const artifactName = requestdata.split('=')[2]
      let mockReadBody = mockReadBodyEmpty
      if (inputData.Size < 1) {
        mockMessage.statusCode = 400
      } else if (artifactName === 'non-existent-artifact') {
        mockMessage.statusCode = 404
      } else {
        mockMessage.statusCode = 200
        const response: PatchArtifactSizeSuccessResponse = {
          containerId: 13,
          size: inputData.Size,
          signedContent: 'false',
          type: 'actions_storage',
          name: artifactName,
          url: `${getRuntimeUrl()}_apis/pipelines/1/runs/1/artifacts?artifactName=${artifactName}`,
          uploadUrl: `${getRuntimeUrl()}_apis/resources/Containers/13`
        }
        const returnData: string = JSON.stringify(response, null, 2)
        mockReadBody = async function(): Promise<string> {
          return new Promise(resolve => {
            resolve(returnData)
          })
        }
      }
      return new Promise<HttpClientResponse>(resolve => {
        resolve({
          message: mockMessage,
          readBody: mockReadBody
        })
      })
    })
  }
})
