import {mockFulcio, mockRekor, mockTSA} from '@sigstore/mock'
import nock from 'nock'
import {Payload, signPayload} from '../src/sign'

describe('signProvenance', () => {
  const originalEnv = process.env

  // Fake an OIDC token
  const subject = 'foo@bar.com'
  const oidcPayload = {sub: subject, iss: ''}
  const oidcToken = `.${Buffer.from(JSON.stringify(oidcPayload)).toString(
    'base64'
  )}.}`

  // Dummy provenance to be signed
  const provenance = {
    _type: 'https://in-toto.io/Statement/v1',
    subject: {
      name: 'subjective',
      digest: {
        sha256:
          '7d070f6b64d9bcc530fe99cc21eaaa4b3c364e0b2d367d7735671fa202a03b32'
      }
    }
  }

  const payload: Payload = {
    body: Buffer.from(JSON.stringify(provenance)),
    type: 'application/vnd.in-toto+json'
  }

  const fulcioURL = 'https://fulcio.url'
  const rekorURL = 'https://rekor.url'
  const tsaServerURL = 'https://tsa.url'

  beforeEach(() => {
    // Mock OIDC token endpoint
    const tokenURL = 'https://token.url'

    process.env = {
      ...originalEnv,
      ACTIONS_ID_TOKEN_REQUEST_URL: tokenURL,
      ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'token'
    }

    nock(tokenURL)
      .get('/')
      .query({audience: 'sigstore'})
      .reply(200, {value: oidcToken})
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('when visibility is public', () => {
    beforeEach(async () => {
      await mockFulcio({baseURL: fulcioURL, strict: false})
      await mockRekor({baseURL: rekorURL})
    })

    it('returns a bundle', async () => {
      const att = await signPayload(payload, {fulcioURL, rekorURL})

      expect(att).toBeDefined()
      expect(att.mediaType).toEqual(
        'application/vnd.dev.sigstore.bundle+json;version=0.2'
      )

      expect(att.content.$case).toEqual('dsseEnvelope')
      expect(att.verificationMaterial.content.$case).toEqual(
        'x509CertificateChain'
      )
      expect(att.verificationMaterial.tlogEntries).toHaveLength(1)
      expect(
        att.verificationMaterial.timestampVerificationData?.rfc3161Timestamps
      ).toHaveLength(0)
    })
  })

  describe('when visibility is private', () => {
    beforeEach(async () => {
      await mockFulcio({baseURL: fulcioURL, strict: false})
      await mockTSA({baseURL: tsaServerURL})
    })

    it('returns a bundle', async () => {
      const att = await signPayload(payload, {fulcioURL, tsaServerURL})

      expect(att).toBeDefined()
      expect(att.mediaType).toEqual(
        'application/vnd.dev.sigstore.bundle+json;version=0.2'
      )

      expect(att.content.$case).toEqual('dsseEnvelope')
      expect(att.verificationMaterial.content.$case).toEqual(
        'x509CertificateChain'
      )
      expect(att.verificationMaterial.tlogEntries).toHaveLength(0)
      expect(
        att.verificationMaterial.timestampVerificationData?.rfc3161Timestamps
      ).toHaveLength(1)
    })
  })
})
