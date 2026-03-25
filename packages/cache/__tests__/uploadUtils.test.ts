import * as uploadUtils from '../src/internal/uploadUtils'
import {TransferProgressEvent} from '@azure/core-rest-pipeline'

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
