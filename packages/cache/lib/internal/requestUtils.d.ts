import { IHttpClientResponse, ITypedResponse } from '@actions/http-client/interfaces';
export declare function isSuccessStatusCode(statusCode?: number): boolean;
export declare function isServerErrorStatusCode(statusCode?: number): boolean;
export declare function isRetryableStatusCode(statusCode?: number): boolean;
export declare function retry<T>(name: string, method: () => Promise<T>, getStatusCode: (arg0: T) => number | undefined, maxAttempts?: number, delay?: number, onError?: ((arg0: Error) => T | undefined) | undefined): Promise<T>;
export declare function retryTypedResponse<T>(name: string, method: () => Promise<ITypedResponse<T>>, maxAttempts?: number, delay?: number): Promise<ITypedResponse<T>>;
export declare function retryHttpClientResponse(name: string, method: () => Promise<IHttpClientResponse>, maxAttempts?: number, delay?: number): Promise<IHttpClientResponse>;
