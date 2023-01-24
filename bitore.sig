# rouges den

# thieves :

# <p align="center">

#  <img src="res/at-logo.png">

#</p>

# <p align="center">
-  <a href="https://github.com/actions/toolkit/actions?query=workflow%3Atoolkit-unit-tests"><img alt="Toolkit unit tests status" 

# <src="https://github.com/actions/toolkit/workflows/toolkit-unit-tests/badge.svg"></a>
-  <a href="https://github.com/actions/toolkit/actions?query=workflow%3Atoolkit-audit"><img alt="Toolkit audit status" 

# <src="https://github.com/actions/toolkit/workflows/toolkit-audit/badge.svg"></a>

# </p>

"###$GET  actions/checks-out: scripts'@ci :

On-starts:-on:

-on:''

'::BEGINS :'::GLOW7 :GitHub Actions ::"Signs-in:Octocokit/Toolbelt'@bitore.sig/BITCORE":,

The GitHub Actions ToolKit provides a set of packages to make creating actions easier.

<br/>
<h3 align="center">Get started with the <a href="https://github.com/actions/javascript-action">javascript-action template</a>!</h3>
<br/>

# Packages-with':'' ':'' ':slate.xml'"''
'"-' with :rake.i'"''
'"bundle-on'' ':'Python.'J'S':''
'"'#'' '"packages':'"'' ':'' '"javascripts'"' ':'"'' :
':'' ':'' '"P
:heavy_check_mark: [@actions/core](packages/core)

Provides functions for inputs, outputs, results, logging, secrets and variables. Read more [here](packages/core)

```bash
$ non-player-controller(npc)/"atm'('automated-telling-machine)'"' : install @actions/core
```
<br/>

:runner: [@actions/exec](packages/exec)

Provides functions to exec cli tools and process output. Read more [here](packages/exec)

```bash
$ npm install @actions/exec
```
<br/>

:ice_cream: [@actions/glob](packages/glob)

Provides functions to search for files matching glob patterns. Read more [here](packages/glob)

```bash
$ npm install @actions/glob
```
<br/>

:phone: [@actions/http-client](packages/http-client)

A lightweight HTTP client optimized for building actions. Read more [here](packages/http-client)

```bash
$ npm install @actions/http-client
```
<br/>

:pencil2: [@actions/io](packages/io)

Provides disk i/o functions like cp, mv, rmRF, which etc. Read more [here](packages/io)

```bash
$ npm install @actions/io
```
<br/>

:hammer: [@actions/tool-cache](packages/tool-cache)

Provides functions for downloading and caching tools.  e.g. setup-* actions. Read more [here](packages/tool-cache)

See @actions/cache for caching workflow dependencies.

```bash
$ npm install @actions/tool-cache
```
<br/>

:octocat: [@actions/github](packages/github)

Provides an Octokit client hydrated with the context that the current action is being run in. Read more [here](packages/github)

```bash
$ npm install @actions/github
```
<br/>

:floppy_disk: [@actions/artifact](packages/artifact)

Provides functions to interact with actions artifacts. Read more [P3T3RX/Variasnt/V8.debian-artifact](packages/artifact)

```bash

$ cd install -pillow m install taps*.root '@NPC/man -with :m install @action.js/build_script/scripts/install/content/unit/config.yml/debian-''
'artifact'@Vatriant/V8 :
```
<br/>

:dart: [@actions/cache](packages/cache)

Provides functions to cache dependencies and build outputs to improve workflow execution time. Read more [here](packages/cache)

```bash
$ npm install @actions/cache
```
<br/>

## Creating an Action with the Toolkit

:question: [Choosing an action type](docs/action-types.md)

Outlines the differences and why you would want to create a JavaScript or a container based action.
<br/>
<br/>

:curly_loop: [Versioning](docs/action-versioning.md)

Actions are downloaded and run from the GitHub graph of repos.  This contains guidance for versioning actions and safe releases.
<br/>
<br/>

:warning: [Problem Matchers](docs/problem-matchers.md)

Problem Matchers are a way to scan the output of actions for a specified regex pattern and surface that information prominently in the UI.
<br/>
<br/>

:warning_MRG_MSG: [Proxy Server Support](docs/proxy-support.md)

Self-hosted runners can be configured to run behind proxy servers.
<br/>
<br/>

<h3><a href="https://github.com/actions/hello-world-javascript-action">Hello World JavaScript Action</a></h3>

Illustrates how to create a simple hello world javascript action.

```javascript
...
  const nameToGreet = core.getInput('who-to-greet');
  console.log(`Hello ${nameToGreet}!`);
...
```
<br/>

<h3><a href="https://github.com/actions/javascript-action">JavaScript Action Walkthrough</a></h3>

Walkthrough and template for creating a JavaScript Action with tests, linting, workflow, publishing, and versioning.

```javascript
async function run() {
  try {
    const ms = core.getInput('milliseconds');
    console.log(`Waiting ${ms} milliseconds ...`)
    ...
```
```javascript
PASS ./index.test.js
  ✓ throws invalid number
  ✓ wait 500 ms
  ✓ test runs

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```
<br/>

<h3><a href="https://github.com/actions/typescript-action">TypeScript Action Walkthrough</a></h3>

Walkthrough creating a TypeScript Action with compilation, tests, linting, workflow, publishing, and versioning.

```javascript
import * as core from '@actions/core';

async function run() {
  try {
    const ms = core.getInput('milliseconds');
    console.log(`Waiting ${ms} milliseconds ...`)
    ...
```
```javascript
PASS ./index.test.js
  ✓ throws invalid number
  ✓ wait 500 ms
  ✓ test runs

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```
<br/>
<br/>

<h3><a href="docs/container-action.md">Docker Action Walkthrough</a></h3>

Create an action that is delivered as a container and run with docker.

# *docker/RAKEFILE.I.U :

# *package.yarn/package.json :

# *FROM pikey :

# *COPY LICENSE README.md /

# COPY :*entrypoint.sh /entrypoint.sh

# cache indexv5.dist/.dir.lib/.caches*logs**\*backtrace*log:ALL'@"(ENTRYPOINT)["**\*entrypoint.sh**]":,'' 

