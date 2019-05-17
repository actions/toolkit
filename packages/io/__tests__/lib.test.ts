import child = require('child_process');
import fs = require('fs');
import path = require('path');
import os = require('os');

import io = require('../src/lib');

describe('cp', () => {
    it('copies file with no flags', async () => {
        let root: string = path.join(getTestTemp(), 'cp_with_no_flags');
        let sourceFile: string = path.join(root, 'cp_source');
        let targetFile: string = path.join(root, 'cp_target');
        await io.mkdirP(root);
        fs.writeFileSync(sourceFile, 'test file content', { encoding: 'utf8' });

        await io.cp(sourceFile, targetFile);

        expect(fs.readFileSync(targetFile, { encoding: 'utf8' })).toBe('test file content');
    });

    it('copies file using -f', async () => {
        let root: string = path.join(path.join(__dirname, '_temp'), 'cp_with_-f');
        let sourceFile: string = path.join(root, 'cp_source');
        let targetFile: string = path.join(root, 'cp_target');
        await io.mkdirP(root);
        fs.writeFileSync(sourceFile, 'test file content');

        await io.cp(sourceFile, targetFile, {recursive: false, force: true});

        expect(fs.readFileSync(targetFile, { encoding: 'utf8' })).toBe('test file content');
    });

    it('try copying to existing file with -n', async () => {
        let root: string = path.join(getTestTemp(), 'cp_to_existing');
        let sourceFile: string = path.join(root, 'cp_source');
        let targetFile: string = path.join(root, 'cp_target');
        await io.mkdirP(root);
        fs.writeFileSync(sourceFile, 'test file content', { encoding: 'utf8' });
        fs.writeFileSync(targetFile, 'correct content', { encoding: 'utf8' });
        let failed = false
        try {
            await io.cp(sourceFile, targetFile, {recursive: false, force: false});
        }
        catch {
            failed = true;
        }
        expect(failed).toBe(true);

        expect(fs.readFileSync(targetFile, { encoding: 'utf8' })).toBe('correct content');
    });

    it('copies directory into existing destination with -r', async () => {
        let root: string = path.join(getTestTemp(), 'cp_with_-r_existing_dest');
        let sourceFolder: string = path.join(root, 'cp_source');
        let sourceFile: string = path.join(sourceFolder, 'cp_source_file');

        let targetFolder: string = path.join(root, 'cp_target');
        let targetFile: string = path.join(targetFolder, 'cp_source', 'cp_source_file');
        await io.mkdirP(sourceFolder);
        fs.writeFileSync(sourceFile, 'test file content', { encoding: 'utf8' });
        await io.mkdirP(targetFolder);
        await io.cp(sourceFolder, targetFolder, {recursive: true});

        expect(fs.readFileSync(targetFile, { encoding: 'utf8' })).toBe('test file content');
    });

    it('copies directory into non-existing destination with -r', async () => {
        let root: string = path.join(getTestTemp(), 'cp_with_-r_nonexisting_dest');
        let sourceFolder: string = path.join(root, 'cp_source');
        let sourceFile: string = path.join(sourceFolder, 'cp_source_file');

        let targetFolder: string = path.join(root, 'cp_target');
        let targetFile: string = path.join(targetFolder, 'cp_source_file');
        await io.mkdirP(sourceFolder);
        fs.writeFileSync(sourceFile, 'test file content', { encoding: 'utf8' });
        await io.cp(sourceFolder, targetFolder, {recursive: true});

        expect(fs.readFileSync(targetFile, { encoding: 'utf8' })).toBe('test file content');
    });

    it('tries to copy directory without -r', async () => {
        let root: string = path.join(getTestTemp(), 'cp_without_-r');
        let sourceFolder: string = path.join(root, 'cp_source');
        let sourceFile: string = path.join(sourceFolder, 'cp_source_file');

        let targetFolder: string = path.join(root, 'cp_target');
        let targetFile: string = path.join(targetFolder, 'cp_source', 'cp_source_file');
        await io.mkdirP(sourceFolder);
        fs.writeFileSync(sourceFile, 'test file content', { encoding: 'utf8' });

        let thrown = false;
        try {
            await io.cp(sourceFolder, targetFolder);
        }
        catch (err) {
            thrown = true;
        }
        expect(thrown).toBe(true);
        expect(fs.existsSync(targetFile)).toBe(false);
    });
});

