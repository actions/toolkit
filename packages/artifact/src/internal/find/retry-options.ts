import * as core from '@actions/core'
import {OctokitOptions} from '@octokit/core/dist-types/types'
import {RequestRequestOptions} from '@octokit/types'

export type RetryOptions = {
  doNotRetry?: number[]
  enabled?: boolean
}

// Defaults for fetching artifacts
const defaultMaxRetryNumber = 5
const defaultExemptStatusCodes = [400, 401, 403, 404, 422] // https://github.com/octokit/plugin-retry.js/blob/9a2443746c350b3beedec35cf26e197ea318a261/src/index.ts#L14

export function getRetryOptions(
  defaultOptions: OctokitOptions,
  retries: number = defaultMaxRetryNumber,
  exemptStatusCodes: number[] = defaultExemptStatusCodes
): [RetryOptions, RequestRequestOptions | undefined] {
  if (retries <= 0) {
    return [{enabled: false}, defaultOptions.request]
  }

  const retryOptions: RetryOptions = {
    enabled: true
  }

  if (exemptStatusCodes.length > 0) {
    retryOptions.doNotRetry = exemptStatusCodes
  }

  // The GitHub type has some defaults for `options.request`
  // see: https://github.com/actions/toolkit/blob/4fbc5c941a57249b19562015edbd72add14be93d/packages/github/src/utils.ts#L15
  // We pass these in here so they are not overridden.
  const requestOptions: RequestRequestOptions = {
    ...defaultOptions.request,
    retries
  }

  core.debug(
    `GitHub client configured with: (retries: ${
      requestOptions.retries
    }, retry-exempt-status-code: ${
      retryOptions.doNotRetry ?? 'octokit default: [400, 401, 403, 404, 422]'
    })`
  )

  return [retryOptions, requestOptions]
}
