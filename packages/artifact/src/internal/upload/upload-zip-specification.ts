import * as fs from 'fs'
import {info} from '@actions/core'
import {normalize, resolve} from 'path'
import {validateFilePath} from './path-and-artifact-name-validation'

export interface UploadZipSpecification {
  /**
   * An absolute source path that points to a file that will be added to a zip.
   */
  sourcePath: string

  /**
   * The destination path in a zip for a file
   */
  destinationPath: string

  /**
   * Information about the file on disk
   */
  stats: fs.Stats
}

/**
 * Checks if a root directory exists and is valid
 * @param rootDirectory an absolute root directory path common to all input files that that will be trimmed from the final zip structure
 */
export function validateRootDirectory(rootDirectory: string): void {
  if (!fs.existsSync(rootDirectory)) {
    throw new Error(
      `The provided rootDirectory ${rootDirectory} does not exist`
    )
  }
  if (!fs.statSync(rootDirectory).isDirectory()) {
    throw new Error(
      `The provided rootDirectory ${rootDirectory} is not a valid directory`
    )
  }
  info(`Root directory input is valid!`)
}

/**
 * Creates a specification that describes how a zip file will be created for a set of input files
 * @param filesToZip a list of file that should be included in the zip
 * @param rootDirectory an absolute root directory path common to all input files that that will be trimmed from the final zip structure
 */
export function getUploadZipSpecification(
  filesToZip: string[],
  rootDirectory: string
): UploadZipSpecification[] {
  const specification: UploadZipSpecification[] = []

  // Normalize and resolve, this allows for either absolute or relative paths to be used
  rootDirectory = normalize(rootDirectory)
  rootDirectory = resolve(rootDirectory)

  /*
     Example
     
     Input:
       rootDirectory: '/home/user/files/plz-upload'
       artifactFiles: [
         '/home/user/files/plz-upload/file1.txt',
         '/home/user/files/plz-upload/file2.txt',
         '/home/user/files/plz-upload/dir/file3.txt'
       ]
     
     Output:
       specifications: [
         ['/home/user/files/plz-upload/file1.txt', '/file1.txt'],
         ['/home/user/files/plz-upload/file1.txt', '/file2.txt'],
         ['/home/user/files/plz-upload/file1.txt', '/dir/file3.txt']
       ]

      The final zip that is later uploaded will look like this:

      my-artifact.zip
        - file.txt
        - file2.txt
        - dir/
          - file3.txt
  */
  for (let file of filesToZip) {
    const stats = fs.statSync(file, {throwIfNoEntry: false})
    if (!stats) throw new Error(`File ${file} does not exist`)
    // Normalize and resolve, this allows for either absolute or relative paths to be used
    file = normalize(file)
    file = resolve(file)
    if (!file.startsWith(rootDirectory)) {
      throw new Error(
        `The rootDirectory: ${rootDirectory} is not a parent directory of the file: ${file}`
      )
    }

    // Check for forbidden characters in file paths that may cause ambiguous behavior if downloaded on different file systems
    const destinationPath = file.replace(rootDirectory, '')
    validateFilePath(destinationPath)

    specification.push({
      sourcePath: file,
      destinationPath,
      stats
    })
  }
  return specification
}
