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
  CreateCacheEntryRequest,
  CreateCacheEntryResponse,
  FinalizeCacheEntryUploadRequest,
  FinalizeCacheEntryUploadResponse,
  GetCacheEntryDownloadURLRequest,
  GetCacheEntryDownloadURLResponse,
  DeleteCacheEntryRequest,
  DeleteCacheEntryResponse,
  ListCacheEntriesRequest,
  ListCacheEntriesResponse,
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
  DeleteCacheEntry(
    request: DeleteCacheEntryRequest
  ): Promise<DeleteCacheEntryResponse>;
  ListCacheEntries(
    request: ListCacheEntriesRequest
  ): Promise<ListCacheEntriesResponse>;
}

export class CacheServiceClientJSON implements CacheServiceClient {
  private readonly rpc: Rpc;
  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.CreateCacheEntry.bind(this);
    this.FinalizeCacheEntryUpload.bind(this);
    this.GetCacheEntryDownloadURL.bind(this);
    this.DeleteCacheEntry.bind(this);
    this.ListCacheEntries.bind(this);
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

  DeleteCacheEntry(
    request: DeleteCacheEntryRequest
  ): Promise<DeleteCacheEntryResponse> {
    const data = DeleteCacheEntryRequest.toJson(request, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    });
    const promise = this.rpc.request(
      "github.actions.results.api.v1.CacheService",
      "DeleteCacheEntry",
      "application/json",
      data as object
    );
    return promise.then((data) =>
      DeleteCacheEntryResponse.fromJson(data as any, {
        ignoreUnknownFields: true,
      })
    );
  }

  ListCacheEntries(
    request: ListCacheEntriesRequest
  ): Promise<ListCacheEntriesResponse> {
    const data = ListCacheEntriesRequest.toJson(request, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    });
    const promise = this.rpc.request(
      "github.actions.results.api.v1.CacheService",
      "ListCacheEntries",
      "application/json",
      data as object
    );
    return promise.then((data) =>
      ListCacheEntriesResponse.fromJson(data as any, {
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
    this.DeleteCacheEntry.bind(this);
    this.ListCacheEntries.bind(this);
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

  DeleteCacheEntry(
    request: DeleteCacheEntryRequest
  ): Promise<DeleteCacheEntryResponse> {
    const data = DeleteCacheEntryRequest.toBinary(request);
    const promise = this.rpc.request(
      "github.actions.results.api.v1.CacheService",
      "DeleteCacheEntry",
      "application/protobuf",
      data
    );
    return promise.then((data) =>
      DeleteCacheEntryResponse.fromBinary(data as Uint8Array)
    );
  }

  ListCacheEntries(
    request: ListCacheEntriesRequest
  ): Promise<ListCacheEntriesResponse> {
    const data = ListCacheEntriesRequest.toBinary(request);
    const promise = this.rpc.request(
      "github.actions.results.api.v1.CacheService",
      "ListCacheEntries",
      "application/protobuf",
      data
    );
    return promise.then((data) =>
      ListCacheEntriesResponse.fromBinary(data as Uint8Array)
    );
  }
}

//==================================//
//          Server Code             //
//==================================//

export interface CacheServiceTwirp<T extends TwirpContext = TwirpContext> {
  CreateCacheEntry(
    ctx: T,
    request: CreateCacheEntryRequest
  ): Promise<CreateCacheEntryResponse>;
  FinalizeCacheEntryUpload(
    ctx: T,
    request: FinalizeCacheEntryUploadRequest
  ): Promise<FinalizeCacheEntryUploadResponse>;
  GetCacheEntryDownloadURL(
    ctx: T,
    request: GetCacheEntryDownloadURLRequest
  ): Promise<GetCacheEntryDownloadURLResponse>;
  DeleteCacheEntry(
    ctx: T,
    request: DeleteCacheEntryRequest
  ): Promise<DeleteCacheEntryResponse>;
  ListCacheEntries(
    ctx: T,
    request: ListCacheEntriesRequest
  ): Promise<ListCacheEntriesResponse>;
}

export enum CacheServiceMethod {
  CreateCacheEntry = "CreateCacheEntry",
  FinalizeCacheEntryUpload = "FinalizeCacheEntryUpload",
  GetCacheEntryDownloadURL = "GetCacheEntryDownloadURL",
  DeleteCacheEntry = "DeleteCacheEntry",
  ListCacheEntries = "ListCacheEntries",
}

export const CacheServiceMethodList = [
  CacheServiceMethod.CreateCacheEntry,
  CacheServiceMethod.FinalizeCacheEntryUpload,
  CacheServiceMethod.GetCacheEntryDownloadURL,
  CacheServiceMethod.DeleteCacheEntry,
  CacheServiceMethod.ListCacheEntries,
];

export function createCacheServiceServer<T extends TwirpContext = TwirpContext>(
  service: CacheServiceTwirp<T>
) {
  return new TwirpServer<CacheServiceTwirp, T>({
    service,
    packageName: "github.actions.results.api.v1",
    serviceName: "CacheService",
    methodList: CacheServiceMethodList,
    matchRoute: matchCacheServiceRoute,
  });
}

function matchCacheServiceRoute<T extends TwirpContext = TwirpContext>(
  method: string,
  events: RouterEvents<T>
) {
  switch (method) {
    case "CreateCacheEntry":
      return async (
        ctx: T,
        service: CacheServiceTwirp,
        data: Buffer,
        interceptors?: Interceptor<
          T,
          CreateCacheEntryRequest,
          CreateCacheEntryResponse
        >[]
      ) => {
        ctx = { ...ctx, methodName: "CreateCacheEntry" };
        await events.onMatch(ctx);
        return handleCacheServiceCreateCacheEntryRequest(
          ctx,
          service,
          data,
          interceptors
        );
      };
    case "FinalizeCacheEntryUpload":
      return async (
        ctx: T,
        service: CacheServiceTwirp,
        data: Buffer,
        interceptors?: Interceptor<
          T,
          FinalizeCacheEntryUploadRequest,
          FinalizeCacheEntryUploadResponse
        >[]
      ) => {
        ctx = { ...ctx, methodName: "FinalizeCacheEntryUpload" };
        await events.onMatch(ctx);
        return handleCacheServiceFinalizeCacheEntryUploadRequest(
          ctx,
          service,
          data,
          interceptors
        );
      };
    case "GetCacheEntryDownloadURL":
      return async (
        ctx: T,
        service: CacheServiceTwirp,
        data: Buffer,
        interceptors?: Interceptor<
          T,
          GetCacheEntryDownloadURLRequest,
          GetCacheEntryDownloadURLResponse
        >[]
      ) => {
        ctx = { ...ctx, methodName: "GetCacheEntryDownloadURL" };
        await events.onMatch(ctx);
        return handleCacheServiceGetCacheEntryDownloadURLRequest(
          ctx,
          service,
          data,
          interceptors
        );
      };
    case "DeleteCacheEntry":
      return async (
        ctx: T,
        service: CacheServiceTwirp,
        data: Buffer,
        interceptors?: Interceptor<
          T,
          DeleteCacheEntryRequest,
          DeleteCacheEntryResponse
        >[]
      ) => {
        ctx = { ...ctx, methodName: "DeleteCacheEntry" };
        await events.onMatch(ctx);
        return handleCacheServiceDeleteCacheEntryRequest(
          ctx,
          service,
          data,
          interceptors
        );
      };
    case "ListCacheEntries":
      return async (
        ctx: T,
        service: CacheServiceTwirp,
        data: Buffer,
        interceptors?: Interceptor<
          T,
          ListCacheEntriesRequest,
          ListCacheEntriesResponse
        >[]
      ) => {
        ctx = { ...ctx, methodName: "ListCacheEntries" };
        await events.onMatch(ctx);
        return handleCacheServiceListCacheEntriesRequest(
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

function handleCacheServiceCreateCacheEntryRequest<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: CacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    CreateCacheEntryRequest,
    CreateCacheEntryResponse
  >[]
): Promise<string | Uint8Array> {
  switch (ctx.contentType) {
    case TwirpContentType.JSON:
      return handleCacheServiceCreateCacheEntryJSON<T>(
        ctx,
        service,
        data,
        interceptors
      );
    case TwirpContentType.Protobuf:
      return handleCacheServiceCreateCacheEntryProtobuf<T>(
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

function handleCacheServiceFinalizeCacheEntryUploadRequest<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: CacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    FinalizeCacheEntryUploadRequest,
    FinalizeCacheEntryUploadResponse
  >[]
): Promise<string | Uint8Array> {
  switch (ctx.contentType) {
    case TwirpContentType.JSON:
      return handleCacheServiceFinalizeCacheEntryUploadJSON<T>(
        ctx,
        service,
        data,
        interceptors
      );
    case TwirpContentType.Protobuf:
      return handleCacheServiceFinalizeCacheEntryUploadProtobuf<T>(
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

function handleCacheServiceGetCacheEntryDownloadURLRequest<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: CacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    GetCacheEntryDownloadURLRequest,
    GetCacheEntryDownloadURLResponse
  >[]
): Promise<string | Uint8Array> {
  switch (ctx.contentType) {
    case TwirpContentType.JSON:
      return handleCacheServiceGetCacheEntryDownloadURLJSON<T>(
        ctx,
        service,
        data,
        interceptors
      );
    case TwirpContentType.Protobuf:
      return handleCacheServiceGetCacheEntryDownloadURLProtobuf<T>(
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

function handleCacheServiceDeleteCacheEntryRequest<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: CacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    DeleteCacheEntryRequest,
    DeleteCacheEntryResponse
  >[]
): Promise<string | Uint8Array> {
  switch (ctx.contentType) {
    case TwirpContentType.JSON:
      return handleCacheServiceDeleteCacheEntryJSON<T>(
        ctx,
        service,
        data,
        interceptors
      );
    case TwirpContentType.Protobuf:
      return handleCacheServiceDeleteCacheEntryProtobuf<T>(
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

function handleCacheServiceListCacheEntriesRequest<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: CacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    ListCacheEntriesRequest,
    ListCacheEntriesResponse
  >[]
): Promise<string | Uint8Array> {
  switch (ctx.contentType) {
    case TwirpContentType.JSON:
      return handleCacheServiceListCacheEntriesJSON<T>(
        ctx,
        service,
        data,
        interceptors
      );
    case TwirpContentType.Protobuf:
      return handleCacheServiceListCacheEntriesProtobuf<T>(
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
async function handleCacheServiceCreateCacheEntryJSON<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: CacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    CreateCacheEntryRequest,
    CreateCacheEntryResponse
  >[]
) {
  let request: CreateCacheEntryRequest;
  let response: CreateCacheEntryResponse;

  try {
    const body = JSON.parse(data.toString() || "{}");
    request = CreateCacheEntryRequest.fromJson(body, {
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
      CreateCacheEntryRequest,
      CreateCacheEntryResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.CreateCacheEntry(ctx, inputReq);
    });
  } else {
    response = await service.CreateCacheEntry(ctx, request!);
  }

  return JSON.stringify(
    CreateCacheEntryResponse.toJson(response, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    }) as string
  );
}

async function handleCacheServiceFinalizeCacheEntryUploadJSON<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: CacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    FinalizeCacheEntryUploadRequest,
    FinalizeCacheEntryUploadResponse
  >[]
) {
  let request: FinalizeCacheEntryUploadRequest;
  let response: FinalizeCacheEntryUploadResponse;

  try {
    const body = JSON.parse(data.toString() || "{}");
    request = FinalizeCacheEntryUploadRequest.fromJson(body, {
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
      FinalizeCacheEntryUploadRequest,
      FinalizeCacheEntryUploadResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.FinalizeCacheEntryUpload(ctx, inputReq);
    });
  } else {
    response = await service.FinalizeCacheEntryUpload(ctx, request!);
  }

  return JSON.stringify(
    FinalizeCacheEntryUploadResponse.toJson(response, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    }) as string
  );
}

async function handleCacheServiceGetCacheEntryDownloadURLJSON<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: CacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    GetCacheEntryDownloadURLRequest,
    GetCacheEntryDownloadURLResponse
  >[]
) {
  let request: GetCacheEntryDownloadURLRequest;
  let response: GetCacheEntryDownloadURLResponse;

  try {
    const body = JSON.parse(data.toString() || "{}");
    request = GetCacheEntryDownloadURLRequest.fromJson(body, {
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
      GetCacheEntryDownloadURLRequest,
      GetCacheEntryDownloadURLResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.GetCacheEntryDownloadURL(ctx, inputReq);
    });
  } else {
    response = await service.GetCacheEntryDownloadURL(ctx, request!);
  }

  return JSON.stringify(
    GetCacheEntryDownloadURLResponse.toJson(response, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    }) as string
  );
}

async function handleCacheServiceDeleteCacheEntryJSON<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: CacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    DeleteCacheEntryRequest,
    DeleteCacheEntryResponse
  >[]
) {
  let request: DeleteCacheEntryRequest;
  let response: DeleteCacheEntryResponse;

  try {
    const body = JSON.parse(data.toString() || "{}");
    request = DeleteCacheEntryRequest.fromJson(body, {
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
      DeleteCacheEntryRequest,
      DeleteCacheEntryResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.DeleteCacheEntry(ctx, inputReq);
    });
  } else {
    response = await service.DeleteCacheEntry(ctx, request!);
  }

  return JSON.stringify(
    DeleteCacheEntryResponse.toJson(response, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    }) as string
  );
}

async function handleCacheServiceListCacheEntriesJSON<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: CacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    ListCacheEntriesRequest,
    ListCacheEntriesResponse
  >[]
) {
  let request: ListCacheEntriesRequest;
  let response: ListCacheEntriesResponse;

  try {
    const body = JSON.parse(data.toString() || "{}");
    request = ListCacheEntriesRequest.fromJson(body, {
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
      ListCacheEntriesRequest,
      ListCacheEntriesResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.ListCacheEntries(ctx, inputReq);
    });
  } else {
    response = await service.ListCacheEntries(ctx, request!);
  }

  return JSON.stringify(
    ListCacheEntriesResponse.toJson(response, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    }) as string
  );
}
async function handleCacheServiceCreateCacheEntryProtobuf<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: CacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    CreateCacheEntryRequest,
    CreateCacheEntryResponse
  >[]
) {
  let request: CreateCacheEntryRequest;
  let response: CreateCacheEntryResponse;

  try {
    request = CreateCacheEntryRequest.fromBinary(data);
  } catch (e) {
    if (e instanceof Error) {
      const msg = "the protobuf request could not be decoded";
      throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
    }
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      CreateCacheEntryRequest,
      CreateCacheEntryResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.CreateCacheEntry(ctx, inputReq);
    });
  } else {
    response = await service.CreateCacheEntry(ctx, request!);
  }

  return Buffer.from(CreateCacheEntryResponse.toBinary(response));
}

async function handleCacheServiceFinalizeCacheEntryUploadProtobuf<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: CacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    FinalizeCacheEntryUploadRequest,
    FinalizeCacheEntryUploadResponse
  >[]
) {
  let request: FinalizeCacheEntryUploadRequest;
  let response: FinalizeCacheEntryUploadResponse;

  try {
    request = FinalizeCacheEntryUploadRequest.fromBinary(data);
  } catch (e) {
    if (e instanceof Error) {
      const msg = "the protobuf request could not be decoded";
      throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
    }
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      FinalizeCacheEntryUploadRequest,
      FinalizeCacheEntryUploadResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.FinalizeCacheEntryUpload(ctx, inputReq);
    });
  } else {
    response = await service.FinalizeCacheEntryUpload(ctx, request!);
  }

  return Buffer.from(FinalizeCacheEntryUploadResponse.toBinary(response));
}

