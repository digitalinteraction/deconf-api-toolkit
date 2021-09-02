import { DeconfBaseContext } from '../lib/context'
import ms from 'ms'
import createDebug from 'debug'

const debug = createDebug('deconf:metrics:sockets')

type Context = Pick<
  DeconfBaseContext,
  'sockets' | 'metricsRepo' | 'jwt' | 'semaphore'
>

export const SITE_VISITORS_ROOM = 'site-visitors'
const SITE_VISITORS_MAX_LOCK = ms('15s')
const SITE_VISITORS_TIMEOUT = ms('5s')

export class MetricsSockets {
  get #sockets() {
    return this.#context.sockets
  }
  get #jwt() {
    return this.#context.jwt
  }
  get #metricsRepo() {
    return this.#context.metricsRepo
  }
  get #semaphore() {
    return this.#context.semaphore
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  async #triggerVisitors() {
    // Try to aquire a lock to broadcast
    // If we don't get it, someone else will do it first
    const hasLock = await this.#semaphore.aquire(
      'site_visitors',
      SITE_VISITORS_MAX_LOCK
    )
    debug('triggerVisitors hasLock=%o', hasLock)
    if (!hasLock) return

    // Wait a little bit for multiple calls to bundle up
    await new Promise((resolve) => setTimeout(resolve, SITE_VISITORS_TIMEOUT))

    // Make sure we still have the lock
    const stillHasLock = await this.#semaphore.hasLock('site_visitors')
    if (!stillHasLock) {
      debug('triggerVisitors lost lock')
      return
    }

    // If we got to this point, broadcast the site visitor count
    const visitors = await this.#sockets.getSocketsInRoom(SITE_VISITORS_ROOM)
    this.#sockets.emitTo(SITE_VISITORS_ROOM, 'site-visitors', visitors.length)
    debug('emit site-visitors %o', visitors)
  }

  async cameOnline(socketId: string) {
    this.#sockets.joinRoom(socketId, SITE_VISITORS_ROOM)

    // Let the joining-socket know instantly
    const visitors = await this.#sockets.getSocketsInRoom(SITE_VISITORS_ROOM)
    this.#sockets.emitTo(socketId, 'site-visitors', visitors.length)

    await this.#triggerVisitors()
  }

  async wentOffline(socketId: string) {
    // Does it need to leave the room?
    this.#sockets.leaveRoom(socketId, SITE_VISITORS_ROOM)
    await this.#triggerVisitors()
  }

  async event(socketId: string, eventName: string, payload: any) {
    const authToken = await this.#jwt.getSocketAuth(socketId)
    await this.#metricsRepo.trackEvent(eventName, payload, {
      attendee: authToken?.authToken.sub,
      socket: socketId,
    })
  }

  async error(socketId: string, error: Error) {
    const authToken = await this.#jwt.getSocketAuth(socketId)
    const payload = {
      message: error.message,
      stack: error.stack,
    }
    await this.#metricsRepo.trackEvent('client-error', payload, {
      attendee: authToken?.authToken.sub,
      socket: socketId,
    })
  }
}
