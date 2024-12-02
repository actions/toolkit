import * as core from '@actions/core'
import {
  BlobClient,
  BlobUploadCommonResponse,
  BlockBlobClient,
  BlockBlobParallelUploadOptions
} from '@azure/storage-blob'
import {TransferProgressEvent} from '@azure/ms-rest-js'
import {InvalidResponseError} from './shared/errors'
import {UploadOptions} from '../options'

/**
 * Class for tracking the upload state and displaying stats.
 */
export class UploadProgress {
  contentLength: number
  sentBytes: number
  startTime: number
  displayedComplete: boolean
  timeoutHandle?: ReturnType<typeof setTimeout>

  constructor(contentLength: number) {
    this.contentLength = contentLength
    this.sentBytes = 0
    this.displayedComplete = false
    this.startTime = Date.now()
  }

  /**
   * Sets the number of bytes sent
   *
   * @param sentBytes the number of bytes sent
   */
  setSentBytes(sentBytes: number): void {
    this.sentBytes = sentBytes
  }

  /**
   * Returns the total number of bytes transferred.
   */
  getTransferredBytes(): number {
    return this.sentBytes
  }

  /**
   * Returns true if the upload is complete.
   */
  isDone(): boolean {
    return this.getTransferredBytes() === this.contentLength
  }

  /**
   * Prints the current upload stats. Once the upload completes, this will print one
   * last line and then stop.
   */
  display(): void {
    if (this.displayedComplete) {
      return
    }

    const transferredBytes = this.sentBytes
    const percentage = (100 * (transferredBytes / this.contentLength)).toFixed(
      1
    )
    const elapsedTime = Date.now() - this.startTime
    const uploadSpeed = (
      transferredBytes /
      (1024 * 1024) /
      (elapsedTime / 1000)
    ).toFixed(1)

    core.info(
      `Sent ${transferredBytes} of ${this.contentLength} (${percentage}%), ${uploadSpeed} MBs/sec`
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
      this.setSentBytes(progress.loadedBytes)
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
   * Stops the timer that displays the stats. As this typically indicates the upload
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

export async function uploadCacheArchiveSDK(
  signedUploadURL: string,
  archivePath: string,
  options?: UploadOptions
): Promise<BlobUploadCommonResponse> {
  const blobClient: BlobClient = new BlobClient(signedUploadURL)
  const blockBlobClient: BlockBlobClient = blobClient.getBlockBlobClient()
  const uploadProgress = new UploadProgress(options?.archiveSizeBytes ?? 0)

  // Specify data transfer options
  const uploadOptions: BlockBlobParallelUploadOptions = {
    blockSize: options?.uploadChunkSize,
    concurrency: options?.uploadConcurrency, // maximum number of parallel transfer workers
    maxSingleShotSize: 128 * 1024 * 1024, // 128 MiB initial transfer size
    onProgress: uploadProgress.onProgress()
  }

  try {
    uploadProgress.startDisplayTimer()

    core.debug(
      `BlobClient: ${blobClient.name}:${blobClient.accountName}:${blobClient.containerName}`
    )

    const response = await blockBlobClient.uploadFile(
      archivePath,
      uploadOptions
    )

    // TODO: better management of non-retryable errors
    if (response._response.status >= 400) {
      throw new InvalidResponseError(
        `Upload failed with status code ${response._response.status}`
      )
    }

    return response
  } catch (error) {
    core.warning(
      `uploadCacheArchiveSDK: internal error uploading cache archive: ${error.message}`
    )
    throw error
  } finally {
    uploadProgress.stopDisplayTimer()
  }
}
