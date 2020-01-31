import {promises as fs} from 'fs'
import * as path from 'path'
import {findFilesToUpload} from '../src/search'
import * as io from '../../io/src/io'

const artifactName = 'my-artifact'
const root = path.join(__dirname, '_temp', 'artifact-search')
const goodItem1Path = path.join(
  root,
  'folder-a',
  'folder-b',
  'folder-c',
  'good-item1.txt'
)
const goodItem2Path = path.join(root, 'folder-d', 'good-item2.txt')
const goodItem3Path = path.join(root, 'folder-d', 'good-item3.txt')
const goodItem4Path = path.join(root, 'folder-d', 'good-item4.txt')
const goodItem5Path = path.join(root, 'good-item5.txt')
const badItem1Path = path.join(
  root,
  'folder-a',
  'folder-b',
  'folder-c',
  'bad-item1.txt'
)
const badItem2Path = path.join(root, 'folder-d', 'bad-item2.txt')
const badItem3Path = path.join(root, 'folder-f', 'bad-item3.txt')
const badItem4Path = path.join(root, 'folder-h', 'folder-i', 'bad-item4.txt')
const badItem5Path = path.join(root, 'folder-h', 'folder-i', 'bad-item5.txt')
const extraFileInFolderCPath = path.join(
  root,
  'folder-a',
  'folder-b',
  'folder-c',
  'extra-file-in-folder-c.txt'
)
const amazingFileInFolderHPath = path.join(root, 'folder-h', 'amazing-item.txt')

