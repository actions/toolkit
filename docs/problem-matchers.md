# Problem Matchers

Problem Matchers are a way to scan the output of actions for a specified regex pattern and surface that information prominently in the UI. Both [GitHub Annotations](https://developer.github.com/v3/checks/runs/#annotations-object-1) and log file decorations are created when a match is detected.

## Limitations

Currently, GitHub Actions limit the annotation count in a workflow run.

- 10 warning annotations, 10 error annotations, and 10 notice annotations per step
- 50 annotations per job (sum of annotations from all the steps)
- 50 annotations per run (separate from the job annotations, these annotations aren’t created by users)

If your workflow may exceed these annotation counts, consider filtering of the log messages which the Problem Matcher is exposed to (e.g. by PR touched files, lines, or other).

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

Note that the pattern matches must be on consecutive lines. The following would not result in any match findings.

```
test.js
  extraneous log line of no interest
  1:0   error  Missing "use strict" statement                 strict
  5:10  error  'addOne' is defined but never used             no-unused-vars
✖ 2 problems (2 errors, 0 warnings)
```

## Adding and Removing Problem Matchers

Problem Matchers are enabled and removed via the toolkit [commands](commands.md#problem-matchers).

## Duplicate Problem Matchers

Registering two problem-matchers with the same owner will result in only the problem matcher registered last running.

## Examples

Some of the starter actions are already using problem matchers, for example:
- [setup-node](https://github.com/actions/setup-node/tree/main/.github)
- [setup-python](https://github.com/actions/setup-python/tree/main/.github)
- [setup-go](https://github.com/actions/setup-go/tree/main/.github)
- [setup-dotnet](https://github.com/actions/setup-dotnet/tree/main/.github)

## Troubleshooting

### Regular expression not matching

Use ECMAScript regular expression syntax when testing patterns.

### File property getting dropped

[Enable debug logging](https://docs.github.com/en/actions/managing-workflow-runs/enabling-debug-logging) to determine why the file is getting dropped.

This usually happens when the file does not exist or is not under the workflow repo.
