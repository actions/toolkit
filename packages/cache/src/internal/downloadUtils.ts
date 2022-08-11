import * as core from '@actions/core'
import {HttpClient, HttpClientResponse} from '@actions/http-client'
import {BlockBlobClient} from '@azure/storage-blob'
import {TransferProgressEvent} from '@azure/ms-rest-js'
import * as buffer from 'buffer'
import * as fs from 'fs'
import * as stream from 'stream'
import * as util from 'util'

import * as utils from './cacheUtils'
import {SocketTimeout} from './constants'
import {DownloadOptions} from '../options'
import {retryHttpClientResponse} from './requestUtils'

import {AbortController} from '@azure/abort-controller'

/**
 * Pipes the body of a HTTP response to a stream
 *
 * @param response the HTTP response
 * @param output the writable stream
 */
async function pipeResponseToStream(
  response: HttpClientResponse,
  output: NodeJS.WritableStream
): Promise<void> {
  const pipeline = util.promisify(stream.pipeline)
  await pipeline(response.message, output)
}

/**
 * Class for tracking the download state and displaying stats.
 */
export class DownloadProgress {
  contentLength: number
  segmentIndex: number
  segmentSize: number
  segmentOffset: number
  receivedBytes: number
  startTime: number
  displayedComplete: boolean
  timeoutHandle?: ReturnType<typeof setTimeout>

  constructor(contentLength: number) {
    this.contentLength = contentLength
    this.segmentIndex = 0
    this.segmentSize = 0
    this.segmentOffset = 0
    this.receivedBytes = 0
    this.displayedComplete = false
    this.startTime = Date.now()
  }

  /**
   * Progress to the next segment. Only call this method when the previous segment
   * is complete.
   *
   * @param segmentSize the length of the next segment
   */
  nextSegment(segmentSize: number): void {
    this.segmentOffset = this.segmentOffset + this.segmentSize
    this.segmentIndex = this.segmentIndex + 1
    this.segmentSize = segmentSize
    this.receivedBytes = 0

    core.debug(
      `Downloading segment at offset ${this.segmentOffset} with length ${this.segmentSize}...`
    )
  }

  /**
   * Sets the number of bytes received for the current segment.
   *
   * @param receivedBytes the number of bytes received
   */
  setReceivedBytes(receivedBytes: number): void {
    this.receivedBytes = receivedBytes
  }

  /**
   * Returns the total number of bytes transferred.
   */
  getTransferredBytes(): number {
    return this.segmentOffset + this.receivedBytes
  }

  /**
   * Returns true if the download is complete.
   */
  isDone(): boolean {
    return this.getTransferredBytes() === this.contentLength
  }

  /**
   * Prints the current download stats. Once the download completes, this will print one
   * last line and then stop.
   */
  display(): void {
    if (this.displayedComplete) {
      return
    }

    const transferredBytes = this.segmentOffset + this.receivedBytes
    const percentage = (100 * (transferredBytes / this.contentLength)).toFixed(
      1
    )
    const elapsedTime = Date.now() - this.startTime
    const downloadSpeed = (
      transferredBytes /
      (1024 * 1024) /
      (elapsedTime / 1000)
    ).toFixed(1)

    core.info(
      `Received ${transferredBytes} of ${this.contentLength} (${percentage}%), ${downloadSpeed} MBs/sec`
    )

    if (this.isDone()) {
      this.displayedComplete = true
    }
  }

  /**
   * Returns a function used to handle TransferProgressEvents.
   */
  onProgress(): (progress: TransferProgressEvent) => void {
    return (progress: TransferProgressEvent) => {
      this.setReceivedBytes(progress.loadedBytes)
    }
  }

  /**
   * Starts the timer that displays the stats.
   *
   * @param delayInMs the delay between each write
   */
  startDisplayTimer(delayInMs = 1000): void {
    const displayCallback = (): void => {
      this.display()

      if (!this.isDone()) {
        this.timeoutHandle = setTimeout(displayCallback, delayInMs)
      }
    }

    this.timeoutHandle = setTimeout(displayCallback, delayInMs)
  }

  /**
   * Stops the timer that displays the stats. As this typically indicates the download
   * is complete, this will display one last line, unless the last line has already
   * been written.
   */
  stopDisplayTimer(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle)
      this.timeoutHandle = undefined
    }

    this.display()
  }
}

