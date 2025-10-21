# @actions/attest Releases

### 2.0.0

- Add support for Node 24 [#2110](https://github.com/actions/toolkit/pull/2110)
- Bump @sigstore/bundle from 3.0.0 to 3.1.0
- Bump @sigstore/sign from 3.0.0 to 3.1.0
- Bump jose from 5.2.3 to 5.10.0

### 1.6.0

- Update `buildSLSAProvenancePredicate` to populate `workflow.ref` field from the `ref` claim in the OIDC token [#1969](https://github.com/actions/toolkit/pull/1969)

### 1.5.0

- Bump @actions/core from 1.10.1 to 1.11.1 [#1847](https://github.com/actions/toolkit/pull/1847)
- Bump @sigstore/bundle from 2.3.2 to 3.0.0 [#1846](https://github.com/actions/toolkit/pull/1846)
- Bump @sigstore/sign from 2.3.2 to 3.0.0 [#1846](https://github.com/actions/toolkit/pull/1846)
- Support for generating multi-subject attestations [#1864](https://github.com/actions/toolkit/pull/1865)
- Fix bug in `buildSLSAProvenancePredicate` related to `workflow_ref` OIDC token claims containing the "@" symbol in the tag name [#1863](https://github.com/actions/toolkit/pull/1863)

### 1.4.2

- Fix bug in `buildSLSAProvenancePredicate`/`attestProvenance` when generating provenance statement for enterprise account using customized OIDC issuer value [#1823](https://github.com/actions/toolkit/pull/1823)

### 1.4.1

- Bump @actions/http-client from 2.2.1 to 2.2.3 [#1805](https://github.com/actions/toolkit/pull/1805)

### 1.4.0

- Add new `headers` parameter to the `attest` and `attestProvenance` functions [#1790](https://github.com/actions/toolkit/pull/1790)
- Update `buildSLSAProvenancePredicate`/`attestProvenance` to automatically derive default OIDC issuer URL from current execution context [#1796](https://github.com/actions/toolkit/pull/1796)
### 1.3.1

- Fix bug with proxy support when retrieving JWKS for OIDC issuer [#1776](https://github.com/actions/toolkit/pull/1776)

### 1.3.0

- Dynamic construction of Sigstore API URLs [#1735](https://github.com/actions/toolkit/pull/1735)
- Switch to new GH provenance build type [#1745](https://github.com/actions/toolkit/pull/1745)
- Fetch existing Rekor entry on 409 conflict error [#1759](https://github.com/actions/toolkit/pull/1759)
- Bump @sigstore/bundle from 2.3.0 to 2.3.2 [#1738](https://github.com/actions/toolkit/pull/1738)
- Bump @sigstore/sign from 2.3.0 to 2.3.2 [#1738](https://github.com/actions/toolkit/pull/1738)

### 1.2.1

- Retry request on attestation persistence failure [#1725](https://github.com/actions/toolkit/pull/1725)

### 1.2.0

- Generate attestations using the v0.3 Sigstore bundle format [#1701](https://github.com/actions/toolkit/pull/1701)
- Bump @sigstore/bundle from 2.2.0 to 2.3.0 [#1701](https://github.com/actions/toolkit/pull/1701)
- Bump @sigstore/sign from 2.2.3 to 2.3.0 [#1701](https://github.com/actions/toolkit/pull/1701)
- Remove dependency on make-fetch-happen [#1714](https://github.com/actions/toolkit/pull/1714)

### 1.1.0

- Updates the `attestProvenance` function to retrieve a token from the GitHub OIDC provider and use the token claims to populate the provenance statement [#1693](https://github.com/actions/toolkit/pull/1693)

### 1.0.0

- Initial release
