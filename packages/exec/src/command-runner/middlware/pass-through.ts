import {CommandRunnerMiddleware} from '../types'
import {PromisifiedFn} from '../utils'

/** Calls next middleware */
export const passThrough: () => PromisifiedFn<CommandRunnerMiddleware> =
  () => async (_, next) =>
    next()
