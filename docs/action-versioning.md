# Versioning

Actions are downloaded and run from the GitHub graph of repos.  The workflow references an action use a ref.

Examples:

```yaml
steps:
    - use: actions/setup-node@74bc508
    - user: actions/setup-node@v1
    - uses: actions/setup-node@master  # not recommended
```

Binding to the immutable sha1 of a released version is the safest for stability and security.

Binding to a specific major version allows for receiving critical fixes and security patches while still mainting compatibility and the assurance your workflow should still work.

Binding to master is convenient but if a new major version is released which breaks compatilibility, your workflow could break. 

# Recommendations

1. **Don't check node_modules into master**: This will discourage people from attaching to master since the action will fail. You can enforce this by including `node_modules` in your `.gitignore` file.
2. **Create a release branch for each major version**: This will act as an alpha release for that major version. Any time you are ready to publish a new version from master, you should pull those changes into this branch (following the same steps listed below).
```
git checkout -b releases/v1 # If this branch already exists, omit the -b flag
rm -rf node_modules
sed -i '/node_modules/d' .gitignore # Bash command that removes node_modules from .gitignore
npm install --production
git add node_modules .gitignore
git commit -m node_modules
git push origin releases/v1
```
3. **When ready for a stable release, add a major version tag**: Move the major version tag (v1, v2, etc.) to point to the ref of the current release. This will act as the stable release for that major version. You should keep this tag updated to the most recent stable minor/patch release.
```
git checkout releases/v1
git tag -fa v1 -m "Update v1 tag"
git push origin v1
```
4. **Create releases for minor and patch version updates**: From the GitHub UI create a release for each minor or patch version update titled with that release version (e.g. v1.2.3).
5. **Compaitbility Breaks**:  introduce a new major version branch (releases/v2) and tag (v2) if changes will break existing workflows.  For example, changing inputs.

See [Git-Basics-Tagging](https://git-scm.com/book/en/v2/Git-Basics-Tagging)