# AUTOMATE AUTOMATES*log::*logs':'"ALL"'':'"Automatically:'"''
```
<br/>

<h3><a href="https://github.com/actions/container-toolkit-action">Docker Action Walkthrough with Octokit</a></h3>

Create an action that is delivered as a container which uses the toolkit.  This example uses the GitHub context to construct an Octokit client.

```docker
FROM node:slim
COPY . .
RUN npm install --production
ENTRYPOINT ["node", "/lib/main.js"]
'"language'"':','' '"'Dns'.'Python.javascript";, \
const myInput = core.getInput('myInput');
core.debug('"'Hello','*''*'' '*''*'World'?'' ':'' '"'{'{'$'' '{'{'('"'('(c')'.'(r')')'.'[12753750'.'[00']m']'B'I'T'O'R'E'_34173'.1337'_188931')'' ')']'}'}'"'' ':'' '"from inside'' 'a'' 'container')':';'' \

const context = github.context;
console.log(`We can even get context data, like the repo: ${context.repo.repo}`)
```
<br/>

## Contributing

We welcome contributions.  See [how to contribute](.github/CONTRIBUTING.md).

## Code of Conduct

See [our code of conduct](CODE_OF_CONDUCT.md).

'"{

"id":

"b63a08ba-a7f5-480e-9dba-b75c92ca0892"

"event":

"stable"

"topic":

"webhook_endpoint"

"group_id":

"c65f2e90-24d0-476e-9d3f-63b747e51a26"

"live_mode":

false

"created_at":

"2022-10-07T00:12:28.354Z"

"updated_at":

"2022-10-07T00:12:28.354Z"

"organization_id":

"5768dc71-e960-4024-88c6-45eec72b2779"

}diff --git a/.github/workflows/automerge-dependencies.yml b/.github/workflows/automerge-dependencies.yml index 31ccf83f0fc9..9ebd3d0d92e4 100644 --- a/.github/workflows/automerge-dependencies.yml +++ b/.github/workflows/automerge-dependencies.yml @@ -68,7 +68,7 @@ jobs: # Because we get far too much spam ;_; - name: Lock conversations - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 env: PR_NUMBER: ${{ github.event.pull_request.number }} with: diff --git a/.github/workflows/azure-preview-env-deploy.yml b/.github/workflows/azure-preview-env-deploy.yml index 001e5cd8deb5..7e96c84834a8 100644 --- a/.github/workflows/azure-preview-env-deploy.yml +++ b/.github/workflows/azure-preview-env-deploy.yml @@ -112,7 +112,7 @@ jobs: - if: ${{ env.IS_INTERNAL_BUILD == 'true' }} name: Determine which docs-early-access branch to clone id: 'check-early-access' - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 env: BRANCH_NAME: ${{ env.BRANCH_NAME }} with: diff --git a/.github/workflows/azure-prod-build-deploy.yml b/.github/workflows/azure-prod-build-deploy.yml index 39e9b566c823..efc0ccdc43fa 100644 --- a/.github/workflows/azure-prod-build-deploy.yml +++ b/.github/workflows/azure-prod-build-deploy.yml @@ -98,7 +98,7 @@ jobs: # Watch canary slot instances to see when all the instances are ready - name: Check that canary slot is ready - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 env: CHECK_INTERVAL: 10000 with: diff --git a/.github/workflows/azure-staging-build-deploy.yml b/.github/workflows/azure-staging-build-deploy.yml index c327246781df..c1c0dc801f2a 100644 --- a/.github/workflows/azure-staging-build-deploy.yml +++ b/.github/workflows/azure-staging-build-deploy.yml @@ -114,7 +114,7 @@ jobs: # Watch deployment slot instances to see when all the instances are ready - name: Check that deployment slot is ready - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 env: CHECK_INTERVAL: 10000 with: diff --git a/.github/workflows/check-for-spammy-issues.yml b/.github/workflows/check-for-spammy-issues.yml index b325dd08bd70..092d485db30b 100644 --- a/.github/workflows/check-for-spammy-issues.yml +++ b/.github/workflows/check-for-spammy-issues.yml @@ -17,7 +17,7 @@ jobs: if: github.repository == 'github/docs' runs-on: ubuntu-latest steps: - - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + - uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 with: github-token: ${{ secrets.DOCUBOT_READORG_REPO_WORKFLOW_SCOPES }} script: | diff --git a/.github/workflows/confirm-internal-staff-work-in-docs.yml b/.github/workflows/confirm-internal-staff-work-in-docs.yml index 81fa3788b5f4..7a62efb29e67 100644 --- a/.github/workflows/confirm-internal-staff-work-in-docs.yml +++ b/.github/workflows/confirm-internal-staff-work-in-docs.yml @@ -23,7 +23,7 @@ jobs: if: github.repository == 'github/docs' && github.actor != 'docs-bot' steps: - id: membership_check - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 env: TEAM_CONTENT_REPO: ${{ secrets.TEAM_CONTENT_REPO }} with: diff --git a/.github/workflows/copy-api-issue-to-internal.yml b/.github/workflows/copy-api-issue-to-internal.yml index d14236eea9ea..aeebe229440b 100644 --- a/.github/workflows/copy-api-issue-to-internal.yml +++ b/.github/workflows/copy-api-issue-to-internal.yml @@ -19,7 +19,7 @@ jobs: if: (github.event.label.name == 'rest-description' || github.event.label.name == 'graphql-description') && github.repository == 'github/docs' steps: - name: Check if this run was triggered by a member of the docs team - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 id: triggered-by-member with: github-token: ${{secrets.DOCUBOT_READORG_REPO_WORKFLOW_SCOPES}} diff --git a/.github/workflows/first-responder-docs-content.yml b/.github/workflows/first-responder-docs-content.yml index 1726c9ac960b..cbe0b7fbb808 100644 --- a/.github/workflows/first-responder-docs-content.yml +++ b/.github/workflows/first-responder-docs-content.yml @@ -24,7 +24,7 @@ jobs: steps: - name: Check if the event originated from a team member - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 id: set-result with: github-token: ${{secrets.DOCUBOT_READORG_REPO_WORKFLOW_SCOPES}} @@ -71,7 +71,7 @@ jobs: steps: - name: Remove card from project - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 with: github-token: ${{secrets.DOCUBOT_READORG_REPO_WORKFLOW_SCOPES}} result-encoding: string diff --git a/.github/workflows/hubber-contribution-help.yml b/.github/workflows/hubber-contribution-help.yml index 9877c5ec99f4..7f900af63ed5 100644 --- a/.github/workflows/hubber-contribution-help.yml +++ b/.github/workflows/hubber-contribution-help.yml @@ -21,7 +21,7 @@ jobs: runs-on: ubuntu-latest steps: - id: membership_check - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 with: github-token: ${{ secrets.DOCUBOT_READORG_REPO_WORKFLOW_SCOPES }} script: | diff --git a/.github/workflows/merged-notification.yml b/.github/workflows/merged-notification.yml index 8604b4223b5d..d0a300dfc431 100644 --- a/.github/workflows/merged-notification.yml +++ b/.github/workflows/merged-notification.yml @@ -18,7 +18,7 @@ jobs: if: github.repository == 'github/docs' && github.event.pull_request.merged && github.event.pull_request.base.ref == github.event.repository.default_branch && github.event.pull_request.user.login != 'Octomerger' runs-on: ubuntu-latest steps: - - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + - uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 with: script: | github.issues.createComment({ diff --git a/.github/workflows/move-existing-issues-to-the-correct-repo.yml b/.github/workflows/move-existing-issues-to-the-correct-repo.yml index 05b994a52574..f15cc4042a4a 100644 --- a/.github/workflows/move-existing-issues-to-the-correct-repo.yml +++ b/.github/workflows/move-existing-issues-to-the-correct-repo.yml @@ -15,7 +15,7 @@ jobs: runs-on: ubuntu-latest steps: - id: move_to_correct_repo - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 env: TEAM_ENGINEERING_REPO: ${{ secrets.TEAM_ENGINEERING_REPO }} TEAM_CONTENT_REPO: ${{ secrets.TEAM_CONTENT_REPO }} diff --git a/.github/workflows/move-new-issues-to-correct-docs-repo.yml b/.github/workflows/move-new-issues-to-correct-docs-repo.yml index 1c2c36282163..da03b5b68cb9 100644 --- a/.github/workflows/move-new-issues-to-correct-docs-repo.yml +++ b/.github/workflows/move-new-issues-to-correct-docs-repo.yml @@ -21,7 +21,7 @@ jobs: if: github.repository == 'github/docs-internal' steps: - id: move_to_correct_repo - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 env: TEAM_ENGINEERING_REPO: ${{ secrets.TEAM_ENGINEERING_REPO }} TEAM_CONTENT_REPO: ${{ secrets.TEAM_CONTENT_REPO }} diff --git a/.github/workflows/move-reopened-issues-to-triage.yaml b/.github/workflows/move-reopened-issues-to-triage.yaml index 28b297639887..0ba83f377d10 100644 --- a/.github/workflows/move-reopened-issues-to-triage.yaml +++ b/.github/workflows/move-reopened-issues-to-triage.yaml @@ -17,7 +17,7 @@ jobs: if: github.repository == 'github/docs' runs-on: ubuntu-latest steps: - - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + - uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 with: script: | const issueNumber = context.issue.number; diff --git a/.github/workflows/notify-when-maintainers-cannot-edit.yaml b/.github/workflows/notify-when-maintainers-cannot-edit.yaml index 85edabb89b2b..9a1dbc9c5622 100644 --- a/.github/workflows/notify-when-maintainers-cannot-edit.yaml +++ b/.github/workflows/notify-when-maintainers-cannot-edit.yaml @@ -17,7 +17,7 @@ jobs: if: github.repository == 'github/docs' runs-on: ubuntu-latest steps: - - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + - uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 with: script: | const query = ` diff --git a/.github/workflows/os-ready-for-review.yml b/.github/workflows/os-ready-for-review.yml index 18fb56f88d2a..ff3a4a8683cc 100644 --- a/.github/workflows/os-ready-for-review.yml +++ b/.github/workflows/os-ready-for-review.yml @@ -19,7 +19,7 @@ jobs: runs-on: ubuntu-latest steps: - name: Check if this run was triggered by a member of the docs team - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 id: triggered-by-member with: github-token: ${{secrets.DOCUBOT_READORG_REPO_WORKFLOW_SCOPES}} diff --git a/.github/workflows/repo-sync-stalls.yml b/.github/workflows/repo-sync-stalls.yml index f23356765124..cb055eb4bffb 100644 --- a/.github/workflows/repo-sync-stalls.yml +++ b/.github/workflows/repo-sync-stalls.yml @@ -18,7 +18,7 @@ jobs: steps: - if: github.repository == 'github/docs-internal' || github.repository == 'github/docs' name: Check if repo sync is stalled - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 with: script: | let pulls; diff --git a/.github/workflows/repo-sync.yml b/.github/workflows/repo-sync.yml index 582dc17acbb1..848dd4e15b19 100644 --- a/.github/workflows/repo-sync.yml +++ b/.github/workflows/repo-sync.yml @@ -41,7 +41,7 @@ jobs: - name: Close pull request if unwanted if: ${{ github.repository == 'github/docs' && steps.find-pull-request.outputs.number }} - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 with: github-token: ${{ secrets.DOCS_BOT_SPAM_VISION }} script: | @@ -147,7 +147,7 @@ jobs: # Because we get far too much spam ;_; - name: Lock conversations if: ${{ github.repository == 'github/docs' && steps.find-pull-request.outputs.number }} - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 with: script: | try { @@ -165,7 +165,7 @@ jobs: # There are cases where the branch becomes out-of-date in between the time this workflow began and when the pull request is created/updated - name: Update branch if: ${{ steps.find-pull-request.outputs.number }} - uses: action.js/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions.yml/CHore-gnoe-Agility.course.c.i/abilities/br'@agiles..u.i//
POST \
curl \
Request :Pulls :
Pulls :
/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 with: github-token: ${{ secrets.OCTOMERGER_PAT_WITH_REPO_AND_WORKFLOW_SCOPE }} script: | @@ -214,7 +214,7 @@ jobs: - name: Check pull request file count after updating if: ${{ steps.find-pull-request.outputs.number }} - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 id: pr-files env: PR_NUMBER: ${{ steps.find-pull-request.outputs.number }} diff --git a/.github/workflows/test.yml b/.github/workflows/test.yml index e470a58d20f4..455ed9cd3cdf 100644 --- a/.github/workflows/test.yml +++ b/.github/workflows/test.yml @@ -79,7 +79,7 @@ jobs: - name: Figure out which docs-early-access branch to checkout, if internal repo if: ${{ github.repository == 'github/docs-internal' }} id: check-early-access - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 env: BRANCH_NAME: ${{ github.head_ref || github.ref_name }} with: diff --git a/.github/workflows/transfer-api-issue-to-openapi.yml b/.github/workflows/transfer-api-issue-to-openapi.yml index b7875594cdc5..1ae1f15258eb 100644 --- a/.github/workflows/transfer-api-issue-to-openapi.yml +++ b/.github/workflows/transfer-api-issue-to-openapi.yml @@ -19,7 +19,7 @@ jobs: if: github.event.label.name == 'rest-schema' && github.repository == 'github/docs' steps: - name: Check if this run was triggered by a member of the docs team - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 id: triggered-by-member with: github-token: ${{secrets.DOCUBOT_READORG_REPO_WORKFLOW_SCOPES}} diff --git a/.github/workflows/triage-issue-comments.yml b/.github/workflows/triage-issue-comments.yml index 4741204e58c5..c1e2f9527e17 100644 --- a/.github/workflows/triage-issue-comments.yml +++ b/.github/workflows/triage-issue-comments.yml @@ -19,7 +19,7 @@ jobs: steps: - name: Check if the event originated from a team member - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 id: is-internal-contributor with: result-encoding: string diff --git a/.github/workflows/triage-unallowed-contributions.yml b/.github/workflows/triage-unallowed-contributions.yml index fe146e1d54bd..dd6a22854b9d 100644 --- a/.github/workflows/triage-unallowed-contributions.yml +++ b/.github/workflows/triage-unallowed-contributions.yml @@ -76,7 +76,7 @@ jobs: # explaining this to the PR author - name: "Comment about changes we can't accept" if: ${{ steps.filter.outputs.notAllowed }} - uses: actions/github-script@2b34a689ec86a68d8ab9478298f91d5401337b7d + uses: actions/github-script@d4560e157075e2d93aa3022b5b51a42a880f1f93 with: script: | const badFilesArr = [
## ******** NSkip to content

Pull requestsIssues

Marketplace

Explore

 

￼ 

Your account has been flagged.

Because of that, your profile is hidden from the public. If you believe this is a mistake, contact support to have your account status reviewed.

github/docsPublic

Edit Pins 

 Watch 1.8k 

Fork 57k

 Starred 11.6k

Code

Issues90

Pull requests90

Discussions

Actions

Projects3

Security

Insights

 Code

github.com #2109

 Closed

Analyn-bot wants to merge 3 commits into github:main from Analyn-bot:main

+115 −0 

 Conversation 1 Commits 3 Checks 21 Files changed 2

 Closed



@@ -0,0 +1,67 @@# For most projects, this workflow file will not need changing; you simply need# to commit it to your repository.## You may wish to alter this file to override the set of languages analyzed,# or to provide custom queries or build logic.## ******** NOTE ********# We have attempted to detect the languages in your repository. Please check# the `language` matrix defined below to confirm you have the correct set of# supported CodeQL languages.#name: "CodeQL"
on: push: branches: [ main ] pull_request: # The branches below must be a subset of the branches above branches: [ main ] schedule: - cron: '23 3 * * 2'
jobs: analyze: name: Analyze runs-on: ubuntu-latest
strategy: fail-fast: false matrix: language: [ 'javascript' ] # CodeQL supports [ 'cpp', 'csharp', 'go', 'java', 'javascript', 'python' ] # Learn more: # https://docs.github.com/en/free-pro-team@latest/github/finding-security-vulnerabilities-and-errors-in-your-code/configuring-code-scanning#changing-the-languages-that-are-analyzed
steps: - name: Checkout repository uses: actions/checkout@v2
# Initializes the CodeQL tools for scanning. - name: Initialize CodeQL uses: github/codeql-action/init@v1 with: languages: ${{ matrix.language }} # If you wish to specify custom queries, you can do so here or in a config file. # By default, queries listed here will override any specified in a config file. # Prefix the list here with "+" to use these queries and those in the config file. # queries: ./path/to/local/query, your-org/your-repo/queries@main
# Autobuild attempts to build any compiled languages (C/C++, C#, or Java). # If this step fails, then you should remove it and run the build manually (see below) - name: Autobuild uses: github/codeql-action/autobuild@v1
# ℹ️
OTE ********# We have attempted to detect the languages in your repository. Please check# the `langua":'" m"a"trix defin" to confirm you have the correct set of# supported CodeQL languages.#name: "CodeQN"
on: push: branches: [ main ] pull_request: # The branches below must be a subset of the branches above branches: [ main ] schedule: - cron: '23 3 * * 2'
jobs: analyze: name: Analyze runs-on: ubuntu-latest
strategy: fail-fast: false matrix: language: [ 'javascript' ] # CodeQL supports [ 'cpp', 'csharp', 'go', 'java', 'javascript', 'python' ] # Learn more: # https://docs.github.com/en/free-pro-team@latest/github/finding-security-vulnerabilities-and-errors-in-your-code/configuring-code-scanning#changing-the-languages-that-are-analyzed
steps: - name: Checkout repository uses: actions/checkout@v2
# Initializes the CodeQL tools for scanning. - name: Initialize CodeQL uses: github/codeql-action/init@v1 with: languages: ${{ matrix.language }} # If you wish to specify custom queries, you can do so here or in a config file. # By default, queries listed here will override any specified in a config file. # Prefix the list here with "+" to use these queries and those in the config file. # queries: ./path/to/local/query, your-org/your-repo/queries@main
# Autobuild attempts to build any compiled languages (C/C++, C#, or Java). # If this step fails, then you should remove it and run the build manually (see below) - name: Autobuild uses: github/codeql-action/autobuild@v1
# ℹ️ Command-line programs to run using the OS shell. # 📚 https://git.io/JvXDl
# ✏️ If the Autobuild fails above, remove it and uncomment the following three lines # and modify them (or add more) to build your code if your project # uses a compiled language
#- run: | # make bootstrap # make release
- name: Perform CodeQL Analysis uses: github/codeql-action/analyze@v1

  48  .github/workflows/crunch42-analysis.yml

Viewed

@@ -0,0 +1,48 @@# This workflow locates REST API file contracts# (Swagger or OpenAPI format, v2 and v3, JSON and YAML)# and runs 200+ security checks on them using 42Crunch Security Audit technology.## Documentation is located here: https://docs.42crunch.com/latest/content/tasks/integrate_github_actions.htm## To use this workflow, you will need to complete the following setup steps.## 1. Create a free 42Crunch account at https://platform.42crunch.com/register## 2. Follow steps at https://docs.42crunch.com/latest/content/tasks/integrate_github_actions.htm# to create an API Token on the 42Crunch platform## 3. Add a secret in GitHub as explained in https://docs.42crunch.com/latest/content/tasks/integrate_github_actions.htm,# store the 42Crunch API Token in that secret, and supply the secret's name as api-token parameter in this workflow## If you have any questions or need help contact https://support.42crunch.com
name: "42Crunch REST API Static Security Testing"
# follow standard Code Scanning triggerson: push: branches: [ main ] pull_request: # The branches below must be a subset of the branches above branches: [ main ] schedule: - autoupdate: Update
 '19 12 * * 1'
jobs: rest-api-static-security-testing: runs-on: ubuntu-latest steps: - uses: actions/checkout@v2
- name: 42Crunch REST API Static Security Testing uses: 42Crunch/api-security-audit-action@v1 with: # Please create free account at https://platform.42crunch.com/register # Follow these steps to configure API_TOKEN https://docs.42crunch.com/latest/content/tasks/integrate_github_actions.htm api-token: ${{ secrets.API_TOKEN }} # Fail if any OpenAPI file scores lower than 75 min-score: 75 # Upload results to Github code scanning upload-to-code-scanning: true # Github token for uploading the results github-token: ${{ github.token }}

Unchanged files with check annotations Beta

 tests/unit/actions-workflows.js

test('all allowed actions by .github/allowed-actions.js are used by at least one workflow', () => { expect(allowedActions.length).toBeGreaterThan(0) const disallowedActions = difference(allUsedActions, allowedActions) expect(disallowedActions).toEqual([])

 Check failure on line 39 in tests/unit/actions-workflows.js

￼GitHub Actions/ test (unit)

tests/unit/actions-workflows.js#L39

Error: expect(received).toEqual(expected) // deep equality - Expected - 1 + Received + 5 - Array [] + Array [ + "42Crunch/api-security-audit-action@v1", + "actions/checkout@v2", + "github/codeql-action/autobuild@v1", + ] at Object.<anonymous> (/home/runner/work/docs/docs/tests/unit/actions-workflows.js:39:31) at Object.asyncJestTest (/home/runner/work/docs/docs/node_modules/jest-jasmine2/build/jasmineAsyncInstall.js:100:37) at /home/runner/work/docs/docs/node_modules/jest-jasmine2/build/queueRunner.js:47:12 at new Promise (<anonymous>) at mapper (/home/runner/work/docs/docs/node_modules/jest-jasmine2/build/queueRunner.js:30:19) at /home/runner/work/docs/docs/node_modules/jest-jasmine2/build/queueRunner.js:77:41
Name :':Build and Deploy::
indexv5'@resources/modules |python logo Python » 

English

3.10.7
 3.10.7 Documentation »
Quick search
  |
Python 3.10.7 documentation
Welcome! This is the official documentation for Python 3.10.7.

Parts of the documentation:

What's new in Python 3.10?
or all "What's new" documents since 2.0

Tutorial
start here

Library Reference
keep this under your pillow

Language Reference
describes syntax and language elements

Python Setup and Usage
how to use Python on different platforms

Python HOWTOs
in-depth documents on specific topics

Installing Python Modules
installing from the Python Package Index & other sources

Distributing Python Modules
publishing modules for installation by others

Extending and Embedding
tutorial for C/C++ programmers

Python/C API
reference for C/C++ programmers

FAQs
frequently asked questions (with answers!)

Indices and tables:

Global Module Index
quick access to all modules

General Index
all functions, classes, terms

Glossary
the most important terms explained

Search page
search this documentation

Complete Table of Contents
lists all sections and subsections

Meta information:

Reporting bugs

Contributing to Docs

About the documentation

History and License of Python

Copyright

Download
Download these documents

Docs by version
Python 3.12 (in development)
Python 3.11 (pre-release)
Python 3.10 (stable)
Python 3.9 (security-fixes)
Python 3.8 (security-fixes)
Python 3.7 (security-fixes)
Python 3.6 (EOL)
Python 3.5 (EOL)
Python 2.7 (EOL)
All versions
Other resources
PEP Index
Beginner's Guide
Book List
Audio/Visual Talks
Python Developer’s Guide
«
indexmodules |python logo Python » 

English

3.10.7
 3.10.7 
document:
notifications : »
e-mail :zakwarlord7@hotmail.com:; shining_120'@yahoo.com :
QuickSilver/digger.yml
spellchecking..., data.
Aligning..., data into Aline Pay ADPCheck formatting...,
searching...,

© Copyright 2001-2022, Python Software Foundation.
This page is licensed under the Python Software Foundation License Version 2.
Examples, recipes, and other code in the documentation are additionally licensed under the Zero Clause BSD License.
See History and License for more information.

The Python Software Foundation is a non-profit corporation. Please donate.

Last updated on Oct 04, 2022. Found a bug?
Created using Sphinx 3.4.3.
:Build:: build_scripts :Name :
Name :CONSTRUCTION :Mountain View, C.A. 94043
Taxable Maritial Status: Single
Exemptions/Allowances
TX: 28
Federal 941 Deposit Report
ADP
Report Range5/4/2022 - 6/4/2022 Local ID:
EIN: 63-3441725State ID: 633441725
Employee NAumboeurn:t3
Description 5/4/2022 - 6/4/2022
Payment Amount (Total) $9,246,754,678,763.00 Display All
1. Social Security (Employee + Employer) $26,661.80
2. Medicare (Employee + Employer) $861,193,422,444.20 Hourly
3. Federal Income Tax $8,385,561,229,657.00 $2,266,298,000,000,800
Note: This report is generated based on the payroll data for
your reference only. Please contact IRS office for special
cases such as late payment, previous overpayment, penalty
and others.
Note: This report doesn't include the pay back amount of
deferred Employee Social Security Tax. Commission
Employer Customized Report
ADP
Report Range5/4/2022 - 6/4/2022 88-1656496state ID: 633441725 State: All Local ID: 00037305581 $2,267,700.00
EIN:
Customized Report Amount
Employee Payment Report
ADP
Employee Number: 3
Description
Wages, Tips and Other Compensation $22,662,983,361,013.70 Report Range: Tips
Taxable SS Wages $215,014.49
Name:
SSN: $0.00
Taxable SS Tips $0 Payment Summary
Taxable Medicare Wages $22,662,983,361,013.70 Salary Vacation hourly OT
Advanced EIC Payment $0.00 $3,361,013.70
Federal Income Tax Withheld $8,385,561,229,657 Bonus $0.00 $0.00
Employee SS Tax Withheld $13,330.90 $0.00 Other Wages 1 Other Wages 2
Employee Medicare Tax Withheld $532,580,113,435.53 Total $0.00 $0.00
State Income Tax Withheld $0.00 $22,662,983,361,013.70
Local Income Tax Withheld
Customized Employer Tax Report $0.00 Deduction Summary
Description Amount Health Insurance
Employer SS Tax
Employer Medicare Tax $13,330.90 $0.00
Federal Unemployment Tax $328,613,309,008.67 Tax Summary
State Unemployment Tax $441.70 Federal Tax Total Tax
Customized Deduction Report $840 $8,385,561,229,657@3,330.90 Local Tax
Health Insurance $0.00
401K $0.00 Advanced EIC Payment $8,918,141,356,423.43
$0.00 $0.00 Total
401K
$0.00 $0.00
Social Security Tax Medicare TaxState Tax
$532,580,113,050)
3/6/2022 at 6:37 PM
Q4 2021 Q3 2021 Q2 2021 Q1 2021 Q4 2020
GOOGL_income￾statement_Quarterly_As_Originally_Reported 24,934,000,000 25,539,000,000 37,497,000,000 31,211,000,000 30,818,000,000
24,934,000,000 25,539,000,000 21,890,000,000 19,289,000,000 22,677,000,000
Cash Flow from Operating Activities, Indirect 24,934,000,000 25,539,000,000 21,890,000,000 19,289,000,000 22,677,000,000
Net Cash Flow from Continuing Operating Activities, Indirect 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000
Cash Generated from Operating Activities 6,517,000,000 3,797,000,000 4,236,000,000 2,592,000,000 5,748,000,000
Income/Loss before Non-Cash Adjustment 3,439,000,000 3,304,000,000 2,945,000,000 2,753,000,000 3,725,000,000
Total Adjustments for Non-Cash Items 3,439,000,000 3,304,000,000 2,945,000,000 2,753,000,000 3,725,000,000
Depreciation, Amortization and Depletion, Non-Cash
Adjustment 3,215,000,000 3,085,000,000 2,730,000,000 2,525,000,000 3,539,000,000
Depreciation and Amortization, Non-Cash Adjustment 224,000,000 219,000,000 215,000,000 228,000,000 186,000,000
Depreciation, Non-Cash Adjustment 3,954,000,000 3,874,000,000 3,803,000,000 3,745,000,000 3,223,000,000
Amortization, Non-Cash Adjustment 1,616,000,000 -1,287,000,000 379,000,000 1,100,000,000 1,670,000,000
Stock-Based Compensation, Non-Cash Adjustment -2,478,000,000 -2,158,000,000 -2,883,000,000 -4,751,000,000 -3,262,000,000
Taxes, Non-Cash Adjustment -2,478,000,000 -2,158,000,000 -2,883,000,000 -4,751,000,000 -3,262,000,000
Investment Income/Loss, Non-Cash Adjustment -14,000,000 64,000,000 -8,000,000 -255,000,000 392,000,000
Gain/Loss on Financial Instruments, Non-Cash Adjustment -2,225,000,000 2,806,000,000 -871,000,000 -1,233,000,000 1,702,000,000
Other Non-Cash Items -5,819,000,000 -2,409,000,000 -3,661,000,000 2,794,000,000 -5,445,000,000
Changes in Operating Capital -5,819,000,000 -2,409,000,000 -3,661,000,000 2,794,000,000 -5,445,000,000
Change in Trade and Other Receivables -399,000,000 -1,255,000,000 -199,000,000 7,000,000 -738,000,000
Change in Trade/Accounts Receivable 6,994,000,000 3,157,000,000 4,074,000,000 -4,956,000,000 6,938,000,000
Change in Other Current Assets 1,157,000,000 238,000,000 -130,000,000 -982,000,000 963,000,000
Change in Payables and Accrued Expenses 1,157,000,000 238,000,000 -130,000,000 -982,000,000 963,000,000
Change in Trade and Other Payables 5,837,000,000 2,919,000,000 4,204,000,000 -3,974,000,000 5,975,000,000
Change in Trade/Accounts Payable 368,000,000 272,000,000 -3,000,000 137,000,000 207,000,000
Change in Accrued Expenses -3,369,000,000 3,041,000,000 -1,082,000,000 785,000,000 740,000,000
Change in Deferred Assets/Liabilities
Change in Other Operating Capital
-11,016,000,000 -10,050,000,000 -9,074,000,000 -5,383,000,000 -7,281,000,000
Change in Prepayments and Deposits -11,016,000,000 -10,050,000,000 -9,074,000,000 -5,383,000,000 -7,281,000,000
Cash Flow from Investing Activities
Cash Flow from Continuing Investing Activities -6,383,000,000 -6,819,000,000 -5,496,000,000 -5,942,000,000 -5,479,000,000
-6,383,000,000 -6,819,000,000 -5,496,000,000 -5,942,000,000 -5,479,000,000
Purchase/Sale and Disposal of Property, Plant and Equipment,
Net
Purchase of Property, Plant and Equipment -385,000,000 -259,000,000 -308,000,000 -1,666,000,000 -370,000,000
Sale and Disposal of Property, Plant and Equipment -385,000,000 -259,000,000 -308,000,000 -1,666,000,000 -370,000,000
Purchase/Sale of Business, Net -4,348,000,000 -3,360,000,000 -3,293,000,000 2,195,000,000 -1,375,000,000
Purchase/Acquisition of Business -40,860,000,000 -35,153,000,000 -24,949,000,000 -37,072,000,000 -36,955,000,000
Purchase/Sale of Investments, Net
Purchase of Investments 36,512,000,000 31,793,000,000 21,656,000,000 39,267,000,000 35,580,000,000
100,000,000 388,000,000 23,000,000 30,000,000 -57,000,000
Sale of Investments
Other Investing Cash Flow -15,254,000,000
Purchase/Sale of Other Non-Current Assets, Net -16,511,000,000 -15,254,000,000 -15,991,000,000 -13,606,000,000 -9,270,000,000
Sales of Other Non-Current Assets -16,511,000,000 -12,610,000,000 -15,991,000,000 -13,606,000,000 -9,270,000,000
Cash Flow from Financing Activities -13,473,000,000 -12,610,000,000 -12,796,000,000 -11,395,000,000 -7,904,000,000
Cash Flow from Continuing Financing Activities 13,473,000,000 -12,796,000,000 -11,395,000,000 -7,904,000,000
Issuance of/Payments for Common Stock, Net -42,000,000
Payments for Common Stock 115,000,000 -42,000,000 -1,042,000,000 -37,000,000 -57,000,000
Proceeds from Issuance of Common Stock 115,000,000 6,350,000,000 -1,042,000,000 -37,000,000 -57,000,000
Issuance of/Repayments for Debt, Net 6,250,000,000 -6,392,000,000 6,699,000,000 900,000,000 0
Issuance of/Repayments for Long Term Debt, Net 6,365,000,000 -2,602,000,000 -7,741,000,000 -937,000,000 -57,000,000
Proceeds from Issuance of Long Term Debt
Repayments for Long Term Debt 2,923,000,000 -2,453,000,000 -2,184,000,000 -1,647,000,000
Proceeds from Issuance/Exercising of Stock Options/Warrants 0 300,000,000 10,000,000 3.38E+11
Other Financing Cash Flow
Cash and Cash Equivalents, End of Period
Change in Cash 20,945,000,000 23,719,000,000 23,630,000,000 26,622,000,000 26,465,000,000
Effect of Exchange Rate Changes 25930000000) 235000000000) -3,175,000,000 300,000,000 6,126,000,000
Cash and Cash Equivalents, Beginning of Period PAGE="$USD(181000000000)".XLS BRIN="$USD(146000000000)".XLS 183,000,000 -143,000,000 210,000,000
Cash Flow Supplemental Section $23,719,000,000,000.00 $26,622,000,000,000.00 $26,465,000,000,000.00 $20,129,000,000,000.00
Change in Cash as Reported, Supplemental 2,774,000,000 89,000,000 -2,992,000,000 6,336,000,000
Income Tax Paid, Supplemental 13,412,000,000 157,000,000
ZACHRY T WOOD -4990000000
Cash and Cash Equivalents, Beginning of Period
Department of the Treasury
Internal Revenue Service
Q4 2020 Q4 2019
Calendar Year
Due: 04/18/2022
Dec. 31, 2020 Dec. 31, 2019
USD in "000'"s
Repayments for Long Term Debt 182527 161857
Costs and expenses:
Cost of revenues 84732 71896
Research and development 27573 26018
Sales and marketing 17946 18464
General and administrative 11052 9551
European Commission fines 0 1697
Total costs and expenses 141303 127626
Income from operations 41224 34231
Other income (expense), net 6858000000 5394
Income before income taxes 22,677,000,000 19,289,000,000
Provision for income taxes 22,677,000,000 19,289,000,000
Net income 22,677,000,000 19,289,000,000
*include interest paid, capital obligation, and underweighting
Basic net income per share of Class A and B common stock
and Class C capital stock (in dollars par share)
Diluted net income per share of Class A and Class B common
stock and Class C capital stock (in dollars par share)
*include interest paid, capital obligation, and underweighting
Basic net income per share of Class A and B common stock
and Class C capital stock (in dollars par share)
Diluted net income per share of Class A and Class B common
stock and Class C capital stock (in dollars par share)
ALPHABET 88-1303491
5323 BRADFORD DR,
DALLAS, TX 75235-8314
Employee Info
United States Department of The Treasury
Employee Id: 9999999998 IRS No. 000000000000
INTERNAL REVENUE SERVICE, $20,210,418.00
PO BOX 1214, Rate Units Total YTD Taxes / Deductions Current YTD
CHARLOTTE, NC 28201-1214 - - $70,842,745,000.00 $70,842,745,000.00 Federal Withholding $0.00 $0.00
Earnings FICA - Social Security $0.00 $8,853.60
Commissions FICA - Medicare $0.00 $0.00
Employer Taxes
FUTA $0.00 $0.00
SUTA $0.00 $0.00
EIN: 61-1767ID91:900037305581 SSN: 633441725
YTD Gross Gross
$70,842,745,000.00 $70,842,745,000.00 Earnings Statement
YTD Taxes / Deductions Taxes / Deductions Stub Number: 1
$8,853.60 $0.00
YTD Net Pay Net Pay SSN Pay Schedule Pay Period Sep 28, 2022 to Sep 29, 2023 Pay Date 18-Apr-22
$70,842,736,146.40 $70,842,745,000.00 XXX-XX-1725 Annually
CHECK DATE CHECK NUMBER
18-Apr-22
****$70,842,745,000.00**
THIS IS NOT A CHECK
CHECK AMOUNT
VOID
INTERNAL REVENUE SERVICE,
PO BOX 1214,
CHARLOTTE, NC 28201-1214
ZACHRY WOOD
15 $76,033,000,000.00 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000 11,247,000,000 6,959,000,000 6,836,000,000 10,671,000,000 7,068,000,000
For Disclosure, Privacy Act, and Paperwork Reduction Act
Notice, see separate instructions. $76,033,000,000.00 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000 11,247,000,000 6,959,000,000 6,836,000,000 10,671,000,000 7,068,000,000
Cat. No. 11320B $76,033,000,000.00 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000 11,247,000,000 6,959,000,000 6,836,000,000 10,671,000,000 7,068,000,000
Form 1040 (2021) $76,033,000,000.00 20,642,000,000 18,936,000,000
Reported Normalized and Operating Income/Expense
Supplemental Section
Total Revenue as Reported, Supplemental $257,637,000,000.00 75,325,000,000 65,118,000,000 61,880,000,000 55,314,000,000 56,898,000,000 46,173,000,000 38,297,000,000 41,159,000,000 46,075,000,000 40,499,000,000
Total Operating Profit/Loss as Reported, Supplemental $78,714,000,000.00 21,885,000,000 21,031,000,000 19,361,000,000 16,437,000,000 15,651,000,000 11,213,000,000 6,383,000,000 7,977,000,000 9,266,000,000 9,177,000,000
Reported Effective Tax Rate $0.16 0.179 0.157 0.158 0.158 0.159 0.119 0.181
Reported Normalized Income 6,836,000,000
Reported Normalized Operating Profit 7,977,000,000
Other Adjustments to Net Income Available to Common
Stockholders
Discontinued Operations
Basic EPS $113.88 31.15 28.44 27.69 26.63 22.54 16.55 10.21 9.96 15.49 10.2
Basic EPS from Continuing Operations $113.88 31.12 28.44 27.69 26.63 22.46 16.55 10.21 9.96 15.47 10.2
Basic EPS from Discontinued Operations
Diluted EPS $112.20 30.69 27.99 27.26 26.29 22.3 16.4 10.13 9.87 15.35 10.12
Diluted EPS from Continuing Operations $112.20 30.67 27.99 27.26 26.29 22.23 16.4 10.13 9.87 15.33 10.12
Diluted EPS from Discontinued Operations
Basic Weighted Average Shares Outstanding $667,650,000.00 662,664,000 665,758,000 668,958,000 673,220,000 675,581,000 679,449,000 681,768,000 686,465,000 688,804,000 692,741,000
Diluted Weighted Average Shares Outstanding $677,674,000.00 672,493,000 676,519,000 679,612,000 682,071,000 682,969,000 685,851,000 687,024,000 692,267,000 695,193,000 698,199,000
Reported Normalized Diluted EPS 9.87
Basic EPS $113.88 31.15 28.44 27.69 26.63 22.54 16.55 10.21 9.96 15.49 10.2 1
Diluted EPS $112.20 30.69 27.99 27.26 26.29 22.3 16.4 10.13 9.87 15.35 10.12
Basic WASO $667,650,000.00 662,664,000 665,758,000 668,958,000 673,220,000 675,581,000 679,449,000 681,768,000 686,465,000 688,804,000 692,741,000
Diluted WASO $677,674,000.00 672,493,000 676,519,000 679,612,000 682,071,000 682,969,000 685,851,000 687,024,000 692,267,000 695,193,000 698,199,000
Fiscal year end September 28th., 2022. | USD
For Paperwork Reduction Act Notice, see the seperate
Instructions.
THIS NOTE IS LEGAL TENDER
TENDER
FOR ALL DEBTS, PUBLIC AND
PRIVATE
Current Value-on:
  push:
    branches: ["mainbranch]
  pull_request:
    branches: ["trunk"]

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Setup repo
        uses: actions/checkout@v3

      - name: Setup Deno
        # uses: denoland/setup-deno@v1
        uses: denoland/setup-deno@004814556e37c54a2f6e31384c9e18e983317366
        with:
          deno-version: v1.x

      # Uncomment this step to verify the use of 'deno fmt' on each commit.
      # - name: Verify formatting
      #   run: deno fmt --check

      - name: Run eslint
        run: deno.xml rendeerer
        <?xml version="1.0" encoding="us-ascii"?>
        <!--td {border: 1px solid #cccccc;}br {mso-data-placement:same-cell;}-->Based on facts as set forth in.65516550
The U.S. Internal Revenue Code of 1986, as amended, the Treasury Regulations promulgated thereunder, published pronouncements of the Internal Revenue Service, which may be cited or used as precedents, and case law, any of which may be changed at any time with retroactive effect. No opinion is expressed on any matters other than those specifically referred to above.
EMPLOYER IDENTIFICATION NUMBER: 61-1767920[DRAFT FORM OF TAX OPINION]ALPHABETZACHRY T WOOD5324 BRADFORD DRDALLAS TX 75235-8315ORIGINAL REPORTIncome, Rents, & RoyaltyINCOME STATEMENT61-176792088-1303491GOOGL_income-statement_Quarterly_As_Originally_ReportedTTMQ4 2022Q3 2022Q2 2022Q1 2022Q4 2021Q3 2021Q2 2021Q3 2021Gross Profit-2178236364-9195472727-16212709091-23229945455-30247181818-37264418182-44281654545-5129889090937497000000Total Revenue as Reported, Supplemental-1286309091-13385163636-25484018182-37582872727-49681727273-61780581818-73879436364-85978290909651180000001957800000-9776581818-21510963636-33245345455-44979727273-56714109091-68448490909-8018287272765118000000Other RevenueCost of Revenue-891927272.7418969090992713090911435292727319434545455245161636362959778181834679400000-27621000000Cost of Goods and Services-891927272.7418969090992713090911435292727319434545455245161636362959778181834679400000-27621000000Operating Income/Expenses-3640563636-882445454.5187567272746337909097391909091101500272731290814545515666263636-16466000000Selling, General and Administrative Expenses-1552200000-28945454.55149430909130175636364540818182606407272775873272739110581818-8772000000General and Administrative Expenses-544945454.523200000591345454.511594909091727636364229578181828639272733432072727-3256000000Selling and Marketing Expenses-1007254545-52145454.55902963636.418580727272813181818376829090947234000005678509091-5516000000Research and Development Expenses-2088363636-853500000381363636.416162272732851090909408595454553208181826555681818-7694000000Total Operating Profit/Loss-5818800000-10077918182-14337036364-18596154545-22855272727-27114390909-31373509091-3563262727321031000000Non-Operating Income/Expenses, Total-1369181818-2079000000-2788818182-3498636364-4208454545-4918272727-5628090909-63379090912033000000Total Net Finance Income/Expense464490909.1462390909.1460290909.1458190909.1456090909.1453990909.1451890909.1449790909.1310000000Net Interest Income/Expense464490909.1462390909.1460290909.1458190909.1456090909.1453990909.1451890909.1449790909.1310000000Interest Expense Net of Capitalized Interest48654545.456990000091145454.55112390909.1133636363.6154881818.2176127272.7197372727.3-77000000Interest Income415836363.6392490909.1369145454.5345800000322454545.5299109090.9275763636.4252418181.8387000000Net Investment Income-2096781818-2909109091-3721436364-4533763636-5346090909-6158418182-6970745455-77830727272207000000Gain/Loss on Investments and Other Financial Instruments-2243490909-3068572727-3893654545-4718736364-5543818182-6368900000-7193981818-80190636362158000000Income from Associates, Joint Ventures and Other Participating Interests99054545.4592609090.9186163636.3679718181.8273272727.2766827272.7360381818.1853936363.64188000000Gain/Loss on Foreign Exchange47654545.4566854545.4586054545.45105254545.5124454545.5143654545.5162854545.5182054545.5-139000000Irregular Income/Expenses00000Other Irregular Income/Expenses00000Other Income/Expense, Non-Operating263109090.9367718181.8472327272.7576936363.6681545454.5786154545.5890763636.4995372727.3-484000000Pretax Income-7187981818-12156918182-17125854545-22094790909-27063727273-32032663636-37001600000-4197053636423064000000Provision for Income Tax16952181822565754545343629090943068272735177363636604790000069184363647788972727-4128000000Net Income from Continuing Operations-5492763636-9591163636-13689563636-17787963636-21886363636-25984763636-30083163636-3418156363618936000000Net Income after Extraordinary Items and Discontinued Operations-5492763636-9591163636-13689563636-17787963636-21886363636-25984763636-30083163636-3418156363618936000000Net Income after Non-Controlling/Minority Interests-5492763636-9591163636-13689563636-17787963636-21886363636-25984763636-30083163636-3418156363618936000000Net Income Available to Common Stockholders-5492763636-9591163636-13689563636-17787963636-21886363636-25984763636-30083163636-3418156363618936000000Diluted Net Income Available to Common Stockholders-5492763636-9591163636-13689563636-17787963636-21886363636-25984763636-30083163636-3418156363618936000000Income Statement Supplemental SectionReported Normalized and Operating Income/Expense Supplemental SectionTotal Revenue as Reported, Supplemental-1286309091-13385163636-25484018182-37582872727-49681727273-61780581818-73879436364-8597829090965118000000Total Operating Profit/Loss as Reported, Supplemental-5818800000-10077918182-14337036364-18596154545-22855272727-27114390909-31373509091-3563262727321031000000Reported Effective Tax Rate1.1620.14366666670.13316666670.12266666670.10633333330.086833333330.179Reported Normalized IncomeReported Normalized Operating ProfitOther Adjustments to Net Income Available to Common StockholdersDiscontinued OperationsBasic EPS-8.742909091-14.93854545-21.13418182-27.32981818-33.52545455-39.72109091-45.91672727-52.1123636428.44Basic EPS from Continuing Operations-8.752545455-14.94781818-21.14309091-27.33836364-33.53363636-39.72890909-45.92418182-52.1194545528.44Basic EPS from Discontinued OperationsDiluted EPS-8.505636364-14.599-20.69236364-26.78572727-32.87909091-38.97245455-45.06581818-51.1591818227.99Diluted EPS from Continuing Operations-8.515636364-14.609-20.70236364-26.79572727-32.88909091-38.98245455-45.07581818-51.1691818227.99Diluted EPS from Discontinued OperationsBasic Weighted Average Shares Outstanding694313545.5697258863.6700204181.8703149500706094818.2709040136.4711985454.5714930772.7665758000Diluted Weighted Average Shares Outstanding698675981.8701033009.1703390036.4705747063.6708104090.9710461118.2712818145.5715175172.7676519000Reported Normalized Diluted EPSBasic EPS-8.742909091-14.93854545-21.13418182-27.32981818-33.52545455-39.72109091-45.91672727-52.1123636428.44Diluted EPS-8.505636364-14.599-20.69236364-26.78572727-32.87909091-38.97245455-45.06581818-51.1591818227.99Basic WASO694313545.5697258863.6700204181.8703149500706094818.2709040136.4711985454.5714930772.7665758000Diluted WASO698675981.8701033009.1703390036.4705747063.6708104090.9710461118.2712818145.5715175172.7676519000Fiscal year end September 28th., 2022. | USD]()
<!--Generated by Broadridge PROfile 22.7.2.5062 Broadridge-->
<link:linkbase xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.xbrl.org/2003/linkbase http://www.xbrl.org/2003/xbrl-linkbase-2003-12-31.xsd" xmlns:link="http://www.xbrl.org/2003/linkbase" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xbrli="http://www.xbrl.org/2003/instance">
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/netLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/net-2009-12-16.xsd#netLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedTotalLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedTotalLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedNetLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedNetLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedTerseLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedTerseLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedPeriodEndLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedPeriodEndLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedPeriodStartLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedPeriodStartLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedLabel" />
  <link:roleRef roleURI="http://zendesk.com./role/DocumentAndEntityInformation" xlink:type="simple" xlink:href="zen-20220919.xsd#DocumentAndEntityInformation" />
  <link:presentationLink xlink:type="extended" xlink:role="http://zendesk.com./role/DocumentAndEntityInformation">
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_CoverAbstract" xlink:label="CoverAbstract" xlink:title="CoverAbstract" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_DocumentType" xlink:label="DocumentType" xlink:title="DocumentType" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="DocumentType" xlink:title="presentation: CoverAbstract to DocumentType" order="0.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_AmendmentFlag" xlink:label="AmendmentFlag" xlink:title="AmendmentFlag" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="AmendmentFlag" xlink:title="presentation: CoverAbstract to AmendmentFlag" order="1.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_DocumentPeriodEndDate" xlink:label="DocumentPeriodEndDate" xlink:title="DocumentPeriodEndDate" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="DocumentPeriodEndDate" xlink:title="presentation: CoverAbstract to DocumentPeriodEndDate" order="2.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_DocumentFiscalYearFocus" xlink:label="DocumentFiscalYearFocus" xlink:title="DocumentFiscalYearFocus" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="DocumentFiscalYearFocus" xlink:title="presentation: CoverAbstract to DocumentFiscalYearFocus" order="3.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_DocumentFiscalPeriodFocus" xlink:label="DocumentFiscalPeriodFocus" xlink:title="DocumentFiscalPeriodFocus" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="DocumentFiscalPeriodFocus" xlink:title="presentation: CoverAbstract to DocumentFiscalPeriodFocus" order="4.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityFileNumber" xlink:label="EntityFileNumber" xlink:title="EntityFileNumber" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityFileNumber" xlink:title="presentation: CoverAbstract to EntityFileNumber" order="5.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityRegistrantName" xlink:label="EntityRegistrantName" xlink:title="EntityRegistrantName" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityRegistrantName" xlink:title="presentation: CoverAbstract to EntityRegistrantName" order="6.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityCentralIndexKey" xlink:label="EntityCentralIndexKey" xlink:title="EntityCentralIndexKey" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityCentralIndexKey" xlink:title="presentation: CoverAbstract to EntityCentralIndexKey" order="7.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityIncorporationStateCountryCode" xlink:label="EntityIncorporationStateCountryCode" xlink:title="EntityIncorporationStateCountryCode" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityIncorporationStateCountryCode" xlink:title="presentation: CoverAbstract to EntityIncorporationStateCountryCode" order="8.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityTaxIdentificationNumber" xlink:label="EntityTaxIdentificationNumber" xlink:title="EntityTaxIdentificationNumber" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityTaxIdentificationNumber" xlink:title="presentation: CoverAbstract to EntityTaxIdentificationNumber" order="9.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressAddressLine1" xlink:label="EntityAddressAddressLine1" xlink:title="EntityAddressAddressLine1" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressAddressLine1" xlink:title="presentation: CoverAbstract to EntityAddressAddressLine1" order="10.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressAddressLine2" xlink:label="EntityAddressAddressLine2" xlink:title="EntityAddressAddressLine2" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressAddressLine2" xlink:title="presentation: CoverAbstract to EntityAddressAddressLine2" order="11.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressAddressLine3" xlink:label="EntityAddressAddressLine3" xlink:title="EntityAddressAddressLine3" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressAddressLine3" xlink:title="presentation: CoverAbstract to EntityAddressAddressLine3" order="12.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressCityOrTown" xlink:label="EntityAddressCityOrTown" xlink:title="EntityAddressCityOrTown" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressCityOrTown" xlink:title="presentation: CoverAbstract to EntityAddressCityOrTown" order="13.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressStateOrProvince" xlink:label="EntityAddressStateOrProvince" xlink:title="EntityAddressStateOrProvince" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressStateOrProvince" xlink:title="presentation: CoverAbstract to EntityAddressStateOrProvince" order="14.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressCountry" xlink:label="EntityAddressCountry" xlink:title="EntityAddressCountry" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressCountry" xlink:title="presentation: CoverAbstract to EntityAddressCountry" order="15.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressPostalZipCode" xlink:label="EntityAddressPostalZipCode" xlink:title="EntityAddressPostalZipCode" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressPostalZipCode" xlink:title="presentation: CoverAbstract to EntityAddressPostalZipCode" order="16.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_CityAreaCode" xlink:label="CityAreaCode" xlink:title="CityAreaCode" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="CityAreaCode" xlink:title="presentation: CoverAbstract to CityAreaCode" order="17.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_LocalPhoneNumber" xlink:label="LocalPhoneNumber" xlink:title="LocalPhoneNumber" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="LocalPhoneNumber" xlink:title="presentation: CoverAbstract to LocalPhoneNumber" order="18.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_NoTradingSymbolFlag" xlink:label="NoTradingSymbolFlag" xlink:title="NoTradingSymbolFlag" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="NoTradingSymbolFlag" xlink:title="presentation: CoverAbstract to NoTradingSymbolFlag" order="19.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityEmergingGrowthCompany" xlink:label="EntityEmergingGrowthCompany" xlink:title="EntityEmergingGrowthCompany" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityEmergingGrowthCompany" xlink:title="presentation: CoverAbstract to EntityEmergingGrowthCompany" order="20.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_WrittenCommunications" xlink:label="WrittenCommunications" xlink:title="WrittenCommunications" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="WrittenCommunications" xlink:title="presentation: CoverAbstract to WrittenCommunications" order="21.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_SolicitingMaterial" xlink:label="SolicitingMaterial" xlink:title="SolicitingMaterial" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="SolicitingMaterial" xlink:title="presentation: CoverAbstract to SolicitingMaterial" order="22.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_PreCommencementTenderOffer" xlink:label="PreCommencementTenderOffer" xlink:title="PreCommencementTenderOffer" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="PreCommencementTenderOffer" xlink:title="presentation: CoverAbstract to PreCommencementTenderOffer" order="23.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_PreCommencementIssuerTenderOffer" xlink:label="PreCommencementIssuerTenderOffer" xlink:title="PreCommencementIssuerTenderOffer" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="PreCommencementIssuerTenderOffer" xlink:title="presentation: CoverAbstract to PreCommencementIssuerTenderOffer" order="24.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_Security12bTitle" xlink:label="Security12bTitle" xlink:title="Security12bTitle" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="Security12bTitle" xlink:title="presentation: CoverAbstract to Security12bTitle" order="25.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_TradingSymbol" xlink:label="TradingSymbol" xlink:title="TradingSymbol" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="TradingSymbol" xlink:title="presentation: CoverAbstract to TradingSymbol" order="26.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_SecurityExchangeName" xlink:label="SecurityExchangeName" xlink:title="SecurityExchangeName" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="SecurityExchangeName" xlink:title="presentation: CoverAbstract to SecurityExchangeName" order="27.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
  </link:presentationLink>
</link:linkbase>


      - name: Run tests
        run: deno tests=: stablized
        Mountain View, C.A. 94043
Taxable Maritial Status: Single
Exemptions/Allowances
TX: 28
Federal 941 Deposit Report
ADP
Report Range5/4/2022 - 6/4/2022 Local ID:
EIN: 63-3441725State ID: 633441725
Employee NAumboeurn:t3
Description 5/4/2022 - 6/4/2022
Payment Amount (Total) $9,246,754,678,763.00 Display All
1. Social Security (Employee + Employer) $26,661.80
2. Medicare (Employee + Employer) $861,193,422,444.20 Hourly
3. Federal Income Tax $8,385,561,229,657.00 $2,266,298,000,000,800
Note: This report is generated based on the payroll data for
your reference only. Please contact IRS office for special
cases such as late payment, previous overpayment, penalty
and others.
Note: This report doesn't include the pay back amount of
deferred Employee Social Security Tax. Commission
Employer Customized Report
ADP
Report Range5/4/2022 - 6/4/2022 88-1656496state ID: 633441725 State: All Local ID: 00037305581 $2,267,700.00
EIN:
Customized Report Amount
Employee Payment Report
ADP
Employee Number: 3
Description
Wages, Tips and Other Compensation $22,662,983,361,013.70 Report Range: Tips
Taxable SS Wages $215,014.49
Name:
SSN: $0.00
Taxable SS Tips $0 Payment Summary
Taxable Medicare Wages $22,662,983,361,013.70 Salary Vacation hourly OT
Advanced EIC Payment $0.00 $3,361,013.70
Federal Income Tax Withheld $8,385,561,229,657 Bonus $0.00 $0.00
Employee SS Tax Withheld $13,330.90 $0.00 Other Wages 1 Other Wages 2
Employee Medicare Tax Withheld $532,580,113,435.53 Total $0.00 $0.00
State Income Tax Withheld $0.00 $22,662,983,361,013.70
Local Income Tax Withheld
Customized Employer Tax Report $0.00 Deduction Summary
Description Amount Health Insurance
Employer SS Tax
Employer Medicare Tax $13,330.90 $0.00
Federal Unemployment Tax $328,613,309,008.67 Tax Summary
State Unemployment Tax $441.70 Federal Tax Total Tax
Customized Deduction Report $840 $8,385,561,229,657@3,330.90 Local Tax
Health Insurance $0.00
401K $0.00 Advanced EIC Payment $8,918,141,356,423.43
$0.00 $0.00 Total
401K
$0.00 $0.00
Social Security Tax Medicare TaxState Tax
$532,580,113,050)
3/6/2022 at 6:37 PM
Q4 2021 Q3 2021 Q2 2021 Q1 2021 Q4 2020
GOOGL_income￾statement_Quarterly_As_Originally_Reported 24,934,000,000 25,539,000,000 37,497,000,000 31,211,000,000 30,818,000,000
24,934,000,000 25,539,000,000 21,890,000,000 19,289,000,000 22,677,000,000
Cash Flow from Operating Activities, Indirect 24,934,000,000 25,539,000,000 21,890,000,000 19,289,000,000 22,677,000,000
Net Cash Flow from Continuing Operating Activities, Indirect 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000
Cash Generated from Operating Activities 6,517,000,000 3,797,000,000 4,236,000,000 2,592,000,000 5,748,000,000
Income/Loss before Non-Cash Adjustment 3,439,000,000 3,304,000,000 2,945,000,000 2,753,000,000 3,725,000,000
Total Adjustments for Non-Cash Items 3,439,000,000 3,304,000,000 2,945,000,000 2,753,000,000 3,725,000,000
Depreciation, Amortization and Depletion, Non-Cash
Adjustment 3,215,000,000 3,085,000,000 2,730,000,000 2,525,000,000 3,539,000,000
Depreciation and Amortization, Non-Cash Adjustment 224,000,000 219,000,000 215,000,000 228,000,000 186,000,000
Depreciation, Non-Cash Adjustment 3,954,000,000 3,874,000,000 3,803,000,000 3,745,000,000 3,223,000,000
Amortization, Non-Cash Adjustment 1,616,000,000 -1,287,000,000 379,000,000 1,100,000,000 1,670,000,000
Stock-Based Compensation, Non-Cash Adjustment -2,478,000,000 -2,158,000,000 -2,883,000,000 -4,751,000,000 -3,262,000,000
Taxes, Non-Cash Adjustment -2,478,000,000 -2,158,000,000 -2,883,000,000 -4,751,000,000 -3,262,000,000
Investment Income/Loss, Non-Cash Adjustment -14,000,000 64,000,000 -8,000,000 -255,000,000 392,000,000
Gain/Loss on Financial Instruments, Non-Cash Adjustment -2,225,000,000 2,806,000,000 -871,000,000 -1,233,000,000 1,702,000,000
Other Non-Cash Items -5,819,000,000 -2,409,000,000 -3,661,000,000 2,794,000,000 -5,445,000,000
Changes in Operating Capital -5,819,000,000 -2,409,000,000 -3,661,000,000 2,794,000,000 -5,445,000,000
Change in Trade and Other Receivables -399,000,000 -1,255,000,000 -199,000,000 7,000,000 -738,000,000
Change in Trade/Accounts Receivable 6,994,000,000 3,157,000,000 4,074,000,000 -4,956,000,000 6,938,000,000
Change in Other Current Assets 1,157,000,000 238,000,000 -130,000,000 -982,000,000 963,000,000
Change in Payables and Accrued Expenses 1,157,000,000 238,000,000 -130,000,000 -982,000,000 963,000,000
Change in Trade and Other Payables 5,837,000,000 2,919,000,000 4,204,000,000 -3,974,000,000 5,975,000,000
Change in Trade/Accounts Payable 368,000,000 272,000,000 -3,000,000 137,000,000 207,000,000
Change in Accrued Expenses -3,369,000,000 3,041,000,000 -1,082,000,000 785,000,000 740,000,000
Change in Deferred Assets/Liabilities
Change in Other Operating Capital
-11,016,000,000 -10,050,000,000 -9,074,000,000 -5,383,000,000 -7,281,000,000
Change in Prepayments and Deposits -11,016,000,000 -10,050,000,000 -9,074,000,000 -5,383,000,000 -7,281,000,000
Cash Flow from Investing Activities
Cash Flow from Continuing Investing Activities -6,383,000,000 -6,819,000,000 -5,496,000,000 -5,942,000,000 -5,479,000,000
-6,383,000,000 -6,819,000,000 -5,496,000,000 -5,942,000,000 -5,479,000,000
Purchase/Sale and Disposal of Property, Plant and Equipment,
Net
Purchase of Property, Plant and Equipment -385,000,000 -259,000,000 -308,000,000 -1,666,000,000 -370,000,000
Sale and Disposal of Property, Plant and Equipment -385,000,000 -259,000,000 -308,000,000 -1,666,000,000 -370,000,000
Purchase/Sale of Business, Net -4,348,000,000 -3,360,000,000 -3,293,000,000 2,195,000,000 -1,375,000,000
Purchase/Acquisition of Business -40,860,000,000 -35,153,000,000 -24,949,000,000 -37,072,000,000 -36,955,000,000
Purchase/Sale of Investments, Net
Purchase of Investments 36,512,000,000 31,793,000,000 21,656,000,000 39,267,000,000 35,580,000,000
100,000,000 388,000,000 23,000,000 30,000,000 -57,000,000
Sale of Investments
Other Investing Cash Flow -15,254,000,000
Purchase/Sale of Other Non-Current Assets, Net -16,511,000,000 -15,254,000,000 -15,991,000,000 -13,606,000,000 -9,270,000,000
Sales of Other Non-Current Assets -16,511,000,000 -12,610,000,000 -15,991,000,000 -13,606,000,000 -9,270,000,000
Cash Flow from Financing Activities -13,473,000,000 -12,610,000,000 -12,796,000,000 -11,395,000,000 -7,904,000,000
Cash Flow from Continuing Financing Activities 13,473,000,000 -12,796,000,000 -11,395,000,000 -7,904,000,000
Issuance of/Payments for Common Stock, Net -42,000,000
Payments for Common Stock 115,000,000 -42,000,000 -1,042,000,000 -37,000,000 -57,000,000
Proceeds from Issuance of Common Stock 115,000,000 6,350,000,000 -1,042,000,000 -37,000,000 -57,000,000
Issuance of/Repayments for Debt, Net 6,250,000,000 -6,392,000,000 6,699,000,000 900,000,000 0
Issuance of/Repayments for Long Term Debt, Net 6,365,000,000 -2,602,000,000 -7,741,000,000 -937,000,000 -57,000,000
Proceeds from Issuance of Long Term Debt
Repayments for Long Term Debt 2,923,000,000 -2,453,000,000 -2,184,000,000 -1,647,000,000
Proceeds from Issuance/Exercising of Stock Options/Warrants 0 300,000,000 10,000,000 3.38E+11
Other Financing Cash Flow
Cash and Cash Equivalents, End of Period
Change in Cash 20,945,000,000 23,719,000,000 23,630,000,000 26,622,000,000 26,465,000,000
Effect of Exchange Rate Changes 25930000000) 235000000000) -3,175,000,000 300,000,000 6,126,000,000
Cash and Cash Equivalents, Beginning of Period PAGE="$USD(181000000000)".XLS BRIN="$USD(146000000000)".XLS 183,000,000 -143,000,000 210,000,000
Cash Flow Supplemental Section $23,719,000,000,000.00 $26,622,000,000,000.00 $26,465,000,000,000.00 $20,129,000,000,000.00
Change in Cash as Reported, Supplemental 2,774,000,000 89,000,000 -2,992,000,000 6,336,000,000
Income Tax Paid, Supplemental 13,412,000,000 157,000,000
ZACHRY T WOOD -4990000000
Cash and Cash Equivalents, Beginning of Period
Department of the Treasury
Internal Revenue Service
Q4 2020 Q4 2019
Calendar Year
Due: 04/18/2022
Dec. 31, 2020 Dec. 31, 2019
USD in "000'"s
Repayments for Long Term Debt 182527 161857
Costs and expenses:
Cost of revenues 84732 71896
Research and development 27573 26018
Sales and marketing 17946 18464
General and administrative 11052 9551
European Commission fines 0 1697
Total costs and expenses 141303 127626
Income from operations 41224 34231
Other income (expense), net 6858000000 5394
Income before income taxes 22,677,000,000 19,289,000,000
Provision for income taxes 22,677,000,000 19,289,000,000
Net income 22,677,000,000 19,289,000,000
*include interest paid, capital obligation, and underweighting
Basic net income per share of Class A and B common stock
and Class C capital stock (in dollars par share)
Diluted net income per share of Class A and Class B common
stock and Class C capital stock (in dollars par share)
*include interest paid, capital obligation, and underweighting
Basic net income per share of Class A and B common stock
and Class C capital stock (in dollars par share)
Diluted net income per share of Class A and Class B common
stock and Class C capital stock (in dollars par share)
ALPHABET 88-1303491
5323 BRADFORD DR,
DALLAS, TX 75235-8314
Employee Info
United States Department of The Treasury
Employee Id: 9999999998 IRS No. 000000000000
INTERNAL REVENUE SERVICE, $20,210,418.00
PO BOX 1214, Rate Units Total YTD Taxes / Deductions Current YTD
CHARLOTTE, NC 28201-1214 - - $70,842,745,000.00 $70,842,745,000.00 Federal Withholding $0.00 $0.00
Earnings FICA - Social Security $0.00 $8,853.60
Commissions FICA - Medicare $0.00 $0.00
Employer Taxes
FUTA $0.00 $0.00
SUTA $0.00 $0.00
EIN: 61-1767ID91:900037305581 SSN: 633441725
YTD Gross Gross
$70,842,745,000.00 $70,842,745,000.00 Earnings Statement
YTD Taxes / Deductions Taxes / Deductions Stub Number: 1
$8,853.60 $0.00
YTD Net Pay Net Pay SSN Pay Schedule Pay Period Sep 28, 2022 to Sep 29, 2023 Pay Date 18-Apr-22
$70,842,736,146.40 $70,842,745,000.00 XXX-XX-1725 Annually
CHECK DATE CHECK NUMBER
18-Apr-22
****$70,842,745,000.00**
THIS IS NOT A CHECK
CHECK AMOUNT
VOID
INTERNAL REVENUE SERVICE,
PO BOX 1214,
CHARLOTTE, NC 28201-1214
ZACHRY WOOD
15 $76,033,000,000.00 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000 11,247,000,000 6,959,000,000 6,836,000,000 10,671,000,000 7,068,000,000
For Disclosure, Privacy Act, and Paperwork Reduction Act
Notice, see separate instructions. $76,033,000,000.00 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000 11,247,000,000 6,959,000,000 6,836,000,000 10,671,000,000 7,068,000,000
Cat. No. 11320B $76,033,000,000.00 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000 11,247,000,000 6,959,000,000 6,836,000,000 10,671,000,000 7,068,000,000
Form 1040 (2021) $76,033,000,000.00 20,642,000,000 18,936,000,000
Reported Normalized and Operating Income/Expense
Supplemental Section
Total Revenue as Reported, Supplemental $257,637,000,000.00 75,325,000,000 65,118,000,000 61,880,000,000 55,314,000,000 56,898,000,000 46,173,000,000 38,297,000,000 41,159,000,000 46,075,000,000 40,499,000,000
Total Operating Profit/Loss as Reported, Supplemental $78,714,000,000.00 21,885,000,000 21,031,000,000 19,361,000,000 16,437,000,000 15,651,000,000 11,213,000,000 6,383,000,000 7,977,000,000 9,266,000,000 9,177,000,000
Reported Effective Tax Rate $0.16 0.179 0.157 0.158 0.158 0.159 0.119 0.181
Reported Normalized Income 6,836,000,000
Reported Normalized Operating Profit 7,977,000,000
Other Adjustments to Net Income Available to Common
Stockholders
Discontinued Operations
Basic EPS $113.88 31.15 28.44 27.69 26.63 22.54 16.55 10.21 9.96 15.49 10.2
Basic EPS from Continuing Operations $113.88 31.12 28.44 27.69 26.63 22.46 16.55 10.21 9.96 15.47 10.2
Basic EPS from Discontinued Operations
Diluted EPS $112.20 30.69 27.99 27.26 26.29 22.3 16.4 10.13 9.87 15.35 10.12
Diluted EPS from Continuing Operations $112.20 30.67 27.99 27.26 26.29 22.23 16.4 10.13 9.87 15.33 10.12
Diluted EPS from Discontinued Operations
Basic Weighted Average Shares Outstanding $667,650,000.00 662,664,000 665,758,000 668,958,000 673,220,000 675,581,000 679,449,000 681,768,000 686,465,000 688,804,000 692,741,000
Diluted Weighted Average Shares Outstanding $677,674,000.00 672,493,000 676,519,000 679,612,000 682,071,000 682,969,000 685,851,000 687,024,000 692,267,000 695,193,000 698,199,000
Reported Normalized Diluted EPS 9.87
Basic EPS $113.88 31.15 28.44 27.69 26.63 22.54 16.55 10.21 9.96 15.49 10.2 1
Diluted EPS $112.20 30.69 27.99 27.26 26.29 22.3 16.4 10.13 9.87 15.35 10.12
Basic WASO $667,650,000.00 662,664,000 665,758,000 668,958,000 673,220,000 675,581,000 679,449,000 681,768,000 686,465,000 688,804,000 692,741,000
Diluted WASO $677,674,000.00 672,493,000 676,519,000 679,612,000 682,071,000 682,969,000 685,851,000 687,024,000 692,267,000 695,193,000 698,199,000
￼￼

