var fs = require('fs')
var data = fs.readFileSync(0, 'utf-8')
process.stdout.write(data)