/**
 * Download the cache using the Actions toolkit http-client
 *
 * @param archiveLocation the URL for the cache
 * @param archivePath the local path where the cache is saved
 */
export async function downloadCacheHttpClient(
  archiveLocation: string,
  archivePath: string
): Promise<void> {
  const writeStream = fs.createWriteStream(archivePath)
  const httpClient = new HttpClient('actions/cache')
  const downloadResponse = await retryHttpClientResponse(
    'downloadCache',
    async () => httpClient.get(archiveLocation)
  )

  // Abort download if no traffic received over the socket.
  downloadResponse.message.socket.setTimeout(SocketTimeout, () => {
    downloadResponse.message.destroy()
    core.debug(`Aborting download, socket timed out after ${SocketTimeout} ms`)
  })

  await pipeResponseToStream(downloadResponse, writeStream)

  // Validate download size.
  const contentLengthHeader = downloadResponse.message.headers['content-length']

  if (contentLengthHeader) {
    const expectedLength = parseInt(contentLengthHeader)
    const actualLength = utils.getArchiveFileSizeInBytes(archivePath)

    if (actualLength !== expectedLength) {
      throw new Error(
        `Incomplete download. Expected file size: ${expectedLength}, actual file size: ${actualLength}`
      )
    }
  } else {
    core.debug('Unable to validate download, no Content-Length header')
  }
}

/**
 * Download the cache using the Azure Storage SDK.  Only call this method if the
 * URL points to an Azure Storage endpoint.
 *
 * @param archiveLocation the URL for the cache
 * @param archivePath the local path where the cache is saved
 * @param options the download options with the defaults set
 */
export async function downloadCacheStorageSDK(
  archiveLocation: string,
  archivePath: string,
  options: DownloadOptions
): Promise<void> {
  const client = new BlockBlobClient(archiveLocation, undefined, {
    retryOptions: {
      // Override the timeout used when downloading each 4 MB chunk
      // The default is 2 min / MB, which is way too slow
      tryTimeoutInMs: options.timeoutInMs
    }
  })

  const properties = await client.getProperties()
  const contentLength = properties.contentLength ?? -1

  if (contentLength < 0) {
    // We should never hit this condition, but just in case fall back to downloading the
    // file as one large stream
    core.debug(
      'Unable to determine content length, downloading file with http-client...'
    )

    await downloadCacheHttpClient(archiveLocation, archivePath)
  } else {
    // Use downloadToBuffer for faster downloads, since internally it splits the
    // file into 4 MB chunks which can then be parallelized and retried independently
    //
    // If the file exceeds the buffer maximum length (~1 GB on 32-bit systems and ~2 GB
    // on 64-bit systems), split the download into multiple segments
    // ~2 GB = 2147483647, beyond this, we start getting out of range error. So, capping it accordingly.
    const maxSegmentSize = Math.min(2147483647, buffer.constants.MAX_LENGTH)
    const downloadProgress = new DownloadProgress(contentLength)

    const fd = fs.openSync(archivePath, 'w')

    try {
      downloadProgress.startDisplayTimer()
      const controller = new AbortController()
      const abortSignal = controller.signal
      while (!downloadProgress.isDone()) {
        const segmentStart =
          downloadProgress.segmentOffset + downloadProgress.segmentSize

        const segmentSize = Math.min(
          maxSegmentSize,
          contentLength - segmentStart
        )

        downloadProgress.nextSegment(segmentSize)
        const result = await promiseWithTimeout(
          options.segmentTimeoutInMs || 3600000,
          client.downloadToBuffer(segmentStart, segmentSize, {
            abortSignal,
            concurrency: options.downloadConcurrency,
            onProgress: downloadProgress.onProgress()
          })
        )
        if (result === 'timeout') {
          controller.abort()
          throw new Error(
            'Aborting cache download as the download time exceeded the timeout.'
          )
        } else if (Buffer.isBuffer(result)) {
          fs.writeFileSync(fd, result)
        }
      }
    } finally {
      downloadProgress.stopDisplayTimer()
      fs.closeSync(fd)
    }
  }
}

const promiseWithTimeout = async (
  timeoutMs: number,
  promise: Promise<Buffer>
): Promise<unknown> => {
  let timeoutHandle: NodeJS.Timeout
  const timeoutPromise = new Promise(resolve => {
    timeoutHandle = setTimeout(() => resolve('timeout'), timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).then(result => {
    clearTimeout(timeoutHandle)
    return result
  })
}
