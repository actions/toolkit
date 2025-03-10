import {CacheServiceClient} from '../src/internal/shared/cacheTwirpClient'
import {setSecret} from '@actions/core'

jest.mock('@actions/core', () => ({
  setSecret: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}))

describe('CacheServiceClient', () => {
  let client: CacheServiceClient

  beforeEach(() => {
    jest.clearAllMocks()
    process.env['ACTIONS_RUNTIME_TOKEN'] = 'test-token'
    client = new CacheServiceClient('test-agent')
  })

  afterEach(() => {
    delete process.env['ACTIONS_RUNTIME_TOKEN']
  })

  describe('maskSigUrl', () => {
    it('should mask the sig parameter and set it as a secret', () => {
      const url =
        'https://example.com/upload?se=2025-03-05T16%3A47%3A23Z&sig=secret-token'

      const maskedUrl = client.maskSigUrl(url)

      expect(setSecret).toHaveBeenCalledWith('secret-token')
      expect(maskedUrl).toBe(
        'https://example.com/upload?se=2025-03-05T16%3A47%3A23Z&sig=***'
      )
    })

    it('should return the original URL if no sig parameter is found', () => {
      const url = 'https://example.com/upload?se=2025-03-05T16%3A47%3A23Z'

      const maskedUrl = client.maskSigUrl(url)

      expect(setSecret).not.toHaveBeenCalled()
      expect(maskedUrl).toBe(url)
    })

    it('should handle sig parameter at the end of the URL', () => {
      const url = 'https://example.com/upload?param1=value&sig=secret-token'

      const maskedUrl = client.maskSigUrl(url)

      expect(setSecret).toHaveBeenCalledWith('secret-token')
      expect(maskedUrl).toBe('https://example.com/upload?param1=value&sig=***')
    })

    it('should handle sig parameter in the middle of the URL', () => {
      const url = 'https://example.com/upload?sig=secret-token&param2=value'

      const maskedUrl = client.maskSigUrl(url)

      expect(setSecret).toHaveBeenCalledWith('secret-token&param2=value')
      expect(maskedUrl).toBe('https://example.com/upload?sig=***')
    })
  })

  describe('maskSecretUrls', () => {
    it('should mask signed_upload_url', () => {
      const spy = jest.spyOn(client, 'maskSigUrl')
      const body = {
        signed_upload_url: 'https://example.com/upload?sig=secret-token',
        key: 'test-key',
        version: 'test-version'
      }

      client.maskSecretUrls(body)

      expect(spy).toHaveBeenCalledWith(
        'https://example.com/upload?sig=secret-token'
      )
    })

    it('should mask signed_download_url', () => {
      const spy = jest.spyOn(client, 'maskSigUrl')
      const body = {
        signed_download_url: 'https://example.com/download?sig=secret-token',
        key: 'test-key',
        version: 'test-version'
      }

      client.maskSecretUrls(body)

      expect(spy).toHaveBeenCalledWith(
        'https://example.com/download?sig=secret-token'
      )
    })

    it('should mask both URLs when both are present', () => {
      const spy = jest.spyOn(client, 'maskSigUrl')
      const body = {
        signed_upload_url: 'https://example.com/upload?sig=secret-token1',
        signed_download_url: 'https://example.com/download?sig=secret-token2'
      }

      client.maskSecretUrls(body)

      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenCalledWith(
        'https://example.com/upload?sig=secret-token1'
      )
      expect(spy).toHaveBeenCalledWith(
        'https://example.com/download?sig=secret-token2'
      )
    })

    it('should not call maskSigUrl when URLs are missing', () => {
      const spy = jest.spyOn(client, 'maskSigUrl')
      const body = {
        key: 'test-key',
        version: 'test-version'
      }

      client.maskSecretUrls(body)

      expect(spy).not.toHaveBeenCalled()
    })
  })
})
