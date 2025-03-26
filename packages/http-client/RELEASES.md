## Releases

## 2.2.3
- Fixed an issue where proxy username and password were not handled correctly [#1799](https://github.com/actions/toolkit/pull/1799)

## 2.2.2
- Better handling of url encoded usernames and passwords in proxy config [#1782](https://github.com/actions/toolkit/pull/1782)

## 2.2.1
- Make sure RequestOptions.keepAlive is applied properly on node20 runtime [#1572](https://github.com/actions/toolkit/pull/1572)

## 2.2.0
- Add function to return proxy agent dispatcher for compatibility with latest octokit packages [#1547](https://github.com/actions/toolkit/pull/1547)

## 2.1.1
- Add `HttpClientResponse.readBodyBuffer` method to read from a response stream and return a buffer [#1475](https://github.com/actions/toolkit/pull/1475)

## 2.1.0
- Add support for `*` and subdomains in `no_proxy` [#1355](https://github.com/actions/toolkit/pull/1355) [#1223](https://github.com/actions/toolkit/pull/1223)
- Bypass proxy for loopback IP adresses [#1360](https://github.com/actions/toolkit/pull/1360))

## 2.0.1
- Fix an issue with missing `tunnel` dependency [#1085](https://github.com/actions/toolkit/pull/1085)

## 2.0.0
- The package is now compiled with TypeScript's [`strict` compiler setting](https://www.typescriptlang.org/tsconfig#strict). To comply with stricter rules:
  - Some exported types now include `| null` or `| undefined`, matching their actual behavior.
  - Types implementing the method `RequestHandler.handleAuthentication()` now throw an `Error` rather than returning `null` if they do not support handling an HTTP 401 response. Callers can still use `canHandleAuthentication()` to determine if this handling is supported or not.
  - Types using `any` have been scoped to more specific types.
- Following TypeScript's naming conventions, exported interfaces no longer begin with the prefix `I-`.
- Delete the `IHttpClientResponse` interface in favor of the `HttpClientResponse` class.
- Delete the `IHeaders` interface in favor of `http.OutgoingHttpHeaders`.
- The source code of the package was moved to build with [actions/toolkit](https://github.com/actions/toolkit).

## 1.0.11

Contains a bug fix where proxy is defined without a user and password. see [PR here](https://github.com/actions/http-client/pull/42)   

## 1.0.9
Throw HttpClientError instead of a generic Error from the \<verb>Json() helper methods when the server responds with a non-successful status code. 

## 1.0.8
Fixed security issue where a redirect (e.g. 302) to another domain would pass headers.  The fix was to strip the authorization header if the hostname was different.  More [details in PR #27](https://github.com/actions/http-client/pull/27)

## 1.0.7
Update NPM dependencies and add 429 to the list of HttpCodes

## 1.0.6
Automatically sends Content-Type and Accept application/json headers for \<verb>Json() helper methods if not set in the client or parameters.

## 1.0.5
Adds \<verb>Json() helper methods for json over http scenarios.

## 1.0.4
Started to add \<verb>Json() helper methods.  Do not use this release for that.  Use >= 1.0.5 since there was an issue with types.

## 1.0.1 to 1.0.3
Adds proxy support.
