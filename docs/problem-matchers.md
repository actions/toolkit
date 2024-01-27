# Problem Matchers

Problem matchers are a way to scan the output of actions for a specific regular expression (regex) pattern and surface that information prominently in the UI. Both [check run annotations](https://docs.github.com/en/rest/checks/runs) and log file decorations are created when a match is detected.

## Limitations

Currently, GitHub Actions limits the annotation count in a workflow run.

- 10 warning annotations, 10 error annotations, and 10 notice annotations per step
- 50 annotations per job (sum of annotations from all the steps)
- 50 annotations per run (separate from the job annotations, these annotations aren’t created by users)

If a workflow run exceeds these annotation counts, consider filtering the log messages which the problem matcher is exposed to (e.g. by PR touched files, lines, etc.).

## Single-Line Matchers

Consider the following ESLint compact output:

```plain
badFile.js: line 50, col 11, Error - 'myVar' is defined but never used. (no-unused-vars)
```

The following problem matcher detects input in this format:

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

```json
{
  "owner": "(Required) An ID field that can be used to remove or replace the problem matcher.",
  "severity": "Indicates the default severity: either 'warning' or 'error' (case-insensitive). Defaults to 'error'.",
  "pattern": [
    {
      "regexp": "(Required) The regex pattern that provides the groups to match against.",
      "file": "A group number containing the file name.",
      "fromPath": "A group number containing a file path used to root the file (e.g. a project file).",
      "line": "A group number containing the line number.",
      "column": "A group number containing the column information.",
      "severity": "A group number containing either 'warning' or 'error' case-insensitive. Defaults to `error`",
      "code": "A group number containing the error code",
      "message": "(Required) A group number containing the error message. At least one pattern must set the message.",
      "loop": "Whether to loop until a match is not found. Only valid on the last pattern of a multipattern matcher."
    }
  ]
}
```

## Multiline Matching

Consider the following output:

```plain
test.js
  1:0   error  Missing "use strict" statement                 strict
  5:10  error  'addOne' is defined but never used             no-unused-vars
✖ 2 problems (2 errors, 0 warnings)
```

The file name is printed once, yet multiple error lines are printed. The `loop` keyword provides a way to discover multiple errors in outputs.

The following problem matcher catches this output and creates two annotations.

```json
{
  "problemMatcher": [
    {
      "owner": "eslint-stylish",
      "pattern": [
        {
          // Matches the 1st line in the output.
          "regexp": "^([^\\s].*)$",
          "file": 1
        },
        {
          // Matches the 2nd and 3rd line in the output.
          "regexp": "^\\s+(\\d+):(\\d+)\\s+(error|warning|info)\\s+(.*)\\s\\s+(.*)$",
          // The "file" property is carried through from the previous pattern,
          // so we define the rest of the groups.
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

The first pattern matches the `test.js` line and records the file information. This line is not decorated in the UI. The second pattern loops through the remaining lines (`"loop": true`) until it fails to find a match. Any matches are surfaced prominently in the UI.

**Note:** Pattern matches must be on consecutive lines. The following would not result in any match findings.

```plain
test.js
  extraneous log line of no interest
  1:0   error  Missing "use strict" statement                 strict
  5:10  error  'addOne' is defined but never used             no-unused-vars
✖ 2 problems (2 errors, 0 warnings)
```

## Adding and Removing Problem Matchers

The `add-matcher` command enables a problem matcher using a path to a problem matcher file:

```bash
echo "::add-matcher::eslint-compact-problem-matcher.json"
```

The `remove-matcher` command removes a problem matcher:

```bash
echo "::remove-matcher owner=eslint-compact::"
```

## Duplicate Problem Matchers

Registering two problem-matchers with the same owner will result in only the last-registered problem matcher running.

## Examples

Some of the `setup-` actions are already using problem matchers:

- [setup-node](https://github.com/actions/setup-node/tree/main/.github)
- [setup-python](https://github.com/actions/setup-python/tree/main/.github)
- [setup-go](https://github.com/actions/setup-go/tree/main/.github)
- [setup-dotnet](https://github.com/actions/setup-dotnet/tree/main/.github)

## Troubleshooting

### Regular Expression not Matching

- Use ECMAScript regular expression syntax when testing patterns.

### File Property Getting Dropped

This usually happens when the file does not exist or is not under the workflow repo.

- [Enable debug logging](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging) to determine why the file is getting dropped.
