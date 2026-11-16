/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $commons_S3ReserveCacheResponse = {
    properties: {
        pre_signed_urls: {
            type: 'array',
            contains: {
                type: 'string',
            },
        },
        upload_id: {
            type: 'string',
        },
        upload_key: {
            type: 'string',
        },
    },
} as const;