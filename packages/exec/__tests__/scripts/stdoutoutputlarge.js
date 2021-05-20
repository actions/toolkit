//Default highWaterMark for readable stream buffers us 64K (2^16)
//so we go over that to get more than a buffer's worth
process.stdout.write('a\n'.repeat(2**24));
