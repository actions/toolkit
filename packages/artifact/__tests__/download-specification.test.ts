import * as path from 'path'
import * as core from '@actions/core'
import {URL} from 'url'
import {getDownloadSpecification} from '../src/internal/download-specification'
import {ContainerEntry} from '../src/internal/contracts'

const artifact1Name = 'my-artifact'
const artifact2Name = 'my-artifact-extra'

// Populating with only the information that is necessary
function getPartialContainerEntry(): ContainerEntry {
  return {
    containerId: 10,
    scopeIdentifier: '00000000-0000-0000-0000-000000000000',
    path: 'ADD_INFORMATION',
    itemType: 'ADD_INFORMATION',
    status: 'created',
    dateCreated: '2020-02-06T22:13:35.373Z',
    dateLastModified: '2020-02-06T22:13:35.453Z',
    createdBy: '82f0bf89-6e55-4e5a-b8b6-f75eb992578c',
    lastModifiedBy: '82f0bf89-6e55-4e5a-b8b6-f75eb992578c',
    itemLocation: 'ADD_INFORMATION',
    contentLocation: 'ADD_INFORMATION',
    contentId: '',
    fileLength: 100
  }
}

function createFileEntry(entryPath: string): ContainerEntry {
  const newFileEntry = getPartialContainerEntry()
  newFileEntry.path = entryPath
  newFileEntry.itemType = 'file'
  newFileEntry.itemLocation = createItemLocation(entryPath)
  newFileEntry.contentLocation = createContentLocation(entryPath)
  return newFileEntry
}

function createDirectoryEntry(directoryPath: string): ContainerEntry {
  const newDirectoryEntry = getPartialContainerEntry()
  newDirectoryEntry.path = directoryPath
  newDirectoryEntry.itemType = 'folder'
  newDirectoryEntry.itemLocation = createItemLocation(directoryPath)
  newDirectoryEntry.contentLocation = createContentLocation(directoryPath)
  return newDirectoryEntry
}

function createItemLocation(relativePath: string): string {
  const itemLocation = new URL(
    'https://testing/_apis/resources/Containers/10000'
  )
  itemLocation.searchParams.append('itemPath', relativePath)
  itemLocation.searchParams.append('metadata', 'true')
  return itemLocation.toString()
}

function createContentLocation(relativePath: string): string {
  const itemLocation = new URL(
    'https://testing/_apis/resources/Containers/10000'
  )
  itemLocation.searchParams.append('itemPath', relativePath)
  return itemLocation.toString()
}

/*
    Represents a set of container entries for two artifacts with the following directory structure

    /my-artifact
        /file1.txt
        /file2.txt
        /dir1
            /file3.txt
            /dir2
                /dir3
                    /dir4
                        file4.txt
                        file5.txt (no length property)
                        file6.txt (empty file)
    /my-artifact-extra
        /file1.txt
*/

// main artifact
const file1Path = path.join(artifact1Name, 'file1.txt')
const file2Path = path.join(artifact1Name, 'file2.txt')
const dir1Path = path.join(artifact1Name, 'dir1')
const file3Path = path.join(dir1Path, 'file3.txt')
const dir2Path = path.join(dir1Path, 'dir2')
const dir3Path = path.join(dir2Path, 'dir3')
const dir4Path = path.join(dir3Path, 'dir4')
const file4Path = path.join(dir4Path, 'file4.txt')
const file5Path = path.join(dir4Path, 'file5.txt')
const file6Path = path.join(dir4Path, 'file6.txt')

const rootDirectoryEntry = createDirectoryEntry(artifact1Name)
const directoryEntry1 = createDirectoryEntry(dir1Path)
const directoryEntry2 = createDirectoryEntry(dir2Path)
const directoryEntry3 = createDirectoryEntry(dir3Path)
const directoryEntry4 = createDirectoryEntry(dir4Path)
const fileEntry1 = createFileEntry(file1Path)
const fileEntry2 = createFileEntry(file2Path)
const fileEntry3 = createFileEntry(file3Path)
const fileEntry4 = createFileEntry(file4Path)

