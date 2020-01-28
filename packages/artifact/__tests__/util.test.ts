import * as utils from '../src/utils'
import {HttpCodes} from '@actions/http-client'

describe('utils', () => {
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

  it('Test constructing artifact URL', () => {
    const runtimeUrl = 'https://pipelines.actions.githubusercontent.com/abcd/'
    const runId = '15'
    const artifactUrl = utils.getArtifactUrl(runtimeUrl, runId)
    expect(artifactUrl).toEqual(
      `${runtimeUrl}_apis/pipelines/workflows/${runId}/artifacts?api-version=${utils.getApiVerion()}`
    )
  })

  it('Test constucting headers with all optional parametesr', () => {
    const type = 'application/json'
    const size = 24
    const range = 'bytes 0-199/200'
    const options = utils.getRequestOptions(type, type, size, range)
    expect(Object.keys(options).length).toEqual(4)
    expect(options['Accept']).toEqual(
      `${type};api-version=${utils.getApiVerion()}`
    )
    expect(options['Content-Type']).toEqual(type)
    expect(options['Content-Length']).toEqual(size)
    expect(options['Content-Range']).toEqual(range)
  })

  it('Test constucting headers with only required parameter', () => {
    const type = 'application/json'
    const options = utils.getRequestOptions(type)
    expect(Object.keys(options).length).toEqual(1)
    expect(options['Accept']).toEqual(
      `${type};api-version=${utils.getApiVerion()}`
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
    expect(utils.isRetryableStatusCode(HttpCodes.OK)).toEqual(false)
    expect(utils.isRetryableStatusCode(HttpCodes.NotFound)).toEqual(false)
    expect(utils.isRetryableStatusCode(HttpCodes.Forbidden)).toEqual(false)
  })
})
