import {ArtifactHttpClient} from '../src/internal/shared/artifact-twirp-client'
import {setSecret} from '@actions/core'
import {CreateArtifactResponse} from '../src/generated/results/api/v1/artifact'

jest.mock('@actions/core', () => ({
  setSecret: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}))

describe('ArtifactHttpClient', () => {
  let client: ArtifactHttpClient

  beforeEach(() => {
    jest.clearAllMocks()
    process.env['ACTIONS_RUNTIME_TOKEN'] = 'test-token'
    process.env['ACTIONS_RESULTS_URL'] = 'https://example.com'
    client = new ArtifactHttpClient('test-agent')
  })

  afterEach(() => {
    delete process.env['ACTIONS_RUNTIME_TOKEN']
    delete process.env['ACTIONS_RESULTS_URL']
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
      const response = {
        ok: true,
        signed_upload_url:
          'https://example.com/upload?se=2025-03-05T16%3A47%3A23Z&sig=secret-token'
      }

      client.maskSecretUrls(response)

      expect(spy).toHaveBeenCalledWith(
        'https://example.com/upload?se=2025-03-05T16%3A47%3A23Z&sig=secret-token'
      )
    })

    it('should mask signed_download_url', () => {
      const spy = jest.spyOn(client, 'maskSigUrl')
      const response = {
        signed_url:
          'https://example.com/download?se=2025-03-05T16%3A47%3A23Z&sig=secret-token'
      }

      client.maskSecretUrls(response)

      expect(spy).toHaveBeenCalledWith(
        'https://example.com/download?se=2025-03-05T16%3A47%3A23Z&sig=secret-token'
      )
    })

    it('should not call maskSigUrl if URLs are missing', () => {
      const spy = jest.spyOn(client, 'maskSigUrl')
      const response = {} as CreateArtifactResponse

      client.maskSecretUrls(response)

      expect(spy).not.toHaveBeenCalled()
    })

    it('should handle both URL types when present', () => {
      const spy = jest.spyOn(client, 'maskSigUrl')
      const response = {
        signed_upload_url: 'https://example.com/upload?sig=secret-token1',
        signed_url: 'https://example.com/download?sig=secret-token2'
      }

      client.maskSecretUrls(response)

      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenCalledWith(
        'https://example.com/upload?sig=secret-token1'
      )
      expect(spy).toHaveBeenCalledWith(
        'https://example.com/download?sig=secret-token2'
      )
    })
  })
})
