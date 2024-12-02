import * as uploadUtils from '../src/internal/uploadUtils'
import {TransferProgressEvent} from '@azure/ms-rest-js'

test('upload progress tracked correctly', () => {
  const progress = new uploadUtils.UploadProgress(1000)

  expect(progress.contentLength).toBe(1000)
  expect(progress.sentBytes).toBe(0)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(0)
  expect(progress.isDone()).toBe(false)

  progress.onProgress()({loadedBytes: 0} as TransferProgressEvent)

  expect(progress.contentLength).toBe(1000)
  expect(progress.sentBytes).toBe(0)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(0)
  expect(progress.isDone()).toBe(false)

  progress.onProgress()({loadedBytes: 250} as TransferProgressEvent)

  expect(progress.contentLength).toBe(1000)
  expect(progress.sentBytes).toBe(250)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(250)
  expect(progress.isDone()).toBe(false)

  progress.onProgress()({loadedBytes: 500} as TransferProgressEvent)

  expect(progress.contentLength).toBe(1000)
  expect(progress.sentBytes).toBe(500)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(500)
  expect(progress.isDone()).toBe(false)

  progress.onProgress()({loadedBytes: 750} as TransferProgressEvent)

  expect(progress.contentLength).toBe(1000)
  expect(progress.sentBytes).toBe(750)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(750)
  expect(progress.isDone()).toBe(false)

  progress.onProgress()({loadedBytes: 1000} as TransferProgressEvent)

  expect(progress.contentLength).toBe(1000)
  expect(progress.sentBytes).toBe(1000)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(1000)
  expect(progress.isDone()).toBe(true)
})

// test('upload to azure blob storage is successful', () => {
//   const archivePath = 'path/to/archive.tzst'
//   const signedUploadURL = 'https://storage10.blob.core.windows.net/cache-container/3fe-60?se=2024-12-002T11%3A08%3A58Z&sv=2024-11-04'
//   const options: UploadOptions = {
//     useAzureSdk: true,
//     uploadChunkSize: 64 * 1024 * 1024,
//     uploadConcurrency: 8
//   }

//   jest.spyOn(uploadUtils.UploadProgress.prototype, 'onProgress').mockImplementation(() => (progress: TransferProgressEvent) => {
//     return progress.loadedBytes
//   })

//   jest.spyOn(uploadUtils.UploadProgress.prototype, 'onProgress').mockImplementation(() => (progress: TransferProgressEvent) => {
//     return progress.loadedBytes
//   })

//   const response = uploadUtils.uploadCacheArchiveSDK(signedUploadURL, archivePath, options)

//   expect(response).toBeInstanceOf(Promise)
// })
