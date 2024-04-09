import {BlobClient, BlockBlobUploadStreamOptions} from '@azure/storage-blob'
import {TransferProgressEvent} from '@azure/core-http'
import {ZipUploadStream} from './zip'
import {getUploadChunkSize, getConcurrency} from '../shared/config'
import * as core from '@actions/core'
import * as crypto from 'crypto'
import * as stream from 'stream'
import {NetworkError} from '../shared/errors'

export interface BlobUploadResponse {
  /**
   * The total reported upload size in bytes. Empty if the upload failed
   */
  uploadSize?: number

  /**
   * The SHA256 hash of the uploaded file. Empty if the upload failed
   */
  sha256Hash?: string
}

export async function uploadZipToBlobStorage(
  authenticatedUploadURL: string,
  zipUploadStream: ZipUploadStream
): Promise<BlobUploadResponse> {
  let uploadByteCount = 0
  const lastProgressTime = Date.now()

  const maxConcurrency = getConcurrency()
  const bufferSize = getUploadChunkSize()
  const blobClient = new BlobClient(authenticatedUploadURL)
  const blockBlobClient = blobClient.getBlockBlobClient()
  const timeoutDuration = 300000 // 30 seconds

  core.debug(
    `Uploading artifact zip to blob storage with maxConcurrency: ${maxConcurrency}, bufferSize: ${bufferSize}`
  )

  const uploadCallback = (progress: TransferProgressEvent): void => {
    core.info(`Uploaded bytes ${progress.loadedBytes}`)
    uploadByteCount = progress.loadedBytes
    progressTimeout(timeoutDuration)
  }

  // Timeout if the upload stalls
  const progressTimeout = (timeout: number): NodeJS.Timeout =>
    setTimeout(() => {
      const now = Date.now()
      // if there's been more than 30 seconds since the
      // last progress event, then we'll consider the upload stalled
      if (now - lastProgressTime > timeout) {
        throw new Error('Upload progress stalled.')
      }
    }, timeout)
  const options: BlockBlobUploadStreamOptions = {
    blobHTTPHeaders: {blobContentType: 'zip'},
    onProgress: uploadCallback
  }

  let sha256Hash: string | undefined = undefined
  const uploadStream = new stream.PassThrough()
  const hashStream = crypto.createHash('sha256')

  zipUploadStream.pipe(uploadStream) // This stream is used for the upload
  zipUploadStream.pipe(hashStream).setEncoding('hex') // This stream is used to compute a hash of the zip content that gets used. Integrity check

  core.info('Beginning upload of artifact content to blob storage')

  try {
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
  }

  core.info('Finished uploading artifact content to blob storage!')

  hashStream.end()
  sha256Hash = hashStream.read() as string
  core.info(`SHA256 hash of uploaded artifact zip is ${sha256Hash}`)

  if (uploadByteCount === 0) {
    core.warning(
      `No data was uploaded to blob storage. Reported upload byte count is 0.`
    )
  }

  // clear the progress timeout when upload completes
  clearTimeout(progressTimeout(timeoutDuration))
  return {
    uploadSize: uploadByteCount,
    sha256Hash
  }
}
