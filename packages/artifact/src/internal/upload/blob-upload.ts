import {BlobClient, BlockBlobUploadStreamOptions} from '@azure/storage-blob'
import {TransferProgressEvent} from '@azure/core-http'
import {ZipUploadStream} from './zip'
import {getUploadChunkSize, getConcurrency} from '../shared/config'
import * as core from '@actions/core'
import * as crypto from 'crypto'
import * as stream from 'stream'
import nock from 'nock'
import {NetworkError} from '../shared/errors'

export const DEFAULT_ERROR_NUMBER = 7
export const ERROR_TYPES = [
  'fetchError',
  'abortError',
  'securityError',
  'notAllowedError',
  'quotaExceededError'
]
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
export async function sendSimulatedError(
  simulatedError: number,
  authenticatedUploadURL: string
): Promise<void> {
  switch (simulatedError) {
    case 0: {
      nock(authenticatedUploadURL).get('/').replyWithError({
        code: 'ECONNRESET',
        message: 'socket hang up'
      })
      break
    }
    case 1: {
      const controller = new AbortController()
      controller.abort()
      break
    }
    case 2: {
      nock(authenticatedUploadURL).get('/').replyWithError({
        code: 'ETIMEDOUT'
      })
      break
    }
    case 3: {
      nock(authenticatedUploadURL).get('/').reply(403)
      break
    }
    case 4: {
      nock(authenticatedUploadURL).get('/').reply(405)
      break
    }
    case 5: {
      nock(authenticatedUploadURL).get('/').reply(429)
      break
    }
    case 6: {
      const rand = Math.floor(Math.random() * ERROR_TYPES.length)
      sendSimulatedError(rand, authenticatedUploadURL)
      break
    }
    case 7: {
      core.info('no error selected')
      break
    }
    default:
      core.error('something went wrong')
  }
}
export async function uploadZipToBlobStorage(
  authenticatedUploadURL: string,
  zipUploadStream: ZipUploadStream,
  simulatedError: number = DEFAULT_ERROR_NUMBER
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
    if (progress.loadedBytes > 1) {
      sendSimulatedError(simulatedError, authenticatedUploadURL)
    }
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

  return {
    uploadSize: uploadByteCount,
    sha256Hash
  }
}
