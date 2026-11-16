/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_S3GetCacheResponse = {
    properties: {
        annotations: {
            type: 'commons_CacheAnnotationsMap',
            description: `Annotations is a map of annotations that can be passed as additional
            context to the cache service. This is not stored in the cache but is published
            in events for tracking purposes.`,
        },
        cache_key: {
            type: 'string',
        },
        cache_version: {
            type: 'string',
        },
        pre_signed_url: {
            type: 'string',
        },
    },
} as const;