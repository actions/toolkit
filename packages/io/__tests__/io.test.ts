import * as child from 'child_process'
import {promises as fs} from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as io from '../src/io'

describe('cp', () => {
  beforeAll(async () => {
    await io.rmRF(getTestTemp())
  })

  it('copies file with no flags', async () => {
    const root = path.join(getTestTemp(), 'cp_with_no_flags')
    const sourceFile = path.join(root, 'cp_source')
    const targetFile = path.join(root, 'cp_target')
    await io.mkdirP(root)
    await fs.writeFile(sourceFile, 'test file content', {encoding: 'utf8'})

    await io.cp(sourceFile, targetFile)

    expect(await fs.readFile(targetFile, {encoding: 'utf8'})).toBe(
      'test file content'
    )
  })

  it('copies file using -f', async () => {
    const root: string = path.join(path.join(__dirname, '_temp'), 'cp_with_-f')
    const sourceFile: string = path.join(root, 'cp_source')
    const targetFile: string = path.join(root, 'cp_target')
    await io.mkdirP(root)
    await fs.writeFile(sourceFile, 'test file content')

    await io.cp(sourceFile, targetFile, {recursive: false, force: true})

    expect(await fs.readFile(targetFile, {encoding: 'utf8'})).toBe(
      'test file content'
    )
  })

  it('copies file into directory', async () => {
    const root: string = path.join(
      path.join(__dirname, '_temp'),
      'cp_file_to_directory'
    )
    const sourceFile: string = path.join(root, 'cp_source')
    const targetDirectory: string = path.join(root, 'cp_target')
    const targetFile: string = path.join(targetDirectory, 'cp_source')
    await io.mkdirP(targetDirectory)
    await fs.writeFile(sourceFile, 'test file content')

    await io.cp(sourceFile, targetDirectory, {recursive: false, force: true})

    expect(await fs.readFile(targetFile, {encoding: 'utf8'})).toBe(
      'test file content'
    )
  })

  it('try copying to existing file with -n', async () => {
    const root: string = path.join(getTestTemp(), 'cp_to_existing')
    const sourceFile: string = path.join(root, 'cp_source')
    const targetFile: string = path.join(root, 'cp_target')
    await io.mkdirP(root)
    await fs.writeFile(sourceFile, 'test file content', {encoding: 'utf8'})
    await fs.writeFile(targetFile, 'correct content', {encoding: 'utf8'})
    await io.cp(sourceFile, targetFile, {recursive: false, force: false})

    expect(await fs.readFile(targetFile, {encoding: 'utf8'})).toBe(
      'correct content'
    )
  })

  it('copies directory into existing destination with -r', async () => {
    const root: string = path.join(getTestTemp(), 'cp_with_-r_existing_dest')
    const sourceFolder: string = path.join(root, 'cp_source')
    const sourceFile: string = path.join(sourceFolder, 'cp_source_file')

    const targetFolder: string = path.join(root, 'cp_target')
    const targetFile: string = path.join(
      targetFolder,
      'cp_source',
      'cp_source_file'
    )
    await io.mkdirP(sourceFolder)
    await fs.writeFile(sourceFile, 'test file content', {encoding: 'utf8'})
    await io.mkdirP(targetFolder)
    await io.cp(sourceFolder, targetFolder, {recursive: true})

    expect(await fs.readFile(targetFile, {encoding: 'utf8'})).toBe(
      'test file content'
    )
  })

  it('copies directory into existing destination with -r without copying source directory', async () => {
    const root: string = path.join(
      getTestTemp(),
      'cp_with_-r_existing_dest_no_source_dir'
    )
    const sourceFolder: string = path.join(root, 'cp_source')
    const sourceFile: string = path.join(sourceFolder, 'cp_source_file')

    const targetFolder: string = path.join(root, 'cp_target')
    const targetFile: string = path.join(targetFolder, 'cp_source_file')
    await io.mkdirP(sourceFolder)
    await fs.writeFile(sourceFile, 'test file content', {encoding: 'utf8'})
    await io.mkdirP(targetFolder)
    await io.cp(sourceFolder, targetFolder, {
      recursive: true,
      copySourceDirectory: false
    })

    expect(await fs.readFile(targetFile, {encoding: 'utf8'})).toBe(
      'test file content'
    )
  })

  it('copies directory into non-existing destination with -r', async () => {
    const root: string = path.join(getTestTemp(), 'cp_with_-r_nonexistent_dest')
    const sourceFolder: string = path.join(root, 'cp_source')
    const sourceFile: string = path.join(sourceFolder, 'cp_source_file')

    const targetFolder: string = path.join(root, 'cp_target')
    const targetFile: string = path.join(targetFolder, 'cp_source_file')
    await io.mkdirP(sourceFolder)
    await fs.writeFile(sourceFile, 'test file content', {encoding: 'utf8'})
    await io.cp(sourceFolder, targetFolder, {recursive: true})

    expect(await fs.readFile(targetFile, {encoding: 'utf8'})).toBe(
      'test file content'
    )
  })

  it('tries to copy directory without -r', async () => {
    const root: string = path.join(getTestTemp(), 'cp_without_-r')
    const sourceFolder: string = path.join(root, 'cp_source')
    const sourceFile: string = path.join(sourceFolder, 'cp_source_file')

    const targetFolder: string = path.join(root, 'cp_target')
    const targetFile: string = path.join(
      targetFolder,
      'cp_source',
      'cp_source_file'
    )
    await io.mkdirP(sourceFolder)
    await fs.writeFile(sourceFile, 'test file content', {encoding: 'utf8'})

    let thrown = false
    try {
      await io.cp(sourceFolder, targetFolder)
    } catch (err) {
      thrown = true
    }
    expect(thrown).toBe(true)
    await assertNotExists(targetFile)
  })

  it('Copies symlinks correctly', async () => {
    // create the following layout
    // sourceFolder
    // sourceFolder/nested
    // sourceFolder/nested/sourceFile
    // sourceFolder/symlinkDirectory -> sourceFile
    const root: string = path.join(getTestTemp(), 'cp_with_-r_symlinks')
    const sourceFolder: string = path.join(root, 'cp_source')
    const nestedFolder: string = path.join(sourceFolder, 'nested')
    const sourceFile: string = path.join(nestedFolder, 'cp_source_file')
    const symlinkDirectory: string = path.join(sourceFolder, 'symlinkDirectory')

    const targetFolder: string = path.join(root, 'cp_target')
    const targetFile: string = path.join(
      targetFolder,
      'nested',
      'cp_source_file'
    )
    const symlinkTargetPath: string = path.join(
      targetFolder,
      'symlinkDirectory',
      'cp_source_file'
    )
    await io.mkdirP(sourceFolder)
    await io.mkdirP(nestedFolder)
    await fs.writeFile(sourceFile, 'test file content', {encoding: 'utf8'})
    await createSymlinkDir(nestedFolder, symlinkDirectory)
    await io.cp(sourceFolder, targetFolder, {recursive: true})

    expect(await fs.readFile(targetFile, {encoding: 'utf8'})).toBe(
      'test file content'
    )
    expect(await fs.readFile(symlinkTargetPath, {encoding: 'utf8'})).toBe(
      'test file content'
    )
  })
})

