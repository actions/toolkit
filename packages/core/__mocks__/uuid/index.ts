import {v4 as v4uuid} from 'uuid'
import {vi} from 'vitest'

export const v4 = vi.fn<never, ReturnType<typeof v4uuid>>(
  () => '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
)
