# @actions/tool-cache Releases

### 2.0.1
- Update to v2.0.1 of `@actions/http-client` [#1087](https://github.com/actions/toolkit/pull/1087)

### 2.0.0
- Update to v2.0.0 of `@actions/http-client`
- The type of the `headers` parameter in the exported function `downloadTool` has been narrowed from `{ [header: string]: any }` to `{ [header: string]: number | string | string[] | undefined; }` (that is, `http.OutgoingHttpHeaders`).
    This is strictly a compile-time change for TypeScript consumers. Previous attempts to use a header value of a type other than those now accepted would have resulted in an error at run time.

### 1.7.2
- Update `lockfileVersion` to `v2` in `package-lock.json [#1025](https://github.com/actions/toolkit/pull/1025) 

### 1.7.1
- [Fallback to os-releases file to get linux version](https://github.com/actions/toolkit/pull/594)
- [Update to latest @actions/io verison](https://github.com/actions/toolkit/pull/838)

### 1.7.0
- [Allow arbirtary headers when downloading tools to the tc](https://github.com/actions/toolkit/pull/530)
- [Export `isExplicitVersion` and `evaluateVersions` functions](https://github.com/actions/toolkit/pull/796) 
- [Force overwrite on default when extracted compressed files](https://github.com/actions/toolkit/pull/807)

### 1.6.1
- [Update @actions/core version](https://github.com/actions/toolkit/pull/636)

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