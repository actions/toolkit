/**
 * Promisifies a a function type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PromisifiedFn<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => ReturnType<T> extends Promise<unknown>
  ? ReturnType<T>
  : Promise<ReturnType<T>>

/**
 * Promisifies a function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const promisifyFn = <T extends (...args: any[]) => any>(
  fn: T
): PromisifiedFn<T> => {
  const result = async (...args: Parameters<T>): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      try {
        resolve(fn(...args))
      } catch (error) {
        reject(error)
      }
    })
  }

  return result as PromisifiedFn<T>
}

/**
 * Removes all whitespaces from a string
 */
export const removeWhitespaces = (str: string): string => str.replace(/\s/g, '')
