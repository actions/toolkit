import nock from 'nock'
import {writeAttestation} from '../src/store'

describe('writeAttestation', () => {
  const originalEnv = process.env
  const attestation = {foo: 'bar '}
  const token = 'token'

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      GITHUB_REPOSITORY: 'foo/bar'
    }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('when the api call is successful', () => {
    beforeEach(() => {
      nock('https://api.github.com')
        .matchHeader('authorization', `token ${token}`)
        .post('/repos/foo/bar/attestations', {bundle: attestation})
        .reply(201, {id: '123'})
    })

    it('persists the attestation', async () => {
      await expect(writeAttestation(attestation, token)).resolves.toEqual('123')
    })
  })

  describe('when the api call fails', () => {
    beforeEach(() => {
      nock('https://api.github.com')
        .matchHeader('authorization', `token ${token}`)
        .post('/repos/foo/bar/attestations', {bundle: attestation})
        .reply(500, 'oops')
    })

    it('persists the attestation', async () => {
      await expect(writeAttestation(attestation, token)).rejects.toThrow(/oops/)
    })
  })
})
