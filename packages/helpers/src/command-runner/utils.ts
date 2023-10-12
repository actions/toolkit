/**
 * Promises
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PromisifiedFn<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => ReturnType<T> extends Promise<unknown>
  ? ReturnType<T>
  : Promise<ReturnType<T>>

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
