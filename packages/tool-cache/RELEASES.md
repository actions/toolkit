# @actions/tool-cache Releases

### 1.6.0
- [Add extractXar function to extract XAR files](https://github.com/actions/toolkit/pull/207)

### 1.3.5

- [Check if tool path exists before executing](https://github.com/actions/toolkit/pull/385)
- [Make extract functions quiet by default](https://github.com/actions/toolkit/pull/206)

### 1.3.4

- [Update the http-client to 1.0.8 which had a security fix](https://github.com/actions/toolkit/pull/429)

Here is [the security issue](https://github.com/actions/http-client/pull/27) that was fixed in the http-client 1.0.8 release

### 1.3.3

- [Update downloadTool to only retry 500s and 408 and 429](https://github.com/actions/toolkit/pull/373)

### 1.3.2

- [Update downloadTool with better error handling and retries](https://github.com/actions/toolkit/pull/369)

### 1.3.1

- [Increase http-client min version](https://github.com/actions/toolkit/pull/314)

### 1.3.0

- [Uses @actions/http-client](https://github.com/actions/http-client)

### 1.2.0

- [Overload downloadTool to accept destination path](https://github.com/actions/toolkit/pull/257)
- [Fix `extractTar` on Windows](https://github.com/actions/toolkit/pull/264)
- [Add \"types\" to package.json](https://github.com/actions/toolkit/pull/221)

### 1.1.2

- [Use zip and unzip from PATH](https://github.com/actions/toolkit/pull/161)
- [Support custom flags for `extractTar`](https://github.com/actions/toolkit/pull/48)

### 1.0.0

- Initial release