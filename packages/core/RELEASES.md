# @actions/core Releases

### 1.1.3 

- setSecret added to register a secret with the runner to be masked from the logs
- exportSecret which was not implemented and never worked was removed in favore of setSecret.  A future output variable of type secret will be added for using a secret in subsequent steps.

### 1.1.1

- Add support for action input variables with multiple spaces [#127](https://github.com/actions/toolkit/issues/127)
- Switched ## commands to :: commands (should have no noticeable impact) [#110)(https://github.com/actions/toolkit/pull/110)

### 1.1.0

- Added helpers for `group` and `endgroup` [#98](https://github.com/actions/toolkit/pull/98)

### 1.0.0

- Initial release
