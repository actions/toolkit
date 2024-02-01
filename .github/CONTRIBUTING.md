# Contributions

We welcome contributions in the form of issues and pull requests. We view the contributions and process as the same for internal and external contributors.

## Issues

Log issues for both bugs and enhancement requests. Logging issues are important for the open community.

Issues in this repository should be for the toolkit packages. General feedback for GitHub Actions should be filed in the [community discussions](https://github.com/orgs/community/discussions/). Runner-specific issues can be filed in the [GitHub Actions runner repository](https://github.com/actions/runner).

## Enhancements and Feature Requests

We ask that, before significant time or effort is put into code changes, we have agreement on the change itself.

1. Create a feature request.
1. When we agree to take the enhancement, create an Architectural Decision Record (ADR) to agree on the details of the change.

An ADR provides consensus on the direction forward and also serves as a record of the change and motivation. [Read more here](../docs/adrs/README.md).

## Development Lifecycle

This repository uses [Lerna](https://github.com/lerna/lerna#readme) to manage multiple packages. Read the documentation there to begin contributing.

> [!NOTE]
>
> Before a PR will be accepted, you must ensure:
>
> - All tests are passing
> - `npm run format` reports no issues
> - `npm run lint` reports no issues

### Useful Scripts

- Install dependencies in this repository's packages and cross-link packages where necessary (runs `lerna exec -- npm install`)

  ```bash
  npm run bootstrap
  ```

- Compile the TypeScript code in each package (alias for `lerna run tsc`)

  > This is especially important if one package relies on changes in another.

  ```bash
  npm run build
  ```

- Check that formatting complies with this repository's [Prettier configuration](../.prettierrc.json)

  ```bash
  # Check formatting
  npm run format-check

  # Apply formatting
  npm run format
  ```

- Run Jest tests in all packages in this repository

  ```bash
  npm test
  ```

- Run Jest tests for a specific package in this repository

  ```console
  npm test -- packages/toolkit
  ```

- Automate initial setup of a new package (see [Creating a Package](#creating-a-package))

  ```bash
  npm run create-package [name]
  ```

### Creating a Package

1. Create a new branch

   ```bash
   git checkout -b <branch name>
   ```

1. Create a new Lerna package

   ```bash
   npm run create-package <package-name>
   ```

   This will ask you some questions about the new package.

   - Start with `0.0.0` as the first version.
   - Look generally at some of the other packages for how the `package.json` is structured.

1. Add the `tsc` script to the new package's `package.json` file:

   ```json
   {
     // ...
     "scripts": {
       "tsc": "tsc"
     }
   }
   ```

1. Start developing 😄
