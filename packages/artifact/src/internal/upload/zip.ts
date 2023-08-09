import * as stream from 'stream'
import * as archiver from 'archiver'
import * as core from '@actions/core'
import {createReadStream} from 'fs'
import {UploadZipSpecification} from './upload-zip-specification'
import {getUploadChunkSize} from '../shared/config'

// Custom stream transformer so we can set the highWaterMark property
// See https://github.com/nodejs/node/issues/8855
export class ZipUploadStream extends stream.Transform {
  constructor(bufferSize: number) {
    super({
      highWaterMark: bufferSize
    })
  }

  _transform(chunk: any, enc: any, cb: any) {
    cb(null, chunk)
  }
}

export async function createZipUploadStream(
  uploadSpecification: UploadZipSpecification[]
): Promise<ZipUploadStream> {
  const zip = archiver.create('zip', {
    zlib: {level: 9} // Sets the compression level.
    // Available options are 0-9
    // 0 => no compression
    // 1 => fastest with low compression
    // 9 => highest compression ratio but the slowest
  })

  // register callbacks for various events during the zip lifecycle
  zip.on('error', zipErrorCallback)
  zip.on('warning', zipWarningCallback)
  zip.on('finish', zipFinishCallback)
  zip.on('end', zipEndCallback)

  for (const file of uploadSpecification) {
    if (file.sourcePath !== null) {
      // Add a normal file to the zip
      zip.append(createReadStream(file.sourcePath), {
        name: file.destinationPath
      })
    } else {
      // Add a directory to the zip
      zip.append('', {name: file.destinationPath})
    }
  }

  const bufferSize = getUploadChunkSize()
  const zipUploadStream = new ZipUploadStream(bufferSize)

  core.debug(
    'Zip write high watermark value ' + zipUploadStream.writableHighWaterMark
  )
  core.debug(
    'Zip read high watermark value ' + zipUploadStream.readableHighWaterMark
  )

  zip.pipe(zipUploadStream)
  zip.finalize()

  return zipUploadStream
}

var zipErrorCallback = function(error: any) {
  core.error('An error has occurred while creating the zip file for upload')
  console.log(error)

  throw new Error('An error has occurred during zip creation for the artifact')
}

var zipWarningCallback = function(error: any) {
  if (error.code === 'ENOENT') {
    core.warning('ENOENT warning during artifact zip creation.')
    console.log(error)
  } else {
    core.warning(
      `A non-blocking warning has occurred during artifact zip creation: ${error.code}`
    )
    console.log(error)
  }
}

var zipFinishCallback = function() {
  core.debug('Zip stream for upload has finished.')
}

var zipEndCallback = function() {
  core.debug('Zip stream for upload has ended.')
}
