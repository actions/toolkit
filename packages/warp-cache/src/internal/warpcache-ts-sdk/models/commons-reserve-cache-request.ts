/* tslint:disable */
/* eslint-disable */
/**
 * WarpCache
 * Caching server for WarpBuild
 *
 * The version of the OpenAPI document: 0.1.0
 * Contact: suppport@warpbuild.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */



/**
 * 
 * @export
 * @interface CommonsReserveCacheRequest
 */
export interface CommonsReserveCacheRequest {
    /**
     * 
     * @type {{ [key: string]: string; }}
     * @memberof CommonsReserveCacheRequest
     */
    'annotations'?: { [key: string]: string; };
    /**
     * 
     * @type {string}
     * @memberof CommonsReserveCacheRequest
     */
    'cache_key': string;
    /**
     * 
     * @type {string}
     * @memberof CommonsReserveCacheRequest
     */
    'cache_version': string;
    /**
     * ContentType contains the content type of the cache.  * This is not supported for GCS cache. When passed this will be ignored. *
     * @type {string}
     * @memberof CommonsReserveCacheRequest
     */
    'content_type'?: string;
    /**
     * NumberOfChunks contains the number of chunks the cache will be split into. Minimum value: 1. Maximum value: 10000.  * This is not supported for GCS cache. When passed this will be ignored. *
     * @type {number}
     * @memberof CommonsReserveCacheRequest
     */
    'number_of_chunks'?: number;
    /**
     * 
     * @type {string}
     * @memberof CommonsReserveCacheRequest
     */
    'provider'?: string;
    /**
     * VCSRef is the ref of the repository in vcs for which cache is being used. This can be a branch, git tag, or pull request ref.
     * @type {string}
     * @memberof CommonsReserveCacheRequest
     */
    'vcs_ref'?: string;
    /**
     * VCSRepository is the repository name in vcs. It can be of the format <organization>/<repository> or <repository>. While saving the entry, <organization>/ will be trimmed if passed.
     * @type {string}
     * @memberof CommonsReserveCacheRequest
     */
    'vcs_repository'?: string;
}

