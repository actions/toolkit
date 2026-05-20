# Path Validation Test Plan — `@actions/cache`

This document describes the test coverage for the client-side cache-archive path
validation feature introduced in `@actions/cache` v6.1.0.

## Feature summary

`extractTar()` now accepts a third argument:

```ts
extractTar(archivePath, compressionMethod, {
  declaredPaths?: string[],
  pathValidation?: 'off' | 'warn' | 'error'
})
```

When `pathValidation !== 'off'`, the archive is streamed through `node-tar`'s
`Parser` (no extraction) and every entry's path / linkpath is checked against
the set of allowed roots derived from `declaredPaths` (or, if that list is
empty, the GitHub Actions workspace as a single fail-safe root). Violations are
collected; in `'error'` mode a `CacheIntegrityError` is thrown **before** system
tar is invoked, so no bytes are ever written to the workspace.

`restoreCacheV1` and `restoreCacheV2` forward the caller-supplied
`pathValidation` mode and the declared `paths` array to `extractTar`. They also
re-throw `CacheIntegrityError` instances unchanged, so callers can distinguish
integrity failures from ordinary cache-miss/network errors.

## Files under test

| Source | Tests |
|---|---|
| [`src/internal/pathValidation.ts`](../src/internal/pathValidation.ts) | [`__tests__/pathValidation.test.ts`](../__tests__/pathValidation.test.ts) |
| [`src/internal/listAndValidate.ts`](../src/internal/listAndValidate.ts) | [`__tests__/listAndValidate.test.ts`](../__tests__/listAndValidate.test.ts) |
| [`src/internal/tar.ts`](../src/internal/tar.ts) (integration into `extractTar`) | [`__tests__/tarPathValidation.test.ts`](../__tests__/tarPathValidation.test.ts) |
| [`src/internal/cacheIntegrityError.ts`](../src/internal/cacheIntegrityError.ts) | covered indirectly via the integration tests |
| [`src/options.ts`](../src/options.ts) (new `pathValidation` field) | [`__tests__/options.test.ts`](../__tests__/options.test.ts) |
| [`src/cache.ts`](../src/cache.ts) (forwarding + error re-throw) | [`__tests__/restoreCache.test.ts`](../__tests__/restoreCache.test.ts), [`__tests__/restoreCacheV2.test.ts`](../__tests__/restoreCacheV2.test.ts) |

## Unit tests — pure logic (`pathValidation.test.ts`, 86 cases)

These exercise the platform-agnostic validation logic with no filesystem or
network. The suite is split into two groups.

### `deriveAllowedRoots`

Verifies the longest-non-glob-prefix derivation, normalization, deduplication
and platform-specific behavior:

- **Glob-prefix stripping**: `cache/**`, `*.log`, `?abc`, `[abc]`, `{a,b}`, `!neg`
- **Path expansion**:
  - `~` and `~/...` → home directory
  - `$VAR`, `${VAR}`, `%VAR%` → environment variables (with unknown vars expanding to empty)
  - Mixed expansion-before-glob (`${VAR}` is not misread as a brace glob)
- **Normalization**: leading `./`, embedded `./`, embedded `../`
- **Negations**: any pattern starting with `!` is dropped
- **Edge inputs**: `.`, empty string, whitespace-only, undefined entries
- **Deduplication**:
  - Identical roots collapsed
  - Child roots subsumed by parents (`/a/b` dropped when `/a` is also present)
  - Sibling-prefix non-collision (`/aa` is NOT subsumed by `/a`)
- **Case sensitivity**: case-insensitive on Windows/macOS, case-sensitive on Linux

### `validateEntry` — accept

- Plain files under allowed roots (`cache/file.txt`)
- Nested files (`cache/sub1/sub2/.../file.txt`)
- Files with leading `./`
- Files containing `..` as a substring within a segment (`..hidden`, `foo..bar`)
- Files in any of multiple allowed roots
- Unicode filenames, files with spaces, hidden files (`.git/HEAD`)
- Trailing `..` segments that don't escape the root
- Symlinks where the resolved target stays inside an allowed root
- Symlinks crossing from one allowed root into another allowed root
- Hardlinks within the same root
- Empty linkpath (treated as "no target to validate")

### `validateEntry` — reject (security)

- **Path traversal**: classic `../../etc/passwd`, inside-then-out (`cache/../../etc/x`),
  hidden in middle, multi-slash separators (`cache//../../x`)
- **Absolute paths**: POSIX `/etc/x`, root `/`, Windows `C:\...`, Windows forward-slash
  `C:/...`, Windows drive-relative `C:foo`, UNC `\\server\share`, UNC forward-slash,
  UNC long-path prefix `\\?\C:\...`
