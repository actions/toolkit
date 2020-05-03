# Problem Matchers

Problem Matchers are a way to scan the output of actions for a specified regex pattern and surface that information prominently in the UI. Both [GitHub Annotations](https://developer.github.com/v3/checks/runs/#annotations-object-1) and log file decorations are created when a match is detected.

## Single Line Matchers

Let's consider the ESLint compact output:

```
badFile.js: line 50, col 11, Error - 'myVar' is defined but never used. (no-unused-vars)
```

We can define a problem matcher in json that detects input in that format:

```json
{
    "problemMatcher": [
        {
            "owner": "eslint-compact",
            "pattern": [
                {
                    "regexp": "^(.+):\\sline\\s(\\d+),\\scol\\s(\\d+),\\s(Error|Warning|Info)\\s-\\s(.+)\\s\\((.+)\\)$",
                    "file": 1,
                    "line": 2,
                    "column": 3,
                    "severity": 4,
                    "message": 5,
                    "code": 6
                }
            ]
        }
    ]
}
```

The following fields are available for problem matchers:

```
{
    owner: an ID field that can be used to remove or replace the problem matcher. **required**
    severity: indicates the default severity, either 'warning' or 'error' case-insensitive. Defaults to 'error'
    pattern: [
        {
            regexp: the regex pattern that provides the groups to match against **required**
            file: a group number containing the file name
            fromPath: a group number containing a filepath used to root the file (e.g. a project file)
            line: a group number containing the line number
            column: a group number containing the column information
            severity: a group number containing either 'warning' or 'error' case-insensitive. Defaults to `error`
            code: a group number containing the error code
            message: a group number containing the error message. **required** at least one pattern must set the message
            loop: whether to loop until a match is not found, only valid on the last pattern of a multipattern matcher
        }
    ]
}
```

## Multiline Matching
Consider the following output:

```
test.js
  1:0   error  Missing "use strict" statement                 strict
  5:10  error  'addOne' is defined but never used             no-unused-vars
✖ 2 problems (2 errors, 0 warnings)
```

The file name is printed once, yet multiple error lines are printed. The `loop` keyword provides a way to discover multiple errors in outputs. 

The eslint-stylish problem matcher defined below catches that output, and creates two annotations from it.

```
{
    "problemMatcher": [
        {
            "owner": "eslint-stylish",
            "pattern": [
                {
                    // Matches the 1st line in the output
                    "regexp": "^([^\\s].*)$",
                    "file": 1
                },
                {
                    // Matches the 2nd and 3rd line in the output
                    "regexp": "^\\s+(\\d+):(\\d+)\\s+(error|warning|info)\\s+(.*)\\s\\s+(.*)$",
                    // File is carried through from above, so we define the rest of the groups
                    "line": 1,
                    "column": 2,
                    "severity": 3,
                    "message": 4,
                    "code": 5,
                    "loop": true
                }
            ]
        }
    ]
}
```

The first pattern matches the `test.js` line and records the file information. This line is not decorated in the UI.
The second pattern loops through the remaining lines with `loop: true` until it fails to find a match, and surfaces these lines prominently in the UI.

## Adding and Removing Problem Matchers

Problem Matchers are enabled and removed via the toolkit [commands](commands.md#problem-matchers).

## Duplicate Problem Matchers

Registering two problem-matchers with the same owner will result in only the problem matcher registered last running.

## Examples

Some of the starter actions are already using problem matchers, for example:
- [setup-node](https://github.com/actions/setup-node/tree/master/.github)
- [setup-python](https://github.com/actions/setup-python/tree/master/.github)
- [setup-go](https://github.com/actions/setup-go/tree/master/.github)
- [setup-dotnet](https://github.com/actions/setup-dotnet/tree/master/.github)

## Troubleshooting

### Regular expression not matching

Use ECMAScript regular expression syntax when testing patterns.

### File property getting dropped

[Enable debug logging](https://help.github.com/en/actions/configuring-and-managing-workflows/managing-a-workflow-run#enabling-debug-logging) to determine why the file is getting dropped.

This usually happens when the file does not exist or is not under the workflow repo.
