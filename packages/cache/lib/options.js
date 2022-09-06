"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
/**
 * Returns a copy of the upload options with defaults filled in.
 *
 * @param copy the original upload options
 */
function getUploadOptions(copy) {
    const result = {
        uploadConcurrency: 4,
        uploadChunkSize: 32 * 1024 * 1024
    };
    if (copy) {
        if (typeof copy.uploadConcurrency === 'number') {
            result.uploadConcurrency = copy.uploadConcurrency;
        }
        if (typeof copy.uploadChunkSize === 'number') {
            result.uploadChunkSize = copy.uploadChunkSize;
        }
    }
    core.debug(`Upload concurrency: ${result.uploadConcurrency}`);
    core.debug(`Upload chunk size: ${result.uploadChunkSize}`);
    return result;
}
exports.getUploadOptions = getUploadOptions;
/**
 * Returns a copy of the download options with defaults filled in.
 *
 * @param copy the original download options
 */
function getDownloadOptions(copy) {
    const result = {
        useAzureSdk: true,
        downloadConcurrency: 8,
        timeoutInMs: 30000,
        segmentTimeoutInMs: 3600000
    };
    if (copy) {
        if (typeof copy.useAzureSdk === 'boolean') {
            result.useAzureSdk = copy.useAzureSdk;
        }
        if (typeof copy.downloadConcurrency === 'number') {
            result.downloadConcurrency = copy.downloadConcurrency;
        }
        if (typeof copy.timeoutInMs === 'number') {
            result.timeoutInMs = copy.timeoutInMs;
        }
        if (typeof copy.segmentTimeoutInMs === 'number') {
            result.segmentTimeoutInMs = copy.segmentTimeoutInMs;
        }
    }
    const segmentDownloadTimeoutMins = process.env['SEGMENT_DOWNLOAD_TIMEOUT_MINS'];
    if (segmentDownloadTimeoutMins &&
        !isNaN(Number(segmentDownloadTimeoutMins)) &&
        isFinite(Number(segmentDownloadTimeoutMins))) {
        result.segmentTimeoutInMs = Number(segmentDownloadTimeoutMins) * 60 * 1000;
    }
    core.debug(`Use Azure SDK: ${result.useAzureSdk}`);
    core.debug(`Download concurrency: ${result.downloadConcurrency}`);
    core.debug(`Request timeout (ms): ${result.timeoutInMs}`);
    core.debug(`Cache segment download timeout mins env var: ${process.env['SEGMENT_DOWNLOAD_TIMEOUT_MINS']}`);
    core.debug(`Segment download timeout (ms): ${result.segmentTimeoutInMs}`);
    return result;
}
exports.getDownloadOptions = getDownloadOptions;
//# sourceMappingURL=options.js.map