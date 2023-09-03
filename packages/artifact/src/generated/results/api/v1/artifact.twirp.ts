import {
  TwirpContext,
  TwirpServer,
  RouterEvents,
  TwirpError,
  TwirpErrorCode,
  Interceptor,
  TwirpContentType,
  chainInterceptors
} from 'twirp-ts'
import {
  CreateArtifactRequest,
  CreateArtifactResponse,
  FinalizeArtifactRequest,
  FinalizeArtifactResponse
} from './artifact'

//==================================//
//          Client Code             //
//==================================//

interface Rpc {
  request(
    service: string,
    method: string,
    contentType: 'application/json' | 'application/protobuf',
    data: object | Uint8Array
  ): Promise<object | Uint8Array>
}

export interface ArtifactServiceClient {
  CreateArtifact(
    request: CreateArtifactRequest
  ): Promise<CreateArtifactResponse>
  FinalizeArtifact(
    request: FinalizeArtifactRequest
  ): Promise<FinalizeArtifactResponse>
}

export class ArtifactServiceClientJSON implements ArtifactServiceClient {
  private readonly rpc: Rpc
  constructor(rpc: Rpc) {
    this.rpc = rpc
    this.CreateArtifact.bind(this)
    this.FinalizeArtifact.bind(this)
  }
  CreateArtifact(
    request: CreateArtifactRequest
  ): Promise<CreateArtifactResponse> {
    const data = CreateArtifactRequest.toJson(request, {
      useProtoFieldName: true,
      emitDefaultValues: false
    })
    const promise = this.rpc.request(
      'github.actions.results.api.v1.ArtifactService',
      'CreateArtifact',
      'application/json',
      data as object
    )
    return promise.then(data =>
      CreateArtifactResponse.fromJson(data as any, {ignoreUnknownFields: true})
    )
  }

  FinalizeArtifact(
    request: FinalizeArtifactRequest
  ): Promise<FinalizeArtifactResponse> {
    const data = FinalizeArtifactRequest.toJson(request, {
      useProtoFieldName: true,
      emitDefaultValues: false
    })
    const promise = this.rpc.request(
      'github.actions.results.api.v1.ArtifactService',
      'FinalizeArtifact',
      'application/json',
      data as object
    )
    return promise.then(data =>
      FinalizeArtifactResponse.fromJson(data as any, {
        ignoreUnknownFields: true
      })
    )
  }
}

export class ArtifactServiceClientProtobuf implements ArtifactServiceClient {
  private readonly rpc: Rpc
  constructor(rpc: Rpc) {
    this.rpc = rpc
    this.CreateArtifact.bind(this)
    this.FinalizeArtifact.bind(this)
  }
  CreateArtifact(
    request: CreateArtifactRequest
  ): Promise<CreateArtifactResponse> {
    const data = CreateArtifactRequest.toBinary(request)
    const promise = this.rpc.request(
      'github.actions.results.api.v1.ArtifactService',
      'CreateArtifact',
      'application/protobuf',
      data
    )
    return promise.then(data =>
      CreateArtifactResponse.fromBinary(data as Uint8Array)
    )
  }

  FinalizeArtifact(
    request: FinalizeArtifactRequest
  ): Promise<FinalizeArtifactResponse> {
    const data = FinalizeArtifactRequest.toBinary(request)
    const promise = this.rpc.request(
      'github.actions.results.api.v1.ArtifactService',
      'FinalizeArtifact',
      'application/protobuf',
      data
    )
    return promise.then(data =>
      FinalizeArtifactResponse.fromBinary(data as Uint8Array)
    )
  }
}

//==================================//
//          Server Code             //
//==================================//

export interface ArtifactServiceTwirp<T extends TwirpContext = TwirpContext> {
  CreateArtifact(
    ctx: T,
    request: CreateArtifactRequest
  ): Promise<CreateArtifactResponse>
  FinalizeArtifact(
    ctx: T,
    request: FinalizeArtifactRequest
  ): Promise<FinalizeArtifactResponse>
}

export enum ArtifactServiceMethod {
  CreateArtifact = 'CreateArtifact',
  FinalizeArtifact = 'FinalizeArtifact'
}

export const ArtifactServiceMethodList = [
  ArtifactServiceMethod.CreateArtifact,
  ArtifactServiceMethod.FinalizeArtifact
]

export function createArtifactServiceServer<
  T extends TwirpContext = TwirpContext
>(service: ArtifactServiceTwirp<T>) {
  return new TwirpServer<ArtifactServiceTwirp, T>({
    service,
    packageName: 'github.actions.results.api.v1',
    serviceName: 'ArtifactService',
    methodList: ArtifactServiceMethodList,
    matchRoute: matchArtifactServiceRoute
  })
}

