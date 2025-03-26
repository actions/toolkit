import * as config from '../src/internal/shared/config'
import * as util from '../src/internal/shared/util'
import {maskSigUrl, maskSecretUrls} from '../src/internal/shared/util'
import {setSecret, debug} from '@actions/core'

export const testRuntimeToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwic2NwIjoiQWN0aW9ucy5FeGFtcGxlIEFjdGlvbnMuQW5vdGhlckV4YW1wbGU6dGVzdCBBY3Rpb25zLlJlc3VsdHM6Y2U3ZjU0YzctNjFjNy00YWFlLTg4N2YtMzBkYTQ3NWY1ZjFhOmNhMzk1MDg1LTA0MGEtNTI2Yi0yY2U4LWJkYzg1ZjY5Mjc3NCIsImlhdCI6MTUxNjIzOTAyMn0.XYnI_wHPBlUi1mqYveJnnkJhp4dlFjqxzRmISPsqfw8'

describe('get-backend-ids-from-token', () => {
  it('should return backend ids when the token is valid', () => {
    jest.spyOn(config, 'getRuntimeToken').mockReturnValue(testRuntimeToken)

    const backendIds = util.getBackendIdsFromToken()
    expect(backendIds.workflowRunBackendId).toBe(
      'ce7f54c7-61c7-4aae-887f-30da475f5f1a'
    )
    expect(backendIds.workflowJobRunBackendId).toBe(
      'ca395085-040a-526b-2ce8-bdc85f692774'
    )
  })

  it("should throw an error when the token doesn't have the right scope", () => {
    jest
      .spyOn(config, 'getRuntimeToken')
      .mockReturnValue(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwic2NwIjoiQWN0aW9ucy5FeGFtcGxlIEFjdGlvbnMuQW5vdGhlckV4YW1wbGU6dGVzdCIsImlhdCI6MTUxNjIzOTAyMn0.K0IEoULZteGevF38G94xiaA8zcZ5UlKWfGfqE6q3dhw'
      )

    expect(util.getBackendIdsFromToken).toThrowError(
      'Failed to get backend IDs: The provided JWT token is invalid'
    )
  })

  it('should throw an error when the token has a malformed scope', () => {
    jest
      .spyOn(config, 'getRuntimeToken')
      .mockReturnValue(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwic2NwIjoiQWN0aW9ucy5FeGFtcGxlIEFjdGlvbnMuQW5vdGhlckV4YW1wbGU6dGVzdCBBY3Rpb25zLlJlc3VsdHM6Y2U3ZjU0YzctNjFjNy00YWFlLTg4N2YtMzBkYTQ3NWY1ZjFhIiwiaWF0IjoxNTE2MjM5MDIyfQ.7D0_LRfRFRZFImHQ7GxH2S6ZyFjjZ5U0ujjGCfle1XE'
      )

    expect(util.getBackendIdsFromToken).toThrowError(
      'Failed to get backend IDs: The provided JWT token is invalid'
    )
  })

  it('should throw an error when the token is in an invalid format', () => {
    jest.spyOn(config, 'getRuntimeToken').mockReturnValue('token')

    expect(util.getBackendIdsFromToken).toThrowError('Invalid token specified')
  })

  it("should throw an error when the token doesn't have the right field", () => {
    jest
      .spyOn(config, 'getRuntimeToken')
      .mockReturnValue(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      )

    expect(util.getBackendIdsFromToken).toThrowError(
      'Failed to get backend IDs: The provided JWT token is invalid'
    )
  })
})

jest.mock('@actions/core')

describe('maskSigUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does nothing if no sig parameter is present', () => {
    const url = 'https://example.com'
    maskSigUrl(url)
    expect(setSecret).not.toHaveBeenCalled()
  })

  it('masks the sig parameter in the middle of the URL and sets it as a secret', () => {
    const url = 'https://example.com/?param1=value1&sig=12345&param2=value2'
    maskSigUrl(url)
    expect(setSecret).toHaveBeenCalledWith('12345')
    expect(setSecret).toHaveBeenCalledWith(encodeURIComponent('12345'))
  })

  it('does nothing if the URL is empty', () => {
    const url = ''
    maskSigUrl(url)
    expect(setSecret).not.toHaveBeenCalled()
  })

  it('handles URLs with fragments', () => {
    const url = 'https://example.com?sig=12345#fragment'
    maskSigUrl(url)
    expect(setSecret).toHaveBeenCalledWith('12345')
    expect(setSecret).toHaveBeenCalledWith(encodeURIComponent('12345'))
  })
})

