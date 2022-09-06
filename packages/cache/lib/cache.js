"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const path = __importStar(require("path"));
const utils = __importStar(require("./internal/cacheUtils"));
const cacheHttpClient = __importStar(require("./internal/cacheHttpClient"));
const tar_1 = require("./internal/tar");
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
exports.ValidationError = ValidationError;
class ReserveCacheError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ReserveCacheError';
        Object.setPrototypeOf(this, ReserveCacheError.prototype);
    }
}
exports.ReserveCacheError = ReserveCacheError;
function checkPaths(paths) {
    if (!paths || paths.length === 0) {
        throw new ValidationError(`Path Validation Error: At least one directory or file path is required`);
    }
}
function checkKey(key) {
    if (key.length > 512) {
        throw new ValidationError(`Key Validation Error: ${key} cannot be larger than 512 characters.`);
    }
    const regex = /^[^,]*$/;
    if (!regex.test(key)) {
        throw new ValidationError(`Key Validation Error: ${key} cannot contain commas.`);
    }
}
/**
 * isFeatureAvailable to check the presence of Actions cache service
 *
 * @returns boolean return true if Actions cache service feature is available, otherwise false
 */
function isFeatureAvailable() {
    return !!process.env['ACTIONS_CACHE_URL'];
}
exports.isFeatureAvailable = isFeatureAvailable;
/**
 * Restores cache from keys
 *
 * @param paths a list of file paths to restore from the cache
 * @param primaryKey an explicit key for restoring the cache
 * @param restoreKeys an optional ordered list of keys to use for restoring the cache if no cache hit occurred for key
 * @param downloadOptions cache download options
 * @returns string returns the key for the cache hit, otherwise returns undefined
 */
function restoreCache(paths, primaryKey, restoreKeys, options, blobContainerName, connectionString) {
    return __awaiter(this, void 0, void 0, function* () {
        checkPaths(paths);
        restoreKeys = restoreKeys || [];
        const keys = [primaryKey, ...restoreKeys];
        core.debug('Resolved Keys:');
        core.debug(JSON.stringify(keys));
        if (keys.length > 10) {
            throw new ValidationError(`Key Validation Error: Keys are limited to a maximum of 10.`);
        }
        for (const key of keys) {
            checkKey(key);
        }
        const compressionMethod = yield utils.getCompressionMethod();
        let archivePath = '';
        try {
            // path are needed to compute version
            const cacheEntry = yield cacheHttpClient.getCacheEntry(keys, paths, {
                compressionMethod
            }, blobContainerName, connectionString);
            if (!(cacheEntry === null || cacheEntry === void 0 ? void 0 : cacheEntry.archiveLocation) && !(cacheEntry === null || cacheEntry === void 0 ? void 0 : cacheEntry.cacheKey)) {
                // Cache not found
                return undefined;
            }
            archivePath = path.join(yield utils.createTempDirectory(), utils.getCacheFileName(compressionMethod));
            core.debug(`Archive Path: ${archivePath}`);
            // Download the cache from the cache entry
            yield cacheHttpClient.downloadCache(cacheEntry, archivePath, options, blobContainerName, connectionString);
            if (core.isDebug()) {
                yield tar_1.listTar(archivePath, compressionMethod);
            }
            const archiveFileSize = utils.getArchiveFileSizeInBytes(archivePath);
            core.info(`Cache Size: ~${Math.round(archiveFileSize / (1024 * 1024))} MB (${archiveFileSize} B)`);
            yield tar_1.extractTar(archivePath, compressionMethod);
            core.info('Cache restored successfully');
            return cacheEntry.cacheKey;
        }
        catch (error) {
            const typedError = error;
            if (typedError.name === ValidationError.name) {
                throw error;
            }
            else {
                // Supress all non-validation cache related errors because caching should be optional
                core.warning(`Failed to restore: ${error.message}`);
            }
        }
        finally {
            // Try to delete the archive to save space
            try {
                yield utils.unlinkFile(archivePath);
            }
            catch (error) {
                core.debug(`Failed to delete archive: ${error}`);
            }
        }
        return undefined;
    });
}
exports.restoreCache = restoreCache;
/**
 * Saves a list of files with the specified key
 *
 * @param paths a list of file paths to be cached
 * @param key an explicit key for restoring the cache
 * @param options cache upload options
 * @returns number returns cacheId if the cache was saved successfully and throws an error if save fails
 */
