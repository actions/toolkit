export enum CacheFilename {
  Gzip = 'cache.tgz',
  Zstd = 'cache.tzst'
}

export enum CompressionMethod {
  Gzip = 'gzip',
  Zstd = 'zstd'
}

// Socket timeout in milliseconds during download.  If no traffic is received
// over the socket during this period, the socket is destroyed and the download
// is aborted.
export const SocketTimeout = 5000
