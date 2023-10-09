import fs from 'fs'
import {ArchiveType} from './types'

const MAX_READ_SIZE = 4096
const MAX_CHUNK_SIZE = 1024

const SIGNATURES = {
  zip: '504b0304',
  gz: '1f8b08',
  bz2: '425a68',
  xz: 'fd377a585a00',
  '7z': '377abcaf271c',
  xar: '78617221', // 'xar!' in hex
  tar: '7573746172' // 'ustar' in hex
} as const

const getArchiveTypeFromBuffer = (buffer: Buffer): ArchiveType | null => {
  for (const [type, signature] of Object.entries(SIGNATURES)) {
    if (!buffer.toString('hex').includes(signature)) {
      continue
    }

    if (['bz2', 'gz', 'tar', 'xz'].includes(type)) {
      return 'tar'
    }

    return type as ArchiveType
  }

  return null
}

const readStreamFromDescriptor = (fd: number): fs.ReadStream =>
  fs.createReadStream('', {
    fd,
    start: 0,
    end: MAX_READ_SIZE,
    highWaterMark: MAX_CHUNK_SIZE
  })

class LimitedArray<T> {
  private _array: T[] = []
  constructor(private maxLength: number) {}
  push(item: T): void {
    if (this._array.length >= this.maxLength) {
      this._array.shift()
    }

    this._array.push(item)
  }
  get array(): T[] {
    return [...this._array]
  }
}

export const getArchiveType = async (filePath: string): Promise<ArchiveType> =>
  new Promise((resolve, reject) =>
    fs.open(filePath, 'r', (error, fd) => {
      if (fd === undefined) {
        reject(new Error(`Unable to open ${filePath}`))
        return
      }

      if (error) {
        fs.close(fd, () => reject(error))
        return
      }

      const buffers = new LimitedArray<Buffer>(2)
      const readStream = readStreamFromDescriptor(fd)

      const closeEverythingAndResolve = (result: ArchiveType): void => {
        readStream.close()
        fs.close(fd, () => resolve(result as '7z' | 'zip' | 'xar' | 'tar'))
        readStream.push(null)
      }

      const closeEverythingAndReject = (error?: Error): void => {
        readStream.close()
        fs.close(fd, () =>
          reject(error ?? Error('Unable to determine archive type'))
        )
        readStream.push(null)
      }

      setTimeout(closeEverythingAndReject, 100)

      readStream
        .on('data', chunk => {
          if (!(chunk instanceof Buffer)) return closeEverythingAndReject()

          buffers.push(chunk)
          const type = getArchiveTypeFromBuffer(Buffer.concat(buffers.array))

          if (type !== null) {
            return closeEverythingAndResolve(type)
          }
        })
        .on('end', () => closeEverythingAndReject())
        .on('close', () => closeEverythingAndReject())
        .on('error', closeEverythingAndReject)
    })
  )
