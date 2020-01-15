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
        const searchPath = '**/*m1.txt'
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

    function getTestTemp(): string {
        return path.join(__dirname, '_temp', 'artifact')
    }

})