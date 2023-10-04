import * as core from '@actions/core'
import {
  CommandRunnerContext,
  CommandRunnerEventType,
  CommandRunnerEventTypeExtended,
  CommandRunnerMiddleware,
  CommandRunnerMiddlewarePromisified
} from './types'
import {
  composeCommandRunnerMiddleware,
  promisifyCommandRunnerMiddleware
} from './core'

const getEventTypesFromContext = (
  ctx: CommandRunnerContext
): CommandRunnerEventType[] => {
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

  return [...eventTypes]
}

type CommandRunnerAction = (
  message?:
    | string
    | ((ctx: CommandRunnerContext, events: CommandRunnerEventType[]) => string)
) => CommandRunnerMiddlewarePromisified

/**
 * Basic middleware
 */

/**
 * Fails Github Action with the given message or with a default one depending on execution conditions.
 */
export const failAction: CommandRunnerAction = message => async ctx => {
  const events = getEventTypesFromContext(ctx)

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
export const throwError: CommandRunnerAction = message => async ctx => {
  const events = getEventTypesFromContext(ctx)

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

/**
 * Logs a message with the given message or with a default one depending on execution conditions.
 */
export const produceLog: CommandRunnerAction = message => async (ctx, next) => {
  const events = getEventTypesFromContext(ctx)

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

/**
 * Filtering middleware
 */

/** Calls next middleware */
export const passThrough: () => CommandRunnerMiddlewarePromisified =
  () => async (_, next) =>
    next()

/**
 * Either calls next middleware or not depending on the result of the given condition.
 */
export const filter: (
  shouldPass:
    | boolean
    | ((ctx: CommandRunnerContext) => boolean | Promise<boolean>)
) => CommandRunnerMiddlewarePromisified = shouldPass => async (ctx, next) => {
  if (typeof shouldPass === 'function') {
    if (await shouldPass(ctx)) {
      next()
      return
    }
  }
}

/**
 * Will call passed middleware if matching event has occured.
 * Will call the next middleware otherwise.
 */
export const matchEvent = (
  eventType: CommandRunnerEventTypeExtended | CommandRunnerEventTypeExtended[],
  middleware?: CommandRunnerMiddleware[]
): CommandRunnerMiddlewarePromisified => {
  if (!middleware?.length) {
    middleware = [passThrough()]
  }

  const composedMiddleware = composeCommandRunnerMiddleware(
    middleware.map(mw => promisifyCommandRunnerMiddleware(mw))
  )

  const expectedEventsPositiveArray = (
    Array.isArray(eventType) ? eventType : [eventType]
  ).filter(e => !e.startsWith('!')) as CommandRunnerEventType[]

  const expectedEventsNegativeArray = (
    Array.isArray(eventType) ? eventType : [eventType]
  )
    .filter(e => e.startsWith('!'))
    .map(e => e.slice(1)) as CommandRunnerEventType[]

  const expectedEventsPositive = new Set(expectedEventsPositiveArray)
  const expectedEventsNegative = new Set(expectedEventsNegativeArray)

  return async (ctx, next) => {
    const currentEvents = getEventTypesFromContext(ctx)
    let shouldRun = false

    if (
      expectedEventsPositive.size &&
      currentEvents.some(e => expectedEventsPositive.has(e))
    ) {
      shouldRun = true
    }

    if (
      expectedEventsNegative.size &&
      currentEvents.every(e => !expectedEventsNegative.has(e))
    ) {
      shouldRun = true
    }

    if (shouldRun) {
      composedMiddleware(ctx, next)
      return
    }

    next()
  }
}

export type OutputMatcher = RegExp | string | ((output: string) => boolean)

/**
 * Will call passed middleware if matching event has occured.
 * Will call the next middleware otherwise.
 */
export const matchOutput = (
  matcher: OutputMatcher,
  middleware?: CommandRunnerMiddleware[]
): CommandRunnerMiddlewarePromisified => {
  if (!middleware?.length) {
    middleware = [passThrough()]
  }

  const composedMiddleware = composeCommandRunnerMiddleware(
    middleware.map(mw => promisifyCommandRunnerMiddleware(mw))
  )

  return async (ctx, next) => {
    const output = ctx.stdout

    if (output === null) {
      next()
      return
    }

    if (typeof matcher === 'function' && !matcher(output)) {
      next()
      return
    }

    if (typeof matcher === 'string' && output !== matcher) {
      next()
      return
    }

    if (matcher instanceof RegExp && !matcher.test(output)) {
      next()
      return
    }

    composedMiddleware(ctx, next)
  }
}

export type ExitCodeMatcher = string | number

const lte =
  (a: number) =>
  (b: number): boolean =>
    b <= a
const gte =
  (a: number) =>
  (b: number): boolean =>
    b >= a
const lt =
  (a: number) =>
  (b: number): boolean =>
    b < a
const gt =
  (a: number) =>
  (b: number): boolean =>
    b > a
const eq =
  (a: number) =>
  (b: number): boolean =>
    b === a

const matchers = {
  '>=': gte,
  '>': gt,
  '<=': lte,
  '<': lt,
  '=': eq
} as const

const removeWhitespaces = (str: string): string => str.replace(/\s/g, '')

const parseExitCodeMatcher = (
  code: ExitCodeMatcher
): [keyof typeof matchers, number] => {
  if (typeof code === 'number') {
    return ['=', code]
  }

  code = removeWhitespaces(code)

  // just shortcuts for the most common cases
  if (code.startsWith('=')) return ['=', Number(code.slice(1))]
  if (code === '>0') return ['>', 0]
  if (code === '<1') return ['<', 1]

  const match = code.match(/^([><]=?)(\d+)$/)

  if (match === null) {
    throw new Error(`Invalid exit code matcher: ${code}`)
  }

  const [, operator, number] = match
  return [operator as keyof typeof matchers, parseInt(number)]
}

const matcherToMatcherFn = (
  matcher: ExitCodeMatcher
): ((exitCode: number) => boolean) => {
  const [operator, number] = parseExitCodeMatcher(matcher)
  return matchers[operator](number)
}

/**
 * Will call passed middleware if matching exit code was returned.
 * Will call the next middleware otherwise.
 */
export const matchExitCode = (
  code: ExitCodeMatcher,
  middleware?: CommandRunnerMiddleware[]
): CommandRunnerMiddlewarePromisified => {
  const matcher = matcherToMatcherFn(code)

  if (!middleware?.length) {
    middleware = [passThrough()]
  }

  const composedMiddleware = composeCommandRunnerMiddleware(
    middleware.map(mw => promisifyCommandRunnerMiddleware(mw))
  )

  return async (ctx, next) => {
    // if exit code is undefined, NaN will not match anything
    if (matcher(ctx.exitCode ?? NaN)) {
      composedMiddleware(ctx, next)
      return
    }

    next()
  }
}

export type ErrorMatcher =
  | RegExp
  | string
  | ((error: {
      type: 'stderr' | 'execerr'
      error: Error | null
      message: string
    }) => boolean)

export const matchSpecificError = (
  matcher: ErrorMatcher,
  middleware?: CommandRunnerMiddleware[]
): CommandRunnerMiddlewarePromisified => {
  if (!middleware?.length) {
    middleware = [passThrough()]
  }

  const composedMiddleware = composeCommandRunnerMiddleware(
    middleware.map(mw => promisifyCommandRunnerMiddleware(mw))
  )

  return async (ctx, next) => {
    if (ctx.execerr === null && ctx.stderr === null) {
      next()
      return
    }

    const error: {
      type: 'stderr' | 'execerr'
      error: Error | null
      message: string
    } = {
      type: ctx.execerr ? 'execerr' : 'stderr',
      error: ctx.execerr ? ctx.execerr : null,
      message: ctx.execerr ? ctx.execerr.message : ctx.stderr ?? ''
    }

    if (typeof matcher === 'function' && !matcher(error)) {
      next()
      return
    }

    if (typeof matcher === 'string' && error.message !== matcher) {
      next()
      return
    }

    if (matcher instanceof RegExp && !matcher.test(error.message)) {
      next()
      return
    }

    composedMiddleware(ctx, next)
  }
}
