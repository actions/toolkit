setTimeout(() => {
  process.kill(process.pid, 'SIGTERM')
}, 50)
