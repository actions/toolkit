export enum CacheFilename {
  Gzip = 'cache.tgz',
  Zstd = 'cache.tzst'
}

export enum CompressionMethod {
  Gzip = 'gzip',
  // Long range mode was added to zstd in v1.3.2.
  // This enum is for earlier version of zstd that does not have --long support
  ZstdWithoutLong = 'zstd-without-long',
  Zstd = 'zstd'
}

// The default number of retry attempts.
export const DefaultRetryAttempts = 2

// The default delay in milliseconds between retry attempts.
export const DefaultRetryDelay = 5000

// Socket timeout in milliseconds during download.  If no traffic is received
// over the socket during this period, the socket is destroyed and the download
// is aborted.
export const SocketTimeout = 5000
