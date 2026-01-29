export {
  createStorageRecord,
  ArtifactOptions,
  PackageRegistryOptions
} from './artifactMetadata.js'
export {AttestOptions, attest} from './attest.js'
export {
  AttestProvenanceOptions,
  attestProvenance,
  buildSLSAProvenancePredicate
} from './provenance.js'

export type {SerializedBundle} from '@sigstore/bundle'
export type {Attestation, Predicate, Subject} from './shared.types.js'
export type {SigstoreInstance} from './endpoints.js'
