import * as uploadZipSpecification from '../src/internal/upload/upload-zip-specification'
import * as zip from '../src/internal/upload/zip'
import * as util from '../src/internal/shared/util'
import * as config from '../src/internal/shared/config'
import {ArtifactServiceClientJSON} from '../src/generated'
import * as blobUpload from '../src/internal/upload/blob-upload'
import {uploadArtifact} from '../src/internal/upload/upload-artifact'
import {noopLogs} from './common'
import {FilesNotFoundError} from '../src/internal/shared/errors'
import {BlockBlobUploadStreamOptions} from '@azure/storage-blob'
import * as fs from 'fs'
import * as path from 'path'

const uploadStreamMock = jest.fn()
const blockBlobClientMock = jest.fn().mockImplementation(() => ({
  uploadStream: uploadStreamMock
}))

jest.mock('@azure/storage-blob', () => ({
  BlobClient: jest.fn().mockImplementation(() => {
    return {
      getBlockBlobClient: blockBlobClientMock
    }
  })
}))

const fixtures = {
  uploadDirectory: path.join(__dirname, '_temp', 'plz-upload'),
  files: [
    ['file1.txt', 'test 1 file content'],
    ['file2.txt', 'test 2 file content'],
    ['file3.txt', 'test 3 file content']
  ],
  backendIDs: {
    workflowRunBackendId: '67dbcc20-e851-4452-a7c3-2cc0d2e0ec67',
    workflowJobRunBackendId: '5f49179d-3386-4c38-85f7-00f8138facd0'
  },
  runtimeToken: 'test-token',
  resultsServiceURL: 'http://results.local',
  inputs: {
    artifactName: 'test-artifact',
    files: [
      '/home/user/files/plz-upload/file1.txt',
      '/home/user/files/plz-upload/file2.txt',
      '/home/user/files/plz-upload/dir/file3.txt'
    ],
    rootDirectory: '/home/user/files/plz-upload'
  }
}

