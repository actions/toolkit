import {BlobClient, BlockBlobUploadStreamOptions} from '@azure/storage-blob'
import {TransferProgressEvent} from '@azure/core-http'
import {ZipUploadStream} from './zip'
import {getUploadChunkSize} from '../shared/config'
import * as core from '@actions/core'

export interface BlobUploadResponse {
  /**
   * If the upload was successful or not
   */
  isSuccess: boolean

  /**
   * The total reported upload size in bytes. Empty if the upload failed
   */
  uploadSize?: number
}

export async function uploadZipToBlobStorage(
  authenticatedUploadURL: string,
  zipUploadStream: ZipUploadStream
): Promise<BlobUploadResponse> {
  let uploadByteCount = 0

  const maxBuffers = 5
  const bufferSize = getUploadChunkSize()
  const blobClient = new BlobClient(authenticatedUploadURL)
  const blockBlobClient = blobClient.getBlockBlobClient()

  core.debug(
    `Uploading artifact zip to blob storage with maxBuffers: ${maxBuffers}, bufferSize: ${bufferSize}`
  )

  const uploadCallback = (progress: TransferProgressEvent): void => {
    core.info(`Uploaded bytes ${progress.loadedBytes}`)
    uploadByteCount = progress.loadedBytes
  }

  const options: BlockBlobUploadStreamOptions = {
    blobHTTPHeaders: {blobContentType: 'zip'},
    onProgress: uploadCallback
  }

  try {
    await blockBlobClient.uploadStream(
      zipUploadStream,
      bufferSize,
      maxBuffers,
      options
    )
  } catch (error) {
    core.info(`Failed to upload artifact zip to blob storage, error: ${error}`)
    return {
      isSuccess: false
    }
  }
  core.info(
    `Successfully uploaded all artifact file content. Total reported size: ${uploadByteCount}`
  )

  return {
    isSuccess: true,
    uploadSize: uploadByteCount
  }
}
