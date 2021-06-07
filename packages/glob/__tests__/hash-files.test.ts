import * as io from '../../io/src/io'
import * as path from 'path'
import {hashFiles} from '../src/glob'
import {promises as fs} from 'fs'

const IS_WINDOWS = process.platform === 'win32'

/**
 * These test focus on the ability of globber to find files
 * and not on the pattern matching aspect
 */
describe('globber', () => {
  beforeAll(async () => {
    await io.rmRF(getTestTemp())
  })

  it('basic hashfiles test', async () => {
    const root = path.join(getTestTemp(), 'basic-hashfiles')
    await fs.mkdir(path.join(root), {recursive: true})
    await fs.writeFile(path.join(root, 'test.txt'), 'test file content')
    const hash = await hashFiles(`${root}/*`)
    expect(hash).toEqual(
      'd8a411e8f8643821bed189e627ff57151918aa554c00c10b31c693ab2dded273'
    )
  })

  it('basic hashfiles no match should return empty string', async () => {
    const root = path.join(getTestTemp(), 'empty-hashfiles')
    const hash = await hashFiles(`${root}/*`)
    expect(hash).toEqual('')
  })

  it('followSymbolicLinks defaults to true', async () => {
    const root = path.join(
      getTestTemp(),
      'defaults-to-follow-symbolic-links-true'
    )
    await fs.mkdir(path.join(root, 'realdir'), {recursive: true})
    await fs.writeFile(
      path.join(root, 'realdir', 'file.txt'),
      'test file content'
    )
    await createSymlinkDir(
      path.join(root, 'realdir'),
      path.join(root, 'symDir')
    )
    const testPath = path.join(root, `symDir`)
    const hash = await hashFiles(testPath)
    expect(hash).toEqual(
      'd8a411e8f8643821bed189e627ff57151918aa554c00c10b31c693ab2dded273'
    )
  })

  it('followSymbolicLinks set to true', async () => {
    const root = path.join(getTestTemp(), 'set-to-true')
    await fs.mkdir(path.join(root, 'realdir'), {recursive: true})
    await fs.writeFile(path.join(root, 'realdir', 'file'), 'test file content')
    await createSymlinkDir(
      path.join(root, 'realdir'),
      path.join(root, 'symDir')
    )
    const testPath = path.join(root, `symDir`)
    const hash = await hashFiles(testPath, {followSymbolicLinks: true})
    expect(hash).toEqual(
      'd8a411e8f8643821bed189e627ff57151918aa554c00c10b31c693ab2dded273'
    )
  })

  it('followSymbolicLinks set to false', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/folder-a
    //   <root>/folder-a/file
    //   <root>/symDir -> <root>/folder-a
    const root = path.join(getTestTemp(), 'set-to-false')
    await fs.mkdir(path.join(root, 'realdir'), {recursive: true})
    await fs.writeFile(path.join(root, 'realdir', 'file'), 'test file content')
    await createSymlinkDir(
      path.join(root, 'realdir'),
      path.join(root, 'symDir')
    )
    const testPath = path.join(root, 'symdir')
    const hash = await hashFiles(testPath, {followSymbolicLinks: false})
    expect(hash).toEqual('')
  })

  it('multipath test basic', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/folder-a
    //   <root>/folder-a/file
    //   <root>/symDir -> <root>/folder-a
    const root = path.join(getTestTemp(), 'set-to-false')
    await fs.mkdir(path.join(root, 'dir1'), {recursive: true})
    await fs.mkdir(path.join(root, 'dir2'), {recursive: true})
    await fs.writeFile(
      path.join(root, 'dir1', 'testfile1.txt'),
      'test file content'
    )
    await fs.writeFile(
      path.join(root, 'dir2', 'testfile2.txt'),
      'test file content'
    )
    const testPath = `${path.join(root, 'dir1')}\n${path.join(root, 'dir2')}`
    const hash = await hashFiles(testPath)
    expect(hash).toEqual(
      '4e911ea5824830b6a3ec096c7833d5af8381c189ffaa825c3503a5333a73eadc'
    )
  })
})

function getTestTemp(): string {
  return path.join(__dirname, '_temp', 'hash_files')
}

/**
 * Creates a symlink directory on OSX/Linux, and a junction point directory on Windows.
 * A symlink directory is not created on Windows since it requires an elevated context.
 */
async function createSymlinkDir(real: string, link: string): Promise<void> {
  if (IS_WINDOWS) {
    await fs.symlink(real, link, 'junction')
  } else {
    await fs.symlink(real, link)
  }
}
