import * as config from '../src/internal/shared/config'
import * as util from '../src/internal/shared/util'

describe('get-backend-ids-from-token', () => {
  it('should return backend ids when the token is valid', () => {
    jest
      .spyOn(config, 'getRuntimeToken')
      .mockReturnValue(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwic2NwIjoiQWN0aW9ucy5FeGFtcGxlIEFjdGlvbnMuQW5vdGhlckV4YW1wbGU6dGVzdCBBY3Rpb25zLlJlc3VsdHM6Y2U3ZjU0YzctNjFjNy00YWFlLTg4N2YtMzBkYTQ3NWY1ZjFhOmNhMzk1MDg1LTA0MGEtNTI2Yi0yY2U4LWJkYzg1ZjY5Mjc3NCIsImlhdCI6MTUxNjIzOTAyMn0.XYnI_wHPBlUi1mqYveJnnkJhp4dlFjqxzRmISPsqfw8'
      )

    const backendIds = util.getBackendIdsFromToken()
    expect(backendIds.workflowRunBackendId).toBe(
      'ce7f54c7-61c7-4aae-887f-30da475f5f1a'
    )
    expect(backendIds.workflowJobRunBackendId).toBe(
      'ca395085-040a-526b-2ce8-bdc85f692774'
    )
  })

  it("should throw an error when the token doesn't have the right scope", () => {
    jest
      .spyOn(config, 'getRuntimeToken')
      .mockReturnValue(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwic2NwIjoiQWN0aW9ucy5FeGFtcGxlIEFjdGlvbnMuQW5vdGhlckV4YW1wbGU6dGVzdCIsImlhdCI6MTUxNjIzOTAyMn0.K0IEoULZteGevF38G94xiaA8zcZ5UlKWfGfqE6q3dhw'
      )

    expect(util.getBackendIdsFromToken).toThrowError(
      'Failed to get backend IDs: The provided JWT token is invalid'
    )
  })

  it('should throw an error when the token has a malformed scope', () => {
    jest
      .spyOn(config, 'getRuntimeToken')
      .mockReturnValue(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwic2NwIjoiQWN0aW9ucy5FeGFtcGxlIEFjdGlvbnMuQW5vdGhlckV4YW1wbGU6dGVzdCBBY3Rpb25zLlJlc3VsdHM6Y2U3ZjU0YzctNjFjNy00YWFlLTg4N2YtMzBkYTQ3NWY1ZjFhIiwiaWF0IjoxNTE2MjM5MDIyfQ.7D0_LRfRFRZFImHQ7GxH2S6ZyFjjZ5U0ujjGCfle1XE'
      )

    expect(util.getBackendIdsFromToken).toThrowError(
      'Failed to get backend IDs: The provided JWT token is invalid'
    )
  })

  it('should throw an error when the token is in an invalid format', () => {
    jest.spyOn(config, 'getRuntimeToken').mockReturnValue('token')

    expect(util.getBackendIdsFromToken).toThrowError('Invalid token specified')
  })

  it("should throw an error when the token doesn't have the right field", () => {
    jest
      .spyOn(config, 'getRuntimeToken')
      .mockReturnValue(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      )

    expect(util.getBackendIdsFromToken).toThrowError(
      'Failed to get backend IDs: The provided JWT token is invalid'
    )
  })
})
