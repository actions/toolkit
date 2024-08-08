import {getIDToken} from '@actions/core'
import {HttpClient} from '@actions/http-client'
import * as jose from 'jose'

const VALID_ISSUERS = [
  'https://token.actions.githubusercontent.com',
  new RegExp('^https://token\\.actions\\.[a-z0-9-]+\\.ghe\\.com$')
] as const

const OIDC_AUDIENCE = 'nobody'

const REQUIRED_CLAIMS = [
  'iss',
  'ref',
  'sha',
  'repository',
  'event_name',
  'job_workflow_ref',
  'workflow_ref',
  'repository_id',
  'repository_owner_id',
  'runner_environment',
  'run_id',
  'run_attempt'
] as const

export type ClaimSet = {[K in (typeof REQUIRED_CLAIMS)[number]]: string}

type OIDCConfig = {
  jwks_uri: string
}

export const getIDTokenClaims = async (): Promise<ClaimSet> => {
  try {
    const token = await getIDToken(OIDC_AUDIENCE)
    const claims = await decodeOIDCToken(token)
    assertClaimSet(claims)
    return claims
  } catch (error) {
    throw new Error(`Failed to get ID token: ${error.message}`)
  }
}

const decodeOIDCToken = async (token: string): Promise<jose.JWTPayload> => {
  // Decode is an unsafe operation (no signature verification) but we're
  // verifying the signature below after retrieving the issuer.
  const {iss} = jose.decodeJwt(token)

  if (!iss) {
    throw new Error('No issuer found')
  }

  // Issuer must match at least one of the valid issuers
  if (!VALID_ISSUERS.some(allowed => iss.match(allowed))) {
    throw new Error('Issuer mismatch')
  }

  // Verify and decode token
  const jwks = jose.createLocalJWKSet(await getJWKS(iss))
  const {payload} = await jose.jwtVerify(token, jwks, {
    audience: OIDC_AUDIENCE
  })

  return payload
}

const getJWKS = async (issuer: string): Promise<jose.JSONWebKeySet> => {
  const client = new HttpClient('@actions/attest')
  const config = await client.getJson<OIDCConfig>(
    `${issuer}/.well-known/openid-configuration`
  )

  if (!config.result) {
    throw new Error('No OpenID configuration found')
  }

  const jwks = await client.getJson<jose.JSONWebKeySet>(config.result.jwks_uri)

  if (!jwks.result) {
    throw new Error('No JWKS found for issuer')
  }

  return jwks.result
}

function assertClaimSet(claims: jose.JWTPayload): asserts claims is ClaimSet {
  const missingClaims: string[] = []

  for (const claim of REQUIRED_CLAIMS) {
    if (!(claim in claims)) {
      missingClaims.push(claim)
    }
  }

  if (missingClaims.length > 0) {
    throw new Error(`Missing claims: ${missingClaims.join(', ')}`)
  }
}
