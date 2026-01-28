//first half of © character
process.stdout.write(Buffer.from([0xC2]), (err) => {
    //write in the callback so that the second byte is sent separately
    setTimeout(() => {
        process.stdout.write(Buffer.from([0xA9])) //second half of © character
    }, 5000)
   
})
