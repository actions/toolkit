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

  it('Test constructing upload headers with all optional parameters', () => {
    const contentType = 'application/octet-stream'
    const size = 24
    const uncompressedLength = 100
    const range = 'bytes 0-199/200'
    const options = utils.getUploadHeaders(
      contentType,
      true,
      true,
      uncompressedLength,
      size,
      range
    )
    expect(Object.keys(options).length).toEqual(8)
    expect(options['Accept']).toEqual(
      `application/json;api-version=${utils.getApiVersion()}`
    )
    expect(options['Content-Type']).toEqual(contentType)
    expect(options['Connection']).toEqual('Keep-Alive')
    expect(options['Keep-Alive']).toEqual('10')
    expect(options['Content-Encoding']).toEqual('gzip')
    expect(options['x-tfs-filelength']).toEqual(uncompressedLength)
    expect(options['Content-Length']).toEqual(size)
    expect(options['Content-Range']).toEqual(range)
  })

  it('Test constructing upload headers with only required parameter', () => {
    const options = utils.getUploadHeaders('application/octet-stream')
    expect(Object.keys(options).length).toEqual(2)
    expect(options['Accept']).toEqual(
      `application/json;api-version=${utils.getApiVersion()}`
    )
    expect(options['Content-Type']).toEqual('application/octet-stream')
  })

  it('Test constructing download headers with all optional parameters', () => {
    const contentType = 'application/json'
    const options = utils.getDownloadHeaders(contentType, true, true)
    expect(Object.keys(options).length).toEqual(5)
    expect(options['Content-Type']).toEqual(contentType)
    expect(options['Connection']).toEqual('Keep-Alive')
    expect(options['Keep-Alive']).toEqual('10')
    expect(options['Accept-Encoding']).toEqual('gzip')
    expect(options['Accept']).toEqual(
      `application/octet-stream;api-version=${utils.getApiVersion()}`
    )
  })

  it('Test constructing download headers with only required parameter', () => {
    const options = utils.getDownloadHeaders('application/octet-stream')
    expect(Object.keys(options).length).toEqual(2)
    expect(options['Content-Type']).toEqual('application/octet-stream')
    // check for default accept type
    expect(options['Accept']).toEqual(
      `application/json;api-version=${utils.getApiVersion()}`
    )
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
    expect(utils.isRetryableStatusCode(HttpCodes.TooManyRequests)).toEqual(true)
    expect(utils.isRetryableStatusCode(HttpCodes.OK)).toEqual(false)
    expect(utils.isRetryableStatusCode(HttpCodes.NotFound)).toEqual(false)
    expect(utils.isRetryableStatusCode(HttpCodes.Forbidden)).toEqual(false)
  })

  it('Test Throttled Status Code', () => {
    expect(utils.isThrottledStatusCode(HttpCodes.TooManyRequests)).toEqual(true)
    expect(utils.isThrottledStatusCode(HttpCodes.InternalServerError)).toEqual(
      false
    )
    expect(utils.isThrottledStatusCode(HttpCodes.BadGateway)).toEqual(false)
    expect(utils.isThrottledStatusCode(HttpCodes.ServiceUnavailable)).toEqual(
      false
    )
  })

  it('Test Forbidden Status Code', () => {
    expect(utils.isForbiddenStatusCode(HttpCodes.Forbidden)).toEqual(true)
    expect(utils.isForbiddenStatusCode(HttpCodes.InternalServerError)).toEqual(
      false
    )
    expect(utils.isForbiddenStatusCode(HttpCodes.TooManyRequests)).toEqual(
      false
    )
    expect(utils.isForbiddenStatusCode(HttpCodes.OK)).toEqual(false)
  })

  it('Test Creating Artifact Directories', async () => {
    const root = path.join(__dirname, '_temp', 'artifact-download')
    // remove directory before starting
    await io.rmRF(root)

    const directory1 = path.join(root, 'folder2', 'folder3')
    const directory2 = path.join(directory1, 'folder1')

    // Initially should not exist
    await expect(fs.promises.access(directory1)).rejects.not.toBeUndefined()
    await expect(fs.promises.access(directory2)).rejects.not.toBeUndefined()
    const directoryStructure = [directory1, directory2]
    await utils.createDirectoriesForArtifact(directoryStructure)
    // directories should now be created
    await expect(fs.promises.access(directory1)).resolves.toEqual(undefined)
    await expect(fs.promises.access(directory2)).resolves.toEqual(undefined)
  })

  it('Test Creating Empty Files', async () => {
    const root = path.join(__dirname, '_temp', 'empty-files')
    await io.rmRF(root)

    const emptyFile1 = path.join(root, 'emptyFile1')
    const directoryToCreate = path.join(root, 'folder1')
    const emptyFile2 = path.join(directoryToCreate, 'emptyFile2')

    // empty files should only be created after the directory structure is fully setup
    // ensure they are first created by using the createDirectoriesForArtifact method
    const directoryStructure = [root, directoryToCreate]
    await utils.createDirectoriesForArtifact(directoryStructure)
    await expect(fs.promises.access(root)).resolves.toEqual(undefined)
    await expect(fs.promises.access(directoryToCreate)).resolves.toEqual(
      undefined
    )

    await expect(fs.promises.access(emptyFile1)).rejects.not.toBeUndefined()
    await expect(fs.promises.access(emptyFile2)).rejects.not.toBeUndefined()

    const emptyFilesToCreate = [emptyFile1, emptyFile2]
    await utils.createEmptyFilesForArtifact(emptyFilesToCreate)

    await expect(fs.promises.access(emptyFile1)).resolves.toEqual(undefined)
    const size1 = (await fs.promises.stat(emptyFile1)).size
    expect(size1).toEqual(0)
    await expect(fs.promises.access(emptyFile2)).resolves.toEqual(undefined)
    const size2 = (await fs.promises.stat(emptyFile2)).size
    expect(size2).toEqual(0)
  })
})
