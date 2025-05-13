import * as github from '@actions/github'
import type {RestEndpointMethodTypes} from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/parameters-and-response-types'
import {
  listArtifactsInternal,
  listArtifactsPublic
} from '../src/internal/find/list-artifacts'
import * as config from '../src/internal/shared/config'
import {ArtifactServiceClientJSON, Timestamp} from '../src/generated'
import * as util from '../src/internal/shared/utils'
import {noopLogs} from './common'
import {Artifact} from '../src/internal/shared/interfaces'
import {RequestInterface} from '@octokit/types'

type MockedRequest = jest.MockedFunction<RequestInterface<object>>

jest.mock('@actions/github', () => ({
  getOctokit: jest.fn().mockReturnValue({
    request: jest.fn(),
    rest: {
      actions: {
        listWorkflowRunArtifacts: jest.fn()
      }
    }
  })
}))

const artifactsToListResponse = (
  artifacts: Artifact[]
): RestEndpointMethodTypes['actions']['listWorkflowRunArtifacts']['response']['data'] => {
  return {
    total_count: artifacts.length,
    artifacts: artifacts.map(artifact => ({
      name: artifact.name,
      id: artifact.id,
      size_in_bytes: artifact.size,
      created_at: artifact.createdAt?.toISOString() || '',
      run_id: fixtures.runId,
      // unused fields for tests
      url: '',
      archive_download_url: '',
      expired: false,
      expires_at: '',
      node_id: '',
      run_url: '',
      type: '',
      updated_at: ''
    }))
  }
}

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

describe('list-artifact', () => {
  beforeAll(() => {
    noopLogs()
  })

  describe('public', () => {
    it('should return a list of artifacts', async () => {
      const mockRequest = github.getOctokit(fixtures.token)
        .request as MockedRequest

      mockRequest.mockResolvedValueOnce({
        status: 200,
        headers: {},
        url: '',
        data: artifactsToListResponse(fixtures.artifacts)
      })

      const response = await listArtifactsPublic(
        fixtures.runId,
        fixtures.owner,
        fixtures.repo,
        fixtures.token,
        false
      )

      expect(response).toEqual({
        artifacts: fixtures.artifacts
      })
    })

    it('should return the latest artifact when latest is specified', async () => {
      const mockRequest = github.getOctokit(fixtures.token)
        .request as MockedRequest

      mockRequest.mockResolvedValueOnce({
        status: 200,
        headers: {},
        url: '',
        data: artifactsToListResponse(fixtures.artifacts)
      })

      const response = await listArtifactsPublic(
        fixtures.runId,
        fixtures.owner,
        fixtures.repo,
        fixtures.token,
        true
      )

      expect(response).toEqual({
        artifacts: [fixtures.artifacts[1]]
      })
    })

    it('can return empty artifacts', async () => {
      const mockRequest = github.getOctokit(fixtures.token)
        .request as MockedRequest

      mockRequest.mockResolvedValueOnce({
        status: 200,
        headers: {},
        url: '',
        data: {
          total_count: 0,
          artifacts: []
        }
      })

      const response = await listArtifactsPublic(
        fixtures.runId,
        fixtures.owner,
        fixtures.repo,
        fixtures.token,
        true
      )

      expect(response).toEqual({
        artifacts: []
      })
    })

    it('should fail if non-200 response', async () => {
      const mockRequest = github.getOctokit(fixtures.token)
        .request as MockedRequest

      mockRequest.mockRejectedValueOnce(new Error('boom'))

      await expect(
        listArtifactsPublic(
          fixtures.runId,
          fixtures.owner,
          fixtures.repo,
          fixtures.token,
          false
        )
      ).rejects.toThrow('boom')
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

    it('should return a list of artifacts', async () => {
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
      const response = await listArtifactsInternal(false)
      expect(response).toEqual({
        artifacts: fixtures.artifacts
      })
    })

    it('should return the latest artifact when latest is specified', async () => {
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
      const response = await listArtifactsInternal(true)
      expect(response).toEqual({
        artifacts: [fixtures.artifacts[1]]
      })
    })

    it('can return empty artifacts', async () => {
      jest
        .spyOn(ArtifactServiceClientJSON.prototype, 'ListArtifacts')
        .mockResolvedValue({
          artifacts: []
        })
      const response = await listArtifactsInternal(false)
      expect(response).toEqual({
        artifacts: []
      })
    })

    it('should fail if non-200 response', async () => {
      jest
        .spyOn(ArtifactServiceClientJSON.prototype, 'ListArtifacts')
        .mockRejectedValue(new Error('boom'))
      await expect(listArtifactsInternal(false)).rejects.toThrow('boom')
    })
  })
})
