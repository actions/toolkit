import * as config from "../src/internal/shared/config"
import { createArtifactTwirpClient } from "../src/internal/shared/artifact-twirp-client"
import * as core from "@actions/core"

jest.mock("@actions/http-client")

describe("artifact-http-client", () => {
  beforeAll(() => {
    // mock all output so that there is less noise when running tests
    jest.spyOn(console, "log").mockImplementation(() => {})
    jest.spyOn(core, "debug").mockImplementation(() => {})
    jest.spyOn(core, "info").mockImplementation(() => {})
    jest.spyOn(core, "warning").mockImplementation(() => {})
    jest.spyOn(config, "getResultsServiceUrl").mockReturnValue("http://localhost:8080")
    jest.spyOn(config, "getRuntimeToken").mockReturnValue("token")
  })

  it("should successfully create a client", () => {
    const client = createArtifactTwirpClient("upload")
    expect(client).toBeDefined()
  })

  it("should make a request", async () => {
    const client = createArtifactTwirpClient("upload")
    const artifact = client.CreateArtifact(
      {
        workflowRunBackendId: "1234", 
        workflowJobRunBackendId: "5678", 
        name: "artifact", 
        version: 4
      }
    )
    expect(artifact).toBeDefined()
  })
})
