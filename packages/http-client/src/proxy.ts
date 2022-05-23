export function getProxyUrl(reqUrl: URL): URL | undefined {
  const usingSsl = reqUrl.protocol === 'https:'

  if (checkBypass(reqUrl)) {
    return undefined
  }

  const proxyVar = (() => {
    if (usingSsl) {
      return process.env['https_proxy'] || process.env['HTTPS_PROXY']
    } else {
      return process.env['http_proxy'] || process.env['HTTP_PROXY']
    }
  })()

  if (proxyVar) {
    return new URL(proxyVar)
  } else {
    return undefined
  }
}

export function checkBypass(reqUrl: URL): boolean {
  if (!reqUrl.hostname) {
    return false
  }

  const noProxy = process.env['no_proxy'] || process.env['NO_PROXY'] || ''
  if (!noProxy) {
    return false
  }

  // Determine the request port
  let reqPort: number | undefined
  if (reqUrl.port) {
    reqPort = Number(reqUrl.port)
  } else if (reqUrl.protocol === 'http:') {
    reqPort = 80
  } else if (reqUrl.protocol === 'https:') {
    reqPort = 443
  }

  // Format the request hostname and hostname with port
  const upperReqHosts = [reqUrl.hostname.toUpperCase()]
  if (typeof reqPort === 'number') {
    upperReqHosts.push(`${upperReqHosts[0]}:${reqPort}`)
  }

  // Compare request host against noproxy
  for (const upperNoProxyItem of noProxy
    .split(',')
    .map(x => x.trim().toUpperCase())
    .filter(x => x)) {
    if (upperReqHosts.some(x => x === upperNoProxyItem)) {
      return true
    }
  }

  return false
}
