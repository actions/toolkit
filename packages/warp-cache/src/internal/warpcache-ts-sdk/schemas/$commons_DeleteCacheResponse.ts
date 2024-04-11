/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_DeleteCacheResponse = {
    properties: {
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