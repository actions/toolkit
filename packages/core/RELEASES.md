# @actions/core Releases

### 1.9.1
- Randomize delimiter when calling `core.exportVariable`

### 1.9.0
- Added `toPosixPath`, `toWin32Path` and `toPlatformPath` utilities [#1102](https://github.com/actions/toolkit/pull/1102)

### 1.8.2
- Update to v2.0.1 of `@actions/http-client` [#1087](https://github.com/actions/toolkit/pull/1087)

### 1.8.1
- Update to v2.0.0 of `@actions/http-client`

### 1.8.0
- Deprecate `markdownSummary` extension export in favor of `summary`
  - https://github.com/actions/toolkit/pull/1072
  - https://github.com/actions/toolkit/pull/1073

### 1.7.0
- [Added `markdownSummary` extension](https://github.com/actions/toolkit/pull/1014)

### 1.6.0
- [Added OIDC Client function `getIDToken`](https://github.com/actions/toolkit/pull/919)
- [Added `file` parameter to `AnnotationProperties`](https://github.com/actions/toolkit/pull/896) 

### 1.5.0
- [Added support for notice annotations and more annotation fields](https://github.com/actions/toolkit/pull/855)

### 1.4.0
- [Added the `getMultilineInput` function](https://github.com/actions/toolkit/pull/829)

### 1.3.0
- [Added the trimWhitespace option to getInput](https://github.com/actions/toolkit/pull/802)
- [Added the getBooleanInput function](https://github.com/actions/toolkit/pull/725)

### 1.2.7
- [Prepend newline for set-output](https://github.com/actions/toolkit/pull/772)

### 1.2.6
- [Update `exportVariable` and `addPath` to use environment files](https://github.com/actions/toolkit/pull/571)

### 1.2.5
- [Correctly bundle License File with package](https://github.com/actions/toolkit/pull/548)

### 1.2.4
- [Be more lenient in accepting non-string command inputs](https://github.com/actions/toolkit/pull/405)
- [Add Echo commands](https://github.com/actions/toolkit/pull/411)

### 1.2.3

- [IsDebug logging](README.md#logging)

### 1.2.2

- [Fix escaping for runner commands](https://github.com/actions/toolkit/pull/302)

### 1.2.1

- [Remove trailing comma from commands](https://github.com/actions/toolkit/pull/263)
- [Add \"types\" to package.json](https://github.com/actions/toolkit/pull/221)

### 1.2.0

- saveState and getState functions for wrapper tasks (on finally entry points that run post job)

### 1.1.3 

- setSecret added to register a secret with the runner to be masked from the logs
- exportSecret which was not implemented and never worked was removed after clarification from product.

### 1.1.1

- Add support for action input variables with multiple spaces [#127](https://github.com/actions/toolkit/issues/127)
- Switched ## commands to :: commands (should have no noticeable impact) [#110)(https://github.com/actions/toolkit/pull/110)

### 1.1.0

- Added helpers for `group` and `endgroup` [#98](https://github.com/actions/toolkit/pull/98)

### 1.0.0

- Initial release
