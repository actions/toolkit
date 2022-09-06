import { HttpClientResponse } from '@actions/http-client';
import { ITypedResponseWithError } from './contracts';
export declare function isSuccessStatusCode(statusCode?: number): boolean;
export declare function isServerErrorStatusCode(statusCode?: number): boolean;
export declare function isRetryableStatusCode(statusCode?: number): boolean;
export declare function retry<T>(name: string, method: () => Promise<T>, getStatusCode: (arg0: T) => number | undefined, maxAttempts?: number, delay?: number, onError?: ((arg0: Error) => T | undefined) | undefined): Promise<T>;
export declare function retryTypedResponse<T>(name: string, method: () => Promise<ITypedResponseWithError<T>>, maxAttempts?: number, delay?: number): Promise<ITypedResponseWithError<T>>;
export declare function retryHttpClientResponse(name: string, method: () => Promise<HttpClientResponse>, maxAttempts?: number, delay?: number): Promise<HttpClientResponse>;