describe('mv', () => {
    it('moves file with no flags', async () => {
        let root: string = path.join(getTestTemp(), ' mv_with_no_flags');
        let sourceFile: string = path.join(root, ' mv_source');
        let targetFile: string = path.join(root, ' mv_target');
        await io.mkdirP(root);
        fs.writeFileSync(sourceFile, 'test file content', { encoding: 'utf8' });

        await io.mv(sourceFile, targetFile);

        expect(fs.readFileSync(targetFile, { encoding: 'utf8' })).toBe('test file content');
        expect(fs.existsSync(sourceFile)).toBe(false);
    });

    it('moves file using -f', async () => {
        let root: string = path.join(path.join(__dirname, '_temp'), ' mv_with_-f');
        let sourceFile: string = path.join(root, ' mv_source');
        let targetFile: string = path.join(root, ' mv_target');
        await io.mkdirP(root);
        fs.writeFileSync(sourceFile, 'test file content');

        await io.mv(sourceFile, targetFile);

        expect(fs.readFileSync(targetFile, { encoding: 'utf8' })).toBe('test file content');
        expect(fs.existsSync(sourceFile)).toBe(false);
    });

    it('try moving to existing file with -n', async () => {
        let root: string = path.join(getTestTemp(), ' mv_to_existing');
        let sourceFile: string = path.join(root, ' mv_source');
        let targetFile: string = path.join(root, ' mv_target');
        await io.mkdirP(root);
        fs.writeFileSync(sourceFile, 'test file content', { encoding: 'utf8' });
        fs.writeFileSync(targetFile, 'correct content', { encoding: 'utf8' });
        let failed = false
        try {
            await io.mv(sourceFile, targetFile, {force: false});
        }
        catch {
            failed = true;
        }
        expect(failed).toBe(true);

        expect(fs.readFileSync(sourceFile, { encoding: 'utf8' })).toBe('test file content');
        expect(fs.readFileSync(targetFile, { encoding: 'utf8' })).toBe('correct content');
    });

    it('moves directory into existing destination with -r', async () => {
        let root: string = path.join(getTestTemp(), ' mv_with_-r_existing_dest');
        let sourceFolder: string = path.join(root, ' mv_source');
        let sourceFile: string = path.join(sourceFolder, ' mv_source_file');

        let targetFolder: string = path.join(root, ' mv_target');
        let targetFile: string = path.join(targetFolder, ' mv_source', ' mv_source_file');
        await io.mkdirP(sourceFolder);
        fs.writeFileSync(sourceFile, 'test file content', { encoding: 'utf8' });
        await io.mkdirP(targetFolder);
        await io.mv(sourceFolder, targetFolder, {recursive: true});

        expect(fs.readFileSync(targetFile, { encoding: 'utf8' })).toBe('test file content');
        expect(fs.existsSync(sourceFile)).toBe(false);
    });

    it('moves directory into non-existing destination with -r', async () => {
        let root: string = path.join(getTestTemp(), ' mv_with_-r_nonexisting_dest');
        let sourceFolder: string = path.join(root, ' mv_source');
        let sourceFile: string = path.join(sourceFolder, ' mv_source_file');

        let targetFolder: string = path.join(root, ' mv_target');
        let targetFile: string = path.join(targetFolder, ' mv_source_file');
        await io.mkdirP(sourceFolder);
        fs.writeFileSync(sourceFile, 'test file content', { encoding: 'utf8' });
        await io.mv(sourceFolder, targetFolder, {recursive: true});

        expect(fs.readFileSync(targetFile, { encoding: 'utf8' })).toBe('test file content');
        expect(fs.existsSync(sourceFile)).toBe(false);
    });

    it('tries to move directory without -r', async () => {
        let root: string = path.join(getTestTemp(), 'mv_without_-r');
        let sourceFolder: string = path.join(root, 'mv_source');
        let sourceFile: string = path.join(sourceFolder, 'mv_source_file');

        let targetFolder: string = path.join(root, 'mv_target');
        let targetFile: string = path.join(targetFolder, 'mv_source', 'mv_source_file');
        await io.mkdirP(sourceFolder);
        fs.writeFileSync(sourceFile, 'test file content', { encoding: 'utf8' });

        let thrown = false;
        try {
            await io.mv(sourceFolder, targetFolder);
        }
        catch (err) {
            thrown = true;
        }

        expect(thrown).toBe(true);
        expect(fs.existsSync(sourceFile)).toBe(true);
        expect(fs.existsSync(targetFile)).toBe(false);
    });
});

