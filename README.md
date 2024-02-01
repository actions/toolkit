<!-- markdownlint-disable MD033 MD041 -->

<p align="center">
  <img alt="Logo" src="res/at-logo.png">
</p>

<p align="center">
  <a href="https://github.com/actions/toolkit/actions?query=workflow%3Atoolkit-unit-tests"><img alt="Toolkit unit tests status" src="https://github.com/actions/toolkit/workflows/toolkit-unit-tests/badge.svg"></a>
  <a href="https://github.com/actions/toolkit/actions?query=workflow%3Atoolkit-audit"><img alt="Toolkit audit status" src="https://github.com/actions/toolkit/workflows/toolkit-audit/badge.svg"></a>
</p>

## GitHub Actions Toolkit

The GitHub Actions Toolkit provides a set of packages to make creating actions easier.

<h3 align="center">
  Get started with the <a href="https://github.com/actions/typescript-action">TypeScript Action Template</a>!
</h3>

## Packages

### :heavy_check_mark: [@actions/core](packages/core)

Provides functions for managing inputs, outputs, results, logging, secrets and variables.

```bash
npm install @actions/core
```

### :runner: [@actions/exec](packages/exec)

Provides functions to run CLI tools and process output.

```bash
npm install @actions/exec
```

### :ice_cream: [@actions/glob](packages/glob)

Provides functions to search for files matching glob patterns.

```bash
npm install @actions/glob
```

### :phone: [@actions/http-client](packages/http-client)

Provides a lightweight HTTP client optimized for building actions.

```bash
npm install @actions/http-client
```

### :pencil2: [@actions/io](packages/io)

Provides disk I/O functions like `cp`, `mv`, `rmRF`, `which`, etc.

```bash
npm install @actions/io
```

### :hammer: [@actions/tool-cache](packages/tool-cache)

Provides functions for downloading and caching tools (e.g. `setup-*` actions). See [`@actions/cache`](packages/cache) for caching workflow dependencies.

```bash
npm install @actions/tool-cache
```

### :octocat: [@actions/github](packages/github)

Provides an Octokit client hydrated with the context of the current workflow run.

```bash
npm install @actions/github
```

### :floppy_disk: [@actions/artifact](packages/artifact)

Provides functions to interact with artifacts.

```bash
npm install @actions/artifact
```

### :dart: [@actions/cache](packages/cache)

Provides functions to cache dependencies and build outputs to improve workflow run duration.

```bash
npm install @actions/cache
```

## Creating Custom GitHub Actions

:question: [Types of actions](https://docs.github.com/en/actions/creating-actions/about-custom-actions#types-of-actions)

You can build Docker container, JavaScript, and composite actions.

:curly_loop: [Using release management for actions](https://docs.github.com/en/actions/creating-actions/about-custom-actions#using-release-management-for-actions)

This section explains how you can use release management to distribute updates to your actions in a predictable way.

:warning: [Problem Matchers](docs/problem-matchers.md)

Problem Matchers are a way to scan the output of actions for a specified regular expression pattern and surface that information prominently in the UI.

:warning: [Using a proxy server with self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/using-a-proxy-server-with-self-hosted-runners)

You can configure self-hosted runners to use a proxy server to communicate with GitHub.

## Templates and Examples

### [`actions/typescript-action`](https://github.com/actions/typescript-action)

Template action written in TypeScript with compilation, tests, linting, publishing, and versioning.

### [`action/javascript-action`](https://github.com/actions/javascript-action)

Template action written in JavaScript with compilation, tests, linting, publishing, and versioning.

### [`actions/container-action`](https://github.com/actions/container-action)

Template action deployed as a Docker conatiner with compilation, tests, linting, publishing, and versioning.

### [`actions/container-toolkit-action`](https://github.com/actions/container-toolkit-action)

Template action deployed as a Docker conatiner with compilation, tests, linting, publishing, and versioning. Demonstrates using the GitHub Actions Toolkit within custom actions.

### [`actions/container-prebuilt-action`](https://github.com/actions/container-prebuilt-action)

Template action deployed as a Docker conatiner with compilation, tests, linting, publishing, and versioning. Demonstrates reduced workflow run duration using prebuilt container images.

### [`actions/hello-world-javascript-action`](https://github.com/actions/hello-world-javascript-action)

Illustrates how to create a simple _Hello, World!_ action written in JavaScript.

### [`actions/hello-world-docker-action`](https://github.com/actions/hello-world-docker-action)

Illustrates how to create a simple _Hello, World!_ action written as a Docker container.

## Contributing

We welcome contributions! See [how to contribute](.github/CONTRIBUTING.md).

## Code of Conduct

See [our code of conduct](CODE_OF_CONDUCT.md).
