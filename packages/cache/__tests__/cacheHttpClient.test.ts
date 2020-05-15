import {getCacheVersion, retry} from '../src/internal/cacheHttpClient'
import {CompressionMethod} from '../src/internal/constants'

test('getCacheVersion with one path returns version', async () => {
  const paths = ['node_modules']
  const result = getCacheVersion(paths)
  expect(result).toEqual(
    'b3e0c6cb5ecf32614eeb2997d905b9c297046d7cbf69062698f25b14b4cb0985'
  )
})

test('getCacheVersion with multiple paths returns version', async () => {
  const paths = ['node_modules', 'dist']
  const result = getCacheVersion(paths)
  expect(result).toEqual(
    '165c3053bc646bf0d4fac17b1f5731caca6fe38e0e464715c0c3c6b6318bf436'
  )
})

test('getCacheVersion with zstd compression returns version', async () => {
  const paths = ['node_modules']
  const result = getCacheVersion(paths, CompressionMethod.Zstd)

  expect(result).toEqual(
    '273877e14fd65d270b87a198edbfa2db5a43de567c9a548d2a2505b408befe24'
  )
})

test('getCacheVersion with gzip compression does not change vesion', async () => {
  const paths = ['node_modules']
  const result = getCacheVersion(paths, CompressionMethod.Gzip)

  expect(result).toEqual(
    'b3e0c6cb5ecf32614eeb2997d905b9c297046d7cbf69062698f25b14b4cb0985'
  )
})

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
