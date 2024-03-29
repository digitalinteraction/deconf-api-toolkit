import { DeconfBaseContext } from '../lib/context.js'
import ms from 'ms'
import { Struct, validate } from 'superstruct'
import { ApiError, createDebug, StructApiError } from '../lib/module.js'

const debug = createDebug('deconf:metrics:sockets')

export type MetricsSocketsStructs = Map<string, Struct<any>>

type Context = Pick<
  DeconfBaseContext,
  'sockets' | 'metricsRepo' | 'jwt' | 'semaphore'
> & {
  eventStructs: MetricsSocketsStructs
  pause: (ms: number) => Promise<void>
}

export const SITE_VISITORS_ROOM = 'site-visitors'
const SITE_VISITORS_LOCK_KEY = 'site_visitors'
const SITE_VISITORS_MAX_LOCK = ms('15s')
const SITE_VISITORS_TIMEOUT = ms('5s')

export class MetricsSockets {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  async #triggerVisitors() {
    // Try to aquire a lock to broadcast
    // If we don't get it, someone else will do it first
    const hasLock = await this.#context.semaphore.aquire(
      SITE_VISITORS_LOCK_KEY,
      SITE_VISITORS_MAX_LOCK
    )
    debug('triggerVisitors hasLock=%o', hasLock)
    if (!hasLock) return

    // Wait a little bit for multiple calls to bundle up
    await this.#context.pause(SITE_VISITORS_TIMEOUT)

    // Make sure we still have the lock
    const stillHasLock = await this.#context.semaphore.hasLock(
      SITE_VISITORS_LOCK_KEY
    )
    if (!stillHasLock) {
      debug('triggerVisitors lost lock')
      return
    }

    // Release the lock
    await this.#context.semaphore.release(SITE_VISITORS_LOCK_KEY)

    // If we got to this point, broadcast the site visitor count
    const visitors = await this.#context.sockets.getSocketsInRoom(
      SITE_VISITORS_ROOM
    )
    this.#context.sockets.emitTo(
      SITE_VISITORS_ROOM,
      'site-visitors',
      visitors.length
    )
    debug('emit site-visitors %o', visitors.length)
  }

  #getAuth(socketId: string) {
    return this.#context.jwt.getSocketAuth(socketId).catch(() => null)
  }

  async cameOnline(socketId: string): Promise<void> {
    await this.#context.sockets.joinRoom(socketId, SITE_VISITORS_ROOM)

    this.#triggerVisitors().catch((error) => {
      console.error('Failed to emit site-visitors')
      process.exit(1)
    })

    await this.#context.pause(500)

    // Let the joining-socket know instantly
    const visitors = await this.#context.sockets.getSocketsInRoom(
      SITE_VISITORS_ROOM
    )
    this.#context.sockets.emitTo(socketId, 'site-visitors', visitors.length)
  }

  async wentOffline(socketId: string): Promise<void> {
    // Does it need to leave the room?
    await this.#context.sockets.leaveRoom(socketId, SITE_VISITORS_ROOM)
    await this.#triggerVisitors()
  }

  async event(
    socketId: string,
    eventName: string,
    payload: any
  ): Promise<void> {
    const struct = this.#context.eventStructs.get(eventName)

    if (!struct) {
      this.#context.sockets.sendError(
        socketId,
        new ApiError(400, ['metrics.badEvent'])
      )
      return
    }

    const validation = validate(payload, struct)
    if (validation[0]) {
      this.#context.sockets.sendError(
        socketId,
        new StructApiError(validation[0])
      )
      return
    }

    const authToken = await this.#getAuth(socketId)
    await this.#context.metricsRepo.trackEvent(eventName, validation[1], {
      attendee: authToken?.authToken.sub,
      socket: socketId,
    })
  }

  async error(socketId: string, error: Error): Promise<void> {
    const authToken = await this.#getAuth(socketId)
    const payload = {
      message: error.message,
      stack: error.stack,
    }
    await this.#context.metricsRepo.trackEvent('general/clientError', payload, {
      attendee: authToken?.authToken.sub,
      socket: socketId,
    })
  }
}
