import * as github from '@actions/github'
import type {RestEndpointMethods} from '@octokit/plugin-rest-endpoint-methods/dist-types/generated/method-types'
import type {RequestInterface} from '@octokit/types'
import {
  deleteArtifactInternal,
  deleteArtifactPublic
} from '../src/internal/delete/delete-artifact'
import * as config from '../src/internal/shared/config'
import {ArtifactServiceClientJSON} from '../src/generated'
import * as util from '../src/internal/shared/util'
import {noopLogs} from './common'

type MockedRequest = jest.MockedFunction<RequestInterface<object>>

type MockedDeleteArtifact = jest.MockedFunction<
  RestEndpointMethods['actions']['deleteArtifact']
>

jest.mock('@actions/github', () => ({
  getOctokit: jest.fn().mockReturnValue({
    request: jest.fn(),
    rest: {
      actions: {
        deleteArtifact: jest.fn()
      }
    }
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

describe('delete-artifact', () => {
  beforeAll(() => {
    noopLogs()
  })

  describe('public', () => {
    it('should delete an artifact', async () => {
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

      const mockDeleteArtifact = github.getOctokit(fixtures.token).rest.actions
        .deleteArtifact as MockedDeleteArtifact
      mockDeleteArtifact.mockResolvedValueOnce({
        status: 204,
        headers: {},
        url: '',
        data: null as never
      })

      const response = await deleteArtifactPublic(
        fixtures.artifacts[0].name,
        fixtures.runId,
        fixtures.owner,
        fixtures.repo,
        fixtures.token
      )

      expect(response).toEqual({
        id: fixtures.artifacts[0].id
      })
    })

    it('should fail if non-200 response', async () => {
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

      const mockDeleteArtifact = github.getOctokit(fixtures.token).rest.actions
        .deleteArtifact as MockedDeleteArtifact
      mockDeleteArtifact.mockRejectedValue(new Error('boom'))

      await expect(
        deleteArtifactPublic(
          fixtures.artifacts[0].name,
          fixtures.runId,
          fixtures.owner,
          fixtures.repo,
          fixtures.token
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
        .spyOn(ArtifactServiceClientJSON.prototype, 'DeleteArtifact')
        .mockResolvedValue({
          ok: true,
          artifactId: fixtures.artifacts[0].id.toString()
        })
      const response = await deleteArtifactInternal(fixtures.artifacts[0].name)
      expect(response).toEqual({
        id: fixtures.artifacts[0].id
      })
    })

    it('should fail if non-200 response', async () => {
      jest
        .spyOn(ArtifactServiceClientJSON.prototype, 'DeleteArtifact')
        .mockRejectedValue(new Error('boom'))
      await expect(
        deleteArtifactInternal(fixtures.artifacts[0].id)
      ).rejects.toThrow('boom')
    })
  })
})