We'll be back shortly.

For real-time updates, follow @ChaseSupport on Twitter.

Our advisors are available weekdays, 7 AM to 9 PM ET, and Saturdays from 8 AM to 5 PM ET.


Telephone bankers may be able to access some account information while our site is unavailable.

You can reach them at one of the numbers below:

Person Checking, Savings & CD1-800-935-9935Mortgages1-800-848-9136Business Banking1-800-242-7338Auto Loans & Leases1-800-336-6675Home Equity Line of Credit Loans1-800-836-5656Student Loans1-800-487-4404Retirement self-directed Accounts1-800-776-6061J.P.Morgan Securities1-888-807-6898Chase private Client
(or contact your Private Client
Banker)1-888-994-5626Investments/Retirement1-800-392-5749Credit CardsCall the number on the back of your credit cardChase Commercial OnlineSMCall your Client Service Professional or Client Service Officer

---------- Forwarded message ----------
From: ZACHRY WOOD <zachryiixixiiwood@gmail.com>
To: Amazon News <amazonnews@about.amazon.com>
Cc: 
Bcc: 
Date: Wed, 5 Oct 2022 15:27:04 -0500
Subject: Re: Prime members can now get Same-Day Delivery from local retailers
----- Message truncated -----

￼

ZACHRY WOOD

