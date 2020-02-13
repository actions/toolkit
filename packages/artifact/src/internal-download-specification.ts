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
  const directories = new Set<string>()

  const specifications: DownloadSpecification = {
    rootDownloadLocation: includeRootDirectory
      ? path.join(downloadPath, artifactName)
      : downloadPath,
    directoryStructure: [],
    filesToDownload: []
  }

  for (const entry of artifactEntries) {
    // Ignore artifacts in the container that don't begin with the same name
    if (
      entry.path.startsWith(`${artifactName}/`) ||
      entry.path.startsWith(`${artifactName}\\`)
    ) {
      // normalize all separators to the local OS
      const normalizedPathEntry = path.normalize(entry.path)
      // entry.path always starts with the artifact name, if includeRootDirectory is false, remove the name from the beginning of the path
      const filePath = path.join(
        downloadPath,
        includeRootDirectory
          ? normalizedPathEntry
          : normalizedPathEntry.replace(artifactName, '')
      )

      // Case insensitive folder structure maintained in the backend, not every folder is created so the 'folder'
      // itemType cannot be relied upon. The file must be used to determine the directory structure
      if (entry.itemType === 'file') {
        // Get the directories that we need to create from the filePath for each individual file
        directories.add(path.dirname(filePath))

        specifications.filesToDownload.push({
          sourceLocation: entry.contentLocation,
          targetPath: filePath
        })
      }
    }
  }

  specifications.directoryStructure = Array.from(directories)
  return specifications
}
