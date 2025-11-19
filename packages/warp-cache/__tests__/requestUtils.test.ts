import {retry, retryTypedResponse} from '../src/internal/requestUtils'
import {HttpClientError} from '@actions/http-client'
import * as requestUtils from '../src/internal/requestUtils'

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
    2, // maxAttempts
    0 // delay
  )

  expect(actualResult.result).toEqual(expectedResult)
}

async function testRetryConvertingErrorToResult(
  responses: ITestResponse[],
  expectedStatus: number,
  expectedResult: string | null
): Promise<void> {
  responses = responses.reverse() // Reverse responses since we pop from end

  const actualResult = await retry(
    'test',
    async () => handleResponse(responses.pop()),
    (response: ITestResponse) => response.statusCode,
    2, // maxAttempts
    0, // delay
    (e: Error) => {
      if (e instanceof HttpClientError) {
        return {
          statusCode: e.statusCode,
          result: null,
          error: null
        }
      }
    }
  )

  expect(actualResult.statusCode).toEqual(expectedStatus)
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
      2, // maxAttempts,
      0 // delay
    )
  ).rejects.toBeInstanceOf(Error)
}

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

test('retry returns after client error', async () => {
  await testRetryExpectingResult(
    [TestResponse(400), TestResponse(200, 'Ok')],
    null
  )
})

test('retry converts errors to response object', async () => {
  await testRetryConvertingErrorToResult(
    [TestResponse(new HttpClientError('Test error', 409))],
    409,
    null
  )
})

test('retryTypedResponse gives an error with error message', async () => {
  const httpClientError = new HttpClientError(
    'The cache filesize must be between 0 and 10 * 1024 * 1024 bytes',
    400
  )
  jest.spyOn(requestUtils, 'retry').mockReturnValue(
    new Promise(resolve => {
      resolve(httpClientError)
    })
  )
  try {
    await retryTypedResponse<string>(
      'reserveCache',
      async () =>
        new Promise(resolve => {
          resolve({
            statusCode: 400,
            result: '',
            headers: {},
            error: httpClientError
          })
        })
    )
  } catch (error) {
    expect(error).toHaveProperty(
      'message',
      'The cache filesize must be between 0 and 10 * 1024 * 1024 bytes'
    )
  }
})
