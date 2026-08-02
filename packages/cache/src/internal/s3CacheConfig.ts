import {S3ClientConfig} from '@aws-sdk/client-s3'

export interface S3CacheConfiguration {
  bucket: string
  objectKey: string
  s3ClientConfig: S3ClientConfig
}

let configuration: S3CacheConfiguration | undefined

export function configureS3Cache(
  s3CacheConfiguration: S3CacheConfiguration
): void {
  if (!s3CacheConfiguration.bucket) {
    throw new Error('S3 cache bucket must be configured.')
  }
  if (!s3CacheConfiguration.objectKey) {
    throw new Error('S3 cache object key must be configured.')
  }
  if (!s3CacheConfiguration.s3ClientConfig.credentials) {
    throw new Error('S3 cache credentials must be configured.')
  }
  if (!s3CacheConfiguration.s3ClientConfig.region) {
    throw new Error('S3 cache region must be configured.')
  }

  configuration = s3CacheConfiguration
}

export function getS3CacheConfiguration(): S3CacheConfiguration {
  if (!configuration) {
    throw new Error(
      'S3 cache is not configured. Call configureS3Cache before transferring a cache.'
    )
  }

  return configuration
}