- **NUL byte attacks**: NUL in path, NUL in symlink target
- **Symlink attacks**:
  - Absolute symlink target
  - Symlink target with `..` traversal
  - **Symlink-then-write-through-link** (the critical TOCTOU-style attack:
    archive declares `cache/link → /tmp/evil` followed by `cache/link/file`)
  - Self-referential symlink to `.`
- **Hardlink attacks**: absolute target, `..` traversal
- **Unsupported entry types**: `CharacterDevice`, `BlockDevice`, `FIFO`
- **Header-only types accepted unconditionally** (these carry no path content):
  `GlobalExtendedHeader`, `ExtendedHeader`, `NextFileHasLongPath`, `NextFileHasLongLinkpath`

### `formatViolationSummary`

- Empty list → empty string
- Shows up to N items verbatim
- Truncates the tail with a `(... and N more)` summary line

## Integration tests — real archives (`listAndValidate.test.ts`, 14 cases)

These build small tar archives in memory using `tar.Header`, write them to disk,
and run them through the production parser. They cover the gzip and zstd
codepaths and use the system `zstd` binary (matching production behavior).
Skipped on hosts without `zstd` installed.

### Gzip-compressed

- Clean multi-entry archive → 0 violations
- Single tiny-file archive → 0 violations
- Classic `../../../etc/passwd` traversal → 1 violation, correct path/type
- Absolute file path (`/etc/cron.d/evil` or `C:/Windows/...`) → 1 violation
- Symlink with absolute target → 1 violation, correct linkpath captured
- Symlink with traversing target → 1 violation
- Hardlink with traversing target → 1 violation
- Mixed clean + malicious entries → only bad ones reported
- Character-device entry → 1 violation
- Corrupted / non-tar bytes → throws `Error` (caller wraps as `PARSE_ERROR`)

### Zstd-compressed (long & short window)

- Clean archive compressed with `zstd --long=30` → 0 violations
- Traversal in zstd archive → 1 violation
- `ZstdWithoutLong` compression method also works

## Integration tests — mocked downstream (`tarPathValidation.test.ts`, 15 cases)

These mock `listAndValidate` so the test can deterministically inject "violation
lists" and observe `extractTar`'s reaction. They mock `@actions/exec`,
`@actions/io` and `@actions/core` to assert what does (and does not) get called.

### `pathValidation: 'off'` (default)

- No `options` argument → validator never called, system tar runs normally
- Explicit `'off'` → validator never called, system tar runs

### `pathValidation: 'warn'`

- Clean archive → no warning emitted, extraction proceeds
- Violations present → **exactly one** `core.warning` summary, one `core.debug`
  per violation, system tar **still runs**
- Single violation → warning uses singular wording (`1 entry`)

### `pathValidation: 'error'`

- Violations present → throws `CacheIntegrityError`, **system tar is never
  invoked, `mkdirP` is never called** (no extraction directory is created)
- Thrown error has `code === 'PATH_VIOLATION'` and exposes the violations array
- Clean archive → no warning, no throw, extraction proceeds
- `listAndValidate` throws → wrapped as `CacheIntegrityError(PARSE_ERROR)`,
  system tar not invoked
- Parse failure in `'warn'` mode → warning is logged, validation is skipped,
  and extraction still proceeds

### Plumbing

- `declaredPaths` is forwarded to `listAndValidate`
- Empty/missing `declaredPaths` → fall back to `[workingDirectory]`
- All three compression methods (`Gzip`, `Zstd`, `ZstdWithoutLong`) forward correctly

## Regression coverage

These pre-existing tests were updated to account for the new third argument to
`extractTar` but otherwise exercise the same behavior as before:

- `restoreCache.test.ts` — V1 restore plumbs `paths` and `pathValidation`
- `restoreCacheV2.test.ts` — V2 restore plumbs `paths` and `pathValidation`
- `options.test.ts` — `getDownloadOptions` defaults `pathValidation: 'off'`

## What is intentionally NOT tested at this layer

- **End-to-end behaviour with real cache backend** — covered by the
  `actions/cache` action's E2E workflow (matrix across ubuntu, macos, windows ×
  off/warn/error).
- **Action-level input parsing** (`strict-paths`, `fail-on-cache-invalid`) —
  lives in the action repo's `actionUtils` + `restoreImpl` tests.
- **Symlink resolution against the live filesystem** — by design. We validate
  the *declared* paths from the archive header, not what they would resolve to
  on the running host. Live-fs resolution would re-introduce the TOCTOU window
  this feature exists to close.

## Running the tests

```sh
# from the toolkit repo root
npx jest --testTimeout 70000 packages/cache

# just the new path-validation suites
npx jest --testTimeout 70000 \
  packages/cache/__tests__/pathValidation.test.ts \
  packages/cache/__tests__/listAndValidate.test.ts \
  packages/cache/__tests__/tarPathValidation.test.ts
```

Total path-validation test cases: **115** (86 unit + 14 real-archive + 15 mocked).
Combined with the regression updates, the cache package runs **237 tests** total.
