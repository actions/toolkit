import {CommandRunner} from './command-runner'
import * as io from '@actions/io'

;(async () => {
  const toolpath = await io.which('cmd', true)
  const args = ['/c', 'echo']

  const echo = new CommandRunner('echo')

  echo
    .on('exec-error', 'log')
    .use(async (ctx, next) => {
      console.log('success')
      next()
    })
    .addArgs('hello')
    .run()
})()
