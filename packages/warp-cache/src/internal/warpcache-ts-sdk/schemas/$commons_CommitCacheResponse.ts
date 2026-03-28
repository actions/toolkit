/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_CommitCacheResponse = {
    properties: {
        annotations: {
            type: 'commons_CacheAnnotationsMap',
            description: `Annotations is a map of annotations that can be passed as additional
            context to the cache service. This is not stored in the cache but is published
            in events for tracking purposes.`,
        },
        azure_blob: {
            type: 'commons_AzureBlobCommitCacheResponse',
        },
        cache_entry: {
            type: 'commons_CacheEntry',
        },
        cache_entry_size: {
            type: 'number',
            description: `Used for BYOC purposes. Check CommitCacheEvent for more details.`,
        },
        gcs: {
            type: 'commons_GCSCommitCacheResponse',
        },
        provider: {
            type: 'string',
        },
        s3: {
            type: 'commons_S3CommitCacheResponse',
        },
        vcs_repository: {
            type: 'string',
            description: `VCSRepository is the repository name in vcs.
            It can be of the format <organization>/<repository> or <repository>.
            While saving the entry, <organization>/ will be trimmed if passed.`,
        },
    },
} as const;