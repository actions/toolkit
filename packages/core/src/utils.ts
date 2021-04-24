// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Sanitizes an input into a string so it can be passed into issueCommand safely
 * @param input input to sanitize into a string
 */
export function toCommandValue(input: any): string {
  if (input === null || input === undefined) {
    return '';
  } else if (typeof input === 'string' || input instanceof String) {
    return input as string;
  }
  return JSON.stringify(input);
}
