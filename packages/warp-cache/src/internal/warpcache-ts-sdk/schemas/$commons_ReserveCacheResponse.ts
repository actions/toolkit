/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_ReserveCacheResponse = {
    properties: {
        annotations: {
            type: 'commons_CacheAnnotationsMap',
            description: `Annotations is a map of annotations that can be passed as additional
            context to the cache service. This is not stored in the cache but is published
            in events for tracking purposes.`,
        },
        azure_blob: {
            type: 'commons_AzureBlobReserveCacheResponse',
        },
        gcs: {
            type: 'commons_GCSReserveCacheResponse',
        },
        provider: {
            type: 'string',
        },
        s3: {
            type: 'commons_S3ReserveCacheResponse',
        },
    },
} as const;