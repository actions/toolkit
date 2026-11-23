// Writes a multi-byte UTF-8 character in two separate chunks so that the
// character straddles the chunk boundary, then terminates the line.
//
// `node splitlineoutput.cjs` writes U+1F642 as `f0 9f` then `99 82` + EOL to stdout.
// `node splitlineoutput.cjs --stderr` does the same on stderr.
const emoji = Buffer.from('\u{1F642}', 'utf8') // f0 9f 99 82
const os = require('os')

const out = process.argv.includes('--stderr') ? process.stderr : process.stdout

out.write(emoji.subarray(0, 2), () => {
  // A pause guarantees the two writes are delivered as separate chunks
  // instead of being coalesced into one pipe read.
  setTimeout(() => {
    out.write(Buffer.concat([emoji.subarray(2), Buffer.from(os.EOL)]))
  }, 50)
})
