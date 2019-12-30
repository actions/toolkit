import * as child from 'child_process'
import * as glob from '../src/glob'
import * as io from '../../io/src/io'
import * as path from 'path'
import {promises as fs} from 'fs'

const IS_WINDOWS = process.platform === 'win32'

/**
 * These test focus on the ability of glob to find files
 * and not on the pattern matching aspect
 */
describe('glob', () => {
  beforeAll(async () => {
    await io.rmRF(getTestTemp())
  })

  it('detects cycle', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/file
    //   <root>/symDir -> <root>
    const root = path.join(getTestTemp(), 'detects-cycle')
    await fs.mkdir(root, {recursive: true})
    await fs.writeFile(path.join(root, 'file'), 'test file content')
    await createSymlinkDir(root, path.join(root, 'symDir'))

    const itemPaths = await glob.glob(root)
    expect(itemPaths).toEqual([root, path.join(root, 'file')])
    // todo: ? expect(itemPaths[2]).toBe(path.join(root, 'symDir'))
  })

  it('detects deep cycle starting from middle', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/file-under-root
    //   <root>/folder-a
    //   <root>/folder-a/file-under-a
    //   <root>/folder-a/folder-b
    //   <root>/folder-a/folder-b/file-under-b
    //   <root>/folder-a/folder-b/folder-c
    //   <root>/folder-a/folder-b/folder-c/file-under-c
    //   <root>/folder-a/folder-b/folder-c/sym-folder -> <root>
    const root = path.join(
      getTestTemp(),
      'detects-deep-cycle-starting-from-middle'
    )
    await fs.mkdir(path.join(root, 'folder-a', 'folder-b', 'folder-c'), {
      recursive: true
    })
    await fs.writeFile(
      path.join(root, 'file-under-root'),
      'test file under root contents'
    )
    await fs.writeFile(
      path.join(root, 'folder-a', 'file-under-a'),
      'test file under a contents'
    )
    await fs.writeFile(
      path.join(root, 'folder-a', 'folder-b', 'file-under-b'),
      'test file under b contents'
    )
    await fs.writeFile(
      path.join(root, 'folder-a', 'folder-b', 'folder-c', 'file-under-c'),
      'test file under c contents'
    )
    await createSymlinkDir(
      root,
      path.join(root, 'folder-a', 'folder-b', 'folder-c', 'sym-folder')
    )
    await fs.stat(
      path.join(
        root,
        'folder-a',
        'folder-b',
        'folder-c',
        'sym-folder',
        'file-under-root'
      )
    )

    const itemPaths = await glob.glob(path.join(root, 'folder-a', 'folder-b'))
    expect(itemPaths).toEqual([
      path.join(root, 'folder-a', 'folder-b'),
      path.join(root, 'folder-a', 'folder-b', 'file-under-b'),
      path.join(root, 'folder-a', 'folder-b', 'folder-c'),
      path.join(root, 'folder-a', 'folder-b', 'folder-c', 'file-under-c'),
      path.join(root, 'folder-a', 'folder-b', 'folder-c', 'sym-folder'),
      path.join(
        root,
        'folder-a',
        'folder-b',
        'folder-c',
        'sym-folder',
        'file-under-root'
      ),
      path.join(
        root,
        'folder-a',
        'folder-b',
        'folder-c',
        'sym-folder',
        'folder-a'
      ),
      path.join(
        root,
        'folder-a',
        'folder-b',
        'folder-c',
        'sym-folder',
        'folder-a',
        'file-under-a'
      )
    ])
  })

  it('detects cycle starting from symlink', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/file
    //   <root>/symDir -> <root>
    const root: string = path.join(
      getTestTemp(),
      'detects-cycle-starting-from-symlink'
    )
    await fs.mkdir(root, {recursive: true})
    await fs.writeFile(path.join(root, 'file'), 'test file content')
    await createSymlinkDir(root, path.join(root, 'symDir'))
    await fs.stat(path.join(root, 'symDir'))

    const itemPaths = await glob.glob(path.join(root, 'symDir'))
    expect(itemPaths).toEqual([
      path.join(root, 'symDir'),
      path.join(root, 'symDir', 'file')
    ])
    // todo: ? expect(itemPaths[2]).toBe(path.join(root, 'symDir', 'symDir'));
  })

  it('does not follow symlink when followSymbolicLink=false', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/realDir
    //   <root>/realDir/file
    //   <root>/symDir -> <root>/realDir
    const root = path.join(
      getTestTemp(),
      'does-not-follow-symlink-when-follow-false'
    )
    await fs.mkdir(path.join(root, 'realDir'), {recursive: true})
    await fs.writeFile(path.join(root, 'realDir', 'file'), 'test file content')
    await createSymlinkDir(
      path.join(root, 'realDir'),
      path.join(root, 'symDir')
    )

    const itemPaths = await glob.glob(root, {followSymbolicLinks: false})
    expect(itemPaths).toEqual([
      root,
      path.join(root, 'realDir'),
      path.join(root, 'realDir', 'file'),
      path.join(root, 'symDir')
    ])
  })

  it('does not follow symlink when search path is symlink and followSymbolicLink=false', async () => {
    // Create the following layout:
    //   realDir
    //   realDir/file
    //   symDir -> realDir
    const root = path.join(
      getTestTemp(),
      'does-not-follow-symlink-when-search-path-is-symlink-and-follow-false'
    )
    await fs.mkdir(path.join(root, 'realDir'), {recursive: true})
    await fs.writeFile(path.join(root, 'realDir', 'file'), 'test file content')
    await createSymlinkDir(
      path.join(root, 'realDir'),
      path.join(root, 'symDir')
    )

    const itemPaths = await glob.glob(path.join(root, 'symDir'), {
      followSymbolicLinks: false
    })
    expect(itemPaths).toEqual([path.join(root, 'symDir')])
  })

  it('does not return broken symlink', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/brokenSym -> <root>/noSuch
    //   <root>/realDir
    //   <root>/realDir/file
    //   <root>/symDir -> <root>/realDir
    const root = path.join(getTestTemp(), 'does-not-return-broken-symlink')
    await fs.mkdir(root, {recursive: true})
    await createSymlinkDir(
      path.join(root, 'noSuch'),
      path.join(root, 'brokenSym')
    )
    await fs.mkdir(path.join(root, 'realDir'), {recursive: true})
    await fs.writeFile(path.join(root, 'realDir', 'file'), 'test file content')
    await createSymlinkDir(
      path.join(root, 'realDir'),
      path.join(root, 'symDir')
    )

    const itemPaths = await glob.glob(root)
    expect(itemPaths).toEqual([
      root,
      path.join(root, 'realDir'),
      path.join(root, 'realDir', 'file'),
      path.join(root, 'symDir'),
      path.join(root, 'symDir', 'file')
    ])
  })

  it('does not return broken symlink when search path is broken symlink', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/brokenSym -> <root>/noSuch
    const root = path.join(
      getTestTemp(),
      'does-not-return-broken-symlink-when-search-path-is-broken-symlink'
    )
    await fs.mkdir(root, {recursive: true})
    const brokenSymPath = path.join(root, 'brokenSym')
    await createSymlinkDir(path.join(root, 'noSuch'), brokenSymPath)
    await fs.lstat(brokenSymPath)

    const itemPaths = await glob.glob(brokenSymPath)
    expect(itemPaths).toEqual([])
  })

  it('does not search paths that are not partial matches', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/realDir
    //   <root>/realDir/nested
    //   <root>/realDir/nested/file
    //   <root>/realDir2
    //   <root>/realDir2/nested2
    //   <root>/realDir2/nested2/symDir -> <root>/noSuch
    const root = path.join(
      getTestTemp(),
      'does-not-search-paths-that-are-not-partial-matches'
    )
    await fs.mkdir(path.join(root, 'realDir', 'nested'), {recursive: true})
    await fs.writeFile(
      path.join(root, 'realDir', 'nested', 'file'),
      'test file content'
    )
    await fs.mkdir(path.join(root, 'realDir2', 'nested2'), {recursive: true})
    await createSymlinkDir(
      path.join(root, 'noSuch'),
      path.join(root, 'realDir2', 'nested2', 'symDir')
    )

    const options: glob.IGlobOptions = {
      followSymbolicLinks: true,
      omitBrokenSymbolicLinks: false
    }

    // Should throw
    try {
      await glob.glob(`${root}/*Dir*/*nested*/*`, options)
      throw new Error('should not reach here')
    } catch (err) {
      expect(err.message).toMatch(/broken symbolic link/i)
    }

    // Not partial match
    let itemPaths = await glob.glob(`${root}/*Dir/*nested*/*`, options)
    expect(itemPaths).toEqual([path.join(root, 'realDir', 'nested', 'file')])

    // Not partial match
    itemPaths = await glob.glob(`${root}/*Dir*/*nested/*`, options)
    expect(itemPaths).toEqual([path.join(root, 'realDir', 'nested', 'file')])
  })

  it('does not throw for broken symlinks that are not matches or partial matches', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/realDir
    //   <root>/realDir/file
    //   <root>/symDir -> <root>/noSuch
    const root = path.join(
      getTestTemp(),
      'does-not-throw-for-broken-symlinks-that-are-not-matches-or-partial-matches'
    )
    await fs.mkdir(path.join(root, 'realDir'), {recursive: true})
    await fs.writeFile(path.join(root, 'realDir', 'file'), 'test file content')
    await createSymlinkDir(path.join(root, 'noSuch'), path.join(root, 'symDir'))

    const options: glob.IGlobOptions = {
      followSymbolicLinks: true,
      omitBrokenSymbolicLinks: false
    }

    // Match should throw
    try {
      await glob.glob(`${root}/*`, options)
      throw new Error('should not reach here')
    } catch (err) {
      expect(err.message).toMatch(/broken symbolic link/i)
    }

    // Partial match should throw
    try {
      await glob.glob(`${root}/*/*`, options)
      throw new Error('should not reach here')
    } catch (err) {
      expect(err.message).toMatch(/broken symbolic link/i)
    }

    // Not match or partial match
    const itemPaths = await glob.glob(`${root}/*eal*/*`, options)
    expect(itemPaths).toEqual([path.join(root, 'realDir', 'file')])
  })

  it('follows symlink', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/realDir
    //   <root>/realDir/file
    //   <root>/symDir -> <root>/realDir
    const root = path.join(getTestTemp(), 'follows-symlink')
    await fs.mkdir(path.join(root, 'realDir'), {recursive: true})
    await fs.writeFile(path.join(root, 'realDir', 'file'), 'test file content')
    await createSymlinkDir(
      path.join(root, 'realDir'),
      path.join(root, 'symDir')
    )

    const itemPaths = await glob.glob(root)
    expect(itemPaths).toEqual([
      root,
      path.join(root, 'realDir'),
      path.join(root, 'realDir', 'file'),
      path.join(root, 'symDir'),
      path.join(root, 'symDir', 'file')
    ])
  })

  it('follows symlink when search path is symlink', async () => {
    // Create the following layout:
    //   realDir
    //   realDir/file
    //   symDir -> realDir
    const root = path.join(
      getTestTemp(),
      'follows-symlink-when-search-path-is-symlink'
    )
    await fs.mkdir(path.join(root, 'realDir'), {recursive: true})
    await fs.writeFile(path.join(root, 'realDir', 'file'), 'test file content')
    await createSymlinkDir(
      path.join(root, 'realDir'),
      path.join(root, 'symDir')
    )

    const itemPaths = await glob.glob(path.join(root, 'symDir'))
    expect(itemPaths).toEqual([
      path.join(root, 'symDir'),
      path.join(root, 'symDir', 'file')
    ])
  })

  it('returns broken symlink when followSymbolicLinks=false', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/brokenSym -> <root>/noSuch
    //   <root>/realDir
    //   <root>/realDir/file
    //   <root>/symDir -> <root>/realDir
    const root = path.join(
      getTestTemp(),
      'returns-broken-symlink-when-follow-false'
    )
    await fs.mkdir(root, {recursive: true})
    await createSymlinkDir(
      path.join(root, 'noSuch'),
      path.join(root, 'brokenSym')
    )
    await fs.mkdir(path.join(root, 'realDir'), {recursive: true})
    await fs.writeFile(path.join(root, 'realDir', 'file'), 'test file content')
    await createSymlinkDir(
      path.join(root, 'realDir'),
      path.join(root, 'symDir')
    )

    const itemPaths = await glob.glob(root, {followSymbolicLinks: false})
    expect(itemPaths).toEqual([
      root,
      path.join(root, 'brokenSym'),
      path.join(root, 'realDir'),
      path.join(root, 'realDir', 'file'),
      path.join(root, 'symDir')
    ])
  })

  it('returns broken symlink when search path is broken symlink and followSymbolicLinks=false', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/brokenSym -> <root>/noSuch
    const root = path.join(
      getTestTemp(),
      'returns-broken-symlink-when-search-path-is-broken-symlink-and-follow-false'
    )
    await fs.mkdir(root, {recursive: true})
    const brokenSymPath = path.join(root, 'brokenSym')
    await createSymlinkDir(path.join(root, 'noSuch'), brokenSymPath)

    const itemPaths = await glob.glob(brokenSymPath, {
      followSymbolicLinks: false
    })
    expect(itemPaths).toEqual([brokenSymPath])
  })

  it('returns depth first', async () => {
    // Create the following layout:
    //   <root>/a-file
    //   <root>/b-folder
    //   <root>/b-folder/a-file
    //   <root>/b-folder/b-folder
    //   <root>/b-folder/b-folder/file
    //   <root>/b-folder/c-file
    //   <root>/c-file
    const root = path.join(getTestTemp(), 'returns-depth-first')
    await fs.mkdir(path.join(root, 'b-folder', 'b-folder'), {recursive: true})
    await fs.writeFile(path.join(root, 'a-file'), 'test a-file content')
    await fs.writeFile(
      path.join(root, 'b-folder', 'a-file'),
      'test b-folder/a-file content'
    )
    await fs.writeFile(
      path.join(root, 'b-folder', 'b-folder', 'file'),
      'test b-folder/b-folder/file content'
    )
    await fs.writeFile(
      path.join(root, 'b-folder', 'c-file'),
      'test b-folder/c-file content'
    )
    await fs.writeFile(path.join(root, 'c-file'), 'test c-file content')

    const itemPaths = await glob.glob(root)
    expect(itemPaths).toEqual([
      root,
      path.join(root, 'a-file'),
      path.join(root, 'b-folder'),
      path.join(root, 'b-folder', 'a-file'),
      path.join(root, 'b-folder', 'b-folder'),
      path.join(root, 'b-folder', 'b-folder', 'file'),
      path.join(root, 'b-folder', 'c-file'),
      path.join(root, 'c-file')
    ])
  })

  it('returns descendants', async () => {
    // Create the following layout:
    //   <root>/file-1
    //   <root>/dir-1
    //   <root>/dir-1/file-2
    //   <root>/dir-1/dir-2
    //   <root>/dir-1/dir-2/file-3
    const root = path.join(getTestTemp(), 'returns-descendants')
    await fs.mkdir(path.join(root, 'dir-1', 'dir-2'), {recursive: true})
    await fs.writeFile(path.join(root, 'file-1'), '')
    await fs.writeFile(path.join(root, 'dir-1', 'file-2'), '')
    await fs.writeFile(path.join(root, 'dir-1', 'dir-2', 'file-3'), '')

    // When pattern ends with `/**/`
    let pattern = `${root}${path.sep}**${path.sep}`
    expect(
      await glob.glob(pattern, {
        implicitDescendants: false
      })
    ).toHaveLength(3) // sanity check
    expect(await glob.glob(pattern)).toEqual([
      root,
      path.join(root, 'dir-1'),
      path.join(root, 'dir-1', 'dir-2'),
      path.join(root, 'dir-1', 'dir-2', 'file-3'),
      path.join(root, 'dir-1', 'file-2'),
      path.join(root, 'file-1')
    ])

    // When pattern ends with something other than `/**/`
    pattern = `${root}${path.sep}**${path.sep}dir-?`
    expect(
      await glob.glob(pattern, {
        implicitDescendants: false
      })
    ).toHaveLength(2) // sanity check
    expect(await glob.glob(pattern)).toEqual([
      path.join(root, 'dir-1'),
      path.join(root, 'dir-1', 'dir-2'),
      path.join(root, 'dir-1', 'dir-2', 'file-3'),
      path.join(root, 'dir-1', 'file-2')
    ])
  })

  it('returns directories only when trailing slash and implicit descendants false', async () => {
    // Create the following layout:
    //   <root>/file-1
    //   <root>/dir-1
    //   <root>/dir-1/file-2
    //   <root>/dir-1/dir-2
    //   <root>/dir-1/dir-2/file-3
    const root = path.join(
      getTestTemp(),
      'returns-directories-only-when-trailing-slash-and-implicit-descendants-false'
    )
    await fs.mkdir(path.join(root, 'dir-1', 'dir-2'), {recursive: true})
    await fs.writeFile(path.join(root, 'file-1'), '')
    await fs.writeFile(path.join(root, 'dir-1', 'file-2'), '')
    await fs.writeFile(path.join(root, 'dir-1', 'dir-2', 'file-3'), '')

    const pattern = `${root}${path.sep}**${path.sep}`
    expect(await glob.glob(pattern)).toHaveLength(6) // sanity check
    expect(
      await glob.glob(pattern, {
        implicitDescendants: false
      })
    ).toEqual([
      root,
      path.join(root, 'dir-1'),
      path.join(root, 'dir-1', 'dir-2')
    ])
  })

  it('returns empty when search path does not exist', async () => {
    const itemPaths = await glob.glob(path.join(getTestTemp(), 'nosuch'))
    expect(itemPaths).toEqual([])
  })

  it('returns hidden files', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/.emptyFolder
    //   <root>/.file
    //   <root>/.folder
    //   <root>/.folder/file
    const root = path.join(getTestTemp(), 'returns-hidden-files')
    await createHiddenDirectory(path.join(root, '.emptyFolder'))
    await createHiddenDirectory(path.join(root, '.folder'))
    await createHiddenFile(path.join(root, '.file'), 'test .file content')
    await fs.writeFile(
      path.join(root, '.folder', 'file'),
      'test .folder/file content'
    )

    const itemPaths = await glob.glob(root)
    expect(itemPaths).toEqual([
      root,
      path.join(root, '.emptyFolder'),
      path.join(root, '.file'),
      path.join(root, '.folder'),
      path.join(root, '.folder', 'file')
    ])
  })

  it('returns normalized paths', async () => {
    // Create the following layout:
    //   <root>/hello/world.txt
    const root: string = path.join(getTestTemp(), 'returns-normalized-paths')
    await fs.mkdir(path.join(root, 'hello'), {recursive: true})
    await fs.writeFile(path.join(root, 'hello', 'world.txt'), '')

    const itemPaths = await glob.glob(
      `${root}${path.sep}${path.sep}${path.sep}hello`
    )
    expect(itemPaths).toEqual([
      path.join(root, 'hello'),
      path.join(root, 'hello', 'world.txt')
    ])
  })

  it('throws when match broken symlink and omitBrokenSymbolicLinks=false', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/brokenSym -> <root>/noSuch
    const root = path.join(
      getTestTemp(),
      'throws-when-match-broken-symlink-and-omit-false'
    )
    await fs.mkdir(root, {recursive: true})
    await createSymlinkDir(
      path.join(root, 'noSuch'),
      path.join(root, 'brokenSym')
    )

    try {
      await glob.glob(root, {omitBrokenSymbolicLinks: false})
      throw new Error('Expected tl.find to throw')
    } catch (err) {
      expect(err.message).toMatch(/broken symbolic link/)
    }
  })

  it('throws when search path is broken symlink and omitBrokenSymbolicLinks=false', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/brokenSym -> <root>/noSuch
    const root = path.join(
      getTestTemp(),
      'throws-when-search-path-is-broken-symlink-and-omit-false'
    )
    await fs.mkdir(root, {recursive: true})
    const brokenSymPath = path.join(root, 'brokenSym')
    await createSymlinkDir(path.join(root, 'noSuch'), brokenSymPath)
    await fs.lstat(brokenSymPath)

    try {
      await glob.glob(brokenSymPath, {omitBrokenSymbolicLinks: false})
      throw new Error('Expected tl.find to throw')
    } catch (err) {
      expect(err.message).toMatch(/broken symbolic link/)
    }
  })
})

async function createHiddenDirectory(dir: string): Promise<void> {
  if (!path.basename(dir).match(/^\./)) {
    throw new Error(`Expected dir '${dir}' to start with '.'.`)
  }

  await fs.mkdir(dir, {recursive: true})
  if (IS_WINDOWS) {
    const result = child.spawnSync('attrib.exe', ['+H', dir])
    if (result.status !== 0) {
      const message: string = (result.output || []).join(' ').trim()
      throw new Error(
        `Failed to set hidden attribute for directory '${dir}'. ${message}`
      )
    }
  }
}

async function createHiddenFile(file: string, content: string): Promise<void> {
  if (!path.basename(file).match(/^\./)) {
    throw new Error(`Expected dir '${file}' to start with '.'.`)
  }

  await fs.mkdir(path.dirname(file), {recursive: true})
  await fs.writeFile(file, content)

  if (IS_WINDOWS) {
    const result = child.spawnSync('attrib.exe', ['+H', file])
    if (result.status !== 0) {
      const message: string = (result.output || []).join(' ').trim()
      throw new Error(
        `Failed to set hidden attribute for file '${file}'. ${message}`
      )
    }
  }
}

function getTestTemp(): string {
  return path.join(__dirname, '_temp', 'glob')
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
