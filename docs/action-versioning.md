# Versioning

Actions are downloaded and run from the GitHub graph of repos.  The workflow references an action use a ref.

Examples:

```yaml
steps:
    - use: actions/setup-node@74bc508
    - user: actions/setup-node@v1
    - uses: actions/setup-node@master
```

Binding to the immutable sha1 of a released version is the safest for stability and security.

Binding to a specific major version allows for receiving critical fixes and security patches while still mainting compatibility and the assurance your workflow should still work.

Binding to master is convenient but if a new major version is release which breaks compatilibility, your workflow could break.

# Recommendations

1. **Create a release**: use sematic versioning for the release (v1.0.9)
2. **Update the major version tag**: move the major version tag (v1, v2, etc.) to point to the current release.
3. **Compaitbility Breaks**:  introduce a new major version tag (v2) if changes will break existing workflows.  For example, changing inputs.



