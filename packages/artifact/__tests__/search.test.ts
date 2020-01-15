import {SearchResult, findFilesToUpload} from '../src/search'
import * as path from 'path'
import * as io from '../../io/src/io'
import {promises as fs} from 'fs'

describe('search', () => {
    // Remove temp directory after each test
    afterEach(async () => {
        await io.rmRF(getTestTemp())
    })

    /**
     *  Creates a single item in <TempDir>/single-file-artifact/folder-a/folder-b/folder-b/file-under-c.txt
     *  Expected to find that item with full file path provided
     *  Only 1 item is expected to be found so the uploadFilePath is expected to be {artifactName}/file-under-c.txt
     */
    it('Single file search - full path', async () => {
        const artifactName = "my-artifact"
        const root = path.join(getTestTemp(), 'single-file-artifact')
        await fs.mkdir(path.join(root, 'folder-a', 'folder-b', 'folder-c'), {
            recursive: true
        })
        const itemPath = path.join(root, 'folder-a', 'folder-b', 'folder-c', 'file-under-c.txt')
        await fs.writeFile(
            itemPath,
            'sample file under folder c'
        )

        const exepectedUploadFilePath = path.join(artifactName,'file-under-c.txt')
        const searchResult = await findFilesToUpload(artifactName, itemPath)
        expect(searchResult.length).toEqual(1)
        expect(searchResult[0].uploadFilePath).toEqual(exepectedUploadFilePath)
        expect(searchResult[0].absoluteFilePath).toEqual(itemPath)
    })

    /**
     *  Creates a single item in <TempDir>/single-file-artifact/folder-a/folder-b/folder-b/file-under-c.txt
     *  Expected to find that one item with a provided wildcard pattern
     *  Only 1 item is expected to be found so the uploadFilePath is expected to be {artifactName}/file-under-c.txt
     */
    it('Single file search - wildcard pattern', async () => {
        const artifactName = "my-artifact"
        const root = path.join(getTestTemp(), 'single-file-artifact')
        await fs.mkdir(path.join(root, 'folder-a', 'folder-b', 'folder-c'), {
            recursive: true
        })
        const itemPath = path.join(root, 'folder-a', 'folder-b', 'folder-c', 'item1.txt')
        await fs.writeFile(
            itemPath,
            'sample file under folder c'
        )
        const searchPath = path.join(root,'**/*m1.txt')
        const exepectedUploadFilePath = path.join(artifactName,'item1.txt')
        const searchResult = await findFilesToUpload(artifactName, searchPath)
        expect(searchResult.length).toEqual(1)
        expect(searchResult[0].uploadFilePath).toEqual(exepectedUploadFilePath)
        expect(searchResult[0].absoluteFilePath).toEqual(itemPath)
    })

    /**
     *  Creates a directory with multiple files and subdirectories, no empty directories
     *  All items are expected to be found
     */
    it('Directory search - no empty directories', async () => {
        const artifactName = "my-artifact"
        const root = path.join(getTestTemp(), 'single-file-artifact')
        await fs.mkdir(path.join(root, 'folder-a', 'folder-b', 'folder-c'), {
            recursive: true
        })
        await fs.mkdir(path.join(root, 'folder-d'), {
            recursive: true
        })
        const item1Path = path.join(root, 'folder-a', 'folder-b', 'folder-c', 'item1.txt')
        const item2Path = path.join(root, 'folder-d', 'item2.txt')
        const item3Path = path.join(root, 'folder-d', 'item3.txt')
        const item4Path = path.join(root, 'folder-d', 'item4.txt')
        const item5Path = path.join(root, 'item5.txt')
        await fs.writeFile(item1Path, 'item1 file')
        await fs.writeFile(item2Path, 'item2 file')
        await fs.writeFile(item3Path, 'item3 file')
        await fs.writeFile(item4Path, 'item4 file')
        await fs.writeFile(item5Path, 'item5 file')
        /*
        Directory structure of files that were created:
        root/
            folder-a/
                folder-b/
                    folder-c/
                        item1.txt
            folder-d/
                item2.txt
                item3.txt
                item4.txt
            item5.txt
        */
        const searchResult = await findFilesToUpload(artifactName, root)
        expect(searchResult.length).toEqual(5)
        
        const absolutePaths = searchResult.map(item => item.absoluteFilePath)
        expect(absolutePaths.includes(item1Path)).toEqual(true);
        expect(absolutePaths.includes(item2Path)).toEqual(true);
        expect(absolutePaths.includes(item3Path)).toEqual(true);
        expect(absolutePaths.includes(item4Path)).toEqual(true);
        expect(absolutePaths.includes(item5Path)).toEqual(true);

        for (const result of searchResult){
            if(result.absoluteFilePath === item1Path){
                expect(result.uploadFilePath).toEqual(path.join(artifactName,'folder-a', 'folder-b', 'folder-c', 'item1.txt'));
            }
            if(result.absoluteFilePath === item2Path){
                expect(result.uploadFilePath).toEqual(path.join(artifactName,'folder-d', 'item2.txt'));
            }
            if(result.absoluteFilePath === item3Path){
                expect(result.uploadFilePath).toEqual(path.join(artifactName,'folder-d', 'item3.txt'));
            }
            if(result.absoluteFilePath === item4Path){
                expect(result.uploadFilePath).toEqual(path.join(artifactName,'folder-d', 'item4.txt'));
            }
            if(result.absoluteFilePath === item5Path){
                expect(result.uploadFilePath).toEqual(path.join(artifactName,'item5.txt'));
            }
        }
    })

    /**
     *  Creates a directory with multiple files and subdirectories, includes some empty directories
     *  All items are expected to be found
     */
    it('Directory search - with empty directories', async () => {
        const artifactName = "my-artifact"
        const root = path.join(getTestTemp(), 'single-file-artifact')
        await fs.mkdir(path.join(root, 'folder-a', 'folder-b', 'folder-c'), {
            recursive: true
        })
        await fs.mkdir(path.join(root, 'folder-a', 'folder-b', 'folder-e'), {
            recursive: true
        })
        await fs.mkdir(path.join(root, 'folder-d'), {
            recursive: true
        })
        await fs.mkdir(path.join(root, 'folder-f'), {
            recursive: true
        })
        await fs.mkdir(path.join(root, 'folder-g'), {
            recursive: true
        })
        await fs.mkdir(path.join(root, 'folder-h', 'folder-i'), {
            recursive: true
        })
        const item1Path = path.join(root, 'folder-a', 'folder-b', 'folder-c', 'item1.txt')
        const item2Path = path.join(root, 'folder-d', 'item2.txt')
        const item3Path = path.join(root, 'folder-d', 'item3.txt')
        const item4Path = path.join(root, 'folder-d', 'item4.txt')
        const item5Path = path.join(root, 'item5.txt')
        await fs.writeFile(item1Path, 'item1 file')
        await fs.writeFile(item2Path, 'item2 file')
        await fs.writeFile(item3Path, 'item3 file')
        await fs.writeFile(item4Path, 'item4 file')
        await fs.writeFile(item5Path, 'item5 file')
        /*
        Directory structure of files that were created:
        root/
            folder-a/
                folder-b/
                    folder-c/
                        item1.txt
                    folder-e/
            folder-d/
                item2.txt
                item3.txt
                item4.txt
            folder-f/
            folder-g/
            folder-h/
                folder-i/
            item5.txt
        */
        const searchResult = await findFilesToUpload(artifactName, root)
        expect(searchResult.length).toEqual(5)
        
        const absolutePaths = searchResult.map(item => item.absoluteFilePath)
        expect(absolutePaths.includes(item1Path)).toEqual(true);
        expect(absolutePaths.includes(item2Path)).toEqual(true);
        expect(absolutePaths.includes(item3Path)).toEqual(true);
        expect(absolutePaths.includes(item4Path)).toEqual(true);
        expect(absolutePaths.includes(item5Path)).toEqual(true);

        for (const result of searchResult){
            if(result.absoluteFilePath === item1Path){
                expect(result.uploadFilePath).toEqual(path.join(artifactName,'folder-a', 'folder-b', 'folder-c', 'item1.txt'));
            }
            if(result.absoluteFilePath === item2Path){
                expect(result.uploadFilePath).toEqual(path.join(artifactName,'folder-d', 'item2.txt'));
            }
            if(result.absoluteFilePath === item3Path){
                expect(result.uploadFilePath).toEqual(path.join(artifactName,'folder-d', 'item3.txt'));
            }
            if(result.absoluteFilePath === item4Path){
                expect(result.uploadFilePath).toEqual(path.join(artifactName,'folder-d', 'item4.txt'));
            }
            if(result.absoluteFilePath === item5Path){
                expect(result.uploadFilePath).toEqual(path.join(artifactName,'item5.txt'));
            }
        }
    })

    /**
     *  Creates a directory with multiple files and subdirectories, includes some empty directories and misc files
     *  Only files corresponding to the good* pattern should be found
     */
    it('Wildcard search for mulitple files', async () => {
        const artifactName = "my-artifact"
        const root = path.join(getTestTemp(), 'single-file-artifact')
        await fs.mkdir(path.join(root, 'folder-a', 'folder-b', 'folder-c'), {
            recursive: true
        })
        await fs.mkdir(path.join(root, 'folder-a', 'folder-b', 'folder-e'), {
            recursive: true
        })
        await fs.mkdir(path.join(root, 'folder-d'), {
            recursive: true
        })
        await fs.mkdir(path.join(root, 'folder-f'), {
            recursive: true
        })
        await fs.mkdir(path.join(root, 'folder-g'), {
            recursive: true
        })
        await fs.mkdir(path.join(root, 'folder-h', 'folder-i'), {
            recursive: true
        })
        const goodItem1Path = path.join(root, 'folder-a', 'folder-b', 'folder-c', 'good-item1.txt')
        const goodItem2Path = path.join(root, 'folder-d', 'good-item2.txt')
        const goodItem3Path = path.join(root, 'folder-d', 'good-item3.txt')
        const goodItem4Path = path.join(root, 'folder-d', 'good-item4.txt')
        const goodItem5Path = path.join(root, 'good-item5.txt')
        await fs.writeFile(goodItem1Path, 'good item1 file')
        await fs.writeFile(goodItem2Path, 'good item2 file')
        await fs.writeFile(goodItem3Path, 'good item3 file')
        await fs.writeFile(goodItem4Path, 'good item4 file')
        await fs.writeFile(goodItem5Path, 'good item5 file')

        const badItem1Path = path.join(root, 'folder-a', 'folder-b', 'folder-c', 'bad-item1.txt')
        const badItem2Path = path.join(root, 'folder-d', 'bad-item2.txt')
        const badItem3Path = path.join(root, 'folder-f', 'bad-item3.txt')
        const badItem4Path = path.join(root, 'folder-h', 'folder-i', 'bad-item4.txt')
        const badItem5Path = path.join(root, 'folder-h', 'folder-i', 'bad-item5.txt')
        await fs.writeFile(badItem1Path, 'bad item1 file')
        await fs.writeFile(badItem2Path, 'bad item2 file')
        await fs.writeFile(badItem3Path, 'bad item3 file')
        await fs.writeFile(badItem4Path, 'bad item4 file')
        await fs.writeFile(badItem5Path, 'bad item5 file')

        /*
        Directory structure of files that were created:
        root/
            folder-a/
                folder-b/
                    folder-c/
                        good-item1.txt
                        bad-item1.txt
                    folder-e/
            folder-d/
                good-item2.txt
                good-item3.txt
                good-item4.txt
                bad-item2.txt
            folder-f/
                bad-item3.txt
            folder-g/
            folder-h/
                folder-i/
                    bad-item4.txt
                    bad-item5.txt
            good-item5.txt
        */
        const searchPath = path.join(root, '**/good*')
        const searchResult = await findFilesToUpload(artifactName, searchPath)
        expect(searchResult.length).toEqual(5)
        
        const absolutePaths = searchResult.map(item => item.absoluteFilePath)
        expect(absolutePaths.includes(goodItem1Path)).toEqual(true);
        expect(absolutePaths.includes(goodItem2Path)).toEqual(true);
        expect(absolutePaths.includes(goodItem3Path)).toEqual(true);
        expect(absolutePaths.includes(goodItem4Path)).toEqual(true);
        expect(absolutePaths.includes(goodItem5Path)).toEqual(true);

        for (const result of searchResult){
            if(result.absoluteFilePath === goodItem1Path){
                expect(result.uploadFilePath).toEqual(path.join(artifactName,'folder-a', 'folder-b', 'folder-c', 'good-item1.txt'));
            }
            if(result.absoluteFilePath === goodItem2Path){
                expect(result.uploadFilePath).toEqual(path.join(artifactName,'folder-d', 'good-item2.txt'));
            }
            if(result.absoluteFilePath === goodItem3Path){
                expect(result.uploadFilePath).toEqual(path.join(artifactName,'folder-d', 'good-item3.txt'));
            }
            if(result.absoluteFilePath === goodItem4Path){
                expect(result.uploadFilePath).toEqual(path.join(artifactName,'folder-d', 'good-item4.txt'));
            }
            if(result.absoluteFilePath === goodItem5Path){
                expect(result.uploadFilePath).toEqual(path.join(artifactName, 'good-item5.txt'));
            }
        }
    })

    function getTestTemp(): string {
        return path.join(__dirname, '_temp', 'artifact')
    }
})