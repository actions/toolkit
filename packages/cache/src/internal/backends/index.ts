import {CacheBackend} from './backend.js'
import {v1Backend} from './v1.js'
import {v2Backend} from './v2.js'

export type {CacheBackend}

export function getCacheBackend(cacheServiceVersion: string): CacheBackend {
  switch (cacheServiceVersion) {
    case 'v2':
      return v2Backend
    case 'v1':
    default:
      return v1Backend
  }
}
