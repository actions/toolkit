# GitHub Configuration Guide

This guide explains all the GitHub configurations that have been set up for the Actions Toolkit repository and how to use them.

## Table of Contents

1. [Issue and Pull Request Templates](#issue-and-pull-request-templates)
2. [Automated Workflows](#automated-workflows)
3. [Bot Configurations](#bot-configurations)
4. [Repository Settings](#repository-settings)
5. [Labels and Organization](#labels-and-organization)
6. [Security and Maintenance](#security-and-maintenance)

## Issue and Pull Request Templates

### Pull Request Template

**Location**: `.github/PULL_REQUEST_TEMPLATE.md`

When creating a new pull request, this template automatically appears with:
- Description section
- Related issue linking
- Type of change checklist
- Quality assurance checklist
- Testing information

**Usage**: Simply create a new PR and the template will be pre-filled. Fill in the relevant sections.

### Issue Templates

**Location**: `.github/ISSUE_TEMPLATE/`

Two types of issue templates are available:

1. **Bug Report** (`bug_report.md`) - For reporting bugs
2. **Feature Request** (`enhancement_request.md`) - For suggesting enhancements

**Issue Template Config** (`config.yml`) provides links to:
- GitHub Community Discussions
- Security reporting (HackerOne)
- GitHub Actions Documentation
- GitHub Support

**Usage**: When creating a new issue, select the appropriate template from the dropdown.

## Automated Workflows

### 1. Release Drafter

**Workflow**: `.github/workflows/release-drafter.yml`
**Config**: `.github/release-drafter.yml`

**What it does**:
- Automatically generates draft release notes
- Categorizes changes by type (Features, Bug Fixes, Security, etc.)
- Suggests version numbers based on labels
- Lists contributors

**How to use**:
1. Label your PRs appropriately (bug, enhancement, security, etc.)
2. When PRs are merged, the release draft is automatically updated
3. Review and publish the draft release when ready

### 2. Auto-labeling PRs

**Workflow**: `.github/workflows/labeler.yml`
**Config**: `.github/labeler.yml`

**What it does**:
- Automatically adds labels to PRs based on which files are changed
- Labels by package (artifact, cache, core, etc.)
- Labels by type (documentation, dependencies, github_actions)

**How to use**:
- No action needed! Labels are added automatically when you create/update a PR

### 3. First-time Contributor Greeting

**Workflow**: `.github/workflows/greetings.yml`

**What it does**:
- Welcomes first-time contributors with a friendly message
- Provides helpful links and checklists
- Works for both issues and pull requests

**How to use**:
- Automatic! The bot will comment on first-time contributions

## Bot Configurations

### 1. Dependabot

**Location**: `.github/dependabot.yml`

**What it does**:
- Checks for dependency updates daily
- Creates PRs for outdated dependencies
- Groups minor and patch updates together

**Already configured for all packages in the monorepo!**

### 2. Stale Bot

**Location**: `.github/stale.yml`

**What it does**:
- Marks issues/PRs as stale after 60 days of inactivity
- Closes stale items after 7 additional days
- Exempts items with certain labels (pinned, security, priority: high)

**To prevent an issue from becoming stale**:
- Add activity (comments, commits)
- Add an exempt label (pinned, security, priority: high, breaking change)
- Set a milestone or assignee

### 3. Auto-assign Reviewers

**Location**: `.github/auto-assign.yml`

**What it does**:
- Automatically requests reviews when a PR is opened
- Filters out the PR author from reviewers

**Configuration**: Currently set to request reviews from `@actions/actions-runtime`

## Repository Settings

### Settings Configuration

**Location**: `.github/settings.yml`

This file documents the recommended repository settings:

**Merge Settings**:
- ✅ Allow squash merging
- ❌ Prevent merge commits
- ✅ Allow rebase merging
- ✅ Auto-delete head branches

**Security Settings**:
- ✅ Enable automated security fixes
- ✅ Enable vulnerability alerts

**Note**: These settings need to be applied through the GitHub UI or API (requires admin access).

## Labels and Organization

### Standard Labels

**Location**: `.github/labels.yml`

A comprehensive set of labels is defined including:

**Type Labels**:
- bug, enhancement, documentation, question

**Priority Labels**:
- priority: high/medium/low

**Status Labels**:
- status: in progress/blocked/waiting for response

**Component Labels**:
- Package-specific labels for each toolkit package

**To sync labels** (requires admin access):
```bash
# Using github-label-sync tool
npx github-label-sync --access-token $GITHUB_TOKEN owner/repo
```

## Security and Maintenance

### Security Scanning

**CodeQL Analysis**: `.github/workflows/codeql.yml`
- Runs on push to main
- Runs on all PRs
- Runs weekly on schedule
- Scans JavaScript/TypeScript code for vulnerabilities

**Security Audit**: `.github/workflows/audit.yml`
- Checks for vulnerable dependencies
- Runs on push and PRs
- Runs `npm audit` across all packages

### Testing

**Unit Tests**: `.github/workflows/unit-tests.yml`
- Tests on Ubuntu, macOS, and Windows
- Tests with Node.js 18.x and 20.x
- Includes linting and formatting checks

**Package-Specific Tests**:
- `artifact-tests.yml` - Artifact package tests
- `cache-tests.yml` - Cache package tests
- `cache-windows-test.yml` - Windows-specific cache tests

## Best Practices

### For Contributors

1. **Creating Issues**:
   - Use the appropriate issue template
   - Provide all requested information
   - Check for duplicates first

2. **Creating Pull Requests**:
   - Fill out the PR template completely
   - Link related issues
   - Ensure all tests pass before submitting
   - Run `npm run format` and `npm run lint`

3. **Labels**:
   - Add appropriate labels to your PRs
   - This helps with automatic release notes generation

### For Maintainers

1. **Reviewing PRs**:
   - Check auto-assigned labels
   - Ensure proper categorization for release notes
   - Add priority labels if needed

2. **Managing Stale Issues**:
   - Review items marked as stale
   - Add exempt labels if still relevant
   - Close items that are truly stale

3. **Releases**:
   - Review the auto-generated release draft
   - Edit as needed for clarity
   - Publish when ready

## Funding

**Location**: `.github/FUNDING.yml`

This file can be configured to show a "Sponsor" button on the repository. Currently, it's a template that needs to be filled in with actual sponsor information.

**To enable**:
1. Uncomment and fill in the relevant platform usernames
2. Commit the changes
3. The sponsor button will appear on the repository

## Additional Resources

- [GitHub Community Standards](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Probot Apps](https://probot.github.io/apps/)
- [GitHub Settings App](https://probot.github.io/apps/settings/)

## Troubleshooting

### Workflows Not Running

1. Check if the workflow is enabled in Settings > Actions
2. Verify the trigger conditions match your scenario
3. Check workflow permissions in repository settings

### Labels Not Auto-Applying

1. Ensure the labeler workflow is enabled
2. Check if the file patterns in `labeler.yml` match your changes
3. Verify the workflow has write permissions for pull requests

### Stale Bot Issues

1. Check if the Stale app is installed on the repository
2. Verify the configuration in `stale.yml`
3. Ensure exempt labels are correctly set

## Need Help?

- 💬 [GitHub Community Discussions](https://github.com/orgs/community/discussions/categories/actions)
- 📚 [Contributing Guide](.github/CONTRIBUTING.md)
- 🔒 [Security Policy](../SECURITY.md)
