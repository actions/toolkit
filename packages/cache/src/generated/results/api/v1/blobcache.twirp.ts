import {
  TwirpContext,
  TwirpServer,
  RouterEvents,
  TwirpError,
  TwirpErrorCode,
  Interceptor,
  TwirpContentType,
  chainInterceptors,
} from "twirp-ts";
import {
  GetCachedBlobRequest,
  GetCachedBlobResponse,
  GetCacheBlobUploadURLRequest,
  GetCacheBlobUploadURLResponse,
} from "./blobcache";

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

export interface BlobCacheServiceClient {
  GetCachedBlob(request: GetCachedBlobRequest): Promise<GetCachedBlobResponse>;
  GetCacheBlobUploadURL(
    request: GetCacheBlobUploadURLRequest
  ): Promise<GetCacheBlobUploadURLResponse>;
}

export class BlobCacheServiceClientJSON implements BlobCacheServiceClient {
  private readonly rpc: Rpc;
  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.GetCachedBlob.bind(this);
    this.GetCacheBlobUploadURL.bind(this);
  }
  GetCachedBlob(request: GetCachedBlobRequest): Promise<GetCachedBlobResponse> {
    const data = GetCachedBlobRequest.toJson(request, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    });
    const promise = this.rpc.request(
      "github.actions.results.api.v1.BlobCacheService",
      "GetCachedBlob",
      "application/json",
      data as object
    );
    return promise.then((data) =>
      GetCachedBlobResponse.fromJson(data as any, { ignoreUnknownFields: true })
    );
  }

  GetCacheBlobUploadURL(
    request: GetCacheBlobUploadURLRequest
  ): Promise<GetCacheBlobUploadURLResponse> {
    const data = GetCacheBlobUploadURLRequest.toJson(request, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    });
    const promise = this.rpc.request(
      "github.actions.results.api.v1.BlobCacheService",
      "GetCacheBlobUploadURL",
      "application/json",
      data as object
    );
    return promise.then((data) =>
      GetCacheBlobUploadURLResponse.fromJson(data as any, {
        ignoreUnknownFields: true,
      })
    );
  }
}

export class BlobCacheServiceClientProtobuf implements BlobCacheServiceClient {
  private readonly rpc: Rpc;
  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.GetCachedBlob.bind(this);
    this.GetCacheBlobUploadURL.bind(this);
  }
  GetCachedBlob(request: GetCachedBlobRequest): Promise<GetCachedBlobResponse> {
    const data = GetCachedBlobRequest.toBinary(request);
    const promise = this.rpc.request(
      "github.actions.results.api.v1.BlobCacheService",
      "GetCachedBlob",
      "application/protobuf",
      data
    );
    return promise.then((data) =>
      GetCachedBlobResponse.fromBinary(data as Uint8Array)
    );
  }

  GetCacheBlobUploadURL(
    request: GetCacheBlobUploadURLRequest
  ): Promise<GetCacheBlobUploadURLResponse> {
    const data = GetCacheBlobUploadURLRequest.toBinary(request);
    const promise = this.rpc.request(
      "github.actions.results.api.v1.BlobCacheService",
      "GetCacheBlobUploadURL",
      "application/protobuf",
      data
    );
    return promise.then((data) =>
      GetCacheBlobUploadURLResponse.fromBinary(data as Uint8Array)
    );
  }
}

//==================================//
//          Server Code             //
//==================================//

export interface BlobCacheServiceTwirp<T extends TwirpContext = TwirpContext> {
  GetCachedBlob(
    ctx: T,
    request: GetCachedBlobRequest
  ): Promise<GetCachedBlobResponse>;
  GetCacheBlobUploadURL(
    ctx: T,
    request: GetCacheBlobUploadURLRequest
  ): Promise<GetCacheBlobUploadURLResponse>;
}

export enum BlobCacheServiceMethod {
  GetCachedBlob = "GetCachedBlob",
  GetCacheBlobUploadURL = "GetCacheBlobUploadURL",
}

export const BlobCacheServiceMethodList = [
  BlobCacheServiceMethod.GetCachedBlob,
  BlobCacheServiceMethod.GetCacheBlobUploadURL,
];

export function createBlobCacheServiceServer<
  T extends TwirpContext = TwirpContext
>(service: BlobCacheServiceTwirp<T>) {
  return new TwirpServer<BlobCacheServiceTwirp, T>({
    service,
    packageName: "github.actions.results.api.v1",
    serviceName: "BlobCacheService",
    methodList: BlobCacheServiceMethodList,
    matchRoute: matchBlobCacheServiceRoute,
  });
}

function matchBlobCacheServiceRoute<T extends TwirpContext = TwirpContext>(
  method: string,
  events: RouterEvents<T>
) {
  switch (method) {
    case "GetCachedBlob":
      return async (
        ctx: T,
        service: BlobCacheServiceTwirp,
        data: Buffer,
        interceptors?: Interceptor<
          T,
          GetCachedBlobRequest,
          GetCachedBlobResponse
        >[]
      ) => {
        ctx = { ...ctx, methodName: "GetCachedBlob" };
        await events.onMatch(ctx);
        return handleBlobCacheServiceGetCachedBlobRequest(
          ctx,
          service,
          data,
          interceptors
        );
      };
    case "GetCacheBlobUploadURL":
      return async (
        ctx: T,
        service: BlobCacheServiceTwirp,
        data: Buffer,
        interceptors?: Interceptor<
          T,
          GetCacheBlobUploadURLRequest,
          GetCacheBlobUploadURLResponse
        >[]
      ) => {
        ctx = { ...ctx, methodName: "GetCacheBlobUploadURL" };
        await events.onMatch(ctx);
        return handleBlobCacheServiceGetCacheBlobUploadURLRequest(
          ctx,
          service,
          data,
          interceptors
        );
      };
    default:
      events.onNotFound();
      const msg = `no handler found`;
      throw new TwirpError(TwirpErrorCode.BadRoute, msg);
  }
}

