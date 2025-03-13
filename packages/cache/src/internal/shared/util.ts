import {debug, setSecret} from '@actions/core'

/**
 * Masks the `sig` parameter in a URL and sets it as a secret.
 * @param url The URL containing the `sig` parameter.
 * @returns A masked URL where the sig parameter value is replaced with '***' if found,
 *          or the original URL if no sig parameter is present.
 */
export function maskSigUrl(url: string): string {
  if (!url) return url

  try {
    const parsedUrl = new URL(url)
    const signature = parsedUrl.searchParams.get('sig')

    if (signature) {
      setSecret(signature)
      setSecret(encodeURIComponent(signature))
      parsedUrl.searchParams.set('sig', '***')
      return parsedUrl.toString()
    }
  } catch (error) {
    debug(
      `Failed to parse URL: ${url} ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
  return url
}

/**
 * Masks any URLs containing signature parameters in the provided object
 */
export function maskSecretUrls(body: Record<string, unknown> | null): void {
  if (typeof body !== 'object' || body === null) {
    debug('body is not an object or is null')
    return
  }

  if (
    'signed_upload_url' in body &&
    typeof body.signed_upload_url === 'string'
  ) {
    maskSigUrl(body.signed_upload_url)
  }
  if (
    'signed_download_url' in body &&
    typeof body.signed_download_url === 'string'
  ) {
    maskSigUrl(body.signed_download_url)
  }
}
