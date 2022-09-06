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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
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
const http_client_1 = require("@actions/http-client");
const auth_1 = require("@actions/http-client/lib/auth");
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const url_1 = require("url");
const utils = __importStar(require("./cacheUtils"));
const constants_1 = require("./constants");
const downloadUtils_1 = require("./downloadUtils");
const options_1 = require("../options");
const requestUtils_1 = require("./requestUtils");
const storage_blob_1 = require("@azure/storage-blob");
const versionSalt = '1.0';
function getCacheApiUrl(resource) {
    const baseUrl = process.env['ACTIONS_CACHE_URL'] || '';
    if (!baseUrl) {
        throw new Error('Cache Service Url not found, unable to restore cache.');
    }
    const url = `${baseUrl}_apis/artifactcache/${resource}`;
    core.debug(`Resource Url: ${url}`);
    return url;
}
function createAcceptHeader(type, apiVersion) {
    return `${type};api-version=${apiVersion}`;
}
function getRequestOptions() {
    const requestOptions = {
        headers: {
            Accept: createAcceptHeader('application/json', '6.0-preview.1')
        }
    };
    return requestOptions;
}
function createHttpClient() {
    const token = process.env['ACTIONS_RUNTIME_TOKEN'] || '';
    const bearerCredentialHandler = new auth_1.BearerCredentialHandler(token);
    return new http_client_1.HttpClient('actions/cache', [bearerCredentialHandler], getRequestOptions());
}
function getCacheVersion(paths, compressionMethod) {
    const components = paths.concat(!compressionMethod || compressionMethod === constants_1.CompressionMethod.Gzip
        ? []
        : [compressionMethod]);
    // Add salt to cache version to support breaking changes in cache entry
    components.push(versionSalt);
    return crypto
        .createHash('sha256')
        .update(components.join('|'))
        .digest('hex');
}
exports.getCacheVersion = getCacheVersion;
function getCacheEntryBlob(connectionString, blobContainerName, keys, paths) {
    var e_1, _a;
    return __awaiter(this, void 0, void 0, function* () {
        const primaryKey = keys[0];
        const notPrimaryKey = keys.slice(1);
        const blobService = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
        const blobContainer = blobService.getContainerClient(blobContainerName);
        const blobList = blobContainer.listBlobsFlat();
        try {
            for (var blobList_1 = __asyncValues(blobList), blobList_1_1; blobList_1_1 = yield blobList_1.next(), !blobList_1_1.done;) {
                const blob = blobList_1_1.value;
                if (blob.name === primaryKey) {
                    return {
                        cacheKey: primaryKey,
                        creationTime: blob.properties.lastModified.toISOString()
                    };
                }
                for (const key of notPrimaryKey) {
                    if (blob.name === key) {
                        return {
                            cacheKey: blob.name,
                            creationTime: blob.properties.lastModified.toISOString()
                        };
                    }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (blobList_1_1 && !blobList_1_1.done && (_a = blobList_1.return)) yield _a.call(blobList_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return null;
    });
}
function getCacheEntry(keys, paths, options, blobContainerName, connectionString) {
    return __awaiter(this, void 0, void 0, function* () {
        if (blobContainerName && connectionString) {
            return yield getCacheEntryBlob(connectionString, blobContainerName, keys, paths);
        }
        const httpClient = createHttpClient();
        const version = getCacheVersion(paths, options === null || options === void 0 ? void 0 : options.compressionMethod);
        const resource = `cache?keys=${encodeURIComponent(keys.join(','))}&version=${version}`;
        const response = yield requestUtils_1.retryTypedResponse('getCacheEntry', () => __awaiter(this, void 0, void 0, function* () { return httpClient.getJson(getCacheApiUrl(resource)); }));
        if (response.statusCode === 204) {
            return null;
        }
        if (!requestUtils_1.isSuccessStatusCode(response.statusCode)) {
            throw new Error(`Cache service responded with ${response.statusCode}`);
        }
        const cacheResult = response.result;
        const cacheDownloadUrl = cacheResult === null || cacheResult === void 0 ? void 0 : cacheResult.archiveLocation;
        if (!cacheDownloadUrl) {
            throw new Error('Cache not found.');
        }
        core.setSecret(cacheDownloadUrl);
        core.debug(`Cache Result:`);
        core.debug(JSON.stringify(cacheResult));
        return cacheResult;
    });
}
exports.getCacheEntry = getCacheEntry;
function downloadCache(cacheEntry, archivePath, options, blobContainerName, connectionString) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const archiveLocation = (_a = cacheEntry.archiveLocation) !== null && _a !== void 0 ? _a : 'https://NoArchiveLocationFound.com';
        const archiveUrl = new url_1.URL(archiveLocation);
        const downloadOptions = options_1.getDownloadOptions(options);
        if (downloadOptions.useAzureSdk &&
            archiveUrl.hostname.endsWith('.blob.core.windows.net')) {
            // Use Azure storage SDK to download caches hosted on Azure to improve speed and reliability.
            yield downloadUtils_1.downloadCacheStorageSDK(archiveLocation, archivePath, downloadOptions);
        }
        if (blobContainerName && connectionString && cacheEntry.cacheKey) {
            yield downloadUtils_1.downloadCacheBlobStorage(cacheEntry.cacheKey, archivePath, downloadOptions, blobContainerName, connectionString);
        }
        else {
            // Otherwise, download using the Actions http-client.
            yield downloadUtils_1.downloadCacheHttpClient(archiveLocation, archivePath);
        }
    });
}
exports.downloadCache = downloadCache;
// Reserve Cache
function reserveCache(key, paths, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const httpClient = createHttpClient();
        const version = getCacheVersion(paths, options === null || options === void 0 ? void 0 : options.compressionMethod);
        const reserveCacheRequest = {
            key,
            version,
            cacheSize: options === null || options === void 0 ? void 0 : options.cacheSize
        };
        const response = yield requestUtils_1.retryTypedResponse('reserveCache', () => __awaiter(this, void 0, void 0, function* () {
            return httpClient.postJson(getCacheApiUrl('caches'), reserveCacheRequest);
        }));
        return response;
    });
}
exports.reserveCache = reserveCache;
function getContentRange(start, end) {
    // Format: `bytes start-end/filesize
    // start and end are inclusive
    // filesize can be *
    // For a 200 byte chunk starting at byte 0:
    // Content-Range: bytes 0-199/*
    return `bytes ${start}-${end}/*`;
}
function uploadChunk(httpClient, resourceUrl, openStream, start, end) {
    return __awaiter(this, void 0, void 0, function* () {
        core.debug(`Uploading chunk of size ${end -
            start +
            1} bytes at offset ${start} with content range: ${getContentRange(start, end)}`);
        const additionalHeaders = {
            'Content-Type': 'application/octet-stream',
            'Content-Range': getContentRange(start, end)
        };
        const uploadChunkResponse = yield requestUtils_1.retryHttpClientResponse(`uploadChunk (start: ${start}, end: ${end})`, () => __awaiter(this, void 0, void 0, function* () {
            return httpClient.sendStream('PATCH', resourceUrl, openStream(), additionalHeaders);
        }));
        if (!requestUtils_1.isSuccessStatusCode(uploadChunkResponse.message.statusCode)) {
            throw new Error(`Cache service responded with ${uploadChunkResponse.message.statusCode} during upload chunk.`);
        }
    });
}
function uploadFileBlob(blobContainerName, connectionString, archivePath, key, concurrency) {
    return __awaiter(this, void 0, void 0, function* () {
        core.debug(`Start upload to (blobContainerName: ${blobContainerName})`);
        const fileStream = fs.createReadStream(archivePath);
        try {
            const blockBlobClient = new storage_blob_1.BlockBlobClient(connectionString, blobContainerName, key);
            yield blockBlobClient.uploadStream(fileStream, undefined, concurrency);
        }
        catch (error) {
            throw new Error(`Cache upload failed because ${error}`);
        }
        return;
    });
}
function uploadFile(httpClient, cacheId, archivePath, key, options, blobContainerName, connectionString) {
    return __awaiter(this, void 0, void 0, function* () {
        // Upload Chunks
        const uploadOptions = options_1.getUploadOptions(options);
        const concurrency = utils.assertDefined('uploadConcurrency', uploadOptions.uploadConcurrency);
        const maxChunkSize = utils.assertDefined('uploadChunkSize', uploadOptions.uploadChunkSize);
        const parallelUploads = [...new Array(concurrency).keys()];
        core.debug('Awaiting all uploads');
        let offset = 0;
        if (blobContainerName && connectionString) {
            yield uploadFileBlob(blobContainerName, connectionString, archivePath, key, concurrency);
            return;
        }
        const fileSize = utils.getArchiveFileSizeInBytes(archivePath);
        const resourceUrl = getCacheApiUrl(`caches/${cacheId.toString()}`);
        const fd = fs.openSync(archivePath, 'r');
        try {
            yield Promise.all(parallelUploads.map(() => __awaiter(this, void 0, void 0, function* () {
                while (offset < fileSize) {
                    const chunkSize = Math.min(fileSize - offset, maxChunkSize);
                    const start = offset;
                    const end = offset + chunkSize - 1;
                    offset += maxChunkSize;
                    yield uploadChunk(httpClient, resourceUrl, () => fs
                        .createReadStream(archivePath, {
                        fd,
                        start,
                        end,
                        autoClose: false
                    })
                        .on('error', error => {
                        throw new Error(`Cache upload failed because file read failed with ${error.message}`);
                    }), start, end);
                }
            })));
        }
        finally {
            fs.closeSync(fd);
        }
        return;
    });
}
function commitCache(httpClient, cacheId, filesize) {
    return __awaiter(this, void 0, void 0, function* () {
        const commitCacheRequest = { size: filesize };
        return yield requestUtils_1.retryTypedResponse('commitCache', () => __awaiter(this, void 0, void 0, function* () {
            return httpClient.postJson(getCacheApiUrl(`caches/${cacheId.toString()}`), commitCacheRequest);
        }));
    });
}
function saveCache(cacheId, archivePath, key, options, blobContainerName, connectionString) {
    return __awaiter(this, void 0, void 0, function* () {
        const httpClient = createHttpClient();
        core.debug('Upload cache');
        yield uploadFile(httpClient, cacheId, archivePath, key, options, blobContainerName, connectionString);
        // Commit Cache
        core.debug('Commiting cache');
        const cacheSize = utils.getArchiveFileSizeInBytes(archivePath);
        core.info(`Cache Size: ~${Math.round(cacheSize / (1024 * 1024))} MB (${cacheSize} B)`);
        if (!connectionString && !blobContainerName) {
            const commitCacheResponse = yield commitCache(httpClient, cacheId, cacheSize);
            if (!requestUtils_1.isSuccessStatusCode(commitCacheResponse.statusCode)) {
                throw new Error(`Cache service responded with ${commitCacheResponse.statusCode} during commit cache.`);
            }
        }
        core.info('Cache saved successfully');
    });
}
exports.saveCache = saveCache;
//# sourceMappingURL=cacheHttpClient.js.map