# `@actions/artifact`

Interact programmatically with [Actions Artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts).

This is the core library that powers the [`@actions/upload-artifact`](https://github.com/actions/upload-artifact) and [`@actions/download-artifact`](https://github.com/actions/download-artifact) actions.


- [`@actions/artifact`](#actionsartifact)
  - [v2 - Major Performance and Behavioral Improvements](#v2---major-performance-and-behavioral-improvements)
    - [Improvements](#improvements)
    - [Breaking changes](#breaking-changes)
  - [Example scenarios](#example-scenarios)
    - [Basic Upload and Download](#basic-upload-and-download)
    - [Using `actions/github-script`](#using-actionsgithub-script)
    - [Downloading from other runs or repos](#downloading-from-other-runs-or-repos)
    - [Speeding up large uploads](#speeding-up-large-uploads)


## v2 - Major Performance and Behavioral Improvements

> [!IMPORTANT]
> @actions/artifact v2+, download-artifact@v4+ download-artifact@v4+ are not currently supported on GHES yet. The previous version of this package can be found at [this tag](https://github.com/actions/toolkit/tree/@actions/artifact@1.1.2/packages/artifact) and [on npm](https://www.npmjs.com/package/@actions/artifact/v/1.1.2).

The release of `@actions/artifact@v2` (including `download-artifact@v4` and `download-artifact@v4`) are major changes to the backend architecture of Artifacts. They have numerous performance and behavioral improvements.

### Improvements

1. All upload and download operations are exponentially faster, up to 80% faster download times and 96% faster upload times in worst case scenarios.
2. Once uploaded, Artifacts becoming immediately available in the UI and [REST API](https://docs.github.com/en/rest/actions/artifacts?apiVersion=2022-11-28). Previously, you would have to wait for the run to be completed.
3. Artifacts are _immutable_ once they are uploaded. They cannot be altered by subsequent jobs. (Digest/integrity hash coming soon in API!)
4. This library (and `actions/download-artifact`) now support downloading Artifacts from _other_ repositories and runs if a `GITHUB_TOKEN` with sufficient `actions:read` permissions are provided.

### Breaking changes

1. Firewall rules required for self-hosted runners.

    If you are using self-hosted runners behind a firewall, you must have flows open to [Actions endpoints](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners#communication-between-self-hosted-runners-and-github). If you cannot use wildcard rules for your firewall, see the GitHub [meta endpoint](https://api.github.com/meta) for specific endpoints.

    e.g.

    ```
    curl https://api.github.com/meta | jq .domains.actions
    ```

2. Uploading to the same named Artifact multiple times.

    Due to the behavior of how Artifacts are created in this new version, it is no longer possible to upload to the same named Artifact multiple times. You must either split the uploads into multiple names Artifacts, or only upload once.

## Example scenarios

### Basic Upload and Download

### Using `actions/github-script`

### Downloading from other runs or repos

### Speeding up large uploads
