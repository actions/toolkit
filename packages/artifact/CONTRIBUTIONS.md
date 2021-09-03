# Contributions

This package is used internally by the v2+ versions of [upload-artifact](https://github.com/actions/upload-artifact) and [download-artifact](https://github.com/actions/download-artifact). This package can also be used by other actions to interact with artifacts. Any changes or updates to this package will propagate updates to these actions so it is important that major changes or updates get properly tested. 

Any issues or feature requests that are related to the artifact actions should be filled in the appropriate repo.

A limited range of unit tests run as part of each PR when making changes to the artifact packages. For small contributions and fixes, they should be sufficient.

If making large changes, there are a few scenarios that should be tested.

- Uploading very large artifacts (large artifacts get compressed using gzip so compression/decompression must be tested)
- Uploading artifacts with lots of small files (each file is uploaded with its own HTTP call, timeouts and non-success HTTP responses can be expected so they must be properly handled)
- Uploading artifacts using a self-hosted runner (uploads and downloads behave differently due to extra latency)
- Downloading a single artifact (large and small, if lots of small files are part of an artifact, timeouts and non-success HTTP responses can be expected)
- Downloading all artifacts at once

Large architectural changes can impact upload/download performance so it is important to separately run extra tests. We request that any large contributions/changes have extra detailed testing so we can verify performance and possible regressions.

It is not possible to run end-to-end tests for artifacts as part of a PR in this repo because certain env variables such as `ACTIONS_RUNTIME_URL` are only available from the context of an action as opposed to a shell script. These env variables are needed in order to make the necessary API calls.

# Testing

Any easy way to test changes is to fork the artifact actions and to use `npm link` to test your changes.

1. Fork the [upload-artifact](https://github.com/actions/upload-artifact) and [download-artifact](https://github.com/actions/download-artifact) repos
2. Clone the forks locally
3. With your local changes to the toolkit repo, type `npm link` after ensuring there are no errors when running `tsc`
4. In the locally cloned fork, type `npm link @actions/artifact`
4. Create a new release for your local fork using `tsc` and `npm run release` (this will create a new `dist/index.js` file using `@vercel/ncc`)
5. Commit and push your local changes, you will then be able to test your changes with your forked action
