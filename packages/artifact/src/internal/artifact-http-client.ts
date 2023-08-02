import { HttpCodes, HttpClient, HttpClientResponse } from '@actions/http-client'
import { BearerCredentialHandler } from '@actions/http-client/lib/auth'
import { info } from '@actions/core'
import { getRuntimeToken, getResultsServiceUrl, getRetryMultiplier, getInitialRetryIntervalInMilliseconds, getRetryLimit } from './config'

interface Rpc { request(
        service: string,
        method: string,
        contentType: "application/json" | "application/protobuf",
        data: object | Uint8Array
    ): Promise<object | Uint8Array>
}

export class ArtifactHttpClient implements Rpc {
    private httpClient: HttpClient 
    private baseUrl: string

    constructor(userAgent: string) {
        this.httpClient = new HttpClient(userAgent, [
            new BearerCredentialHandler(getRuntimeToken())
        ])
        this.baseUrl = getResultsServiceUrl()
    }

    async request(service: string, method: string, contentType: "application/json" | "application/protobuf", data: object | Uint8Array): Promise<object | Uint8Array> {
        let url = `${this.baseUrl}/twirp/${service}/${method}`
        let headers = {
            "Content-Type": contentType
        }

        const resp = await this.retry(
            `${method}`,
            this.httpClient.post(url, JSON.stringify(data), headers),
        )
        const body = await resp.readBody()
        return JSON.parse(body)
    }

    async retry(name: string, operation: Promise<HttpClientResponse>): Promise<HttpClientResponse> {
        let response: HttpClientResponse | undefined = undefined
        let statusCode: number | undefined = undefined
        let isRetryable = false
        let errorMessage = ''
        let attempt = 1
        const maxAttempts = getRetryLimit() 

        while (attempt <= maxAttempts) {
            try {
                response = await operation
                statusCode = response.message.statusCode

                if (this.isSuccessStatusCode(statusCode)) {
                    return response
                }

                isRetryable = this.isRetryableStatusCode(statusCode)
                    errorMessage = `Artifact service responded with ${statusCode}`
            } catch (error) {
                isRetryable = true
                errorMessage = error.message
            }

            if (!isRetryable) {
                info(`${name} - Error is not retryable`)
                if (response) {
                    this.displayHttpDiagnostics(response)
                }
                break
            }

            info(
                `${name} - Attempt ${attempt} of ${maxAttempts} failed with error: ${errorMessage}`
            )
                
            await this.sleep(this.getExponentialRetryTimeInMilliseconds(attempt))
            attempt++
        }

        if (response) {
            this.displayHttpDiagnostics(response)
        }

        throw Error(`${name} failed: ${errorMessage}`)
    }

    isSuccessStatusCode(statusCode?: number): boolean {
        if (!statusCode) {
            return false
        }
        return statusCode >= 200 && statusCode < 300
    }

    isRetryableStatusCode(statusCode: number | undefined): boolean {
        if (!statusCode) {
            return false
        }

        const retryableStatusCodes = [
            HttpCodes.BadGateway,
            HttpCodes.GatewayTimeout,
            HttpCodes.InternalServerError,
            HttpCodes.ServiceUnavailable,
            HttpCodes.TooManyRequests,
            413 // Payload Too Large
        ]
        return retryableStatusCodes.includes(statusCode)
    }

    displayHttpDiagnostics(response: HttpClientResponse): void {
        info(
            `##### Begin Diagnostic HTTP information #####
        Status Code: ${response.message.statusCode}
        Status Message: ${response.message.statusMessage}
        Header Information: ${JSON.stringify(response.message.headers, undefined, 2)}
        ###### End Diagnostic HTTP information ######`
        )
    }

    getExponentialRetryTimeInMilliseconds(
        retryCount: number
    ): number {
        if (retryCount < 0) {
            throw new Error('RetryCount should not be negative')
        } else if (retryCount === 0) {
            return getInitialRetryIntervalInMilliseconds()
        }

        const minTime =
            getInitialRetryIntervalInMilliseconds() * getRetryMultiplier() * retryCount
        const maxTime = minTime * getRetryMultiplier()

        // returns a random number between the minTime (inclusive) and the maxTime (exclusive)
        return Math.trunc(Math.random() * (maxTime - minTime) + minTime)
    }

    async sleep(milliseconds: number): Promise<void> {
          return new Promise(resolve => setTimeout(resolve, milliseconds))
    }
}
