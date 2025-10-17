# Quick Start: Using the New GitHub Configurations

This guide helps you quickly get started with the new GitHub configurations.

## 🚀 For First-Time Contributors

### Opening an Issue

1. Go to **Issues** → **New Issue**
2. Choose a template:
   - **Bug Report** - Report a bug
   - **Feature Request** - Suggest an enhancement
3. Fill out the template
4. Submit!

You'll receive a welcome message if it's your first issue! 🎉

### Creating a Pull Request

1. Fork the repository and create a branch
2. Make your changes
3. Ensure tests pass:
   ```bash
   npm test
   npm run format
   npm run lint
   ```
4. Open a PR - the template will auto-fill
5. Fill in all sections of the template
6. Submit!

**What happens automatically:**
- 🏷️ Your PR gets labeled based on changed files
- 👥 Reviewers are auto-assigned
- 💬 First-timers get a welcome message
- 📝 Release notes start being drafted

## 👨‍💻 For Regular Contributors

### Before You Commit

Make sure your editor is configured:
- `.editorconfig` ensures consistent formatting
- Run `npm run format` before committing
- Run `npm run lint` to check for issues

### Working with Labels

Your PRs will be automatically labeled based on:
- **Package changes**: `artifact`, `cache`, `core`, etc.
- **File types**: `documentation`, `dependencies`, `github_actions`

Add manual labels for:
- **Priority**: `priority: high`, `priority: medium`, `priority: low`
- **Status**: `status: in progress`, `status: blocked`
- **Type**: `bug`, `enhancement`, `breaking change`

### Release Notes

When your PR is merged:
- Release notes are automatically updated
- Your changes are categorized by label
- Version number is suggested based on change type

Labels that affect version:
- `breaking change` → Major version bump
- `enhancement`, `feature` → Minor version bump
- `bug`, `fix`, `dependencies` → Patch version bump

## 🔧 For Maintainers

### Managing Issues

**Stale Issues:**
- Issues inactive for 60 days are marked `stale`
- Stale issues are closed after 7 more days
- Exempt with labels: `pinned`, `security`, `priority: high`, `breaking change`

**Triage:**
- New issues get `needs triage` label
- Add priority and status labels as needed

### Reviewing Pull Requests

**Automatic Features:**
1. Auto-labeling based on changed files
2. Auto-assignment of reviewers
3. PR template ensures complete information

**Your Tasks:**
1. Review the code
2. Check that tests pass
3. Verify labels are correct
4. Approve or request changes

### Creating Releases

1. Go to **Releases**
2. Find the latest draft (auto-generated!)
3. Review the release notes:
   - Changes are categorized
   - Version is suggested
   - Contributors are listed
4. Edit if needed
5. Publish the release

## 📊 Workflows Overview

### On Every Push/PR

- ✅ **Unit Tests** - Tests all packages on Ubuntu, macOS, Windows
- ✅ **Code Scanning** - CodeQL analyzes code for vulnerabilities
- ✅ **Security Audit** - Checks for vulnerable dependencies
- ✅ **Auto-labeling** - Labels PRs based on changed files

### On PR Events

- **First PR/Issue** - Welcome message to new contributors
- **PR opened** - Auto-assign reviewers
- **PR merged** - Update release draft

### Scheduled

- **CodeQL** - Weekly scan for security issues
- **Dependabot** - Daily check for dependency updates

## 🤖 Bot Commands

### Dependabot

Dependabot will automatically:
- Check for updates daily
- Group minor/patch updates
- Create PRs for major updates separately

To control Dependabot on a PR:
- `@dependabot rebase` - Rebase the PR
- `@dependabot recreate` - Recreate the PR
- `@dependabot merge` - Merge when ready
- `@dependabot cancel merge` - Cancel auto-merge
- `@dependabot ignore this [dependency]` - Ignore this dependency

## 📝 File Overview

### Configuration Files

```
.editorconfig          → Editor settings
.gitattributes        → Git line ending settings
CITATION.cff          → Academic citation
```

### .github Directory

```
.github/
├── CONTRIBUTING.md            → How to contribute
├── FUNDING.yml                → Sponsor information (template)
├── PULL_REQUEST_TEMPLATE.md  → PR template
├── README.md                  → .github directory docs
├── SUPPORT.md                 → Support and help guide
├── auto-assign.yml            → Auto-reviewer assignment
├── dependabot.yml             → Dependabot config
├── labeler.yml                → Auto-labeling rules
├── labels.yml                 → Label definitions
├── release-drafter.yml        → Release notes config
├── settings.yml               → Repository settings (template)
├── stale.yml                  → Stale issue management
├── ISSUE_TEMPLATE/
│   ├── bug_report.md         → Bug report template
│   ├── config.yml            → Issue template config
│   └── enhancement_request.md → Feature request template
└── workflows/
    ├── greetings.yml         → Welcome first-timers
    ├── labeler.yml           → Auto-label PRs
    └── release-drafter.yml   → Generate release notes
```

## 🔍 Finding Information

- **Configuration Details**: [GitHub Configuration Guide](github-configuration-guide.md)
- **Setup Summary**: [GitHub Setup Summary](GITHUB_SETUP_SUMMARY.md)
- **Contributing**: [.github/CONTRIBUTING.md](../.github/CONTRIBUTING.md)
- **Getting Help**: [.github/SUPPORT.md](../.github/SUPPORT.md)

## 💡 Tips

### For Contributors

1. **Use Draft PRs** for work-in-progress
2. **Link Issues** with `Fixes #123` in PR description
3. **Keep PRs Small** - easier to review
4. **Update Tests** when changing code
5. **Check CI** before requesting review

### For Maintainers

1. **Use Labels Consistently** for better release notes
2. **Review Stale Issues** periodically
3. **Update Release Drafts** before publishing
4. **Triage New Issues** promptly
5. **Thank Contributors** - acknowledgment goes a long way!

## 🆘 Need Help?

- 💬 [GitHub Discussions](https://github.com/orgs/community/discussions/categories/actions)
- 📖 [Full Configuration Guide](github-configuration-guide.md)
- 📧 [Support](../.github/SUPPORT.md)

## ✅ Checklist for New Setup

If you're setting this up on a new repository:

- [ ] Review and customize `.github/FUNDING.yml`
- [ ] Review and customize `.github/settings.yml`
- [ ] Apply repository settings (requires admin)
- [ ] Sync labels using `labels.yml`
- [ ] Install GitHub Apps (Stale, etc.) if desired
- [ ] Configure branch protection rules
- [ ] Set up required status checks
- [ ] Configure secrets for workflows
- [ ] Test all workflows
- [ ] Review and customize templates

---

**Everything is ready to use! Start contributing! 🚀**
