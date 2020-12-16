import {retry} from '../src/internal/requestUtils'
import * as core from '@actions/core'

interface ITestResponse {
  statusCode: number
  result: string | null
  error: Error | null
}

function TestResponse(
  action: number | Error,
  result: string | null = null
): ITestResponse {
  if (action instanceof Error) {
    return {
      statusCode: -1,
      result,
      error: action
    }
  } else {
    return {
      statusCode: action,
      result,
      error: null
    }
  }
}

async function handleResponse(
  response: ITestResponse | undefined
): Promise<ITestResponse> {
  if (!response) {
    // eslint-disable-next-line no-undef
    fail('Retry method called too many times')
  }

  if (response.error) {
    throw response.error
  } else {
    return Promise.resolve(response)
  }
}

async function testRetryExpectingResult(
  responses: ITestResponse[],
  expectedResult: string | null
): Promise<void> {
  responses = responses.reverse() // Reverse responses since we pop from end

  const actualResult = await retry(
    'test',
    async () => handleResponse(responses.pop()),
    (response: ITestResponse) => response.statusCode,
    new Map(), // extra error message for any particular http codes
    2, // maxAttempts
    0 // delay
  )

  expect(actualResult.result).toEqual(expectedResult)
}

async function testRetryExpectingError(
  responses: ITestResponse[]
): Promise<void> {
  responses = responses.reverse() // Reverse responses since we pop from end

  expect(
    retry(
      'test',
      async () => handleResponse(responses.pop()),
      (response: ITestResponse) => response.statusCode,
      new Map(), // extra error message for any particular http codes
      2, // maxAttempts,
      0 // delay
    )
  ).rejects.toBeInstanceOf(Error)
}

beforeAll(async () => {
  // mock all output so that there is less noise when running tests
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(core, 'debug').mockImplementation(() => {})
  jest.spyOn(core, 'info').mockImplementation(() => {})
  jest.spyOn(core, 'warning').mockImplementation(() => {})
  jest.spyOn(core, 'error').mockImplementation(() => {})
})

test('retry works on successful response', async () => {
  await testRetryExpectingResult([TestResponse(200, 'Ok')], 'Ok')
})

test('retry works after retryable status code', async () => {
  await testRetryExpectingResult(
    [TestResponse(503), TestResponse(200, 'Ok')],
    'Ok'
  )
})

test('retry fails after exhausting retries', async () => {
  await testRetryExpectingError([
    TestResponse(503),
    TestResponse(503),
    TestResponse(200, 'Ok')
  ])
})

test('retry fails after non-retryable status code', async () => {
  await testRetryExpectingError([TestResponse(500), TestResponse(200, 'Ok')])
})

test('retry works after error', async () => {
  await testRetryExpectingResult(
    [TestResponse(new Error('Test error')), TestResponse(200, 'Ok')],
    'Ok'
  )
})
