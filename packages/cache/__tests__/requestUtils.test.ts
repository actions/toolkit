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

  if (response.statusCode === 999) {
    throw Error('Test Error')
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
