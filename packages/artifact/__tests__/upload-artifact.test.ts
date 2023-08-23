import * as core from '@actions/core'
import * as uploadZipSpecification from '../src/internal/upload/upload-zip-specification'
import * as zip from '../src/internal/upload/zip'
import * as util from '../src/internal/shared/util'
import * as retention from '../src/internal/upload/retention'
import * as config from '../src/internal/shared/config'
import {Timestamp} from '../src/generated'
import {ArtifactServiceClientJSON} from '../src/generated'
import * as blobUpload from '../src/internal/upload/blob-upload'
import {uploadArtifact} from '../src/internal/upload/upload-artifact'

describe('upload-artifact', () => {
  beforeEach(() => {
    // mock all output so that there is less noise when running tests
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(core, 'debug').mockImplementation(() => {})
    jest.spyOn(core, 'info').mockImplementation(() => {})
    jest.spyOn(core, 'warning').mockImplementation(() => {})
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
          destinationPath: 'file1.txt'
        },
        {
          sourcePath: '/home/user/files/plz-upload/file2.txt',
          destinationPath: 'file2.txt'
        },
        {
          sourcePath: '/home/user/files/plz-upload/dir/file3.txt',
          destinationPath: 'dir/file3.txt'
        }
      ])

    jest
      .spyOn(zip, 'createZipUploadStream')
      .mockReturnValue(Promise.resolve(new zip.ZipUploadStream(1)))
    jest
      .spyOn(util, 'getBackendIdsFromToken')
      .mockReturnValue({
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
      .mockReturnValue(
        Promise.resolve({
          isSuccess: true,
          uploadSize: 1234,
          md5Hash: 'test-md5-hash'
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

    expect(uploadResp).resolves.toEqual({success: true, size: 1234, id: 1})
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

  it('should return false if there are no files to upload', () => {
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
    expect(uploadResp).resolves.toEqual({success: false})
  })

  it('should return false if no backend IDs are found', () => {
    jest
      .spyOn(uploadZipSpecification, 'validateRootDirectory')
      .mockReturnValue()
    jest
      .spyOn(uploadZipSpecification, 'getUploadZipSpecification')
      .mockReturnValue([
        {
          sourcePath: '/home/user/files/plz-upload/file1.txt',
          destinationPath: 'file1.txt'
        },
        {
          sourcePath: '/home/user/files/plz-upload/file2.txt',
          destinationPath: 'file2.txt'
        },
        {
          sourcePath: '/home/user/files/plz-upload/dir/file3.txt',
          destinationPath: 'dir/file3.txt'
        }
      ])

    jest
      .spyOn(zip, 'createZipUploadStream')
      .mockReturnValue(Promise.resolve(new zip.ZipUploadStream(1)))
    jest
      .spyOn(util, 'getBackendIdsFromToken')
      .mockReturnValue({workflowRunBackendId: '', workflowJobRunBackendId: ''})

    const uploadResp = uploadArtifact(
      'test-artifact',
      [
        '/home/user/files/plz-upload/file1.txt',
        '/home/user/files/plz-upload/file2.txt',
        '/home/user/files/plz-upload/dir/file3.txt'
      ],
      '/home/user/files/plz-upload'
    )

    expect(uploadResp).resolves.toEqual({success: false})
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
          destinationPath: 'file1.txt'
        },
        {
          sourcePath: '/home/user/files/plz-upload/file2.txt',
          destinationPath: 'file2.txt'
        },
        {
          sourcePath: '/home/user/files/plz-upload/dir/file3.txt',
          destinationPath: 'dir/file3.txt'
        }
      ])

    jest
      .spyOn(zip, 'createZipUploadStream')
      .mockReturnValue(Promise.resolve(new zip.ZipUploadStream(1)))
    jest
      .spyOn(util, 'getBackendIdsFromToken')
      .mockReturnValue({
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

    expect(uploadResp).resolves.toEqual({success: false})
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
          destinationPath: 'file1.txt'
        },
        {
          sourcePath: '/home/user/files/plz-upload/file2.txt',
          destinationPath: 'file2.txt'
        },
        {
          sourcePath: '/home/user/files/plz-upload/dir/file3.txt',
          destinationPath: 'dir/file3.txt'
        }
      ])

    jest
      .spyOn(zip, 'createZipUploadStream')
      .mockReturnValue(Promise.resolve(new zip.ZipUploadStream(1)))
    jest
      .spyOn(util, 'getBackendIdsFromToken')
      .mockReturnValue({
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
      .mockReturnValue(Promise.resolve({isSuccess: false}))

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

    expect(uploadResp).resolves.toEqual({success: false})
  })

  it('should return false if finalize artifact fails', () => {
    const mockDate = new Date('2020-01-01')
    jest
      .spyOn(uploadZipSpecification, 'validateRootDirectory')
      .mockReturnValue()
    jest
      .spyOn(uploadZipSpecification, 'getUploadZipSpecification')
      .mockReturnValue([
        {
          sourcePath: '/home/user/files/plz-upload/file1.txt',
          destinationPath: 'file1.txt'
        },
        {
          sourcePath: '/home/user/files/plz-upload/file2.txt',
          destinationPath: 'file2.txt'
        },
        {
          sourcePath: '/home/user/files/plz-upload/dir/file3.txt',
          destinationPath: 'dir/file3.txt'
        }
      ])

    jest
      .spyOn(zip, 'createZipUploadStream')
      .mockReturnValue(Promise.resolve(new zip.ZipUploadStream(1)))
    jest
      .spyOn(util, 'getBackendIdsFromToken')
      .mockReturnValue({
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
      .mockReturnValue(
        Promise.resolve({
          isSuccess: true,
          uploadSize: 1234,
          md5Hash: 'test-md5-hash'
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

    expect(uploadResp).resolves.toEqual({success: false})
  })
})