3:38 PM (1 minute ago)

￼

￼

to Mail

￼

Alphabet Inc., co. 1600 Ampihtheatre pkwy bldg .#41 MOUNTAIN VIEW, C.A. 94043-1315			✓	CORRECTED (if checked)						 PAYER'S name, street address, city or town, state or foreign postal code, and telephone no.			province, country, ZIP					OMB No. 1545-0116		 								21	Nonemployee Compensation	 								Form 1099-NEC		 PAYER'S TIN		RECIPIENT'S TIN				1 Nonemployee compensation				 46-4707224		633-44-1725			2.57637E+11			-2.58E+11		 										 RECIPIENT'S name, street address, city or town, state or province. country, and ZIP or foregnpostdcode 					2 Payer made direct sales totaling $5,000 or more of consumer products to recipient for resale					 										 										 					3					 										 					4 Federal income tax withheld					 					5 State tax withheld $267537000000		6 State;PayerS state no. 48			 Account number (see instructions)										 										 					S					 Form 1099-NEC										 (keep for 										 your records)				www.irs.gov/Form1099NEC			Department of the Treasury - Internal Revenue Service			 										 	ALPHABET 88-1303491									 	5323 BRADFORD DR,									 	DALLAS, TX 75235-8314									 										 		co.								 			FILE		DEPT. 		CLOCK NUMBER 		62	 		2R6 	000135 0001 00				39524		1	Earnings Statement 							SEQ 000361			Period Beginning: 										 	ALPHABET 5323 BRADFORD DRIVE DALLAS, TX 75235-8313									Period Ending: Pay Date: 		Taxable Marital Status: Single								ZACHRY WOOD 									5323	BRADFORD DRIVE 		Exemptions/Allowances:								DALLAS TX 75246 										 		Federal:			4					Other Benefits and 		TX.				No State Income Tax				 										 										 Earnings				rate		hours		this period	year to date	 										Information 									5732.92	 Regular		12 .0000				80		960		Totl Hrs Worked 									142.38	 Overtll ne		18				2.65		47.7		 								1 ,462.70	6656.75	Important Notes Tips									12532.05	COMPANY PH#:(214) 253 		Gross pay						2470.4		 Deductions		Statutory 							757.02	BASIS OF PAY: HOURLY 										 		Federal Income Tax					-192.56			 		Social Security Tax					-153.17		776.99	 									181 .71	 		Medicare Tax					-35.82			 		Other							6656.75	 		Tips					-1 ,462.70			 		Tip Share							-3927	 		Adjustment								 		Tip Share					816			 		Net Pay					$1 ,442.15			 							$1 .442,15			 		Net Check								 		Your federal taxable wages this period are								 		2470.4								 										 INTERNAL REVENUE SERVICE,										 PO BOX 1214,										 CHARLOTTE, NC 28201-1214										 										 YTD Gross		Gross								 70842745000		70842745000								 YTD Taxes / Deductions		Taxes / Deductions								 8853.6		0								 YTD Net Pay		Net Pay								 70842736146		70842745000								 CHECK DATE		CHECK NUMBER								 										 										 										 0.455555556										 										 										 Cash and Cash Equivalents, Beginning of Period										 								-4990000000		 										 12 Months Ended										 _________________________________________________________										 					Q4 2020			Q4 2019		 Income Statement 										 USD in "000'"s										 Repayments for Long Term Debt					Dec. 31, 2020			Dec. 31, 20193021343159562092479
:Build and Deploy::
indexv5'@resources/modules |python logo Python » 

English

3.10.7
 3.10.7 Documentation »
Quick search
  |
Python 3.10.7 documentation
Welcome! This is the official documentation for Python 3.10.7.

Parts of the documentation:

What's new in Python 3.10?
or all "What's new" documents since 2.0

Tutorial
start here

Library Reference
keep this under your pillow

Language Reference
describes syntax and language elements

Python Setup and Usage
how to use Python on different platforms

Python HOWTOs
in-depth documents on specific topics

Installing Python Modules
installing from the Python Package Index & other sources

Distributing Python Modules
publishing modules for installation by others

Extending and Embedding
tutorial for C/C++ programmers

Python/C API
reference for C/C++ programmers

FAQs
frequently asked questions (with answers!)

Indices and tables:

Global Module Index
quick access to all modules

General Index
all functions, classes, terms

Glossary
the most important terms explained

Search page
search this documentation

Complete Table of Contents
lists all sections and subsections

Meta information:

Reporting bugs

Contributing to Docs

About the documentation

History and License of Python

Copyright

Download
Download these documents

Docs by version
Python 3.12 (in development)
Python 3.11 (pre-release)
Python 3.10 (stable)
Python 3.9 (security-fixes)
Python 3.8 (security-fixes)
Python 3.7 (security-fixes)
Python 3.6 (EOL)
Python 3.5 (EOL)
Python 2.7 (EOL)
All versions
Other resources
PEP Index
Beginner's Guide
Book List
Audio/Visual Talks
Python Developer’s Guide
«
indexmodules |python logo Python » 

English

3.10.7
 3.10.7 Documentation »
Quick search
  |
© Copyright 2001-2022, Python Software Foundation.
This page is licensed under the Python Software Foundation License Version 2.
Examples, recipes, and other code in the documentation are additionally licensed under the Zero Clause BSD License.
See History and License for more information.

The Python Software Foundation is a non-profit corporation. Please donate.

