import {composeMiddleware} from '../core'
import {passThrough} from './pass-through'
import {CommandRunnerMiddleware} from '../types'
import {PromisifiedFn} from '../utils'

/**
 * Matcher types that are available to user to match output against
 * and set middleware on
 */
export type OutputMatcher = RegExp | string | ((output: string) => boolean)

/**
 * Will call passed middleware if command produced a matching stdout.
 * Will call the next middleware otherwise. Will also call the next middleware
 * if stdout is null (command did not run).
 */
export const matchOutput = (
  matcher: OutputMatcher,
  middleware?: CommandRunnerMiddleware[]
): PromisifiedFn<CommandRunnerMiddleware> => {
  /**
   * Composes passed middleware if any or replaces them
   * with passThrough middleware if none were passed
   * to avoid errors when calling composed middleware
   */
  const composedMiddleware = composeMiddleware(
    !middleware?.length ? [passThrough()] : middleware
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

    await composedMiddleware(ctx, next)
  }
}
