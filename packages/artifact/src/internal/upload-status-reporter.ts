import {info} from '@actions/core'

// displays information about the progress/status of an artifact being uploaded
export class UploadStatusReporter {
  private totalNumberOfFilesToUpload = 0
  private processedCount = 0
  private largeUploads = new Map<string, string>()
  private totalUploadStatus: NodeJS.Timeout | undefined
  private largeFileUploadStatus: NodeJS.Timeout | undefined

  constructor() {
    this.totalUploadStatus = undefined
    this.largeFileUploadStatus = undefined
  }

  setTotalNumberOfFilesToUpload(fileTotal: number): void {
    this.totalNumberOfFilesToUpload = fileTotal
  }

  // start displaying information about the status of an upload
  start(): void {
    const _this = this

    // displays information about the total upload status every 10 seconds
    this.totalUploadStatus = setInterval(function() {
      // display 1 decimal place without any rounding
      const percentage = _this.formatPercentage(
        _this.processedCount,
        _this.totalNumberOfFilesToUpload
      )
      info(
        `Total file(s): ${
          _this.totalNumberOfFilesToUpload
        } ---- Processed file #${_this.processedCount} (${percentage.slice(
          0,
          percentage.indexOf('.') + 2
        )}%)`
      )
    }, 10000)

    // displays extra information about any large files that take a significant amount of time to upload every 1 second
    this.largeFileUploadStatus = setInterval(function() {
      for (const value of Array.from(_this.largeUploads.values())) {
        info(value)
      }
      // delete all entires in the map after displaying the information so it will not be displayed again unless explicitly added
      _this.largeUploads = new Map<string, string>()
    }, 1000)
  }

  updateLargeFileStatus(
    fileName: string,
    numerator: number,
    denomiator: number
  ): void {
    // display 1 decimal place without any rounding
    const percentage = this.formatPercentage(numerator, denomiator)
    const displayInformation = `Uploading ${fileName} (${percentage.slice(
      0,
      percentage.indexOf('.') + 2
    )}%)`

    // any previously added display information should be overwritten for the specific large file because a map is being used
    this.largeUploads.set(fileName, displayInformation)
  }

  // stop displaying information about the status of an upload
  stop(): void {
    if (this.totalUploadStatus) {
      clearInterval(this.totalUploadStatus)
    }

    if (this.largeFileUploadStatus) {
      clearInterval(this.largeFileUploadStatus)
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