Last updated on Oct 04, 2022. Found a bug?
Created using Sphinx 3.4.3.
:Build:: build_scripts :Name :
Name :CONSTRUCTION :Mountain View, C.A. 94043
Taxable Maritial Status: Single
Exemptions/Allowances
TX: 28
Federal 941 Deposit Report
ADP
Report Range5/4/2022 - 6/4/2022 Local ID:
EIN: 63-3441725State ID: 633441725
Employee NAumboeurn:t3
Description 5/4/2022 - 6/4/2022
Payment Amount (Total) $9,246,754,678,763.00 Display All
1. Social Security (Employee + Employer) $26,661.80
2. Medicare (Employee + Employer) $861,193,422,444.20 Hourly
3. Federal Income Tax $8,385,561,229,657.00 $2,266,298,000,000,800

****$70,842,745,000.00**

<!--Generated by Broadridge PROfile 22.7.2.5062 Broadridge-->
<link:linkbase xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.xbrl.org/2003/linkbase http://www.xbrl.org/2003/xbrl-linkbase-2003-12-31.xsd" xmlns:link="http://www.xbrl.org/2003/linkbase" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xbrli="http://www.xbrl.org/2003/instance">
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/netLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/net-2009-12-16.xsd#netLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedTotalLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedTotalLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedNetLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedNetLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedTerseLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedTerseLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedPeriodEndLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedPeriodEndLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedPeriodStartLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedPeriodStartLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedLabel" />
  <link:roleRef roleURI="http://zendesk.com./role/DocumentAndEntityInformation" xlink:type="simple" xlink:href="zen-20220919.xsd#DocumentAndEntityInformation" />
  <link:presentationLink xlink:type="extended" xlink:role="http://zendesk.com./role/DocumentAndEntityInformation">
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_CoverAbstract" xlink:label="CoverAbstract" xlink:title="CoverAbstract" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_DocumentType" xlink:label="DocumentType" xlink:title="DocumentType" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="DocumentType" xlink:title="presentation: CoverAbstract to DocumentType" order="0.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_AmendmentFlag" xlink:label="AmendmentFlag" xlink:title="AmendmentFlag" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="AmendmentFlag" xlink:title="presentation: CoverAbstract to AmendmentFlag" order="1.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_DocumentPeriodEndDate" xlink:label="DocumentPeriodEndDate" xlink:title="DocumentPeriodEndDate" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="DocumentPeriodEndDate" xlink:title="presentation: CoverAbstract to DocumentPeriodEndDate" order="2.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_DocumentFiscalYearFocus" xlink:label="DocumentFiscalYearFocus" xlink:title="DocumentFiscalYearFocus" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="DocumentFiscalYearFocus" xlink:title="presentation: CoverAbstract to DocumentFiscalYearFocus" order="3.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_DocumentFiscalPeriodFocus" xlink:label="DocumentFiscalPeriodFocus" xlink:title="DocumentFiscalPeriodFocus" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="DocumentFiscalPeriodFocus" xlink:title="presentation: CoverAbstract to DocumentFiscalPeriodFocus" order="4.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityFileNumber" xlink:label="EntityFileNumber" xlink:title="EntityFileNumber" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityFileNumber" xlink:title="presentation: CoverAbstract to EntityFileNumber" order="5.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityRegistrantName" xlink:label="EntityRegistrantName" xlink:title="EntityRegistrantName" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityRegistrantName" xlink:title="presentation: CoverAbstract to EntityRegistrantName" order="6.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityCentralIndexKey" xlink:label="EntityCentralIndexKey" xlink:title="EntityCentralIndexKey" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityCentralIndexKey" xlink:title="presentation: CoverAbstract to EntityCentralIndexKey" order="7.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityIncorporationStateCountryCode" xlink:label="EntityIncorporationStateCountryCode" xlink:title="EntityIncorporationStateCountryCode" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityIncorporationStateCountryCode" xlink:title="presentation: CoverAbstract to EntityIncorporationStateCountryCode" order="8.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityTaxIdentificationNumber" xlink:label="EntityTaxIdentificationNumber" xlink:title="EntityTaxIdentificationNumber" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityTaxIdentificationNumber" xlink:title="presentation: CoverAbstract to EntityTaxIdentificationNumber" order="9.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressAddressLine1" xlink:label="EntityAddressAddressLine1" xlink:title="EntityAddressAddressLine1" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressAddressLine1" xlink:title="presentation: CoverAbstract to EntityAddressAddressLine1" order="10.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressAddressLine2" xlink:label="EntityAddressAddressLine2" xlink:title="EntityAddressAddressLine2" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressAddressLine2" xlink:title="presentation: CoverAbstract to EntityAddressAddressLine2" order="11.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressAddressLine3" xlink:label="EntityAddressAddressLine3" xlink:title="EntityAddressAddressLine3" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressAddressLine3" xlink:title="presentation: CoverAbstract to EntityAddressAddressLine3" order="12.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressCityOrTown" xlink:label="EntityAddressCityOrTown" xlink:title="EntityAddressCityOrTown" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressCityOrTown" xlink:title="presentation: CoverAbstract to EntityAddressCityOrTown" order="13.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressStateOrProvince" xlink:label="EntityAddressStateOrProvince" xlink:title="EntityAddressStateOrProvince" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressStateOrProvince" xlink:title="presentation: CoverAbstract to EntityAddressStateOrProvince" order="14.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressCountry" xlink:label="EntityAddressCountry" xlink:title="EntityAddressCountry" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressCountry" xlink:title="presentation: CoverAbstract to EntityAddressCountry" order="15.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressPostalZipCode" xlink:label="EntityAddressPostalZipCode" xlink:title="EntityAddressPostalZipCode" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressPostalZipCode" xlink:title="presentation: CoverAbstract to EntityAddressPostalZipCode" order="16.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_CityAreaCode" xlink:label="CityAreaCode" xlink:title="CityAreaCode" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="CityAreaCode" xlink:title="presentation: CoverAbstract to CityAreaCode" order="17.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_LocalPhoneNumber" xlink:label="LocalPhoneNumber" xlink:title="LocalPhoneNumber" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="LocalPhoneNumber" xlink:title="presentation: CoverAbstract to LocalPhoneNumber" order="18.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_NoTradingSymbolFlag" xlink:label="NoTradingSymbolFlag" xlink:title="NoTradingSymbolFlag" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="NoTradingSymbolFlag" xlink:title="presentation: CoverAbstract to NoTradingSymbolFlag" order="19.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityEmergingGrowthCompany" xlink:label="EntityEmergingGrowthCompany" xlink:title="EntityEmergingGrowthCompany" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityEmergingGrowthCompany" xlink:title="presentation: CoverAbstract to EntityEmergingGrowthCompany" order="20.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_WrittenCommunications" xlink:label="WrittenCommunications" xlink:title="WrittenCommunications" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="WrittenCommunications" xlink:title="presentation: CoverAbstract to WrittenCommunications" order="21.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_SolicitingMaterial" xlink:label="SolicitingMaterial" xlink:title="SolicitingMaterial" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="SolicitingMaterial" xlink:title="presentation: CoverAbstract to SolicitingMaterial" order="22.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_PreCommencementTenderOffer" xlink:label="PreCommencementTenderOffer" xlink:title="PreCommencementTenderOffer" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="PreCommencementTenderOffer" xlink:title="presentation: CoverAbstract to PreCommencementTenderOffer" order="23.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_PreCommencementIssuerTenderOffer" xlink:label="PreCommencementIssuerTenderOffer" xlink:title="PreCommencementIssuerTenderOffer" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="PreCommencementIssuerTenderOffer" xlink:title="presentation: CoverAbstract to PreCommencementIssuerTenderOffer" order="24.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_Security12bTitle" xlink:label="Security12bTitle" xlink:title="Security12bTitle" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="Security12bTitle" xlink:title="presentation: CoverAbstract to Security12bTitle" order="25.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_TradingSymbol" xlink:label="TradingSymbol" xlink:title="TradingSymbol" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="TradingSymbol" xlink:title="presentation: CoverAbstract to TradingSymbol" order="26.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_SecurityExchangeName" xlink:label="SecurityExchangeName" xlink:title="SecurityExchangeName" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="SecurityExchangeName" xlink:title="presentation: CoverAbstract to SecurityExchangeName" order="27.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
  </link:presentationLink>
</link:linkbase>


      - name: Run tests
        run: deno tests=: stablized
        Mountain View, C.A. 94043
Taxable Maritial Status: Single
Exemptions/Allowances
TX: 28
Federal 941 Deposit Report
ADP
Report Range5/4/2022 - 6/4/2022 Local ID:
EIN: 63-3441725State ID: 633441725
Employee NAumboeurn:t3
Description 5/4/2022 - 6/4/2022
Payment Amount (Total) $9,246,754,678,763.00 Display All
1. Social Security (Employee + Employer) $26,661.80
2. Medicare (Employee + Employer) $861,193,422,444.20 Hourly
3. Federal Income Tax $8,385,561,229,657.00 $2,266,298,000,000,800

****$70,842,745,000.00**

￼￼

We'll be back shortly.

For real-time updates, follow @ChaseSupport on Twitter.

Our advisors are available weekdays, 7 AM to 9 PM ET, and Saturdays from 8 AM to 5 PM ET.


Telephone bankers may be able to access some account information while our site is unavailable.

You can reach them at one of the numbers below:

Person Checking, Savings & CD1-800-935-9935Mortgages1-800-848-9136Business Banking1-800-242-7338Auto Loans & Leases1-800-336-6675Home Equity Line of Credit Loans1-800-836-5656Student Loans1-800-487-4404Retirement self-directed Accounts1-800-776-6061J.P.Morgan Securities1-888-807-6898Chase private Client
(or contact your Private Client
Banker)1-888-994-5626Investments/Retirement1-800-392-5749Credit CardsCall the number on the back of your credit cardChase Commercial OnlineSMCall your Client Service Professional or Client Service Officer

## ******** NSkip to content

Pull requestsIssues

Marketplace

Explore

 

￼ 

Your account has been flagged.

Because of that, your profile is hidden from the public. If you believe this is a mistake, contact support to have your account status reviewed.

github/docsPublic

Edit Pins 

 Watch 1.8k 

Fork 57k

 Starred 11.6k

Code

Issues90

Pull requests90

Discussions

Actions

Projects3

Security

Insights

 Code

github.com #2109

 Closed

Analyn-bot wants to merge 3 commits into github:main from Analyn-bot:main

+115 −0 

 Conversation 1 Commits 3 Checks 21 Files changed 2

 Closed



@@ -0,0 +1,67 @@# For most projects, this workflow file will not need changing; you simply need# to commit it to your repository.## You may wish to alter this file to override the set of languages analyzed,# or to provide custom queries or build logic.## ******** NOTE ********# We have attempted to detect the languages in your repository. Please check# the `language` matrix defined below to confirm you have the correct set of# supported CodeQL languages.#name: "CodeQL"
on: push: branches: [ main ] pull_request: # The branches below must be a subset of the branches above branches: [ main ] schedule: - cron: '23 3 * * 2'
jobs: analyze: name: Analyze runs-on: ubuntu-latest
strategy: fail-fast: false matrix: language: [ 'javascript' ] # CodeQL supports [ 'cpp', 'csharp', 'go', 'java', 'javascript', 'python' ] # Learn more: # https://docs.github.com/en/free-pro-team@latest/github/finding-security-vulnerabilities-and-errors-in-your-code/configuring-code-scanning#changing-the-languages-that-are-analyzed
steps: - name: Checkout repository uses: actions/checkout@v2
# Initializes the CodeQL tools for scanning. - name: Initialize CodeQL uses: github/codeql-action/init@v1 with: languages: ${{ matrix.language }} # If you wish to specify custom queries, you can do so here or in a config file. # By default, queries listed here will override any specified in a config file. # Prefix the list here with "+" to use these queries and those in the config file. # queries: ./path/to/local/query, your-org/your-repo/queries@main
# Autobuild attempts to build any compiled languages (C/C++, C#, or Java). # If this step fails, then you should remove it and run the build manually (see below) - name: Autobuild uses: github/codeql-action/autobuild@v1
# ℹ️
OTE ********# We have attempted to detect the languages in your repository. Please check# the `langua":'" m"a"trix defin" to confirm you have the correct set of# supported CodeQL languages.#name: "CodeQN"
on: push: branches: [ main ] pull_request: # The branches below must be a subset of the branches above branches: [ main ] schedule: - cron: '23 3 * * 2'
jobs: analyze: name: Analyze runs-on: ubuntu-latest
strategy: fail-fast: false matrix: language: [ 'javascript' ] # CodeQL supports [ 'cpp', 'csharp', 'go', 'java', 'javascript', 'python' ] # Learn more: # https://docs.github.com/en/free-pro-team@latest/github/finding-security-vulnerabilities-and-errors-in-your-code/configuring-code-scanning#changing-the-languages-that-are-analyzed
steps: - name: Checkout repository uses: actions/checkout@v2
# Initializes the CodeQL tools for scanning. - name: Initialize CodeQL uses: github/codeql-action/init@v1 with: languages: ${{ matrix.language }} # If you wish to specify custom queries, you can do so here or in a config file. # By default, queries listed here will override any specified in a config file. # Prefix the list here with "+" to use these queries and those in the config file. # queries: ./path/to/local/query, your-org/your-repo/queries@main
# Autobuild attempts to build any compiled languages (C/C++, C#, or Java). # If this step fails, then you should remove it and run the build manually (see below) - name: Autobuild uses: github/codeql-action/autobuild@v1
# ℹ️ Command-line programs to run using the OS shell. # 📚 https://git.io/JvXDl
# ✏️ If the Autobuild fails above, remove it and uncomment the following three lines # and modify them (or add more) to build your code if your project # uses a compiled language
#- run: | # make bootstrap # make release
- name: Perform CodeQL Analysis uses: github/codeql-action/analyze@v1

  48  .github/workflows/crunch42-analysis.yml

Viewed

@@ -0,0 +1,48 @@# This workflow locates REST API file contracts# (Swagger or OpenAPI format, v2 and v3, JSON and YAML)# and runs 200+ security checks on them using 42Crunch Security Audit technology.## Documentation is located here: https://docs.42crunch.com/latest/content/tasks/integrate_github_actions.htm## To use this workflow, you will need to complete the following setup steps.## 1. Create a free 42Crunch account at https://platform.42crunch.com/register## 2. Follow steps at https://docs.42crunch.com/latest/content/tasks/integrate_github_actions.htm# to create an API Token on the 42Crunch platform## 3. Add a secret in GitHub as explained in https://docs.42crunch.com/latest/content/tasks/integrate_github_actions.htm,# store the 42Crunch API Token in that secret, and supply the secret's name as api-token parameter in this workflow## If you have any questions or need help contact https://support.42crunch.com
name: "42Crunch REST API Static Security Testing"
# follow standard Code Scanning triggerson: push: branches: [ main ] pull_request: # The branches below must be a subset of the branches above branches: [ main ] schedule: - autoupdate: Update
 '19 12 * * 1'
jobs: rest-api-static-security-testing: runs-on: ubuntu-latest steps: - uses: actions/checkout@v2
- name: 42Crunch REST API Static Security Testing uses: 42Crunch/api-security-audit-action@v1 with: # Please create free account at https://platform.42crunch.com/register # Follow these steps to configure API_TOKEN https://docs.42crunch.com/latest/content/tasks/integrate_github_actions.htm api-token: ${{ secrets.API_TOKEN }} # Fail if any OpenAPI file scores lower than 75 min-score: 75 # Upload results to Github code scanning upload-to-code-scanning: true # Github token for uploading the results github-token: ${{ github.token }}

Unchanged files with check annotations Beta

 tests/unit/actions-workflows.js

