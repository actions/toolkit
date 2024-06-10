import * as core from '@actions/core'
import {GetCacheBlobUploadURLResponse} from '../../../generated/results/api/v1/blobcache'
import {BlobClient, BlockBlobParallelUploadOptions} from '@azure/storage-blob'

export async function UploadCache(
  uploadURL: GetCacheBlobUploadURLResponse,
  archivePath: string,
): Promise<{}> {
  core.debug(`Uploading cache to: ${uploadURL}`)
  
  // Specify data transfer options
  const uploadOptions: BlockBlobParallelUploadOptions = {
    blockSize: 4 * 1024 * 1024, // 4 MiB max block size
    concurrency: 2, // maximum number of parallel transfer workers
    maxSingleShotSize: 8 * 1024 * 1024, // 8 MiB initial transfer size
  };

  // Create blob client from container client
  const blobClient: BlobClient = new BlobClient(uploadURL.urls[0])

  return blobClient.uploadFile(archivePath, uploadOptions);
}