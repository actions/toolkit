/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export const $types_CompletedPart = {
    properties: {
        ChecksumCRC32: {
            type: 'string',
            description: `The base64-encoded, 32-bit CRC32 checksum of the object. This will only be
            present if it was uploaded with the object. When you use an API operation on an
            object that was uploaded using multipart uploads, this value may not be a direct
            checksum value of the full object. Instead, it's a calculation based on the
            checksum values of each individual part. For more information about how
            checksums are calculated with multipart uploads, see [Checking object integrity]in the Amazon S3 User
            Guide.

            [Checking object integrity]: https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity.html#large-object-checksums`,
        },
        ChecksumCRC32C: {
            type: 'string',
            description: `The base64-encoded, 32-bit CRC32C checksum of the object. This will only be
            present if it was uploaded with the object. When you use an API operation on an
            object that was uploaded using multipart uploads, this value may not be a direct
            checksum value of the full object. Instead, it's a calculation based on the
            checksum values of each individual part. For more information about how
            checksums are calculated with multipart uploads, see [Checking object integrity]in the Amazon S3 User
            Guide.

            [Checking object integrity]: https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity.html#large-object-checksums`,
        },
        ChecksumSHA1: {
            type: 'string',
            description: `The base64-encoded, 160-bit SHA-1 digest of the object. This will only be
            present if it was uploaded with the object. When you use the API operation on an
            object that was uploaded using multipart uploads, this value may not be a direct
            checksum value of the full object. Instead, it's a calculation based on the
            checksum values of each individual part. For more information about how
            checksums are calculated with multipart uploads, see [Checking object integrity]in the Amazon S3 User
            Guide.

            [Checking object integrity]: https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity.html#large-object-checksums`,
        },
        ChecksumSHA256: {
            type: 'string',
            description: `The base64-encoded, 256-bit SHA-256 digest of the object. This will only be
            present if it was uploaded with the object. When you use an API operation on an
            object that was uploaded using multipart uploads, this value may not be a direct
            checksum value of the full object. Instead, it's a calculation based on the
            checksum values of each individual part. For more information about how
            checksums are calculated with multipart uploads, see [Checking object integrity]in the Amazon S3 User
            Guide.

            [Checking object integrity]: https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity.html#large-object-checksums`,
        },
        ETag: {
            type: 'string',
            description: `Entity tag returned when the part was uploaded.`,
        },
        PartNumber: {
            type: 'number',
            description: `Part number that identifies the part. This is a positive integer between 1 and
            10,000.

            - General purpose buckets - In CompleteMultipartUpload , when a additional
            checksum (including x-amz-checksum-crc32 , x-amz-checksum-crc32c ,
            x-amz-checksum-sha1 , or x-amz-checksum-sha256 ) is applied to each part, the
            PartNumber must start at 1 and the part numbers must be consecutive.
            Otherwise, Amazon S3 generates an HTTP 400 Bad Request status code and an
            InvalidPartOrder error code.

            - Directory buckets - In CompleteMultipartUpload , the PartNumber must start
            at 1 and the part numbers must be consecutive.`,
        },
    },
} as const;