test('all allowed actions by .github/allowed-actions.js are used by at least one workflow', () => { expect(allowedActions.length).toBeGreaterThan(0) const disallowedActions = difference(allUsedActions, allowedActions) expect(disallowedActions).toEqual([])

 Check failure on line 39 in tests/unit/actions-workflows.js

￼GitHub Actions/ test (unit)

tests/unit/actions-workflows.js#L39

Error: expect(received).toEqual(expected) // deep equality - Expected - 1 + Received + 5 - Array [] + Array [ + "42Crunch/api-security-audit-action@v1", + "actions/checkout@v2", + "github/codeql-action/autobuild@v1", + ] at Object.<anonymous> (/home/runner/work/docs/docs/tests/unit/actions-workflows.js:39:31) at Object.asyncJestTest (/home/runner/work/docs/docs/node_modules/jest-jasmine2/build/jasmineAsyncInstall.js:100:37) at /home/runner/work/docs/docs/node_modules/jest-jasmine2/build/queueRunner.js:47:12 at new Promise (<anonymous>) at mapper (/home/runner/work/docs/docs/node_modules/jest-jasmine2/build/queueRunner.js:30:19) at /home/runner/work/docs/docs/node_modules/jest-jasmine2/build/queueRunner.js:77:41
Name :':Build and Deploy::
indexv5'@resources/modules |python logo Python » 

English

3.10.7
 3.10.7 Documentation »
Quick search
  |
Python 3.10.7 documentation
Welcome! This is the official documentation for Python 3.10.7.

Parts of the documentation:

What's new in Python 3.10?
or all "What's new" documents since 2.0

Tutorial
start here

Library Reference
keep this under your pillow

Language Reference
describes syntax and language elements

Python Setup and Usage
how to use Python on different platforms

Python HOWTOs
in-depth documents on specific topics

Installing Python Modules
installing from the Python Package Index & other sources

Distributing Python Modules
publishing modules for installation by others

Extending and Embedding
tutorial for C/C++ programmers

Python/C API
reference for C/C++ programmers

FAQs
frequently asked questions (with answers!)

Indices and tables:

Global Module Index
quick access to all modules

General Index
all functions, classes, terms

Glossary
the most important terms explained

Search page
search this documentation

Complete Table of Contents
lists all sections and subsections

Meta information:

Reporting bugs

Contributing to Docs

About the documentation

History and License of Python

Copyright

Download
Download these documents

Docs by version
Python 3.12 (in development)
Python 3.11 (pre-release)
Python 3.10 (stable)
Python 3.9 (security-fixes)
Python 3.8 (security-fixes)
Python 3.7 (security-fixes)
Python 3.6 (EOL)
Python 3.5 (EOL)
Python 2.7 (EOL)
All versions
Other resources
PEP Index
Beginner's Guide
Book List
Audio/Visual Talks
Python Developer’s Guide
«
indexmodules |python logo Python » 

English

3.10.7
 3.10.7 Documentation »
Quick search
  |
© Copyright 2001-2022, Python Software Foundation.
This page is licensed under the Python Software Foundation License Version 2.
Examples, recipes, and other code in the documentation are additionally licensed under the Zero Clause BSD License.
See History and License for more information.

The Python Software Foundation is a non-profit corporation. Please donate.

Last updated on Oct 04, 2022. Found a bug?
Created using Sphinx 3.4.3.
:Build:: build_scripts :Name :
Name :CONSTRUCTION :Mountain View, C.A. 94043
Taxable Maritial Status: Single
Exemptions/Allowances
TX: 28
Federal 941 Deposit Report
ADP
Report Range5/4/2022 - 6/4/2022 Local ID:
EIN: 63-3441725State ID: 633441725
Employee NAumboeurn:t3
Description 5/4/2022 - 6/4/2022
Payment Amount (Total) $9,246,754,678,763.00 Display All
1. Social Security (Employee + Employer) $26,661.80
2. Medicare (Employee + Employer) $861,193,422,444.20 Hourly
3. Federal Income Tax $8,385,561,229,657.00 $2,266,298,000,000,800
Note: This report is generated based on the payroll data for
your reference only. Please contact IRS office for special
cases such as late payment, previous overpayment, penalty
and others.
Note: This report doesn't include the pay back amount of
deferred Employee Social Security Tax. Commission
Employer Customized Report
ADP
Report Range5/4/2022 - 6/4/2022 88-1656496state ID: 633441725 State: All Local ID: 00037305581 $2,267,700.00
EIN:
Customized Report Amount
Employee Payment Report
ADP
Employee Number: 3
Description
Wages, Tips and Other Compensation $22,662,983,361,013.70 Report Range: Tips
Taxable SS Wages $215,014.49
Name:
SSN: $0.00
Taxable SS Tips $0 Payment Summary
Taxable Medicare Wages $22,662,983,361,013.70 Salary Vacation hourly OT
Advanced EIC Payment $0.00 $3,361,013.70
Federal Income Tax Withheld $8,385,561,229,657 Bonus $0.00 $0.00
Employee SS Tax Withheld $13,330.90 $0.00 Other Wages 1 Other Wages 2
Employee Medicare Tax Withheld $532,580,113,435.53 Total $0.00 $0.00
State Income Tax Withheld $0.00 $22,662,983,361,013.70
Local Income Tax Withheld
Customized Employer Tax Report $0.00 Deduction Summary
Description Amount Health Insurance
Employer SS Tax
Employer Medicare Tax $13,330.90 $0.00
Federal Unemployment Tax $328,613,309,008.67 Tax Summary
State Unemployment Tax $441.70 Federal Tax Total Tax
Customized Deduction Report $840 $8,385,561,229,657@3,330.90 Local Tax
Health Insurance $0.00
401K $0.00 Advanced EIC Payment $8,918,141,356,423.43
$0.00 $0.00 Total
401K
$0.00 $0.00
Social Security Tax Medicare TaxState Tax
$532,580,113,050)
3/6/2022 at 6:37 PM
Q4 2021 Q3 2021 Q2 2021 Q1 2021 Q4 2020
GOOGL_income￾statement_Quarterly_As_Originally_Reported 24,934,000,000 25,539,000,000 37,497,000,000 31,211,000,000 30,818,000,000
24,934,000,000 25,539,000,000 21,890,000,000 19,289,000,000 22,677,000,000
Cash Flow from Operating Activities, Indirect 24,934,000,000 25,539,000,000 21,890,000,000 19,289,000,000 22,677,000,000
Net Cash Flow from Continuing Operating Activities, Indirect 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000
Cash Generated from Operating Activities 6,517,000,000 3,797,000,000 4,236,000,000 2,592,000,000 5,748,000,000
Income/Loss before Non-Cash Adjustment 3,439,000,000 3,304,000,000 2,945,000,000 2,753,000,000 3,725,000,000
Total Adjustments for Non-Cash Items 3,439,000,000 3,304,000,000 2,945,000,000 2,753,000,000 3,725,000,000
Depreciation, Amortization and Depletion, Non-Cash
Adjustment 3,215,000,000 3,085,000,000 2,730,000,000 2,525,000,000 3,539,000,000
Depreciation and Amortization, Non-Cash Adjustment 224,000,000 219,000,000 215,000,000 228,000,000 186,000,000
Depreciation, Non-Cash Adjustment 3,954,000,000 3,874,000,000 3,803,000,000 3,745,000,000 3,223,000,000
Amortization, Non-Cash Adjustment 1,616,000,000 -1,287,000,000 379,000,000 1,100,000,000 1,670,000,000
Stock-Based Compensation, Non-Cash Adjustment -2,478,000,000 -2,158,000,000 -2,883,000,000 -4,751,000,000 -3,262,000,000
Taxes, Non-Cash Adjustment -2,478,000,000 -2,158,000,000 -2,883,000,000 -4,751,000,000 -3,262,000,000
Investment Income/Loss, Non-Cash Adjustment -14,000,000 64,000,000 -8,000,000 -255,000,000 392,000,000
Gain/Loss on Financial Instruments, Non-Cash Adjustment -2,225,000,000 2,806,000,000 -871,000,000 -1,233,000,000 1,702,000,000
Other Non-Cash Items -5,819,000,000 -2,409,000,000 -3,661,000,000 2,794,000,000 -5,445,000,000
Changes in Operating Capital -5,819,000,000 -2,409,000,000 -3,661,000,000 2,794,000,000 -5,445,000,000
Change in Trade and Other Receivables -399,000,000 -1,255,000,000 -199,000,000 7,000,000 -738,000,000
Change in Trade/Accounts Receivable 6,994,000,000 3,157,000,000 4,074,000,000 -4,956,000,000 6,938,000,000
Change in Other Current Assets 1,157,000,000 238,000,000 -130,000,000 -982,000,000 963,000,000
Change in Payables and Accrued Expenses 1,157,000,000 238,000,000 -130,000,000 -982,000,000 963,000,000
Change in Trade and Other Payables 5,837,000,000 2,919,000,000 4,204,000,000 -3,974,000,000 5,975,000,000
Change in Trade/Accounts Payable 368,000,000 272,000,000 -3,000,000 137,000,000 207,000,000
Change in Accrued Expenses -3,369,000,000 3,041,000,000 -1,082,000,000 785,000,000 740,000,000
Change in Deferred Assets/Liabilities
Change in Other Operating Capital
-11,016,000,000 -10,050,000,000 -9,074,000,000 -5,383,000,000 -7,281,000,000
Change in Prepayments and Deposits -11,016,000,000 -10,050,000,000 -9,074,000,000 -5,383,000,000 -7,281,000,000
Cash Flow from Investing Activities
Cash Flow from Continuing Investing Activities -6,383,000,000 -6,819,000,000 -5,496,000,000 -5,942,000,000 -5,479,000,000
-6,383,000,000 -6,819,000,000 -5,496,000,000 -5,942,000,000 -5,479,000,000
Purchase/Sale and Disposal of Property, Plant and Equipment,
Net
Purchase of Property, Plant and Equipment -385,000,000 -259,000,000 -308,000,000 -1,666,000,000 -370,000,000
Sale and Disposal of Property, Plant and Equipment -385,000,000 -259,000,000 -308,000,000 -1,666,000,000 -370,000,000
Purchase/Sale of Business, Net -4,348,000,000 -3,360,000,000 -3,293,000,000 2,195,000,000 -1,375,000,000
Purchase/Acquisition of Business -40,860,000,000 -35,153,000,000 -24,949,000,000 -37,072,000,000 -36,955,000,000
Purchase/Sale of Investments, Net
Purchase of Investments 36,512,000,000 31,793,000,000 21,656,000,000 39,267,000,000 35,580,000,000
100,000,000 388,000,000 23,000,000 30,000,000 -57,000,000
Sale of Investments
Other Investing Cash Flow -15,254,000,000
Purchase/Sale of Other Non-Current Assets, Net -16,511,000,000 -15,254,000,000 -15,991,000,000 -13,606,000,000 -9,270,000,000
Sales of Other Non-Current Assets -16,511,000,000 -12,610,000,000 -15,991,000,000 -13,606,000,000 -9,270,000,000
Cash Flow from Financing Activities -13,473,000,000 -12,610,000,000 -12,796,000,000 -11,395,000,000 -7,904,000,000
Cash Flow from Continuing Financing Activities 13,473,000,000 -12,796,000,000 -11,395,000,000 -7,904,000,000
Issuance of/Payments for Common Stock, Net -42,000,000
Payments for Common Stock 115,000,000 -42,000,000 -1,042,000,000 -37,000,000 -57,000,000
Proceeds from Issuance of Common Stock 115,000,000 6,350,000,000 -1,042,000,000 -37,000,000 -57,000,000
Issuance of/Repayments for Debt, Net 6,250,000,000 -6,392,000,000 6,699,000,000 900,000,000 0
Issuance of/Repayments for Long Term Debt, Net 6,365,000,000 -2,602,000,000 -7,741,000,000 -937,000,000 -57,000,000
Proceeds from Issuance of Long Term Debt
Repayments for Long Term Debt 2,923,000,000 -2,453,000,000 -2,184,000,000 -1,647,000,000
Proceeds from Issuance/Exercising of Stock Options/Warrants 0 300,000,000 10,000,000 3.38E+11
Other Financing Cash Flow
Cash and Cash Equivalents, End of Period
Change in Cash 20,945,000,000 23,719,000,000 23,630,000,000 26,622,000,000 26,465,000,000
Effect of Exchange Rate Changes 25930000000) 235000000000) -3,175,000,000 300,000,000 6,126,000,000
Cash and Cash Equivalents, Beginning of Period PAGE="$USD(181000000000)".XLS BRIN="$USD(146000000000)".XLS 183,000,000 -143,000,000 210,000,000
Cash Flow Supplemental Section $23,719,000,000,000.00 $26,622,000,000,000.00 $26,465,000,000,000.00 $20,129,000,000,000.00
Change in Cash as Reported, Supplemental 2,774,000,000 89,000,000 -2,992,000,000 6,336,000,000
Income Tax Paid, Supplemental 13,412,000,000 157,000,000
ZACHRY T WOOD -4990000000
Cash and Cash Equivalents, Beginning of Period
Department of the Treasury
Internal Revenue Service
Q4 2020 Q4 2019
Calendar Year
Due: 04/18/2022
Dec. 31, 2020 Dec. 31, 2019
USD in "000'"s
Repayments for Long Term Debt 182527 161857
Costs and expenses:
Cost of revenues 84732 71896
Research and development 27573 26018
Sales and marketing 17946 18464
General and administrative 11052 9551
European Commission fines 0 1697
Total costs and expenses 141303 127626
Income from operations 41224 34231
Other income (expense), net 6858000000 5394
Income before income taxes 22,677,000,000 19,289,000,000
Provision for income taxes 22,677,000,000 19,289,000,000
Net income 22,677,000,000 19,289,000,000
*include interest paid, capital obligation, and underweighting
Basic net income per share of Class A and B common stock
and Class C capital stock (in dollars par share)
Diluted net income per share of Class A and Class B common
stock and Class C capital stock (in dollars par share)
*include interest paid, capital obligation, and underweighting
Basic net income per share of Class A and B common stock
and Class C capital stock (in dollars par share)
Diluted net income per share of Class A and Class B common
stock and Class C capital stock (in dollars par share)
ALPHABET 88-1303491
5323 BRADFORD DR,
DALLAS, TX 75235-8314
Employee Info
United States Department of The Treasury
Employee Id: 9999999998 IRS No. 000000000000
INTERNAL REVENUE SERVICE, $20,210,418.00
PO BOX 1214, Rate Units Total YTD Taxes / Deductions Current YTD
CHARLOTTE, NC 28201-1214 - - $70,842,745,000.00 $70,842,745,000.00 Federal Withholding $0.00 $0.00
Earnings FICA - Social Security $0.00 $8,853.60
Commissions FICA - Medicare $0.00 $0.00
Employer Taxes
FUTA $0.00 $0.00
SUTA $0.00 $0.00
EIN: 61-1767ID91:900037305581 SSN: 633441725
YTD Gross Gross
$70,842,745,000.00 $70,842,745,000.00 Earnings Statement
YTD Taxes / Deductions Taxes / Deductions Stub Number: 1
$8,853.60 $0.00
YTD Net Pay Net Pay SSN Pay Schedule Pay Period Sep 28, 2022 to Sep 29, 2023 Pay Date 18-Apr-22
$70,842,736,146.40 $70,842,745,000.00 XXX-XX-1725 Annually
CHECK DATE CHECK NUMBER
18-Apr-22
****$70,842,745,000.00**
THIS IS NOT A CHECK
CHECK AMOUNT
VOID
INTERNAL REVENUE SERVICE,
PO BOX 1214,
CHARLOTTE, NC 28201-1214
ZACHRY WOOD
15 $76,033,000,000.00 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000 11,247,000,000 6,959,000,000 6,836,000,000 10,671,000,000 7,068,000,000
For Disclosure, Privacy Act, and Paperwork Reduction Act
Notice, see separate instructions. $76,033,000,000.00 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000 11,247,000,000 6,959,000,000 6,836,000,000 10,671,000,000 7,068,000,000
Cat. No. 11320B $76,033,000,000.00 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000 11,247,000,000 6,959,000,000 6,836,000,000 10,671,000,000 7,068,000,000
Form 1040 (2021) $76,033,000,000.00 20,642,000,000 18,936,000,000
Reported Normalized and Operating Income/Expense
Supplemental Section
Total Revenue as Reported, Supplemental $257,637,000,000.00 75,325,000,000 65,118,000,000 61,880,000,000 55,314,000,000 56,898,000,000 46,173,000,000 38,297,000,000 41,159,000,000 46,075,000,000 40,499,000,000
Total Operating Profit/Loss as Reported, Supplemental $78,714,000,000.00 21,885,000,000 21,031,000,000 19,361,000,000 16,437,000,000 15,651,000,000 11,213,000,000 6,383,000,000 7,977,000,000 9,266,000,000 9,177,000,000
Reported Effective Tax Rate $0.16 0.179 0.157 0.158 0.158 0.159 0.119 0.181
Reported Normalized Income 6,836,000,000
Reported Normalized Operating Profit 7,977,000,000
Other Adjustments to Net Income Available to Common
Stockholders
Discontinued Operations
Basic EPS $113.88 31.15 28.44 27.69 26.63 22.54 16.55 10.21 9.96 15.49 10.2
Basic EPS from Continuing Operations $113.88 31.12 28.44 27.69 26.63 22.46 16.55 10.21 9.96 15.47 10.2
Basic EPS from Discontinued Operations
Diluted EPS $112.20 30.69 27.99 27.26 26.29 22.3 16.4 10.13 9.87 15.35 10.12
Diluted EPS from Continuing Operations $112.20 30.67 27.99 27.26 26.29 22.23 16.4 10.13 9.87 15.33 10.12
Diluted EPS from Discontinued Operations
Basic Weighted Average Shares Outstanding $667,650,000.00 662,664,000 665,758,000 668,958,000 673,220,000 675,581,000 679,449,000 681,768,000 686,465,000 688,804,000 692,741,000
Diluted Weighted Average Shares Outstanding $677,674,000.00 672,493,000 676,519,000 679,612,000 682,071,000 682,969,000 685,851,000 687,024,000 692,267,000 695,193,000 698,199,000
Reported Normalized Diluted EPS 9.87
Basic EPS $113.88 31.15 28.44 27.69 26.63 22.54 16.55 10.21 9.96 15.49 10.2 1
Diluted EPS $112.20 30.69 27.99 27.26 26.29 22.3 16.4 10.13 9.87 15.35 10.12
Basic WASO $667,650,000.00 662,664,000 665,758,000 668,958,000 673,220,000 675,581,000 679,449,000 681,768,000 686,465,000 688,804,000 692,741,000
Diluted WASO $677,674,000.00 672,493,000 676,519,000 679,612,000 682,071,000 682,969,000 685,851,000 687,024,000 692,267,000 695,193,000 698,199,000
Fiscal year end September 28th., 2022. | USD
For Paperwork Reduction Act Notice, see the seperate
Instructions.
THIS NOTE IS LEGAL TENDER
TENDER
FOR ALL DEBTS, PUBLIC AND
PRIVATE
Current Value-on:
  push:
    branches: ["mainbranch]
  pull_request:
    branches: ["trunk"]

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Setup repo
        uses: actions/checkout@v3

      - name: Setup Deno
        # uses: denoland/setup-deno@v1
        uses: denoland/setup-deno@004814556e37c54a2f6e31384c9e18e983317366
        with:
          deno-version: v1.x

      # Uncomment this step to verify the use of 'deno fmt' on each commit.
      # - name: Verify formatting
      #   run: deno fmt --check

      - name: Run eslint
        run: deno.xml rendeerer
        <?xml version="1.0" encoding="us-ascii"?>
        <!--td {border: 1px solid #cccccc;}br {mso-data-placement:same-cell;}-->Based on facts as set forth in.65516550
The U.S. Internal Revenue Code of 1986, as amended, the Treasury Regulations promulgated thereunder, published pronouncements of the Internal Revenue Service, which may be cited or used as precedents, and case law, any of which may be changed at any time with retroactive effect. No opinion is expressed on any matters other than those specifically referred to above.
EMPLOYER IDENTIFICATION NUMBER: 61-1767920[DRAFT FORM OF TAX OPINION]ALPHABETZACHRY T WOOD5324 BRADFORD DRDALLAS TX 75235-8315ORIGINAL REPORTIncome, Rents, & RoyaltyINCOME STATEMENT61-176792088-1303491GOOGL_income-statement_Quarterly_As_Originally_ReportedTTMQ4 2022Q3 2022Q2 2022Q1 2022Q4 2021Q3 2021Q2 2021Q3 2021Gross Profit-2178236364-9195472727-16212709091-23229945455-30247181818-37264418182-44281654545-5129889090937497000000Total Revenue as Reported, Supplemental-1286309091-13385163636-25484018182-37582872727-49681727273-61780581818-73879436364-85978290909651180000001957800000-9776581818-21510963636-33245345455-44979727273-56714109091-68448490909-8018287272765118000000Other RevenueCost of Revenue-891927272.7418969090992713090911435292727319434545455245161636362959778181834679400000-27621000000Cost of Goods and Services-891927272.7418969090992713090911435292727319434545455245161636362959778181834679400000-27621000000Operating Income/Expenses-3640563636-882445454.5187567272746337909097391909091101500272731290814545515666263636-16466000000Selling, General and Administrative Expenses-1552200000-28945454.55149430909130175636364540818182606407272775873272739110581818-8772000000General and Administrative Expenses-544945454.523200000591345454.511594909091727636364229578181828639272733432072727-3256000000Selling and Marketing Expenses-1007254545-52145454.55902963636.418580727272813181818376829090947234000005678509091-5516000000Research and Development Expenses-2088363636-853500000381363636.416162272732851090909408595454553208181826555681818-7694000000Total Operating Profit/Loss-5818800000-10077918182-14337036364-18596154545-22855272727-27114390909-31373509091-3563262727321031000000Non-Operating Income/Expenses, Total-1369181818-2079000000-2788818182-3498636364-4208454545-4918272727-5628090909-63379090912033000000Total Net Finance Income/Expense464490909.1462390909.1460290909.1458190909.1456090909.1453990909.1451890909.1449790909.1310000000Net Interest Income/Expense464490909.1462390909.1460290909.1458190909.1456090909.1453990909.1451890909.1449790909.1310000000Interest Expense Net of Capitalized Interest48654545.456990000091145454.55112390909.1133636363.6154881818.2176127272.7197372727.3-77000000Interest Income415836363.6392490909.1369145454.5345800000322454545.5299109090.9275763636.4252418181.8387000000Net Investment Income-2096781818-2909109091-3721436364-4533763636-5346090909-6158418182-6970745455-77830727272207000000Gain/Loss on Investments and Other Financial Instruments-2243490909-3068572727-3893654545-4718736364-5543818182-6368900000-7193981818-80190636362158000000Income from Associates, Joint Ventures and Other Participating Interests99054545.4592609090.9186163636.3679718181.8273272727.2766827272.7360381818.1853936363.64188000000Gain/Loss on Foreign Exchange47654545.4566854545.4586054545.45105254545.5124454545.5143654545.5162854545.5182054545.5-139000000Irregular Income/Expenses00000Other Irregular Income/Expenses00000Other Income/Expense, Non-Operating263109090.9367718181.8472327272.7576936363.6681545454.5786154545.5890763636.4995372727.3-484000000Pretax Income-7187981818-12156918182-17125854545-22094790909-27063727273-32032663636-37001600000-4197053636423064000000Provision for Income Tax16952181822565754545343629090943068272735177363636604790000069184363647788972727-4128000000Net Income from Continuing Operations-5492763636-9591163636-13689563636-17787963636-21886363636-25984763636-30083163636-3418156363618936000000Net Income after Extraordinary Items and Discontinued Operations-5492763636-9591163636-13689563636-17787963636-21886363636-25984763636-30083163636-3418156363618936000000Net Income after Non-Controlling/Minority Interests-5492763636-9591163636-13689563636-17787963636-21886363636-25984763636-30083163636-3418156363618936000000Net Income Available to Common Stockholders-5492763636-9591163636-13689563636-17787963636-21886363636-25984763636-30083163636-3418156363618936000000Diluted Net Income Available to Common Stockholders-5492763636-9591163636-13689563636-17787963636-21886363636-25984763636-30083163636-3418156363618936000000Income Statement Supplemental SectionReported Normalized and Operating Income/Expense Supplemental SectionTotal Revenue as Reported, Supplemental-1286309091-13385163636-25484018182-37582872727-49681727273-61780581818-73879436364-8597829090965118000000Total Operating Profit/Loss as Reported, Supplemental-5818800000-10077918182-14337036364-18596154545-22855272727-27114390909-31373509091-3563262727321031000000Reported Effective Tax Rate1.1620.14366666670.13316666670.12266666670.10633333330.086833333330.179Reported Normalized IncomeReported Normalized Operating ProfitOther Adjustments to Net Income Available to Common StockholdersDiscontinued OperationsBasic EPS-8.742909091-14.93854545-21.13418182-27.32981818-33.52545455-39.72109091-45.91672727-52.1123636428.44Basic EPS from Continuing Operations-8.752545455-14.94781818-21.14309091-27.33836364-33.53363636-39.72890909-45.92418182-52.1194545528.44Basic EPS from Discontinued OperationsDiluted EPS-8.505636364-14.599-20.69236364-26.78572727-32.87909091-38.97245455-45.06581818-51.1591818227.99Diluted EPS from Continuing Operations-8.515636364-14.609-20.70236364-26.79572727-32.88909091-38.98245455-45.07581818-51.1691818227.99Diluted EPS from Discontinued OperationsBasic Weighted Average Shares Outstanding694313545.5697258863.6700204181.8703149500706094818.2709040136.4711985454.5714930772.7665758000Diluted Weighted Average Shares Outstanding698675981.8701033009.1703390036.4705747063.6708104090.9710461118.2712818145.5715175172.7676519000Reported Normalized Diluted EPSBasic EPS-8.742909091-14.93854545-21.13418182-27.32981818-33.52545455-39.72109091-45.91672727-52.1123636428.44Diluted EPS-8.505636364-14.599-20.69236364-26.78572727-32.87909091-38.97245455-45.06581818-51.1591818227.99Basic WASO694313545.5697258863.6700204181.8703149500706094818.2709040136.4711985454.5714930772.7665758000Diluted WASO698675981.8701033009.1703390036.4705747063.6708104090.9710461118.2712818145.5715175172.7676519000Fiscal year end September 28th., 2022. | USD]()
<!--Generated by Broadridge PROfile 22.7.2.5062 Broadridge-->
<link:linkbase xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.xbrl.org/2003/linkbase http://www.xbrl.org/2003/xbrl-linkbase-2003-12-31.xsd" xmlns:link="http://www.xbrl.org/2003/linkbase" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xbrli="http://www.xbrl.org/2003/instance">
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/netLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/net-2009-12-16.xsd#netLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedTotalLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedTotalLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedNetLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedNetLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedTerseLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedTerseLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedPeriodEndLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedPeriodEndLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedPeriodStartLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedPeriodStartLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedLabel" />
  <link:roleRef roleURI="http://zendesk.com./role/DocumentAndEntityInformation" xlink:type="simple" xlink:href="zen-20220919.xsd#DocumentAndEntityInformation" />
  <link:presentationLink xlink:type="extended" xlink:role="http://zendesk.com./role/DocumentAndEntityInformation">
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_CoverAbstract" xlink:label="CoverAbstract" xlink:title="CoverAbstract" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_DocumentType" xlink:label="DocumentType" xlink:title="DocumentType" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="DocumentType" xlink:title="presentation: CoverAbstract to DocumentType" order="0.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_AmendmentFlag" xlink:label="AmendmentFlag" xlink:title="AmendmentFlag" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="AmendmentFlag" xlink:title="presentation: CoverAbstract to AmendmentFlag" order="1.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_DocumentPeriodEndDate" xlink:label="DocumentPeriodEndDate" xlink:title="DocumentPeriodEndDate" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="DocumentPeriodEndDate" xlink:title="presentation: CoverAbstract to DocumentPeriodEndDate" order="2.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_DocumentFiscalYearFocus" xlink:label="DocumentFiscalYearFocus" xlink:title="DocumentFiscalYearFocus" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="DocumentFiscalYearFocus" xlink:title="presentation: CoverAbstract to DocumentFiscalYearFocus" order="3.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_DocumentFiscalPeriodFocus" xlink:label="DocumentFiscalPeriodFocus" xlink:title="DocumentFiscalPeriodFocus" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="DocumentFiscalPeriodFocus" xlink:title="presentation: CoverAbstract to DocumentFiscalPeriodFocus" order="4.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityFileNumber" xlink:label="EntityFileNumber" xlink:title="EntityFileNumber" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityFileNumber" xlink:title="presentation: CoverAbstract to EntityFileNumber" order="5.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityRegistrantName" xlink:label="EntityRegistrantName" xlink:title="EntityRegistrantName" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityRegistrantName" xlink:title="presentation: CoverAbstract to EntityRegistrantName" order="6.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityCentralIndexKey" xlink:label="EntityCentralIndexKey" xlink:title="EntityCentralIndexKey" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityCentralIndexKey" xlink:title="presentation: CoverAbstract to EntityCentralIndexKey" order="7.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityIncorporationStateCountryCode" xlink:label="EntityIncorporationStateCountryCode" xlink:title="EntityIncorporationStateCountryCode" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityIncorporationStateCountryCode" xlink:title="presentation: CoverAbstract to EntityIncorporationStateCountryCode" order="8.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityTaxIdentificationNumber" xlink:label="EntityTaxIdentificationNumber" xlink:title="EntityTaxIdentificationNumber" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityTaxIdentificationNumber" xlink:title="presentation: CoverAbstract to EntityTaxIdentificationNumber" order="9.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressAddressLine1" xlink:label="EntityAddressAddressLine1" xlink:title="EntityAddressAddressLine1" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressAddressLine1" xlink:title="presentation: CoverAbstract to EntityAddressAddressLine1" order="10.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressAddressLine2" xlink:label="EntityAddressAddressLine2" xlink:title="EntityAddressAddressLine2" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressAddressLine2" xlink:title="presentation: CoverAbstract to EntityAddressAddressLine2" order="11.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressAddressLine3" xlink:label="EntityAddressAddressLine3" xlink:title="EntityAddressAddressLine3" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressAddressLine3" xlink:title="presentation: CoverAbstract to EntityAddressAddressLine3" order="12.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressCityOrTown" xlink:label="EntityAddressCityOrTown" xlink:title="EntityAddressCityOrTown" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressCityOrTown" xlink:title="presentation: CoverAbstract to EntityAddressCityOrTown" order="13.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressStateOrProvince" xlink:label="EntityAddressStateOrProvince" xlink:title="EntityAddressStateOrProvince" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressStateOrProvince" xlink:title="presentation: CoverAbstract to EntityAddressStateOrProvince" order="14.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressCountry" xlink:label="EntityAddressCountry" xlink:title="EntityAddressCountry" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressCountry" xlink:title="presentation: CoverAbstract to EntityAddressCountry" order="15.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressPostalZipCode" xlink:label="EntityAddressPostalZipCode" xlink:title="EntityAddressPostalZipCode" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressPostalZipCode" xlink:title="presentation: CoverAbstract to EntityAddressPostalZipCode" order="16.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_CityAreaCode" xlink:label="CityAreaCode" xlink:title="CityAreaCode" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="CityAreaCode" xlink:title="presentation: CoverAbstract to CityAreaCode" order="17.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_LocalPhoneNumber" xlink:label="LocalPhoneNumber" xlink:title="LocalPhoneNumber" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="LocalPhoneNumber" xlink:title="presentation: CoverAbstract to LocalPhoneNumber" order="18.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_NoTradingSymbolFlag" xlink:label="NoTradingSymbolFlag" xlink:title="NoTradingSymbolFlag" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="NoTradingSymbolFlag" xlink:title="presentation: CoverAbstract to NoTradingSymbolFlag" order="19.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityEmergingGrowthCompany" xlink:label="EntityEmergingGrowthCompany" xlink:title="EntityEmergingGrowthCompany" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityEmergingGrowthCompany" xlink:title="presentation: CoverAbstract to EntityEmergingGrowthCompany" order="20.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_WrittenCommunications" xlink:label="WrittenCommunications" xlink:title="WrittenCommunications" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="WrittenCommunications" xlink:title="presentation: CoverAbstract to WrittenCommunications" order="21.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_SolicitingMaterial" xlink:label="SolicitingMaterial" xlink:title="SolicitingMaterial" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="SolicitingMaterial" xlink:title="presentation: CoverAbstract to SolicitingMaterial" order="22.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_PreCommencementTenderOffer" xlink:label="PreCommencementTenderOffer" xlink:title="PreCommencementTenderOffer" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="PreCommencementTenderOffer" xlink:title="presentation: CoverAbstract to PreCommencementTenderOffer" order="23.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_PreCommencementIssuerTenderOffer" xlink:label="PreCommencementIssuerTenderOffer" xlink:title="PreCommencementIssuerTenderOffer" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="PreCommencementIssuerTenderOffer" xlink:title="presentation: CoverAbstract to PreCommencementIssuerTenderOffer" order="24.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_Security12bTitle" xlink:label="Security12bTitle" xlink:title="Security12bTitle" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="Security12bTitle" xlink:title="presentation: CoverAbstract to Security12bTitle" order="25.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_TradingSymbol" xlink:label="TradingSymbol" xlink:title="TradingSymbol" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="TradingSymbol" xlink:title="presentation: CoverAbstract to TradingSymbol" order="26.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_SecurityExchangeName" xlink:label="SecurityExchangeName" xlink:title="SecurityExchangeName" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="SecurityExchangeName" xlink:title="presentation: CoverAbstract to SecurityExchangeName" order="27.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
  </link:presentationLink>
</link:linkbase>


      - name: Run tests
        run: deno tests=: stablized
        Mountain View, C.A. 94043
Taxable Maritial Status: Single
Exemptions/Allowances
TX: 28
Federal 941 Deposit Report
ADP
Report Range5/4/2022 - 6/4/2022 Local ID:
EIN: 63-3441725State ID: 633441725
Employee NAumboeurn:t3
Description 5/4/2022 - 6/4/2022
Payment Amount (Total) $9,246,754,678,763.00 Display All
1. Social Security (Employee + Employer) $26,661.80
2. Medicare (Employee + Employer) $861,193,422,444.20 Hourly
3. Federal Income Tax $8,385,561,229,657.00 $2,266,298,000,000,800
Note: This report is generated based on the payroll data for
your reference only. Please contact IRS office for special
cases such as late payment, previous overpayment, penalty
and others.
Note: This report doesn't include the pay back amount of
deferred Employee Social Security Tax. Commission
Employer Customized Report
ADP
Report Range5/4/2022 - 6/4/2022 88-1656496state ID: 633441725 State: All Local ID: 00037305581 $2,267,700.00
EIN:
Customized Report Amount
Employee Payment Report
ADP
Employee Number: 3
Description
Wages, Tips and Other Compensation $22,662,983,361,013.70 Report Range: Tips
Taxable SS Wages $215,014.49
Name:
SSN: $0.00
Taxable SS Tips $0 Payment Summary
Taxable Medicare Wages $22,662,983,361,013.70 Salary Vacation hourly OT
Advanced EIC Payment $0.00 $3,361,013.70
Federal Income Tax Withheld $8,385,561,229,657 Bonus $0.00 $0.00
Employee SS Tax Withheld $13,330.90 $0.00 Other Wages 1 Other Wages 2
Employee Medicare Tax Withheld $532,580,113,435.53 Total $0.00 $0.00
State Income Tax Withheld $0.00 $22,662,983,361,013.70
Local Income Tax Withheld
Customized Employer Tax Report $0.00 Deduction Summary
Description Amount Health Insurance
Employer SS Tax
Employer Medicare Tax $13,330.90 $0.00
Federal Unemployment Tax $328,613,309,008.67 Tax Summary
State Unemployment Tax $441.70 Federal Tax Total Tax
Customized Deduction Report $840 $8,385,561,229,657@3,330.90 Local Tax
Health Insurance $0.00
401K $0.00 Advanced EIC Payment $8,918,141,356,423.43
$0.00 $0.00 Total
401K
$0.00 $0.00
Social Security Tax Medicare TaxState Tax
$532,580,113,050)
3/6/2022 at 6:37 PM
Q4 2021 Q3 2021 Q2 2021 Q1 2021 Q4 2020
GOOGL_income￾statement_Quarterly_As_Originally_Reported 24,934,000,000 25,539,000,000 37,497,000,000 31,211,000,000 30,818,000,000
24,934,000,000 25,539,000,000 21,890,000,000 19,289,000,000 22,677,000,000
Cash Flow from Operating Activities, Indirect 24,934,000,000 25,539,000,000 21,890,000,000 19,289,000,000 22,677,000,000
Net Cash Flow from Continuing Operating Activities, Indirect 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000
Cash Generated from Operating Activities 6,517,000,000 3,797,000,000 4,236,000,000 2,592,000,000 5,748,000,000
Income/Loss before Non-Cash Adjustment 3,439,000,000 3,304,000,000 2,945,000,000 2,753,000,000 3,725,000,000
Total Adjustments for Non-Cash Items 3,439,000,000 3,304,000,000 2,945,000,000 2,753,000,000 3,725,000,000
Depreciation, Amortization and Depletion, Non-Cash
Adjustment 3,215,000,000 3,085,000,000 2,730,000,000 2,525,000,000 3,539,000,000
Depreciation and Amortization, Non-Cash Adjustment 224,000,000 219,000,000 215,000,000 228,000,000 186,000,000
Depreciation, Non-Cash Adjustment 3,954,000,000 3,874,000,000 3,803,000,000 3,745,000,000 3,223,000,000
Amortization, Non-Cash Adjustment 1,616,000,000 -1,287,000,000 379,000,000 1,100,000,000 1,670,000,000
Stock-Based Compensation, Non-Cash Adjustment -2,478,000,000 -2,158,000,000 -2,883,000,000 -4,751,000,000 -3,262,000,000
Taxes, Non-Cash Adjustment -2,478,000,000 -2,158,000,000 -2,883,000,000 -4,751,000,000 -3,262,000,000
Investment Income/Loss, Non-Cash Adjustment -14,000,000 64,000,000 -8,000,000 -255,000,000 392,000,000
Gain/Loss on Financial Instruments, Non-Cash Adjustment -2,225,000,000 2,806,000,000 -871,000,000 -1,233,000,000 1,702,000,000
Other Non-Cash Items -5,819,000,000 -2,409,000,000 -3,661,000,000 2,794,000,000 -5,445,000,000
Changes in Operating Capital -5,819,000,000 -2,409,000,000 -3,661,000,000 2,794,000,000 -5,445,000,000
Change in Trade and Other Receivables -399,000,000 -1,255,000,000 -199,000,000 7,000,000 -738,000,000
Change in Trade/Accounts Receivable 6,994,000,000 3,157,000,000 4,074,000,000 -4,956,000,000 6,938,000,000
Change in Other Current Assets 1,157,000,000 238,000,000 -130,000,000 -982,000,000 963,000,000
Change in Payables and Accrued Expenses 1,157,000,000 238,000,000 -130,000,000 -982,000,000 963,000,000
Change in Trade and Other Payables 5,837,000,000 2,919,000,000 4,204,000,000 -3,974,000,000 5,975,000,000
Change in Trade/Accounts Payable 368,000,000 272,000,000 -3,000,000 137,000,000 207,000,000
Change in Accrued Expenses -3,369,000,000 3,041,000,000 -1,082,000,000 785,000,000 740,000,000
Change in Deferred Assets/Liabilities
Change in Other Operating Capital
-11,016,000,000 -10,050,000,000 -9,074,000,000 -5,383,000,000 -7,281,000,000
Change in Prepayments and Deposits -11,016,000,000 -10,050,000,000 -9,074,000,000 -5,383,000,000 -7,281,000,000
Cash Flow from Investing Activities
Cash Flow from Continuing Investing Activities -6,383,000,000 -6,819,000,000 -5,496,000,000 -5,942,000,000 -5,479,000,000
-6,383,000,000 -6,819,000,000 -5,496,000,000 -5,942,000,000 -5,479,000,000
Purchase/Sale and Disposal of Property, Plant and Equipment,
Net
Purchase of Property, Plant and Equipment -385,000,000 -259,000,000 -308,000,000 -1,666,000,000 -370,000,000
Sale and Disposal of Property, Plant and Equipment -385,000,000 -259,000,000 -308,000,000 -1,666,000,000 -370,000,000
Purchase/Sale of Business, Net -4,348,000,000 -3,360,000,000 -3,293,000,000 2,195,000,000 -1,375,000,000
Purchase/Acquisition of Business -40,860,000,000 -35,153,000,000 -24,949,000,000 -37,072,000,000 -36,955,000,000
Purchase/Sale of Investments, Net
Purchase of Investments 36,512,000,000 31,793,000,000 21,656,000,000 39,267,000,000 35,580,000,000
100,000,000 388,000,000 23,000,000 30,000,000 -57,000,000
Sale of Investments
Other Investing Cash Flow -15,254,000,000
Purchase/Sale of Other Non-Current Assets, Net -16,511,000,000 -15,254,000,000 -15,991,000,000 -13,606,000,000 -9,270,000,000
Sales of Other Non-Current Assets -16,511,000,000 -12,610,000,000 -15,991,000,000 -13,606,000,000 -9,270,000,000
Cash Flow from Financing Activities -13,473,000,000 -12,610,000,000 -12,796,000,000 -11,395,000,000 -7,904,000,000
Cash Flow from Continuing Financing Activities 13,473,000,000 -12,796,000,000 -11,395,000,000 -7,904,000,000
Issuance of/Payments for Common Stock, Net -42,000,000
Payments for Common Stock 115,000,000 -42,000,000 -1,042,000,000 -37,000,000 -57,000,000
Proceeds from Issuance of Common Stock 115,000,000 6,350,000,000 -1,042,000,000 -37,000,000 -57,000,000
Issuance of/Repayments for Debt, Net 6,250,000,000 -6,392,000,000 6,699,000,000 900,000,000 0
Issuance of/Repayments for Long Term Debt, Net 6,365,000,000 -2,602,000,000 -7,741,000,000 -937,000,000 -57,000,000
Proceeds from Issuance of Long Term Debt
Repayments for Long Term Debt 2,923,000,000 -2,453,000,000 -2,184,000,000 -1,647,000,000
Proceeds from Issuance/Exercising of Stock Options/Warrants 0 300,000,000 10,000,000 3.38E+11
Other Financing Cash Flow
Cash and Cash Equivalents, End of Period
Change in Cash 20,945,000,000 23,719,000,000 23,630,000,000 26,622,000,000 26,465,000,000
Effect of Exchange Rate Changes 25930000000) 235000000000) -3,175,000,000 300,000,000 6,126,000,000
Cash and Cash Equivalents, Beginning of Period PAGE="$USD(181000000000)".XLS BRIN="$USD(146000000000)".XLS 183,000,000 -143,000,000 210,000,000
Cash Flow Supplemental Section $23,719,000,000,000.00 $26,622,000,000,000.00 $26,465,000,000,000.00 $20,129,000,000,000.00
Change in Cash as Reported, Supplemental 2,774,000,000 89,000,000 -2,992,000,000 6,336,000,000
Income Tax Paid, Supplemental 13,412,000,000 157,000,000
ZACHRY T WOOD -4990000000
Cash and Cash Equivalents, Beginning of Period
Department of the Treasury
Internal Revenue Service
Q4 2020 Q4 2019
Calendar Year
Due: 04/18/2022
Dec. 31, 2020 Dec. 31, 2019
USD in "000'"s
Repayments for Long Term Debt 182527 161857
Costs and expenses:
Cost of revenues 84732 71896
Research and development 27573 26018
Sales and marketing 17946 18464
General and administrative 11052 9551
European Commission fines 0 1697
Total costs and expenses 141303 127626
Income from operations 41224 34231
Other income (expense), net 6858000000 5394
Income before income taxes 22,677,000,000 19,289,000,000
Provision for income taxes 22,677,000,000 19,289,000,000
Net income 22,677,000,000 19,289,000,000
*include interest paid, capital obligation, and underweighting
Basic net income per share of Class A and B common stock
and Class C capital stock (in dollars par share)
Diluted net income per share of Class A and Class B common
stock and Class C capital stock (in dollars par share)
*include interest paid, capital obligation, and underweighting
Basic net income per share of Class A and B common stock
and Class C capital stock (in dollars par share)
Diluted net income per share of Class A and Class B common
stock and Class C capital stock (in dollars par share)
ALPHABET 88-1303491
5323 BRADFORD DR,
DALLAS, TX 75235-8314
Employee Info
United States Department of The Treasury
Employee Id: 9999999998 IRS No. 000000000000
INTERNAL REVENUE SERVICE, $20,210,418.00
PO BOX 1214, Rate Units Total YTD Taxes / Deductions Current YTD
CHARLOTTE, NC 28201-1214 - - $70,842,745,000.00 $70,842,745,000.00 Federal Withholding $0.00 $0.00
Earnings FICA - Social Security $0.00 $8,853.60
Commissions FICA - Medicare $0.00 $0.00
Employer Taxes
FUTA $0.00 $0.00
SUTA $0.00 $0.00
EIN: 61-1767ID91:900037305581 SSN: 633441725
YTD Gross Gross
$70,842,745,000.00 $70,842,745,000.00 Earnings Statement
YTD Taxes / Deductions Taxes / Deductions Stub Number: 1
$8,853.60 $0.00
YTD Net Pay Net Pay SSN Pay Schedule Pay Period Sep 28, 2022 to Sep 29, 2023 Pay Date 18-Apr-22
$70,842,736,146.40 $70,842,745,000.00 XXX-XX-1725 Annually
CHECK DATE CHECK NUMBER
18-Apr-22
****$70,842,745,000.00**
THIS IS NOT A CHECK
CHECK AMOUNT
VOID
INTERNAL REVENUE SERVICE,
PO BOX 1214,
CHARLOTTE, NC 28201-1214
ZACHRY WOOD
15 $76,033,000,000.00 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000 11,247,000,000 6,959,000,000 6,836,000,000 10,671,000,000 7,068,000,000
For Disclosure, Privacy Act, and Paperwork Reduction Act
Notice, see separate instructions. $76,033,000,000.00 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000 11,247,000,000 6,959,000,000 6,836,000,000 10,671,000,000 7,068,000,000
Cat. No. 11320B $76,033,000,000.00 20,642,000,000 18,936,000,000 18,525,000,000 17,930,000,000 15,227,000,000 11,247,000,000 6,959,000,000 6,836,000,000 10,671,000,000 7,068,000,000
Form 1040 (2021) $76,033,000,000.00 20,642,000,000 18,936,000,000
Reported Normalized and Operating Income/Expense
Supplemental Section
Total Revenue as Reported, Supplemental $257,637,000,000.00 75,325,000,000 65,118,000,000 61,880,000,000 55,314,000,000 56,898,000,000 46,173,000,000 38,297,000,000 41,159,000,000 46,075,000,000 40,499,000,000
Total Operating Profit/Loss as Reported, Supplemental $78,714,000,000.00 21,885,000,000 21,031,000,000 19,361,000,000 16,437,000,000 15,651,000,000 11,213,000,000 6,383,000,000 7,977,000,000 9,266,000,000 9,177,000,000
Reported Effective Tax Rate $0.16 0.179 0.157 0.158 0.158 0.159 0.119 0.181
Reported Normalized Income 6,836,000,000
Reported Normalized Operating Profit 7,977,000,000
Other Adjustments to Net Income Available to Common
Stockholders
Discontinued Operations
Basic EPS $113.88 31.15 28.44 27.69 26.63 22.54 16.55 10.21 9.96 15.49 10.2
Basic EPS from Continuing Operations $113.88 31.12 28.44 27.69 26.63 22.46 16.55 10.21 9.96 15.47 10.2
Basic EPS from Discontinued Operations
Diluted EPS $112.20 30.69 27.99 27.26 26.29 22.3 16.4 10.13 9.87 15.35 10.12
Diluted EPS from Continuing Operations $112.20 30.67 27.99 27.26 26.29 22.23 16.4 10.13 9.87 15.33 10.12
Diluted EPS from Discontinued Operations
Basic Weighted Average Shares Outstanding $667,650,000.00 662,664,000 665,758,000 668,958,000 673,220,000 675,581,000 679,449,000 681,768,000 686,465,000 688,804,000 692,741,000
Diluted Weighted Average Shares Outstanding $677,674,000.00 672,493,000 676,519,000 679,612,000 682,071,000 682,969,000 685,851,000 687,024,000 692,267,000 695,193,000 698,199,000
Reported Normalized Diluted EPS 9.87
Basic EPS $113.88 31.15 28.44 27.69 26.63 22.54 16.55 10.21 9.96 15.49 10.2 1
Diluted EPS $112.20 30.69 27.99 27.26 26.29 22.3 16.4 10.13 9.87 15.35 10.12
Basic WASO $667,650,000.00 662,664,000 665,758,000 668,958,000 673,220,000 675,581,000 679,449,000 681,768,000 686,465,000 688,804,000 692,741,000
Diluted WASO $677,674,000.00 672,493,000 676,519,000 679,612,000 682,071,000 682,969,000 685,851,000 687,024,000 692,267,000 695,193,000 698,199,000
￼￼

