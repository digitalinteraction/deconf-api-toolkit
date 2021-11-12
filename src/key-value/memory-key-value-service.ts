import { KeyValueService } from './key-value-service'

/** An in-memory key-value store, for development and testing */
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