describe('Search', () => {
  beforeAll(async () => {
    // clear temp directory
    await io.rmRF(root)
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

    await fs.writeFile(goodItem1Path, 'good item1 file')
    await fs.writeFile(goodItem2Path, 'good item2 file')
    await fs.writeFile(goodItem3Path, 'good item3 file')
    await fs.writeFile(goodItem4Path, 'good item4 file')
    await fs.writeFile(goodItem5Path, 'good item5 file')

    await fs.writeFile(badItem1Path, 'bad item1 file')
    await fs.writeFile(badItem2Path, 'bad item2 file')
    await fs.writeFile(badItem3Path, 'bad item3 file')
    await fs.writeFile(badItem4Path, 'bad item4 file')
    await fs.writeFile(badItem5Path, 'bad item5 file')

    await fs.writeFile(extraFileInFolderCPath, 'extra file')

    await fs.writeFile(amazingFileInFolderHPath, 'amazing file')
    /*
      Directory structure of files that were created:
      root/
          folder-a/
              folder-b/
                  folder-c/
                      good-item1.txt
                      bad-item1.txt
                      extra-file-in-folder-c.txt
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
              amazing-item.txt
              folder-i/
                  bad-item4.txt
                  bad-item5.txt
          good-item5.txt
    */
  })

  afterAll(async () => {
    await io.rmRF(root)
  })

  /**
   *  Expected to find one item with full file path provided
   *  Only 1 item is expected to be found so the uploadFilePath is expected to be {artifactName}/extra-file-in-folder-c.txt
   */
  it('Single file search - full path', async () => {
    const expectedUploadFilePath = path.join(
      artifactName,
      'extra-file-in-folder-c.txt'
    )
    const searchResult = await findFilesToUpload(
      artifactName,
      extraFileInFolderCPath
    )
    /*
      searchResult[] should be equal to:
      [
        {
          absoluteFilePath: extraFileInFolderCPath
          uploadFilePath: my-artifact/extra-file-in-folder-c.txt
        }
      ]
    */

    expect(searchResult.length).toEqual(1)
    expect(searchResult[0].uploadFilePath).toEqual(expectedUploadFilePath)
    expect(searchResult[0].absoluteFilePath).toEqual(extraFileInFolderCPath)
  })

  /**
   *  Expected to find one item with the provided wildcard pattern
   *  Only 1 item is expected to be found so the uploadFilePath is expected to be {artifactName}/good-item1.txt
   */
  it('Single file search - wildcard pattern', async () => {
    const searchPath = path.join(root, '**/good*m1.txt')
    const expectedUploadFilePath = path.join(artifactName, 'good-item1.txt')
    const searchResult = await findFilesToUpload(artifactName, searchPath)
    /*
      searchResult should be equal to:
      [
        {
          absoluteFilePath: goodItem1Path
          uploadFilePath: my-artifact/good-item1.txt
        }
      ]
    */

    expect(searchResult.length).toEqual(1)
    expect(searchResult[0].uploadFilePath).toEqual(expectedUploadFilePath)
    expect(searchResult[0].absoluteFilePath).toEqual(goodItem1Path)
  })

  /**
   *  Creates a directory with multiple files and subdirectories, includes some empty directories and misc files
   *  Only files corresponding to the good* pattern should be found
   */
  it('Wildcard search for multiple files', async () => {
    const searchPath = path.join(root, '**/good*')
    const searchResult = await findFilesToUpload(artifactName, searchPath)
    /*
      searchResult should be equal to:
      [
        {
          absoluteFilePath: goodItem1Path
          uploadFilePath: my-artifact/folder-a/folder-b/folder-c/good-item1.txt
        },
        {
          absoluteFilePath: goodItem2Path
          uploadFilePath: my-artifact/folder-d/good-item2.txt
        },
        {
          absoluteFilePath: goodItem3Path
          uploadFilePath: my-artifact/folder-d/good-item3.txt
        },
        {
          absoluteFilePath: goodItem4Path
          uploadFilePath: my-artifact/folder-d/good-item4.txt
        },
        {
          absoluteFilePath: goodItem5Path
          uploadFilePath: my-artifact/good-item5.txt
        }
      ]
    */

    expect(searchResult.length).toEqual(5)

    const absolutePaths = searchResult.map(item => item.absoluteFilePath)
    expect(absolutePaths.includes(goodItem1Path)).toEqual(true)
    expect(absolutePaths.includes(goodItem2Path)).toEqual(true)
    expect(absolutePaths.includes(goodItem3Path)).toEqual(true)
    expect(absolutePaths.includes(goodItem4Path)).toEqual(true)
    expect(absolutePaths.includes(goodItem5Path)).toEqual(true)

    for (const result of searchResult) {
      if (result.absoluteFilePath === goodItem1Path) {
        expect(result.uploadFilePath).toEqual(
          path.join(
            artifactName,
            'folder-a',
            'folder-b',
            'folder-c',
            'good-item1.txt'
          )
        )
      }
      if (result.absoluteFilePath === goodItem2Path) {
        expect(result.uploadFilePath).toEqual(
          path.join(artifactName, 'folder-d', 'good-item2.txt')
        )
      }
      if (result.absoluteFilePath === goodItem3Path) {
        expect(result.uploadFilePath).toEqual(
          path.join(artifactName, 'folder-d', 'good-item3.txt')
        )
      }
      if (result.absoluteFilePath === goodItem4Path) {
        expect(result.uploadFilePath).toEqual(
          path.join(artifactName, 'folder-d', 'good-item4.txt')
        )
      }
      if (result.absoluteFilePath === goodItem5Path) {
        expect(result.uploadFilePath).toEqual(
          path.join(artifactName, 'good-item5.txt')
        )
      }
    }
  })

  /**
   *  Creates a directory with multiple files and subdirectories, includes some empty directories
   *  All items are expected to be found
   */
  it('Directory search - find everything', async () => {
    const searchResult = await findFilesToUpload(
      artifactName,
      path.join(root, 'folder-h')
    )
    /*
      searchResult should be equal to:
      [
        {
          absoluteFilePath: amazingFileInFolderHPath
          uploadFilePath: my-artifact/folder-h/amazing-item.txt
        },
        {
          absoluteFilePath: badItem4Path
          uploadFilePath: my-artifact/folder-h/folder-i/bad-item4.txt
        },
        {
          absoluteFilePath: badItem5Path
          uploadFilePath: my-artifact/folder-h/folder-i/bad-item5.txt
        }
      ]
    */

    expect(searchResult.length).toEqual(3)

    const absolutePaths = searchResult.map(item => item.absoluteFilePath)
    expect(absolutePaths.includes(amazingFileInFolderHPath)).toEqual(true)
    expect(absolutePaths.includes(badItem4Path)).toEqual(true)
    expect(absolutePaths.includes(badItem5Path)).toEqual(true)

    for (const result of searchResult) {
      if (result.absoluteFilePath === amazingFileInFolderHPath) {
        expect(result.uploadFilePath).toEqual(
          path.join(artifactName, 'amazing-item.txt')
        )
      }
      if (result.absoluteFilePath === badItem4Path) {
        expect(result.uploadFilePath).toEqual(
          path.join(artifactName, 'folder-i', 'bad-item4.txt')
        )
      }
      if (result.absoluteFilePath === badItem5Path) {
        expect(result.uploadFilePath).toEqual(
          path.join(artifactName, 'folder-i', 'bad-item5.txt')
        )
      }
    }
  })
})
