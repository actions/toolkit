import {
  CreateCacheEntryResponse,
  GetCacheEntryDownloadURLResponse
} from '../src/generated/results/api/v1/cache'
import {CacheServiceClient} from '../src/internal/shared/cacheTwirpClient'
import {setSecret, debug} from '@actions/core'

jest.mock('@actions/core', () => ({
  setSecret: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}))

describe('CacheServiceClient', () => {
  let client: CacheServiceClient

  beforeEach(() => {
    jest.clearAllMocks()
    process.env['ACTIONS_RUNTIME_TOKEN'] = 'test-token' // <-- set the required env variable
    client = new CacheServiceClient('test-agent')
  })

  afterEach(() => {
    delete process.env['ACTIONS_RUNTIME_TOKEN'] // <-- clean up after tests
  })

  describe('maskSecretUrls', () => {
    it('should mask signedUploadUrl', () => {
      const response = {
        ok: true,
        signedUploadUrl:
          'https://example.com/upload?se=2025-03-05T16%3A47%3A23Z&sig=secret-token'
      } as CreateCacheEntryResponse

      client.maskSecretUrls(response)

      expect(setSecret).toHaveBeenCalledWith('secret-token')
      expect(debug).toHaveBeenCalledWith(
        'Masked signedUploadUrl: https://example.com/upload?se=2025-03-05T16%3A47%3A23Z&sig=***'
      )
    })

    it('should mask signedDownloadUrl', () => {
      const response = {
        ok: true,
        signedDownloadUrl:
          'https://example.com/download?se=2025-03-05T16%3A47%3A23Z&sig=secret-token',
        matchedKey: 'cache-key'
      } as GetCacheEntryDownloadURLResponse

      client.maskSecretUrls(response)

      expect(setSecret).toHaveBeenCalledWith('secret-token')
      expect(debug).toHaveBeenCalledWith(
        'Masked signedDownloadUrl: https://example.com/download?se=2025-03-05T16%3A47%3A23Z&sig=***'
      )
    })

    it('should not call setSecret if URLs are missing', () => {
      const response = {ok: true} as CreateCacheEntryResponse

      client.maskSecretUrls(response)

      expect(setSecret).not.toHaveBeenCalled()
    })

    it('should mask only the sensitive token part of signedUploadUrl', () => {
      const response = {
        ok: true,
        signedUploadUrl:
          'https://example.com/upload?se=2025-03-05T16%3A47%3A23Z&sig=secret-token'
      } as CreateCacheEntryResponse

      client.maskSecretUrls(response)

      expect(setSecret).toHaveBeenCalledWith('secret-token')
      expect(debug).toHaveBeenCalledWith(
        'Masked signedUploadUrl: https://example.com/upload?se=2025-03-05T16%3A47%3A23Z&sig=***'
      )
    })

    it('should mask only the sensitive token part of signedDownloadUrl', () => {
      const response = {
        ok: true,
        signedDownloadUrl:
          'https://example.com/download?se=2025-03-05T16%3A47%3A23Z&sig=secret-token',
        matchedKey: 'cache-key'
      } as GetCacheEntryDownloadURLResponse

      client.maskSecretUrls(response)

      expect(setSecret).toHaveBeenCalledWith('secret-token')
      expect(debug).toHaveBeenCalledWith(
        'Masked signedDownloadUrl: https://example.com/download?se=2025-03-05T16%3A47%3A23Z&sig=***'
      )
    })
  })
})
