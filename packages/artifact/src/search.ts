import * as glob from '@actions/glob'
import {join, basename} from 'path'
import {debug} from '@actions/core'
import {lstatSync} from 'fs'

export interface SearchResult {
  absoluteFilePath: string
  uploadFilePath: string
}

/**
 * Searches the provided path and returns the files that will be uploaded as part of the artifact
 * @param {string} searchPath Wildcard pattern, directory or individual file that is provided by the user to specify what should be uploaded
 * @param {string} artifactName The name of the artifact, used as the root directory when uploading artifacts to glob storage
 * @return A list of files that should be uploaded along with the paths they will be uploaded with
 */
export async function findFilesToUpload(
  artifactName: string,
  searchPath: string
): Promise<SearchResult[]> {
  let searchResults: SearchResult[] = []
  let itemsToUpload: string[] = []
  let options: glob.GlobOptions = {
    followSymbolicLinks: true,
    implicitDescendants: true,
    omitBrokenSymbolicLinks: true
  }
  let globber = await glob.create(searchPath, options)

  let rawSearchResults: string[] = await globber.glob()
  /**
   * Directories will be rejected if attempted to be uploaded. This includes just empty
   * directories so filter any directories out from the raw search results
   */

  rawSearchResults.forEach(function(item) {
    if (!lstatSync(item).isDirectory()) {
      itemsToUpload.push(item)
    } else {
      debug(`Removing ${item} from rawSearchResults because it is a directory`)
    }
  })

  if (itemsToUpload.length == 0) {
    return searchResults
  }
  console.log(
    `Found the following ${itemsToUpload.length} items that will be uploaded as part of the artifact:`
  )
  console.log(itemsToUpload)

  /**
   * Only a single search pattern is being included so only 1 searchResult is expected. In the future if multiple search patterns are
   * simultaneously supported this will change
   */
  let searchPaths: string[] = await globber.getSearchPaths()
  if (searchResults.length > 1) {
    console.log(searchResults)
    throw new Error('Only 1 search path should be returned')
  }

  /**
   * Creates the path that the artifact will be uploaded with. The artifact name will always be the root directory so that
   * it can be distinguished from other artifacts that are uploaded to the same file Container/glob storage during a run
   */
  if (itemsToUpload.length == 1) {
    // A single artifact will be uploaded, the upload path will always be in the form ${artifactName}\${singleArtifactName}
    searchResults.push({
      absoluteFilePath: itemsToUpload[0],
      uploadFilePath: join(artifactName, basename(searchPaths[0]))
    })
  } else {
    /**
     * multiple files will be uploaded as part of the artifact
     * The search path denotes the base path that was used to find the file. It will be removed from the absolute path and
     * the artifact name will be prepended to create the path used during upload
     */
    itemsToUpload.forEach(function(file) {
      let uploadPath: string = file.replace(searchPaths[0], '')
      searchResults.push({
        absoluteFilePath: file,
        uploadFilePath: artifactName.concat(uploadPath)
      })
    })
  }

  debug('SearchResult includes the following information:')
  searchResults.forEach(function(item) {
    debug(
      `Absolute File Path: ${item.absoluteFilePath}\nUpload file path: ${item.uploadFilePath}`
    )
  })

  return searchResults
}
