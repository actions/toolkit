# Versioning

Actions are downloaded and run from the GitHub graph of repos.  The workflow references an action using a ref.

Examples:

```yaml
steps:
    - uses: actions/javascript-action@v1        # recommended. starter workflows use this
    - uses: actions/javascript-action@v1.0.0    # if an action offers specific releases 
    - uses: actions/javascript-action@41775a4   # binding to a specific sha 
```

# Compatibility

Binding to a major version is the latest of that major version ( e.g. `v1` == "1.*" )

Major versions should guarantee compatibility.  A major version can add net new capabilities but should not break existing input compatibility or break existing workflows. 

Major version binding allows you to take advantage of bug fixes and critical functionality and security fixes.  The `master` branch has the latest code and is unstable to bind to since changes get committed to master and released to the market place by creating a tag.  In addition, a new major version carrying breaking changes will get implemented in master after branching off the previous major version.

> Warning: do not reference `master` since that is the latest code and can be carrying breaking changes of the next major version.

```yaml
steps:
    - uses: actions/javascript-action@master  # do not do this
```

Binding to the immutable sha1 may offer more reliability.  However, note that the hosted images toolsets (e.g. ubuntu-latest) move forward and if there is a tool breaking issue, actions may react with a patch to a major version to compensate so binding to a specific SHA may prevent you from getting fixes.

> Recommendation: bind to major versions to get functionality and fixes but reserve binding to a specific release or SHA as a mitigation strategy for unforeseen breaks. 

# Recommendations

1. **Create a GitHub release for each specific version**: Creating a release like [ v1.0.0 ](https://github.com/actions/javascript-action/releases/tag/v1.0.0) allows users to bind back to a specific version if an issue is encountered with the latest major version.  

2. **Publish the specific version to the marketplace**:  When you release a specific version, choose the option to "Publish this release to the GitHub Marketplace".

3. **Make the new release available to those binding to the major version tag**: Move the major version tag (v1, v2, etc.) to point to the ref of the current release. This will act as the stable release for that major version. You should keep this tag updated to the most recent stable minor/patch release.

```
git tag -fa v1 -m "Update v1 tag"
git push origin v1 --force
```

4. **Create a new major version if breaking compat**: If the inputs or behavior are breaking, offer a new major version.  Typically, this entails branching the previous major version for critical updates and moving master to the new major version.  Keeping the major versions available to a minimum is desirable as adding new major versions requires end users understanding the breaks (how to adjust their yaml and expectations).  Since you will likely want to innovate on just the latest major version with only critical updates to previous major versions, you will want to encourage users to move to the latest major version.  For that reason, it's best to combine breaking changes with new capabilities.

# Sample Workflow

This illustrates the versioning workflow covered above.

![versioning](assets/action-releases.png)
