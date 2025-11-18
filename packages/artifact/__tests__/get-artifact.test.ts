import * as github from '@actions/github'
import type {RequestInterface} from '@octokit/types'
import {
  getArtifactInternal,
  getArtifactPublic
} from '../src/internal/find/get-artifact'
import * as config from '../src/internal/shared/config'
import {ArtifactServiceClientJSON, Timestamp} from '../src/generated'
import * as util from '../src/internal/shared/util'
import {noopLogs} from './common'
import {
  ArtifactNotFoundError,
  InvalidResponseError
} from '../src/internal/shared/errors'

type MockedRequest = jest.MockedFunction<RequestInterface<object>>

jest.mock('@actions/github', () => ({
  getOctokit: jest.fn().mockReturnValue({
    request: jest.fn()
  })
}))

const fixtures = {
  repo: 'toolkit',
  owner: 'actions',
  token: 'ghp_1234567890',
  runId: 123,
  backendIds: {
    workflowRunBackendId: 'c4d7c21f-ba3f-4ddc-a8c8-6f2f626f8422',
    workflowJobRunBackendId: '760803a1-f890-4d25-9a6e-a3fc01a0c7cf'
  },
  artifacts: [
    {
      id: 1,
      name: 'my-artifact',
      size: 456,
      createdAt: new Date('2023-12-01')
    },
    {
      id: 2,
      name: 'my-artifact',
      size: 456,
      createdAt: new Date('2023-12-02')
    }
  ]
}

describe('get-artifact', () => {
  beforeAll(() => {
    noopLogs()
  })

  describe('public', () => {
    it('should return the artifact if it is found', async () => {
      const mockRequest = github.getOctokit(fixtures.token)
        .request as MockedRequest
      mockRequest.mockResolvedValueOnce({
        status: 200,
        headers: {},
        url: '',
        data: {
          artifacts: [
            {
              name: fixtures.artifacts[0].name,
              id: fixtures.artifacts[0].id,
              size_in_bytes: fixtures.artifacts[0].size,
              created_at: fixtures.artifacts[0].createdAt.toISOString()
            }
          ]
        }
      })

      const response = await getArtifactPublic(
        fixtures.artifacts[0].name,
        fixtures.runId,
        fixtures.owner,
        fixtures.repo,
        fixtures.token
      )

      expect(response).toEqual({
        artifact: fixtures.artifacts[0]
      })
    })

    it('should return the latest artifact if multiple are found', async () => {
      const mockRequest = github.getOctokit(fixtures.token)
        .request as MockedRequest
      mockRequest.mockResolvedValueOnce({
        status: 200,
        headers: {},
        url: '',
        data: {
          artifacts: fixtures.artifacts.map(artifact => ({
            name: artifact.name,
            id: artifact.id,
            size_in_bytes: artifact.size,
            created_at: artifact.createdAt.toISOString()
          }))
        }
      })

      const response = await getArtifactPublic(
        fixtures.artifacts[0].name,
        fixtures.runId,
        fixtures.owner,
        fixtures.repo,
        fixtures.token
      )

      expect(response).toEqual({
        artifact: fixtures.artifacts[1]
      })
    })

    it('should fail if no artifacts are found', async () => {
      const mockRequest = github.getOctokit(fixtures.token)
        .request as MockedRequest
      mockRequest.mockResolvedValueOnce({
        status: 200,
        headers: {},
        url: '',
        data: {
          artifacts: []
        }
      })

      const response = getArtifactPublic(
        fixtures.artifacts[0].name,
        fixtures.runId,
        fixtures.owner,
        fixtures.repo,
        fixtures.token
      )

      expect(response).rejects.toThrow(ArtifactNotFoundError)
    })

    it('should fail if non-200 response', async () => {
      const mockRequest = github.getOctokit(fixtures.token)
        .request as MockedRequest
      mockRequest.mockResolvedValueOnce({
        status: 404,
        headers: {},
        url: '',
        data: {}
      })

      const response = getArtifactPublic(
        fixtures.artifacts[0].name,
        fixtures.runId,
        fixtures.owner,
        fixtures.repo,
        fixtures.token
      )

      expect(response).rejects.toThrow(InvalidResponseError)
    })
  })

  describe('internal', () => {
    beforeEach(() => {
      jest.spyOn(config, 'getRuntimeToken').mockReturnValue('test-token')

      jest
        .spyOn(util, 'getBackendIdsFromToken')
        .mockReturnValue(fixtures.backendIds)

      jest
        .spyOn(config, 'getResultsServiceUrl')
        .mockReturnValue('https://results.local')
    })

    it('should return the artifact if it is found', async () => {
      jest
        .spyOn(ArtifactServiceClientJSON.prototype, 'ListArtifacts')
        .mockResolvedValue({
          artifacts: [
            {
              ...fixtures.backendIds,
              databaseId: fixtures.artifacts[0].id.toString(),
              name: fixtures.artifacts[0].name,
              size: fixtures.artifacts[0].size.toString(),
              createdAt: Timestamp.fromDate(fixtures.artifacts[0].createdAt)
            }
          ]
        })

      const response = await getArtifactInternal(fixtures.artifacts[0].name)

      expect(response).toEqual({
        artifact: fixtures.artifacts[0]
      })
    })

    it('should return the latest artifact if multiple are found', async () => {
      jest
        .spyOn(ArtifactServiceClientJSON.prototype, 'ListArtifacts')
        .mockResolvedValue({
          artifacts: fixtures.artifacts.map(artifact => ({
            ...fixtures.backendIds,
            databaseId: artifact.id.toString(),
            name: artifact.name,
            size: artifact.size.toString(),
            createdAt: Timestamp.fromDate(artifact.createdAt)
          }))
        })

      const response = await getArtifactInternal(fixtures.artifacts[0].name)

      expect(response).toEqual({
        artifact: fixtures.artifacts[1]
      })
    })

    it('should fail if no artifacts are found', async () => {
      jest
        .spyOn(ArtifactServiceClientJSON.prototype, 'ListArtifacts')
        .mockResolvedValue({
          artifacts: []
        })

      const response = getArtifactInternal(fixtures.artifacts[0].name)

      expect(response).rejects.toThrow(ArtifactNotFoundError)
    })

    it('should fail if non-200 response', async () => {
      jest
        .spyOn(ArtifactServiceClientJSON.prototype, 'ListArtifacts')
        .mockRejectedValue(new Error('boom'))

      const response = getArtifactInternal(fixtures.artifacts[0].name)

      expect(response).rejects.toThrow()
    })
  })
})
