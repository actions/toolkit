import {
  CreateArtifactRequest,
  CreateArtifactResponse,
  FinalizeArtifactRequest,
  FinalizeArtifactResponse,
  ListArtifactsRequest,
  ListArtifactsResponse,
  GetSignedArtifactURLRequest,
  GetSignedArtifactURLResponse,
  DeleteArtifactRequest,
  DeleteArtifactResponse,
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
  DeleteArtifact(
    request: DeleteArtifactRequest
  ): Promise<DeleteArtifactResponse>;
}

export class ArtifactServiceClientJSON implements ArtifactServiceClient {
  private readonly rpc: Rpc;
  constructor(rpc: Rpc) {
    this.rpc = rpc;
    this.CreateArtifact.bind(this);
    this.FinalizeArtifact.bind(this);
    this.ListArtifacts.bind(this);
    this.GetSignedArtifactURL.bind(this);
    this.DeleteArtifact.bind(this);
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

  DeleteArtifact(
    request: DeleteArtifactRequest
  ): Promise<DeleteArtifactResponse> {
    const data = DeleteArtifactRequest.toJson(request, {
      useProtoFieldName: true,
      emitDefaultValues: false,
    });
    const promise = this.rpc.request(
      "github.actions.results.api.v1.ArtifactService",
      "DeleteArtifact",
      "application/json",
      data as object
    );
    return promise.then((data) =>
      DeleteArtifactResponse.fromJson(data as any, {
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
    this.DeleteArtifact.bind(this);
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

  DeleteArtifact(
    request: DeleteArtifactRequest
  ): Promise<DeleteArtifactResponse> {
    const data = DeleteArtifactRequest.toBinary(request);
    const promise = this.rpc.request(
      "github.actions.results.api.v1.ArtifactService",
      "DeleteArtifact",
      "application/protobuf",
      data
    );
    return promise.then((data) =>
      DeleteArtifactResponse.fromBinary(data as Uint8Array)
    );
  }
}
