import { ApiError } from '../lib/api-error'
import { DeconfBaseContext } from '../lib/context'
import { InterpretBoothStruct } from './interpret-booth-struct'
import { InterpretBooth } from '@openlab/deconf-shared'
import { assertStruct } from '../module'

type Context = Pick<
  DeconfBaseContext,
  'sockets' | 'jwt' | 'conferenceRepo' | 'metricsRepo' | 'store'
>

export class ChannelSockets {
  get #sockets() {
    return this.#context.sockets
  }
  get #jwt() {
    return this.#context.jwt
  }
  get #conferenceRepo() {
    return this.#context.conferenceRepo
  }
  get #metricsRepo() {
    return this.#context.metricsRepo
  }
  get #store() {
    return this.#context.store
  }

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  #getChannelRoom(booth: InterpretBooth) {
    return `channel/${booth.sessionId}/${booth.channel}`
  }

  // Channels
  async joinChannel(socketId: string, booth: unknown) {
    assertStruct(booth, InterpretBoothStruct)

    const auth = await this.#jwt.getSocketAuth(socketId)
    const session = await this.#conferenceRepo.findSession(booth.sessionId)

    if (!session || !session.enableInterpretation) {
      throw ApiError.badRequest()
    }

    await this.#sockets.joinRoom(socketId, this.#getChannelRoom(booth))

    // If already active, tell the socket
    const activeBooth = await this.#store.retrieve(
      `active-booth/${booth.sessionId}/${booth.channel}`
    )
    if (activeBooth) {
      this.#sockets.emitTo(socketId, 'channel-started')
    }

    await this.#metricsRepo.trackEvent('session/joinChannel', booth, {
      attendee: auth.authToken.sub,
      socket: socketId,
    })
  }

  async leaveChannel(socketId: string, booth: unknown) {
    assertStruct(booth, InterpretBoothStruct)

    const auth = await this.#jwt.getSocketAuth(socketId)
    const socketRooms = await this.#sockets.getRoomsOfSocket(socketId)

    const room = this.#getChannelRoom(booth)

    if (socketRooms.has(room)) {
      await this.#sockets.leaveRoom(socketId, room)
    }

    await this.#metricsRepo.trackEvent('session/leaveChannel', booth, {
      attendee: auth.authToken.sub,
      socket: socketId,
    })
  }
}
