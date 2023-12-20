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
  CreateArtifactRequest,
  CreateArtifactResponse,
  FinalizeArtifactRequest,
  FinalizeArtifactResponse,
  ListArtifactsRequest,
  ListArtifactsResponse,
  GetSignedArtifactURLRequest,
  GetSignedArtifactURLResponse,
} from "./artifact";

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

export interface ArtifactServiceClient {
  CreateArtifact(
    request: CreateArtifactRequest
  ): Promise<CreateArtifactResponse>;
  FinalizeArtifact(
    request: FinalizeArtifactRequest
  ): Promise<FinalizeArtifactResponse>;
  ListArtifacts(request: ListArtifactsRequest): Promise<ListArtifactsResponse>;
  GetSignedArtifactURL(
    request: GetSignedArtifactURLRequest
  ): Promise<GetSignedArtifactURLResponse>;
}

export class ArtifactServiceClientJSON implements ArtifactServiceClient {
  private readonly rpc: Rpc;
  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.CreateArtifact.bind(this);
    this.FinalizeArtifact.bind(this);
    this.ListArtifacts.bind(this);
    this.GetSignedArtifactURL.bind(this);
  }
  CreateArtifact(
    request: CreateArtifactRequest
  ): Promise<CreateArtifactResponse> {
    const data = CreateArtifactRequest.toJson(request, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    });
    const promise = this.rpc.request(
      "github.actions.results.api.v1.ArtifactService",
      "CreateArtifact",
      "application/json",
      data as object
    );
    return promise.then((data) =>
      CreateArtifactResponse.fromJson(data as any, {
        ignoreUnknownFields: true,
      })
    );
  }

  FinalizeArtifact(
    request: FinalizeArtifactRequest
  ): Promise<FinalizeArtifactResponse> {
    const data = FinalizeArtifactRequest.toJson(request, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    });
    const promise = this.rpc.request(
      "github.actions.results.api.v1.ArtifactService",
      "FinalizeArtifact",
      "application/json",
      data as object
    );
    return promise.then((data) =>
      FinalizeArtifactResponse.fromJson(data as any, {
        ignoreUnknownFields: true,
      })
    );
  }

  ListArtifacts(request: ListArtifactsRequest): Promise<ListArtifactsResponse> {
    const data = ListArtifactsRequest.toJson(request, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    });
    const promise = this.rpc.request(
      "github.actions.results.api.v1.ArtifactService",
      "ListArtifacts",
      "application/json",
      data as object
    );
    return promise.then((data) =>
      ListArtifactsResponse.fromJson(data as any, { ignoreUnknownFields: true })
    );
  }

  GetSignedArtifactURL(
    request: GetSignedArtifactURLRequest
  ): Promise<GetSignedArtifactURLResponse> {
    const data = GetSignedArtifactURLRequest.toJson(request, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    });
    const promise = this.rpc.request(
      "github.actions.results.api.v1.ArtifactService",
      "GetSignedArtifactURL",
      "application/json",
      data as object
    );
    return promise.then((data) =>
      GetSignedArtifactURLResponse.fromJson(data as any, {
        ignoreUnknownFields: true,
      })
    );
  }
}

export class ArtifactServiceClientProtobuf implements ArtifactServiceClient {
  private readonly rpc: Rpc;
  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.CreateArtifact.bind(this);
    this.FinalizeArtifact.bind(this);
    this.ListArtifacts.bind(this);
    this.GetSignedArtifactURL.bind(this);
  }
  CreateArtifact(
    request: CreateArtifactRequest
  ): Promise<CreateArtifactResponse> {
    const data = CreateArtifactRequest.toBinary(request);
    const promise = this.rpc.request(
      "github.actions.results.api.v1.ArtifactService",
      "CreateArtifact",
      "application/protobuf",
      data
    );
    return promise.then((data) =>
      CreateArtifactResponse.fromBinary(data as Uint8Array)
    );
  }

  FinalizeArtifact(
    request: FinalizeArtifactRequest
  ): Promise<FinalizeArtifactResponse> {
    const data = FinalizeArtifactRequest.toBinary(request);
    const promise = this.rpc.request(
      "github.actions.results.api.v1.ArtifactService",
      "FinalizeArtifact",
      "application/protobuf",
      data
    );
    return promise.then((data) =>
      FinalizeArtifactResponse.fromBinary(data as Uint8Array)
    );
  }

  ListArtifacts(request: ListArtifactsRequest): Promise<ListArtifactsResponse> {
    const data = ListArtifactsRequest.toBinary(request);
    const promise = this.rpc.request(
      "github.actions.results.api.v1.ArtifactService",
      "ListArtifacts",
      "application/protobuf",
      data
    );
    return promise.then((data) =>
      ListArtifactsResponse.fromBinary(data as Uint8Array)
    );
  }

  GetSignedArtifactURL(
    request: GetSignedArtifactURLRequest
  ): Promise<GetSignedArtifactURLResponse> {
    const data = GetSignedArtifactURLRequest.toBinary(request);
    const promise = this.rpc.request(
      "github.actions.results.api.v1.ArtifactService",
      "GetSignedArtifactURL",
      "application/protobuf",
      data
    );
    return promise.then((data) =>
      GetSignedArtifactURLResponse.fromBinary(data as Uint8Array)
    );
  }
}

