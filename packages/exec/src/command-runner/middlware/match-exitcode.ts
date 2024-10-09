import {composeMiddleware} from '../core'
import {passThrough} from './pass-through'
import {CommandRunnerMiddleware} from '../types'
import {PromisifiedFn, removeWhitespaces} from '../utils'

/**
 * Matcher types that are available to user to match exit code against
 * and set middleware on
 */
export type ExitCodeMatcher = string | number

/**
 * Comparators
 */
export const lte =
  (a: number) =>
  (b: number): boolean =>
    b <= a
export const gte =
  (a: number) =>
  (b: number): boolean =>
    b >= a
export const lt =
  (a: number) =>
  (b: number): boolean =>
    b < a
export const gt =
  (a: number) =>
  (b: number): boolean =>
    b > a
export const eq =
  (a: number) =>
  (b: number): boolean =>
    b === a

const MATCHERS = {
  '>=': gte,
  '>': gt,
  '<=': lte,
  '<': lt,
  '=': eq
} as const

const parseExitCodeMatcher = (
  code: ExitCodeMatcher
): [keyof typeof MATCHERS, number] => {
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
  return [operator as keyof typeof MATCHERS, parseInt(number)]
}

/**
 * Will call passed middleware if matching exit code was returned.
 * Will call the next middleware otherwise. Will also call next middleware
 * if exit code is null (command did not run).
 */
export const matchExitCode = (
  code: ExitCodeMatcher,
  middleware?: CommandRunnerMiddleware[]
): PromisifiedFn<CommandRunnerMiddleware> => {
  const [operator, number] = parseExitCodeMatcher(code)

  // sets appropriate matching function
  const matcherFn = MATCHERS[operator](number)

  /**
   * Composes passed middleware if any or replaces them
   * with passThrough middleware if none were passed
   * to avoid errors when calling composed middleware
   */
  const composedMiddleware = composeMiddleware(
    !middleware?.length ? [passThrough()] : middleware
  )

  return async (ctx, next) => {
    // if exit code is undefined, NaN will not match anything
    if (matcherFn(ctx.exitCode ?? NaN)) {
      await composedMiddleware(ctx, next)
      return
    }

    next()
  }
}
