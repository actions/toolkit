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
const exec = __importStar(require("@actions/exec"));
const glob = __importStar(require("@actions/glob"));
const io = __importStar(require("@actions/io"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const semver = __importStar(require("semver"));
const util = __importStar(require("util"));
const uuid_1 = require("uuid");
const constants_1 = require("./constants");
// From https://github.com/actions/toolkit/blob/main/packages/tool-cache/src/tool-cache.ts#L23
function createTempDirectory() {
    return __awaiter(this, void 0, void 0, function* () {
        const IS_WINDOWS = process.platform === 'win32';
        let tempDirectory = process.env['RUNNER_TEMP'] || '';
        if (!tempDirectory) {
            let baseLocation;
            if (IS_WINDOWS) {
                // On Windows use the USERPROFILE env variable
                baseLocation = process.env['USERPROFILE'] || 'C:\\';
            }
            else {
                if (process.platform === 'darwin') {
                    baseLocation = '/Users';
                }
                else {
                    baseLocation = '/home';
                }
            }
            tempDirectory = path.join(baseLocation, 'actions', 'temp');
        }
        const dest = path.join(tempDirectory, uuid_1.v4());
        yield io.mkdirP(dest);
        return dest;
    });
}
exports.createTempDirectory = createTempDirectory;
function getArchiveFileSizeInBytes(filePath) {
    return fs.statSync(filePath).size;
}
exports.getArchiveFileSizeInBytes = getArchiveFileSizeInBytes;
function resolvePaths(patterns) {
    var e_1, _a;
    var _b;
    return __awaiter(this, void 0, void 0, function* () {
        const paths = [];
        const workspace = (_b = process.env['GITHUB_WORKSPACE']) !== null && _b !== void 0 ? _b : process.cwd();
        const globber = yield glob.create(patterns.join('\n'), {
            implicitDescendants: false
        });
        try {
            for (var _c = __asyncValues(globber.globGenerator()), _d; _d = yield _c.next(), !_d.done;) {
                const file = _d.value;
                const relativeFile = path
                    .relative(workspace, file)
                    .replace(new RegExp(`\\${path.sep}`, 'g'), '/');
                core.debug(`Matched: ${relativeFile}`);
                // Paths are made relative so the tar entries are all relative to the root of the workspace.
                paths.push(`${relativeFile}`);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) yield _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return paths;
    });
}
exports.resolvePaths = resolvePaths;
function unlinkFile(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        return util.promisify(fs.unlink)(filePath);
    });
}
exports.unlinkFile = unlinkFile;
function getVersion(app) {
    return __awaiter(this, void 0, void 0, function* () {
        core.debug(`Checking ${app} --version`);
        let versionOutput = '';
        try {
            yield exec.exec(`${app} --version`, [], {
                ignoreReturnCode: true,
                silent: true,
                listeners: {
                    stdout: (data) => (versionOutput += data.toString()),
                    stderr: (data) => (versionOutput += data.toString())
                }
            });
        }
        catch (err) {
            core.debug(err.message);
        }
        versionOutput = versionOutput.trim();
        core.debug(versionOutput);
        return versionOutput;
    });
}
// Use zstandard if possible to maximize cache performance
function getCompressionMethod() {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.platform === 'win32' && !(yield isGnuTarInstalled())) {
            // Disable zstd due to bug https://github.com/actions/cache/issues/301
            return constants_1.CompressionMethod.Gzip;
        }
        const versionOutput = yield getVersion('zstd');
        const version = semver.clean(versionOutput);
        if (!versionOutput.toLowerCase().includes('zstd command line interface')) {
            // zstd is not installed
            return constants_1.CompressionMethod.Gzip;
        }
        else if (!version || semver.lt(version, 'v1.3.2')) {
            // zstd is installed but using a version earlier than v1.3.2
            // v1.3.2 is required to use the `--long` options in zstd
            return constants_1.CompressionMethod.ZstdWithoutLong;
        }
        else {
            return constants_1.CompressionMethod.Zstd;
        }
    });
}
exports.getCompressionMethod = getCompressionMethod;
function getCacheFileName(compressionMethod) {
    return compressionMethod === constants_1.CompressionMethod.Gzip
        ? constants_1.CacheFilename.Gzip
        : constants_1.CacheFilename.Zstd;
}
exports.getCacheFileName = getCacheFileName;
function isGnuTarInstalled() {
    return __awaiter(this, void 0, void 0, function* () {
        const versionOutput = yield getVersion('tar');
        return versionOutput.toLowerCase().includes('gnu tar');
    });
}
exports.isGnuTarInstalled = isGnuTarInstalled;
function assertDefined(name, value) {
    if (value === undefined) {
        throw Error(`Expected ${name} but value was undefiend`);
    }
    return value;
}
exports.assertDefined = assertDefined;
//# sourceMappingURL=cacheUtils.js.map