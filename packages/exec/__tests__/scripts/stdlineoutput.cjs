//Default highWaterMark for readable stream buffers us 64K (2^16)
//so we go over that to get more than a buffer's worth
const os = require('os')

process.stdout.write('a'.repeat(2**16 + 1) + os.EOL);