describe('mv', () => {
  beforeAll(async () => {
    await io.rmRF(getTestTemp())
  })

  it('moves file with no flags', async () => {
    const root = path.join(getTestTemp(), ' mv_with_no_flags')
    const sourceFile = path.join(root, ' mv_source')
    const targetFile = path.join(root, ' mv_target')
    await io.mkdirP(root)
    await fs.writeFile(sourceFile, 'test file content', {encoding: 'utf8'})

    await io.mv(sourceFile, targetFile)

    expect(await fs.readFile(targetFile, {encoding: 'utf8'})).toBe(
      'test file content'
    )
    await assertNotExists(sourceFile)
  })

  it('moves file using -f', async () => {
    const root: string = path.join(path.join(__dirname, '_temp'), ' mv_with_-f')
    const sourceFile: string = path.join(root, ' mv_source')
    const targetFile: string = path.join(root, ' mv_target')
    await io.mkdirP(root)
    await fs.writeFile(sourceFile, 'test file content')

    await io.mv(sourceFile, targetFile)

    expect(await fs.readFile(targetFile, {encoding: 'utf8'})).toBe(
      'test file content'
    )

    await assertNotExists(sourceFile)
  })

  it('try moving to existing file with -n', async () => {
    const root: string = path.join(getTestTemp(), ' mv_to_existing')
    const sourceFile: string = path.join(root, ' mv_source')
    const targetFile: string = path.join(root, ' mv_target')
    await io.mkdirP(root)
    await fs.writeFile(sourceFile, 'test file content', {encoding: 'utf8'})
    await fs.writeFile(targetFile, 'correct content', {encoding: 'utf8'})
    let failed = false
    try {
      await io.mv(sourceFile, targetFile, {force: false})
    } catch {
      failed = true
    }
    expect(failed).toBe(true)

    expect(await fs.readFile(sourceFile, {encoding: 'utf8'})).toBe(
      'test file content'
    )
    expect(await fs.readFile(targetFile, {encoding: 'utf8'})).toBe(
      'correct content'
    )
  })

  it('moves directory into existing destination', async () => {
    const root: string = path.join(getTestTemp(), ' mv_with_-r_existing_dest')
    const sourceFolder: string = path.join(root, ' mv_source')
    const sourceFile: string = path.join(sourceFolder, ' mv_source_file')

    const targetFolder: string = path.join(root, ' mv_target')
    const targetFile: string = path.join(
      targetFolder,
      ' mv_source',
      ' mv_source_file'
    )
    await io.mkdirP(sourceFolder)
    await fs.writeFile(sourceFile, 'test file content', {encoding: 'utf8'})
    await io.mkdirP(targetFolder)
    await io.mv(sourceFolder, targetFolder)

    expect(await fs.readFile(targetFile, {encoding: 'utf8'})).toBe(
      'test file content'
    )
    await assertNotExists(sourceFile)
  })

  it('moves directory into non-existing destination', async () => {
    const root: string = path.join(
      getTestTemp(),
      ' mv_with_-r_nonexistent_dest'
    )
    const sourceFolder: string = path.join(root, ' mv_source')
    const sourceFile: string = path.join(sourceFolder, ' mv_source_file')

    const targetFolder: string = path.join(root, ' mv_target')
    const targetFile: string = path.join(targetFolder, ' mv_source_file')
    await io.mkdirP(sourceFolder)
    await fs.writeFile(sourceFile, 'test file content', {encoding: 'utf8'})
    await io.mv(sourceFolder, targetFolder)

    expect(await fs.readFile(targetFile, {encoding: 'utf8'})).toBe(
      'test file content'
    )
    await assertNotExists(sourceFile)
  })
})

