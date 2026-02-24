import * as fs from 'fs'
import * as path from 'path'
import {createRawFileUploadStream} from '../src/internal/upload/stream.js'
import {noopLogs} from './common.js'

const fixtures = {
  testDirectory: path.join(__dirname, '_temp', 'stream-test'),
  testFile: path.join(__dirname, '_temp', 'stream-test', 'test-file.txt'),
  testContent: 'hello stream test'
}

describe('createRawFileUploadStream', () => {
  beforeAll(() => {
    fs.mkdirSync(fixtures.testDirectory, {recursive: true})
    fs.writeFileSync(fixtures.testFile, fixtures.testContent)
  })

  beforeEach(() => {
    noopLogs()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should stream file contents through the upload stream', async () => {
    const uploadStream = await createRawFileUploadStream(fixtures.testFile)

    const chunks: Buffer[] = []
    const result = await new Promise<string>((resolve, reject) => {
      uploadStream.on('data', chunk => chunks.push(Buffer.from(chunk)))
      uploadStream.on('end', () =>
        resolve(Buffer.concat(chunks).toString('utf-8'))
      )
      uploadStream.on('error', reject)
    })

    expect(result).toBe(fixtures.testContent)
  })

  it('should propagate file read errors through the upload stream', async () => {
    const unreadableFile = path.join(fixtures.testDirectory, 'unreadable.txt')
    fs.writeFileSync(unreadableFile, 'secret')
    fs.chmodSync(unreadableFile, 0o000)

    const uploadStream = await createRawFileUploadStream(unreadableFile)

    try {
      await expect(
        new Promise((resolve, reject) => {
          uploadStream.on('data', resolve)
          uploadStream.on('end', resolve)
          uploadStream.on('error', reject)
        })
      ).rejects.toThrow(
        'An error has occurred during file read for the artifact'
      )
    } finally {
      // Restore permissions so cleanup can delete the file
      fs.chmodSync(unreadableFile, 0o644)
      fs.unlinkSync(unreadableFile)
    }
  })
})
