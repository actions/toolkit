/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_GetCacheResponse = {
    properties: {
        annotations: {
            type: 'commons_CacheAnnotationsMap',
        },
        cache_entry: {
            type: 'commons_CacheEntry',
        },
        gcs: {
            type: 'commons_GCSGetCacheReponse',
        },
        provider: {
            type: 'string',
        },
        s3: {
            type: 'commons_S3GetCacheResponse',
        },
    },
} as const;