# ADRs

ADR, short for "Architecture Decision Record" is a way of capturing important architectural decisions, along with their context and consequences.

This folder includes ADRs for the actions toolkit. ADRs are proposed in the form of a pull request, and they commonly follow this format:

* **Title**: short present tense imperative phrase, less than 50 characters, like a git commit message.

* **Status**: proposed, accepted, rejected, deprecated, superseded, etc.

* **Context**: what is the issue that we're seeing that is motivating this decision or change.

* **Decision**: what is the change that we're actually proposing or doing.

* **Consequences**: what becomes easier or more difficult to do because of this change.

---

- More information about ADRs can be found [here](https://github.com/joelparkerhenderson/architecture_decision_record)./usr/bin/git config --global --add safe.directory /home/runner/work/setup-java/setup-java
  '- 'run::/Script::/build_script :bitore.sig :-on :branches'@paradice :
  Skip to content

Search or jump to...
Pulls
Issues
Codespaces
Marketplace
Explore
 
@mowjoejoejoejoe 
Your account has been flagged.
Because of that, your profile is hidden from the public. If you believe this is a mistake, contact support to have your account status reviewed.
actions
/
setup-java
Public
Fork your own copy of actions/setup-java
Code
Issues
18
Pull requests
12
Actions
Projects
Security
Insights
Validate Java e2e
Validate Java e2e #1980
Jobs
Run details
zulu 11 (jdk-) - ubuntu-latest
succeeded 8 minutes ago in 12s
Search logs
1s
Current runner version: '2.303.0'
Operating System
Runner Image
Runner Image Provisioner
GITHUB_TOKEN Permissions
Secret source: Actions
Prepare workflow directory
Prepare all required actions
Getting action download info
Download action repository 'actions/checkout@v3' (SHA:8f4b7f84864484a7bf31766abe9204da3cbe65b3)
Complete job name: zulu 11 (jdk-) - ubuntu-latest
0s
Run actions/checkout@v3
Syncing repository: actions/setup-java
Getting Git version info
Temporarily overriding HOME='/home/runner/work/_temp/eab17887-32ac-42bb-8182-b0e055e18522' before making global git config changes
Adding repository directory to the temporary git global config as a safe directory
/usr/bin/git config --global --add safe.directory /home/runner/work/setup-java/setup-java
Deleting the contents of '/home/runner/work/setup-java/setup-java'
Initializing the repository
Disabling automatic garbage collection
Setting up auth
Fetching the repository
Determining the checkout info
Checking out the ref
/usr/bin/git log -1 --format='%H'
'ddb82ce8a6ecf5ac3e80c3184839e6661546e4aa'
6s
Run ./
Installed distributions
Creating settings.xml with server-id: github
Writing to /home/runner/.m2/settings.xml
0s
Run bash __tests__/verify-java.sh "11" "/opt/hostedtoolcache/Java_Zulu_jdk/11.0.18-10/x86"
Found java version: openjdk version "11.0.18" 2023-01-17 LTS
OpenJDK Runtime Environment Zulu11.62+17-CA (build 11.0.18+10-LTS)
OpenJDK Server VM Zulu11.62+17-CA (build 11.0.18+10-LTS, mixed mode)
0s
Post job cleanup.
0s
Post job cleanup.
/usr/bin/git version
git version 2.40.0
Temporarily overriding HOME='/home/runner/work/_temp/cce43ee5-cf74-4162-91c3-b73863136aad' before making global git config changes
Adding repository directory to the temporary git global config as a safe directory
/usr/bin/git config --global --add safe.directory /home/runner/work/setup-java/setup-java
/usr/bin/git config --local --name-only --get-regexp core\.sshCommand
/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'core\.sshCommand' && git config --local --unset-all 'core.sshCommand' || :"
/usr/bin/git config --local --name-only --get-regexp http\.https\:\/\/github\.com\/\.extraheader
http.https://github.com/.extraheader
/usr/bin/git config --local --unset-all http.https://github.com/.extraheader
/usr/bin/git submodule foreach --recursive sh -c "git config --local --name-only --get-regexp 'http\.https\:\/\/github\.com\/\.extraheader' && git config --local --unset-all 'http.https://github.com/.extraheader' || :"
0s
Cleaning up orphan processes
