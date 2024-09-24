import * as core from '@actions/core'
import { CreateCacheEntryResponse } from '../../generated/results/api/v1/cache'
import { ZipUploadStream } from '@actions/artifact/lib/internal/upload/zip'
import { NetworkError } from '@actions/artifact/'
import { TransferProgressEvent } from '@azure/core-http'
import * as stream from 'stream'
import * as crypto from 'crypto'

import {
  BlobClient,
  BlockBlobClient,
  BlockBlobUploadStreamOptions,
  BlockBlobParallelUploadOptions
} from '@azure/storage-blob'

export async function UploadCacheStream(
  signedUploadURL: string,
  zipUploadStream: ZipUploadStream
): Promise<{}> {
  let uploadByteCount = 0
  let lastProgressTime = Date.now()
  let timeoutId: NodeJS.Timeout | undefined

  const chunkTimer = (timeout: number): NodeJS.Timeout => {
    // clear the previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      const now = Date.now()
      // if there's been more than 30 seconds since the
      // last progress event, then we'll consider the upload stalled
      if (now - lastProgressTime > timeout) {
        throw new Error('Upload progress stalled.')
      }
    }, timeout)
    return timeoutId
  }

  const maxConcurrency = 32
  const bufferSize = 8 * 1024 * 1024 // 8 MB Chunks
  const blobClient = new BlobClient(signedUploadURL)
  const blockBlobClient = blobClient.getBlockBlobClient()
  const timeoutDuration = 300000 // 30 seconds

  core.debug(
    `Uploading cache zip to blob storage with maxConcurrency: ${maxConcurrency}, bufferSize: ${bufferSize}`
  )

  const uploadCallback = (progress: TransferProgressEvent): void => {
    core.info(`Uploaded bytes ${progress.loadedBytes}`)
    uploadByteCount = progress.loadedBytes
    chunkTimer(timeoutDuration)
    lastProgressTime = Date.now()
  }

  const options: BlockBlobUploadStreamOptions = {
    blobHTTPHeaders: { blobContentType: 'zip' },
    onProgress: uploadCallback
  }

  let sha256Hash: string | undefined = undefined
  const uploadStream = new stream.PassThrough()
  const hashStream = crypto.createHash('sha256')

  zipUploadStream.pipe(uploadStream) // This stream is used for the upload
  zipUploadStream.pipe(hashStream).setEncoding('hex') // This stream is used to compute a hash of the zip content that gets used. Integrity check

  core.info('Beginning upload of cache to blob storage')
  try {
    // Start the chunk timer
    timeoutId = chunkTimer(timeoutDuration)
    await blockBlobClient.uploadStream(
      uploadStream,
      bufferSize,
      maxConcurrency,
      options
    )
  } catch (error) {
    if (NetworkError.isNetworkErrorCode(error?.code)) {
      throw new NetworkError(error?.code)
    }
    throw error
  } finally {
    // clear the timeout whether or not the upload completes
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }

  core.info('Finished uploading cache content to blob storage!')

  hashStream.end()
  sha256Hash = hashStream.read() as string
  core.info(`SHA256 hash of uploaded artifact zip is ${sha256Hash}`)
  core.info(`Uploaded: ${uploadByteCount} bytes`)

  if (uploadByteCount === 0) {
    core.error(
      `No data was uploaded to blob storage. Reported upload byte count is 0.`
    )
  }
  return {
    uploadSize: uploadByteCount,
    sha256Hash
  }
}

export async function UploadCacheFile(
  uploadURL: CreateCacheEntryResponse,
  archivePath: string,
): Promise<{}> {
  core.info(`Uploading ${archivePath} to: ${JSON.stringify(uploadURL)}`)

  // Specify data transfer options
  const uploadOptions: BlockBlobParallelUploadOptions = {
    blockSize: 4 * 1024 * 1024, // 4 MiB max block size
    concurrency: 2, // maximum number of parallel transfer workers
    maxSingleShotSize: 8 * 1024 * 1024, // 8 MiB initial transfer size
  };

  const blobClient: BlobClient = new BlobClient(uploadURL.signedUploadUrl)
  const blockBlobClient: BlockBlobClient = blobClient.getBlockBlobClient()

  core.info(`BlobClient: ${JSON.stringify(blobClient)}`)
  core.info(`blockBlobClient: ${JSON.stringify(blockBlobClient)}`)

  return blockBlobClient.uploadFile(archivePath, uploadOptions);
}