function handleBlobCacheServiceGetCachedBlobRequest<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: BlobCacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<T, GetCachedBlobRequest, GetCachedBlobResponse>[]
): Promise<string | Uint8Array> {
  switch (ctx.contentType) {
    case TwirpContentType.JSON:
      return handleBlobCacheServiceGetCachedBlobJSON<T>(
        ctx,
        service,
        data,
        interceptors
      );
    case TwirpContentType.Protobuf:
      return handleBlobCacheServiceGetCachedBlobProtobuf<T>(
        ctx,
        service,
        data,
        interceptors
      );
    default:
      const msg = "unexpected Content-Type";
      throw new TwirpError(TwirpErrorCode.BadRoute, msg);
  }
}

function handleBlobCacheServiceGetCacheBlobUploadURLRequest<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: BlobCacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    GetCacheBlobUploadURLRequest,
    GetCacheBlobUploadURLResponse
  >[]
): Promise<string | Uint8Array> {
  switch (ctx.contentType) {
    case TwirpContentType.JSON:
      return handleBlobCacheServiceGetCacheBlobUploadURLJSON<T>(
        ctx,
        service,
        data,
        interceptors
      );
    case TwirpContentType.Protobuf:
      return handleBlobCacheServiceGetCacheBlobUploadURLProtobuf<T>(
        ctx,
        service,
        data,
        interceptors
      );
    default:
      const msg = "unexpected Content-Type";
      throw new TwirpError(TwirpErrorCode.BadRoute, msg);
  }
}
async function handleBlobCacheServiceGetCachedBlobJSON<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: BlobCacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<T, GetCachedBlobRequest, GetCachedBlobResponse>[]
) {
  let request: GetCachedBlobRequest;
  let response: GetCachedBlobResponse;

  try {
    const body = JSON.parse(data.toString() || "{}");
    request = GetCachedBlobRequest.fromJson(body, {
      ignoreUnknownFields: true,
    });
  } catch (e) {
    if (e instanceof Error) {
      const msg = "the json request could not be decoded";
      throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
    }
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      GetCachedBlobRequest,
      GetCachedBlobResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.GetCachedBlob(ctx, inputReq);
    });
  } else {
    response = await service.GetCachedBlob(ctx, request!);
  }

  return JSON.stringify(
    GetCachedBlobResponse.toJson(response, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    }) as string
  );
}

async function handleBlobCacheServiceGetCacheBlobUploadURLJSON<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: BlobCacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    GetCacheBlobUploadURLRequest,
    GetCacheBlobUploadURLResponse
  >[]
) {
  let request: GetCacheBlobUploadURLRequest;
  let response: GetCacheBlobUploadURLResponse;

  try {
    const body = JSON.parse(data.toString() || "{}");
    request = GetCacheBlobUploadURLRequest.fromJson(body, {
      ignoreUnknownFields: true,
    });
  } catch (e) {
    if (e instanceof Error) {
      const msg = "the json request could not be decoded";
      throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
    }
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      GetCacheBlobUploadURLRequest,
      GetCacheBlobUploadURLResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.GetCacheBlobUploadURL(ctx, inputReq);
    });
  } else {
    response = await service.GetCacheBlobUploadURL(ctx, request!);
  }

  return JSON.stringify(
    GetCacheBlobUploadURLResponse.toJson(response, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    }) as string
  );
}
async function handleBlobCacheServiceGetCachedBlobProtobuf<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: BlobCacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<T, GetCachedBlobRequest, GetCachedBlobResponse>[]
) {
  let request: GetCachedBlobRequest;
  let response: GetCachedBlobResponse;

  try {
    request = GetCachedBlobRequest.fromBinary(data);
  } catch (e) {
    if (e instanceof Error) {
      const msg = "the protobuf request could not be decoded";
      throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
    }
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      GetCachedBlobRequest,
      GetCachedBlobResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.GetCachedBlob(ctx, inputReq);
    });
  } else {
    response = await service.GetCachedBlob(ctx, request!);
  }

  return Buffer.from(GetCachedBlobResponse.toBinary(response));
}

async function handleBlobCacheServiceGetCacheBlobUploadURLProtobuf<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: BlobCacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    GetCacheBlobUploadURLRequest,
    GetCacheBlobUploadURLResponse
  >[]
) {
  let request: GetCacheBlobUploadURLRequest;
  let response: GetCacheBlobUploadURLResponse;

  try {
    request = GetCacheBlobUploadURLRequest.fromBinary(data);
  } catch (e) {
    if (e instanceof Error) {
      const msg = "the protobuf request could not be decoded";
      throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
    }
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      GetCacheBlobUploadURLRequest,
      GetCacheBlobUploadURLResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.GetCacheBlobUploadURL(ctx, inputReq);
    });
  } else {
    response = await service.GetCacheBlobUploadURL(ctx, request!);
  }

  return Buffer.from(GetCacheBlobUploadURLResponse.toBinary(response));
}
