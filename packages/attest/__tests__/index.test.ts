import {attest, attestProvenance} from '../src'

it('exports functions', () => {
  expect(attestProvenance).toBeInstanceOf(Function)
  expect(attest).toBeInstanceOf(Function)
})
