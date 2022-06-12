import * as core from '@actions/core'
import * as tmp from 'tmp-promise'
import * as path from 'path'
import * as io from '../../io/src/io'
import {promises as fs} from 'fs'
import {createGZipFileOnDisk} from '../src/internal/upload-gzip'

const root = path.join(__dirname, '_temp', 'upload-gzip')
const tempGzipFilePath = path.join(root, 'file1.gzip')
const tempZipFilePath = path.join(root, 'file2.zip')
const tempTarlzFilePath = path.join(root, 'file3.tar.lz')
const tempGzFilePath = path.join(root, 'file4.tar.gz')
const tempBz2FilePath = path.join(root, 'file5.tar.bz2')
const temp7zFilePath = path.join(root, 'file6.7z')
const tempNormalFilePath = path.join(root, 'file6.txt')

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
  await fs.writeFile(tempGzipFilePath, 'a file with a .gzip file extension')
  await fs.writeFile(tempZipFilePath, 'a file with a .zip file extension')
  await fs.writeFile(tempTarlzFilePath, 'a file with a tar.lz file extension')
  await fs.writeFile(tempGzFilePath, 'a file with a gz file file extension')
  await fs.writeFile(tempBz2FilePath, 'a file with a .bz2 file extension')
  await fs.writeFile(temp7zFilePath, 'a file with a .7z file extension')
  await fs.writeFile(tempNormalFilePath, 'a file with a .txt file extension')
})

test('Number.MAX_SAFE_INTEGER is returned when an existing compressed file is used', async () => {
  // create temporary file
  const tempFile = await tmp.file()

  expect(await createGZipFileOnDisk(tempGzipFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempZipFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempTarlzFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempGzFilePath, tempFile.path)).toEqual(
    Number.MAX_SAFE_INTEGER
  )
  expect(await createGZipFileOnDisk(tempBz2FilePath, tempFile.path)).toEqual(
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
