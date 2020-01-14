import {debug} from '@actions/core'
import * as glob from '@actions/glob'
import {lstatSync} from 'fs'
import {join, basename} from 'path'

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
  const searchResults: SearchResult[] = []
  const itemsToUpload: string[] = []
  const options: glob.GlobOptions = {
    followSymbolicLinks: true,
    implicitDescendants: true,
    omitBrokenSymbolicLinks: true
  }
  const globber = await glob.create(searchPath, options)

  const rawSearchResults: string[] = await globber.glob()
  /**
   * Directories will be rejected if attempted to be uploaded. This includes just empty
   * directories so filter any directories out from the raw search results
   */
  for (const searchResult of rawSearchResults) {
    if (!lstatSync(searchResult).isDirectory()) {
      itemsToUpload.push(searchResult)
    } else {
      debug(
        `Removing ${searchResult} from rawSearchResults because it is a directory`
      )
    }
  }

  if (itemsToUpload.length === 0) {
    return searchResults
  }
  // eslint-disable-next-line no-console
  console.log(
    `Found the following ${itemsToUpload.length} items that will be uploaded as part of the artifact:`
  )
  // eslint-disable-next-line no-console
  console.log(itemsToUpload)

  /**
   * Only a single search pattern is being included so only 1 searchResult is expected. In the future if multiple search patterns are
   * simultaneously supported this will change
   */
  const searchPaths: string[] = globber.getSearchPaths()
  if (searchResults.length > 1) {
    // eslint-disable-next-line no-console
    console.log(searchResults)
    throw new Error('Only 1 search path should be returned')
  }

  /**
   * Creates the path that the artifact will be uploaded with. The artifact name will always be the root directory so that
   * it can be distinguished from other artifacts that are uploaded to the same file Container/glob storage during a run
   */
  if (itemsToUpload.length === 1) {
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
    for (const uploadItem of itemsToUpload) {
      const uploadPath: string = uploadItem.replace(searchPaths[0], '')
      searchResults.push({
        absoluteFilePath: uploadItem,
        uploadFilePath: artifactName.concat(uploadPath)
      })
    }
  }

  debug('SearchResult includes the following information:')
  for (const searchResult of searchResults) {
    debug(
      `Absolute File Path: ${searchResult.absoluteFilePath}\nUpload file path: ${searchResult.uploadFilePath}`
    )
  }

  return searchResults
}
