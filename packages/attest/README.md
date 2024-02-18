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
        subjectName: 'my-artifact-name',
        subjectDigest: { 'sha256': '36ab4667...'},
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
  // The name of the subject to be attested.
  subjectName: string
  // The digest of the subject to be attested. Should be a map of digest
  // algorithms to their hex-encoded values.
  subjectDigest: Record<string, string>
  // URI identifying the content type of the predicate being attested.
  predicateType: string
  // Predicate to be attested.
  predicate: object
  // GitHub token for writing attestations.
  token: string
  // Sigstore instance to use for signing. Must be one of "public-good" or
  // "github".
  sigstore?: 'public-good' | 'github'
  // Whether to skip writing the attestation to the GH attestations API.
  skipWrite?: boolean
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
  // The name of the subject to be attested.
  subjectName: string
  // The digest of the subject to be attested. Should be a map of digest
  // algorithms to their hex-encoded values.
  subjectDigest: Record<string, string>
  // GitHub token for writing attestations.
  token: string
  // Sigstore instance to use for signing. Must be one of "public-good" or
  // "github".
  sigstore?: 'public-good' | 'github'
  // Whether to skip writing the attestation to the GH attestations API.
  skipWrite?: boolean
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
