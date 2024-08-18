# @actions/attest Releases

### 1.4.0

- Add new `headers` parameter to the `attest` and `attestProvenance` functions.
- Update `buildSLSAProvenancePredicate`/`attestProvenance` to automatically derive default OIDC issuer URL from current execution context.

### 1.3.1

- Fix bug with proxy support when retrieving JWKS for OIDC issuer

### 1.3.0

- Dynamic construction of Sigstore API URLs
- Switch to new GH provenance build type
- Fetch existing Rekor entry on 409 conflict error
- Bump @sigstore/bundle from 2.3.0 to 2.3.2
- Bump @sigstore/sign from 2.3.0 to 2.3.2

### 1.2.1

- Retry request on attestation persistence failure

### 1.2.0

- Generate attestations using the v0.3 Sigstore bundle format.
- Bump @sigstore/bundle from 2.2.0 to 2.3.0.
- Bump @sigstore/sign from 2.2.3 to 2.3.0.
- Remove dependency on make-fetch-happen

### 1.1.0

- Updates the `attestProvenance` function to retrieve a token from the GitHub OIDC provider and use the token claims to populate the provenance statement.

### 1.0.0

- Initial release
