import {Globber, DefaultGlobber} from './internal-globber';
import {GlobOptions} from './internal-glob-options';

export {Globber, GlobOptions};

/**
 * Constructs a globber
 *
 * @param patterns  Patterns separated by newlines
 * @param options   Glob options
 */
export async function create(
  patterns: string,
  options?: GlobOptions
): Promise<Globber> {
  return await DefaultGlobber.create(patterns, options);
}
