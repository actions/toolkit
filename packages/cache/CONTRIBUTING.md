# Contributing to `@actions/cache`

## Releasing the package

The cache package has two actively maintained, incompatible release lines:

- **v6** is ESM-only and is the default release line. v6 releases are cut from
  `main`.
- **v5** uses CommonJS and is maintained on a separate v5 release branch. Only
  backport changes that remain compatible with CommonJS and the v5 support
  requirements.

Before publishing either release line:

1. Make sure the intended changes and tests are present on the release branch.
2. Update the version in `package.json` and `package-lock.json`.
3. Add the release notes to [`RELEASES.md`](./RELEASES.md).
4. Make sure the release branch's required checks pass.

See [#2500](https://github.com/actions/toolkit/pull/2500) for a reference pull
request that prepares a cache release, updates dependencies and package
metadata, and records the release notes.

### Publish workflow

Publish releases with the
[`Publish NPM` workflow](../../.github/workflows/releases.yml). For more
information about how the repository publishes packages, see the
[repository release documentation](../../docs/release.md).

The workflow installs dependencies, bootstraps and builds the repository,
runs tests, packs `@actions/cache`, and publishes the resulting package to
npm with provenance. When manually running the workflow, choose the inputs
for the release line:

| Input | v6 release | v5 release |
| --- | --- | --- |
| `package` | `cache` | `cache` |
| `branch` | `main` | The v5 release branch containing the release |
| `npm-tag` | `latest` | `v5-commonjs` |
| `test-all` | See [Test selection](#test-selection) | See [Test selection](#test-selection) |

The npm tag is important because it determines which package line consumers
install:

- Always publish v6 with the `latest` tag.
- Always publish v5 with the `v5-commonjs` tag. Never publish a v5 release
  with `latest`.

Do not use a semantic version such as `5.3.0` as an npm tag. npm dist-tags
must not be valid semantic versions.

### Test selection

The `test-all` input controls the scope of the workflow's test step:

- Leave `test-all` set to `false` to run only the cache package's Jest tests.
- Set `test-all` to `true` to run the entire repository test suite.

The workflow builds all packages in either case. Use the full test suite when
the release includes changes that affect shared packages or when broader
repository validation is needed.

### Verify the release

After the workflow completes, verify the published version and its dist-tag on
the [`@actions/cache` npm page](https://www.npmjs.com/package/@actions/cache).