//==================================//
//          Server Code             //
//==================================//

export interface ArtifactServiceTwirp<T extends TwirpContext = TwirpContext> {
  CreateArtifact(
    ctx: T,
    request: CreateArtifactRequest
  ): Promise<CreateArtifactResponse>;
  FinalizeArtifact(
    ctx: T,
    request: FinalizeArtifactRequest
  ): Promise<FinalizeArtifactResponse>;
  ListArtifacts(
    ctx: T,
    request: ListArtifactsRequest
  ): Promise<ListArtifactsResponse>;
  GetSignedArtifactURL(
    ctx: T,
    request: GetSignedArtifactURLRequest
  ): Promise<GetSignedArtifactURLResponse>;
}

export enum ArtifactServiceMethod {
  CreateArtifact = "CreateArtifact",
  FinalizeArtifact = "FinalizeArtifact",
  ListArtifacts = "ListArtifacts",
  GetSignedArtifactURL = "GetSignedArtifactURL",
}

export const ArtifactServiceMethodList = [
  ArtifactServiceMethod.CreateArtifact,
  ArtifactServiceMethod.FinalizeArtifact,
  ArtifactServiceMethod.ListArtifacts,
  ArtifactServiceMethod.GetSignedArtifactURL,
];

export function createArtifactServiceServer<
  T extends TwirpContext = TwirpContext
>(service: ArtifactServiceTwirp<T>) {
  return new TwirpServer<ArtifactServiceTwirp, T>({
    service,
    packageName: "github.actions.results.api.v1",
    serviceName: "ArtifactService",
    methodList: ArtifactServiceMethodList,
    matchRoute: matchArtifactServiceRoute,
  });
}

