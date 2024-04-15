/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_CommitCacheResponse = {
    properties: {
        annotations: {
            type: 'commons_CacheAnnotationsMap',
        },
        cache_entry: {
            type: 'commons_CacheEntry',
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
        },
    },
} as const;