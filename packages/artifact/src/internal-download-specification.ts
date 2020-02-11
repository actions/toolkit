import * as path from 'path'
import {ContainerEntry} from './internal-contracts'

export interface DownloadSpecification {
  // root download location for the artifact
  rootDownloadLocation: string

  // directories that need to be created for all the items in the artifact
  directoryStructure: string[]

  // individual files that need to be downloaded as part of the artifact
  filesToDownload: DownloadItem[]
}

export interface DownloadItem {
  // Url that denotes where to download the item from
  sourceLocation: string

  // Information about where the file should be downloaded to
  targetPath: string
}

/**
 * Creates a specification for a set of files that will be downloaded
 * @param artifactName the name of the artifact
 * @param artifactEntries a set of container entries that describe that files that make up an artifact
 * @param downloadPath the path where the artifact will be downloaded to
 * @param includeRootDirectory specifies if there should be an extra directory (denoted by the artifact name) where the artifact files should be downloaded to
 */
export function getDownloadSpecification(
  artifactName: string,
  artifactEntries: ContainerEntry[],
  downloadPath: string,
  includeRootDirectory: boolean
): DownloadSpecification {
  const directories: string[] = []

  const specifications: DownloadSpecification = {
    rootDownloadLocation: includeRootDirectory
      ? path.join(downloadPath, artifactName)
      : downloadPath,
    directoryStructure: [],
    filesToDownload: []
  }

  for (const entry of artifactEntries) {
    if (!entry.path.startsWith(artifactName)) {
      // Ignore other artifacts in the container that don't begin with the same name
    } else {
      // entry.path always starts with the artifact name, if includeRootDirectory is false, remove the name from the beginning of the path
      const filePath = path.join(
        downloadPath,
        includeRootDirectory ? entry.path : entry.path.replace(artifactName, '')
      )

      if (entry.itemType === 'folder') {
        directories.push(filePath)
      } else if (entry.itemType === 'file') {
        specifications.filesToDownload.push({
          sourceLocation: entry.contentLocation,
          targetPath: filePath
        })
      } else {
        // eslint-disable-next-line no-console
        console.log(entry)
        throw new Error(`Unsupported item type: ${entry.itemType}`)
      }
    }
  }

  specifications.directoryStructure = directories
  return specifications
}
