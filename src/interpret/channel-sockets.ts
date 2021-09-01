import { is } from 'superstruct'
import { ApiError } from '../lib/api-error'
import { DeconfBaseContext } from '../lib/context'
import { InterpretBoothStruct } from './interpret-booth-struct'
import { InterpretBooth } from '@openlab/deconf-shared'

type Context = Pick<
  DeconfBaseContext,
  'sockets' | 'jwt' | 'conferenceRepo' | 'metricsRepo'
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

  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  #getChannelRoom(booth: InterpretBooth) {
    return `channel/${booth.sessionId}/${booth.channel}`
  }

  // Channels
  async joinChannel(socketId: string, booth: InterpretBooth) {
    if (!is(booth, InterpretBoothStruct)) throw ApiError.badRequest()

    const auth = await this.#jwt.getSocketAuth(socketId)
    const session = await this.#conferenceRepo.findSession(booth.sessionId)

    if (!session || !session.enableInterpretation) {
      throw ApiError.badRequest()
    }

    this.#sockets.joinRoom(socketId, this.#getChannelRoom(booth))

    await this.#metricsRepo.trackEvent('join-channel', booth, {
      attendee: auth.authToken.sub,
      socket: socketId,
    })
  }

  async leaveChannel(socketId: string, booth: InterpretBooth) {
    if (!is(booth, InterpretBoothStruct)) throw ApiError.badRequest()

    const auth = await this.#jwt.getSocketAuth(socketId)
    const socketRooms = await this.#sockets.getSocketRooms(socketId)

    const room = this.#getChannelRoom(booth)

    if (socketRooms.has(room)) {
      this.#sockets.leaveRoom(socketId, room)
    }

    await this.#metricsRepo.trackEvent('leave-channel', booth, {
      attendee: auth.authToken.sub,
      socket: socketId,
    })
  }
}
