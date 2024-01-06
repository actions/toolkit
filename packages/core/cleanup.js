const core = require('@actions/core');

var pid = core.getState("pidToKill");

process.kill(pid);