describe('rmRF', () => {
    it('removes single folder with rmRF', async () => {
        var testPath = path.join(getTestTemp(), 'testFolder');

        await io.mkdirP(testPath);
        expect(fs.existsSync(testPath)).toBe(true);

        await io.rmRF(testPath);
        expect(fs.existsSync(testPath)).toBe(false);
    });

    it('removes recursive folders with rmRF', async () => {
        var testPath = path.join(getTestTemp(), 'testDir1');
        var testPath2 = path.join(testPath, 'testDir2');
        await io.mkdirP(testPath2);

        expect(fs.existsSync(testPath)).toBe(true);
        expect(fs.existsSync(testPath2)).toBe(true);

        await io.rmRF(testPath);
        expect(fs.existsSync(testPath)).toBe(false);
        expect(fs.existsSync(testPath2)).toBe(false);
    });

    it('removes folder with locked file with rmRF', async () => {
        var testPath = path.join(getTestTemp(), 'testFolder');
        await io.mkdirP(testPath);
        expect(fs.existsSync(testPath)).toBe(true);

        // can't remove folder with locked file on windows
        var filePath = path.join(testPath, 'file.txt');
        fs.appendFileSync(filePath, 'some data');
        expect(fs.existsSync(filePath)).toBe(true);

        var fd = fs.openSync(filePath, 'r');

        var worked = false;
        try {
            await io.rmRF(testPath);
            worked = true;
        }
        catch (err) { }

        if (os.platform() === 'win32') {
            expect(worked).toBe(false);
            expect(fs.existsSync(testPath)).toBe(true);
        }
        else {
            expect(worked).toBe(true);
            expect(fs.existsSync(testPath)).toBe(false);
        }

        fs.closeSync(fd);
        await io.rmRF(testPath);
        expect(fs.existsSync(testPath)).toBe(false);
    });

    it('removes folder that doesnt exist with rmRF', async () => {
        var testPath = path.join(getTestTemp(), 'testFolder');
        expect(fs.existsSync(testPath)).toBe(false);

        await io.rmRF(testPath);
        expect(fs.existsSync(testPath)).toBe(false);
    });

    it('removes file with rmRF', async () => {
        let file: string = path.join(getTestTemp(), 'rmRF_file');
        fs.writeFileSync(file, 'test file content');
        expect(fs.existsSync(file)).toBe(true);
        await io.rmRF(file);
        expect(fs.existsSync(file)).toBe(false);
    });

    it('removes hidden folder with rmRF', async () => {
        let directory: string = path.join(getTestTemp(), '.rmRF_directory');
        await createHiddenDirectory(directory);
        expect(fs.existsSync(directory)).toBe(true);
        await io.rmRF(directory);
        expect(fs.existsSync(directory)).toBe(false);
    });

    it('removes hidden file with rmRF', async () => {
        let file: string = path.join(getTestTemp(), '.rmRF_file');
        fs.writeFileSync(file, 'test file content');
        expect(fs.existsSync(file)).toBe(true);
        await io.rmRF(file);
        expect(fs.existsSync(file)).toBe(false);
    });

    it('removes symlink folder with rmRF', async () => {
        // create the following layout:
        //   real_directory
        //   real_directory/real_file
        //   symlink_directory -> real_directory
        let root: string = path.join(getTestTemp(), 'rmRF_sym_dir_test');
        let realDirectory: string = path.join(root, 'real_directory');
        let realFile: string = path.join(root, 'real_directory', 'real_file');
        let symlinkDirectory: string = path.join(root, 'symlink_directory');
        await io.mkdirP(realDirectory);
        fs.writeFileSync(realFile, 'test file content');
        createSymlinkDir(realDirectory, symlinkDirectory);
        expect(fs.existsSync(path.join(symlinkDirectory, 'real_file'))).toBe(true);

        await io.rmRF(symlinkDirectory);
        expect(fs.existsSync(realDirectory)).toBe(true);
        expect(fs.existsSync(realFile)).toBe(true);
        expect(fs.existsSync(symlinkDirectory)).toBe(false);
    });

    // creating a symlink to a file on Windows requires elevated
    if (os.platform() != 'win32') {
        it('removes symlink file with rmRF', async () => {
            // create the following layout:
            //   real_file
            //   symlink_file -> real_file
            let root: string = path.join(getTestTemp(), 'rmRF_sym_file_test');
            let realFile: string = path.join(root, 'real_file');
            let symlinkFile: string = path.join(root, 'symlink_file');
            await io.mkdirP(root);
            fs.writeFileSync(realFile, 'test file content');
            fs.symlinkSync(realFile, symlinkFile);
            expect(fs.readFileSync(symlinkFile, { encoding: 'utf8' })).toBe('test file content');

            await io.rmRF(symlinkFile);
            expect(fs.existsSync(realFile)).toBe(true);
            expect(fs.existsSync(symlinkFile)).toBe(false);
        });

        it('removes symlink file with missing source using rmRF', async () => {
            // create the following layout:
            //   real_file
            //   symlink_file -> real_file
            let root: string = path.join(getTestTemp(), 'rmRF_sym_file_missing_source_test');
            let realFile: string = path.join(root, 'real_file');
            let symlinkFile: string = path.join(root, 'symlink_file');
            await io.mkdirP(root);
            fs.writeFileSync(realFile, 'test file content');
            fs.symlinkSync(realFile, symlinkFile);
            expect(fs.readFileSync(symlinkFile, { encoding: 'utf8' })).toBe('test file content');

            // remove the real file
            fs.unlinkSync(realFile);
            expect(fs.lstatSync(symlinkFile).isSymbolicLink()).toBe(true);

            // remove the symlink file
            await io.rmRF(symlinkFile);
            let errcode: string = '';
            try {
                fs.lstatSync(symlinkFile);
            }
            catch (err) {
                errcode = err.code;
            }

            expect(errcode).toBe('ENOENT');
        });

        it('removes symlink level 2 file with rmRF', async () => {
            // create the following layout:
            //   real_file
            //   symlink_file -> real_file
            //   symlink_level_2_file -> symlink_file
            let root: string = path.join(getTestTemp(), 'rmRF_sym_level_2_file_test');
            let realFile: string = path.join(root, 'real_file');
            let symlinkFile: string = path.join(root, 'symlink_file');
            let symlinkLevel2File: string = path.join(root, 'symlink_level_2_file');
            await io.mkdirP(root);
            fs.writeFileSync(realFile, 'test file content');
            fs.symlinkSync(realFile, symlinkFile);
            fs.symlinkSync(symlinkFile, symlinkLevel2File);
            expect(fs.readFileSync(symlinkLevel2File, { encoding: 'utf8' })).toBe('test file content');

            await io.rmRF(symlinkLevel2File);
            expect(fs.existsSync(realFile)).toBe(true);
            expect(fs.existsSync(symlinkFile)).toBe(true);
            expect(fs.existsSync(symlinkLevel2File)).toBe(false);
        });

        it('removes nested symlink file with rmRF', async () => {
            // create the following layout:
            //   real_directory
            //   real_directory/real_file
            //   outer_directory
            //   outer_directory/symlink_file -> real_file
            let root: string = path.join(getTestTemp(), 'rmRF_sym_nest_file_test');
            let realDirectory: string = path.join(root, 'real_directory');
            let realFile: string = path.join(root, 'real_directory', 'real_file');
            let outerDirectory: string = path.join(root, 'outer_directory');
            let symlinkFile: string = path.join(root, 'outer_directory', 'symlink_file');
            await io.mkdirP(realDirectory);
            fs.writeFileSync(realFile, 'test file content');
            await io.mkdirP(outerDirectory);
            fs.symlinkSync(realFile, symlinkFile);
            expect(fs.readFileSync(symlinkFile, { encoding: 'utf8' })).toBe('test file content');

            await io.rmRF(outerDirectory);
            expect(fs.existsSync(realDirectory)).toBe(true);
            expect(fs.existsSync(realFile)).toBe(true);
            expect(fs.existsSync(symlinkFile)).toBe(false);
            expect(fs.existsSync(outerDirectory)).toBe(false);
        });

        it('removes deeply nested symlink file with rmRF', async () => {
            // create the following layout:
            //   real_directory
            //   real_directory/real_file
            //   outer_directory
            //   outer_directory/nested_directory
            //   outer_directory/nested_directory/symlink_file -> real_file
            let root: string = path.join(getTestTemp(), 'rmRF_sym_deep_nest_file_test');
            let realDirectory: string = path.join(root, 'real_directory');
            let realFile: string = path.join(root, 'real_directory', 'real_file');
            let outerDirectory: string = path.join(root, 'outer_directory');
            let nestedDirectory: string = path.join(root, 'outer_directory', 'nested_directory');
            let symlinkFile: string = path.join(root, 'outer_directory', 'nested_directory', 'symlink_file');
            await io.mkdirP(realDirectory);
            fs.writeFileSync(realFile, 'test file content');
            await io.mkdirP(nestedDirectory);
            fs.symlinkSync(realFile, symlinkFile);
            expect(fs.readFileSync(symlinkFile, { encoding: 'utf8' })).toBe('test file content');

            await io.rmRF(outerDirectory);
            expect(fs.existsSync(realDirectory)).toBe(true);
            expect(fs.existsSync(realFile)).toBe(true);
            expect(fs.existsSync(symlinkFile)).toBe(false);
            expect(fs.existsSync(outerDirectory)).toBe(false);
        });
    }

    it('removes symlink folder with missing source using rmRF', async () => {
        // create the following layout:
        //   real_directory
        //   real_directory/real_file
        //   symlink_directory -> real_directory
        let root: string = path.join(getTestTemp(), 'rmRF_sym_dir_miss_src_test');
        let realDirectory: string = path.join(root, 'real_directory');
        let realFile: string = path.join(root, 'real_directory', 'real_file');
        let symlinkDirectory: string = path.join(root, 'symlink_directory');
        await io.mkdirP(realDirectory);
        fs.writeFileSync(realFile, 'test file content');
        createSymlinkDir(realDirectory, symlinkDirectory);
        expect(fs.existsSync(symlinkDirectory)).toBe(true);

        // remove the real directory
        fs.unlinkSync(realFile);
        fs.rmdirSync(realDirectory);
        let errcode: string = '';
        try {
            fs.statSync(symlinkDirectory);
        }
        catch (err){
            errcode = err.code;
        }

        expect(errcode).toBe('ENOENT');

        // lstat shouldn't throw
        fs.lstatSync(symlinkDirectory);

        // remove the symlink directory
        await io.rmRF(symlinkDirectory);
        errcode = '';
        try {
            fs.lstatSync(symlinkDirectory);
        }
        catch (err) {
            errcode = err.code;
        }

        expect(errcode).toBe('ENOENT');
    });

    it('removes symlink level 2 folder with rmRF', async () => {
        // create the following layout:
        //   real_directory
        //   real_directory/real_file
        //   symlink_directory -> real_directory
        //   symlink_level_2_directory -> symlink_directory
        let root: string = path.join(getTestTemp(), 'rmRF_sym_level_2_directory_test');
        let realDirectory: string = path.join(root, 'real_directory');
        let realFile: string = path.join(realDirectory, 'real_file');
        let symlinkDirectory: string = path.join(root, 'symlink_directory');
        let symlinkLevel2Directory: string = path.join(root, 'symlink_level_2_directory');
        await io.mkdirP(realDirectory);
        fs.writeFileSync(realFile, 'test file content');
        createSymlinkDir(realDirectory, symlinkDirectory);
        createSymlinkDir(symlinkDirectory, symlinkLevel2Directory);
        expect(fs.readFileSync(path.join(symlinkDirectory, 'real_file'), { encoding: 'utf8' })).toBe('test file content');
        if (os.platform() == 'win32') {
            expect(fs.readlinkSync(symlinkLevel2Directory)).toBe(symlinkDirectory + '\\');
        }
        else {
            expect(fs.readlinkSync(symlinkLevel2Directory)).toBe(symlinkDirectory);
        }

        await io.rmRF(symlinkLevel2Directory);
        expect(fs.existsSync(path.join(symlinkDirectory, 'real_file'))).toBe(true);
        expect(fs.existsSync(symlinkLevel2Directory)).toBe(false);
    });

    it('removes nested symlink folder with rmRF', async () => {
        // create the following layout:
        //   real_directory
        //   real_directory/real_file
        //   outer_directory
        //   outer_directory/symlink_directory -> real_directory
        let root: string = path.join(getTestTemp(), 'rmRF_sym_nest_dir_test');
        let realDirectory: string = path.join(root, 'real_directory');
        let realFile: string = path.join(root, 'real_directory', 'real_file');
        let outerDirectory: string = path.join(root, 'outer_directory');
        let symlinkDirectory: string = path.join(root, 'outer_directory', 'symlink_directory');
        await io.mkdirP(realDirectory);
        fs.writeFileSync(realFile, 'test file content');
        await io.mkdirP(outerDirectory);
        createSymlinkDir(realDirectory, symlinkDirectory);
        expect(fs.existsSync(path.join(symlinkDirectory, 'real_file'))).toBe(true);

        await io.rmRF(outerDirectory);
        expect(fs.existsSync(realDirectory)).toBe(true);
        expect(fs.existsSync(realFile)).toBe(true);
        expect(fs.existsSync(symlinkDirectory)).toBe(false);
        expect(fs.existsSync(outerDirectory)).toBe(false);
    });

    it('removes deeply nested symlink folder with rmRF', async () => {
        // create the following layout:
        //   real_directory
        //   real_directory/real_file
        //   outer_directory
        //   outer_directory/nested_directory
        //   outer_directory/nested_directory/symlink_directory -> real_directory
        let root: string = path.join(getTestTemp(), 'rmRF_sym_deep_nest_dir_test');
        let realDirectory: string = path.join(root, 'real_directory');
        let realFile: string = path.join(root, 'real_directory', 'real_file');
        let outerDirectory: string = path.join(root, 'outer_directory');
        let nestedDirectory: string = path.join(root, 'outer_directory', 'nested_directory');
        let symlinkDirectory: string = path.join(root, 'outer_directory', 'nested_directory', 'symlink_directory');
        await io.mkdirP(realDirectory);
        fs.writeFileSync(realFile, 'test file content');
        await io.mkdirP(nestedDirectory);
        createSymlinkDir(realDirectory, symlinkDirectory);
        expect(fs.existsSync(path.join(symlinkDirectory, 'real_file'))).toBe(true);

        await io.rmRF(outerDirectory);
        expect(fs.existsSync(realDirectory)).toBe(true);
        expect(fs.existsSync(realFile)).toBe(true);
        expect(fs.existsSync(symlinkDirectory)).toBe(false);
        expect(fs.existsSync(outerDirectory)).toBe(false);
    });

    it('removes hidden file with rmRF', async () => {
        let file: string = path.join(getTestTemp(), '.rmRF_file');
        await io.mkdirP(path.dirname(file));
        await createHiddenFile(file, 'test file content');
        expect(fs.existsSync(file)).toBe(true);
        await io.rmRF(file);
        expect(fs.existsSync(file)).toBe(false);
    });
});

