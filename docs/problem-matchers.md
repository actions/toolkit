# Problem Matchers
Problem Matchers are a way to scan output of builds for a specified pattern and surface that information in the UI. [GitHub Annotations](https://developer.github.com/v3/checks/runs/#annotations-object-1) and log file decorations are created for pattern matches. Problem Matchers are enabled via the toolkit [command](commands.md#problem-matchers).

For example, consider the ESLint compact output:
```
badFile.js: line 50, col 11, Error - 'myVar' is defined but never used. (no-unused-vars)
```
We can create a JSON file to define a problem matcher that detects input in that format:
```
{
    "problemMatcher": [
        {
            "owner": "eslint-compact",
            "pattern": [
                {
                    // The pattern that provides groups to match against
                    "regexp": "^(.+):\\sline\\s(\\d+),\\scol\\s(\\d+),\\s(Error|Warning|Info)\\s-\\s(.+)\\s\\((.+)\\)$",
                    // The first group matches the file
                    "file": 1,
                    // The second group matches the line
                    "line": 2,
                    // The third group matches the column
                    "column": 3,
                    // The fourth group matches the severity
                    "severity": 4,
                    // The fifth group matches the message
                    "message": 5,
                    // The sixth group matches the code
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
    owner: An id field that can be used to remove or replace the problem matcher. **required**
    pattern: 
    [
        {
            regexp: The regex containing the groups. **required**
            file: a group number containing the file name
            line: a group number containing the line number
            column: a group number containing the column information
            severity: a group number containing either 'warning' or 'error' case insensitive. Defaults to `error`
            code: a group number containing the error code
            message: a group number containing the error message. **required** at least one pattern must set message
            fromPath: a group number containing the base path of the file, otherwise the location of the git repository on disk is used
            loop: See [Multiline Matching](#Multi line matching)
        }
    ]
}
```


## Multi line matching
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
                    // File is carried through from above, so we definte the rest of the groups
                    "line": 1,
                    "column": 2,
                    "severity": 3,
                    "message": 4,
                    "code": 5,
                    // Loops until a match is not found
                    "loop": true
                }
            ]
        }
    ]
}
```

The first pattern matches the `test.js` line and records the file information. An annotation is not created for this line.
The second pattern loops through the remaining lines with `loop : true`, and creates an annotation for each line.

## Duplicate Problem Matchers
Registering two problem-matchers with the same owner will result in only the problem matcher registered last running.

## Examples
Some of the starter actions are already using problem matchers, for example:
- [setup-node Problem Matchers](https://github.com/actions/setup-node/tree/master/.github)
- [setup-python Problem Matchers](https://github.com/actions/setup-python/tree/master/.github)
- [setup-go Problem Matchers](https://github.com/actions/setup-go/tree/master/.github)
- [setup-dotnet](https://github.com/actions/setup-dotnet/tree/master/.github)
