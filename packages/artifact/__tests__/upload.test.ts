import * as http from 'http'
import * as io from '../../io/src/io'
import * as net from 'net'
import * as path from 'path'
import {mocked} from 'ts-jest/utils'
import {exec, execSync} from 'child_process'
import {createGunzip} from 'zlib'
import {promisify} from 'util'
import {UploadHttpClient} from '../src/internal/upload-http-client'
import * as core from '@actions/core'
import {promises as fs} from 'fs'
import {getRuntimeUrl} from '../src/internal/config-variables'
import {HttpClient, HttpClientResponse} from '@actions/http-client'
import {
  ArtifactResponse,
  PatchArtifactSizeSuccessResponse
} from '../src/internal/contracts'
import {UploadSpecification} from '../src/internal/upload-specification'
import {getArtifactUrl} from '../src/internal/utils'
import {UploadOptions} from '../src/internal/upload-options'

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

jest.mock('../src/internal/config-variables')
jest.mock('@actions/http-client')

describe('Upload Tests', () => {
  beforeAll(async () => {
    // mock all output so that there is less noise when running tests
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(core, 'debug').mockImplementation(() => {})
    jest.spyOn(core, 'info').mockImplementation(() => {})
    jest.spyOn(core, 'warning').mockImplementation(() => {})
    jest.spyOn(core, 'error').mockImplementation(() => {})

    // setup mocking for calls that got through the HttpClient
    setupHttpClientMock()

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
      Directory structure for files that get created:
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

  /**
   * Artifact Creation Tests
   */
  it('Create Artifact - Success', async () => {
    const artifactName = 'valid-artifact-name'
    const uploadHttpClient = new UploadHttpClient()
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
    const uploadHttpClient = new UploadHttpClient()
    expect(
      uploadHttpClient.createArtifactInFileContainer(artifactName)
    ).rejects.toEqual(
      new Error(
        `Create Artifact Container failed: The artifact name invalid-artifact-name is not valid. Request URL ${getArtifactUrl()}`
      )
    )
  })

  it('Create Artifact - Retention Less Than Min Value Error', async () => {
    const artifactName = 'valid-artifact-name'
    const options: UploadOptions = {
      retentionDays: -1
    }
    const uploadHttpClient = new UploadHttpClient()
    expect(
      uploadHttpClient.createArtifactInFileContainer(artifactName, options)
    ).rejects.toEqual(new Error('Invalid retention, minimum value is 1.'))
  })

  it('Create Artifact - Storage Quota Error', async () => {
    const artifactName = 'storage-quota-hit'
    const uploadHttpClient = new UploadHttpClient()
    expect(
      uploadHttpClient.createArtifactInFileContainer(artifactName)
    ).rejects.toEqual(
      new Error(
        'Create Artifact Container failed: Artifact storage quota has been hit. Unable to upload any new artifacts'
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
    const uploadSpecification: UploadSpecification[] = [
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
    const uploadHttpClient = new UploadHttpClient()
    const uploadResult = await uploadHttpClient.uploadArtifactToFileContainer(
      uploadUrl,
      uploadSpecification
    )
    expect(uploadResult.failedItems.length).toEqual(0)
    expect(uploadResult.uploadSize).toEqual(expectedTotalSize)
  })

  function hasMkfifo(): boolean {
    try {
      // make sure we drain the stdout
      return (
        process.platform !== 'win32' &&
        execSync('which mkfifo').toString().length > 0
      )
    } catch (e) {
      return false
    }
  }
  const withMkfifoIt = hasMkfifo() ? it : it.skip
  withMkfifoIt(
    'Upload Artifact with content from named pipe - Success',
    async () => {
      // create a named pipe 'pipe' with content 'hello pipe'
      const content = Buffer.from('hello pipe')
      const pipeFilePath = path.join(root, 'pipe')
      await promisify(exec)('mkfifo pipe', {cwd: root})
      // don't want to await here as that would block until read
      fs.writeFile(pipeFilePath, content)

      const artifactName = 'successful-artifact'
      const uploadSpecification: UploadSpecification[] = [
        {
          absoluteFilePath: pipeFilePath,
          uploadFilePath: `${artifactName}/pipe`
        }
      ]

      const uploadUrl = `${getRuntimeUrl()}_apis/resources/Containers/13`
      const uploadHttpClient = new UploadHttpClient()
      const uploadResult = await uploadHttpClient.uploadArtifactToFileContainer(
        uploadUrl,
        uploadSpecification
      )

      // accesses the ReadableStream that was passed into sendStream
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const stream = mocked(HttpClient.prototype.sendStream).mock.calls[0][2]
      expect(stream).not.toBeNull()
      // decompresses the passed stream
      const data: Buffer[] = []
      for await (const chunk of stream.pipe(createGunzip())) {
        data.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string))
      }
      const uploaded = Buffer.concat(data)

      expect(uploadResult.failedItems.length).toEqual(0)
      expect(uploaded).toEqual(content)
    }
  )

  it('Upload Artifact - Failed Single File Upload', async () => {
    const uploadSpecification: UploadSpecification[] = [
      {
        absoluteFilePath: file1Path,
        uploadFilePath: `this-file-upload-will-fail`
      }
    ]

    const uploadUrl = `${getRuntimeUrl()}_apis/resources/Containers/13`
    const uploadHttpClient = new UploadHttpClient()
    const uploadResult = await uploadHttpClient.uploadArtifactToFileContainer(
      uploadUrl,
      uploadSpecification
    )
    expect(uploadResult.failedItems.length).toEqual(1)
    expect(uploadResult.uploadSize).toEqual(0)
  })

  it('Upload Artifact - Partial Upload Continue On Error', async () => {
    const artifactName = 'partial-artifact'
    const uploadSpecification: UploadSpecification[] = [
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
    const uploadHttpClient = new UploadHttpClient()
    const uploadResult = await uploadHttpClient.uploadArtifactToFileContainer(
      uploadUrl,
      uploadSpecification,
      {continueOnError: true}
    )
    expect(uploadResult.failedItems.length).toEqual(1)
    expect(uploadResult.uploadSize).toEqual(expectedPartialSize)
  })

  it('Upload Artifact - Partial Upload Fail Fast', async () => {
    const artifactName = 'partial-artifact'
    const uploadSpecification: UploadSpecification[] = [
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
    const uploadHttpClient = new UploadHttpClient()
    const uploadResult = await uploadHttpClient.uploadArtifactToFileContainer(
      uploadUrl,
      uploadSpecification,
      {continueOnError: false}
    )
    expect(uploadResult.failedItems.length).toEqual(2)
    expect(uploadResult.uploadSize).toEqual(expectedPartialSize)
  })

  it('Upload Artifact - Failed upload with no options', async () => {
    const artifactName = 'partial-artifact'
    const uploadSpecification: UploadSpecification[] = [
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

    const expectedPartialSize = file1Size + file2Size + file3Size + file5Size
    const uploadUrl = `${getRuntimeUrl()}_apis/resources/Containers/13`
    const uploadHttpClient = new UploadHttpClient()
    const uploadResult = await uploadHttpClient.uploadArtifactToFileContainer(
      uploadUrl,
      uploadSpecification
    )
    expect(uploadResult.failedItems.length).toEqual(1)
    expect(uploadResult.uploadSize).toEqual(expectedPartialSize)
  })

  it('Upload Artifact - Failed upload with empty options', async () => {
    const artifactName = 'partial-artifact'
    const uploadSpecification: UploadSpecification[] = [
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

    const expectedPartialSize = file1Size + file2Size + file3Size + file5Size
    const uploadUrl = `${getRuntimeUrl()}_apis/resources/Containers/13`
    const uploadHttpClient = new UploadHttpClient()
    const uploadResult = await uploadHttpClient.uploadArtifactToFileContainer(
      uploadUrl,
      uploadSpecification,
      {}
    )
    expect(uploadResult.failedItems.length).toEqual(1)
    expect(uploadResult.uploadSize).toEqual(expectedPartialSize)
  })

  /**
   * Artifact Association Tests
   */
  it('Associate Artifact - Success', async () => {
    const uploadHttpClient = new UploadHttpClient()
    expect(async () => {
      uploadHttpClient.patchArtifactSize(130, 'my-artifact')
    }).not.toThrow()
  })

  it('Associate Artifact - Not Found', async () => {
    const uploadHttpClient = new UploadHttpClient()
    expect(
      uploadHttpClient.patchArtifactSize(100, 'non-existent-artifact')
    ).rejects.toThrow(
      'An Artifact with the name non-existent-artifact was not found'
    )
  })

  it('Associate Artifact - Error', async () => {
    const uploadHttpClient = new UploadHttpClient()
    expect(
      uploadHttpClient.patchArtifactSize(-2, 'my-artifact')
    ).rejects.toThrow(
      'Finalize artifact upload failed: Artifact service responded with 400'
    )
  })

  /**
   * Helpers used to setup mocking for the HttpClient
   */
  async function emptyMockReadBody(): Promise<string> {
    return new Promise(resolve => {
      resolve()
    })
  }

  function setupHttpClientMock(): void {
    /**
     * Mocks Post calls that are used during Artifact Creation tests
     *
     * Simulates success and non-success status codes depending on the artifact name along with an appropriate
     * payload that represents an expected response
     */
    jest
      .spyOn(HttpClient.prototype, 'post')
      .mockImplementation(async (requestdata, data) => {
        // parse the input data and use the provided artifact name as part of the response
        const inputData = JSON.parse(data)
        const mockMessage = new http.IncomingMessage(new net.Socket())
        let mockReadBody = emptyMockReadBody

        if (inputData.Name === 'invalid-artifact-name') {
          mockMessage.statusCode = 400
        } else if (inputData.Name === 'storage-quota-hit') {
          mockMessage.statusCode = 403
        } else {
          mockMessage.statusCode = 201
          const response: ArtifactResponse = {
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
      })

    /**
     * Mocks SendStream calls that are made during Artifact Upload tests
     *
     * A 500 response is used to simulate a failed upload stream. The uploadUrl can be set to
     * include 'fail' to specify that the upload should fail
     */
    jest
      .spyOn(HttpClient.prototype, 'sendStream')
      .mockImplementation(async (verb, requestUrl) => {
        const mockMessage = new http.IncomingMessage(new net.Socket())
        mockMessage.statusCode = 200
        if (requestUrl.includes('fail')) {
          mockMessage.statusCode = 500
        }

        return new Promise<HttpClientResponse>(resolve => {
          resolve({
            message: mockMessage,
            readBody: emptyMockReadBody
          })
        })
      })

    /**
     * Mocks Patch calls that are made during Artifact Association tests
     *
     * Simulates success and non-success status codes depending on the input size along with an appropriate
     * payload that represents an expected response
     */
    jest
      .spyOn(HttpClient.prototype, 'patch')
      .mockImplementation(async (requestdata, data) => {
        const inputData = JSON.parse(data)
        const mockMessage = new http.IncomingMessage(new net.Socket())

        // Get the name from the end of requestdata. Will be something like https://www.example.com/_apis/pipelines/workflows/15/artifacts?api-version=6.0-preview&artifactName=my-artifact
        const artifactName = requestdata.split('=')[2]
        let mockReadBody = emptyMockReadBody
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