const missingLengthFileEntry = createFileEntry(file5Path)
missingLengthFileEntry.fileLength = undefined // one file does not have a fileLength
const emptyLengthFileEntry = createFileEntry(file6Path)
emptyLengthFileEntry.fileLength = 0 // empty file path

// extra artifact
const artifact2File1Path = path.join(artifact2Name, 'file1.txt')
const rootDirectoryEntry2 = createDirectoryEntry(artifact2Name)
const extraFileEntry = createFileEntry(artifact2File1Path)

const artifactContainerEntries: ContainerEntry[] = [
  rootDirectoryEntry,
  fileEntry1,
  fileEntry2,
  directoryEntry1,
  fileEntry3,
  directoryEntry2,
  directoryEntry3,
  directoryEntry4,
  fileEntry4,
  missingLengthFileEntry,
  emptyLengthFileEntry,
  rootDirectoryEntry2,
  extraFileEntry
]

describe('Search', () => {
  beforeAll(async () => {
    // mock all output so that there is less noise when running tests
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(core, 'debug').mockImplementation(() => {})
    jest.spyOn(core, 'info').mockImplementation(() => {})
    jest.spyOn(core, 'warning').mockImplementation(() => {})
  })

  it('Download Specification - Absolute Path with no root directory', () => {
    const testDownloadPath = path.join(
      __dirname,
      'some',
      'destination',
      'folder'
    )

    const specification = getDownloadSpecification(
      artifact1Name,
      artifactContainerEntries,
      testDownloadPath,
      false
    )

    expect(specification.rootDownloadLocation).toEqual(testDownloadPath)
    expect(specification.filesToDownload.length).toEqual(5)

    const item1ExpectedTargetPath = path.join(testDownloadPath, 'file1.txt')
    const item2ExpectedTargetPath = path.join(testDownloadPath, 'file2.txt')
    const item3ExpectedTargetPath = path.join(
      testDownloadPath,
      'dir1',
      'file3.txt'
    )
    const item4ExpectedTargetPath = path.join(
      testDownloadPath,
      'dir1',
      'dir2',
      'dir3',
      'dir4',
      'file4.txt'
    )
    const item5ExpectedTargetPath = path.join(
      testDownloadPath,
      'dir1',
      'dir2',
      'dir3',
      'dir4',
      'file5.txt'
    )
    const item6ExpectedTargetPath = path.join(
      testDownloadPath,
      'dir1',
      'dir2',
      'dir3',
      'dir4',
      'file6.txt'
    )

    const targetLocations = specification.filesToDownload.map(
      item => item.targetPath
    )
    expect(targetLocations).toContain(item1ExpectedTargetPath)
    expect(targetLocations).toContain(item2ExpectedTargetPath)
    expect(targetLocations).toContain(item3ExpectedTargetPath)
    expect(targetLocations).toContain(item4ExpectedTargetPath)
    expect(targetLocations).toContain(item5ExpectedTargetPath)

    for (const downloadItem of specification.filesToDownload) {
      if (downloadItem.targetPath === item1ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file1Path)
        )
      } else if (downloadItem.targetPath === item2ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file2Path)
        )
      } else if (downloadItem.targetPath === item3ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file3Path)
        )
      } else if (downloadItem.targetPath === item4ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file4Path)
        )
      } else if (downloadItem.targetPath === item5ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file5Path)
        )
      } else {
        throw new Error('this should never be reached')
      }
    }

    expect(specification.directoryStructure.length).toEqual(3)
    expect(specification.directoryStructure).toContain(testDownloadPath)
    expect(specification.directoryStructure).toContain(
      path.join(testDownloadPath, 'dir1')
    )
    expect(specification.directoryStructure).toContain(
      path.join(testDownloadPath, 'dir1', 'dir2', 'dir3', 'dir4')
    )

    expect(specification.emptyFilesToCreate.length).toEqual(1)
    expect(specification.emptyFilesToCreate).toContain(item6ExpectedTargetPath)
  })

  it('Download Specification - Relative Path with no root directory', () => {
    const testDownloadPath = path.join('some', 'destination', 'folder')

    const specification = getDownloadSpecification(
      artifact1Name,
      artifactContainerEntries,
      testDownloadPath,
      false
    )

    expect(specification.rootDownloadLocation).toEqual(testDownloadPath)
    expect(specification.filesToDownload.length).toEqual(5)

    const item1ExpectedTargetPath = path.join(testDownloadPath, 'file1.txt')
    const item2ExpectedTargetPath = path.join(testDownloadPath, 'file2.txt')
    const item3ExpectedTargetPath = path.join(
      testDownloadPath,
      'dir1',
      'file3.txt'
    )
    const item4ExpectedTargetPath = path.join(
      testDownloadPath,
      'dir1',
      'dir2',
      'dir3',
      'dir4',
      'file4.txt'
    )
    const item5ExpectedTargetPath = path.join(
      testDownloadPath,
      'dir1',
      'dir2',
      'dir3',
      'dir4',
      'file5.txt'
    )
    const item6ExpectedTargetPath = path.join(
      testDownloadPath,
      'dir1',
      'dir2',
      'dir3',
      'dir4',
      'file6.txt'
    )

    const targetLocations = specification.filesToDownload.map(
      item => item.targetPath
    )
    expect(targetLocations).toContain(item1ExpectedTargetPath)
    expect(targetLocations).toContain(item2ExpectedTargetPath)
    expect(targetLocations).toContain(item3ExpectedTargetPath)
    expect(targetLocations).toContain(item4ExpectedTargetPath)
    expect(targetLocations).toContain(item5ExpectedTargetPath)

    for (const downloadItem of specification.filesToDownload) {
      if (downloadItem.targetPath === item1ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file1Path)
        )
      } else if (downloadItem.targetPath === item2ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file2Path)
        )
      } else if (downloadItem.targetPath === item3ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file3Path)
        )
      } else if (downloadItem.targetPath === item4ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file4Path)
        )
      } else if (downloadItem.targetPath === item5ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file5Path)
        )
      } else {
        throw new Error('this should never be reached')
      }
    }

    expect(specification.directoryStructure.length).toEqual(3)
    expect(specification.directoryStructure).toContain(testDownloadPath)
    expect(specification.directoryStructure).toContain(
      path.join(testDownloadPath, 'dir1')
    )
    expect(specification.directoryStructure).toContain(
      path.join(testDownloadPath, 'dir1', 'dir2', 'dir3', 'dir4')
    )

    expect(specification.emptyFilesToCreate.length).toEqual(1)
    expect(specification.emptyFilesToCreate).toContain(item6ExpectedTargetPath)
  })

  it('Download Specification - Absolute Path with root directory', () => {
    const testDownloadPath = path.join(
      __dirname,
      'some',
      'destination',
      'folder'
    )

    const specification = getDownloadSpecification(
      artifact1Name,
      artifactContainerEntries,
      testDownloadPath,
      true
    )

    expect(specification.rootDownloadLocation).toEqual(
      path.join(testDownloadPath, artifact1Name)
    )
    expect(specification.filesToDownload.length).toEqual(5)

    const item1ExpectedTargetPath = path.join(
      testDownloadPath,
      artifact1Name,
      'file1.txt'
    )
    const item2ExpectedTargetPath = path.join(
      testDownloadPath,
      artifact1Name,
      'file2.txt'
    )
    const item3ExpectedTargetPath = path.join(
      testDownloadPath,
      artifact1Name,
      'dir1',
      'file3.txt'
    )
    const item4ExpectedTargetPath = path.join(
      testDownloadPath,
      artifact1Name,
      'dir1',
      'dir2',
      'dir3',
      'dir4',
      'file4.txt'
    )
    const item5ExpectedTargetPath = path.join(
      testDownloadPath,
      artifact1Name,
      'dir1',
      'dir2',
      'dir3',
      'dir4',
      'file5.txt'
    )
    const item6ExpectedTargetPath = path.join(
      testDownloadPath,
      artifact1Name,
      'dir1',
      'dir2',
      'dir3',
      'dir4',
      'file6.txt'
    )

    const targetLocations = specification.filesToDownload.map(
      item => item.targetPath
    )
    expect(targetLocations).toContain(item1ExpectedTargetPath)
    expect(targetLocations).toContain(item2ExpectedTargetPath)
    expect(targetLocations).toContain(item3ExpectedTargetPath)
    expect(targetLocations).toContain(item4ExpectedTargetPath)
    expect(targetLocations).toContain(item5ExpectedTargetPath)

    for (const downloadItem of specification.filesToDownload) {
      if (downloadItem.targetPath === item1ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file1Path)
        )
      } else if (downloadItem.targetPath === item2ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file2Path)
        )
      } else if (downloadItem.targetPath === item3ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file3Path)
        )
      } else if (downloadItem.targetPath === item4ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file4Path)
        )
      } else if (downloadItem.targetPath === item5ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file5Path)
        )
      } else {
        throw new Error('this should never be reached')
      }
    }

    expect(specification.directoryStructure.length).toEqual(3)
    expect(specification.directoryStructure).toContain(
      path.join(testDownloadPath, artifact1Name)
    )
    expect(specification.directoryStructure).toContain(
      path.join(testDownloadPath, dir1Path)
    )
    expect(specification.directoryStructure).toContain(
      path.join(testDownloadPath, dir4Path)
    )

    expect(specification.emptyFilesToCreate.length).toEqual(1)
    expect(specification.emptyFilesToCreate).toContain(item6ExpectedTargetPath)
  })

  it('Download Specification - Relative Path with root directory', () => {
    const testDownloadPath = path.join('some', 'destination', 'folder')

    const specification = getDownloadSpecification(
      artifact1Name,
      artifactContainerEntries,
      testDownloadPath,
      true
    )

    expect(specification.rootDownloadLocation).toEqual(
      path.join(testDownloadPath, artifact1Name)
    )
    expect(specification.filesToDownload.length).toEqual(5)

    const item1ExpectedTargetPath = path.join(
      testDownloadPath,
      artifact1Name,
      'file1.txt'
    )
    const item2ExpectedTargetPath = path.join(
      testDownloadPath,
      artifact1Name,
      'file2.txt'
    )
    const item3ExpectedTargetPath = path.join(
      testDownloadPath,
      artifact1Name,
      'dir1',
      'file3.txt'
    )
    const item4ExpectedTargetPath = path.join(
      testDownloadPath,
      artifact1Name,
      'dir1',
      'dir2',
      'dir3',
      'dir4',
      'file4.txt'
    )
    const item5ExpectedTargetPath = path.join(
      testDownloadPath,
      artifact1Name,
      'dir1',
      'dir2',
      'dir3',
      'dir4',
      'file5.txt'
    )
    const item6ExpectedTargetPath = path.join(
      testDownloadPath,
      artifact1Name,
      'dir1',
      'dir2',
      'dir3',
      'dir4',
      'file6.txt'
    )

    const targetLocations = specification.filesToDownload.map(
      item => item.targetPath
    )
    expect(targetLocations).toContain(item1ExpectedTargetPath)
    expect(targetLocations).toContain(item2ExpectedTargetPath)
    expect(targetLocations).toContain(item3ExpectedTargetPath)
    expect(targetLocations).toContain(item4ExpectedTargetPath)
    expect(targetLocations).toContain(item5ExpectedTargetPath)

    for (const downloadItem of specification.filesToDownload) {
      if (downloadItem.targetPath === item1ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file1Path)
        )
      } else if (downloadItem.targetPath === item2ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file2Path)
        )
      } else if (downloadItem.targetPath === item3ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file3Path)
        )
      } else if (downloadItem.targetPath === item4ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file4Path)
        )
      } else if (downloadItem.targetPath === item5ExpectedTargetPath) {
        expect(downloadItem.sourceLocation).toEqual(
          createContentLocation(file5Path)
        )
      } else {
        throw new Error('this should never be reached')
      }
    }

    expect(specification.directoryStructure.length).toEqual(3)
    expect(specification.directoryStructure).toContain(
      path.join(testDownloadPath, artifact1Name)
    )
    expect(specification.directoryStructure).toContain(
      path.join(testDownloadPath, dir1Path)
    )
    expect(specification.directoryStructure).toContain(
      path.join(testDownloadPath, dir4Path)
    )

    expect(specification.emptyFilesToCreate.length).toEqual(1)
    expect(specification.emptyFilesToCreate).toContain(item6ExpectedTargetPath)
  })
})
