import * as uploadZipSpecification from '../src/internal/upload/upload-zip-specification'
import * as zip from '../src/internal/upload/zip'
import * as util from '../src/internal/shared/util'
import * as retention from '../src/internal/upload/retention'
import * as config from '../src/internal/shared/config'
import {Timestamp, ArtifactServiceClientJSON} from '../src/generated'
import * as blobUpload from '../src/internal/upload/blob-upload'
import {uploadArtifact} from '../src/internal/upload/upload-artifact'
import {noopLogs} from './common'
import {FilesNotFoundError} from '../src/internal/shared/errors'
import {Stats} from 'fs'

describe('upload-artifact', () => {
  beforeEach(() => {
    noopLogs()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should successfully upload an artifact', () => {
    const mockDate = new Date('2020-01-01')
    jest
      .spyOn(uploadZipSpecification, 'validateRootDirectory')
      .mockReturnValue()
    jest
      .spyOn(uploadZipSpecification, 'getUploadZipSpecification')
      .mockReturnValue([
        {
          sourcePath: '/home/user/files/plz-upload/file1.txt',
          destinationPath: 'file1.txt',
          stats: new Stats()
        },
        {
          sourcePath: '/home/user/files/plz-upload/file2.txt',
          destinationPath: 'file2.txt',
          stats: new Stats()
        },
        {
          sourcePath: '/home/user/files/plz-upload/dir/file3.txt',
          destinationPath: 'dir/file3.txt',
          stats: new Stats()
        }
      ])

    jest
      .spyOn(zip, 'createZipUploadStream')
      .mockReturnValue(Promise.resolve(new zip.ZipUploadStream(1)))
    jest.spyOn(util, 'getBackendIdsFromToken').mockReturnValue({
      workflowRunBackendId: '1234',
      workflowJobRunBackendId: '5678'
    })
    jest
      .spyOn(retention, 'getExpiration')
      .mockReturnValue(Timestamp.fromDate(mockDate))
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
      .mockReturnValue(Promise.resolve({ok: true, artifactId: '1'}))

    // ArtifactHttpClient mocks
    jest.spyOn(config, 'getRuntimeToken').mockReturnValue('test-token')
    jest
      .spyOn(config, 'getResultsServiceUrl')
      .mockReturnValue('https://test-url.com')

    const uploadResp = uploadArtifact(
      'test-artifact',
      [
        '/home/user/files/plz-upload/file1.txt',
        '/home/user/files/plz-upload/file2.txt',
        '/home/user/files/plz-upload/dir/file3.txt'
      ],
      '/home/user/files/plz-upload'
    )

    expect(uploadResp).resolves.toEqual({size: 1234, id: 1})
  })

  it('should throw an error if the root directory is invalid', () => {
    jest
      .spyOn(uploadZipSpecification, 'validateRootDirectory')
      .mockImplementation(() => {
        throw new Error('Invalid root directory')
      })

    const uploadResp = uploadArtifact(
      'test-artifact',
      [
        '/home/user/files/plz-upload/file1.txt',
        '/home/user/files/plz-upload/file2.txt',
        '/home/user/files/plz-upload/dir/file3.txt'
      ],
      '/home/user/files/plz-upload'
    )

    expect(uploadResp).rejects.toThrow('Invalid root directory')
  })

  it('should reject if there are no files to upload', () => {
    jest
      .spyOn(uploadZipSpecification, 'validateRootDirectory')
      .mockReturnValue()
    jest
      .spyOn(uploadZipSpecification, 'getUploadZipSpecification')
      .mockReturnValue([])

    const uploadResp = uploadArtifact(
      'test-artifact',
      [
        '/home/user/files/plz-upload/file1.txt',
        '/home/user/files/plz-upload/file2.txt',
        '/home/user/files/plz-upload/dir/file3.txt'
      ],
      '/home/user/files/plz-upload'
    )
    expect(uploadResp).rejects.toThrowError(FilesNotFoundError)
  })

  it('should reject if no backend IDs are found', () => {
    jest
      .spyOn(uploadZipSpecification, 'validateRootDirectory')
      .mockReturnValue()
    jest
      .spyOn(uploadZipSpecification, 'getUploadZipSpecification')
      .mockReturnValue([
        {
          sourcePath: '/home/user/files/plz-upload/file1.txt',
          destinationPath: 'file1.txt',
          stats: new Stats()
        },
        {
          sourcePath: '/home/user/files/plz-upload/file2.txt',
          destinationPath: 'file2.txt',
          stats: new Stats()
        },
        {
          sourcePath: '/home/user/files/plz-upload/dir/file3.txt',
          destinationPath: 'dir/file3.txt',
          stats: new Stats()
        }
      ])

    jest
      .spyOn(zip, 'createZipUploadStream')
      .mockReturnValue(Promise.resolve(new zip.ZipUploadStream(1)))

    const uploadResp = uploadArtifact(
      'test-artifact',
      [
        '/home/user/files/plz-upload/file1.txt',
        '/home/user/files/plz-upload/file2.txt',
        '/home/user/files/plz-upload/dir/file3.txt'
      ],
      '/home/user/files/plz-upload'
    )

    expect(uploadResp).rejects.toThrow()
  })

  it('should return false if the creation request fails', () => {
    const mockDate = new Date('2020-01-01')
    jest
      .spyOn(uploadZipSpecification, 'validateRootDirectory')
      .mockReturnValue()
    jest
      .spyOn(uploadZipSpecification, 'getUploadZipSpecification')
      .mockReturnValue([
        {
          sourcePath: '/home/user/files/plz-upload/file1.txt',
          destinationPath: 'file1.txt',
          stats: Stats.prototype
        },
        {
          sourcePath: '/home/user/files/plz-upload/file2.txt',
          destinationPath: 'file2.txt',
          stats: Stats.prototype
        },
        {
          sourcePath: '/home/user/files/plz-upload/dir/file3.txt',
          destinationPath: 'dir/file3.txt',
          stats: Stats.prototype
        }
      ])

    jest
      .spyOn(zip, 'createZipUploadStream')
      .mockReturnValue(Promise.resolve(new zip.ZipUploadStream(1)))
    jest.spyOn(util, 'getBackendIdsFromToken').mockReturnValue({
      workflowRunBackendId: '1234',
      workflowJobRunBackendId: '5678'
    })
    jest
      .spyOn(retention, 'getExpiration')
      .mockReturnValue(Timestamp.fromDate(mockDate))
    jest
      .spyOn(ArtifactServiceClientJSON.prototype, 'CreateArtifact')
      .mockReturnValue(Promise.resolve({ok: false, signedUploadUrl: ''}))

    // ArtifactHttpClient mocks
    jest.spyOn(config, 'getRuntimeToken').mockReturnValue('test-token')
    jest
      .spyOn(config, 'getResultsServiceUrl')
      .mockReturnValue('https://test-url.com')

    const uploadResp = uploadArtifact(
      'test-artifact',
      [
        '/home/user/files/plz-upload/file1.txt',
        '/home/user/files/plz-upload/file2.txt',
        '/home/user/files/plz-upload/dir/file3.txt'
      ],
      '/home/user/files/plz-upload'
    )

    expect(uploadResp).rejects.toThrow()
  })

  it('should return false if blob storage upload is unsuccessful', () => {
    const mockDate = new Date('2020-01-01')
    jest
      .spyOn(uploadZipSpecification, 'validateRootDirectory')
      .mockReturnValue()
    jest
      .spyOn(uploadZipSpecification, 'getUploadZipSpecification')
      .mockReturnValue([
        {
          sourcePath: '/home/user/files/plz-upload/file1.txt',
          destinationPath: 'file1.txt',
          stats: new Stats()
        },
        {
          sourcePath: '/home/user/files/plz-upload/file2.txt',
          destinationPath: 'file2.txt',
          stats: new Stats()
        },
        {
          sourcePath: '/home/user/files/plz-upload/dir/file3.txt',
          destinationPath: 'dir/file3.txt',
          stats: new Stats()
        }
      ])

    jest
      .spyOn(zip, 'createZipUploadStream')
      .mockReturnValue(Promise.resolve(new zip.ZipUploadStream(1)))
    jest.spyOn(util, 'getBackendIdsFromToken').mockReturnValue({
      workflowRunBackendId: '1234',
      workflowJobRunBackendId: '5678'
    })
    jest
      .spyOn(retention, 'getExpiration')
      .mockReturnValue(Timestamp.fromDate(mockDate))
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

    // ArtifactHttpClient mocks
    jest.spyOn(config, 'getRuntimeToken').mockReturnValue('test-token')
    jest
      .spyOn(config, 'getResultsServiceUrl')
      .mockReturnValue('https://test-url.com')

    const uploadResp = uploadArtifact(
      'test-artifact',
      [
        '/home/user/files/plz-upload/file1.txt',
        '/home/user/files/plz-upload/file2.txt',
        '/home/user/files/plz-upload/dir/file3.txt'
      ],
      '/home/user/files/plz-upload'
    )

    expect(uploadResp).rejects.toThrow()
  })

  it('should reject if finalize artifact fails', () => {
    const mockDate = new Date('2020-01-01')
    jest
      .spyOn(uploadZipSpecification, 'validateRootDirectory')
      .mockReturnValue()
    jest
      .spyOn(uploadZipSpecification, 'getUploadZipSpecification')
      .mockReturnValue([
        {
          sourcePath: '/home/user/files/plz-upload/file1.txt',
          destinationPath: 'file1.txt',
          stats: new Stats()
        },
        {
          sourcePath: '/home/user/files/plz-upload/file2.txt',
          destinationPath: 'file2.txt',
          stats: new Stats()
        },
        {
          sourcePath: '/home/user/files/plz-upload/dir/file3.txt',
          destinationPath: 'dir/file3.txt',
          stats: new Stats()
        }
      ])

    jest
      .spyOn(zip, 'createZipUploadStream')
      .mockReturnValue(Promise.resolve(new zip.ZipUploadStream(1)))
    jest.spyOn(util, 'getBackendIdsFromToken').mockReturnValue({
      workflowRunBackendId: '1234',
      workflowJobRunBackendId: '5678'
    })
    jest
      .spyOn(retention, 'getExpiration')
      .mockReturnValue(Timestamp.fromDate(mockDate))
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

    // ArtifactHttpClient mocks
    jest.spyOn(config, 'getRuntimeToken').mockReturnValue('test-token')
    jest
      .spyOn(config, 'getResultsServiceUrl')
      .mockReturnValue('https://test-url.com')

    const uploadResp = uploadArtifact(
      'test-artifact',
      [
        '/home/user/files/plz-upload/file1.txt',
        '/home/user/files/plz-upload/file2.txt',
        '/home/user/files/plz-upload/dir/file3.txt'
      ],
      '/home/user/files/plz-upload'
    )

    expect(uploadResp).rejects.toThrow()
  })
})