describe('upload-artifact', () => {
  beforeAll(() => {
    if (!fs.existsSync(fixtures.uploadDirectory)) {
      fs.mkdirSync(fixtures.uploadDirectory, {recursive: true})
    }

    for (const [file, content] of fixtures.files) {
      fs.writeFileSync(path.join(fixtures.uploadDirectory, file), content)
    }
  })

  beforeEach(() => {
    noopLogs()
    jest
      .spyOn(uploadZipSpecification, 'validateRootDirectory')
      .mockReturnValue()
    jest
      .spyOn(util, 'getBackendIdsFromToken')
      .mockReturnValue(fixtures.backendIDs)
    jest
      .spyOn(uploadZipSpecification, 'getUploadZipSpecification')
      .mockReturnValue(
        fixtures.files.map(file => ({
          sourcePath: path.join(fixtures.uploadDirectory, file[0]),
          destinationPath: file[0]
        }))
      )
    jest.spyOn(config, 'getRuntimeToken').mockReturnValue(fixtures.runtimeToken)
    jest
      .spyOn(config, 'getResultsServiceUrl')
      .mockReturnValue(fixtures.resultsServiceURL)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should reject if there are no files to upload', async () => {
    jest
      .spyOn(uploadZipSpecification, 'getUploadZipSpecification')
      .mockClear()
      .mockReturnValue([])

    const uploadResp = uploadArtifact(
      fixtures.inputs.artifactName,
      fixtures.inputs.files,
      fixtures.inputs.rootDirectory
    )
    await expect(uploadResp).rejects.toThrowError(FilesNotFoundError)
  })

  it('should reject if no backend IDs are found', async () => {
    jest.spyOn(util, 'getBackendIdsFromToken').mockRestore()

    const uploadResp = uploadArtifact(
      fixtures.inputs.artifactName,
      fixtures.inputs.files,
      fixtures.inputs.rootDirectory
    )

    await expect(uploadResp).rejects.toThrow()
  })

  it('should return false if the creation request fails', async () => {
    jest
      .spyOn(zip, 'createZipUploadStream')
      .mockReturnValue(Promise.resolve(new zip.ZipUploadStream(1)))
    jest
      .spyOn(ArtifactServiceClientJSON.prototype, 'CreateArtifact')
      .mockReturnValue(Promise.resolve({ok: false, signedUploadUrl: ''}))

    const uploadResp = uploadArtifact(
      fixtures.inputs.artifactName,
      fixtures.inputs.files,
      fixtures.inputs.rootDirectory
    )

    await expect(uploadResp).rejects.toThrow()
  })

  it('should return false if blob storage upload is unsuccessful', async () => {
    jest
      .spyOn(zip, 'createZipUploadStream')
      .mockReturnValue(Promise.resolve(new zip.ZipUploadStream(1)))
    jest
      .spyOn(ArtifactServiceClientJSON.prototype, 'CreateArtifact')
      .mockReturnValue(
        Promise.resolve({
          ok: true,
          signedUploadUrl: 'https://signed-upload-url.com'
        })
      )
    jest
      .spyOn(blobUpload, 'uploadZipToBlobStorage')
      .mockReturnValue(Promise.reject(new Error('boom')))

    const uploadResp = uploadArtifact(
      fixtures.inputs.artifactName,
      fixtures.inputs.files,
      fixtures.inputs.rootDirectory
    )

    await expect(uploadResp).rejects.toThrow()
  })

  it('should reject if finalize artifact fails', async () => {
    jest
      .spyOn(zip, 'createZipUploadStream')
      .mockReturnValue(Promise.resolve(new zip.ZipUploadStream(1)))
    jest
      .spyOn(ArtifactServiceClientJSON.prototype, 'CreateArtifact')
      .mockReturnValue(
        Promise.resolve({
          ok: true,
          signedUploadUrl: 'https://signed-upload-url.com'
        })
      )
    jest.spyOn(blobUpload, 'uploadZipToBlobStorage').mockReturnValue(
      Promise.resolve({
        uploadSize: 1234,
        sha256Hash: 'test-sha256-hash'
      })
    )
    jest
      .spyOn(ArtifactServiceClientJSON.prototype, 'FinalizeArtifact')
      .mockReturnValue(Promise.resolve({ok: false, artifactId: ''}))

    const uploadResp = uploadArtifact(
      fixtures.inputs.artifactName,
      fixtures.inputs.files,
      fixtures.inputs.rootDirectory
    )

    await expect(uploadResp).rejects.toThrow()
  })

  it('should successfully upload an artifact', async () => {
    jest
      .spyOn(ArtifactServiceClientJSON.prototype, 'CreateArtifact')
      .mockReturnValue(
        Promise.resolve({
          ok: true,
          signedUploadUrl: 'https://signed-upload-url.local'
        })
      )
    jest
      .spyOn(ArtifactServiceClientJSON.prototype, 'FinalizeArtifact')
      .mockReturnValue(
        Promise.resolve({
          ok: true,
          artifactId: '1'
        })
      )

    uploadStreamMock.mockImplementation(
      async (
        stream: NodeJS.ReadableStream,
        bufferSize?: number,
        maxConcurrency?: number,
        options?: BlockBlobUploadStreamOptions
      ) => {
        const {onProgress, abortSignal} = options || {}

        onProgress?.({loadedBytes: 0})

        return new Promise(resolve => {
          const timerId = setTimeout(() => {
            onProgress?.({loadedBytes: 256})
            resolve({})
          }, 1_000)
          abortSignal?.addEventListener('abort', () => {
            clearTimeout(timerId)
            resolve({})
          })
        })
      }
    )

    const {id, size} = await uploadArtifact(
      fixtures.inputs.artifactName,
      fixtures.inputs.files,
      fixtures.inputs.rootDirectory
    )

    expect(id).toBe(1)
    expect(size).toBe(256)
  })

  it('should throw an error uploading blob chunks get delayed', async () => {
    jest
      .spyOn(ArtifactServiceClientJSON.prototype, 'CreateArtifact')
      .mockReturnValue(
        Promise.resolve({
          ok: true,
          signedUploadUrl: 'https://signed-upload-url.local'
        })
      )
    jest
      .spyOn(ArtifactServiceClientJSON.prototype, 'FinalizeArtifact')
      .mockReturnValue(
        Promise.resolve({
          ok: true,
          artifactId: '1'
        })
      )
    jest
      .spyOn(config, 'getResultsServiceUrl')
      .mockReturnValue('https://results.local')

    jest.spyOn(config, 'getUploadChunkTimeout').mockReturnValue(2_000)

    uploadStreamMock.mockImplementation(
      async (
        stream: NodeJS.ReadableStream,
        bufferSize?: number,
        maxConcurrency?: number,
        options?: BlockBlobUploadStreamOptions
      ) => {
        const {onProgress, abortSignal} = options || {}
        onProgress?.({loadedBytes: 0})
        return new Promise(resolve => {
          abortSignal?.addEventListener('abort', () => {
            resolve({})
          })
        })
      }
    )

    const uploadResp = uploadArtifact(
      fixtures.inputs.artifactName,
      fixtures.inputs.files,
      fixtures.inputs.rootDirectory
    )

    await expect(uploadResp).rejects.toThrow('Upload progress stalled.')
  })
})
