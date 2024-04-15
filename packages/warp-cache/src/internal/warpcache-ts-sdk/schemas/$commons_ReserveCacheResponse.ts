/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_ReserveCacheResponse = {
    properties: {
        annotations: {
            type: 'commons_CacheAnnotationsMap',
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