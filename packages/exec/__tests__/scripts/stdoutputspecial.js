process.stdout.write(Buffer.from([0xC2])) //first half of © character
process.stdout.emit('drain') //force first byte to be sent and not appended with next one
process.stdout.write(Buffer.from([0xA9])) //second half of © character

