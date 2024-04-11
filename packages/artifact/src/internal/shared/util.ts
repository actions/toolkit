import * as core from '@actions/core'
import {getRuntimeToken} from './config'
import jwt_decode from 'jwt-decode'

export interface BackendIds {
  workflowRunBackendId: string
  workflowJobRunBackendId: string
}

interface ActionsToken {
  scp: string
}

const InvalidJwtError = new Error(
  'Failed to get backend IDs: The provided JWT token is invalid and/or missing claims'
)

// uses the JWT token claims to get the
// workflow run and workflow job run backend ids
export function getBackendIdsFromToken(): BackendIds {
  const token = getRuntimeToken()
  const decoded = jwt_decode<ActionsToken>(token)
  if (!decoded.scp) {
    throw InvalidJwtError
  }

  /*
   * example decoded:
   * {
   *   scp: "Actions.ExampleScope Actions.Results:ce7f54c7-61c7-4aae-887f-30da475f5f1a:ca395085-040a-526b-2ce8-bdc85f692774"
   * }
   */

  const scpParts = decoded.scp.split(' ')
  if (scpParts.length === 0) {
    throw InvalidJwtError
  }
  /*
   * example scpParts:
   * ["Actions.ExampleScope", "Actions.Results:ce7f54c7-61c7-4aae-887f-30da475f5f1a:ca395085-040a-526b-2ce8-bdc85f692774"]
   */

  for (const scopes of scpParts) {
    const scopeParts = scopes.split(':')
    if (scopeParts?.[0] !== 'Actions.Results') {
      // not the Actions.Results scope
      continue
    }

    /*
     * example scopeParts:
     * ["Actions.Results", "ce7f54c7-61c7-4aae-887f-30da475f5f1a", "ca395085-040a-526b-2ce8-bdc85f692774"]
     */
    if (scopeParts.length !== 3) {
      // missing expected number of claims
      throw InvalidJwtError
    }

    const ids = {
      workflowRunBackendId: scopeParts[1],
      workflowJobRunBackendId: scopeParts[2]
    }

    core.debug(`Workflow Run Backend ID: ${ids.workflowRunBackendId}`)
    core.debug(`Workflow Job Run Backend ID: ${ids.workflowJobRunBackendId}`)

    return ids
  }

  throw InvalidJwtError
}
