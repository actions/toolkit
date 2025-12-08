# `@actions/attest`

Functions for generating signed attestations for workflow artifacts.

Attestations bind some subject (a named artifact along with its digest) to a
predicate (some assertion about that subject) using the [in-toto
statement](https://github.com/in-toto/attestation/tree/main/spec/v1) format. A
signature is generated for the attestation using a
[Sigstore](https://www.sigstore.dev/)-issued signing certificate.

Once the attestation has been created and signed, it will be uploaded to the GH
attestations API and associated with the repository from which the workflow was
initiated.

See [Using artifact attestations to establish provenance for builds](https://docs.github.com/en/actions/security-guides/using-artifact-attestations-to-establish-provenance-for-builds)
for more information on artifact attestations.

## Table of Contents
- [Usage](#usage)
  - [attest](#attest)
  - [attestProvenance](#attestprovenance)
  - [Attestation](#attestation)
- [Sigstore Instance](#sigstore-instance)
- [Storage](#storage)

## Usage

### `attest`

The `attest` function takes the supplied subject/predicate pair and generates a
signed attestation.

```js
const { attest } = require('@actions/attest');
const core = require('@actions/core');

async function run() {
    // In order to persist attestations to the repo, this should be a token with
    // repository write permissions.
    const ghToken = core.getInput('gh-token');

    const attestation = await attest({
        subjects: [{name: 'my-artifact-name', digest: { 'sha256': '36ab4667...'}}],
        predicateType: 'https://in-toto.io/attestation/release',
        predicate: { . . . },
        token: ghToken
    });

    console.log(attestation);
}

run();
```

The `attest` function supports the following options:

```typescript
export type AttestOptions = {
  // Deprecated. Use 'subjects' instead.
  subjectName?: string
  // Deprecated. Use 'subjects' instead.
  subjectDigest?: Record<string, string>
  // Collection of subjects to be attested
  subjects?: Subject[]
  // URI identifying the content type of the predicate being attested.
  predicateType: string
  // Predicate to be attested.
  predicate: object
  // GitHub token for writing attestations.
  token: string
  // Sigstore instance to use for signing. Must be one of "public-good" or
  // "github".
  sigstore?: 'public-good' | 'github'
  // HTTP headers to include in request to attestations API.
  headers?: {[header: string]: string | number | undefined}
  // Whether to skip writing the attestation to the GH attestations API.
  skipWrite?: boolean
}

export type Subject = {
   // Name of the subject.
  name: string
   // Digests of the subject. Should be a map of digest algorithms to their hex-encoded values.
  digest: Record<string, string>
}
```

### `attestProvenance`

The `attestProvenance` function accepts the name and digest of some artifact and
generates a build provenance attestation over those values.

The attestation is formed by first generating a [SLSA provenance
predicate](https://slsa.dev/spec/v1.0/provenance) populated with
[metadata](https://github.com/slsa-framework/github-actions-buildtypes/tree/main/workflow/v1)
pulled from the GitHub Actions run.

```js
const { attestProvenance } = require('@actions/attest');
const core = require('@actions/core');

async function run() {
    // In order to persist attestations to the repo, this should be a token with
    // repository write permissions.
    const ghToken = core.getInput('gh-token');

    const attestation = await attestProvenance({
        subjectName: 'my-artifact-name',
        subjectDigest: { 'sha256': '36ab4667...'},
        token: ghToken
    });

    console.log(attestation);
}

run();
```

The `attestProvenance` function supports the following options:

```typescript
export type AttestProvenanceOptions = {
  // Deprecated. Use 'subjects' instead.
  subjectName?: string
  // Deprecated. Use 'subjects' instead.
  subjectDigest?: Record<string, string>
  // Collection of subjects to be attested
  subjects?: Subject[]
  // URI identifying the content type of the predicate being attested.
  token: string
  // Sigstore instance to use for signing. Must be one of "public-good" or
  // "github".
  sigstore?: 'public-good' | 'github'
  // HTTP headers to include in request to attestations API.
  headers?: {[header: string]: string | number | undefined}
  // Whether to skip writing the attestation to the GH attestations API.
  skipWrite?: boolean
  // Issuer URL responsible for minting the OIDC token from which the
  // provenance data is read. Defaults to
  // 'https://token.actions.githubusercontent.com".
  issuer?: string
}
```

### `Attestation`

The `Attestation` returned by `attest`/`attestProvenance` has the following
fields:

```typescript
export type Attestation = {
  /*
   * JSON-serialized Sigstore bundle containing the provenance attestation,
   * signature, signing certificate and witnessed timestamp.
   */
  bundle: SerializedBundle
  /*
   * PEM-encoded signing certificate used to sign the attestation.
   */
  certificate: string
  /*
   * ID of Rekor transparency log entry created for the attestation (if
   * applicable).
   */
  tlogID?: string
  /*
   * ID of the persisted attestation (accessible via the GH API).
   */
  attestationID?: string
}
```

For details about the Sigstore bundle format, see the [Bundle protobuf
specification](https://github.com/sigstore/protobuf-specs/blob/main/protos/sigstore_bundle.proto).

### createStorageRecord

The `createStorageRecord` function accepts parameters defining artifact
and package registry details and creates a storage record on behalf of the artifact.
The storage record contains metadata about where the artifact is stored on a given
package registry.

## Sigstore Instance

When generating the signed attestation there are two different Sigstore
instances which can be used to issue the signing certificate. By default,
workflows initiated from public repositories will use the Sigstore public-good
instance and persist the attestation signature to the public [Rekor transparency
log](https://docs.sigstore.dev/logging/overview/). Workflows initiated from
private/internal repositories will use the GitHub-internal Sigstore instance
which uses a signed timestamp issued by GitHub's timestamp authority in place of
the public transparency log.

The default Sigstore instance selection can be overridden by passing an explicit
value of either "public-good" or "github" for the `sigstore` option when calling
either `attest` or `attestProvenance`.

## Storage

Attestations created by `attest`/`attestProvenance` will be uploaded to the GH
attestations API and associated with the appropriate repository. Attestation
storage is only supported for public repositories or repositories which belong
to a GitHub Enterprise Cloud account.

In order to generate attestations for private, non-Enterprise repositories, the
`skipWrite` option should be set to `true`.
