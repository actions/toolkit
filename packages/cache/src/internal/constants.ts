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

// Socket timeout in milliseconds during download.  If no traffic is received
// over the socket during this period, the socket is destroyed and the download
// is aborted.
export const SocketTimeout = 5000
