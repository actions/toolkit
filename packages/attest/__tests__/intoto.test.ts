import {buildIntotoStatement} from '../src/intoto'
import type {Predicate, Subject} from '../src/shared.types'

describe('buildIntotoStatement', () => {
  const subject: Subject = {
    name: 'subjecty',
    digest: {
      sha256: '7d070f6b64d9bcc530fe99cc21eaaa4b3c364e0b2d367d7735671fa202a03b32'
    }
  }

  const predicate: Predicate = {
    type: 'predicatey',
    params: {
      key: 'value'
    }
  }

  it('returns a provenance hydrated from env vars', () => {
    const statement = buildIntotoStatement(subject, predicate)
    expect(statement).toMatchSnapshot()
  })
})
