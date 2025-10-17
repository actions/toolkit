# GitHub Configuration

This directory contains various GitHub configurations for the Actions Toolkit repository.

## 📁 Directory Structure

### Workflow Files (`.github/workflows/`)

- **artifact-tests.yml** - Tests for the artifact package
- **audit.yml** - Security audit workflow
- **cache-tests.yml** - Tests for the cache package
- **cache-windows-test.yml** - Windows-specific cache tests
- **codeql.yml** - CodeQL security scanning
- **greetings.yml** - Greets first-time contributors
- **labeler.yml** - Auto-labels PRs based on changed files
- **release-drafter.yml** - Automatically drafts release notes
- **releases.yml** - Handles package releases
- **unit-tests.yml** - Runs unit tests across packages
- **update-github.yaml** - Updates GitHub package

### Issue and PR Templates

- **ISSUE_TEMPLATE/** - Templates for bug reports and feature requests
  - `bug_report.md` - Template for bug reports
  - `enhancement_request.md` - Template for feature requests
  - `config.yml` - Configuration for issue templates
- **PULL_REQUEST_TEMPLATE.md** - Template for pull requests

### Bot Configurations

- **auto-assign.yml** - Automatically assigns reviewers to PRs
- **dependabot.yml** - Dependabot configuration for dependency updates
- **labeler.yml** - Configuration for auto-labeling PRs
- **labels.yml** - Standard repository labels
- **release-drafter.yml** - Configuration for release drafter
- **stale.yml** - Configuration for marking stale issues/PRs

### Other Files

- **CONTRIBUTING.md** - Contribution guidelines
- **FUNDING.yml** - GitHub Sponsors configuration (optional)

## 🤖 Automated Workflows

### Security & Quality

- **CodeQL Analysis**: Runs on every push to main and weekly
- **Audit**: Checks for security vulnerabilities in dependencies
- **Unit Tests**: Runs on push and PRs (excluding markdown changes)

### Pull Request Automation

- **Auto-labeling**: Automatically adds labels based on changed files
- **Greeting**: Welcomes first-time contributors
- **Auto-assign**: Assigns reviewers to new PRs

### Release Management

- **Release Drafter**: Automatically generates draft release notes
- **Releases Workflow**: Publishes packages

### Issue Management

- **Stale Bot**: Marks inactive issues as stale and closes them if no activity

## 🏷️ Labels

The repository uses a comprehensive labeling system defined in `labels.yml`:

- **Type**: bug, enhancement, documentation, etc.
- **Priority**: high, medium, low
- **Status**: in progress, blocked, waiting for response
- **Components**: Package-specific labels (artifact, cache, core, etc.)

## 📝 Templates

### Pull Request Template

Includes sections for:
- Description
- Related issues
- Type of change
- Checklist for code quality
- Testing information

### Issue Templates

Two templates are available:
1. **Bug Report**: For reporting bugs with detailed reproduction steps
2. **Feature Request**: For suggesting new features or enhancements

## 🔧 Configuration

### Dependabot

Configured to check for updates daily for all packages in the monorepo.

### Stale Issues

- Issues become stale after 60 days of inactivity
- Stale issues are closed after 7 additional days
- Exempt labels: pinned, security, priority: high, breaking change

## 📚 Additional Resources

- [Complete GitHub Configuration Guide](../docs/github-configuration-guide.md) - Detailed guide on using all configurations
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](../CODE_OF_CONDUCT.md)
- [Security Policy](../SECURITY.md)
