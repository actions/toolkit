import {attest} from '../src/attest'

describe('attest', () => {
  describe('when no subject information is provided', () => {
    it('throws an error', async () => {
      const options = {
        predicateType: 'foo',
        predicate: {bar: 'baz'},
        token: 'token'
      }
      expect(attest(options)).rejects.toThrowError(
        'Must provide either subjectName and subjectDigest or subjects'
      )
    })
  })
})