describe('mkdirP', () => {
    beforeAll(async () => {
        await io.rmRF(getTestTemp());
    });

    it('creates folder', async () => {
        var testPath = path.join(getTestTemp(), 'mkdirTest');
        await io.mkdirP(testPath);

        expect(fs.existsSync(testPath)).toBe(true);
    });

    it('creates nested folders with mkdirP', async () => {
        var testPath = path.join(getTestTemp(), 'mkdir1', 'mkdir2');
        await io.mkdirP(testPath);

        expect(fs.existsSync(testPath)).toBe(true);
    });

    it('fails if mkdirP with illegal chars', async () => {
        var testPath = path.join(getTestTemp(), 'mkdir\0');
        var worked: boolean = false;
        try {
            await io.mkdirP(testPath);
            worked = true;
        }
        catch (err) {
            expect(fs.existsSync(testPath)).toBe(false);
        }
        

        expect(worked).toBe(false);
    });

    it('fails if mkdirP with empty path', async () => {
        var worked: boolean = false;
        try {
            await io.mkdirP('');
            worked = true;
        }
        catch (err) { }
        

        expect(worked).toBe(false);
    });

    it('fails if mkdirP with conflicting file path', async () => {
        let testPath = path.join(getTestTemp(), 'mkdirP_conflicting_file_path');
        await io.mkdirP(getTestTemp());
        fs.writeFileSync(testPath, '');
        let worked: boolean = false;
        try {
            await io.mkdirP(testPath);
            worked = true;
        }
        catch (err) { }

        expect(worked).toBe(false);
    });

    it('fails if mkdirP with conflicting parent file path', async () => {
        let testPath = path.join(getTestTemp(), 'mkdirP_conflicting_parent_file_path', 'dir');
        await io.mkdirP(getTestTemp());
        fs.writeFileSync(path.dirname(testPath), '');
        let worked: boolean = false;
        try {
            await io.mkdirP(testPath);
            worked = true;
        }
        catch (err) { }

        expect(worked).toBe(false);
    });

    it('no-ops if mkdirP directory exists', async () => {
        let testPath = path.join(getTestTemp(), 'mkdirP_dir_exists');
        await io.mkdirP(testPath);
        expect(fs.existsSync(testPath)).toBe(true);

        // Calling again shouldn't throw
        await io.mkdirP(testPath);
        expect(fs.existsSync(testPath)).toBe(true);
    });

    it('no-ops if mkdirP with symlink directory', async () => {
        // create the following layout:
        //   real_dir
        //   real_dir/file.txt
        //   symlink_dir -> real_dir
        let rootPath = path.join(getTestTemp(), 'mkdirP_symlink_dir');
        let realDirPath = path.join(rootPath, 'real_dir');
        let realFilePath = path.join(realDirPath, 'file.txt');
        let symlinkDirPath = path.join(rootPath, 'symlink_dir');
        await io.mkdirP(getTestTemp());
        fs.mkdirSync(rootPath);
        fs.mkdirSync(realDirPath);
        fs.writeFileSync(realFilePath, 'test real_dir/file.txt contet');
        createSymlinkDir(realDirPath, symlinkDirPath);

        await io.mkdirP(symlinkDirPath);

        // the file in the real directory should still be accessible via the symlink
        expect(fs.lstatSync(symlinkDirPath).isSymbolicLink()).toBe(true);
        expect(fs.statSync(path.join(symlinkDirPath, 'file.txt')).isFile()).toBe(true);
    });

    it('no-ops if mkdirP with parent symlink directory', async () => {
        // create the following layout:
        //   real_dir
        //   real_dir/file.txt
        //   symlink_dir -> real_dir
        let rootPath = path.join(getTestTemp(), 'mkdirP_parent_symlink_dir');
        let realDirPath = path.join(rootPath, 'real_dir');
        let realFilePath = path.join(realDirPath, 'file.txt');
        let symlinkDirPath = path.join(rootPath, 'symlink_dir');
        await io.mkdirP(getTestTemp());
        fs.mkdirSync(rootPath);
        fs.mkdirSync(realDirPath);
        fs.writeFileSync(realFilePath, 'test real_dir/file.txt contet');
        createSymlinkDir(realDirPath, symlinkDirPath);

        let subDirPath = path.join(symlinkDirPath, 'sub_dir');
        await io.mkdirP(subDirPath);

        // the subdirectory should be accessible via the real directory
        expect(fs.lstatSync(path.join(realDirPath, 'sub_dir')).isDirectory()).toBe(true);
    });

    it('breaks if mkdirP loop out of control', async () => {
        let testPath = path.join(getTestTemp(), 'mkdirP_failsafe', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10');
        process.env['TEST_MKDIRP_FAILSAFE'] = '10';
        try {
            await io.mkdirP(testPath);
            throw new Error("directory should not have been created");
        }
        catch (err) {
            delete process.env['TEST_MKDIRP_FAILSAFE'];

            // ENOENT is expected, all other errors are not
            expect(err.code).toBe('ENOENT');
        }
    });
});

describe('which', () => {
    it('which() finds file name', async () => {
        // create a executable file
        let testPath = path.join(getTestTemp(), 'which-finds-file-name');
        await io.mkdirP(testPath);
        let fileName = 'Which-Test-File';
        if (process.platform == 'win32') {
            fileName += '.exe';
        }

        let filePath = path.join(testPath, fileName);
        fs.writeFileSync(filePath, '');
        if (process.platform != 'win32') {
            chmod(filePath, '+x');
        }

        let originalPath = process.env['PATH'];
        try {
            // update the PATH
            process.env['PATH'] = process.env['PATH'] + path.delimiter + testPath;

            // exact file name
            expect(await io.which(fileName)).toBe(filePath);
            expect(await io.which(fileName, false)).toBe(filePath);
            expect(await io.which(fileName, true)).toBe(filePath);

            if (process.platform == 'win32') {
                // not case sensitive on windows
                expect(await io.which('which-test-file.exe')).toBe(path.join(testPath, 'which-test-file.exe'));
                expect(await io.which('WHICH-TEST-FILE.EXE')).toBe(path.join(testPath, 'WHICH-TEST-FILE.EXE'));
                expect(await io.which('WHICH-TEST-FILE.EXE', false)).toBe(path.join(testPath, 'WHICH-TEST-FILE.EXE'));
                expect(await io.which('WHICH-TEST-FILE.EXE', true)).toBe(path.join(testPath, 'WHICH-TEST-FILE.EXE'));

                // without extension
                expect(await io.which('which-test-file')).toBe(filePath);
                expect(await io.which('which-test-file', false)).toBe(filePath);
                expect(await io.which('which-test-file', true)).toBe(filePath);
            }
            else if (process.platform == 'darwin') {
                // not case sensitive on Mac
                expect(await io.which(fileName.toUpperCase())).toBe(path.join(testPath, fileName.toUpperCase()));
                expect(await io.which(fileName.toUpperCase(), false)).toBe(path.join(testPath, fileName.toUpperCase()));
                expect(await io.which(fileName.toUpperCase(), true)).toBe(path.join(testPath, fileName.toUpperCase()));
            }
            else {
                // case sensitive on Linux
                expect(await io.which(fileName.toUpperCase()) || '').toBe('');
            }
        }
        finally {
            process.env['PATH'] = originalPath;
        }
    });

    it('which() not found', async () => {
        expect(await io.which('which-test-no-such-file')).toBe('');
        expect(await io.which('which-test-no-such-file', false)).toBe('');
        try {
            await io.which('which-test-no-such-file', true);
            throw new Error('Should have thrown');
        }
        catch (err) {
        }
    });

    it('which() searches path in order', async () => {
        // create a chcp.com/bash override file
        let testPath = path.join(getTestTemp(), 'which-searches-path-in-order');
        await io.mkdirP(testPath);
        let fileName;
        if (process.platform == 'win32') {
            fileName = 'chcp.com';
        }
        else {
            fileName = 'bash';
        }

        let filePath = path.join(testPath, fileName);
        fs.writeFileSync(filePath, '');
        if (process.platform != 'win32') {
            chmod(filePath, '+x');
        }

        let originalPath = process.env['PATH'];
        try {
            // sanity - regular chcp.com/bash should be found
            let originalWhich = await io.which(fileName);
            expect(!!(originalWhich || '')).toBe(true);

            // modify PATH
            process.env['PATH'] = testPath + path.delimiter + process.env['PATH'];

            // override chcp.com/bash should be found
            expect(await io.which(fileName)).toBe(filePath);
        }
        finally {
            process.env['PATH'] = originalPath;
        }
    });

    it('which() requires executable', async () => {
        // create a non-executable file
        // on Windows, should not end in valid PATHEXT
        // on Mac/Linux should not have executable bit
        let testPath = path.join(getTestTemp(), 'which-requires-executable');
        await io.mkdirP(testPath);
        let fileName = 'Which-Test-File';
        if (process.platform == 'win32') {
            fileName += '.abc'; // not a valid PATHEXT
        }

        let filePath = path.join(testPath, fileName);
        fs.writeFileSync(filePath, '');
        if (process.platform != 'win32') {
            chmod(filePath, '-x');
        }

        let originalPath = process.env['PATH'];
        try {
            // modify PATH
            process.env['PATH'] = process.env['PATH'] + path.delimiter + testPath;

            // should not be found
            expect(await io.which(fileName) || '').toBe('');
        }
        finally {
            process.env['PATH'] = originalPath;
        }
    });

    // which permissions tests
    it('which() finds executable with different permissions', async () => {
        await findsExecutableWithScopedPermissions('u=rwx,g=r,o=r');
        await findsExecutableWithScopedPermissions('u=rw,g=rx,o=r');
        await findsExecutableWithScopedPermissions('u=rw,g=r,o=rx');
    });

    it('which() ignores directory match', async () => {
        // create a directory
        let testPath = path.join(getTestTemp(), 'which-ignores-directory-match');
        let dirPath = path.join(testPath, 'Which-Test-Dir');
        if (process.platform == 'win32') {
            dirPath += '.exe';
        }

        await io.mkdirP(dirPath);
        if (process.platform != 'win32') {
            chmod(dirPath, '+x');
        }

        let originalPath = process.env['PATH'];
        try {
            // modify PATH
            process.env['PATH'] = process.env['PATH'] + path.delimiter + testPath;

            // should not be found
            expect(await io.which(path.basename(dirPath)) || '').toBe('');
        }
        finally {
            process.env['PATH'] = originalPath;
        }
    });

    it('which() allows rooted path', async () => {
        // create an executable file
        let testPath = path.join(getTestTemp(), 'which-allows-rooted-path');
        await io.mkdirP(testPath);
        let filePath = path.join(testPath, 'Which-Test-File');
        if (process.platform == 'win32') {
            filePath += '.exe';
        }

        fs.writeFileSync(filePath, '');
        if (process.platform != 'win32') {
            chmod(filePath, '+x');
        }

        // which the full path
        expect(await io.which(filePath)).toBe(filePath);
        expect(await io.which(filePath, false)).toBe(filePath);
        expect(await io.which(filePath, true)).toBe(filePath);
    });

    it('which() requires rooted path to be executable', async () => {
        // create a non-executable file
        // on Windows, should not end in valid PATHEXT
        // on Mac/Linux, should not have executable bit
        let testPath = path.join(getTestTemp(), 'which-requires-rooted-path-to-be-executable');
        await io.mkdirP(testPath);
        let filePath = path.join(testPath, 'Which-Test-File');
        if (process.platform == 'win32') {
            filePath += '.abc'; // not a valid PATHEXT
        }

        fs.writeFileSync(filePath, '');
        if (process.platform != 'win32') {
            chmod(filePath, '-x');
        }

        // should not be found
        expect(await io.which(filePath) || '').toBe('');
        expect(await io.which(filePath, false) || '').toBe('');
        let failed = false;
        try {
            await io.which(filePath, true);
        }
        catch (err) {
            failed = true;
        }

        expect(failed).toBe(true);
    });
    
    it('which() requires rooted path to be a file', async () => {
        // create a dir
        let testPath = path.join(getTestTemp(), 'which-requires-rooted-path-to-be-executable');
        let dirPath = path.join(testPath, 'Which-Test-Dir');
        if (process.platform == 'win32') {
            dirPath += '.exe';
        }

        await io.mkdirP(dirPath);
        if (process.platform != 'win32') {
            chmod(dirPath, '+x');
        }

        // should not be found
        expect(await io.which(dirPath) || '').toBe('');
        expect(await io.which(dirPath, false) || '').toBe('');
        let failed = false;
        try {
            await io.which(dirPath, true);
        }
        catch (err) {
            failed = true;
        }

        expect(failed).toBe(true);
    });

    it('which() requires rooted path to exist', async () => {
        let filePath = path.join(__dirname, 'no-such-file');
        if (process.platform == 'win32') {
            filePath += '.exe';
        }

        expect(await io.which(filePath) || '').toBe('');
        expect(await io.which(filePath, false) || '').toBe('');
        let failed = false;
        try {
            await io.which(filePath, true);
        }
        catch (err) {
            failed = true;
        }
        
        expect(failed).toBe(true);
    });

    it('which() does not allow separators', async () => {
        // create an executable file
        let testDirName = 'which-does-not-allow-separators';
        let testPath = path.join(getTestTemp(), testDirName);
        await io.mkdirP(testPath);
        let fileName = 'Which-Test-File';
        if (process.platform == 'win32') {
            fileName += '.exe';
        }

        let filePath = path.join(testPath, fileName);
        fs.writeFileSync(filePath, '');
        if (process.platform != 'win32') {
            chmod(filePath, '+x');
        }

        let originalPath = process.env['PATH'];
        try {
            // modify PATH
            process.env['PATH'] = process.env['PATH'] + path.delimiter + testPath;

            // which "dir/file", should not be found
            expect(await io.which(testDirName + '/' + fileName) || '').toBe('');

            // on Windows, also try "dir\file"
            if (process.platform == 'win32') {
                expect(await io.which(testDirName + '\\' + fileName) || '').toBe('');
            }
        }
        finally {
            process.env['PATH'] = originalPath;
        }
    });

    if (process.platform == 'win32') {
        it('which() resolves actual case file name when extension is applied', async () => {
            const comspec: string = process.env['ComSpec'] || '';
            expect(!!comspec).toBe(true);
            expect(await io.which('CmD.eXe')).toBe(path.join(path.dirname(comspec), 'CmD.eXe'));
            expect(await io.which('CmD')).toBe(comspec);
        });

        it('which() appends ext on windows', async () => {
            // create executable files
            let testPath = path.join(getTestTemp(), 'which-appends-ext-on-windows');
            await io.mkdirP(testPath);
            // PATHEXT=.COM;.EXE;.BAT;.CMD...
            let files: { [key:string]:string; } = {
                "which-test-file-1": path.join(testPath, "which-test-file-1.com"),
                "which-test-file-2": path.join(testPath, "which-test-file-2.exe"),
                "which-test-file-3": path.join(testPath, "which-test-file-3.bat"),
                "which-test-file-4": path.join(testPath, "which-test-file-4.cmd"),
                "which-test-file-5.txt": path.join(testPath, "which-test-file-5.txt.com")
            };
            for (let fileName of Object.keys(files)) {
                fs.writeFileSync(files[fileName], '');
            }

            let originalPath = process.env['PATH'];
            try {
                // modify PATH
                process.env['PATH'] = process.env['PATH'] + path.delimiter + testPath;

                // find each file
                for (let fileName of Object.keys(files)) {
                    expect(await io.which(fileName)).toBe(files[fileName]);
                }
            }
            finally {
                process.env['PATH'] = originalPath;
            }
        });

        it('which() appends ext on windows when rooted', async () => {
            // create executable files
            let testPath = path.join(getTestTemp(), 'which-appends-ext-on-windows-when-rooted');
            await io.mkdirP(testPath);
            // PATHEXT=.COM;.EXE;.BAT;.CMD...
            let files: { [key:string]:string; } = { };
            files[path.join(testPath, "which-test-file-1")] = path.join(testPath, "which-test-file-1.com");
            files[path.join(testPath, "which-test-file-2")] = path.join(testPath, "which-test-file-2.exe");
            files[path.join(testPath, "which-test-file-3")] = path.join(testPath, "which-test-file-3.bat");
            files[path.join(testPath, "which-test-file-4")] = path.join(testPath, "which-test-file-4.cmd");
            files[path.join(testPath, "which-test-file-5.txt")] = path.join(testPath, "which-test-file-5.txt.com");
            for (let fileName of Object.keys(files)) {
                fs.writeFileSync(files[fileName], '');
            }

            // find each file
            for (let fileName of Object.keys(files)) {
                expect(await io.which(fileName)).toBe(files[fileName]);
            }
        });

        it('which() prefer exact match on windows', async () => {
            // create two executable files:
            //   which-test-file.bat
            //   which-test-file.bat.exe
            //
            // verify "which-test-file.bat" returns that file, and not "which-test-file.bat.exe"
            //
            // preference, within the same dir, should be given to the exact match (even though
            // .EXE is defined with higher preference than .BAT in PATHEXT (PATHEXT=.COM;.EXE;.BAT;.CMD...)
            let testPath = path.join(getTestTemp(), 'which-prefer-exact-match-on-windows');
            await io.mkdirP(testPath);
            let fileName = 'which-test-file.bat';
            let expectedFilePath = path.join(testPath, fileName);
            let notExpectedFilePath = path.join(testPath, fileName + '.exe');
            fs.writeFileSync(expectedFilePath, '');
            fs.writeFileSync(notExpectedFilePath, '');
            let originalPath = process.env['PATH'];
            try {
                process.env['PATH'] = process.env['PATH'] + path.delimiter + testPath;
                expect(await io.which(fileName)).toBe(expectedFilePath);
            }
            finally {
                process.env['PATH'] = originalPath;
            }
        });

        it('which() prefer exact match on windows when rooted', async () => {
            // create two executable files:
            //   which-test-file.bat
            //   which-test-file.bat.exe
            //
            // verify "which-test-file.bat" returns that file, and not "which-test-file.bat.exe"
            //
            // preference, within the same dir, should be given to the exact match (even though
            // .EXE is defined with higher preference than .BAT in PATHEXT (PATHEXT=.COM;.EXE;.BAT;.CMD...)
            let testPath = path.join(getTestTemp(), 'which-prefer-exact-match-on-windows-when-rooted');
            await io.mkdirP(testPath);
            let fileName = 'which-test-file.bat';
            let expectedFilePath = path.join(testPath, fileName);
            let notExpectedFilePath = path.join(testPath, fileName + '.exe');
            fs.writeFileSync(expectedFilePath, '');
            fs.writeFileSync(notExpectedFilePath, '');
            expect(await io.which(path.join(testPath, fileName))).toBe(expectedFilePath);
        });

        it('which() searches ext in order', async () => {
            let testPath = path.join(getTestTemp(), 'which-searches-ext-in-order');

            // create a directory for testing .COM order preference
            // PATHEXT=.COM;.EXE;.BAT;.CMD...
            let fileNameWithoutExtension = 'which-test-file';
            let comTestPath = path.join(testPath, 'com-test');
            await io.mkdirP(comTestPath);
            fs.writeFileSync(path.join(comTestPath, fileNameWithoutExtension + '.com'), '');
            fs.writeFileSync(path.join(comTestPath, fileNameWithoutExtension + '.exe'), '');
            fs.writeFileSync(path.join(comTestPath, fileNameWithoutExtension + '.bat'), '');
            fs.writeFileSync(path.join(comTestPath, fileNameWithoutExtension + '.cmd'), '');

            // create a directory for testing .EXE order preference
            // PATHEXT=.COM;.EXE;.BAT;.CMD...
            let exeTestPath = path.join(testPath, 'exe-test');
            await io.mkdirP(exeTestPath);
            fs.writeFileSync(path.join(exeTestPath, fileNameWithoutExtension + '.exe'), '');
            fs.writeFileSync(path.join(exeTestPath, fileNameWithoutExtension + '.bat'), '');
            fs.writeFileSync(path.join(exeTestPath, fileNameWithoutExtension + '.cmd'), '');

            // create a directory for testing .BAT order preference
            // PATHEXT=.COM;.EXE;.BAT;.CMD...
            let batTestPath = path.join(testPath, 'bat-test');
            await io.mkdirP(batTestPath);
            fs.writeFileSync(path.join(batTestPath, fileNameWithoutExtension + '.bat'), '');
            fs.writeFileSync(path.join(batTestPath, fileNameWithoutExtension + '.cmd'), '');

            // create a directory for testing .CMD
            let cmdTestPath = path.join(testPath, 'cmd-test');
            await io.mkdirP(cmdTestPath);
            let cmdTest_cmdFilePath = path.join(cmdTestPath, fileNameWithoutExtension + '.cmd');
            fs.writeFileSync(cmdTest_cmdFilePath, '');

            let originalPath = process.env['PATH'];
            try {
                // test .COM
                process.env['PATH'] = comTestPath + path.delimiter + originalPath;
                expect(await io.which(fileNameWithoutExtension)).toBe(path.join(comTestPath, fileNameWithoutExtension + '.com'));

                // test .EXE
                process.env['PATH'] = exeTestPath + path.delimiter + originalPath;
                expect(await io.which(fileNameWithoutExtension)).toBe(path.join(exeTestPath, fileNameWithoutExtension + '.exe'));

                // test .BAT
                process.env['PATH'] = batTestPath + path.delimiter + originalPath;
                expect(await io.which(fileNameWithoutExtension)).toBe(path.join(batTestPath, fileNameWithoutExtension + '.bat'));

                // test .CMD
                process.env['PATH'] = cmdTestPath + path.delimiter + originalPath;
                expect(await io.which(fileNameWithoutExtension)).toBe(path.join(cmdTestPath, fileNameWithoutExtension + '.cmd'));
            }
            finally {
                process.env['PATH'] = originalPath;
            }
        });
    }
});

async function findsExecutableWithScopedPermissions(chmodOptions: string) {
    // create a executable file
    let testPath = path.join(getTestTemp(), 'which-finds-file-name');
    await io.mkdirP(testPath);
    let fileName = 'Which-Test-File';
    if (process.platform == 'win32') {
        return;
    }

    let filePath = path.join(testPath, fileName);
    fs.writeFileSync(filePath, '');
    chmod(filePath, chmodOptions);

    let originalPath = process.env['PATH'];
    try {
        // update the PATH
        process.env['PATH'] = process.env['PATH'] + path.delimiter + testPath;

        // exact file name
        expect(await io.which(fileName)).toBe(filePath);
        expect(await io.which(fileName, false)).toBe(filePath);
        expect(await io.which(fileName, true)).toBe(filePath);

        if (process.platform == 'darwin') {
            // not case sensitive on Mac
            expect(await io.which(fileName.toUpperCase())).toBe(path.join(testPath, fileName.toUpperCase()));
            expect(await io.which(fileName.toUpperCase(), false)).toBe(path.join(testPath, fileName.toUpperCase()));
            expect(await io.which(fileName.toUpperCase(), true)).toBe(path.join(testPath, fileName.toUpperCase()));
        }
        else {
            // case sensitive on Linux
            expect(await io.which(fileName.toUpperCase()) || '').toBe('');
        }
    }
    finally {
        process.env['PATH'] = originalPath;
    }

    return;
}

function chmod(file: string, mode: string): void {
    let result = child.spawnSync('chmod', [ mode, file ]);
    if (result.status != 0) {
        let message: string = (result.output || []).join(' ').trim();
        throw new Error(`Command failed: "chmod ${mode} ${file}".  ${message}`);
    }
}

async function createHiddenDirectory(dir: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        if (!path.basename(dir).match(/^\./)) {
            reject(`Expected dir '${dir}' to start with '.'.`);
        }

        await io.mkdirP(dir);
        if (os.platform() == 'win32') {
            let result = child.spawnSync('attrib.exe', [ '+H', dir ]);
            if (result.status != 0) {
                let message: string = (result.output || []).join(' ').trim();
                reject(`Failed to set hidden attribute for directory '${dir}'. ${message}`);
            }
        }
        resolve()
    });
};

async function createHiddenFile(file: string, content: string): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        if (!path.basename(file).match(/^\./)) {
            reject(`Expected dir '${file}' to start with '.'.`);
        }

        await io.mkdirP(path.dirname(file));
        fs.writeFileSync(file, content);
        if (os.platform() == 'win32') {
            let result = child.spawnSync('attrib.exe', [ '+H', file ]);
            if (result.status != 0) {
                let message: string = (result.output || []).join(' ').trim();
                reject(`Failed to set hidden attribute for file '${file}'. ${message}`);
            }
        }

        resolve();
    });
};

function getTestTemp() {
    return path.join(__dirname, '_temp');
}

/**
 * Creates a symlink directory on OSX/Linux, and a junction point directory on Windows.
 * A symlink directory is not created on Windows since it requires an elevated context.
 */
function createSymlinkDir(real: string, link: string): void {
    if (os.platform() == 'win32') {
        fs.symlinkSync(real, link, 'junction');
    }
    else {
        fs.symlinkSync(real, link);
    }
};