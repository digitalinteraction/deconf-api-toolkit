import { DeconfBaseContext } from './context'
import os from 'os'

/** A lock record stored in redis */
export interface LockRecord {
  time: number
  hostname: string
}

type Context = Pick<DeconfBaseContext, 'store'>

export class SemaphoreService {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  /** Returns true if the lock is aquired */
  async aquire(lockKey: string, maxAgeMs: number) {
    try {
      const lock = await this.#context.store.retrieve<LockRecord>(lockKey)

      if (lock && Date.now() - lock.time < maxAgeMs) return false

      await this.#context.store.put<LockRecord>(lockKey, {
        time: Date.now(),
        hostname: os.hostname(),
      })

      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown reason'
      throw new Error(`Failed to check lock: ${message}`)
    }
  }

  /** Returns true if the lock is released */
  async release(lockKey: string) {
    const lock = await this.#context.store.retrieve<LockRecord>(lockKey)
    if (!lock) return true

    if (lock.hostname !== os.hostname()) return false

    this.#context.store.delete(lockKey)
    return true
  }

  /** Check if the current host has the lock */
  async hasLock(lockKey: string) {
    const lock = await this.#context.store.retrieve<LockRecord>(lockKey)
    return lock?.hostname === os.hostname()
  }
}
