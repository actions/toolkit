# @actions/io Releases

## 3.0.2

- Fix: update lock file version

## 3.0.1

- Fix: export `@actions/io/lib/io-util`

## 3.0.0

- **Breaking change**: Package is now ESM-only
  - CommonJS consumers must use dynamic `import()` instead of `require()`

## 2.0.0

- Add support for Node 24 [#2110](https://github.com/actions/toolkit/pull/2110)
- Ensures consistent behavior for paths on Node 24 with Windows

## 1.1.3

- Replace `child_process.exec` with `fs.rm` in `rmRF` for all OS implementations [#1373](https://github.com/actions/toolkit/pull/1373)

## 1.1.2

- Update `lockfileVersion` to `v2` in `package-lock.json [#1020](https://github.com/actions/toolkit/pull/1020)

## 1.1.1

- [Fixed a bug where we incorrectly escaped paths for rmrf](https://github.com/actions/toolkit/pull/828)

## 1.1.0

- Add `findInPath` method to locate all matching executables in the system path

## 1.0.2

- [Add \"types\" to package.json](https://github.com/actions/toolkit/pull/221)

## 1.0.0

- Initial release
