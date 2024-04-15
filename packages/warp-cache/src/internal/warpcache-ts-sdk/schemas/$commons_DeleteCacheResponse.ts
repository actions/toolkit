/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_DeleteCacheResponse = {
    properties: {
        annotations: {
            type: 'commons_CacheAnnotationsMap',
        },
        cache_entry: {
            type: 'commons_CacheEntry',
        },
        gcs: {
            type: 'commons_GCSDeleteCacheResponse',
        },
        provider: {
            type: 'string',
        },
        s3: {
            type: 'commons_S3DeleteCacheResponse',
        },
    },
} as const;