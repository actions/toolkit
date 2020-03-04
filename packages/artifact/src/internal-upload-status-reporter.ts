import {info} from '@actions/core'

// Displays information about the progress/status of an artifact being uploaded
export class UploadStatusReporter {
  private displayDelay = 10000
  private totalNumberOfFilesToUpload = 0
  private processedCount = 0
  private uploadStatus: NodeJS.Timeout | undefined

  constructor() {
    this.uploadStatus = undefined
  }

  setTotalNumberOfFilesToUpload(fileTotal: number): void {
    this.totalNumberOfFilesToUpload = fileTotal
  }

  startDisplayingStatus(): void {
    const _this = this
    this.uploadStatus = setInterval(function() {
      info(
        `Total file(s): ${
          _this.totalNumberOfFilesToUpload
        } ---- Processed file #${_this.processedCount} (${(
          (_this.processedCount / _this.totalNumberOfFilesToUpload) *
          100
        ).toFixed(1)}%)`
      )
    }, this.displayDelay)
  }

  stopDisplayingStatus(): void {
    if (this.uploadStatus) {
      clearInterval(this.uploadStatus)
    }
  }

  incrementProcessedCount(): void {
    this.processedCount++
  }
}
