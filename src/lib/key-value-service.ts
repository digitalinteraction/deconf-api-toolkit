export interface KeyValueService {
  retrieve<T>(key: string): Promise<T | null>
  put<T>(key: string, value: T): Promise<void>
  checkHealth(): Promise<void>
  setExpiry(key: string, duractionInSeconds: number): Promise<void>
  delete(key: string): Promise<void>
  close(): Promise<void>
}

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
      // ...
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
