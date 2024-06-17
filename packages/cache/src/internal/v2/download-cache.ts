import * as core from '@actions/core'
import * as httpClient from '@actions/http-client'
import unzip from 'unzip-stream'
const packageJson = require('../../../package.json')

export async function StreamExtract(url: string, directory: string): Promise<void> {
    let retryCount = 0
    while (retryCount < 5) {
      try {
        await streamExtractExternal(url, directory)
        return
      } catch (error) {
        retryCount++
        core.info(
          `Failed to download cache after ${retryCount} retries due to ${error.message}. Retrying in 5 seconds...`
        )
        // wait 5 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }

    throw new Error(`Cache download failed after ${retryCount} retries.`)
}

export async function streamExtractExternal(
    url: string,
    directory: string
  ): Promise<void> {
    const client = new httpClient.HttpClient(`@actions/cache-${packageJson.version}`)
    const response = await client.get(url)
    if (response.message.statusCode !== 200) {
      core.info(`Failed to download cache. HTTP status code: ${response.message.statusCode}`)
      throw new Error(
        `Unexpected HTTP response from blob storage: ${response.message.statusCode} ${response.message.statusMessage}`
      )
    }
  
    const timeout = 30 * 1000 // 30 seconds
  
    return new Promise((resolve, reject) => {
      const timerFn = (): void => {
        response.message.destroy(
          new Error(`Blob storage chunk did not respond in ${timeout}ms`)
        )
      }
      const timer = setTimeout(timerFn, timeout)
  
      response.message
        .on('data', () => {
          timer.refresh()
        })
        .on('error', (error: Error) => {
          core.info(
            `response.message: Cache download failed: ${error.message}`
          )
          clearTimeout(timer)
          reject(error)
        })
        .pipe(unzip.Extract({path: directory}))
        .on('close', () => {
          clearTimeout(timer)
          resolve()
        })
        .on('error', (error: Error) => {
          reject(error)
        })
    })
  }