function matchArtifactServiceRoute<T extends TwirpContext = TwirpContext>(
  method: string,
  events: RouterEvents<T>
) {
  switch (method) {
    case 'CreateArtifact':
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
        ctx = {...ctx, methodName: 'CreateArtifact'}
        await events.onMatch(ctx)
        return handleArtifactServiceCreateArtifactRequest(
          ctx,
          service,
          data,
          interceptors
        )
      }
    case 'FinalizeArtifact':
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
        ctx = {...ctx, methodName: 'FinalizeArtifact'}
        await events.onMatch(ctx)
        return handleArtifactServiceFinalizeArtifactRequest(
          ctx,
          service,
          data,
          interceptors
        )
      }
    default:
      events.onNotFound()
      const msg = `no handler found`
      throw new TwirpError(TwirpErrorCode.BadRoute, msg)
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
      )
    case TwirpContentType.Protobuf:
      return handleArtifactServiceCreateArtifactProtobuf<T>(
        ctx,
        service,
        data,
        interceptors
      )
    default:
      const msg = 'unexpected Content-Type'
      throw new TwirpError(TwirpErrorCode.BadRoute, msg)
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
      )
    case TwirpContentType.Protobuf:
      return handleArtifactServiceFinalizeArtifactProtobuf<T>(
        ctx,
        service,
        data,
        interceptors
      )
    default:
      const msg = 'unexpected Content-Type'
      throw new TwirpError(TwirpErrorCode.BadRoute, msg)
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
  let request: CreateArtifactRequest
  let response: CreateArtifactResponse

  try {
    const body = JSON.parse(data.toString() || '{}')
    request = CreateArtifactRequest.fromJson(body, {ignoreUnknownFields: true})
  } catch (e: any) {
    if (e instanceof Error) {
      const msg = 'the json request could not be decoded'
      throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true)
    }
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      CreateArtifactRequest,
      CreateArtifactResponse
    >
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.CreateArtifact(ctx, inputReq)
    })
  } else {
    response = await service.CreateArtifact(ctx, request!)
  }

  return JSON.stringify(
    CreateArtifactResponse.toJson(response, {
      useProtoFieldName: true,
      emitDefaultValues: false
    }) as string
  )
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
  let request: FinalizeArtifactRequest
  let response: FinalizeArtifactResponse

  try {
    const body = JSON.parse(data.toString() || '{}')
    request = FinalizeArtifactRequest.fromJson(body, {
      ignoreUnknownFields: true
    })
  } catch (e: any) {
    if (e instanceof Error) {
      const msg = 'the json request could not be decoded'
      throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true)
    }
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      FinalizeArtifactRequest,
      FinalizeArtifactResponse
    >
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.FinalizeArtifact(ctx, inputReq)
    })
  } else {
    response = await service.FinalizeArtifact(ctx, request!)
  }

  return JSON.stringify(
    FinalizeArtifactResponse.toJson(response, {
      useProtoFieldName: true,
      emitDefaultValues: false
    }) as string
  )
}
async function handleArtifactServiceCreateArtifactProtobuf<
  T extends TwirpContext = TwirpContext
>(
  ctx: T,
  service: ArtifactServiceTwirp,
  data: Buffer,
  interceptors?: Interceptor<T, CreateArtifactRequest, CreateArtifactResponse>[]
) {
  let request: CreateArtifactRequest
  let response: CreateArtifactResponse

  try {
    request = CreateArtifactRequest.fromBinary(data)
  } catch (e: any) {
    if (e instanceof Error) {
      const msg = 'the protobuf request could not be decoded'
      throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true)
    }
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      CreateArtifactRequest,
      CreateArtifactResponse
    >
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.CreateArtifact(ctx, inputReq)
    })
  } else {
    response = await service.CreateArtifact(ctx, request!)
  }

  return Buffer.from(CreateArtifactResponse.toBinary(response))
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
  let request: FinalizeArtifactRequest
  let response: FinalizeArtifactResponse

  try {
    request = FinalizeArtifactRequest.fromBinary(data)
  } catch (e: any) {
    if (e instanceof Error) {
      const msg = 'the protobuf request could not be decoded'
      throw new TwirpError(TwirpErrorCode.Malformed, msg).withCause(e, true)
    }
  }

  if (interceptors && interceptors.length > 0) {
    const interceptor = chainInterceptors(...interceptors) as Interceptor<
      T,
      FinalizeArtifactRequest,
      FinalizeArtifactResponse
    >
    response = await interceptor(ctx, request!, (ctx, inputReq) => {
      return service.FinalizeArtifact(ctx, inputReq)
    })
  } else {
    response = await service.FinalizeArtifact(ctx, request!)
  }

  return Buffer.from(FinalizeArtifactResponse.toBinary(response))
}