describe('rmRF', () => {
  beforeAll(async () => {
    await io.rmRF(getTestTemp())
  })

  it('removes single folder with rmRF', async () => {
    const testPath = path.join(getTestTemp(), 'testFolder')

    await io.mkdirP(testPath)
    await assertExists(testPath)

    await io.rmRF(testPath)
    await assertNotExists(testPath)
  })

  it('removes recursive folders with rmRF', async () => {
    const testPath = path.join(getTestTemp(), 'testDir1')
    const testPath2 = path.join(testPath, 'testDir2')
    await io.mkdirP(testPath2)

    await assertExists(testPath)
    await assertExists(testPath2)

    await io.rmRF(testPath)
    await assertNotExists(testPath)
    await assertNotExists(testPath2)
  })

  it('removes folder with locked file with rmRF', async () => {
    const testPath = path.join(getTestTemp(), 'testFolder')
    await io.mkdirP(testPath)
    await assertExists(testPath)

    // can't remove folder with locked file on windows
    const filePath = path.join(testPath, 'file.txt')
    await fs.appendFile(filePath, 'some data')
    await assertExists(filePath)

    const fd = await fs.open(filePath, 'r')
    await io.rmRF(testPath)

    await assertNotExists(testPath)

    await fd.close()
    await io.rmRF(testPath)
    await assertNotExists(testPath)
  })

  it('removes folder that does not exist with rmRF', async () => {
    const testPath = path.join(getTestTemp(), 'testFolder')
    await assertNotExists(testPath)

    await io.rmRF(testPath)
    await assertNotExists(testPath)
  })

  it('removes file with rmRF', async () => {
    const file: string = path.join(getTestTemp(), 'rmRF_file')
    await fs.writeFile(file, 'test file content')
    await assertExists(file)
    await io.rmRF(file)
    await assertNotExists(file)
  })

  it('removes hidden folder with rmRF', async () => {
    const directory: string = path.join(getTestTemp(), '.rmRF_directory')
    await createHiddenDirectory(directory)
    await assertExists(directory)
    await io.rmRF(directory)
    await assertNotExists(directory)
  })

  it('removes hidden file with rmRF', async () => {
    const file: string = path.join(getTestTemp(), '.rmRF_file')
    await fs.writeFile(file, 'test file content')
    await assertExists(file)
    await io.rmRF(file)
    await assertNotExists(file)
  })

  it('removes symlink folder with rmRF', async () => {
    // create the following layout:
    //   real_directory
    //   real_directory/real_file
    //   symlink_directory -> real_directory
    const root: string = path.join(getTestTemp(), 'rmRF_sym_dir_test')
    const realDirectory: string = path.join(root, 'real_directory')
    const realFile: string = path.join(root, 'real_directory', 'real_file')
    const symlinkDirectory: string = path.join(root, 'symlink_directory')
    await io.mkdirP(realDirectory)
    await fs.writeFile(realFile, 'test file content')
    await createSymlinkDir(realDirectory, symlinkDirectory)
    await assertExists(path.join(symlinkDirectory, 'real_file'))

    await io.rmRF(symlinkDirectory)
    await assertExists(realDirectory)
    await assertExists(realFile)
    await assertNotExists(symlinkDirectory)
  })

  // creating a symlink to a file on Windows requires elevated
  if (os.platform() !== 'win32') {
    it('removes symlink file with rmRF', async () => {
      // create the following layout:
      //   real_file
      //   symlink_file -> real_file
      const root: string = path.join(getTestTemp(), 'rmRF_sym_file_test')
      const realFile: string = path.join(root, 'real_file')
      const symlinkFile: string = path.join(root, 'symlink_file')
      await io.mkdirP(root)
      await fs.writeFile(realFile, 'test file content')
      await fs.symlink(realFile, symlinkFile)
      expect(await fs.readFile(symlinkFile, {encoding: 'utf8'})).toBe(
        'test file content'
      )

      await io.rmRF(symlinkFile)
      await assertExists(realFile)
      await assertNotExists(symlinkFile)
    })

    it('removes symlink file with missing source using rmRF', async () => {
      // create the following layout:
      //   real_file
      //   symlink_file -> real_file
      const root: string = path.join(
        getTestTemp(),
        'rmRF_sym_file_missing_source_test'
      )
      const realFile: string = path.join(root, 'real_file')
      const symlinkFile: string = path.join(root, 'symlink_file')
      await io.mkdirP(root)
      await fs.writeFile(realFile, 'test file content')
      await fs.symlink(realFile, symlinkFile)
      expect(await fs.readFile(symlinkFile, {encoding: 'utf8'})).toBe(
        'test file content'
      )

      // remove the real file
      await fs.unlink(realFile)
      expect((await fs.lstat(symlinkFile)).isSymbolicLink()).toBe(true)

      // remove the symlink file
      await io.rmRF(symlinkFile)
      let errcode = ''
      try {
        await fs.lstat(symlinkFile)
      } catch (err) {
        errcode = err.code
      }

      expect(errcode).toBe('ENOENT')
    })

    it('removes symlink level 2 file with rmRF', async () => {
      // create the following layout:
      //   real_file
      //   symlink_file -> real_file
      //   symlink_level_2_file -> symlink_file
      const root: string = path.join(
        getTestTemp(),
        'rmRF_sym_level_2_file_test'
      )
      const realFile: string = path.join(root, 'real_file')
      const symlinkFile: string = path.join(root, 'symlink_file')
      const symlinkLevel2File: string = path.join(root, 'symlink_level_2_file')
      await io.mkdirP(root)
      await fs.writeFile(realFile, 'test file content')
      await fs.symlink(realFile, symlinkFile)
      await fs.symlink(symlinkFile, symlinkLevel2File)
      expect(await fs.readFile(symlinkLevel2File, {encoding: 'utf8'})).toBe(
        'test file content'
      )

      await io.rmRF(symlinkLevel2File)
      await assertExists(realFile)
      await assertExists(symlinkFile)
      await assertNotExists(symlinkLevel2File)
    })

    it('removes nested symlink file with rmRF', async () => {
      // create the following layout:
      //   real_directory
      //   real_directory/real_file
      //   outer_directory
      //   outer_directory/symlink_file -> real_file
      const root: string = path.join(getTestTemp(), 'rmRF_sym_nest_file_test')
      const realDirectory: string = path.join(root, 'real_directory')
      const realFile: string = path.join(root, 'real_directory', 'real_file')
      const outerDirectory: string = path.join(root, 'outer_directory')
      const symlinkFile: string = path.join(
        root,
        'outer_directory',
        'symlink_file'
      )
      await io.mkdirP(realDirectory)
      await fs.writeFile(realFile, 'test file content')
      await io.mkdirP(outerDirectory)
      await fs.symlink(realFile, symlinkFile)
      expect(await fs.readFile(symlinkFile, {encoding: 'utf8'})).toBe(
        'test file content'
      )

      await io.rmRF(outerDirectory)
      await assertExists(realDirectory)
      await assertExists(realFile)
      await assertNotExists(symlinkFile)
      await assertNotExists(outerDirectory)
    })

    it('removes deeply nested symlink file with rmRF', async () => {
      // create the following layout:
      //   real_directory
      //   real_directory/real_file
      //   outer_directory
      //   outer_directory/nested_directory
      //   outer_directory/nested_directory/symlink_file -> real_file
      const root: string = path.join(
        getTestTemp(),
        'rmRF_sym_deep_nest_file_test'
      )
      const realDirectory: string = path.join(root, 'real_directory')
      const realFile: string = path.join(root, 'real_directory', 'real_file')
      const outerDirectory: string = path.join(root, 'outer_directory')
      const nestedDirectory: string = path.join(
        root,
        'outer_directory',
        'nested_directory'
      )
      const symlinkFile: string = path.join(
        root,
        'outer_directory',
        'nested_directory',
        'symlink_file'
      )
      await io.mkdirP(realDirectory)
      await fs.writeFile(realFile, 'test file content')
      await io.mkdirP(nestedDirectory)
      await fs.symlink(realFile, symlinkFile)
      expect(await fs.readFile(symlinkFile, {encoding: 'utf8'})).toBe(
        'test file content'
      )

      await io.rmRF(outerDirectory)
      await assertExists(realDirectory)
      await assertExists(realFile)
      await assertNotExists(symlinkFile)
      await assertNotExists(outerDirectory)
    })
  } else {
    it('correctly escapes % on windows', async () => {
      const root: string = path.join(getTestTemp(), 'rmRF_escape_test_win')
      const directory: string = path.join(root, '%test%')
      await io.mkdirP(root)
      await io.mkdirP(directory)
      const oldEnv = process.env['test']
      process.env['test'] = 'thisshouldnotresolve'

      await io.rmRF(directory)
      await assertNotExists(directory)
      process.env['test'] = oldEnv
    })

    it('Should throw for invalid characters', async () => {
      const root: string = path.join(getTestTemp(), 'rmRF_invalidChar_Windows')
      const errorString =
        'File path must not contain `*`, `"`, `<`, `>` or `|` on Windows'
      await expect(io.rmRF(path.join(root, '"'))).rejects.toHaveProperty(
        'message',
        errorString
      )
      await expect(io.rmRF(path.join(root, '<'))).rejects.toHaveProperty(
        'message',
        errorString
      )
      await expect(io.rmRF(path.join(root, '>'))).rejects.toHaveProperty(
        'message',
        errorString
      )
      await expect(io.rmRF(path.join(root, '|'))).rejects.toHaveProperty(
        'message',
        errorString
      )
      await expect(io.rmRF(path.join(root, '*'))).rejects.toHaveProperty(
        'message',
        errorString
      )
    })
  }

  it('removes symlink folder with missing source using rmRF', async () => {
    // create the following layout:
    //   real_directory
    //   real_directory/real_file
    //   symlink_directory -> real_directory
    const root: string = path.join(getTestTemp(), 'rmRF_sym_dir_miss_src_test')
    const realDirectory: string = path.join(root, 'real_directory')
    const realFile: string = path.join(root, 'real_directory', 'real_file')
    const symlinkDirectory: string = path.join(root, 'symlink_directory')
    await io.mkdirP(realDirectory)
    await fs.writeFile(realFile, 'test file content')
    await createSymlinkDir(realDirectory, symlinkDirectory)
    await assertExists(symlinkDirectory)

    // remove the real directory
    await fs.unlink(realFile)
    await fs.rmdir(realDirectory)
    let errcode = ''
    try {
      await fs.stat(symlinkDirectory)
    } catch (err) {
      errcode = err.code
    }

    expect(errcode).toBe('ENOENT')

    // lstat shouldn't throw
    await fs.lstat(symlinkDirectory)

    // remove the symlink directory
    await io.rmRF(symlinkDirectory)
    errcode = ''
    try {
      await fs.lstat(symlinkDirectory)
    } catch (err) {
      errcode = err.code
    }

    expect(errcode).toBe('ENOENT')
  })

  it('removes symlink level 2 folder with rmRF', async () => {
    // create the following layout:
    //   real_directory
    //   real_directory/real_file
    //   symlink_directory -> real_directory
    //   symlink_level_2_directory -> symlink_directory
    const root: string = path.join(
      getTestTemp(),
      'rmRF_sym_level_2_directory_test'
    )
    const realDirectory: string = path.join(root, 'real_directory')
    const realFile: string = path.join(realDirectory, 'real_file')
    const symlinkDirectory: string = path.join(root, 'symlink_directory')
    const symlinkLevel2Directory: string = path.join(
      root,
      'symlink_level_2_directory'
    )
    await io.mkdirP(realDirectory)
    await fs.writeFile(realFile, 'test file content')
    await createSymlinkDir(realDirectory, symlinkDirectory)
    await createSymlinkDir(symlinkDirectory, symlinkLevel2Directory)
    expect(
      await fs.readFile(path.join(symlinkDirectory, 'real_file'), {
        encoding: 'utf8'
      })
    ).toBe('test file content')
    if (os.platform() === 'win32') {
      expect(await fs.readlink(symlinkLevel2Directory)).toBe(
        `${symlinkDirectory}\\`
      )
    } else {
      expect(await fs.readlink(symlinkLevel2Directory)).toBe(symlinkDirectory)
    }

    await io.rmRF(symlinkLevel2Directory)
    await assertExists(path.join(symlinkDirectory, 'real_file'))
    await assertNotExists(symlinkLevel2Directory)
  })

  it('removes nested symlink folder with rmRF', async () => {
    // create the following layout:
    //   real_directory
    //   real_directory/real_file
    //   outer_directory
    //   outer_directory/symlink_directory -> real_directory
    const root: string = path.join(getTestTemp(), 'rmRF_sym_nest_dir_test')
    const realDirectory: string = path.join(root, 'real_directory')
    const realFile: string = path.join(root, 'real_directory', 'real_file')
    const outerDirectory: string = path.join(root, 'outer_directory')
    const symlinkDirectory: string = path.join(
      root,
      'outer_directory',
      'symlink_directory'
    )
    await io.mkdirP(realDirectory)
    await fs.writeFile(realFile, 'test file content')
    await io.mkdirP(outerDirectory)
    await createSymlinkDir(realDirectory, symlinkDirectory)
    await assertExists(path.join(symlinkDirectory, 'real_file'))

    await io.rmRF(outerDirectory)
    await assertExists(realDirectory)
    await assertExists(realFile)
    await assertNotExists(symlinkDirectory)
    await assertNotExists(outerDirectory)
  })

  it('removes deeply nested symlink folder with rmRF', async () => {
    // create the following layout:
    //   real_directory
    //   real_directory/real_file
    //   outer_directory
    //   outer_directory/nested_directory
    //   outer_directory/nested_directory/symlink_directory -> real_directory
    const root: string = path.join(getTestTemp(), 'rmRF_sym_deep_nest_dir_test')
    const realDirectory: string = path.join(root, 'real_directory')
    const realFile: string = path.join(root, 'real_directory', 'real_file')
    const outerDirectory: string = path.join(root, 'outer_directory')
    const nestedDirectory: string = path.join(
      root,
      'outer_directory',
      'nested_directory'
    )
    const symlinkDirectory: string = path.join(
      root,
      'outer_directory',
      'nested_directory',
      'symlink_directory'
    )
    await io.mkdirP(realDirectory)
    await fs.writeFile(realFile, 'test file content')
    await io.mkdirP(nestedDirectory)
    await createSymlinkDir(realDirectory, symlinkDirectory)
    await assertExists(path.join(symlinkDirectory, 'real_file'))

    await io.rmRF(outerDirectory)
    await assertExists(realDirectory)
    await assertExists(realFile)
    await assertNotExists(symlinkDirectory)
    await assertNotExists(outerDirectory)
  })

  it('removes hidden file with rmRF', async () => {
    const file: string = path.join(getTestTemp(), '.rmRF_file')
    await io.mkdirP(path.dirname(file))
    await createHiddenFile(file, 'test file content')
    await assertExists(file)
    await io.rmRF(file)
    await assertNotExists(file)
  })
})

