import {ArtifactHttpClient} from '../src/internal/shared/artifact-twirp-client'
import {setSecret, debug} from '@actions/core'
import {
  CreateArtifactResponse,
  GetSignedArtifactURLResponse
} from '../src/generated/results/api/v1/artifact'

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

  describe('maskSecretUrls', () => {
    it('should mask signed_upload_url', () => {
      const response: CreateArtifactResponse = {
        ok: true,
        signedUploadUrl:
          'https://example.com/upload?se=2025-03-05T16%3A47%3A23Z&sig=secret-token'
      }

      client.maskSecretUrls(response)

      expect(setSecret).toHaveBeenCalledWith('secret-token')
      expect(debug).toHaveBeenCalledWith(
        'Masked signed_upload_url: https://example.com/upload?se=2025-03-05T16%3A47%3A23Z&sig=***'
      )
    })

    it('should mask signed_download_url', () => {
      const response: GetSignedArtifactURLResponse = {
        signedUrl:
          'https://example.com/download?se=2025-03-05T16%3A47%3A23Z&sig=secret-token'
      }

      client.maskSecretUrls(response)

      expect(setSecret).toHaveBeenCalledWith('secret-token')
      expect(debug).toHaveBeenCalledWith(
        'Masked signed_url: https://example.com/download?se=2025-03-05T16%3A47%3A23Z&sig=***'
      )
    })

    it('should not call setSecret if URLs are missing', () => {
      const response = {} as CreateArtifactResponse

      client.maskSecretUrls(response)

      expect(setSecret).not.toHaveBeenCalled()
    })

    it('should mask only the sensitive token part of signed_upload_url', () => {
      const response: CreateArtifactResponse = {
        ok: true,
        signedUploadUrl:
          'https://example.com/upload?se=2025-03-05T16%3A47%3A23Z&sig=secret-token'
      }

      client.maskSecretUrls(response)

      expect(setSecret).toHaveBeenCalledWith('secret-token')
      expect(debug).toHaveBeenCalledWith(
        'Masked signed_upload_url: https://example.com/upload?se=2025-03-05T16%3A47%3A23Z&sig=***'
      )
    })

    it('should mask only the sensitive token part of signed_download_url', () => {
      const response: GetSignedArtifactURLResponse = {
        signedUrl:
          'https://example.com/download?se=2025-03-05T16%3A47%3A23Z&sig=secret-token'
      }

      client.maskSecretUrls(response)

      expect(setSecret).toHaveBeenCalledWith('secret-token')
      expect(debug).toHaveBeenCalledWith(
        'Masked signed_url: https://example.com/download?se=2025-03-05T16%3A47%3A23Z&sig=***'
      )
    })
  })
})
