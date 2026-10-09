import * as core from '@actions/core'
import {BlobDownloadToBufferOptions, BlockBlobClient} from '@azure/storage-blob'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {
  DownloadProgress,
  downloadCacheStorageSDK
} from '../src/internal/downloadUtils'

test('download progress tracked correctly', () => {
  const progress = new DownloadProgress(1000)

  expect(progress.contentLength).toBe(1000)
  expect(progress.receivedBytes).toBe(0)
  expect(progress.segmentIndex).toBe(0)
  expect(progress.segmentOffset).toBe(0)
  expect(progress.segmentSize).toBe(0)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(0)
  expect(progress.isDone()).toBe(false)

  progress.nextSegment(500)

  expect(progress.contentLength).toBe(1000)
  expect(progress.receivedBytes).toBe(0)
  expect(progress.segmentIndex).toBe(1)
  expect(progress.segmentOffset).toBe(0)
  expect(progress.segmentSize).toBe(500)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(0)
  expect(progress.isDone()).toBe(false)

  progress.setReceivedBytes(250)

  expect(progress.contentLength).toBe(1000)
  expect(progress.receivedBytes).toBe(250)
  expect(progress.segmentIndex).toBe(1)
  expect(progress.segmentOffset).toBe(0)
  expect(progress.segmentSize).toBe(500)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(250)
  expect(progress.isDone()).toBe(false)

  progress.setReceivedBytes(500)

  expect(progress.contentLength).toBe(1000)
  expect(progress.receivedBytes).toBe(500)
  expect(progress.segmentIndex).toBe(1)
  expect(progress.segmentOffset).toBe(0)
  expect(progress.segmentSize).toBe(500)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(500)
  expect(progress.isDone()).toBe(false)

  progress.nextSegment(500)

  expect(progress.contentLength).toBe(1000)
  expect(progress.receivedBytes).toBe(0)
  expect(progress.segmentIndex).toBe(2)
  expect(progress.segmentOffset).toBe(500)
  expect(progress.segmentSize).toBe(500)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(500)
  expect(progress.isDone()).toBe(false)

  progress.setReceivedBytes(250)

  expect(progress.contentLength).toBe(1000)
  expect(progress.receivedBytes).toBe(250)
  expect(progress.segmentIndex).toBe(2)
  expect(progress.segmentOffset).toBe(500)
  expect(progress.segmentSize).toBe(500)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(750)
  expect(progress.isDone()).toBe(false)

  progress.setReceivedBytes(500)

  expect(progress.contentLength).toBe(1000)
  expect(progress.receivedBytes).toBe(500)
  expect(progress.segmentIndex).toBe(2)
  expect(progress.segmentOffset).toBe(500)
  expect(progress.segmentSize).toBe(500)
  expect(progress.displayedComplete).toBe(false)
  expect(progress.timeoutHandle).toBeUndefined()
  expect(progress.getTransferredBytes()).toBe(1000)
  expect(progress.isDone()).toBe(true)
})

test('display timer works correctly', done => {
  const progress = new DownloadProgress(1000)

  const infoMock = jest.spyOn(core, 'info')
  infoMock.mockImplementation(() => {})

  const check = (): void => {
    expect(infoMock).toHaveBeenLastCalledWith(
      expect.stringContaining('Received 500 of 1000')
    )
  }

  // Validate no further updates are displayed after stopping the timer.
  const test2 = (): void => {
    check()
    expect(progress.timeoutHandle).toBeUndefined()
    done()
  }

  // Validate the progress is displayed, stop the timer, and call test2.
  const test1 = (): void => {
    check()

    progress.stopDisplayTimer()
    progress.setReceivedBytes(1000)

    setTimeout(() => test2(), 500)
  }

  // Start the timer, update the received bytes, and call test1.
  const start = (): void => {
    progress.startDisplayTimer(10)
    expect(progress.timeoutHandle).toBeDefined()

    progress.setReceivedBytes(500)

    setTimeout(() => test1(), 500)
  }

  start()
})

test('display does not print completed line twice', () => {
  const progress = new DownloadProgress(1000)

  const infoMock = jest.spyOn(core, 'info')
  infoMock.mockImplementation(() => {})

  progress.display()

  expect(progress.displayedComplete).toBe(false)
  expect(infoMock).toHaveBeenCalledTimes(1)

  progress.nextSegment(1000)
  progress.setReceivedBytes(500)
  progress.display()

  expect(progress.displayedComplete).toBe(false)
  expect(infoMock).toHaveBeenCalledTimes(2)

  progress.setReceivedBytes(1000)
  progress.display()

  expect(progress.displayedComplete).toBe(true)
  expect(infoMock).toHaveBeenCalledTimes(3)

  progress.display()

  expect(progress.displayedComplete).toBe(true)
  expect(infoMock).toHaveBeenCalledTimes(3)
})

describe('cache download timeout cleanup', () => {
  let directory: string
  let archivePath: string

  beforeEach(() => {
    jest.useFakeTimers()
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cache-download-'))
    archivePath = path.join(directory, 'archive')
    jest.spyOn(BlockBlobClient.prototype, 'getProperties').mockResolvedValue({
      contentLength: 4
    } as Awaited<ReturnType<BlockBlobClient['getProperties']>>)
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
    jest.restoreAllMocks()
    fs.rmSync(directory, {recursive: true, force: true})
  })

  test('rejected download preserves the error without leaving a timer', async () => {
    const error = new Error('download failed')
    jest
      .spyOn(BlockBlobClient.prototype, 'downloadToBuffer')
      .mockRejectedValue(error)

    await expect(
      downloadCacheStorageSDK('https://example.com/cache', archivePath, {
        segmentTimeoutInMs: 1000
      })
    ).rejects.toBe(error)

    expect(jest.getTimerCount()).toBe(0)
  })

  test('successful download writes the buffer without leaving a timer', async () => {
    jest
      .spyOn(BlockBlobClient.prototype, 'downloadToBuffer')
      .mockImplementation(
        async (
          _offset,
          _count,
          options?: number | BlobDownloadToBufferOptions
        ) => {
          if (typeof options !== 'number') {
            options?.onProgress?.({loadedBytes: 4})
          }
          return Buffer.from('data')
        }
      )

    await downloadCacheStorageSDK('https://example.com/cache', archivePath, {
      segmentTimeoutInMs: 1000
    })

    expect(fs.readFileSync(archivePath)).toEqual(Buffer.from('data'))
    expect(jest.getTimerCount()).toBe(0)
  })

  test('timed out download aborts without leaving a timer', async () => {
    let signal: {aborted: boolean} | undefined
    jest
      .spyOn(BlockBlobClient.prototype, 'downloadToBuffer')
      .mockImplementation(
        async (
          _offset,
          _count,
          options?: number | BlobDownloadToBufferOptions
        ) => {
          if (typeof options !== 'number') {
            signal = options?.abortSignal
          }
          return new Promise<Buffer>(() => {})
        }
      )

    const download = downloadCacheStorageSDK(
      'https://example.com/cache',
      archivePath,
      {segmentTimeoutInMs: 1000}
    )
    const rejected = expect(download).rejects.toThrow(
      'Aborting cache download as the download time exceeded the timeout.'
    )

    await jest.advanceTimersByTimeAsync(1000)
    await rejected

    expect(signal?.aborted).toBe(true)
    expect(jest.getTimerCount()).toBe(0)
  })
})
