import * as stream from 'stream'
import * as ZipStream from 'zip-stream'
import * as core from '@actions/core'
import async from 'async'
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

  const zlibOptions = {
    zlib: {
      level: compressionLevel,
      bufferSize: getUploadChunkSize()
    }
  }
  const zip = new ZipStream.default(zlibOptions)

  const bufferSize = getUploadChunkSize()
  const zipUploadStream = new ZipUploadStream(bufferSize)
  zip.pipe(zipUploadStream)
  // register callbacks for various events during the zip lifecycle
  zip.on('error', zipErrorCallback)
  zip.on('warning', zipWarningCallback)
  zip.on('finish', zipFinishCallback)
  zip.on('end', zipEndCallback)

  const addFileToZip = (
    file: UploadZipSpecification,
    callback: (error?: Error) => void
  ): void => {
    if (file.sourcePath !== null) {
      zip.entry(
        createReadStream(file.sourcePath),
        {name: file.destinationPath},
        (error: unknown) => {
          if (error) {
            callback(error as Error) // Cast the error object to the Error type
            return
          }
          callback()
        }
      )
    } else {
      zip.entry('', {name: file.destinationPath}, (error: unknown) => {
        if (error) {
          callback(error as Error)
          return
        }
        callback()
      })
    }
  }

  async.eachSeries(uploadSpecification, addFileToZip, (error: unknown) => {
    if (error) {
      core.error('Failed to add a file to the zip:')
      core.info(error.toString()) // Convert error to string
      return
    }
    zip.finalize() // Finalize the archive once all files have been added
  })

  core.debug(
    `Zip write high watermark value ${zipUploadStream.writableHighWaterMark}`
  )
  core.debug(
    `Zip read high watermark value ${zipUploadStream.readableHighWaterMark}`
  )

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
