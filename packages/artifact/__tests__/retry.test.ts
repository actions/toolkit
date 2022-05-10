import * as http from 'http'
import * as net from 'net'
import * as core from '@actions/core'
import * as configVariables from '../src/internal/config-variables'
import {retry} from '../src/internal/requestUtils'
import {HttpClientResponse} from '@actions/http-client'

jest.mock('../src/internal/config-variables')

interface ITestResult {
  responseCode: number
  errorMessage: string | null
}

async function testRetry(
  responseCodes: number[],
  expectedResult: ITestResult
): Promise<void> {
  const reverse = responseCodes.reverse() // Reverse responses since we pop from end
  if (expectedResult.errorMessage) {
    // we expect some exception to be thrown
    expect(
      retry(
        'test',
        async () => handleResponse(reverse.pop()),
        new Map(), // extra error message for any particular http codes
        configVariables.getRetryLimit()
      )
    ).rejects.toThrow(expectedResult.errorMessage)
  } else {
    // we expect a correct status code to be returned
    const actualResult = await retry(
      'test',
      async () => handleResponse(reverse.pop()),
      new Map(), // extra error message for any particular http codes
      configVariables.getRetryLimit()
    )
    expect(actualResult.message.statusCode).toEqual(expectedResult.responseCode)
  }
}

async function handleResponse(
  testResponseCode: number | undefined
): Promise<HttpClientResponse> {
  if (!testResponseCode) {
    throw new Error(
      'Test incorrectly set up. reverse.pop() was called too many times so not enough test response codes were supplied'
    )
  }

  return setupSingleMockResponse(testResponseCode)
}

beforeAll(async () => {
  // mock all output so that there is less noise when running tests
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(core, 'debug').mockImplementation(() => {})
  jest.spyOn(core, 'info').mockImplementation(() => {})
  jest.spyOn(core, 'warning').mockImplementation(() => {})
  jest.spyOn(core, 'error').mockImplementation(() => {})
})

/**
 * Helpers used to setup mocking for the HttpClient
 */
async function emptyMockReadBody(): Promise<string> {
  return new Promise(resolve => {
    resolve()
  })
}

async function setupSingleMockResponse(
  statusCode: number
): Promise<HttpClientResponse> {
  const mockMessage = new http.IncomingMessage(new net.Socket())
  const mockReadBody = emptyMockReadBody
  mockMessage.statusCode = statusCode
  return new Promise<HttpClientResponse>(resolve => {
    resolve({
      message: mockMessage,
      readBody: mockReadBody
    })
  })
}

test('retry works on successful response', async () => {
  await testRetry([200], {
    responseCode: 200,
    errorMessage: null
  })
})

test('retry works after retryable status code', async () => {
  await testRetry([503, 200], {
    responseCode: 200,
    errorMessage: null
  })
})

test('retry fails after exhausting retries', async () => {
  // __mocks__/config-variables caps the max retry count in tests to 2
  await testRetry([503, 503, 200], {
    responseCode: 200,
    errorMessage: 'test failed: Artifact service responded with 503'
  })
})

test('retry fails after non-retryable status code', async () => {
  await testRetry([400, 200], {
    responseCode: 400,
    errorMessage: 'test failed: Artifact service responded with 400'
  })
})
