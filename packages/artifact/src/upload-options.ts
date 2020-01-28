export interface UploadOptions {
  /**
   * Indicates if the artifact upload should continue if file or chunk fails to upload from any error.
   * If there is a error during upload, a partial artifact will always be associated and available for
   * download at the end. The size reported will be the amount of storage that the user or org will be
   * charged for the partial artifact. Defaults to true if not specified
   *
   * If set to false, and an error is encountered, all other uploads will stop and any files or chunkes
   * that were queued will not be attempted to be uploaded. The partial artifact avaiable will only
   * include files and chunks up until the failure
   *
   * If set to true and an error is encountered, the failed file will be skipped and ignored and all
   * other queued files will be attempted to be uploaded. The partial artifact at the end will have all
   * files with the exception of the problematic files(s)/chunks(s) that failed to upload
   *
   */
  continueOnError?: boolean
}
