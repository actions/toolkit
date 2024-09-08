import * as fs from 'fs'
import {info} from '@actions/core'
import {normalize, resolve} from 'path'
import {validateFilePath} from './path-and-artifact-name-validation'

export interface UploadZipSpecification {
  /**
   * An absolute source path that points to a file that will be added to a zip. Null if creating a new directory
   */
  sourcePath: string | null

  /**
   * The destination path in a zip for a file
   */
  destinationPath: string

  /**
   * The relative path to a symlink target (file or directory) in a zip
   */
  symlinkTargetPath?: string
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
    if (!fs.existsSync(file)) {
      throw new Error(`File ${file} does not exist`)
    }
    const fileLstat = fs.lstatSync(file)
    if (!fileLstat.isDirectory()) {
      // Normalize and resolve, this allows for either absolute or relative paths to be used
      file = normalize(file)
      file = resolve(file)
      if (!file.startsWith(rootDirectory)) {
        throw new Error(
          `The rootDirectory: ${rootDirectory} is not a parent directory of the file: ${file}`
        )
      }

      // Check for forbidden characters in file paths that may cause ambiguous behavior if downloaded on different file systems
      const uploadPath = file.replace(rootDirectory, '')
      validateFilePath(uploadPath)

      specification.push({
        sourcePath: file,
        destinationPath: uploadPath,
        symlinkTargetPath: fileLstat.isSymbolicLink()
          ? fs.readlinkSync(file)
          : undefined
      })
    } else {
      // Empty directory
      const directoryPath = file.replace(rootDirectory, '')
      validateFilePath(directoryPath)

      specification.push({
        sourcePath: null,
        destinationPath: directoryPath
      })
    }
  }
  return specification
}