describe('maskSigUrl handles special characters in signatures', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('handles signatures with slashes', () => {
    const url = 'https://example.com/?sig=abc/123'
    maskSigUrl(url)
    expect(setSecret).toHaveBeenCalledWith('abc/123')
    expect(setSecret).toHaveBeenCalledWith('abc%2F123')
  })

  it('handles signatures with plus signs', () => {
    const url = 'https://example.com/?sig=abc+123'
    maskSigUrl(url)
    expect(setSecret).toHaveBeenCalledWith('abc 123')
    expect(setSecret).toHaveBeenCalledWith('abc%20123')
  })

  it('handles signatures with equals signs', () => {
    const url = 'https://example.com/?sig=abc=123'
    maskSigUrl(url)
    expect(setSecret).toHaveBeenCalledWith('abc=123')
    expect(setSecret).toHaveBeenCalledWith('abc%3D123')
  })

  it('handles already percent-encoded signatures', () => {
    const url = 'https://example.com/?sig=abc%2F123%3D'
    maskSigUrl(url)
    expect(setSecret).toHaveBeenCalledWith('abc/123=')
    expect(setSecret).toHaveBeenCalledWith('abc%2F123%3D')
  })

  it('handles complex Azure SAS signatures', () => {
    const url =
      'https://example.com/container/file.txt?sig=nXyQIUj%2F%2F06Cxt80pBRYiiJlYqtPYg5sz%2FvEh5iHAhw%3D&se=2023-12-31'
    maskSigUrl(url)
    expect(setSecret).toHaveBeenCalledWith(
      'nXyQIUj//06Cxt80pBRYiiJlYqtPYg5sz/vEh5iHAhw='
    )
    expect(setSecret).toHaveBeenCalledWith(
      'nXyQIUj%2F%2F06Cxt80pBRYiiJlYqtPYg5sz%2FvEh5iHAhw%3D'
    )
  })

  it('handles signatures with multiple special characters', () => {
    const url = 'https://example.com/?sig=a/b+c=d&e=f'
    maskSigUrl(url)
    expect(setSecret).toHaveBeenCalledWith('a/b c=d')
    expect(setSecret).toHaveBeenCalledWith('a%2Fb%20c%3Dd')
  })
})

describe('maskSecretUrls', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('masks sig parameters in signed_upload_url and signed_url', () => {
    const body = {
      signed_upload_url: 'https://upload.com?sig=upload123',
      signed_url: 'https://download.com?sig=download123'
    }
    maskSecretUrls(body)
    expect(setSecret).toHaveBeenCalledWith('upload123')
    expect(setSecret).toHaveBeenCalledWith(encodeURIComponent('upload123'))
    expect(setSecret).toHaveBeenCalledWith('download123')
    expect(setSecret).toHaveBeenCalledWith(encodeURIComponent('download123'))
  })

  it('handles case where only upload_url is present', () => {
    const body = {
      signed_upload_url: 'https://upload.com?sig=upload123'
    }
    maskSecretUrls(body)
    expect(setSecret).toHaveBeenCalledWith('upload123')
    expect(setSecret).toHaveBeenCalledWith(encodeURIComponent('upload123'))
  })

  it('handles case where only download_url is present', () => {
    const body = {
      signed_url: 'https://download.com?sig=download123'
    }
    maskSecretUrls(body)
    expect(setSecret).toHaveBeenCalledWith('download123')
    expect(setSecret).toHaveBeenCalledWith(encodeURIComponent('download123'))
  })

  it('handles case where URLs do not contain sig parameters', () => {
    const body = {
      signed_upload_url: 'https://upload.com?token=abc',
      signed_url: 'https://download.com?token=xyz'
    }
    maskSecretUrls(body)
    expect(setSecret).not.toHaveBeenCalled()
  })

  it('handles empty string URLs', () => {
    const body = {
      signed_upload_url: '',
      signed_url: ''
    }
    maskSecretUrls(body)
    expect(setSecret).not.toHaveBeenCalled()
  })

  it('does nothing if body is not an object or is null', () => {
    maskSecretUrls(null)
    expect(debug).toHaveBeenCalledWith('body is not an object or is null')
    expect(setSecret).not.toHaveBeenCalled()
  })

  it('does nothing if signed_upload_url and signed_url are not strings', () => {
    const body = {
      signed_upload_url: 123,
      signed_url: 456
    }
    maskSecretUrls(body)
    expect(setSecret).not.toHaveBeenCalled()
  })
})