describe('mkdirP', () => {
  beforeAll(async () => {
    await io.rmRF(getTestTemp())
  })

  it('fails when called with an empty path', async () => {
    expect.assertions(1)

    try {
      await io.mkdirP('')
    } catch (err) {
      expect(err.message).toEqual('a path argument must be provided')
    }
  })

  it('creates folder', async () => {
    const testPath = path.join(getTestTemp(), 'mkdirTest')
    await io.mkdirP(testPath)

    await assertExists(testPath)
  })

  it('creates nested folders with mkdirP', async () => {
    const testPath = path.join(getTestTemp(), 'mkdir1', 'mkdir2')
    await io.mkdirP(testPath)

    await assertExists(testPath)
  })

  it('fails if mkdirP with illegal chars', async () => {
    const testPath = path.join(getTestTemp(), 'mkdir\0')
    let worked = false
    try {
      await io.mkdirP(testPath)
      worked = true
    } catch (err) {
      await expect(fs.stat(testPath)).rejects.toHaveProperty(
        'code',
        'ERR_INVALID_ARG_VALUE'
      )
    }

    expect(worked).toBe(false)
  })

  it('fails if mkdirP with conflicting file path', async () => {
    const testPath = path.join(getTestTemp(), 'mkdirP_conflicting_file_path')
    await io.mkdirP(getTestTemp())
    await fs.writeFile(testPath, '')
    let worked: boolean
    try {
      await io.mkdirP(testPath)
      worked = true
    } catch (err) {
      worked = false
    }

    expect(worked).toBe(false)
  })

  it('fails if mkdirP with conflicting parent file path', async () => {
    const testPath = path.join(
      getTestTemp(),
      'mkdirP_conflicting_parent_file_path',
      'dir'
    )
    await io.mkdirP(getTestTemp())
    await fs.writeFile(path.dirname(testPath), '')
    let worked: boolean
    try {
      await io.mkdirP(testPath)
      worked = true
    } catch (err) {
      worked = false
    }

    expect(worked).toBe(false)
  })

  it('no-ops if mkdirP directory exists', async () => {
    const testPath = path.join(getTestTemp(), 'mkdirP_dir_exists')
    await io.mkdirP(testPath)
    await assertExists(testPath)

    // Calling again shouldn't throw
    await io.mkdirP(testPath)
    await assertExists(testPath)
  })

  it('no-ops if mkdirP with symlink directory', async () => {
    // create the following layout:
    //   real_dir
    //   real_dir/file.txt
    //   symlink_dir -> real_dir
    const rootPath = path.join(getTestTemp(), 'mkdirP_symlink_dir')
    const realDirPath = path.join(rootPath, 'real_dir')
    const realFilePath = path.join(realDirPath, 'file.txt')
    const symlinkDirPath = path.join(rootPath, 'symlink_dir')
    await io.mkdirP(getTestTemp())
    await fs.mkdir(rootPath)
    await fs.mkdir(realDirPath)
    await fs.writeFile(realFilePath, 'test real_dir/file.txt content')
    await createSymlinkDir(realDirPath, symlinkDirPath)

    await io.mkdirP(symlinkDirPath)

    // the file in the real directory should still be accessible via the symlink
    expect((await fs.lstat(symlinkDirPath)).isSymbolicLink()).toBe(true)
    expect(
      (await fs.stat(path.join(symlinkDirPath, 'file.txt'))).isFile()
    ).toBe(true)
  })

  it('no-ops if mkdirP with parent symlink directory', async () => {
    // create the following layout:
    //   real_dir
    //   real_dir/file.txt
    //   symlink_dir -> real_dir
    const rootPath = path.join(getTestTemp(), 'mkdirP_parent_symlink_dir')
    const realDirPath = path.join(rootPath, 'real_dir')
    const realFilePath = path.join(realDirPath, 'file.txt')
    const symlinkDirPath = path.join(rootPath, 'symlink_dir')
    await io.mkdirP(getTestTemp())
    await fs.mkdir(rootPath)
    await fs.mkdir(realDirPath)
    await fs.writeFile(realFilePath, 'test real_dir/file.txt content')
    await createSymlinkDir(realDirPath, symlinkDirPath)

    const subDirPath = path.join(symlinkDirPath, 'sub_dir')
    await io.mkdirP(subDirPath)

    // the subdirectory should be accessible via the real directory
    expect(
      (await fs.lstat(path.join(realDirPath, 'sub_dir'))).isDirectory()
    ).toBe(true)
  })
})

