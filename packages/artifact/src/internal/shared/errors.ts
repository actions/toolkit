export class FilesNotFoundError extends Error {
  files: string[]

  constructor(files: string[] = []) {
    let message = 'No files were found to upload'
    if (files.length > 0) {
      message += `: ${files.join(', ')}`
    }

    super(message)
    this.files = files
    this.name = 'FilesNotFoundError'
  }
}

export class InvalidResponseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidResponseError'
  }
}

export class ArtifactNotFoundError extends Error {
  constructor(message = 'Artifact not found') {
    super(message)
    this.name = 'ArtifactNotFoundError'
  }
}

export class GHESNotSupportedError extends Error {
  constructor(
    message = '@actions/artifact v2.0.0+, upload-artifact@v4+ and download-artifact@v4+ are not currently supported on GHES.'
  ) {
    super(message)
    this.name = 'GHESNotSupportedError'
  }
}

export class NetworkError extends Error {
  code: string

  constructor(code: string) {
    const message = `Unable to make request: ${code}\nIf you are using self-hosted runners, please make sure your runner has access to all GitHub endpoints: https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners#communication-between-self-hosted-runners-and-github`
    super(message)
    this.code = code
    this.name = 'NetworkError'
  }

  static isNetworkErrorCode = (code?: string): boolean => {
    if (!code) return false
    return [
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'EHOSTUNREACH'
    ].includes(code)
  }
}

export class UsageError extends Error {
  constructor() {
    const message = `Artifact storage quota has been hit. Unable to upload any new artifacts. Usage is recalculated every 6-12 hours.\nMore info on storage limits: https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions#calculating-minute-and-storage-spending`
    super(message)
    this.name = 'UsageError'
  }

  static isUsageErrorMessage = (msg?: string): boolean => {
    if (!msg) return false
    return msg.includes('insufficient usage')
  }
}
