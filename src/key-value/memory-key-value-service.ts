import { KeyValueService } from './key-value-service.js'

/**
 * createMemoryStore creates a `KeyValueService` that stores values in redis.
 * Doesn't currently support expiration.
 *
 * > This should be migrated to a class-based implementation e.g. `InMemoryService`
 */
export function createMemoryStore(): KeyValueService {
  const data = new Map<string, any>()

  return {
    async retrieve(key) {
      return data.get(key)
    },
    async put(key, value) {
      data.set(key, value)
    },
    async checkHealth() {
      // What could go wrong?
    },
    async setExpiry(key, duration) {
      // ...
    },
    async delete(key) {
      data.delete(key)
    },
    async close() {
      // ...
    },
  }
}