describe('which', () => {
  beforeAll(async () => {
    await io.rmRF(getTestTemp())
  })

  it('which() finds file name', async () => {
    // create a executable file
    const testPath = path.join(getTestTemp(), 'which-finds-file-name')
    await io.mkdirP(testPath)
    let fileName = 'Which-Test-File'
    if (process.platform === 'win32') {
      fileName += '.exe'
    }

    const filePath = path.join(testPath, fileName)
    await fs.writeFile(filePath, '')
    if (process.platform !== 'win32') {
      chmod(filePath, '+x')
    }

    const originalPath = process.env['PATH']
    try {
      // update the PATH
      process.env['PATH'] = `${process.env['PATH']}${path.delimiter}${testPath}`

      // exact file name
      expect(await io.which(fileName)).toBe(filePath)
      expect(await io.which(fileName, false)).toBe(filePath)
      expect(await io.which(fileName, true)).toBe(filePath)

      if (process.platform === 'win32') {
        // not case sensitive on windows
        expect(await io.which('which-test-file.exe')).toBe(
          path.join(testPath, 'which-test-file.exe')
        )
        expect(await io.which('WHICH-TEST-FILE.EXE')).toBe(
          path.join(testPath, 'WHICH-TEST-FILE.EXE')
        )
        expect(await io.which('WHICH-TEST-FILE.EXE', false)).toBe(
          path.join(testPath, 'WHICH-TEST-FILE.EXE')
        )
        expect(await io.which('WHICH-TEST-FILE.EXE', true)).toBe(
          path.join(testPath, 'WHICH-TEST-FILE.EXE')
        )

        // without extension
        expect(await io.which('which-test-file')).toBe(filePath)
        expect(await io.which('which-test-file', false)).toBe(filePath)
        expect(await io.which('which-test-file', true)).toBe(filePath)
      } else if (process.platform === 'darwin') {
        // not case sensitive on Mac
        expect(await io.which(fileName.toUpperCase())).toBe(
          path.join(testPath, fileName.toUpperCase())
        )
        expect(await io.which(fileName.toUpperCase(), false)).toBe(
          path.join(testPath, fileName.toUpperCase())
        )
        expect(await io.which(fileName.toUpperCase(), true)).toBe(
          path.join(testPath, fileName.toUpperCase())
        )
      } else {
        // case sensitive on Linux
        expect(await io.which(fileName.toUpperCase())).toBe('')
      }
    } finally {
      process.env['PATH'] = originalPath
    }
  })

  it('which() not found', async () => {
    expect(await io.which('which-test-no-such-file')).toBe('')
    expect(await io.which('which-test-no-such-file', false)).toBe('')
    await expect(
      io.which('which-test-no-such-file', true)
    ).rejects.toBeDefined()
  })

  it('which() searches path in order', async () => {
    // create a chcp.com/bash override file
    const testPath = path.join(getTestTemp(), 'which-searches-path-in-order')
    await io.mkdirP(testPath)
    let fileName
    if (process.platform === 'win32') {
      fileName = 'chcp.com'
    } else {
      fileName = 'bash'
    }

    const filePath = path.join(testPath, fileName)
    await fs.writeFile(filePath, '')
    if (process.platform !== 'win32') {
      chmod(filePath, '+x')
    }

    const originalPath = process.env['PATH']
    try {
      // sanity - regular chcp.com/bash should be found
      const originalWhich = await io.which(fileName)
      expect(!!(originalWhich || '')).toBe(true)

      // modify PATH
      process.env['PATH'] = [testPath, process.env.PATH].join(path.delimiter)

      // override chcp.com/bash should be found
      expect(await io.which(fileName)).toBe(filePath)
    } finally {
      process.env['PATH'] = originalPath
    }
  })

  it('which() requires executable', async () => {
    // create a non-executable file
    // on Windows, should not end in valid PATHEXT
    // on Mac/Linux should not have executable bit
    const testPath = path.join(getTestTemp(), 'which-requires-executable')
    await io.mkdirP(testPath)
    let fileName = 'Which-Test-File'
    if (process.platform === 'win32') {
      fileName += '.abc' // not a valid PATHEXT
    }

    const filePath = path.join(testPath, fileName)
    await fs.writeFile(filePath, '')
    if (process.platform !== 'win32') {
      chmod(filePath, '-x')
    }

    const originalPath = process.env['PATH']
    try {
      // modify PATH
      process.env['PATH'] = [process.env['PATH'], testPath].join(path.delimiter)

      // should not be found
      expect(await io.which(fileName)).toBe('')
    } finally {
      process.env['PATH'] = originalPath
    }
  })

  // which permissions tests
  it('which() finds executable with different permissions', async () => {
    await findsExecutableWithScopedPermissions('u=rwx,g=r,o=r')
    await findsExecutableWithScopedPermissions('u=rw,g=rx,o=r')
    await findsExecutableWithScopedPermissions('u=rw,g=r,o=rx')
  })

  it('which() ignores directory match', async () => {
    // create a directory
    const testPath = path.join(getTestTemp(), 'which-ignores-directory-match')
    let dirPath = path.join(testPath, 'Which-Test-Dir')
    if (process.platform === 'win32') {
      dirPath += '.exe'
    }

    await io.mkdirP(dirPath)
    if (process.platform !== 'win32') {
      chmod(dirPath, '+x')
    }

    const originalPath = process.env['PATH']
    try {
      // modify PATH
      process.env['PATH'] = [process.env['PATH'], testPath].join(path.delimiter)

      // should not be found
      expect(await io.which(path.basename(dirPath))).toBe('')
    } finally {
      process.env['PATH'] = originalPath
    }
  })

  it('which() allows rooted path', async () => {
    // create an executable file
    const testPath = path.join(getTestTemp(), 'which-allows-rooted-path')
    await io.mkdirP(testPath)
    let filePath = path.join(testPath, 'Which-Test-File')
    if (process.platform === 'win32') {
      filePath += '.exe'
    }

    await fs.writeFile(filePath, '')
    if (process.platform !== 'win32') {
      chmod(filePath, '+x')
    }

    // which the full path
    expect(await io.which(filePath)).toBe(filePath)
    expect(await io.which(filePath, false)).toBe(filePath)
    expect(await io.which(filePath, true)).toBe(filePath)
  })

  it('which() requires rooted path to be executable', async () => {
    // create a non-executable file
    // on Windows, should not end in valid PATHEXT
    // on Mac/Linux, should not have executable bit
    const testPath = path.join(
      getTestTemp(),
      'which-requires-rooted-path-to-be-executable'
    )
    await io.mkdirP(testPath)
    let filePath = path.join(testPath, 'Which-Test-File')
    if (process.platform === 'win32') {
      filePath += '.abc' // not a valid PATHEXT
    }

    await fs.writeFile(filePath, '')
    if (process.platform !== 'win32') {
      chmod(filePath, '-x')
    }

    // should not be found
    expect(await io.which(filePath)).toBe('')
    expect(await io.which(filePath, false)).toBe('')
    let failed = false
    try {
      await io.which(filePath, true)
    } catch (err) {
      failed = true
    }

    expect(failed).toBe(true)
  })

  it('which() requires rooted path to be a file', async () => {
    // create a dir
    const testPath = path.join(
      getTestTemp(),
      'which-requires-rooted-path-to-be-executable'
    )
    let dirPath = path.join(testPath, 'Which-Test-Dir')
    if (process.platform === 'win32') {
      dirPath += '.exe'
    }

    await io.mkdirP(dirPath)
    if (process.platform !== 'win32') {
      chmod(dirPath, '+x')
    }

    // should not be found
    expect(await io.which(dirPath)).toBe('')
    expect(await io.which(dirPath, false)).toBe('')
    let failed = false
    try {
      await io.which(dirPath, true)
    } catch (err) {
      failed = true
    }

    expect(failed).toBe(true)
  })

  it('which() requires rooted path to exist', async () => {
    let filePath = path.join(__dirname, 'no-such-file')
    if (process.platform === 'win32') {
      filePath += '.exe'
    }

    expect(await io.which(filePath)).toBe('')
    expect(await io.which(filePath, false)).toBe('')
    let failed = false
    try {
      await io.which(filePath, true)
    } catch (err) {
      failed = true
    }

    expect(failed).toBe(true)
  })

  it('which() does not allow separators', async () => {
    // create an executable file
    const testDirName = 'which-does-not-allow-separators'
    const testPath = path.join(getTestTemp(), testDirName)
    await io.mkdirP(testPath)
    let fileName = 'Which-Test-File'
    if (process.platform === 'win32') {
      fileName += '.exe'
    }

    const filePath = path.join(testPath, fileName)
    await fs.writeFile(filePath, '')
    if (process.platform !== 'win32') {
      chmod(filePath, '+x')
    }

    const originalPath = process.env['PATH']
    try {
      // modify PATH
      process.env['PATH'] = [process.env['PATH'], testPath].join(path.delimiter)

      // which "dir/file", should not be found
      expect(await io.which(`${testDirName}/${fileName}`)).toBe('')

      // on Windows, also try "dir\file"
      if (process.platform === 'win32') {
        expect(await io.which(`${testDirName}\\${fileName}`)).toBe('')
      }
    } finally {
      process.env['PATH'] = originalPath
    }
  })

  if (process.platform === 'win32') {
    it('which() resolves actual case file name when extension is applied', async () => {
      const comspec: string = process.env['ComSpec'] || ''
      expect(!!comspec).toBe(true)
      expect(await io.which('CmD.eXe')).toBe(
        path.join(path.dirname(comspec), 'CmD.eXe')
      )
      expect(await io.which('CmD')).toBe(comspec)
    })

    it('which() appends ext on windows', async () => {
      // create executable files
      const testPath = path.join(getTestTemp(), 'which-appends-ext-on-windows')
      await io.mkdirP(testPath)
      // PATHEXT=.COM;.EXE;.BAT;.CMD...
      const files: {[key: string]: string} = {
        'which-test-file-1': path.join(testPath, 'which-test-file-1.com'),
        'which-test-file-2': path.join(testPath, 'which-test-file-2.exe'),
        'which-test-file-3': path.join(testPath, 'which-test-file-3.bat'),
        'which-test-file-4': path.join(testPath, 'which-test-file-4.cmd'),
        'which-test-file-5.txt': path.join(
          testPath,
          'which-test-file-5.txt.com'
        )
      }
      for (const fileName of Object.keys(files)) {
        await fs.writeFile(files[fileName], '')
      }

      const originalPath = process.env['PATH']
      try {
        // modify PATH
        process.env[
          'PATH'
        ] = `${process.env['PATH']}${path.delimiter}${testPath}`

        // find each file
        for (const fileName of Object.keys(files)) {
          expect(await io.which(fileName)).toBe(files[fileName])
        }
      } finally {
        process.env['PATH'] = originalPath
      }
    })

    it('which() appends ext on windows when rooted', async () => {
      // create executable files
      const testPath = path.join(
        getTestTemp(),
        'which-appends-ext-on-windows-when-rooted'
      )
      await io.mkdirP(testPath)
      // PATHEXT=.COM;.EXE;.BAT;.CMD...
      const files: {[key: string]: string} = {}
      files[path.join(testPath, 'which-test-file-1')] = path.join(
        testPath,
        'which-test-file-1.com'
      )
      files[path.join(testPath, 'which-test-file-2')] = path.join(
        testPath,
        'which-test-file-2.exe'
      )
      files[path.join(testPath, 'which-test-file-3')] = path.join(
        testPath,
        'which-test-file-3.bat'
      )
      files[path.join(testPath, 'which-test-file-4')] = path.join(
        testPath,
        'which-test-file-4.cmd'
      )
      files[path.join(testPath, 'which-test-file-5.txt')] = path.join(
        testPath,
        'which-test-file-5.txt.com'
      )
      for (const fileName of Object.keys(files)) {
        await fs.writeFile(files[fileName], '')
      }

      // find each file
      for (const fileName of Object.keys(files)) {
        expect(await io.which(fileName)).toBe(files[fileName])
      }
    })

    it('which() prefer exact match on windows', async () => {
      // create two executable files:
      //   which-test-file.bat
      //   which-test-file.bat.exe
      //
      // verify "which-test-file.bat" returns that file, and not "which-test-file.bat.exe"
      //
      // preference, within the same dir, should be given to the exact match (even though
      // .EXE is defined with higher preference than .BAT in PATHEXT (PATHEXT=.COM;.EXE;.BAT;.CMD...)
      const testPath = path.join(
        getTestTemp(),
        'which-prefer-exact-match-on-windows'
      )
      await io.mkdirP(testPath)
      const fileName = 'which-test-file.bat'
      const expectedFilePath = path.join(testPath, fileName)
      const notExpectedFilePath = path.join(testPath, `${fileName}.exe`)
      await fs.writeFile(expectedFilePath, '')
      await fs.writeFile(notExpectedFilePath, '')
      const originalPath = process.env['PATH']
      try {
        process.env[
          'PATH'
        ] = `${process.env['PATH']}${path.delimiter}${testPath}`
        expect(await io.which(fileName)).toBe(expectedFilePath)
      } finally {
        process.env['PATH'] = originalPath
      }
    })

    it('which() prefer exact match on windows when rooted', async () => {
      // create two executable files:
      //   which-test-file.bat
      //   which-test-file.bat.exe
      //
      // verify "which-test-file.bat" returns that file, and not "which-test-file.bat.exe"
      //
      // preference, within the same dir, should be given to the exact match (even though
      // .EXE is defined with higher preference than .BAT in PATHEXT (PATHEXT=.COM;.EXE;.BAT;.CMD...)
      const testPath = path.join(
        getTestTemp(),
        'which-prefer-exact-match-on-windows-when-rooted'
      )
      await io.mkdirP(testPath)
      const fileName = 'which-test-file.bat'
      const expectedFilePath = path.join(testPath, fileName)
      const notExpectedFilePath = path.join(testPath, `${fileName}.exe`)
      await fs.writeFile(expectedFilePath, '')
      await fs.writeFile(notExpectedFilePath, '')
      expect(await io.which(path.join(testPath, fileName))).toBe(
        expectedFilePath
      )
    })

    it('which() searches ext in order', async () => {
      const testPath = path.join(getTestTemp(), 'which-searches-ext-in-order')

      // create a directory for testing .COM order preference
      // PATHEXT=.COM;.EXE;.BAT;.CMD...
      const fileNameWithoutExtension = 'which-test-file'
      const comTestPath = path.join(testPath, 'com-test')
      await io.mkdirP(comTestPath)
      await fs.writeFile(
        path.join(comTestPath, `${fileNameWithoutExtension}.com`),
        ''
      )
      await fs.writeFile(
        path.join(comTestPath, `${fileNameWithoutExtension}.exe`),
        ''
      )
      await fs.writeFile(
        path.join(comTestPath, `${fileNameWithoutExtension}.bat`),
        ''
      )
      await fs.writeFile(
        path.join(comTestPath, `${fileNameWithoutExtension}.cmd`),
        ''
      )

      // create a directory for testing .EXE order preference
      // PATHEXT=.COM;.EXE;.BAT;.CMD...
      const exeTestPath = path.join(testPath, 'exe-test')
      await io.mkdirP(exeTestPath)
      await fs.writeFile(
        path.join(exeTestPath, `${fileNameWithoutExtension}.exe`),
        ''
      )
      await fs.writeFile(
        path.join(exeTestPath, `${fileNameWithoutExtension}.bat`),
        ''
      )
      await fs.writeFile(
        path.join(exeTestPath, `${fileNameWithoutExtension}.cmd`),
        ''
      )

      // create a directory for testing .BAT order preference
      // PATHEXT=.COM;.EXE;.BAT;.CMD...
      const batTestPath = path.join(testPath, 'bat-test')
      await io.mkdirP(batTestPath)
      await fs.writeFile(
        path.join(batTestPath, `${fileNameWithoutExtension}.bat`),
        ''
      )
      await fs.writeFile(
        path.join(batTestPath, `${fileNameWithoutExtension}.cmd`),
        ''
      )

      // create a directory for testing .CMD
      const cmdTestPath = path.join(testPath, 'cmd-test')
      await io.mkdirP(cmdTestPath)
      const cmdFilePath = path.join(
        cmdTestPath,
        `${fileNameWithoutExtension}.cmd`
      )
      await fs.writeFile(cmdFilePath, '')

      const originalPath = process.env['PATH']
      try {
        // test .COM
        process.env['PATH'] = `${comTestPath}${path.delimiter}${originalPath}`
        expect(await io.which(fileNameWithoutExtension)).toBe(
          path.join(comTestPath, `${fileNameWithoutExtension}.com`)
        )

        // test .EXE
        process.env['PATH'] = `${exeTestPath}${path.delimiter}${originalPath}`
        expect(await io.which(fileNameWithoutExtension)).toBe(
          path.join(exeTestPath, `${fileNameWithoutExtension}.exe`)
        )

        // test .BAT
        process.env['PATH'] = `${batTestPath}${path.delimiter}${originalPath}`
        expect(await io.which(fileNameWithoutExtension)).toBe(
          path.join(batTestPath, `${fileNameWithoutExtension}.bat`)
        )

        // test .CMD
        process.env['PATH'] = `${cmdTestPath}${path.delimiter}${originalPath}`
        expect(await io.which(fileNameWithoutExtension)).toBe(
          path.join(cmdTestPath, `${fileNameWithoutExtension}.cmd`)
        )
      } finally {
        process.env['PATH'] = originalPath
      }
    })
  }
})

