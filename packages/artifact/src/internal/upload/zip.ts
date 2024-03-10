import * as stream from 'stream'
import * as archiver from 'archiver'
import * as core from '@actions/core'
import {createReadStream} from 'fs'
import {UploadZipSpecification} from './upload-zip-specification'
import {getUploadChunkSize} from '../shared/config'

export const DEFAULT_COMPRESSION_LEVEL = 6

// Custom stream transformer so we can set the highWaterMark property
// See https://github.com/nodejs/node/issues/8855
export class ZipUploadStream extends stream.Transform {
  constructor(bufferSize: number) {
    super({
      highWaterMark: bufferSize
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _transform(chunk: any, enc: any, cb: any): void {
    cb(null, chunk)
  }
}

export async function createZipUploadStream(
  uploadSpecification: UploadZipSpecification[],
  compressionLevel: number = DEFAULT_COMPRESSION_LEVEL
): Promise<ZipUploadStream> {
  core.debug(
    `Creating Artifact archive with compressionLevel: ${compressionLevel}`
  )

  const zip = archiver.create('zip', {
    highWaterMark: getUploadChunkSize(),
    zlib: {level: compressionLevel}
  })

  // register callbacks for various events during the zip lifecycle
  zip.on('error', zipErrorCallback)
  zip.on('warning', zipWarningCallback)
  zip.on('finish', zipFinishCallback)
  zip.on('end', zipEndCallback)

  for (const file of uploadSpecification) {
    if (!file.stats.isDirectory()) {
      // Add a normal file to the zip
      zip.append(createReadStream(file.sourcePath), {
        name: file.destinationPath,
        stats: file.stats
      })
    } else {
      // Add a directory to the zip
      zip.append('', {
        name: file.destinationPath,
        stats: file.stats
      })
    }
  }

  const bufferSize = getUploadChunkSize()
  const zipUploadStream = new ZipUploadStream(bufferSize)

  core.debug(
    `Zip write high watermark value ${zipUploadStream.writableHighWaterMark}`
  )
  core.debug(
    `Zip read high watermark value ${zipUploadStream.readableHighWaterMark}`
  )

  zip.pipe(zipUploadStream)
  zip.finalize()

  return zipUploadStream
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const zipErrorCallback = (error: any): void => {
  core.error('An error has occurred while creating the zip file for upload')
  core.info(error)

  throw new Error('An error has occurred during zip creation for the artifact')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const zipWarningCallback = (error: any): void => {
  if (error.code === 'ENOENT') {
    core.warning(
      'ENOENT warning during artifact zip creation. No such file or directory'
    )
    core.info(error)
  } else {
    core.warning(
      `A non-blocking warning has occurred during artifact zip creation: ${error.code}`
    )
    core.info(error)
  }
}

const zipFinishCallback = (): void => {
  core.debug('Zip stream for upload has finished.')
}

const zipEndCallback = (): void => {
  core.debug('Zip stream for upload has ended.')
}
