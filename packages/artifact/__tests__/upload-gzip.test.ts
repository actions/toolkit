import * as core from '@actions/core'
import * as tmp from 'tmp-promise'
import * as path from 'path'
import * as io from '../../io/src/io'
import {promises as fs} from 'fs'
import {createGZipFileOnDisk} from '../src/internal/upload-gzip'

const root = path.join(__dirname, '_temp', 'upload-gzip')
const tempGzFilePath = path.join(root, 'file.gz')
const tempGzipFilePath = path.join(root, 'file.gzip')
const tempTgzFilePath = path.join(root, 'file.tgz')
const tempTazFilePath = path.join(root, 'file.taz')
const tempZFilePath = path.join(root, 'file.Z')
const tempTaZFilePath = path.join(root, 'file.taZ')
const tempBz2FilePath = path.join(root, 'file.bz2')
const tempTbzFilePath = path.join(root, 'file.tbz')
const tempTbz2FilePath = path.join(root, 'file.tbz2')
const tempTz2FilePath = path.join(root, 'file.tz2')
const tempLzFilePath = path.join(root, 'file.lz')
const tempLzmaFilePath = path.join(root, 'file.lzma')
const tempTlzFilePath = path.join(root, 'file.tlz')
const tempLzoFilePath = path.join(root, 'file.lzo')
const tempXzFilePath = path.join(root, 'file.xz')
const tempTxzFilePath = path.join(root, 'file.txz')
const tempZstFilePath = path.join(root, 'file.zst')
const tempZstdFilePath = path.join(root, 'file.zstd')
const tempTzstFilePath = path.join(root, 'file.tzst')
const tempZipFilePath = path.join(root, 'file.zip')
const temp7zFilePath = path.join(root, 'file.7z')
const tempNormalFilePath = path.join(root, 'file.txt')

jest.mock('../src/internal/config-variables')

beforeAll(async () => {
  // mock all output so that there is less noise when running tests
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(core, 'debug').mockImplementation(() => {})
  jest.spyOn(core, 'info').mockImplementation(() => {})
  jest.spyOn(core, 'warning').mockImplementation(() => {})
  jest.spyOn(core, 'error').mockImplementation(() => {})

  // clear temp directory and create files that will be "uploaded"
  await io.rmRF(root)
  await fs.mkdir(path.join(root))
  await fs.writeFile(tempGzFilePath, 'a file with a .gz file extension')
  await fs.writeFile(tempGzipFilePath, 'a file with a .gzip file extension')
  await fs.writeFile(tempTgzFilePath, 'a file with a .tgz file extension')
  await fs.writeFile(tempTazFilePath, 'a file with a .taz file extension')
  await fs.writeFile(tempZFilePath, 'a file with a .Z file extension')
  await fs.writeFile(tempTaZFilePath, 'a file with a .taZ file extension')
  await fs.writeFile(tempBz2FilePath, 'a file with a .bz2 file extension')
  await fs.writeFile(tempTbzFilePath, 'a file with a .tbz file extension')
  await fs.writeFile(tempTbz2FilePath, 'a file with a .tbz2 file extension')
  await fs.writeFile(tempTz2FilePath, 'a file with a .tz2 file extension')
  await fs.writeFile(tempLzFilePath, 'a file with a .lz file extension')
  await fs.writeFile(tempLzmaFilePath, 'a file with a .lzma file extension')
  await fs.writeFile(tempTlzFilePath, 'a file with a .tlz file extension')
  await fs.writeFile(tempLzoFilePath, 'a file with a .lzo file extension')
  await fs.writeFile(tempXzFilePath, 'a file with a .xz file extension')
  await fs.writeFile(tempTxzFilePath, 'a file with a .txz file extension')
  await fs.writeFile(tempZstFilePath, 'a file with a .zst file extension')
  await fs.writeFile(tempZstdFilePath, 'a file with a .zstd file extension')
  await fs.writeFile(tempTzstFilePath, 'a file with a .tzst file extension')
  await fs.writeFile(tempZipFilePath, 'a file with a .zip file extension')
  await fs.writeFile(temp7zFilePath, 'a file with a .7z file extension')
  await fs.writeFile(tempNormalFilePath, 'a file with a .txt file extension')
})

test('Number.MAX_SAFE_INTEGER is returned when an existing compressed file is used', async () => {
  // create temporary file
  const tempFile = await tmp.file()

  expect(await createGZipFileOnDisk(tempGzFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempGzipFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempTgzFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempTazFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempZFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempTaZFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempBz2FilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempTbzFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempTbz2FilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempTz2FilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempLzFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempLzmaFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempTlzFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempLzoFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempXzFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempTxzFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempZstFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempZstdFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempTzstFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempZipFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(temp7zFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(
    await createGZipFileOnDisk(tempNormalFilePath, tempFile.path)
  ).not.toEqual(Number.MAX_SAFE_INTEGER)
})

test('gzip file on disk gets successfully created', async () => {
  // create temporary file
  const tempFile = await tmp.file()

  const gzipFileSize = await createGZipFileOnDisk(
    tempNormalFilePath,
    tempFile.path
  )
  const fileStat = await fs.stat(tempNormalFilePath)
  const totalFileSize = fileStat.size

  // original file and gzip file should not be equal in size
  expect(gzipFileSize).not.toEqual(totalFileSize)
})
