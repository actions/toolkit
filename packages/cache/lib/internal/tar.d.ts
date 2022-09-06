import { CompressionMethod } from './constants';
export declare function listTar(archivePath: string, compressionMethod: CompressionMethod): Promise<void>;
export declare function extractTar(archivePath: string, compressionMethod: CompressionMethod): Promise<void>;
export declare function createTar(archiveFolder: string, sourceDirectories: string[], compressionMethod: CompressionMethod): Promise<void>;
