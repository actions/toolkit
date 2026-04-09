import * as io from '../../io/src/io.js'
import * as path from 'path'
import {hashFiles} from '../src/glob.js'
import {promises as fs} from 'fs'

const IS_WINDOWS = process.platform === 'win32'
const ORIGINAL_GITHUB_WORKSPACE = process.env['GITHUB_WORKSPACE']

/**
 * These test focus on the ability of globber to find files
 * and not on the pattern matching aspect
 */
describe('globber', () => {
  beforeAll(async () => {
    await io.rmRF(getTestTemp())
    process.env['GITHUB_WORKSPACE'] = __dirname
  })

  afterAll(async () => {
    if (ORIGINAL_GITHUB_WORKSPACE) {
      process.env['GITHUB_WORKSPACE'] = ORIGINAL_GITHUB_WORKSPACE
    } else {
      delete process.env['GITHUB_WORKSPACE']
    }
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

  const emptyDirectory = ''
  it('followSymbolicLinks set to true', async () => {
    const root = path.join(getTestTemp(), 'set-to-true')
    await fs.mkdir(path.join(root, 'realdir'), {recursive: true})
    await fs.writeFile(path.join(root, 'realdir', 'file'), 'test file content')
    await createSymlinkDir(
      path.join(root, 'realdir'),
      path.join(root, 'symDir')
    )
    const testPath = path.join(root, `symDir`)
    const hash = await hashFiles(testPath, emptyDirectory, {
      followSymbolicLinks: true
    })
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
    const hash = await hashFiles(testPath, emptyDirectory, {
      followSymbolicLinks: false
    })
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

  it('hashes files in allowed roots only', async () => {
    const root = path.join(getTestTemp(), 'roots-hashfiles')
    const dir1 = path.join(root, 'dir1')
    const dir2 = path.join(root, 'dir2')
    await fs.mkdir(dir1, {recursive: true})
    await fs.mkdir(dir2, {recursive: true})
    await fs.writeFile(path.join(dir1, 'file1.txt'), 'test 1 file content')
    await fs.writeFile(path.join(dir2, 'file2.txt'), 'test 2 file content')

    const broadPattern = `${root}/**`

    const hashDir1Only = await hashFiles(broadPattern, '', {roots: [dir1]})
    expect(hashDir1Only).not.toEqual('')

    const hashDir2Only = await hashFiles(broadPattern, '', {roots: [dir2]})
    expect(hashDir2Only).not.toEqual('')

    expect(hashDir1Only).not.toEqual(hashDir2Only)

    const hashBoth = await hashFiles(broadPattern, '', {roots: [dir1, dir2]})
    expect(hashBoth).not.toEqual(hashDir1Only)
    expect(hashBoth).not.toEqual(hashDir2Only)

    const hashDir1Again = await hashFiles(broadPattern, '', {roots: [dir1]})
    expect(hashDir1Again).toEqual(hashDir1Only)
  })

  it('skips outside-root matches by default (hash unchanged)', async () => {
    const root = path.join(getTestTemp(), 'default-skip-outside-roots')
    const dir1 = path.join(root, 'dir1')
    const outsideDir = path.join(root, 'outsideDir')

    await fs.mkdir(dir1, {recursive: true})
    await fs.mkdir(outsideDir, {recursive: true})

    await fs.writeFile(path.join(dir1, 'file1.txt'), 'test 1 file content')
    await fs.writeFile(
      path.join(outsideDir, 'fileOut.txt'),
      'test outside file content'
    )

    const insideOnly = await hashFiles(`${dir1}/*`, '', {roots: [dir1]})
    expect(insideOnly).not.toEqual('')

    const patterns = `${dir1}/*\n${outsideDir}/*`
    const defaultSkip = await hashFiles(patterns, '', {roots: [dir1]})

    expect(defaultSkip).toEqual(insideOnly)
  })

  it('allows files outside roots if opted-in (hash changes)', async () => {
    const root = path.join(getTestTemp(), 'allow-outside-roots')
    const dir1 = path.join(root, 'dir1')
    const outsideDir = path.join(root, 'outsideDir')
    await fs.mkdir(dir1, {recursive: true})
    await fs.mkdir(outsideDir, {recursive: true})
    await fs.writeFile(path.join(dir1, 'file1.txt'), 'test 1 file content')
    await fs.writeFile(
      path.join(outsideDir, 'fileOut.txt'),
      'test outside file content'
    )

    const insideOnly = await hashFiles(`${dir1}/*`, '', {roots: [dir1]})
    expect(insideOnly).not.toEqual('')

    const patterns = `${dir1}/*\n${outsideDir}/*`
    const withOptIn1 = await hashFiles(patterns, '', {
      roots: [dir1],
      allowFilesOutsideWorkspace: true
    })
    expect(withOptIn1).not.toEqual('')
    expect(withOptIn1).not.toEqual(insideOnly)

    const withOptIn2 = await hashFiles(patterns, '', {
      roots: [dir1],
      allowFilesOutsideWorkspace: true
    })
    expect(withOptIn2).toEqual(withOptIn1)
  })

  it('excludes files matching exclude patterns', async () => {
    const root = path.join(getTestTemp(), 'exclude-hashfiles')
    await fs.mkdir(root, {recursive: true})
    await fs.writeFile(path.join(root, 'file1.txt'), 'test 1 file content')
    await fs.writeFile(path.join(root, 'file2.log'), 'test 2 file content')

    const all = await hashFiles(`${root}/*`, '', {roots: [root]})
    expect(all).not.toEqual('')

    // Exclude by exact filename and extension
    const excluded = await hashFiles(`${root}/*`, '', {
      roots: [root],
      exclude: ['file2.log', '*.log']
    })
    expect(excluded).not.toEqual('')

    const justIncluded = await hashFiles(
      `${path.join(root, 'file1.txt')}`,
      '',
      {
        roots: [root]
      }
    )

    expect(excluded).toEqual(justIncluded)
    expect(excluded).not.toEqual(all)
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
