import * as core from '@actions/core'

import {
  BlobClient,
  BlockBlobClient,
  BlobDownloadOptions
} from '@azure/storage-blob'

export async function downloadCacheFile(
  signedUploadURL: string,
  archivePath: string
): Promise<{}> {
  const downloadOptions: BlobDownloadOptions = {
    maxRetryRequests: 5
  }

  const blobClient: BlobClient = new BlobClient(signedUploadURL)
  const blockBlobClient: BlockBlobClient = blobClient.getBlockBlobClient()

  core.debug(
    `BlobClient: ${blobClient.name}:${blobClient.accountName}:${blobClient.containerName}`
  )

  return blockBlobClient.downloadToFile(
    archivePath,
    0,
    undefined,
    downloadOptions
  )
}
