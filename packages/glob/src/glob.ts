import {Globber, DefaultGlobber} from './internal-globber'
import {GlobOptions} from './internal-glob-options'

export {Globber, GlobOptions}

/**
 * Constructs a globber
 *
 * @param patterns  Patterns separated by newlines
 */
export async function create(patterns: string): Promise<Globber> {
  return await DefaultGlobber.parse(patterns)
}
