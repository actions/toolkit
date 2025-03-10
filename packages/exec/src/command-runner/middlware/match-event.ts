import {composeMiddleware} from '../core'
import {getEvents} from '../get-events'
import {
  CommandRunnerEventTypeExtended,
  CommandRunnerMiddleware,
  CommandRunnerEventType
} from '../types'
import {PromisifiedFn} from '../utils'
import {passThrough} from './pass-through'

/**
 * Will call passed middleware if matching event has occured.
 * Will call the next middleware otherwise.
 */
export const matchEvent = (
  eventType: CommandRunnerEventTypeExtended | CommandRunnerEventTypeExtended[],
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

  const expectedEventsPositiveArray = (
    Array.isArray(eventType) ? eventType : [eventType]
  ).filter(e => !e.startsWith('!')) as CommandRunnerEventType[]

  const expectedEventsNegativeArray = (
    Array.isArray(eventType) ? eventType : [eventType]
  )
    .filter(e => e.startsWith('!'))
    .map(e => e.slice(1)) as CommandRunnerEventType[]

  const expectedEventsPositive = new Set(expectedEventsPositiveArray)
  const expectedEventsNegative = new Set(expectedEventsNegativeArray)

  return async (ctx, next) => {
    const currentEvents = getEvents(ctx)
    let shouldRun = false

    if (
      expectedEventsPositive.size &&
      currentEvents.some(e => expectedEventsPositive.has(e))
    ) {
      shouldRun = true
    }

    if (
      expectedEventsNegative.size &&
      currentEvents.every(e => !expectedEventsNegative.has(e))
    ) {
      shouldRun = true
    }

    if (shouldRun) {
      await composedMiddleware(ctx, next)
      return
    }

    next()
  }
}
