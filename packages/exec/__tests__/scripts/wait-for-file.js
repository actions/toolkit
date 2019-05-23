var fs = require('fs');

// get the command line args that use the format someArg=someValue
var args = {};
process.argv.forEach(function (arg) {
    var match = arg.match(/^(.+)=(.*)$/);
    if (match) {
        args[match[1]] = match[2];
    }
});

var state = {
    file: args.file
};

if (!state.file) {
    throw new Error('file is not specified');
}

state.checkFile = function (s) {
    try {
        fs.statSync(s.file);
    }
    catch (err) {
        if (err.code == 'ENOENT') {
            return;
        }

        throw err;
    }

    setTimeout(s.checkFile, 100, s);
};

state.checkFile(state);