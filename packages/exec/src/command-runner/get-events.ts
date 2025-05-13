import {CommandRunnerContext, CommandRunnerEventType} from './types'

/**
 * Keeps track of already computed events for context
 * to avoid recomputing them
 */
let contextEvents: WeakMap<
  CommandRunnerContext,
  CommandRunnerEventType[]
> | null = null

/**
 * Returns event types that were triggered by the command execution
 */
export const getEvents = (
  ctx: CommandRunnerContext
): CommandRunnerEventType[] => {
  const existingEvents = contextEvents?.get(ctx)

  if (existingEvents) {
    return existingEvents
  }

  const eventTypes = new Set<CommandRunnerEventType>()

  if (ctx.execerr) {
    eventTypes.add('execerr')
  }

  if (ctx.stderr) {
    eventTypes.add('stderr')
  }

  if (ctx.exitCode) {
    eventTypes.add('exitcode')
  }

  if (ctx.stdout) {
    eventTypes.add('stdout')
  }

  if (!ctx.stderr && !ctx.execerr && ctx.stdout !== null && !ctx.exitCode) {
    eventTypes.add('ok')
  }

  const result = [...eventTypes]

  if (!contextEvents) {
    contextEvents = new WeakMap()
  }

  contextEvents.set(ctx, result)

  return result
}
