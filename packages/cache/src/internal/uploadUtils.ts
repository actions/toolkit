import * as core from '@actions/core'
import {
  BlobClient,
  BlobUploadCommonResponse,
  BlockBlobClient,
  BlockBlobParallelUploadOptions
} from '@azure/storage-blob'
import {InvalidResponseError} from './shared/errors'

export async function uploadCacheArchiveSDK(
  signedUploadURL: string,
  archivePath: string
): Promise<BlobUploadCommonResponse> {
  // Specify data transfer options
  const uploadOptions: BlockBlobParallelUploadOptions = {
    blockSize: 4 * 1024 * 1024, // 4 MiB max block size
    concurrency: 4, // maximum number of parallel transfer workers
    maxSingleShotSize: 8 * 1024 * 1024 // 8 MiB initial transfer size
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
