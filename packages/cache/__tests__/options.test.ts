import {
  DownloadOptions,
  UploadOptions,
  getDownloadOptions,
  getUploadOptions
} from '../src/options'

const useAzureSdk = true
const downloadConcurrency = 8
const timeoutInMs = 30000
const segmentTimeoutInMs = 600000
const lookupOnly = false
const uploadConcurrency = 4
const uploadChunkSize = 32 * 1024 * 1024

test('getDownloadOptions sets defaults', async () => {
  const actualOptions = getDownloadOptions()

  expect(actualOptions).toEqual({
    useAzureSdk,
    downloadConcurrency,
    timeoutInMs,
    segmentTimeoutInMs,
    lookupOnly
  })
})

test('getDownloadOptions overrides all settings', async () => {
  const expectedOptions: DownloadOptions = {
    useAzureSdk: false,
    downloadConcurrency: 14,
    timeoutInMs: 20000,
    segmentTimeoutInMs: 3600000,
    lookupOnly: true
  }

  const actualOptions = getDownloadOptions(expectedOptions)

  expect(actualOptions).toEqual(expectedOptions)
})

test('getUploadOptions sets defaults', async () => {
  const actualOptions = getUploadOptions()

  expect(actualOptions).toEqual({
    uploadConcurrency,
    uploadChunkSize
  })
})

test('getUploadOptions overrides all settings', async () => {
  const expectedOptions: UploadOptions = {
    uploadConcurrency: 2,
    uploadChunkSize: 16 * 1024 * 1024
  }

  const actualOptions = getUploadOptions(expectedOptions)

  expect(actualOptions).toEqual(expectedOptions)
})

test('getDownloadOptions overrides download timeout minutes', async () => {
  const expectedOptions: DownloadOptions = {
    useAzureSdk: false,
    downloadConcurrency: 14,
    timeoutInMs: 20000,
    segmentTimeoutInMs: 3600000,
    lookupOnly: true
  }
  process.env.SEGMENT_DOWNLOAD_TIMEOUT_MINS = '10'
  const actualOptions = getDownloadOptions(expectedOptions)

  expect(actualOptions.useAzureSdk).toEqual(expectedOptions.useAzureSdk)
  expect(actualOptions.downloadConcurrency).toEqual(
    expectedOptions.downloadConcurrency
  )
  expect(actualOptions.timeoutInMs).toEqual(expectedOptions.timeoutInMs)
  expect(actualOptions.segmentTimeoutInMs).toEqual(600000)
  expect(actualOptions.lookupOnly).toEqual(expectedOptions.lookupOnly)
})
