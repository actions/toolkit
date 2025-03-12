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
    const rawSigRegex = /[?&](sig)=([^&=#]+)/gi
    let match

    while ((match = rawSigRegex.exec(url)) !== null) {
      const rawSignature = match[2]
      if (rawSignature) {
        setSecret(rawSignature)
      }
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      try {
        parsedUrl = new URL(url, 'https://example.com')
      } catch (error) {
        debug(`Failed to parse URL: ${url}`)
        return maskSigWithRegex(url)
      }
    }

    let masked = false
    const paramNames = Array.from(parsedUrl.searchParams.keys())

    for (const paramName of paramNames) {
      if (paramName.toLowerCase() === 'sig') {
        const signature = parsedUrl.searchParams.get(paramName)
        if (signature) {
          setSecret(signature)
          setSecret(encodeURIComponent(signature))
          parsedUrl.searchParams.set(paramName, '***')
          masked = true
        }
      }
    }
    if (masked) {
      return parsedUrl.toString()
    }

    if (/([:?&]|^)(sig)=([^&=#]+)/i.test(url)) {
      return maskSigWithRegex(url)
    }
  } catch (error) {
    debug(
      `Error masking URL: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
    return maskSigWithRegex(url)
  }

  return url
}

/**
 * Fallback method to mask signatures using regex when URL parsing fails
 */
function maskSigWithRegex(url: string): string {
  try {
    const regex = /([:?&]|^)(sig)=([^&=#]+)/gi

    return url.replace(regex, (fullMatch, prefix, paramName, value) => {
      if (value) {
        setSecret(value)
        try {
          setSecret(decodeURIComponent(value))
        } catch (error) {
          debug(
            `Failed to decode URL parameter: ${
              error instanceof Error ? error.message : String(error)
            }`
          )
        }
        return `${prefix}${paramName}=***`
      }
      return fullMatch
    })
  } catch (error) {
    debug(
      `Error in maskSigWithRegex: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
    return url
  }
}

/**
 * Masks any URLs containing signature parameters in the provided object
 * Recursively searches through nested objects and arrays
 */
export function maskSecretUrls(
  body: Record<string, unknown> | unknown[] | null
): void {
  if (typeof body !== 'object' || body === null) {
    debug('body is not an object or is null')
    return
  }

  type NestedValue =
    | string
    | number
    | boolean
    | null
    | undefined
    | NestedObject
    | NestedArray
  interface NestedObject {
    [key: string]: NestedValue
    signed_upload_url?: string
    signed_download_url?: string
  }
  type NestedArray = NestedValue[]

  const processUrl = (url: string): void => {
    maskSigUrl(url)
  }

  const processObject = (
    obj: Record<string, NestedValue> | NestedValue[]
  ): void => {
    if (typeof obj !== 'object' || obj === null) {
      return
    }

    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (typeof item === 'string') {
          processUrl(item)
        } else if (typeof item === 'object' && item !== null) {
          processObject(item as Record<string, NestedValue> | NestedValue[])
        }
      }
      return
    }

    if (
      'signed_upload_url' in obj &&
      typeof obj.signed_upload_url === 'string'
    ) {
      maskSigUrl(obj.signed_upload_url)
    }
    if (
      'signed_download_url' in obj &&
      typeof obj.signed_download_url === 'string'
    ) {
      maskSigUrl(obj.signed_download_url)
    }

    for (const key in obj) {
      const value = obj[key]
      if (typeof value === 'string') {
        if (/([:?&]|^)(sig)=/i.test(value)) {
          maskSigUrl(value)
        }
      } else if (typeof value === 'object' && value !== null) {
        processObject(value as Record<string, NestedValue> | NestedValue[])
      }
    }
  }
  processObject(body as Record<string, NestedValue> | NestedValue[])
}