describe('findInPath', () => {
  beforeAll(async () => {
    await io.rmRF(getTestTemp())
  })

  it('findInPath() not found', async () => {
    expect(await io.findInPath('findInPath-test-no-such-file')).toEqual([])
  })

  it('findInPath() finds file names', async () => {
    // create executable files
    let fileName = 'FindInPath-Test-File'
    if (process.platform === 'win32') {
      fileName += '.exe'
    }

    const testPaths = ['1', '2', '3'].map(count =>
      path.join(getTestTemp(), `findInPath-finds-file-names-${count}`)
    )
    for (const testPath of testPaths) {
      await io.mkdirP(testPath)
    }

    const filePaths = testPaths.map(testPath => path.join(testPath, fileName))
    for (const filePath of filePaths) {
      await fs.writeFile(filePath, '')
      if (process.platform !== 'win32') {
        chmod(filePath, '+x')
      }
    }

    const originalPath = process.env['PATH']
    try {
      // update the PATH
      for (const testPath of testPaths) {
        process.env[
          'PATH'
        ] = `${process.env['PATH']}${path.delimiter}${testPath}`
      }
      // exact file names
      expect(await io.findInPath(fileName)).toEqual(filePaths)
    } finally {
      process.env['PATH'] = originalPath
    }
  })
})