function matchArtifactServiceRoute<T extends TwirpContext = TwirpContext>(
  method: string,
  events: RouterEvents<T>
) {
  switch (method) {
    case "CreateArtifact":
      return async (
        ctx: T,
        service: ArtifactServiceTwirp,
        data: Buffer,
        interceptors?: Interceptor<
          T,
          CreateArtifactRequest,
          CreateArtifactResponse
        >[]
      ) => {
        ctx = { ...ctx, methodName: "CreateArtifact" };
        await events.onMatch(ctx);
        return handleArtifactServiceCreateArtifactRequest(
          ctx,
          service,
          data,
          interceptors
        );
      };
    case "FinalizeArtifact":
      return async (
        ctx: T,
        service: ArtifactServiceTwirp,
        data: Buffer,
        interceptors?: Interceptor<
          T,
          FinalizeArtifactRequest,
          FinalizeArtifactResponse
        >[]
      ) => {
        ctx = { ...ctx, methodName: "FinalizeArtifact" };
        await events.onMatch(ctx);
        return handleArtifactServiceFinalizeArtifactRequest(
          ctx,
          service,
          data,
          interceptors
        );
      };
    case "ListArtifacts":
      return async (
        ctx: T,
        service: ArtifactServiceTwirp,
        data: Buffer,
        interceptors?: Interceptor<
          T,
          ListArtifactsRequest,
          ListArtifactsResponse
        >[]
      ) => {
        ctx = { ...ctx, methodName: "ListArtifacts" };
        await events.onMatch(ctx);
        return handleArtifactServiceListArtifactsRequest(
          ctx,
          service,
          data,
          interceptors
        );
      };
    case "GetSignedArtifactURL":
      return async (
        ctx: T,
        service: ArtifactServiceTwirp,
        data: Buffer,
        interceptors?: Interceptor<
          T,
          GetSignedArtifactURLRequest,
          GetSignedArtifactURLResponse
        >[]
      ) => {
        ctx = { ...ctx, methodName: "GetSignedArtifactURL" };
        await events.onMatch(ctx);
        return handleArtifactServiceGetSignedArtifactURLRequest(
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

function handleArtifactServiceCreateArtifactRequest<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: ArtifactServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<T, CreateArtifactRequest, CreateArtifactResponse>[]
): Promise<string | Uint8Array> {
  switch (ctx.contentType) {
    case TwirpContentType.JSON:
      return handleArtifactServiceCreateArtifactJSON<T>(
        ctx,
        service,
        data,
        interceptors
      );
    case TwirpContentType.Protobuf:
      return handleArtifactServiceCreateArtifactProtobuf<T>(
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

function handleArtifactServiceFinalizeArtifactRequest<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: ArtifactServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    FinalizeArtifactRequest,
    FinalizeArtifactResponse
  >[]
): Promise<string | Uint8Array> {
  switch (ctx.contentType) {
    case TwirpContentType.JSON:
      return handleArtifactServiceFinalizeArtifactJSON<T>(
        ctx,
        service,
        data,
        interceptors
      );
    case TwirpContentType.Protobuf:
      return handleArtifactServiceFinalizeArtifactProtobuf<T>(
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

function handleArtifactServiceListArtifactsRequest<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: ArtifactServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<T, ListArtifactsRequest, ListArtifactsResponse>[]
): Promise<string | Uint8Array> {
  switch (ctx.contentType) {
    case TwirpContentType.JSON:
      return handleArtifactServiceListArtifactsJSON<T>(
        ctx,
        service,
        data,
        interceptors
      );
    case TwirpContentType.Protobuf:
      return handleArtifactServiceListArtifactsProtobuf<T>(
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

function handleArtifactServiceGetSignedArtifactURLRequest<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: ArtifactServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    GetSignedArtifactURLRequest,
    GetSignedArtifactURLResponse
  >[]
): Promise<string | Uint8Array> {
  switch (ctx.contentType) {
    case TwirpContentType.JSON:
      return handleArtifactServiceGetSignedArtifactURLJSON<T>(
        ctx,
        service,
        data,
        interceptors
      );
    case TwirpContentType.Protobuf:
      return handleArtifactServiceGetSignedArtifactURLProtobuf<T>(
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
async function handleArtifactServiceCreateArtifactJSON<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: ArtifactServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<T, CreateArtifactRequest, CreateArtifactResponse>[]
) {
  let request: CreateArtifactRequest;
  let response: CreateArtifactResponse;

  try {
    const body = JSON.parse(data.toString() || "{}");
    request = CreateArtifactRequest.fromJson(body, {
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
      CreateArtifactRequest,
      CreateArtifactResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.CreateArtifact(ctx, inputReq);
    });
  } else {
    response = await service.CreateArtifact(ctx, request!);
  }

  return JSON.stringify(
    CreateArtifactResponse.toJson(response, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    }) as string
  );
}

async function handleArtifactServiceFinalizeArtifactJSON<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: ArtifactServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    FinalizeArtifactRequest,
    FinalizeArtifactResponse
  >[]
) {
  let request: FinalizeArtifactRequest;
  let response: FinalizeArtifactResponse;

  try {
    const body = JSON.parse(data.toString() || "{}");
    request = FinalizeArtifactRequest.fromJson(body, {
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
      FinalizeArtifactRequest,
      FinalizeArtifactResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.FinalizeArtifact(ctx, inputReq);
    });
  } else {
    response = await service.FinalizeArtifact(ctx, request!);
  }

  return JSON.stringify(
    FinalizeArtifactResponse.toJson(response, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    }) as string
  );
}

async function handleArtifactServiceListArtifactsJSON<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: ArtifactServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<T, ListArtifactsRequest, ListArtifactsResponse>[]
) {
  let request: ListArtifactsRequest;
  let response: ListArtifactsResponse;

  try {
    const body = JSON.parse(data.toString() || "{}");
    request = ListArtifactsRequest.fromJson(body, {
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
      ListArtifactsRequest,
      ListArtifactsResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.ListArtifacts(ctx, inputReq);
    });
  } else {
    response = await service.ListArtifacts(ctx, request!);
  }

  return JSON.stringify(
    ListArtifactsResponse.toJson(response, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    }) as string
  );
}

async function handleArtifactServiceGetSignedArtifactURLJSON<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: ArtifactServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    GetSignedArtifactURLRequest,
    GetSignedArtifactURLResponse
  >[]
) {
  let request: GetSignedArtifactURLRequest;
  let response: GetSignedArtifactURLResponse;

  try {
    const body = JSON.parse(data.toString() || "{}");
    request = GetSignedArtifactURLRequest.fromJson(body, {
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
      GetSignedArtifactURLRequest,
      GetSignedArtifactURLResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.GetSignedArtifactURL(ctx, inputReq);
    });
  } else {
    response = await service.GetSignedArtifactURL(ctx, request!);
  }

  return JSON.stringify(
    GetSignedArtifactURLResponse.toJson(response, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    }) as string
  );
}
async function handleArtifactServiceCreateArtifactProtobuf<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: ArtifactServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<T, CreateArtifactRequest, CreateArtifactResponse>[]
) {
  let request: CreateArtifactRequest;
  let response: CreateArtifactResponse;

  try {
    request = CreateArtifactRequest.fromBinary(data);
  } catch (e) {
    if (e instanceof Error) {
      const msg = "the protobuf request could not be decoded";
      throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
    }
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      CreateArtifactRequest,
      CreateArtifactResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.CreateArtifact(ctx, inputReq);
    });
  } else {
    response = await service.CreateArtifact(ctx, request!);
  }

  return Buffer.from(CreateArtifactResponse.toBinary(response));
}

async function handleArtifactServiceFinalizeArtifactProtobuf<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: ArtifactServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    FinalizeArtifactRequest,
    FinalizeArtifactResponse
  >[]
) {
  let request: FinalizeArtifactRequest;
  let response: FinalizeArtifactResponse;

  try {
    request = FinalizeArtifactRequest.fromBinary(data);
  } catch (e) {
    if (e instanceof Error) {
      const msg = "the protobuf request could not be decoded";
      throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
    }
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      FinalizeArtifactRequest,
      FinalizeArtifactResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.FinalizeArtifact(ctx, inputReq);
    });
  } else {
    response = await service.FinalizeArtifact(ctx, request!);
  }

  return Buffer.from(FinalizeArtifactResponse.toBinary(response));
}

