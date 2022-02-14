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
const http_client_1 = require("@actions/http-client");
const storage_blob_1 = require("@azure/storage-blob");
const client_s3_1 = require("@aws-sdk/client-s3");
const buffer = __importStar(require("buffer"));
const fs = __importStar(require("fs"));
const stream = __importStar(require("stream"));
const util = __importStar(require("util"));
const utils = __importStar(require("./cacheUtils"));
const constants_1 = require("./constants");
const requestUtils_1 = require("./requestUtils");
/**
 * Pipes the body of a HTTP response to a stream
 *
 * @param response the HTTP response
 * @param output the writable stream
 */
function pipeResponseToStream(response, output) {
    return __awaiter(this, void 0, void 0, function* () {
        const pipeline = util.promisify(stream.pipeline);
        yield pipeline(response.message, output);
    });
}
/**
 * Class for tracking the download state and displaying stats.
 */
class DownloadProgress {
    constructor(contentLength) {
        this.contentLength = contentLength;
        this.segmentIndex = 0;
        this.segmentSize = 0;
        this.segmentOffset = 0;
        this.receivedBytes = 0;
        this.displayedComplete = false;
        this.startTime = Date.now();
    }
    /**
     * Progress to the next segment. Only call this method when the previous segment
     * is complete.
     *
     * @param segmentSize the length of the next segment
     */
    nextSegment(segmentSize) {
        this.segmentOffset = this.segmentOffset + this.segmentSize;
        this.segmentIndex = this.segmentIndex + 1;
        this.segmentSize = segmentSize;
        this.receivedBytes = 0;
        core.debug(`Downloading segment at offset ${this.segmentOffset} with length ${this.segmentSize}...`);
    }
    /**
     * Sets the number of bytes received for the current segment.
     *
     * @param receivedBytes the number of bytes received
     */
    setReceivedBytes(receivedBytes) {
        this.receivedBytes = receivedBytes;
    }
    /**
     * Returns the total number of bytes transferred.
     */
    getTransferredBytes() {
        return this.segmentOffset + this.receivedBytes;
    }
    /**
     * Returns true if the download is complete.
     */
    isDone() {
        return this.getTransferredBytes() === this.contentLength;
    }
    /**
     * Prints the current download stats. Once the download completes, this will print one
     * last line and then stop.
     */
    display() {
        if (this.displayedComplete) {
            return;
        }
        const transferredBytes = this.segmentOffset + this.receivedBytes;
        const percentage = (100 * (transferredBytes / this.contentLength)).toFixed(1);
        const elapsedTime = Date.now() - this.startTime;
        const downloadSpeed = (transferredBytes /
            (1024 * 1024) /
            (elapsedTime / 1000)).toFixed(1);
        core.info(`Received ${transferredBytes} of ${this.contentLength} (${percentage}%), ${downloadSpeed} MBs/sec`);
        if (this.isDone()) {
            this.displayedComplete = true;
        }
    }
    /**
     * Returns a function used to handle TransferProgressEvents.
     */
    onProgress() {
        return (progress) => {
            this.setReceivedBytes(progress.loadedBytes);
        };
    }
    /**
     * Starts the timer that displays the stats.
     *
     * @param delayInMs the delay between each write
     */
    startDisplayTimer(delayInMs = 1000) {
        const displayCallback = () => {
            this.display();
            if (!this.isDone()) {
                this.timeoutHandle = setTimeout(displayCallback, delayInMs);
            }
        };
        this.timeoutHandle = setTimeout(displayCallback, delayInMs);
    }
    /**
     * Stops the timer that displays the stats. As this typically indicates the download
     * is complete, this will display one last line, unless the last line has already
     * been written.
     */
    stopDisplayTimer() {
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
            this.timeoutHandle = undefined;
        }
        this.display();
    }
}
exports.DownloadProgress = DownloadProgress;
/**
 * Download the cache using the Actions toolkit http-client
 *
 * @param archiveLocation the URL for the cache
 * @param archivePath the local path where the cache is saved
 */
