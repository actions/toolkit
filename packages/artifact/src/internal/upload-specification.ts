import * as fs from 'fs'
import {debug} from '@actions/core'
import {join, normalize, resolve} from 'path'
import {checkArtifactFilePath} from './path-and-artifact-name-validation'

export interface UploadSpecification {
  absoluteFilePath: string
  uploadFilePath: string
}

/**
 * Creates a specification that describes how each file that is part of the artifact will be uploaded
 * @param artifactName the name of the artifact being uploaded. Used during upload to denote where the artifact is stored on the server
 * @param rootDirectory an absolute file path that denotes the path that should be removed from the beginning of each artifact file
 * @param artifactFiles a list of absolute file paths that denote what should be uploaded as part of the artifact
 */
export function getUploadSpecification(
  artifactName: string,
  rootDirectory: string,
  artifactFiles: string[]
): UploadSpecification[] {
  // artifact name was checked earlier on, no need to check again
  const specifications: UploadSpecification[] = []

  if (!fs.existsSync(rootDirectory)) {
    throw new Error(`Provided rootDirectory ${rootDirectory} does not exist`)
  }
  if (!fs.statSync(rootDirectory).isDirectory()) {
    throw new Error(
      `Provided rootDirectory ${rootDirectory} is not a valid directory`
    )
  }
  // Normalize and resolve, this allows for either absolute or relative paths to be used
  rootDirectory = normalize(rootDirectory)
  rootDirectory = resolve(rootDirectory)

  /*
     Example to demonstrate behavior
     
     Input:
       artifactName: my-artifact
       rootDirectory: '/home/user/files/plz-upload'
       artifactFiles: [
         '/home/user/files/plz-upload/file1.txt',
         '/home/user/files/plz-upload/file2.txt',
         '/home/user/files/plz-upload/dir/file3.txt'
       ]
     
     Output:
       specifications: [
         ['/home/user/files/plz-upload/file1.txt', 'my-artifact/file1.txt'],
         ['/home/user/files/plz-upload/file1.txt', 'my-artifact/file2.txt'],
         ['/home/user/files/plz-upload/file1.txt', 'my-artifact/dir/file3.txt']
       ]
  */
  for (let file of artifactFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`File ${file} does not exist`)
    }
    if (!fs.statSync(file).isDirectory()) {
      // Normalize and resolve, this allows for either absolute or relative paths to be used
      file = normalize(file)
      file = resolve(file)
      if (!file.startsWith(rootDirectory)) {
        throw new Error(
          `The rootDirectory: ${rootDirectory} is not a parent directory of the file: ${file}`
        )
      }

      // Check for forbidden characters in file paths that will be rejected during upload
      const uploadPath = file.replace(rootDirectory, '')
      checkArtifactFilePath(uploadPath)

      /*
        uploadFilePath denotes where the file will be uploaded in the file container on the server. During a run, if multiple artifacts are uploaded, they will all
        be saved in the same container. The artifact name is used as the root directory in the container to separate and distinguish uploaded artifacts

        path.join handles all the following cases and would return 'artifact-name/file-to-upload.txt
          join('artifact-name/', 'file-to-upload.txt')
          join('artifact-name/', '/file-to-upload.txt')
          join('artifact-name', 'file-to-upload.txt')
          join('artifact-name', '/file-to-upload.txt')
      */
      specifications.push({
        absoluteFilePath: file,
        uploadFilePath: join(artifactName, uploadPath)
      })
    } else {
      // Directories are rejected by the server during upload
      debug(`Removing ${file} from rawSearchResults because it is a directory`)
    }
  }
  return specifications
}
