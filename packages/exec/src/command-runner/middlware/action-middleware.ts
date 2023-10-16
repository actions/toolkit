import * as core from '@actions/core'
import {CommandRunnerAction} from '../types'
import {getEvents} from '../get-events'

/**
 * Fails Github Action with the given message or with a default one depending on execution conditions.
 */
export const failAction: CommandRunnerAction = message => async ctx => {
  const events = getEvents(ctx)

  if (message !== undefined) {
    core.setFailed(typeof message === 'string' ? message : message(ctx, events))
    return
  }

  if (events.includes('execerr')) {
    core.setFailed(
      `The command "${ctx.commandLine}" failed to run: ${ctx.execerr?.message}`
    )

    return
  }

  if (events.includes('stderr')) {
    core.setFailed(
      `The command "${ctx.commandLine}" finished with exit code ${ctx.exitCode} and produced an error: ${ctx.stderr}`
    )

    return
  }

  if (!events.includes('stdout')) {
    core.setFailed(
      `The command "${ctx.commandLine}" finished with exit code ${ctx.exitCode} and produced an empty output.`
    )

    return
  }

  core.setFailed(
    `The command "${ctx.commandLine}" finished with exit code ${ctx.exitCode} and produced the following output: ${ctx.stdout}`
  )
}

/**
 * Throws an error with the given message or with a default one depending on execution conditions.
 */
export const throwError: CommandRunnerAction = message => {
  return async ctx => {
    const events = getEvents(ctx)

    if (message !== undefined) {
      throw new Error(
        typeof message === 'string' ? message : message(ctx, events)
      )
    }

    if (events.includes('execerr')) {
      throw new Error(
        `The command "${ctx.commandLine}" failed to run: ${ctx.execerr?.message}`
      )
    }

    if (events.includes('stderr')) {
      throw new Error(
        `The command "${ctx.commandLine}" finished with exit code ${ctx.exitCode} and produced an error: ${ctx.stderr}`
      )
    }

    if (!events.includes('stdout')) {
      throw new Error(
        `The command "${ctx.commandLine}" finished with exit code ${ctx.exitCode} and produced an empty output.`
      )
    }

    throw new Error(
      `The command "${ctx.commandLine}" finished with exit code ${ctx.exitCode} and produced the following output: ${ctx.stdout}`
    )
  }
}

/**
 * Logs a message with the given message or with a default one depending on execution conditions.
 */
export const produceLog: CommandRunnerAction = message => async (ctx, next) => {
  const events = getEvents(ctx)

  if (message !== undefined) {
    // core.info(typeof message === 'string' ? message : message(ctx, []))
    const messageText =
      typeof message === 'string' ? message : message(ctx, events)

    if (events.includes('execerr')) {
      core.error(messageText)
      next()
      return
    }

    if (events.includes('stderr')) {
      core.error(messageText)
      next()
      return
    }

    if (!events.includes('stdout')) {
      core.warning(messageText)
      next()
      return
    }

    if (events.includes('ok')) {
      core.notice(messageText)
      next()
      return
    }

    core.info(messageText)
    next()
    return
  }

  if (events.includes('execerr')) {
    core.error(
      `The command "${ctx.commandLine}" failed to run: ${ctx.execerr?.message}`
    )
    next()
    return
  }

  if (events.includes('stderr')) {
    core.error(
      `The command "${ctx.commandLine}" finished with exit code ${ctx.exitCode} and produced an error: ${ctx.stderr}`
    )
    next()
    return
  }

  if (!events.includes('stdout')) {
    core.warning(
      `The command "${ctx.commandLine}" finished with exit code ${ctx.exitCode} and produced an empty output.`
    )
    next()
    return
  }

  if (events.includes('ok')) {
    core.notice(
      `The command "${ctx.commandLine}" finished with exit code ${ctx.exitCode} and produced the following output: ${ctx.stdout}`
    )
    next()
    return
  }

  core.info(
    `The command "${ctx.commandLine}" finished with exit code ${ctx.exitCode} and produced the following output: ${ctx.stdout}`
  )
  next()
}
