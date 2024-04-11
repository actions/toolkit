import {Predicate, Subject} from './shared.types'

const INTOTO_STATEMENT_V1_TYPE = 'https://in-toto.io/Statement/v1'

/**
 * An in-toto statement.
 * https://github.com/in-toto/attestation/blob/main/spec/v1/statement.md
 */
export type InTotoStatement = {
  _type: string
  subject: Subject[]
  predicateType: string
  predicate: object
}

/**
 * Assembles the given subject and predicate into an in-toto statement.
 * @param subject - The subject of the statement.
 * @param predicate - The predicate of the statement.
 * @returns The constructed in-toto statement.
 */
export const buildIntotoStatement = (
  subject: Subject,
  predicate: Predicate
): InTotoStatement => {
  return {
    _type: INTOTO_STATEMENT_V1_TYPE,
    subject: [subject],
    predicateType: predicate.type,
    predicate: predicate.params
  }
}
