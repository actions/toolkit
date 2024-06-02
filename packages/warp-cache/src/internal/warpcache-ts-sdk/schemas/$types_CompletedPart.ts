/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $types_CompletedPart = {
    properties: {
        ChecksumCRC32: {
            type: 'string',
            description: `The base64-encoded, 32-bit CRC32 checksum of the object. This will only be
            present if it was uploaded with the object. With multipart uploads, this may not
            be a checksum value of the object. For more information about how checksums are
            calculated with multipart uploads, see Checking object integrity (https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity.html#large-object-checksums)
            in the Amazon S3 User Guide.`,
        },
        ChecksumCRC32C: {
            type: 'string',
            description: `The base64-encoded, 32-bit CRC32C checksum of the object. This will only be
            present if it was uploaded with the object. With multipart uploads, this may not
            be a checksum value of the object. For more information about how checksums are
            calculated with multipart uploads, see Checking object integrity (https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity.html#large-object-checksums)
            in the Amazon S3 User Guide.`,
        },
        ChecksumSHA1: {
            type: 'string',
            description: `The base64-encoded, 160-bit SHA-1 digest of the object. This will only be
            present if it was uploaded with the object. With multipart uploads, this may not
            be a checksum value of the object. For more information about how checksums are
            calculated with multipart uploads, see Checking object integrity (https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity.html#large-object-checksums)
            in the Amazon S3 User Guide.`,
        },
        ChecksumSHA256: {
            type: 'string',
            description: `The base64-encoded, 256-bit SHA-256 digest of the object. This will only be
            present if it was uploaded with the object. With multipart uploads, this may not
            be a checksum value of the object. For more information about how checksums are
            calculated with multipart uploads, see Checking object integrity (https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity.html#large-object-checksums)
            in the Amazon S3 User Guide.`,
        },
        ETag: {
            type: 'string',
            description: `Entity tag returned when the part was uploaded.`,
        },
        PartNumber: {
            type: 'number',
            description: `Part number that identifies the part. This is a positive integer between 1 and
            10,000.`,
        },
    },
} as const;