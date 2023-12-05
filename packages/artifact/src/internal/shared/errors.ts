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
  constructor(name: string) {
    const message = `No artifact found for name: ${name}`
    super(message)
    this.name = 'ArtifactNotFoundError'
  }
}
