import * as core from '@actions/core'
import {
  BlobClient,
  BlobUploadCommonResponse,
  BlockBlobClient,
  BlockBlobParallelUploadOptions
} from '@azure/storage-blob'
import {InvalidResponseError} from './shared/errors'
import {UploadOptions} from '../options'

export async function uploadCacheArchiveSDK(
  signedUploadURL: string,
  archivePath: string,
  options?: UploadOptions
): Promise<BlobUploadCommonResponse> {
  // Specify data transfer options
  const uploadOptions: BlockBlobParallelUploadOptions = {
    blockSize: options?.uploadChunkSize,
    concurrency: options?.uploadConcurrency, // maximum number of parallel transfer workers
    maxSingleShotSize: 128 * 1024 * 1024 // 128 MiB initial transfer size
  }

  const blobClient: BlobClient = new BlobClient(signedUploadURL)
  const blockBlobClient: BlockBlobClient = blobClient.getBlockBlobClient()

  core.debug(
    `BlobClient: ${blobClient.name}:${blobClient.accountName}:${blobClient.containerName}`
  )

  const resp = await blockBlobClient.uploadFile(archivePath, uploadOptions)

  if (resp._response.status >= 400) {
    throw new InvalidResponseError(
      `Upload failed with status code ${resp._response.status}`
    )
  }

  return resp
}
