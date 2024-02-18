import {attest, AttestOptions} from './attest'
import type {Attestation, Predicate} from './shared.types'

const SLSA_PREDICATE_V1_TYPE = 'https://slsa.dev/provenance/v1'

const GITHUB_BUILDER_ID_PREFIX = 'https://github.com/actions/runner'
const GITHUB_BUILD_TYPE =
  'https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1'

export type AttestProvenanceOptions = Omit<
  AttestOptions,
  'predicate' | 'predicateType'
>

/**
 * Builds an SLSA (Supply Chain Levels for Software Artifacts) provenance
 * predicate using the GitHub Actions Workflow build type.
 * https://slsa.dev/spec/v1.0/provenance
 * https://github.com/slsa-framework/github-actions-buildtypes/tree/main/workflow/v1
 * @param env - The Node.js process environment variables. Defaults to
 * `process.env`.
 * @returns The SLSA provenance predicate.
 */
export const buildSLSAProvenancePredicate = (
  env: NodeJS.ProcessEnv = process.env
): Predicate => {
  const workflow = env.GITHUB_WORKFLOW_REF || ''

  // Split just the path and ref from the workflow string.
  // owner/repo/.github/workflows/main.yml@main =>
  //   .github/workflows/main.yml, main
  const [workflowPath, workflowRef] = workflow
    .replace(`${env.GITHUB_REPOSITORY}/`, '')
    .split('@')

  return {
    type: SLSA_PREDICATE_V1_TYPE,
    params: {
      buildDefinition: {
        buildType: GITHUB_BUILD_TYPE,
        externalParameters: {
          workflow: {
            ref: workflowRef,
            repository: `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}`,
            path: workflowPath
          }
        },
        internalParameters: {
          github: {
            event_name: env.GITHUB_EVENT_NAME,
            repository_id: env.GITHUB_REPOSITORY_ID,
            repository_owner_id: env.GITHUB_REPOSITORY_OWNER_ID
          }
        },
        resolvedDependencies: [
          {
            uri: `git+${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}@${env.GITHUB_REF}`,
            digest: {
              gitCommit: env.GITHUB_SHA
            }
          }
        ]
      },
      runDetails: {
        builder: {
          id: `${GITHUB_BUILDER_ID_PREFIX}/${env.RUNNER_ENVIRONMENT}`
        },
        metadata: {
          invocationId: `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}/attempts/${env.GITHUB_RUN_ATTEMPT}`
        }
      }
    }
  }
}

/**
 * Attests the build provenance of the provided subject. Generates the SLSA
 * build provenance predicate, assembles it into an in-toto statement, and
 * attests it.
 *
 * @param options - The options for attesting the provenance.
 * @returns A promise that resolves to the attestation.
 */
export async function attestProvenance(
  options: AttestProvenanceOptions
): Promise<Attestation> {
  const predicate = buildSLSAProvenancePredicate(process.env)
  return attest({
    ...options,
    predicateType: predicate.type,
    predicate: predicate.params
  })
}
