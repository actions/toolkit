import * as http from 'http'
import * as net from 'net'
import * as uploadHttpClient from '../src/upload-artifact-http-client'
import {getRuntimeUrl} from '../src/env-variables'
import {HttpClient, HttpClientResponse} from '@actions/http-client/index'
import {
  CreateArtifactResponse,
  PatchArtifactSizeSuccessResponse
} from '../src/contracts'

// mock env variables that will not always be available along with certain http methods
jest.mock('../src/env-variables')
jest.mock('@actions/http-client')

describe('Upload Tests', () => {
  // setup mocking for HTTP calls
  beforeAll(() => {
    mockHttpPostCall()
    mockHttpPatchCall()
  })

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
        'Non 201 status code when creating file container for new artifact'
      )
    )
  })

  it('Associate Artifact - Success', async () => {
    expect(async () => {
      await uploadHttpClient.patchArtifactSize(130, 'my-artifact')
    }).not.toThrow()
  })

  it('Associate Artifact - Not Found', async () => {
    await expect(
      uploadHttpClient.patchArtifactSize(100, 'non-existent-artifact')
    ).rejects.toThrow(
      'An Artifact with the name non-existent-artifact was not found'
    )
  })

  it('Associate Artifact - Error', async () => {
    await expect(
      uploadHttpClient.patchArtifactSize(-2, 'my-artifact')
    ).rejects.toThrow('Unable to finish uploading artifact my-artifact')
  })

  async function mockReadBodyEmpty(): Promise<string> {
    return new Promise(resolve => {
      resolve()
    })
  }

  /**
   * Mocks http post calls that are made when first creating a container for an artifact
   */
  function mockHttpPostCall(): void {
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

  /**
   * Mocks http patch calls that are made at the very end of the artifact upload process to update the size
   */
  function mockHttpPatchCall(): void {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    HttpClient.prototype.patch = jest.fn(async (requestdata, data) => {
      const inputData = JSON.parse(data)
      const mockMessage = new http.IncomingMessage(new net.Socket())
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
