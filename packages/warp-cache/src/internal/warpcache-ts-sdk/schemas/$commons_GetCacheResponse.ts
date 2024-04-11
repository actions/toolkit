/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_GetCacheResponse = {
    properties: {
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