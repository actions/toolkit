# Contributions

This package is used internally by the v4 versions of [upload-artifact](https://github.com/actions/upload-artifact) and [download-artifact](https://github.com/actions/download-artifact). This package can also be used by other actions to interact with artifacts. Any changes or updates to this package will propagate updates to these actions so it is important that major changes or updates get properly tested.

Any issues or feature requests that are related to the artifact actions should be filled in the appropriate repo.

A limited range of unit tests run as part of each PR when making changes to the artifact packages. For small contributions and fixes, they should be sufficient.

If making large changes, there are a few scenarios that should be tested:

- Uploading very large artifacts
- Uploading artifacts with lots of small files
- Uploading artifacts using a self-hosted runner (uploads and downloads behave differently due to extra latency)
- Downloading a single artifact (large and small, if lots of small files are part of an artifact, timeouts and non-success HTTP responses can be expected)
- Downloading all artifacts at once

Large architectural changes can impact upload/download performance so it is important to separately run extra tests. We request that any large contributions/changes have extra detailed testing so we can verify performance and possible regressions.

Tests will run for every push/pull_request [via Actions](https://github.com/actions/toolkit/blob/main/.github/workflows/artifact-tests.yml).

# Testing

## Package tests

To run unit tests for the `@actions/artifact` package:

1. Clone `actions/toolkit` locally
2. Install dependencies: `npm bootstrap`
3. Change working directory to `packages/artifact`
4. Run jest tests: `npm run test`

## Within upload-artifact or download-artifact actions

Any easy way to test changes for the official upload/download actions is to fork them, compile changes and run them.

1. For your local `actions/toolkit` changes:
   1. Change directory to `packages/artifact`
   2. Compile the changes: `npm run tsc`
   3. Symlink your package change: `npm link`
2. Fork and clone either [upload-artifact](https://github.com/actions/upload-artifact) and [download-artifact](https://github.com/actions/download-artifact)
   1. In the locally cloned fork, link to your local toolkit changes: `npm link @actions/artifact`
   2. Then, compile your changes with: `npm run release`. The local `dist/index.js` should be updated with your changes.
   3. Commit and push to your fork, you can then test with a `uses:` in your workflow pointed at your fork.
