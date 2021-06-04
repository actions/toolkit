# Debugging
If the job logs do not provide enough detail on why a job may be failing, some other options exist to assist with troubleshooting.

## Step Debug Logs
This is the primary way for customers to debug job failures caused by failed steps.

Step debug logs increase the verbosity of a job's logs during and after a job's execution to assist with troubleshooting.

Additional log events with the prefix `::debug::` will now also appear in the job's logs, these log events are provided by the Action's author and the runner process.

### How to Access Step Debug Logs
This flag can be enabled by [setting the secret](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets#creating-encrypted-secrets) `ACTIONS_STEP_DEBUG` to `true`.

All actions ran while this secret is enabled will show debug events in the [Downloaded Logs](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/managing-a-workflow-run#downloading-logs) and [Web Logs](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/managing-a-workflow-run#viewing-logs-to-diagnose-failures).

## Runner Diagnostic Logs
Runner Diagnostic Logs provide additional log files detailing how the Runner is executing an action.

You need the runner diagnostic logs only if you think there is an infrastructure problem with GitHub Actions and you want the product team to check the logs.

Each file contains different logging information that corresponds to that process:
  * The Runner process coordinates setting up workers to execute jobs.
  * The Worker process executes the job.

These files contain the prefix `Runner_` or `Worker_` to indicate the log source.

### How to Access Runner Diagnostic Logs
These log files are enabled by [setting the secret](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/creating-and-using-encrypted-secrets#creating-encrypted-secrets) `ACTIONS_RUNNER_DEBUG` to `true`. 

All actions ran while this secret is enabled contain additional diagnostic log files in the `runner-diagnostic-logs` folder of the [log archive](https://help.github.com/en/actions/automating-your-workflow-with-github-actions/managing-a-workflow-run#downloading-logs).