function downloadCacheHttpClient(archiveLocation, archivePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const writeStream = fs.createWriteStream(archivePath);
        const httpClient = new http_client_1.HttpClient('actions/cache');
        const downloadResponse = yield requestUtils_1.retryHttpClientResponse('downloadCache', () => __awaiter(this, void 0, void 0, function* () { return httpClient.get(archiveLocation); }));
        // Abort download if no traffic received over the socket.
        downloadResponse.message.socket.setTimeout(constants_1.SocketTimeout, () => {
            downloadResponse.message.destroy();
            core.debug(`Aborting download, socket timed out after ${constants_1.SocketTimeout} ms`);
        });
        yield pipeResponseToStream(downloadResponse, writeStream);
        // Validate download size.
        const contentLengthHeader = downloadResponse.message.headers['content-length'];
        if (contentLengthHeader) {
            const expectedLength = parseInt(contentLengthHeader);
            const actualLength = utils.getArchiveFileSizeInBytes(archivePath);
            if (actualLength !== expectedLength) {
                throw new Error(`Incomplete download. Expected file size: ${expectedLength}, actual file size: ${actualLength}`);
            }
        }
        else {
            core.debug('Unable to validate download, no Content-Length header');
        }
    });
}
exports.downloadCacheHttpClient = downloadCacheHttpClient;
/**
 * Download the cache using the Azure Storage SDK.  Only call this method if the
 * URL points to an Azure Storage endpoint.
 *
 * @param archiveLocation the URL for the cache
 * @param archivePath the local path where the cache is saved
 * @param options the download options with the defaults set
 */
function downloadCacheStorageSDK(archiveLocation, archivePath, options) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const client = new storage_blob_1.BlockBlobClient(archiveLocation, undefined, {
            retryOptions: {
                // Override the timeout used when downloading each 4 MB chunk
                // The default is 2 min / MB, which is way too slow
                tryTimeoutInMs: options.timeoutInMs
            }
        });
        const properties = yield client.getProperties();
        const contentLength = (_a = properties.contentLength) !== null && _a !== void 0 ? _a : -1;
        if (contentLength < 0) {
            // We should never hit this condition, but just in case fall back to downloading the
            // file as one large stream
            core.debug('Unable to determine content length, downloading file with http-client...');
            yield downloadCacheHttpClient(archiveLocation, archivePath);
        }
        else {
            // Use downloadToBuffer for faster downloads, since internally it splits the
            // file into 4 MB chunks which can then be parallelized and retried independently
            //
            // If the file exceeds the buffer maximum length (~1 GB on 32-bit systems and ~2 GB
            // on 64-bit systems), split the download into multiple segments
            const maxSegmentSize = buffer.constants.MAX_LENGTH;
            const downloadProgress = new DownloadProgress(contentLength);
            const fd = fs.openSync(archivePath, 'w');
            try {
                downloadProgress.startDisplayTimer();
                while (!downloadProgress.isDone()) {
                    const segmentStart = downloadProgress.segmentOffset + downloadProgress.segmentSize;
                    const segmentSize = Math.min(maxSegmentSize, contentLength - segmentStart);
                    downloadProgress.nextSegment(segmentSize);
                    const result = yield client.downloadToBuffer(segmentStart, segmentSize, {
                        concurrency: options.downloadConcurrency,
                        onProgress: downloadProgress.onProgress()
                    });
                    fs.writeFileSync(fd, result);
                }
            }
            finally {
                downloadProgress.stopDisplayTimer();
                fs.closeSync(fd);
            }
        }
    });
}
exports.downloadCacheStorageSDK = downloadCacheStorageSDK;
/**
 * Download the cache using the AWS S3.  Only call this method if the use S3.
 *
 * @param key the key for the cache in S3
 * @param archivePath the local path where the cache is saved
 * @param s3Options: the option for AWS S3 client
 * @param s3BucketName: the name of bucket in AWS S3
 */
function downloadCacheStorageS3(key, archivePath, s3Options, s3BucketName) {
    return __awaiter(this, void 0, void 0, function* () {
        const s3client = new client_s3_1.S3Client(s3Options);
        const param = {
            Bucket: s3BucketName,
            Key: key,
        };
        const response = yield s3client.send(new client_s3_1.GetObjectCommand(param));
        if (!response.Body) {
            throw new Error(`Incomplete download. response.Body is undefined from S3.`);
        }
        const fileStream = fs.createWriteStream(archivePath);
        const pipeline = util.promisify(stream.pipeline);
        yield pipeline(response.Body, fileStream);
        return;
    });
}
exports.downloadCacheStorageS3 = downloadCacheStorageS3;
//# sourceMappingURL=downloadUtils.js.map