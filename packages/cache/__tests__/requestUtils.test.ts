import {retry} from '../src/internal/requestUtils'

interface TestResponse {
  statusCode: number
  result: string | null
}

async function handleResponse(
  response: TestResponse | undefined
): Promise<TestResponse> {
  if (!response) {
    // eslint-disable-next-line no-undef
    fail('Retry method called too many times')
  }

  // Status codes >= 600 will throw an Error instead of returning a response object. This
  // mimics the behavior of the http-client *Json methods, which throw an error on any
  // non-successful status codes.  Values in the 6xx, 7xx, and 8xx range are converted
  // to the corresponding 3xx, 4xx, and 5xx status code.
  if (response.statusCode >= 900) {
    throw Error('Test Error')
  } else if (response.statusCode >= 600) {
    const error: any = Error('Test Error with Status Code')
    error['statusCode'] = response.statusCode - 300
    throw error
  } else {
    return Promise.resolve(response)
  }
}

async function testRetryExpectingResult(
  responses: TestResponse[],
  expectedResult: string | null
): Promise<void> {
  responses = responses.reverse() // Reverse responses since we pop from end

  const actualResult = await retry(
    'test',
    async () => handleResponse(responses.pop()),
    (response: TestResponse) => response.statusCode
  )

  expect(actualResult.result).toEqual(expectedResult)
}

async function testRetryConvertingErrorToResult(
  responses: TestResponse[],
  expectedStatus: number,
  expectedResult: string | null
): Promise<void> {
  responses = responses.reverse() // Reverse responses since we pop from end

  const actualResult = await retry(
    'test',
    async () => handleResponse(responses.pop()),
    (response: TestResponse) => response.statusCode,
    2,
    (e: Error) => {
      const error: any = e
      return {
        statusCode: error['statusCode'],
        result: error['result']
      }
    }
  )

  expect(actualResult.statusCode).toEqual(expectedStatus)
  expect(actualResult.result).toEqual(expectedResult)
}

async function testRetryExpectingError(
  responses: TestResponse[]
): Promise<void> {
  responses = responses.reverse() // Reverse responses since we pop from end

  expect(
    retry(
      'test',
      async () => handleResponse(responses.pop()),
      (response: TestResponse) => response.statusCode
    )
  ).rejects.toBeInstanceOf(Error)
}

test('retry works on successful response', async () => {
  await testRetryExpectingResult(
    [
      {
        statusCode: 200,
        result: 'Ok'
      }
    ],
    'Ok'
  )
})

test('retry works after retryable status code', async () => {
  await testRetryExpectingResult(
    [
      {
        statusCode: 503,
        result: null
      },
      {
        statusCode: 200,
        result: 'Ok'
      }
    ],
    'Ok'
  )
})

test('retry fails after exhausting retries', async () => {
  await testRetryExpectingError([
    {
      statusCode: 503,
      result: null
    },
    {
      statusCode: 503,
      result: null
    },
    {
      statusCode: 200,
      result: 'Ok'
    }
  ])
})

test('retry fails after non-retryable status code', async () => {
  await testRetryExpectingError([
    {
      statusCode: 500,
      result: null
    },
    {
      statusCode: 200,
      result: 'Ok'
    }
  ])
})

test('retry works after error', async () => {
  await testRetryExpectingResult(
    [
      {
        statusCode: 999,
        result: null
      },
      {
        statusCode: 200,
        result: 'Ok'
      }
    ],
    'Ok'
  )
})

test('retry returns after client error', async () => {
  await testRetryExpectingResult(
    [
      {
        statusCode: 400,
        result: null
      },
      {
        statusCode: 200,
        result: 'Ok'
      }
    ],
    null
  )
})

test('retry converts errors to response object', async () => {
  await testRetryConvertingErrorToResult(
    [
      {
        statusCode: 709, // throw a 409 Conflict error
        result: null
      }
    ],
    409,
    null
  )
})
