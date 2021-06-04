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

  it('correctly follows followSymbolicLinks being set', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/folder-a
    //   <root>/folder-a/file
    //   <root>/symDir -> <root>/folder-a
    const root = path.join(
      getTestTemp(),
      'defaults-to-follow-symbolic-links-true'
    )
    await fs.mkdir(path.join(root, 'folder-a'), {recursive: true})
    await createSymlinkDir(
      path.join(root, 'folder-a'),
      path.join(root, 'symDir')
    )
    await fs.writeFile(path.join(root, 'folder-a', 'file'), 'test file content')
    const testPath = path.join(root, 'symdir')
    const hashNoOptions = await hashFiles(testPath)
    const hashSymbolicFalse = await hashFiles(testPath, {
      followSymbolicLinks: false
    })
    const hashSymbolicTrue = await hashFiles(testPath, {
      followSymbolicLinks: true
    })
    expect(hashNoOptions).toEqual(
      'd8a411e8f8643821bed189e627ff57151918aa554c00c10b31c693ab2dded273'
    )
    expect(hashSymbolicFalse).toEqual('')
    expect(hashNoOptions).toEqual(hashSymbolicTrue)
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
