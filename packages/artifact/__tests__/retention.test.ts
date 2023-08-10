import {Timestamp} from '../src/generated'
import * as retention from '../src/internal/upload/retention'

describe('retention', () => {
  beforeEach(() => {
    delete process.env['GITHUB_RETENTION_DAYS']
  })
  it('should return the inputted retention days if it is less than the max retention days', () => {
    // setup
    const mockDate = new Date('2020-01-01')
    jest.useFakeTimers().setSystemTime(mockDate)
    process.env['GITHUB_RETENTION_DAYS'] = '90'

    const exp = retention.getExpiration(30)

    expect(exp).toBeDefined()
    const expDate = Timestamp.toDate(exp!) // we check whether exp is defined above
    const expected = new Date()
    expected.setDate(expected.getDate() + 30)

    expect(expDate).toEqual(expected)
  })

  it('should return the max retention days if the inputted retention days is greater than the max retention days', () => {
    // setup
    const mockDate = new Date('2020-01-01')
    jest.useFakeTimers().setSystemTime(mockDate)
    process.env['GITHUB_RETENTION_DAYS'] = '90'

    const exp = retention.getExpiration(120)

    expect(exp).toBeDefined()
    const expDate = Timestamp.toDate(exp!) // we check whether exp is defined above
    const expected = new Date()
    expected.setDate(expected.getDate() + 90)

    expect(expDate).toEqual(expected)
  })

  it('should return undefined if the inputted retention days is undefined', () => {
    const exp = retention.getExpiration()
    expect(exp).toBeUndefined()
  })

  it('should return the inputted retention days if there is no max retention days', () => {
    // setup
    const mockDate = new Date('2020-01-01')
    jest.useFakeTimers().setSystemTime(mockDate)

    const exp = retention.getExpiration(30)

    expect(exp).toBeDefined()
    const expDate = Timestamp.toDate(exp!) // we check whether exp is defined above
    const expected = new Date()
    expected.setDate(expected.getDate() + 30)

    expect(expDate).toEqual(expected)
  })
})
