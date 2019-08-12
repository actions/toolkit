# Debugging
If the build logs do not provide enough detail on why a build may be failing, some other options exist to assist with troubleshooting.

## Runner Diagnostic Logs
Runner Diagnostic Logs provide insight on how the Runner is executing an action. This information is provided in two files, the runner file and the worker file.

These files contain the prefix `Runner_` or `Worker_` to indicate the file type.

Each log file contains different logging information that corresponds to that process:
  * The Runner process coordinates setting up workers to execute jobs.
  * The Worker process executes the job.

### How to Access Runner Diagnostic Logs
These log files are enabled by [setting the secret](https://help.github.com/en/articles/virtual-environments-for-github-actions#creating-and-using-secrets-encrypted-variables) `ACTIONS_RUNNER_DEBUG` to `true`. 

All actions ran while this secret is enabled contain additional diagnostic log files in the `runner-diagnostic-logs` folder of the [log archive](https://help.github.com/en/articles/managing-a-workflow-run#downloading-logs-and-artifacts).

## Step Debug Logs
Step debug Logs increase the verbosity of a jobs logs during and after a job's execution to assist with troubleshooting. 

Additional log events with the prefix `##[debug]` will now also appear in the job's logs.

### How to Access Step Debug Logs
This flag can be enabled by [setting the secret](https://help.github.com/en/articles/virtual-environments-for-github-actions#creating-and-using-secrets-encrypted-variables) `ACTIONS_STEP_DEBUG` to `true`.

All actions ran while this secret is enabled will show debug events n the [Downloaded Logs](https://help.github.com/en/articles/managing-a-workflow-run#downloading-logs-and-artifacts) and [Web Logs](https://help.github.com/en/articles/managing-a-workflow-run#viewing-logs-to-diagnose-failures).
