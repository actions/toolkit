import * as io from '../../io/src/io'
import * as path from 'path'
import {promises as fs} from 'fs'
import * as core from '@actions/core'
import {getUploadSpecification} from '../src/internal/upload-specification'

const artifactName = 'my-artifact'
const root = path.join(__dirname, '_temp', 'upload-specification')
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

const artifactFilesToUpload = [
  goodItem1Path,
  goodItem2Path,
  goodItem3Path,
  goodItem4Path,
  goodItem5Path,
  extraFileInFolderCPath,
  amazingFileInFolderHPath
]

describe('Search', () => {
  beforeAll(async () => {
    // mock all output so that there is less noise when running tests
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(core, 'debug').mockImplementation(() => {})
    jest.spyOn(core, 'info').mockImplementation(() => {})
    jest.spyOn(core, 'warning').mockImplementation(() => {})

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
      Directory structure of files that get created:
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

  it('Upload Specification - Fail non-existent rootDirectory', async () => {
    const invalidRootDirectory = path.join(
      __dirname,
      '_temp',
      'upload-specification-invalid'
    )
    expect(() => {
      getUploadSpecification(
        artifactName,
        invalidRootDirectory,
        artifactFilesToUpload
      )
    }).toThrow(`Provided rootDirectory ${invalidRootDirectory} does not exist`)
  })

  it('Upload Specification - Fail invalid rootDirectory', async () => {
    expect(() => {
      getUploadSpecification(artifactName, goodItem1Path, artifactFilesToUpload)
    }).toThrow(
      `Provided rootDirectory ${goodItem1Path} is not a valid directory`
    )
  })

  it('Upload Specification - File does not exist', async () => {
    const fakeFilePath = path.join(
      artifactName,
      'folder-a',
      'folder-b',
      'non-existent-file.txt'
    )
    expect(() => {
      getUploadSpecification(artifactName, root, [fakeFilePath])
    }).toThrow(`File ${fakeFilePath} does not exist`)
  })

  it('Upload Specification - Non parent directory', async () => {
    const folderADirectory = path.join(root, 'folder-a')
    const artifactFiles = [
      goodItem1Path,
      badItem1Path,
      extraFileInFolderCPath,
      goodItem5Path
    ]
    expect(() => {
      getUploadSpecification(artifactName, folderADirectory, artifactFiles)
    }).toThrow(
      `The rootDirectory: ${folderADirectory} is not a parent directory of the file: ${goodItem5Path}`
    )
  })

  it('Upload Specification - Success', async () => {
    const specifications = getUploadSpecification(
      artifactName,
      root,
      artifactFilesToUpload
    )
    expect(specifications.length).toEqual(7)

    const absolutePaths = specifications.map(item => item.absoluteFilePath)
    expect(absolutePaths).toContain(goodItem1Path)
    expect(absolutePaths).toContain(goodItem2Path)
    expect(absolutePaths).toContain(goodItem3Path)
    expect(absolutePaths).toContain(goodItem4Path)
    expect(absolutePaths).toContain(goodItem5Path)
    expect(absolutePaths).toContain(extraFileInFolderCPath)
    expect(absolutePaths).toContain(amazingFileInFolderHPath)

    for (const specification of specifications) {
      if (specification.absoluteFilePath === goodItem1Path) {
        expect(specification.uploadFilePath).toEqual(
          path.join(
            artifactName,
            'folder-a',
            'folder-b',
            'folder-c',
            'good-item1.txt'
          )
        )
      } else if (specification.absoluteFilePath === goodItem2Path) {
        expect(specification.uploadFilePath).toEqual(
          path.join(artifactName, 'folder-d', 'good-item2.txt')
        )
      } else if (specification.absoluteFilePath === goodItem3Path) {
        expect(specification.uploadFilePath).toEqual(
          path.join(artifactName, 'folder-d', 'good-item3.txt')
        )
      } else if (specification.absoluteFilePath === goodItem4Path) {
        expect(specification.uploadFilePath).toEqual(
          path.join(artifactName, 'folder-d', 'good-item4.txt')
        )
      } else if (specification.absoluteFilePath === goodItem5Path) {
        expect(specification.uploadFilePath).toEqual(
          path.join(artifactName, 'good-item5.txt')
        )
      } else if (specification.absoluteFilePath === extraFileInFolderCPath) {
        expect(specification.uploadFilePath).toEqual(
          path.join(
            artifactName,
            'folder-a',
            'folder-b',
            'folder-c',
            'extra-file-in-folder-c.txt'
          )
        )
      } else if (specification.absoluteFilePath === amazingFileInFolderHPath) {
        expect(specification.uploadFilePath).toEqual(
          path.join(artifactName, 'folder-h', 'amazing-item.txt')
        )
      } else {
        throw new Error(
          'Invalid specification found. This should never be reached'
        )
      }
    }
  })

  it('Upload Specification - Success with extra slash', async () => {
    const rootWithSlash = `${root}/`
    const specifications = getUploadSpecification(
      artifactName,
      rootWithSlash,
      artifactFilesToUpload
    )
    expect(specifications.length).toEqual(7)

    const absolutePaths = specifications.map(item => item.absoluteFilePath)
    expect(absolutePaths).toContain(goodItem1Path)
    expect(absolutePaths).toContain(goodItem2Path)
    expect(absolutePaths).toContain(goodItem3Path)
    expect(absolutePaths).toContain(goodItem4Path)
    expect(absolutePaths).toContain(goodItem5Path)
    expect(absolutePaths).toContain(extraFileInFolderCPath)
    expect(absolutePaths).toContain(amazingFileInFolderHPath)

    for (const specification of specifications) {
      if (specification.absoluteFilePath === goodItem1Path) {
        expect(specification.uploadFilePath).toEqual(
          path.join(
            artifactName,
            'folder-a',
            'folder-b',
            'folder-c',
            'good-item1.txt'
          )
        )
      } else if (specification.absoluteFilePath === goodItem2Path) {
        expect(specification.uploadFilePath).toEqual(
          path.join(artifactName, 'folder-d', 'good-item2.txt')
        )
      } else if (specification.absoluteFilePath === goodItem3Path) {
        expect(specification.uploadFilePath).toEqual(
          path.join(artifactName, 'folder-d', 'good-item3.txt')
        )
      } else if (specification.absoluteFilePath === goodItem4Path) {
        expect(specification.uploadFilePath).toEqual(
          path.join(artifactName, 'folder-d', 'good-item4.txt')
        )
      } else if (specification.absoluteFilePath === goodItem5Path) {
        expect(specification.uploadFilePath).toEqual(
          path.join(artifactName, 'good-item5.txt')
        )
      } else if (specification.absoluteFilePath === extraFileInFolderCPath) {
        expect(specification.uploadFilePath).toEqual(
          path.join(
            artifactName,
            'folder-a',
            'folder-b',
            'folder-c',
            'extra-file-in-folder-c.txt'
          )
        )
      } else if (specification.absoluteFilePath === amazingFileInFolderHPath) {
        expect(specification.uploadFilePath).toEqual(
          path.join(artifactName, 'folder-h', 'amazing-item.txt')
        )
      } else {
        throw new Error(
          'Invalid specification found. This should never be reached'
        )
      }
    }
  })

  it('Upload Specification - Directories should not be included', async () => {
    const folderEPath = path.join(root, 'folder-a', 'folder-b', 'folder-e')
    const filesWithDirectory = [
      goodItem1Path,
      goodItem4Path,
      folderEPath,
      badItem3Path
    ]
    const specifications = getUploadSpecification(
      artifactName,
      root,
      filesWithDirectory
    )
    expect(specifications.length).toEqual(3)
    const absolutePaths = specifications.map(item => item.absoluteFilePath)
    expect(absolutePaths).toContain(goodItem1Path)
    expect(absolutePaths).toContain(goodItem4Path)
    expect(absolutePaths).toContain(badItem3Path)

    for (const specification of specifications) {
      if (specification.absoluteFilePath === goodItem1Path) {
        expect(specification.uploadFilePath).toEqual(
          path.join(
            artifactName,
            'folder-a',
            'folder-b',
            'folder-c',
            'good-item1.txt'
          )
        )
      } else if (specification.absoluteFilePath === goodItem2Path) {
        expect(specification.uploadFilePath).toEqual(
          path.join(artifactName, 'folder-d', 'good-item2.txt')
        )
      } else if (specification.absoluteFilePath === goodItem4Path) {
        expect(specification.uploadFilePath).toEqual(
          path.join(artifactName, 'folder-d', 'good-item4.txt')
        )
      } else if (specification.absoluteFilePath === badItem3Path) {
        expect(specification.uploadFilePath).toEqual(
          path.join(artifactName, 'folder-f', 'bad-item3.txt')
        )
      } else {
        throw new Error(
          'Invalid specification found. This should never be reached'
        )
      }
    }
  })
})