async function findsExecutableWithScopedPermissions(
  chmodOptions: string
): Promise<void> {
  // create a executable file
  const testPath = path.join(getTestTemp(), 'which-finds-file-name')
  await io.mkdirP(testPath)
  const fileName = 'Which-Test-File'
  if (process.platform === 'win32') {
    return
  }

  const filePath = path.join(testPath, fileName)
  await fs.writeFile(filePath, '')
  chmod(filePath, chmodOptions)

  const originalPath = process.env['PATH']
  try {
    // update the PATH
    process.env['PATH'] = `${process.env['PATH']}${path.delimiter}${testPath}`

    // exact file name
    expect(await io.which(fileName)).toBe(filePath)
    expect(await io.which(fileName, false)).toBe(filePath)
    expect(await io.which(fileName, true)).toBe(filePath)

    if (process.platform === 'darwin') {
      // not case sensitive on Mac
      expect(await io.which(fileName.toUpperCase())).toBe(
        path.join(testPath, fileName.toUpperCase())
      )
      expect(await io.which(fileName.toUpperCase(), false)).toBe(
        path.join(testPath, fileName.toUpperCase())
      )
      expect(await io.which(fileName.toUpperCase(), true)).toBe(
        path.join(testPath, fileName.toUpperCase())
      )
    } else {
      // case sensitive on Linux
      expect(await io.which(fileName.toUpperCase())).toBe('')
    }
  } finally {
    process.env['PATH'] = originalPath
  }
}

