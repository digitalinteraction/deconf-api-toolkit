import Redis = require('ioredis')

/**
 * A service for interacting with a redis instance
 */
export interface RedisService {
  ping(): Promise<void>
  close(): Promise<void>

  get(key: string): Promise<string | null>
  getJson<T>(key: string, fallback: T): Promise<T>

  set(key: string, value: string): Promise<void>
  setJson<T>(key: string, value: T): Promise<void>

  setExpiry(key: string, durationInSeconds: number): Promise<void>
  delete(key: string): Promise<void>
}

export function createRedisService(redisUrl: string): RedisService {
  const redis = new Redis(redisUrl)

  return {
    async ping() {
      if (redis.status !== 'ready') throw new Error('Not connected')
      await redis.ping()
    },
    async close() {
      await redis.quit()
    },
    get(key) {
      return redis.get(key)
    },
    getJson(key, fallback) {
      return redis
        .get(key)
        .then((text) => (text ? JSON.parse(text) : fallback))
        .catch(() => fallback)
    },

    async set(key, value) {
      await redis.set(key, value)
    },
    async setJson(key, value) {
      await redis.set(key, JSON.stringify(value))
    },

    async setExpiry(key, durationInSeconds) {
      await redis.expire(key, durationInSeconds)
    },
    async delete(key) {
      await redis.del(key)
    },
  }
}