async function handleCacheServiceGetCacheEntryDownloadURLProtobuf<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: CacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    GetCacheEntryDownloadURLRequest,
    GetCacheEntryDownloadURLResponse
  >[]
) {
  let request: GetCacheEntryDownloadURLRequest;
  let response: GetCacheEntryDownloadURLResponse;

  try {
    request = GetCacheEntryDownloadURLRequest.fromBinary(data);
  } catch (e) {
    if (e instanceof Error) {
      const msg = "the protobuf request could not be decoded";
      throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
    }
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      GetCacheEntryDownloadURLRequest,
      GetCacheEntryDownloadURLResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.GetCacheEntryDownloadURL(ctx, inputReq);
    });
  } else {
    response = await service.GetCacheEntryDownloadURL(ctx, request!);
  }

  return Buffer.from(GetCacheEntryDownloadURLResponse.toBinary(response));
}

async function handleCacheServiceDeleteCacheEntryProtobuf<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: CacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    DeleteCacheEntryRequest,
    DeleteCacheEntryResponse
  >[]
) {
  let request: DeleteCacheEntryRequest;
  let response: DeleteCacheEntryResponse;

  try {
    request = DeleteCacheEntryRequest.fromBinary(data);
  } catch (e) {
    if (e instanceof Error) {
      const msg = "the protobuf request could not be decoded";
      throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
    }
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      DeleteCacheEntryRequest,
      DeleteCacheEntryResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.DeleteCacheEntry(ctx, inputReq);
    });
  } else {
    response = await service.DeleteCacheEntry(ctx, request!);
  }

  return Buffer.from(DeleteCacheEntryResponse.toBinary(response));
}

async function handleCacheServiceListCacheEntriesProtobuf<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: CacheServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    ListCacheEntriesRequest,
    ListCacheEntriesResponse
  >[]
) {
  let request: ListCacheEntriesRequest;
  let response: ListCacheEntriesResponse;

  try {
    request = ListCacheEntriesRequest.fromBinary(data);
  } catch (e) {
    if (e instanceof Error) {
      const msg = "the protobuf request could not be decoded";
      throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
    }
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      ListCacheEntriesRequest,
      ListCacheEntriesResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.ListCacheEntries(ctx, inputReq);
    });
  } else {
    response = await service.ListCacheEntries(ctx, request!);
  }

  return Buffer.from(ListCacheEntriesResponse.toBinary(response));
}
