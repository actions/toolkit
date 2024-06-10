import * as core from '@actions/core'
import {GetCacheBlobUploadURLResponse} from '../../../generated/results/api/v1/blobcache'
import {BlobClient, BlockBlobClient, BlockBlobParallelUploadOptions} from '@azure/storage-blob'

export async function UploadCache(
  uploadURL: GetCacheBlobUploadURLResponse,
  archivePath: string,
): Promise<{}> {
  core.info(`Uploading ${archivePath} to: ${JSON.stringify(uploadURL)}`)
  
  // Specify data transfer options
  const uploadOptions: BlockBlobParallelUploadOptions = {
    blockSize: 4 * 1024 * 1024, // 4 MiB max block size
    concurrency: 2, // maximum number of parallel transfer workers
    maxSingleShotSize: 8 * 1024 * 1024, // 8 MiB initial transfer size
  };

  // const blobClient: BlobClient = new BlobClient(uploadURL.urls[0])
  const blobClient: BlobClient = new BlobClient(uploadURL.urls[0].url)
  const blockBlobClient: BlockBlobClient = blobClient.getBlockBlobClient()

  core.info(`BlobClient: ${JSON.stringify(blobClient)}`)
  core.info(`blockBlobClient: ${JSON.stringify(blockBlobClient)}`)

  return blockBlobClient.uploadFile(archivePath, uploadOptions);
}