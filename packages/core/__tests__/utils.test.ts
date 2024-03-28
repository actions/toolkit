import {toAnnotationProperties} from '../src/utils'

describe('@actions/core/src/utils', () => {
  describe('.toAnnotationProperties', () => {
    it('extracts title only from Error instance without a parseable stack', () => {
      const error = new TypeError('Test error')
      error.stack = ''
      expect(toAnnotationProperties(error)).toEqual({
        title: 'TypeError',
        file: undefined,
        startLine: undefined,
        startColumn: undefined
      })
    })

    it('extracts AnnotationProperties from Error instance', () => {
      const error = new ReferenceError('Test error')
      expect(toAnnotationProperties(error)).toEqual({
        title: 'ReferenceError',
        file: expect.stringMatching(/utils\.test\.ts$/),
        startLine: expect.any(Number),
        startColumn: expect.any(Number)
      })
    })
  })
})
