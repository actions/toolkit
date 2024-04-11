/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_CommitCacheResponse = {
    properties: {
        gcs: {
            type: 'commons_GCSCommitCacheResponse',
        },
        provider: {
            type: 'string',
        },
        s3: {
            type: 'commons_S3CommitCacheResponse',
        },
    },
} as const;