# Releasing Packages

Packages are published to npm via the **Publish NPM** workflow ([`.github/workflows/releases.yml`](../.github/workflows/releases.yml)). The workflow is triggered manually through `workflow_dispatch` from the GitHub Actions UI.

## How it works

The workflow has two jobs:

1. **test** — Checks out the specified branch, installs dependencies, bootstraps the monorepo, builds all packages, runs tests, then packs the target package into a `.tgz` archive and uploads it as a workflow artifact.
2. **publish** — Downloads the packed artifact and publishes it to npm with `--provenance` (OIDC-based). Sends a Slack notification on success or failure. Requires the `npm-publish` environment.

## Inputs

| Input | Type | Required | Default | Description |
|---|---|---|---|---|
| `package` | choice | **yes** | — | Which package to release. One of: `artifact`, `attest`, `cache`, `core`, `exec`, `github`, `glob`, `http-client`, `io`, `tool-cache`. |
| `branch` | string | no | `main` | The branch to check out and release from. |
| `npm-tag` | string | no | `latest` | The npm dist-tag to publish under. See [Dist-tags](#dist-tags) below. |
| `test-all` | boolean | no | `false` | When `false`, only tests for the selected package are run. Set to `true` to run the full test suite across all packages. |

## Dist-tags

npm dist-tags control which version users get when they `npm install @actions/<package>` (or `@<tag>`).

> **Important:** npm dist-tags **cannot** be valid semver strings. Values like `5.0.0` or `1.2.3` will be rejected by npm. Use a descriptive name instead.

- **`latest`** — The default tag. This is what users get with a plain `npm install`. Should only be used for releases from `main`.
- **Custom tags** (e.g. `v1-longlived`) — Used for releases from long-lived or experimental branches.

Examples of **valid** dist-tags: `latest`, `next`, `beta`, `v1-longlived`
Examples of **invalid** dist-tags: `5.0.0`, `1.2.3`, `6.0.0-rc.1` (these are semver and will be rejected)

### Safety guard

The workflow **blocks** publishing with the `latest` dist-tag from any branch other than `main`. This prevents accidentally overwriting `latest` with a version from an older or experimental branch. If you're releasing from a non-main branch, use the package's major version as the tag (e.g. `v5`).

## Examples

### Standard release from main

Use default inputs — just pick the package:

| Input | Value |
|---|---|
| `package` | `core` |
| `branch` | `main` (default) |
| `npm-tag` | `latest` (default) |
| `test-all` | `false` (default) |

This publishes the version in `packages/core/package.json` on `main` as `@actions/core@latest`.

### Patch release from a long-lived branch

| Input | Value |
|---|---|
| `package` | `artifact` |
| `branch` | `releases/v5` |
| `npm-tag` | `v5` |
| `test-all` | `false` (default) |

This publishes the version in `packages/artifact/package.json` on the `releases/v5` branch under the `v5` dist-tag. The `latest` tag remains untouched.

### Release with full test suite

| Input | Value |
|---|---|
| `package` | `cache` |
| `branch` | `main` (default) |
| `npm-tag` | `latest` (default) |
| `test-all` | `true` |

Same as a standard release, but runs tests for all packages before publishing.

## Prerequisites

- You must have permission to trigger workflows on this repository.
- The `npm-publish` environment must be configured with npm credentials and OIDC.
- The `SLACK` secret must be set for Slack notifications to work.