// Assert that a file exists
async function assertExists(filePath: string): Promise<void> {
  expect(await fs.stat(filePath)).toBeDefined()
}

// Assert that reading a file raises an ENOENT error (does not exist)
async function assertNotExists(filePath: string): Promise<void> {
  await expect(fs.stat(filePath)).rejects.toHaveProperty('code', 'ENOENT')
}

function chmod(file: string, mode: string): void {
  const result = child.spawnSync('chmod', [mode, file])
  if (result.status !== 0) {
    const message: string = (result.output || []).join(' ').trim()
    throw new Error(`Command failed: "chmod ${mode} ${file}".  ${message}`)
  }
}

async function createHiddenDirectory(dir: string): Promise<void> {
  if (!path.basename(dir).match(/^\./)) {
    throw new Error(`Expected dir '${dir}' to start with '.'.`)
  }

  await io.mkdirP(dir)
  if (os.platform() === 'win32') {
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

  await io.mkdirP(path.dirname(file))
  await fs.writeFile(file, content)

  if (os.platform() === 'win32') {
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
  return path.join(__dirname, '_temp')
}

/**
 * Creates a symlink directory on OSX/Linux, and a junction point directory on Windows.
 * A symlink directory is not created on Windows since it requires an elevated context.
 */
async function createSymlinkDir(real: string, link: string): Promise<void> {
  if (os.platform() === 'win32') {
    await fs.symlink(real, link, 'junction')
  } else {
    await fs.symlink(real, link)
  }
}