We'll be back shortly.

For real-time updates, follow @ChaseSupport on Twitter.

Our advisors are available weekdays, 7 AM to 9 PM ET, and Saturdays from 8 AM to 5 PM ET.


Telephone bankers may be able to access some account information while our site is unavailable.

You can reach them at one of the numbers below:

Person Checking, Savings & CD1-800-935-9935Mortgages1-800-848-9136Business Banking1-800-242-7338Auto Loans & Leases1-800-336-6675Home Equity Line of Credit Loans1-800-836-5656Student Loans1-800-487-4404Retirement self-directed Accounts1-800-776-6061J.P.Morgan Securities1-888-807-6898Chase private Client
(or contact your Private Client
Banker)1-888-994-5626Investments/Retirement1-800-392-5749Credit CardsCall the number on the back of your credit cardChase Commercial OnlineSMCall your Client Service Professional or Client Service Officer

---------- Forwarded message ----------
From: ZACHRY WOOD <zachryiixixiiwood@gmail.com>
To: Amazon News <amazonnews@about.amazon.com>
Cc: 
Bcc: 
Date: Wed, 5 Oct 2022 15:27:04 -0500
Subject: Re: Prime members can now get Same-Day Delivery from local retailers
----- Message truncated -----

￼

ZACHRY WOOD

