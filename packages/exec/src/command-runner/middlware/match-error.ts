import {composeMiddleware} from '../core'
import {passThrough} from './pass-through'
import {CommandRunnerMiddleware} from '../types'
import {PromisifiedFn} from '../utils'

/**
 * Matcher types that are available to user to match error against
 * and set middleware on
 */
export type ErrorMatcher =
  | RegExp
  | string
  | ((error: {
      type: 'stderr' | 'execerr'
      error: Error | null
      message: string
    }) => boolean)

/**
 * Will call passed middleware if matching error has occured.
 * If matching error has occured will call passed middleware. Will call the next middleware otherwise.
 */
export const matchSpecificError = (
  matcher: ErrorMatcher,
  middleware?:
    | CommandRunnerMiddleware[]
    | PromisifiedFn<CommandRunnerMiddleware>[]
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

    await composedMiddleware(ctx, next)
  }
}
