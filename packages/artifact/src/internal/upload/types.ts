import * as path from 'path'

/** Default MIME type for unknown file types and fallbacks */
export const DEFAULT_CONTENT_TYPE = 'application/octet-stream'

/**
 * Maps file extensions to MIME types
 */
const mimeTypes: Record<string, string> = {
  // Text
  '.txt': 'text/plain',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.csv': 'text/csv',
  '.xml': 'text/xml',
  '.md': 'text/markdown',

  // JavaScript/JSON
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',

  // Images
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',

  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac',

  // Video
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',

  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  // Archives
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',

  // Code/Data
  '.wasm': 'application/wasm',
  '.yaml': 'application/x-yaml',
  '.yml': 'application/x-yaml',

  // Fonts
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject'
}

/**
 * Gets the MIME type for a file based on its extension
 */
export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  return mimeTypes[ext] || DEFAULT_CONTENT_TYPE
}

/**
 * Checks if an error is related to MIME type validation
 */
export function isMimeTypeValidationError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()

  const isCreateArtifactError = message.includes('failed to createartifact')
  const isClientValidationStatus =
    message.includes('(400)') || message.includes('(422)')
  const hasMimeToken =
    message.includes('mime_type') ||
    message.includes('mime type') ||
    message.includes('content type') ||
    message.includes('media type')
  const hasValidationToken =
    message.includes('invalid') ||
    message.includes('valid') ||
    message.includes('required') ||
    message.includes('unsupported') ||
    message.includes('not allowed')

  return (
    isCreateArtifactError &&
    isClientValidationStatus &&
    hasMimeToken &&
    hasValidationToken
  )
}