async function handleArtifactServiceListArtifactsProtobuf<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: ArtifactServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<T, ListArtifactsRequest, ListArtifactsResponse>[]
) {
  let request: ListArtifactsRequest;
  let response: ListArtifactsResponse;

  try {
    request = ListArtifactsRequest.fromBinary(data);
  } catch (e) {
    if (e instanceof Error) {
      const msg = "the protobuf request could not be decoded";
      throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
    }
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      ListArtifactsRequest,
      ListArtifactsResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.ListArtifacts(ctx, inputReq);
    });
  } else {
    response = await service.ListArtifacts(ctx, request!);
  }

  return Buffer.from(ListArtifactsResponse.toBinary(response));
}

async function handleArtifactServiceGetSignedArtifactURLProtobuf<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: ArtifactServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<
    T,
    GetSignedArtifactURLRequest,
    GetSignedArtifactURLResponse
  >[]
) {
  let request: GetSignedArtifactURLRequest;
  let response: GetSignedArtifactURLResponse;

  try {
    request = GetSignedArtifactURLRequest.fromBinary(data);
  } catch (e) {
    if (e instanceof Error) {
      const msg = "the protobuf request could not be decoded";
      throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true);
    }
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      GetSignedArtifactURLRequest,
      GetSignedArtifactURLResponse
    >;
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.GetSignedArtifactURL(ctx, inputReq);
    });
  } else {
    response = await service.GetSignedArtifactURL(ctx, request!);
  }

  return Buffer.from(GetSignedArtifactURLResponse.toBinary(response));
}
