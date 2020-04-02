import * as fs from 'fs'
import * as io from '../../io/src/io'
import * as path from 'path'
import * as utils from '../src/internal/utils'
import * as core from '@actions/core'
import {HttpCodes} from '@actions/http-client'
import {
  getRuntimeUrl,
  getWorkFlowRunId,
  getInitialRetryIntervalInMilliseconds,
  getRetryMultiplier
} from '../src/internal/config-variables'

jest.mock('../src/internal/config-variables')

describe('Utils', () => {
  beforeAll(() => {
    // mock all output so that there is less noise when running tests
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(core, 'debug').mockImplementation(() => {})
    jest.spyOn(core, 'info').mockImplementation(() => {})
    jest.spyOn(core, 'warning').mockImplementation(() => {})
  })

  it('Check exponential retry range', () => {
    // No retries should return the initial retry interval
    const retryWaitTime0 = utils.getExponentialRetryTimeInMilliseconds(0)
    expect(retryWaitTime0).toEqual(getInitialRetryIntervalInMilliseconds())

    const testMinMaxRange = (retryCount: number): void => {
      const retryWaitTime = utils.getExponentialRetryTimeInMilliseconds(
        retryCount
      )
      const minRange =
        getInitialRetryIntervalInMilliseconds() *
        getRetryMultiplier() *
        retryCount
      const maxRange = minRange * getRetryMultiplier()

      expect(retryWaitTime).toBeGreaterThanOrEqual(minRange)
      expect(retryWaitTime).toBeLessThan(maxRange)
    }

    for (let i = 1; i < 10; i++) {
      testMinMaxRange(i)
    }
  })

  it('Check Artifact Name for any invalid characters', () => {
    const invalidNames = [
      'my\\artifact',
      'my/artifact',
      'my"artifact',
      'my:artifact',
      'my<artifact',
      'my>artifact',
      'my|artifact',
      'my*artifact',
      'my?artifact',
      'my artifact',
      ''
    ]
    for (const invalidName of invalidNames) {
      expect(() => {
        utils.checkArtifactName(invalidName)
      }).toThrow()
    }

    const validNames = [
      'my-normal-artifact',
      'myNormalArtifact',
      'm¥ñðrmålÄr†ï£å¢†'
    ]
    for (const validName of validNames) {
      expect(() => {
        utils.checkArtifactName(validName)
      }).not.toThrow()
    }
  })

  it('Check Artifact File Path for any invalid characters', () => {
    const invalidNames = [
      'some/invalid"artifact/path',
      'some/invalid:artifact/path',
      'some/invalid<artifact/path',
      'some/invalid>artifact/path',
      'some/invalid|artifact/path',
      'some/invalid*artifact/path',
      'some/invalid?artifact/path',
      'some/invalid artifact/path',
      ''
    ]
    for (const invalidName of invalidNames) {
      expect(() => {
        utils.checkArtifactFilePath(invalidName)
      }).toThrow()
    }

    const validNames = [
      'my/perfectly-normal/artifact-path',
      'my/perfectly\\Normal/Artifact-path',
      'm¥/ñðrmål/Är†ï£å¢†'
    ]
    for (const validName of validNames) {
      expect(() => {
        utils.checkArtifactFilePath(validName)
      }).not.toThrow()
    }
  })

  it('Test constructing artifact URL', () => {
    const runtimeUrl = getRuntimeUrl()
    const runId = getWorkFlowRunId()
    const artifactUrl = utils.getArtifactUrl()
    expect(artifactUrl).toEqual(
      `${runtimeUrl}_apis/pipelines/workflows/${runId}/artifacts?api-version=${utils.getApiVersion()}`
    )
  })

  it('Test constructing headers with all optional parameters', () => {
    const acceptType = 'application/json'
    const contentType = 'application/octet-stream'
    const size = 24
    const uncompressedLength = 100
    const range = 'bytes 0-199/200'
    const options = utils.getRequestOptions(
      acceptType,
      contentType,
      true,
      true,
      uncompressedLength,
      size,
      range
    )
    expect(Object.keys(options).length).toEqual(9)
    expect(options['Accept-Encoding']).toEqual('gzip')
    expect(options['Accept']).toEqual(
      `${acceptType};api-version=${utils.getApiVersion()}`
    )
    expect(options['Content-Type']).toEqual(contentType)
    expect(options['Connection']).toEqual('Keep-Alive')
    expect(options['Keep-Alive']).toEqual('10')
    expect(options['Content-Encoding']).toEqual('gzip')
    expect(options['x-tfs-filelength']).toEqual(uncompressedLength)
    expect(options['Content-Length']).toEqual(size)
    expect(options['Content-Range']).toEqual(range)
  })

  it('Test constructing headers with only required parameter', () => {
    const options = utils.getRequestOptions('application/json')
    expect(Object.keys(options).length).toEqual(3)
    expect(options['Accept']).toEqual(
      `application/json;api-version=${utils.getApiVersion()}`
    )
    expect(options['Accept-Encoding']).toEqual('gzip')
    expect(options['Content-Type']).toEqual('application/json')
  })

  it('Test Success Status Code', () => {
    expect(utils.isSuccessStatusCode(HttpCodes.OK)).toEqual(true)
    expect(utils.isSuccessStatusCode(201)).toEqual(true)
    expect(utils.isSuccessStatusCode(299)).toEqual(true)
    expect(utils.isSuccessStatusCode(HttpCodes.NotFound)).toEqual(false)
    expect(utils.isSuccessStatusCode(HttpCodes.BadGateway)).toEqual(false)
    expect(utils.isSuccessStatusCode(HttpCodes.Forbidden)).toEqual(false)
  })

  it('Test Retry Status Code', () => {
    expect(utils.isRetryableStatusCode(HttpCodes.BadGateway)).toEqual(true)
    expect(utils.isRetryableStatusCode(HttpCodes.ServiceUnavailable)).toEqual(
      true
    )
    expect(utils.isRetryableStatusCode(HttpCodes.GatewayTimeout)).toEqual(true)
    expect(utils.isRetryableStatusCode(HttpCodes.OK)).toEqual(false)
    expect(utils.isRetryableStatusCode(HttpCodes.NotFound)).toEqual(false)
    expect(utils.isRetryableStatusCode(HttpCodes.Forbidden)).toEqual(false)
  })

  it('Test Throttled Status Code', () => {
    expect(utils.isThrottledStatusCode(429)).toEqual(true)
    expect(utils.isThrottledStatusCode(HttpCodes.InternalServerError)).toEqual(
      false
    )
    expect(utils.isThrottledStatusCode(HttpCodes.BadGateway)).toEqual(false)
    expect(utils.isThrottledStatusCode(HttpCodes.ServiceUnavailable)).toEqual(
      false
    )
  })

  it('Test Creating Artifact Directories', async () => {
    const root = path.join(__dirname, '_temp', 'artifact-download')
    // remove directory before starting
    await io.rmRF(root)

    const directory1 = path.join(root, 'folder2', 'folder3')
    const directory2 = path.join(directory1, 'folder1')

    // Initially should not exist
    expect(fs.existsSync(directory1)).toEqual(false)
    expect(fs.existsSync(directory2)).toEqual(false)
    const directoryStructure = [directory1, directory2]
    await utils.createDirectoriesForArtifact(directoryStructure)
    // directories should now be created
    expect(fs.existsSync(directory1)).toEqual(true)
    expect(fs.existsSync(directory2)).toEqual(true)
  })
})
