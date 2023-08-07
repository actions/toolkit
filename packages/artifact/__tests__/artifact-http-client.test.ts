import * as http from "http"
import * as net from "net"
import { HttpClient } from "@actions/http-client"
import * as config from "../src/internal/shared/config"
import { createArtifactTwirpClient } from "../src/internal/shared/artifact-twirp-client"
import * as core from "@actions/core"


const mockPost = jest.fn((statusCode: number, body: string) => {
  const msg = new http.IncomingMessage(new net.Socket())
  msg.statusCode = statusCode
  return {
    message: msg,
    readBody: () => {return Promise.resolve(body)}
  } 
})
jest.mock("@actions/http-client", () => {
  return jest.fn().mockImplementation(() => {
    return {
      post: mockPost
    }
  })
})

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

  beforeEach(() => {
    mockPost.mockClear();
    (HttpClient as unknown as jest.Mock).mockClear()
  })

  it("should successfully create a client", () => {
    const client = createArtifactTwirpClient("upload")
    expect(client).toBeDefined()
  })

  it("should make a request", async () => {
    /*
    const mockHttpClient = (HttpClient as unknown as jest.Mock).mockImplementation(() => {
      return {
        post: () => { 
          const msg = new http.IncomingMessage(new net.Socket())
          msg.statusCode = 200
          return {
            message: msg,
            readBody: () => {return Promise.resolve(`{"ok": true, "signedUploadUrl": "http://localhost:8080/lol/upload"}`)}
          } 
        }
      }
    })
    */
    const client = createArtifactTwirpClient("upload", new HttpClient())
    const artifact = await client.CreateArtifact(
      {
        workflowRunBackendId: "1234", 
        workflowJobRunBackendId: "5678", 
        name: "artifact", 
        version: 4
      }
    )

    expect(mockHttpClient).toHaveBeenCalledTimes(1)
    expect(artifact).toBeDefined()
    expect(artifact.ok).toBe(true)
    expect(artifact.signedUploadUrl).toBe("http://localhost:8080/upload")
  })

  it("should retry if the request fails", async () => {
    /*
    const mockPost = jest.fn(() => {
      const msg = new http.IncomingMessage(new net.Socket())
      if (mockPost.mock.calls.length > 1) {
        msg.statusCode = 200
        return {
          message: msg,
          readBody: () => {return Promise.resolve(`{"ok": true, "signedUploadUrl": "http://localhost:8080/upload"}`)}
        } 
      }
      msg.statusCode = 500
      return {
        message: msg,
        readBody: () => {return Promise.resolve(`{"ok": false}`)}
      } 
    })
    */
    const msgFailed = new http.IncomingMessage(new net.Socket())
    msgFailed.statusCode = 500
    const msgSucceeded = new http.IncomingMessage(new net.Socket())
    msgSucceeded.statusCode = 200

    const mockPost = jest.fn()
    mockPost.mockReturnValueOnce({
      message: msgFailed,
      readBody: () => {return Promise.resolve(`{"ok": false}`)}
    }).mockReturnValue({
      message: msgSucceeded,
      readBody: () => {return Promise.resolve(`{"ok": true, "signedUploadUrl": "http://localhost:8080/upload"}`)}
    })

    /*
    mockPost.mockImplementationOnce(() => {
      const msg = new http.IncomingMessage(new net.Socket())
      msg.statusCode = 500
      return {
        message: msg,
        readBody: () => {return Promise.resolve(`{"ok": false}`)}
      } 
    })

    mockPost.mockImplementation(() => {
      const msg = new http.IncomingMessage(new net.Socket())
      msg.statusCode = 200
      return {
        message: msg,
        readBody: () => {return Promise.resolve(`{"ok": true, "signedUploadUrl": "http://localhost:8080/lol/upload"}`)}
      }
    })
    */

    jest.mock("@actions/http-client", () => {
      return jest.fn().mockImplementation(() => {
        return {
          post: mockPost
        }
      })
    })
    /*
    jest.mock("@actions/http-client", () => {
      return {
        HttpClient: jest.fn().mockImplementation(() => {
          return {
            post: mockPost
          }
        })
      }
    })
    jest.mock("@actions/http-client", () => {
      return jest.fn().mockImplementation(() => {
        return {
          post: mockPost
        }
      })
    })
    */

    const client = createArtifactTwirpClient("upload", new HttpClient())
    const artifact = await client.CreateArtifact(
      {
        workflowRunBackendId: "1234", 
        workflowJobRunBackendId: "5678", 
        name: "artifact", 
        version: 4
      }
    )

    expect(artifact).toBeDefined()
    expect(artifact.ok).toBe(true)
    expect(artifact.signedUploadUrl).toBe("http://localhost:8080/upload")
    expect(mockPost).toHaveBeenCalledTimes(2)
  })
})