function saveCache(paths, key, options, blobContainerName, connectionString) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
        checkPaths(paths);
        checkKey(key);
        const compressionMethod = yield utils.getCompressionMethod();
        let cacheId = -1;
        const cachePaths = yield utils.resolvePaths(paths);
        core.debug('Cache Paths:');
        core.debug(`${JSON.stringify(cachePaths)}`);
        if (cachePaths.length === 0) {
            throw new Error(`Path Validation Error: Path(s) specified in the action for caching do(es) not exist, hence no cache is being saved.`);
        }
        const archiveFolder = yield utils.createTempDirectory();
        const archivePath = path.join(archiveFolder, utils.getCacheFileName(compressionMethod));
        core.debug(`Archive Path: ${archivePath}`);
        try {
            yield tar_1.createTar(archiveFolder, cachePaths, compressionMethod);
            if (core.isDebug()) {
                yield tar_1.listTar(archivePath, compressionMethod);
            }
            const fileSizeLimit = 10 * 1024 * 1024 * 1024; // 10GB per repo limit
            const archiveFileSize = utils.getArchiveFileSizeInBytes(archivePath);
            core.debug(`File Size: ${archiveFileSize}`);
            // For GHES, this check will take place in ReserveCache API with enterprise file size limit
            if (archiveFileSize > fileSizeLimit && !utils.isGhes()) {
                throw new Error(`Cache size of ~${Math.round(archiveFileSize / (1024 * 1024))} MB (${archiveFileSize} B) is over the 10GB limit, not saving cache.`);
            }
            core.debug('Reserving Cache');
            if (blobContainerName && connectionString) {
                cacheId = 0;
            }
            else {
                const reserveCacheResponse = yield cacheHttpClient.reserveCache(key, paths, {
                    compressionMethod,
                    cacheSize: archiveFileSize
                });
                if ((_a = reserveCacheResponse === null || reserveCacheResponse === void 0 ? void 0 : reserveCacheResponse.result) === null || _a === void 0 ? void 0 : _a.cacheId) {
                    cacheId = (_b = reserveCacheResponse === null || reserveCacheResponse === void 0 ? void 0 : reserveCacheResponse.result) === null || _b === void 0 ? void 0 : _b.cacheId;
                }
                else if ((reserveCacheResponse === null || reserveCacheResponse === void 0 ? void 0 : reserveCacheResponse.statusCode) === 400) {
                    throw new Error((_d = (_c = reserveCacheResponse === null || reserveCacheResponse === void 0 ? void 0 : reserveCacheResponse.error) === null || _c === void 0 ? void 0 : _c.message) !== null && _d !== void 0 ? _d : `Cache size of ~${Math.round(archiveFileSize / (1024 * 1024))} MB (${archiveFileSize} B) is over the data cap limit, not saving cache.`);
                }
                else {
                    throw new ReserveCacheError(`Unable to reserve cache with key ${key}, another job may be creating this cache. More details: ${(_e = reserveCacheResponse === null || reserveCacheResponse === void 0 ? void 0 : reserveCacheResponse.error) === null || _e === void 0 ? void 0 : _e.message}`);
                }
            }
            core.debug(`Saving Cache (ID: ${cacheId})`);
            yield cacheHttpClient.saveCache(cacheId, archivePath, key, options, blobContainerName, connectionString);
        }
        catch (error) {
            const typedError = error;
            if (typedError.name === ValidationError.name) {
                throw error;
            }
            else if (typedError.name === ReserveCacheError.name) {
                core.info(`Failed to save: ${typedError.message}`);
            }
            else {
                core.warning(`Failed to save: ${typedError.message}`);
            }
        }
        finally {
            // Try to delete the archive to save space
            try {
                yield utils.unlinkFile(archivePath);
            }
            catch (error) {
                core.debug(`Failed to delete archive: ${error}`);
            }
        }
        return cacheId;
    });
}
exports.saveCache = saveCache;
//# sourceMappingURL=cache.js.map