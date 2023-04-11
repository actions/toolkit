import {getProxyUrl} from '@actions/http-client'
import {S3ClientConfig} from '@aws-sdk/client-s3'
import {NodeHttpHandler} from '@aws-sdk/node-http-handler'
import ProxyAgent from 'proxy-agent'

export function getConfig(
  region: string,
  access_key_id: string,
  secret_access_key: string,
  endpoint: string | null = null
): S3ClientConfig {
  const proxy = getProxyUrl('https://amazonaws.com')

  const config: S3ClientConfig = {
    credentials: {
      accessKeyId: access_key_id,
      secretAccessKey: secret_access_key
    },
    forcePathStyle: true,
    region
  }

  if (endpoint) {
    config.endpoint = endpoint
  }

  if (proxy) {
    config.requestHandler = new NodeHttpHandler({
      httpsAgent: ProxyAgent(proxy)
    })
  }

  return config
}
