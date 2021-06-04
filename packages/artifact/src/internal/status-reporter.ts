import {info} from '@actions/core'

/**
 * Status Reporter that displays information about the progress/status of an artifact that is being uploaded or downloaded
 *
 * Variable display time that can be adjusted using the displayFrequencyInMilliseconds variable
 * The total status of the upload/download gets displayed according to this value
 * If there is a large file that is being uploaded, extra information about the individual status can also be displayed using the updateLargeFileStatus function
 */

export class StatusReporter {
  private totalNumberOfFilesToProcess = 0
  private processedCount = 0
  private displayFrequencyInMilliseconds: number
  private largeFiles = new Map<string, string>()
  private totalFileStatus: NodeJS.Timeout | undefined
  private largeFileStatus: NodeJS.Timeout | undefined

  constructor(displayFrequencyInMilliseconds: number) {
    this.totalFileStatus = undefined
    this.largeFileStatus = undefined
    this.displayFrequencyInMilliseconds = displayFrequencyInMilliseconds
  }

  setTotalNumberOfFilesToProcess(fileTotal: number): void {
    this.totalNumberOfFilesToProcess = fileTotal
  }

  start(): void {
    // displays information about the total upload/download status
    this.totalFileStatus = setInterval(() => {
      // display 1 decimal place without any rounding
      const percentage = this.formatPercentage(
        this.processedCount,
        this.totalNumberOfFilesToProcess
      )
      info(
        `Total file count: ${
          this.totalNumberOfFilesToProcess
        } ---- Processed file #${this.processedCount} (${percentage.slice(
          0,
          percentage.indexOf('.') + 2
        )}%)`
      )
    }, this.displayFrequencyInMilliseconds)

    // displays extra information about any large files that take a significant amount of time to upload or download every 1 second
    this.largeFileStatus = setInterval(() => {
      for (const value of Array.from(this.largeFiles.values())) {
        info(value)
      }
      // delete all entries in the map after displaying the information so it will not be displayed again unless explicitly added
      this.largeFiles.clear()
    }, 1000)
  }

  // if there is a large file that is being uploaded in chunks, this is used to display extra information about the status of the upload
  updateLargeFileStatus(
    fileName: string,
    numerator: number,
    denominator: number
  ): void {
    // display 1 decimal place without any rounding
    const percentage = this.formatPercentage(numerator, denominator)
    const displayInformation = `Uploading ${fileName} (${percentage.slice(
      0,
      percentage.indexOf('.') + 2
    )}%)`

    // any previously added display information should be overwritten for the specific large file because a map is being used
    this.largeFiles.set(fileName, displayInformation)
  }

  stop(): void {
    if (this.totalFileStatus) {
      clearInterval(this.totalFileStatus)
    }

    if (this.largeFileStatus) {
      clearInterval(this.largeFileStatus)
    }
  }

  incrementProcessedCount(): void {
    this.processedCount++
  }

  private formatPercentage(numerator: number, denominator: number): string {
    // toFixed() rounds, so use extra precision to display accurate information even though 4 decimal places are not displayed
    return ((numerator / denominator) * 100).toFixed(4).toString()
  }
}
