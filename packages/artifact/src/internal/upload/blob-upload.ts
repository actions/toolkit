import {BlobClient, BlockBlobUploadStreamOptions} from '@azure/storage-blob'
import {TransferProgressEvent} from '@azure/core-http'
import {ZipUploadStream} from './zip'
import {getUploadChunkSize, getConcurrency} from '../shared/config'
import * as core from '@actions/core'
import * as crypto from 'crypto'
import * as stream from 'stream'

export interface BlobUploadResponse {
  /**
   * If the upload was successful or not
   */
  isSuccess: boolean

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

  const maxConcurrency = getConcurrency()
  const bufferSize = getUploadChunkSize()
  const blobClient = new BlobClient(authenticatedUploadURL)
  const blockBlobClient = blobClient.getBlockBlobClient()

  core.debug(
    `Uploading artifact zip to blob storage with maxConcurrency: ${maxConcurrency}, bufferSize: ${bufferSize}`
  )

  const uploadCallback = (progress: TransferProgressEvent): void => {
    core.info(`Uploaded bytes ${progress.loadedBytes}`)
    uploadByteCount = progress.loadedBytes
  }

  const options: BlockBlobUploadStreamOptions = {
    blobHTTPHeaders: {blobContentType: 'zip'},
    onProgress: uploadCallback
  }

  let sha256Hash: string | undefined = undefined
  const uploadStream = new stream.PassThrough()
  const hashStream = crypto.createHash('sha256')

  zipUploadStream.pipe(uploadStream) // This stream is used for the upload
  zipUploadStream.pipe(hashStream).setEncoding('hex') // This stream is used to compute a hash of the zip content that gets used. Integrity check

  try {
    core.info('Beginning upload of artifact content to blob storage')

    await blockBlobClient.uploadStream(
      uploadStream,
      bufferSize,
      maxConcurrency,
      options
    )

    core.info('Finished uploading artifact content to blob storage!')

    hashStream.end()
    sha256Hash = hashStream.read() as string
    core.info(`SHA256 hash of uploaded artifact zip is ${sha256Hash}`)
  } catch (error) {
    core.warning(
      `Failed to upload artifact zip to blob storage, error: ${error}`
    )
    return {
      isSuccess: false
    }
  }

  if (uploadByteCount === 0) {
    core.warning(
      `No data was uploaded to blob storage. Reported upload byte count is 0`
    )
    return {
      isSuccess: false
    }
  }

  return {
    isSuccess: true,
    uploadSize: uploadByteCount,
    sha256Hash
  }
}
