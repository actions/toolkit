# `@actions/artifact`

Interact programmatically with [Actions Artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts).

This is the core library that powers the [`@actions/upload-artifact`](https://github.com/actions/upload-artifact) and [`@actions/download-artifact`](https://github.com/actions/download-artifact) actions.


- [`@actions/artifact`](#actionsartifact)
  - [v2 - What's New](#v2---whats-new)
    - [Improvements](#improvements)
    - [Breaking changes](#breaking-changes)
  - [Quick Start](#quick-start)
  - [Examples](#examples)
    - [Upload and Download](#upload-and-download)
    - [Downloading from other workflow runs or repos](#downloading-from-other-workflow-runs-or-repos)
    - [Speeding up large uploads](#speeding-up-large-uploads)
  - [Additional Resources](#additional-resources)

## v2 - What's New

> [!IMPORTANT]
> @actions/artifact v2+, upload-artifact@v4+ download-artifact@v4+ are not currently supported on GHES yet. The previous version of this package can be found at [this tag](https://github.com/actions/toolkit/tree/@actions/artifact@1.1.2/packages/artifact) and [on npm](https://www.npmjs.com/package/@actions/artifact/v/1.1.2).

The release of `@actions/artifact@v2` (including `upload-artifact@v4` and `download-artifact@v4`) are major changes to the backend architecture of Artifacts. They have numerous performance and behavioral improvements.

### Improvements

1. All upload and download operations are much quicker, up to 80% faster download times and 96% faster upload times in worst case scenarios.
2. Once uploaded, an Artifact ID is returned and Artifacts are immediately available in the UI and [REST API](https://docs.github.com/en/rest/actions/artifacts). Previously, you would have to wait for the run to be completed before an ID was available or any APIs could be utilized.
3. Artifacts can now be downloaded and deleted from the UI _before_ the entire workflow run finishes.
4. The contents of an Artifact are uploaded together into an _immutable_ archive. They cannot be altered by subsequent jobs. Both of these factors help reduce the possibility of accidentally corrupting Artifact files. (Digest/integrity hash coming soon in the API!)
5. This library (and `actions/download-artifact`) now support downloading Artifacts from _other_ repositories and runs if a `GITHUB_TOKEN` with sufficient `actions:read` permissions are provided.

### Breaking changes

1. Firewall rules required for self-hosted runners.

    If you are using self-hosted runners behind a firewall, you must have flows open to [Actions endpoints](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners#communication-between-self-hosted-runners-and-github). If you cannot use wildcard rules for your firewall, see the GitHub [meta endpoint](https://api.github.com/meta) for specific endpoints.

    e.g.

    ```bash
    curl https://api.github.com/meta | jq .domains.actions
    ```

2. Uploading to the same named Artifact multiple times.

    Due to how Artifacts are created in this new version, it is no longer possible to upload to the same named Artifact multiple times. You must either split the uploads into multiple Artifacts with different names, or only upload once.

3. Limit of Artifacts for an individual job.

    Each job in a workflow run now has a limit of 10 artifacts.

## Quick Start

Install the package:

```bash
npm i @actions/artifact
```

Import the module:

```js
// ES6 module
import artifact from '@actions/artifact'

// CommonJS
const {default: artifact} = require('@actions/artifact')
```

ℹ️ For a comprehensive list of classes, interfaces, functions and more, see the [generated documentation](./docs/generated/README.md).

## Examples

### Upload and Download

The most basic scenario is uploading one or more files to an Artifact, then downloading that Artifact. Downloads are based on the Artifact ID, which can be obtained in the response of `uploadArtifact`, `getArtifact`, `listArtifacts` or via the [REST API](https://docs.github.com/en/rest/actions/artifacts).

```js
const {id, size} = await artifact.uploadArtifact(
  // name of the artifact
  'my-artifact',
  // files to include (supports absolute and relative paths)
  ['/absolute/path/file1.txt', './relative/file2.txt'],
  {
    // optional: how long to retain the artifact
    // if unspecified, defaults to repository/org retention settings (the limit of this value)
    retentionDays: 10
  }
)

console.log(`Created artifact with id: ${id} (bytes: ${size}`)

const {downloadPath} = await artifact.downloadArtifact(id, {
  // optional: download destination path. otherwise defaults to $GITHUB_WORKSPACE
  path: '/tmp/dst/path',
})

console.log(`Downloaded artifact ${id} to: ${downloadPath}`)
```

### Downloading from other workflow runs or repos

It may be useful to download Artifacts from other workflow runs, or even other repositories. By default, the permissions are scoped so they can only download Artifacts within the current workflow run. To elevate permissions for this scenario, you must specify `options.findBy` to `downloadArtifact`.

```ts
const findBy = {
  // must have actions:read permission on target repository
  token: process.env['GITHUB_TOKEN'],
  workflowRunId: 123,
  repositoryOwner: 'actions',
  repositoryName: 'toolkit'
}

await artifact.downloadArtifact(1337, {
  findBy
})

// can also be used in other methods

await artifact.getArtifact('my-artifact', {
  findBy
})

await artifact.listArtifacts({
  findBy
})
```

### Speeding up large uploads

If you have large files that need to be uploaded (or file types that don't compress well), you may benefit from changing the compression level of the Artifact archive. NOTE: This is a tradeoff between artifact upload time and stored data size.

```ts
await artifact.uploadArtifact('my-massive-artifact', ['big_file.bin'], {
  // The level of compression for Zlib to be applied to the artifact archive.
  // - 0: No compression
  // - 1: Best speed
  // - 6: Default compression (same as GNU Gzip)
  // - 9: Best compression
  compressionLevel: 0
})
```

## Additional Resources

- [Releases](./RELEASES.md)
- [Contribution Guide](./CONTRIBUTIONS.md)
- [Frequently Asked Questions](./docs/faq.md)
