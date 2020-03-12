import * as core from '@actions/core'
import * as http from 'http'
import * as io from '../../io/src/io'
import * as net from 'net'
import * as path from 'path'
import * as configVariables from '../src/internal/config-variables'
import {HttpClient, HttpClientResponse} from '@actions/http-client'
import {DownloadHttpClient} from '../src/internal/download-http-client'
import {
  ListArtifactsResponse,
  QueryArtifactResponse
} from '../src/internal/contracts'

const root = path.join(__dirname, '_temp', 'artifact-download')

jest.mock('../src/internal/config-variables')
jest.mock('@actions/http-client')

describe('Download Tests', () => {
  beforeAll(async () => {
    await io.rmRF(root)

    // mock all output so that there is less noise when running tests
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(core, 'debug').mockImplementation(() => {})
    jest.spyOn(core, 'info').mockImplementation(() => {})
    jest.spyOn(core, 'warning').mockImplementation(() => {})
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
      'Unable to list artifacts for the run'
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
      `Unable to get ContainersItems from ${configVariables.getRuntimeUrl()}`
    )
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
      mockMessage.statusCode = 500
      return new Promise<HttpClientResponse>(resolve => {
        resolve({
          message: mockMessage,
          readBody: emptyMockReadBody
        })
      })
    })
  }
})
