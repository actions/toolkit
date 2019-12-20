import * as child from 'child_process'
import * as glob from '../src/glob'
import * as io from '../../io/src/io'
import * as path from 'path'
import {promises as fs} from 'fs'

const IS_WINDOWS = process.platform === 'win32'

// todo add more tests from old lib internalhelpertests, matchtests, and findmatchtests

/**
 * These test focus on the ability of glob to find files
 * and not on the pattern matching aspect
 */
describe('glob (search)', () => {
  beforeAll(async () => {
    await io.rmRF(getTestTemp())
  })

  it('returns hidden files', async () => {
    // Create the following layout:
    //   search_hidden_files
    //   search_hidden_files/.emptyFolder
    //   search_hidden_files/.file
    //   search_hidden_files/.folder
    //   search_hidden_files/.folder/file
    const root = path.join(getTestTemp(), 'search_hidden_files')
    await createHiddenDirectory(path.join(root, '.emptyFolder'))
    await createHiddenDirectory(path.join(root, '.folder'))
    await createHiddenFile(path.join(root, '.file'), 'test .file content')
    await fs.writeFile(
      path.join(root, '.folder', 'file'),
      'test .folder/file content'
    )

    const itemPaths = await glob.glob(root)
    expect(itemPaths).toHaveLength(5)
    expect(itemPaths[0]).toBe(root)
    expect(itemPaths[1]).toBe(path.join(root, '.emptyFolder'))
    expect(itemPaths[2]).toBe(path.join(root, '.file'))
    expect(itemPaths[3]).toBe(path.join(root, '.folder'))
    expect(itemPaths[4]).toBe(path.join(root, '.folder', 'file'))
  })

  it('returns depth first', async () => {
    // Create the following layout:
    //   find_depth_first/a_file
    //   find_depth_first/b_folder
    //   find_depth_first/b_folder/a_file
    //   find_depth_first/b_folder/b_folder
    //   find_depth_first/b_folder/b_folder/file
    //   find_depth_first/b_folder/c_file
    //   find_depth_first/c_file
    const root = path.join(getTestTemp(), 'search_depth_first')
    await fs.mkdir(path.join(root, 'b_folder', 'b_folder'), {recursive: true})
    await fs.writeFile(path.join(root, 'a_file'), 'test a_file content')
    await fs.writeFile(
      path.join(root, 'b_folder', 'a_file'),
      'test b_folder/a_file content'
    )
    await fs.writeFile(
      path.join(root, 'b_folder', 'b_folder', 'file'),
      'test b_folder/b_folder/file content'
    )
    await fs.writeFile(
      path.join(root, 'b_folder', 'c_file'),
      'test b_folder/c_file content'
    )
    await fs.writeFile(path.join(root, 'c_file'), 'test c_file content')

    const itemPaths = await glob.glob(root)
    expect(itemPaths).toHaveLength(8)
    expect(itemPaths[0]).toBe(root)
    expect(itemPaths[1]).toBe(path.join(root, 'a_file'))
    expect(itemPaths[2]).toBe(path.join(root, 'b_folder'))
    expect(itemPaths[3]).toBe(path.join(root, 'b_folder', 'a_file'))
    expect(itemPaths[4]).toBe(path.join(root, 'b_folder', 'b_folder'))
    expect(itemPaths[5]).toBe(path.join(root, 'b_folder', 'b_folder', 'file'))
    expect(itemPaths[6]).toBe(path.join(root, 'b_folder', 'c_file'))
    expect(itemPaths[7]).toBe(path.join(root, 'c_file'))
  })

  it('returns empty when not exists', async () => {
    const itemPaths = await glob.glob(path.join(getTestTemp(), 'nosuch'))
    expect(itemPaths).toHaveLength(0)
  })

  it('does not follow specified symlink when follow symlink false', async () => {
    // Create the following layout:
    //   realDir
    //   realDir/file
    //   symDir -> realDir
    const root = path.join(getTestTemp(), 'search_no_follow_specified_symlink')
    await fs.mkdir(path.join(root, 'realDir'), {recursive: true})
    await fs.writeFile(path.join(root, 'realDir', 'file'), 'test file content')
    await createSymlinkDir(
      path.join(root, 'realDir'),
      path.join(root, 'symDir')
    )

    const itemPaths = await glob.glob(path.join(root, 'symDir'), {
      followSymbolicLinks: false
    })
    expect(itemPaths).toHaveLength(1)
    expect(itemPaths[0]).toBe(path.join(root, 'symDir'))
  })

  it('follows specified symlink', async () => {
    // Create the following layout:
    //   realDir
    //   realDir/file
    //   symDir -> realDir
    const root = path.join(getTestTemp(), 'search_follow_specified_symlink')
    await fs.mkdir(path.join(root, 'realDir'), {recursive: true})
    await fs.writeFile(path.join(root, 'realDir', 'file'), 'test file content')
    await createSymlinkDir(
      path.join(root, 'realDir'),
      path.join(root, 'symDir')
    )

    const itemPaths = await glob.glob(path.join(root, 'symDir'))
    expect(itemPaths).toHaveLength(2)
    expect(itemPaths[0]).toBe(path.join(root, 'symDir'))
    expect(itemPaths[1]).toBe(path.join(root, 'symDir', 'file'))
  })

  it('does not follow symlink when follow symlink false', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/realDir
    //   <root>/realDir/file
    //   <root>/symDir -> <root>/realDir
    const root = path.join(getTestTemp(), 'search_no_follow_symlink')
    await fs.mkdir(path.join(root, 'realDir'), {recursive: true})
    await fs.writeFile(path.join(root, 'realDir', 'file'), 'test file content')
    await createSymlinkDir(
      path.join(root, 'realDir'),
      path.join(root, 'symDir')
    )

    const itemPaths = await glob.glob(root, {followSymbolicLinks: false})
    expect(itemPaths).toHaveLength(4)
    expect(itemPaths[0]).toBe(root)
    expect(itemPaths[1]).toBe(path.join(root, 'realDir'))
    expect(itemPaths[2]).toBe(path.join(root, 'realDir', 'file'))
    expect(itemPaths[3]).toBe(path.join(root, 'symDir'))
  })

  it('follows symlink', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/realDir
    //   <root>/realDir/file
    //   <root>/symDir -> <root>/realDir
    const root = path.join(getTestTemp(), 'search_follow_symlink')
    await fs.mkdir(path.join(root, 'realDir'), {recursive: true})
    await fs.writeFile(path.join(root, 'realDir', 'file'), 'test file content')
    await createSymlinkDir(
      path.join(root, 'realDir'),
      path.join(root, 'symDir')
    )

    const itemPaths = await glob.glob(root)
    expect(itemPaths).toHaveLength(5)
    expect(itemPaths[0]).toBe(root)
    expect(itemPaths[1]).toBe(path.join(root, 'realDir'))
    expect(itemPaths[2]).toBe(path.join(root, 'realDir', 'file'))
    expect(itemPaths[3]).toBe(path.join(root, 'symDir'))
    expect(itemPaths[4]).toBe(path.join(root, 'symDir', 'file'))
  })

  it('result includes broken symlink when follow symlink false', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/brokenSym -> <root>/noSuch
    //   <root>/realDir
    //   <root>/realDir/file
    //   <root>/symDir -> <root>/realDir
    const root = path.join(
      getTestTemp(),
      'search_no_follow_symlink_result_includes_broken_symlink'
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
    expect(itemPaths).toHaveLength(5)
    expect(itemPaths[0]).toBe(root)
    expect(itemPaths[1]).toBe(path.join(root, 'brokenSym'))
    expect(itemPaths[2]).toBe(path.join(root, 'realDir'))
    expect(itemPaths[3]).toBe(path.join(root, 'realDir', 'file'))
    expect(itemPaths[4]).toBe(path.join(root, 'symDir'))
  })

  it('result includes specified broken symlink when follow symlink false', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/brokenSym -> <root>/noSuch
    const root = path.join(
      getTestTemp(),
      'search_no_follow_symlink_result_includes_specified_broken_symlink'
    )
    await fs.mkdir(root, {recursive: true})
    const brokenSymPath = path.join(root, 'brokenSym')
    await createSymlinkDir(path.join(root, 'noSuch'), brokenSymPath)

    const itemPaths = await glob.glob(brokenSymPath, {
      followSymbolicLinks: false
    })
    expect(itemPaths).toHaveLength(1)
    expect(itemPaths[0]).toBe(brokenSymPath)
  })

  it('result includes nested broken symlink when follow symlink false', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/brokenSym -> <root>/noSuch
    //   <root>/realDir
    //   <root>/realDir/file
    //   <root>/symDir -> <root>/realDir
    const root = path.join(
      getTestTemp(),
      'search_no_follow_symlink_result_includes_nested_broken_symlink'
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
    expect(itemPaths).toHaveLength(5)
    expect(itemPaths[0]).toBe(root)
    expect(itemPaths[1]).toBe(path.join(root, 'brokenSym'))
    expect(itemPaths[2]).toBe(path.join(root, 'realDir'))
    expect(itemPaths[3]).toBe(path.join(root, 'realDir', 'file'))
    expect(itemPaths[4]).toBe(path.join(root, 'symDir'))
  })

  it('does not allow specified broken symlink when omit broken symlinks false', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/brokenSym -> <root>/noSuch
    const root = path.join(
      getTestTemp(),
      'search_throws_when_specified_broken_symlink_and_omit_broken_symlink_false'
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

  it('does not allow broken symlink when omit broken symlinks false', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/brokenSym -> <root>/noSuch
    const root = path.join(
      getTestTemp(),
      'search_not_allow_broken_symlink_when_omit_broken_symlink_false'
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

  it('omit broken symlink', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/brokenSym -> <root>/noSuch
    //   <root>/realDir
    //   <root>/realDir/file
    //   <root>/symDir -> <root>/realDir
    const root = path.join(getTestTemp(), 'search_omit_broken_symlink')
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
    expect(itemPaths).toHaveLength(5)
    expect(itemPaths[0]).toBe(root)
    expect(itemPaths[1]).toBe(path.join(root, 'realDir'))
    expect(itemPaths[2]).toBe(path.join(root, 'realDir', 'file'))
    expect(itemPaths[3]).toBe(path.join(root, 'symDir'))
    expect(itemPaths[4]).toBe(path.join(root, 'symDir', 'file'))
  })

  it('omit specified broken symlink', async () => {
    // Create the following layout:
    //   <root>
    //   <root>/brokenSym -> <root>/noSuch
    const root = path.join(
      getTestTemp(),
      'search_omit_specified_broken_symlink'
    )
    await fs.mkdir(root, {recursive: true})
    const brokenSymPath = path.join(root, 'brokenSym')
    await createSymlinkDir(path.join(root, 'noSuch'), brokenSymPath)
    await fs.lstat(brokenSymPath)

    const itemPaths = await glob.glob(brokenSymPath)
    expect(itemPaths).toHaveLength(0)
  })

  // it('detects cycle', (done: MochaDone) => {
  //     this.timeout(1000);

  //     // create the following layout:
  //     //   <root>
  //     //   <root>/file
  //     //   <root>/symDir -> <root>
  //     let root: string = path.join(testutil.getTestTemp(), 'find_detects_cycle');
  //     tl.mkdirP(root);
  //     fs.writeFileSync(path.join(root, 'file'), 'test file content');
  //     testutil.createSymlinkDir(root, path.join(root, 'symDir'));

  //     let itemPaths: string[] = tl.find(root, { followSymbolicLinks: true } as tl.FindOptions);
  //     assert.equal(itemPaths.length, 3);
  //     assert.equal(itemPaths[0], root);
  //     assert.equal(itemPaths[1], path.join(root, 'file'));
  //     assert.equal(itemPaths[2], path.join(root, 'symDir'));

  //     done();
  // });

  // it('detects cycle starting from symlink', (done: MochaDone) => {
  //     this.timeout(1000);

  //     // create the following layout:
  //     //   <root>
  //     //   <root>/file
  //     //   <root>/symDir -> <root>
  //     let root: string = path.join(testutil.getTestTemp(), 'find_detects_cycle_starting_from_symlink');
  //     tl.mkdirP(root);
  //     fs.writeFileSync(path.join(root, 'file'), 'test file content');
  //     testutil.createSymlinkDir(root, path.join(root, 'symDir'));

  //     let itemPaths: string[] = tl.find(path.join(root, 'symDir'), { followSymbolicLinks: true } as tl.FindOptions);
  //     assert.equal(itemPaths.length, 3);
  //     assert.equal(itemPaths[0], path.join(root, 'symDir'));
  //     assert.equal(itemPaths[1], path.join(root, 'symDir', 'file'));
  //     assert.equal(itemPaths[2], path.join(root, 'symDir', 'symDir'));

  //     done();
  // });

  // it('detects deep cycle starting from middle', (done: MochaDone) => {
  //     this.timeout(1000);

  //     // create the following layout:
  //     //   <root>
  //     //   <root>/file_under_root
  //     //   <root>/folder_a
  //     //   <root>/folder_a/file_under_a
  //     //   <root>/folder_a/folder_b
  //     //   <root>/folder_a/folder_b/file_under_b
  //     //   <root>/folder_a/folder_b/folder_c
  //     //   <root>/folder_a/folder_b/folder_c/file_under_c
  //     //   <root>/folder_a/folder_b/folder_c/sym_folder -> <root>
  //     let root: string = path.join(testutil.getTestTemp(), 'find_detects_deep_cycle_starting_from_middle');
  //     tl.mkdirP(path.join(root, 'folder_a', 'folder_b', 'folder_c'));
  //     fs.writeFileSync(path.join(root, 'file_under_root'), 'test file under root contents');
  //     fs.writeFileSync(path.join(root, 'folder_a', 'file_under_a'), 'test file under a contents');
  //     fs.writeFileSync(path.join(root, 'folder_a', 'folder_b', 'file_under_b'), 'test file under b contents');
  //     fs.writeFileSync(path.join(root, 'folder_a', 'folder_b', 'folder_c', 'file_under_c'), 'test file under c contents');
  //     testutil.createSymlinkDir(root, path.join(root, 'folder_a', 'folder_b', 'folder_c', 'sym_folder'));
  //     assert.doesNotThrow(
  //         () => fs.statSync(path.join(root, 'folder_a', 'folder_b', 'folder_c', 'sym_folder', 'file_under_root')),
  //         'symlink_folder should be created properly');

  //     let itemPaths: string[] = tl.find(path.join(root, 'folder_a', 'folder_b'), { followSymbolicLinks: true } as tl.FindOptions);
  //     assert.equal(itemPaths.length, 9);
  //     assert.equal(itemPaths[0], path.join(root, 'folder_a', 'folder_b'));
  //     assert.equal(itemPaths[1], path.join(root, 'folder_a', 'folder_b', 'file_under_b'));
  //     assert.equal(itemPaths[2], path.join(root, 'folder_a', 'folder_b', 'folder_c'));
  //     assert.equal(itemPaths[3], path.join(root, 'folder_a', 'folder_b', 'folder_c', 'file_under_c'));
  //     assert.equal(itemPaths[4], path.join(root, 'folder_a', 'folder_b', 'folder_c', 'sym_folder'));
  //     assert.equal(itemPaths[5], path.join(root, 'folder_a', 'folder_b', 'folder_c', 'sym_folder', 'file_under_root'));
  //     assert.equal(itemPaths[6], path.join(root, 'folder_a', 'folder_b', 'folder_c', 'sym_folder', 'folder_a'));
  //     assert.equal(itemPaths[7], path.join(root, 'folder_a', 'folder_b', 'folder_c', 'sym_folder', 'folder_a', 'file_under_a'));
  //     assert.equal(itemPaths[8], path.join(root, 'folder_a', 'folder_b', 'folder_c', 'sym_folder', 'folder_a', 'folder_b'));

  //     done();
  // });

  // it('default options', (done: MochaDone) => {
  //     this.timeout(1000);

  //     // create the following layout:
  //     //   <root>
  //     //   <root>/real_folder
  //     //   <root>/real_folder/file_under_real_folder
  //     //   <root>/sym_folder -> real_folder
  //     let root: string = path.join(testutil.getTestTemp(), 'find_default_options');
  //     tl.mkdirP(path.join(root, 'real_folder'));
  //     fs.writeFileSync(path.join(root, 'real_folder', 'file_under_real_folder'), 'test file under real folder');
  //     testutil.createSymlinkDir(path.join(root, 'real_folder'), path.join(root, 'sym_folder'));
  //     assert.doesNotThrow(
  //         () => fs.statSync(path.join(root, 'sym_folder', 'file_under_real_folder')),
  //         'sym_folder should be created properly');

  //     // assert the expected files are returned
  //     let actual: string[] = tl.find(root);
  //     let expected: string[] = [
  //         root,
  //         path.join(root, 'real_folder'),
  //         path.join(root, 'real_folder', 'file_under_real_folder'),
  //         path.join(root, 'sym_folder'),
  //         path.join(root, 'sym_folder', 'file_under_real_folder'),
  //     ];
  //     assert.deepEqual(actual, expected);

  //     done();
  // });

  // it('default options do not allow broken symlinks', (done: MochaDone) => {
  //     this.timeout(1000);

  //     // create the following layout:
  //     //   <root>
  //     //   <root>/broken_symlink -> no_such_file
  //     let root: string = path.join(testutil.getTestTemp(), 'find_default_options_broken_symlink');
  //     tl.mkdirP(root);
  //     testutil.createSymlinkDir(path.join(root, 'no_such_file'), path.join(root, 'broken_symlink'));

  //     // assert the broken symlink is a problem
  //     try {
  //         tl.find(root);
  //         throw new Error('Expected tl.find to throw');
  //     }
  //     catch (err) {
  //         assert(err.message.match(/ENOENT.*broken_symlink/), `Expected broken symlink error message, actual: '${err.message}'`);
  //     }

  //     done();
  // });

  // it('empty find path returns empty array', (done: MochaDone) => {
  //     this.timeout(1000);

  //     let actual: string[] = tl.find('');
  //     assert.equal(typeof actual, 'object');
  //     assert.equal(actual.length, 0);

  //     done();
  // });

  // it('normalizes find path', (done: MochaDone) => {
  //     this.timeout(1000);

  //     // create the following layout:
  //     //   <root>/hello/world.txt
  //     let root: string = path.join(testutil.getTestTemp(), 'find_normalizes_separators');
  //     tl.mkdirP(path.join(root, 'hello'));
  //     fs.writeFileSync(path.join(root, 'hello', 'world.txt'), '');

  //     let actual: string[] = tl.find(root + path.sep + path.sep + path.sep + 'nosuch' + path.sep + '..' + path.sep + 'hello');
  //     let expected: string[] = [
  //         path.join(root, 'hello'),
  //         path.join(root, 'hello', 'world.txt'),
  //     ];
  //     assert.deepEqual(actual, expected);

  //     done();
  // });
})

// function chmod(file: string, mode: string): void {
//   const result = child.spawnSync('chmod', [mode, file])
//   if (result.status !== 0) {
//     const message: string = (result.output || []).join(' ').trim()
//     throw new Error(`Command failed: "chmod ${mode} ${file}".  ${message}`)
//   }
// }

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
  return path.join(__dirname, '_temp')
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