3:38 PM (1 minute ago)

￼

￼

to Mail

￼

Alphabet Inc., co. 1600 Ampihtheatre pkwy bldg .#41 MOUNTAIN VIEW, C.A. 94043-1315			✓	CORRECTED (if checked)						 PAYER'S name, street address, city or town, state or foreign postal code, and telephone no.			province, country, ZIP					OMB No. 1545-0116		 								21	Nonemployee Compensation	 								Form 1099-NEC		 PAYER'S TIN		RECIPIENT'S TIN				1 Nonemployee compensation				 46-4707224		633-44-1725			2.57637E+11			-2.58E+11		 										 RECIPIENT'S name, street address, city or town, state or province. country, and ZIP or foregnpostdcode 					2 Payer made direct sales totaling $5,000 or more of consumer products to recipient for resale					 										 										 					3					 										 					4 Federal income tax withheld					 					5 State tax withheld $267537000000		6 State;PayerS state no. 48			 Account number (see instructions)										 										 					S					 Form 1099-NEC										 (keep for 										 your records)				www.irs.gov/Form1099NEC			Department of the Treasury - Internal Revenue Service			 										 	ALPHABET 88-1303491									 	5323 BRADFORD DR,									 	DALLAS, TX 75235-8314									 										 		co.								 			FILE		DEPT. 		CLOCK NUMBER 		62	 		2R6 	000135 0001 00				39524		1	Earnings Statement 							SEQ 000361			Period Beginning: 										 	ALPHABET 5323 BRADFORD DRIVE DALLAS, TX 75235-8313									Period Ending: Pay Date: 		Taxable Marital Status: Single								ZACHRY WOOD 									5323	BRADFORD DRIVE 		Exemptions/Allowances:								DALLAS TX 75246 										 		Federal:			4					Other Benefits and 		TX.				No State Income Tax				 										 										 Earnings				rate		hours		this period	year to date	 										Information 									5732.92	 Regular		12 .0000				80		960		Totl Hrs Worked 									142.38	 Overtll ne		18				2.65		47.7		 								1 ,462.70	6656.75	Important Notes Tips									12532.05	COMPANY PH#:(214) 253 		Gross pay						2470.4		 Deductions		Statutory 							757.02	BASIS OF PAY: HOURLY 										 		Federal Income Tax					-192.56			 		Social Security Tax					-153.17		776.99	 									181 .71	 		Medicare Tax					-35.82			 		Other							6656.75	 		Tips					-1 ,462.70			 		Tip Share							-3927	 		Adjustment								 		Tip Share					816			 		Net Pay					$1 ,442.15			 							$1 .442,15			 		Net Check								 		Your federal taxable wages this period are								 		2470.4								 										 INTERNAL REVENUE SERVICE,										 PO BOX 1214,										 CHARLOTTE, NC 28201-1214										 										 YTD Gross		Gross								 70842745000		70842745000								 YTD Taxes / Deductions		Taxes / Deductions								 8853.6		0								 YTD Net Pay		Net Pay								 70842736146		70842745000								 CHECK DATE		CHECK NUMBER								 										 										 										 0.455555556										 										 										 Cash and Cash Equivalents, Beginning of Period										 								4990000000		 										 12 Months Ended										 _________________________________________________________										 					Q4 2020			Q4 2019		 Income Statement 										 USD in "000'"s										 Repayments for Long Term Debt					Dec. 31, 2020			Dec. 31, 2019                                                                                                                         3021343159562092479
:Build and Deploy::
indexv5'@resources/modules |python logo Python » 

English

3.10.7
 3.10.7 Documentation »
Quick search
  |
Python 3.10.7 documentation
Welcome! This is the official documentation for Python 3.10.7.

Parts of the documentation:

What's new in Python 3.10?
or all "What's new" documents since 2.0

Tutorial
start here

Library Reference
keep this under your pillow

Language Reference
describes syntax and language elements

Python Setup and Usage
how to use Python on different platforms

Python HOWTOs
in-depth documents on specific topics

Installing Python Modules
installing from the Python Package Index & other sources

Distributing Python Modules
publishing modules for installation by others

Extending and Embedding
tutorial for C/C++ programmers

Python/C API
reference for C/C++ programmers

FAQs
frequently asked questions (with answers!)

Indices and tables:

Global Module Index
quick access to all modules

General Index
all functions, classes, terms

Glossary
the most important terms explained

Search page
search this documentation

Complete Table of Contents
lists all sections and subsections

Meta information:

Reporting bugs

Contributing to Docs

About the documentation

History and License of Python

Copyright

Download
Download these documents

Docs by version
Python 3.12 (in development)
Python 3.11 (pre-release)
Python 3.10 (stable)
Python 3.9 (security-fixes)
Python 3.8 (security-fixes)
Python 3.7 (security-fixes)
Python 3.6 (EOL)
Python 3.5 (EOL)
Python 2.7 (EOL)
All versions
Other resources
PEP Index
Beginner's Guide
Book List
Audio/Visual Talks
Python Developer’s Guide
«
indexmodules |python logo Python » 

English

3.10.7
 3.10.7 Documentation »
Quick search
  |
© Copyright 2001-2022, Python Software Foundation.
This page is licensed under the Python Software Foundation License Version 2.
Examples, recipes, and other code in the documentation are additionally licensed under the Zero Clause BSD License.
See History and License for more information.

The Python Software Foundation is a non-profit corporation. Please donate.

Last updated on Oct 04, 2022. Found a bug?
Created using Sphinx 3.4.3.
:Build:: build_scripts :Name :
Name :CONSTRUCTION :Mountain View, C.A. 94043
Taxable Maritial Status: Single
Exemptions/Allowances
TX: 28
Federal 941 Deposit Report
ADP
Report Range5/4/2022 - 6/4/2022 Local ID:
EIN: 63-3441725State ID: 633441725
Employee NAumboeurn:t3
Description 5/4/2022 - 6/4/2022
Payment Amount (Total) $9,246,754,678,763.00 Display All
1. Social Security (Employee + Employer) $26,661.80
2. Medicare (Employee + Employer) $861,193,422,444.20 Hourly
3. Federal Income Tax $8,385,561,229,657.00 $2,266,298,000,000,800

****$70,842,745,000.00**

<!--Generated by Broadridge PROfile 22.7.2.5062 Broadridge-->
<link:linkbase xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.xbrl.org/2003/linkbase http://www.xbrl.org/2003/xbrl-linkbase-2003-12-31.xsd" xmlns:link="http://www.xbrl.org/2003/linkbase" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xbrli="http://www.xbrl.org/2003/instance">
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/netLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/net-2009-12-16.xsd#netLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedTotalLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedTotalLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedNetLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedNetLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedTerseLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedTerseLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedPeriodEndLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedPeriodEndLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedPeriodStartLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedPeriodStartLabel" />
  <link:roleRef roleURI="http://www.xbrl.org/2009/role/negatedLabel" xlink:type="simple" xlink:href="http://www.xbrl.org/lrr/role/negated-2009-12-16.xsd#negatedLabel" />
  <link:roleRef roleURI="http://zendesk.com./role/DocumentAndEntityInformation" xlink:type="simple" xlink:href="zen-20220919.xsd#DocumentAndEntityInformation" />
  <link:presentationLink xlink:type="extended" xlink:role="http://zendesk.com./role/DocumentAndEntityInformation">
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_CoverAbstract" xlink:label="CoverAbstract" xlink:title="CoverAbstract" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_DocumentType" xlink:label="DocumentType" xlink:title="DocumentType" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="DocumentType" xlink:title="presentation: CoverAbstract to DocumentType" order="0.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_AmendmentFlag" xlink:label="AmendmentFlag" xlink:title="AmendmentFlag" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="AmendmentFlag" xlink:title="presentation: CoverAbstract to AmendmentFlag" order="1.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_DocumentPeriodEndDate" xlink:label="DocumentPeriodEndDate" xlink:title="DocumentPeriodEndDate" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="DocumentPeriodEndDate" xlink:title="presentation: CoverAbstract to DocumentPeriodEndDate" order="2.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_DocumentFiscalYearFocus" xlink:label="DocumentFiscalYearFocus" xlink:title="DocumentFiscalYearFocus" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="DocumentFiscalYearFocus" xlink:title="presentation: CoverAbstract to DocumentFiscalYearFocus" order="3.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_DocumentFiscalPeriodFocus" xlink:label="DocumentFiscalPeriodFocus" xlink:title="DocumentFiscalPeriodFocus" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="DocumentFiscalPeriodFocus" xlink:title="presentation: CoverAbstract to DocumentFiscalPeriodFocus" order="4.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityFileNumber" xlink:label="EntityFileNumber" xlink:title="EntityFileNumber" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityFileNumber" xlink:title="presentation: CoverAbstract to EntityFileNumber" order="5.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityRegistrantName" xlink:label="EntityRegistrantName" xlink:title="EntityRegistrantName" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityRegistrantName" xlink:title="presentation: CoverAbstract to EntityRegistrantName" order="6.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityCentralIndexKey" xlink:label="EntityCentralIndexKey" xlink:title="EntityCentralIndexKey" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityCentralIndexKey" xlink:title="presentation: CoverAbstract to EntityCentralIndexKey" order="7.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityIncorporationStateCountryCode" xlink:label="EntityIncorporationStateCountryCode" xlink:title="EntityIncorporationStateCountryCode" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityIncorporationStateCountryCode" xlink:title="presentation: CoverAbstract to EntityIncorporationStateCountryCode" order="8.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityTaxIdentificationNumber" xlink:label="EntityTaxIdentificationNumber" xlink:title="EntityTaxIdentificationNumber" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityTaxIdentificationNumber" xlink:title="presentation: CoverAbstract to EntityTaxIdentificationNumber" order="9.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressAddressLine1" xlink:label="EntityAddressAddressLine1" xlink:title="EntityAddressAddressLine1" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressAddressLine1" xlink:title="presentation: CoverAbstract to EntityAddressAddressLine1" order="10.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressAddressLine2" xlink:label="EntityAddressAddressLine2" xlink:title="EntityAddressAddressLine2" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressAddressLine2" xlink:title="presentation: CoverAbstract to EntityAddressAddressLine2" order="11.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressAddressLine3" xlink:label="EntityAddressAddressLine3" xlink:title="EntityAddressAddressLine3" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressAddressLine3" xlink:title="presentation: CoverAbstract to EntityAddressAddressLine3" order="12.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressCityOrTown" xlink:label="EntityAddressCityOrTown" xlink:title="EntityAddressCityOrTown" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressCityOrTown" xlink:title="presentation: CoverAbstract to EntityAddressCityOrTown" order="13.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressStateOrProvince" xlink:label="EntityAddressStateOrProvince" xlink:title="EntityAddressStateOrProvince" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressStateOrProvince" xlink:title="presentation: CoverAbstract to EntityAddressStateOrProvince" order="14.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressCountry" xlink:label="EntityAddressCountry" xlink:title="EntityAddressCountry" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressCountry" xlink:title="presentation: CoverAbstract to EntityAddressCountry" order="15.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityAddressPostalZipCode" xlink:label="EntityAddressPostalZipCode" xlink:title="EntityAddressPostalZipCode" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityAddressPostalZipCode" xlink:title="presentation: CoverAbstract to EntityAddressPostalZipCode" order="16.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_CityAreaCode" xlink:label="CityAreaCode" xlink:title="CityAreaCode" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="CityAreaCode" xlink:title="presentation: CoverAbstract to CityAreaCode" order="17.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_LocalPhoneNumber" xlink:label="LocalPhoneNumber" xlink:title="LocalPhoneNumber" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="LocalPhoneNumber" xlink:title="presentation: CoverAbstract to LocalPhoneNumber" order="18.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_NoTradingSymbolFlag" xlink:label="NoTradingSymbolFlag" xlink:title="NoTradingSymbolFlag" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="NoTradingSymbolFlag" xlink:title="presentation: CoverAbstract to NoTradingSymbolFlag" order="19.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_EntityEmergingGrowthCompany" xlink:label="EntityEmergingGrowthCompany" xlink:title="EntityEmergingGrowthCompany" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="EntityEmergingGrowthCompany" xlink:title="presentation: CoverAbstract to EntityEmergingGrowthCompany" order="20.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_WrittenCommunications" xlink:label="WrittenCommunications" xlink:title="WrittenCommunications" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="WrittenCommunications" xlink:title="presentation: CoverAbstract to WrittenCommunications" order="21.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_SolicitingMaterial" xlink:label="SolicitingMaterial" xlink:title="SolicitingMaterial" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="SolicitingMaterial" xlink:title="presentation: CoverAbstract to SolicitingMaterial" order="22.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_PreCommencementTenderOffer" xlink:label="PreCommencementTenderOffer" xlink:title="PreCommencementTenderOffer" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="PreCommencementTenderOffer" xlink:title="presentation: CoverAbstract to PreCommencementTenderOffer" order="23.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_PreCommencementIssuerTenderOffer" xlink:label="PreCommencementIssuerTenderOffer" xlink:title="PreCommencementIssuerTenderOffer" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="PreCommencementIssuerTenderOffer" xlink:title="presentation: CoverAbstract to PreCommencementIssuerTenderOffer" order="24.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_Security12bTitle" xlink:label="Security12bTitle" xlink:title="Security12bTitle" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="Security12bTitle" xlink:title="presentation: CoverAbstract to Security12bTitle" order="25.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_TradingSymbol" xlink:label="TradingSymbol" xlink:title="TradingSymbol" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="TradingSymbol" xlink:title="presentation: CoverAbstract to TradingSymbol" order="26.0" preferredLabel="http://www.xbrl.org/2003/role/label" />
    <link:loc xlink:type="locator" xlink:href="https://xbrl.sec.gov/dei/2022/dei-2022.xsd#dei_SecurityExchangeName" xlink:label="SecurityExchangeName" xlink:title="SecurityExchangeName" />
    <link:presentationArc xlink:type="arc" xlink:arcrole="http://www.xbrl.org/2003/arcrole/parent-child" xlink:from="CoverAbstract" xlink:to="SecurityExchangeName" xlink:title="presentation: CoverAbstract to SecurityExchangeName" order="27.0" preferredLabel="http://www.xbrl.org/2003/role/label" />

  </link:presentationLink>

</link:linkbase>

1600 Ampihtheatre pkwy.
Mountain View, C.A. 94043
Taxable Maritial Status: Single
Exemptions/Allowances
TX: 28
Federal 941 Deposit Report
ADP
Report Range5/4/2022 - 6/4/2022 Local ID:
EIN: 61-1767919 
State 28
ID txdl 000367305581 
SSN 633441725
Employee Identification Number : III
Employee's Identification Number 
Number:3 
5/4/2022 - 6/4/2022
Payment Amount (Total) $29,246,754,678,763.00 Display All
1. Social Security (Employee + Employer) $26,661.80
2. Medicare (Employee + Employer) $861,193,422,444.20 Hourly
3. Federal Income Tax $8,385,561,229,657.00 $2,266,298,000,000,800
****$70,842,745,000.00**
￼￼
We'll be back shortly.
For real-time updates, follow @ChaseSupport on Twitter.
Our advisors are available weekdays, 7 AM to 9 PM ET, and Saturdays from 8 AM to 5 PM ET.
Telephone bankers may be able to access some account information while our site is unavailable.
You can reach them at one of the numbers below:
Person Checking, Savings & CD 1-800-935-9935
Mortgages 1-800-848-9136
Business Banking 1-800-242-7338
Auto Loans & Leases 1-800-336-6675
Home Equity Line of Credit Loans 1-800-836-5656
Student Loans 1-800-487-4404
Retirement self-directed Accounts 1-800-776-6061
J.P.Morgan Securities 1-888-807-6898
Chase private Client(or contact your Private Client Banker)1-888-994-5626
Investments/Retirement1-800-392-5749
Credit Cards Call the number on the back of your credit card
Chase Commercial Online SM Call your Client Service Professional or Client Service Officer
© 2014 JPMorgan Chase & and Co. 3021343159562092479 
Fiscal year end September 28th., 2022. | USD. et. al. 
 Instructions.
'"'' ':''":,
