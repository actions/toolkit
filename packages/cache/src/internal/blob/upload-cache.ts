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
  // TODO: tighten the configuration and pass the appropriate user-agent
  // Specify data transfer options
  const uploadOptions: BlockBlobParallelUploadOptions = {
    blockSize: 4 * 1024 * 1024, // 4 MiB max block size
    concurrency: 4, // maximum number of parallel transfer workers
    maxSingleShotSize: 8 * 1024 * 1024 // 8 MiB initial transfer size
  }

  const blobClient: BlobClient = new BlobClient(signedUploadURL)
  const blockBlobClient: BlockBlobClient = blobClient.getBlockBlobClient()

  core.debug(`BlobClient: ${JSON.stringify(blobClient)}`)
  core.debug(`blockBlobClient: ${JSON.stringify(blockBlobClient)}`)

  return blockBlobClient.uploadFile(archivePath, uploadOptions)
}
