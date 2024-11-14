import * as core from '@actions/core'
import {
  BlobClient,
  BlockBlobClient,
  BlockBlobParallelUploadOptions
} from '@azure/storage-blob'

export async function UploadCacheFile(
  signedUploadURL: string,
  archivePath: string
): Promise<{}> {
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

  return blockBlobClient.uploadFile(archivePath, uploadOptions)
}
