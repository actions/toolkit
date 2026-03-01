import {signingEndpoints} from '../src/endpoints'

describe('signingEndpoints', () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = originalEnv
  })

  describe('when using github.com', () => {
    beforeEach(async () => {
      process.env = {
        ...originalEnv,
        GITHUB_SERVER_URL: 'https://github.com'
      }
    })

    it('returns expected endpoints', async () => {
      const endpoints = signingEndpoints('github')

      expect(endpoints.fulcioURL).toEqual('https://fulcio.githubapp.com')
      expect(endpoints.tsaServerURL).toEqual('https://timestamp.githubapp.com')
    })
  })

  describe('when using custom domain', () => {
    beforeEach(async () => {
      process.env = {
        ...originalEnv,
        GITHUB_SERVER_URL: 'https://foo.bar.com'
      }
    })

    it('returns a expected endpoints', async () => {
      const endpoints = signingEndpoints('github')

      expect(endpoints.fulcioURL).toEqual('https://fulcio.foo.bar.com')
      expect(endpoints.tsaServerURL).toEqual('https://timestamp.foo.bar.com')
    })
  })
})
