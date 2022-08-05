import {
  DownloadOptions,
  UploadOptions,
  getDownloadOptions,
  getUploadOptions
} from '../src/options'

const useAzureSdk = true
const downloadConcurrency = 8
const timeoutInMs = 30000
const abortTimeInMs = 3600000
const uploadConcurrency = 4
const uploadChunkSize = 32 * 1024 * 1024

test('getDownloadOptions sets defaults', async () => {
  const actualOptions = getDownloadOptions()

  expect(actualOptions).toEqual({
    useAzureSdk,
    downloadConcurrency,
    timeoutInMs,
    abortTimeInMs
  })
})

test('getDownloadOptions overrides all settings', async () => {
  const expectedOptions: DownloadOptions = {
    useAzureSdk: false,
    downloadConcurrency: 14,
    timeoutInMs: 20000,
    abortTimeInMs: 3600000
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
