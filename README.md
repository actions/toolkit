# Actions Toolkit 🛠

## Packages

| Package | Description |
| ------- | ----------- |
| [@actions/core](packages/core) | Core functions for setting results, logging, secrets and environment variables |
| [@actions/exec](packages/exec) | Functions necessary for running tools on the command line |
| [@actions/exit](packages/exit) | Provides utilities for exiting from an action |
| [@actions/io](packages/io) | Core functions for CLI filesystem scenarios |
| [@actions/tool-cache](packages/tool-cache) | Functions necessary for downloading and caching tools |
| [@actions/toolkit](packages/toolkit) | A general-purpose toolkit for writing actions |

## Development

This repository uses [Lerna](https://github.com/lerna/lerna#readme) to manage multiple packages. Read the documentation there to begin contributing.

### Useful Scripts

- `npm run bootstrap` This runs `lerna bootstrap` which will install dependencies in this repository's packages and cross-link packages where necessary.
- `npm run build` This compiles TypeScript code in each package (this is especially important if one package relies on changes in another when you're running tests). This is just an alias for `lerna run tsc`.
- `npm run format` This checks that formatting has been applied with Prettier.
- `npm test` This runs all Jest tests in all packages in this repository.
  - If you need to run tests for only one package, you can pass normal Jest CLI options:
    ```console
    $ npm test -- packages/toolkit
    ```
- `npm run create-package [name]` This runs a script that automates a couple of parts of creating a new package.

### Creating a Package

1. In a new branch, create a new Lerna package:

```console
$ npm run create-package new-package
```

This will ask you some questions about the new package. Start with `0.0.0` as the first version (look generally at some of the other packages for how the package.json is structured).

2. Add `tsc` script to the new package's package.json file:

```json
"scripts": {
  "tsc": "tsc"
}
```

3. Start developing 😄 and open a pull request.
