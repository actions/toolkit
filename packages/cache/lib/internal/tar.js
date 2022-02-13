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
const exec_1 = require("@actions/exec");
const io = __importStar(require("@actions/io"));
const fs_1 = require("fs");
const path = __importStar(require("path"));
const utils = __importStar(require("./cacheUtils"));
const constants_1 = require("./constants");
function getTarPath(args, compressionMethod) {
    return __awaiter(this, void 0, void 0, function* () {
        switch (process.platform) {
            case 'win32': {
                const systemTar = `${process.env['windir']}\\System32\\tar.exe`;
                if (compressionMethod !== constants_1.CompressionMethod.Gzip) {
                    // We only use zstandard compression on windows when gnu tar is installed due to
                    // a bug with compressing large files with bsdtar + zstd
                    args.push('--force-local');
                }
                else if (fs_1.existsSync(systemTar)) {
                    return systemTar;
                }
                else if (yield utils.isGnuTarInstalled()) {
                    args.push('--force-local');
                }
                break;
            }
            case 'darwin': {
                const gnuTar = yield io.which('gtar', false);
                if (gnuTar) {
                    // fix permission denied errors when extracting BSD tar archive with GNU tar - https://github.com/actions/cache/issues/527
                    args.push('--delay-directory-restore');
                    return gnuTar;
                }
                break;
            }
            default:
                break;
        }
        return yield io.which('tar', true);
    });
}
function execTar(args, compressionMethod, cwd) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield exec_1.exec(`"${yield getTarPath(args, compressionMethod)}"`, args, { cwd });
        }
        catch (error) {
            throw new Error(`Tar failed with error: ${error === null || error === void 0 ? void 0 : error.message}`);
        }
    });
}
function getWorkingDirectory() {
    var _a;
    return (_a = process.env['GITHUB_WORKSPACE']) !== null && _a !== void 0 ? _a : process.cwd();
}
function extractTar(archivePath, compressionMethod) {
    return __awaiter(this, void 0, void 0, function* () {
        // Create directory to extract tar into
        const workingDirectory = getWorkingDirectory();
        yield io.mkdirP(workingDirectory);
        // --d: Decompress.
        // --long=#: Enables long distance matching with # bits. Maximum is 30 (1GB) on 32-bit OS and 31 (2GB) on 64-bit.
        // Using 30 here because we also support 32-bit self-hosted runners.
        function getCompressionProgram() {
            switch (compressionMethod) {
                case constants_1.CompressionMethod.Zstd:
                    return ['--use-compress-program', 'zstd -d --long=30'];
                case constants_1.CompressionMethod.ZstdWithoutLong:
                    return ['--use-compress-program', 'zstd -d'];
                default:
                    return ['-z'];
            }
        }
        const args = [
            ...getCompressionProgram(),
            '-xf',
            archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
            '-P',
            '-C',
            workingDirectory.replace(new RegExp(`\\${path.sep}`, 'g'), '/')
        ];
        yield execTar(args, compressionMethod);
    });
}
exports.extractTar = extractTar;
function createTar(archiveFolder, sourceDirectories, compressionMethod) {
    return __awaiter(this, void 0, void 0, function* () {
        // Write source directories to manifest.txt to avoid command length limits
        const manifestFilename = 'manifest.txt';
        const cacheFileName = utils.getCacheFileName(compressionMethod);
        fs_1.writeFileSync(path.join(archiveFolder, manifestFilename), sourceDirectories.join('\n'));
        const workingDirectory = getWorkingDirectory();
        // -T#: Compress using # working thread. If # is 0, attempt to detect and use the number of physical CPU cores.
        // --long=#: Enables long distance matching with # bits. Maximum is 30 (1GB) on 32-bit OS and 31 (2GB) on 64-bit.
        // Using 30 here because we also support 32-bit self-hosted runners.
        // Long range mode is added to zstd in v1.3.2 release, so we will not use --long in older version of zstd.
        function getCompressionProgram() {
            switch (compressionMethod) {
                case constants_1.CompressionMethod.Zstd:
                    return ['--use-compress-program', 'zstd -T0 --long=30'];
                case constants_1.CompressionMethod.ZstdWithoutLong:
                    return ['--use-compress-program', 'zstd -T0'];
                default:
                    return ['-z'];
            }
        }
        const args = [
            '--posix',
            ...getCompressionProgram(),
            '-cf',
            cacheFileName.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
            '-P',
            '-C',
            workingDirectory.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
            '--files-from',
            manifestFilename
        ];
        yield execTar(args, compressionMethod, archiveFolder);
    });
}
exports.createTar = createTar;
function listTar(archivePath, compressionMethod) {
    return __awaiter(this, void 0, void 0, function* () {
        // --d: Decompress.
        // --long=#: Enables long distance matching with # bits.
        // Maximum is 30 (1GB) on 32-bit OS and 31 (2GB) on 64-bit.
        // Using 30 here because we also support 32-bit self-hosted runners.
        function getCompressionProgram() {
            switch (compressionMethod) {
                case constants_1.CompressionMethod.Zstd:
                    return ['--use-compress-program', 'zstd -d --long=30'];
                case constants_1.CompressionMethod.ZstdWithoutLong:
                    return ['--use-compress-program', 'zstd -d'];
                default:
                    return ['-z'];
            }
        }
        const args = [
            ...getCompressionProgram(),
            '-tf',
            archivePath.replace(new RegExp(`\\${path.sep}`, 'g'), '/'),
            '-P'
        ];
        yield execTar(args, compressionMethod);
    });
}
exports.listTar = listTar;
//# sourceMappingURL=tar.js.map