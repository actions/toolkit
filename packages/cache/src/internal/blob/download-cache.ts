import * as core from '@actions/core'

import {
  BlobClient,
  BlockBlobClient,
  BlobDownloadOptions
} from '@azure/storage-blob'

export async function DownloadCacheFile(
  signedUploadURL: string,
  archivePath: string
): Promise<{}> {
  const downloadOptions: BlobDownloadOptions = {
    maxRetryRequests: 5
  }

  // TODO: tighten the configuration and pass the appropriate user-agent
  const blobClient: BlobClient = new BlobClient(signedUploadURL)
  const blockBlobClient: BlockBlobClient = blobClient.getBlockBlobClient()

  core.debug(`BlobClient: ${JSON.stringify(blobClient)}`)
  core.debug(`blockBlobClient: ${JSON.stringify(blockBlobClient)}`)

  return blockBlobClient.downloadToFile(
    archivePath,
    0,
    undefined,
    downloadOptions
  )
}
