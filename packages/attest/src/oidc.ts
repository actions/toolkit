import {getIDToken} from '@actions/core'
import {HttpClient} from '@actions/http-client'
import * as jwt from 'jsonwebtoken'
import jwks from 'jwks-rsa'

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

export const getIDTokenClaims = async (issuer: string): Promise<ClaimSet> => {
  try {
    const token = await getIDToken(OIDC_AUDIENCE)
    const claims = await decodeOIDCToken(token, issuer)
    assertClaimSet(claims)
    return claims
  } catch (error) {
    throw new Error(`Failed to get ID token: ${error.message}`)
  }
}

const decodeOIDCToken = async (
  token: string,
  issuer: string
): Promise<jwt.JwtPayload> => {
  // Verify and decode token
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getPublicKey(issuer),
      {audience: OIDC_AUDIENCE, issuer},
      (err, decoded) => {
        if (err) {
          reject(err)
        } else if (!decoded || typeof decoded === 'string') {
          reject(new Error('No decoded token'))
        } else {
          resolve(decoded)
        }
      }
    )
  })
}

// Returns a callback to locate the public key for the given JWT header. This
// involves two calls:
// 1. Fetch the OpenID configuration to get the JWKS URI.
// 2. Fetch the public key from the JWKS URI.
const getPublicKey =
  (issuer: string): jwt.GetPublicKeyOrSecret =>
  (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
    // Look up the JWKS URI from the issuer's OpenID configuration
    new HttpClient('actions/attest')
      .getJson<OIDCConfig>(`${issuer}/.well-known/openid-configuration`)
      .then(data => {
        if (!data.result) {
          callback(new Error('No OpenID configuration found'))
        } else {
          // Fetch the public key from the JWKS URI
          jwks({jwksUri: data.result.jwks_uri}).getSigningKey(
            header.kid,
            (err, key) => {
              callback(err, key?.getPublicKey())
            }
          )
        }
      })
      .catch(err => {
        callback(err)
      })
  }

function assertClaimSet(claims: jwt.JwtPayload): asserts claims is ClaimSet {
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
