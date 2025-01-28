import {
    CreateCacheEntryRequest,
    CreateCacheEntryResponse,
    FinalizeCacheEntryUploadRequest,
    FinalizeCacheEntryUploadResponse,
    GetCacheEntryDownloadURLRequest,
    GetCacheEntryDownloadURLResponse,
  } from "./cache";
  
  //==================================//
  //          Client Code             //
  //==================================//
  
  interface Rpc {
    request(
      service: string,
      method: string,
      contentType: "application/json" | "application/protobuf",
      data: object | Uint8Array
    ): Promise<object | Uint8Array>;
  }
  
  export interface CacheServiceClient {
    CreateCacheEntry(
      request: CreateCacheEntryRequest
    ): Promise<CreateCacheEntryResponse>;
    FinalizeCacheEntryUpload(
      request: FinalizeCacheEntryUploadRequest
    ): Promise<FinalizeCacheEntryUploadResponse>;
    GetCacheEntryDownloadURL(
      request: GetCacheEntryDownloadURLRequest
    ): Promise<GetCacheEntryDownloadURLResponse>;
  }
  
  export class CacheServiceClientJSON implements CacheServiceClient {
    private readonly rpc: Rpc;
    constructor(rpc: Rpc) {
      this.rpc = rpc;
      this.CreateCacheEntry.bind(this);
      this.FinalizeCacheEntryUpload.bind(this);
      this.GetCacheEntryDownloadURL.bind(this);
    }
    CreateCacheEntry(
      request: CreateCacheEntryRequest
    ): Promise<CreateCacheEntryResponse> {
      const data = CreateCacheEntryRequest.toJson(request, {
        useProtoFieldName: true,
        emitDefaultValues: false,
      });
      const promise = this.rpc.request(
        "github.actions.results.api.v1.CacheService",
        "CreateCacheEntry",
        "application/json",
        data as object
      );
      return promise.then((data) =>
        CreateCacheEntryResponse.fromJson(data as any, {
          ignoreUnknownFields: true,
        })
      );
    }
  
    FinalizeCacheEntryUpload(
      request: FinalizeCacheEntryUploadRequest
    ): Promise<FinalizeCacheEntryUploadResponse> {
      const data = FinalizeCacheEntryUploadRequest.toJson(request, {
        useProtoFieldName: true,
        emitDefaultValues: false,
      });
      const promise = this.rpc.request(
        "github.actions.results.api.v1.CacheService",
        "FinalizeCacheEntryUpload",
        "application/json",
        data as object
      );
      return promise.then((data) =>
        FinalizeCacheEntryUploadResponse.fromJson(data as any, {
          ignoreUnknownFields: true,
        })
      );
    }
  
    GetCacheEntryDownloadURL(
      request: GetCacheEntryDownloadURLRequest
    ): Promise<GetCacheEntryDownloadURLResponse> {
      const data = GetCacheEntryDownloadURLRequest.toJson(request, {
        useProtoFieldName: true,
        emitDefaultValues: false,
      });
      const promise = this.rpc.request(
        "github.actions.results.api.v1.CacheService",
        "GetCacheEntryDownloadURL",
        "application/json",
        data as object
      );
      return promise.then((data) =>
        GetCacheEntryDownloadURLResponse.fromJson(data as any, {
          ignoreUnknownFields: true,
        })
      );
    }
  }
  
  export class CacheServiceClientProtobuf implements CacheServiceClient {
    private readonly rpc: Rpc;
    constructor(rpc: Rpc) {
      this.rpc = rpc;
      this.CreateCacheEntry.bind(this);
      this.FinalizeCacheEntryUpload.bind(this);
      this.GetCacheEntryDownloadURL.bind(this);
    }
    CreateCacheEntry(
      request: CreateCacheEntryRequest
    ): Promise<CreateCacheEntryResponse> {
      const data = CreateCacheEntryRequest.toBinary(request);
      const promise = this.rpc.request(
        "github.actions.results.api.v1.CacheService",
        "CreateCacheEntry",
        "application/protobuf",
        data
      );
      return promise.then((data) =>
        CreateCacheEntryResponse.fromBinary(data as Uint8Array)
      );
    }
  
    FinalizeCacheEntryUpload(
      request: FinalizeCacheEntryUploadRequest
    ): Promise<FinalizeCacheEntryUploadResponse> {
      const data = FinalizeCacheEntryUploadRequest.toBinary(request);
      const promise = this.rpc.request(
        "github.actions.results.api.v1.CacheService",
        "FinalizeCacheEntryUpload",
        "application/protobuf",
        data
      );
      return promise.then((data) =>
        FinalizeCacheEntryUploadResponse.fromBinary(data as Uint8Array)
      );
    }
  
    GetCacheEntryDownloadURL(
      request: GetCacheEntryDownloadURLRequest
    ): Promise<GetCacheEntryDownloadURLResponse> {
      const data = GetCacheEntryDownloadURLRequest.toBinary(request);
      const promise = this.rpc.request(
        "github.actions.results.api.v1.CacheService",
        "GetCacheEntryDownloadURL",
        "application/protobuf",
        data
      );
      return promise.then((data) =>
        GetCacheEntryDownloadURLResponse.fromBinary(data as Uint8Array)
      );
    }
  }
  