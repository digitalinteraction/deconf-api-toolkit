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

    const auth = await this.#context.jwt.getSocketAuth(socketId)
    const session = await this.#context.conferenceRepo.findSession(
      booth.sessionId
    )

    if (!session || !session.enableInterpretation) {
      throw ApiError.badRequest()
    }

    await this.#context.sockets.joinRoom(socketId, this.#getChannelRoom(booth))

    // If already active, tell the socket
    const activeBooth = await this.#context.store.retrieve(
      `active-booth/${booth.sessionId}/${booth.channel}`
    )
    if (activeBooth) {
      this.#context.sockets.emitTo(socketId, 'channel-started')
    }

    await this.#context.metricsRepo.trackEvent('session/joinChannel', booth, {
      attendee: auth.authToken.sub,
      socket: socketId,
    })
  }

  async leaveChannel(socketId: string, booth: unknown) {
    assertStruct(booth, InterpretBoothStruct)

    const auth = await this.#context.jwt.getSocketAuth(socketId)
    const socketRooms = await this.#context.sockets.getRoomsOfSocket(socketId)

    const room = this.#getChannelRoom(booth)

    if (socketRooms.has(room)) {
      await this.#context.sockets.leaveRoom(socketId, room)
    }

    await this.#context.metricsRepo.trackEvent('session/leaveChannel', booth, {
      attendee: auth.authToken.sub,
      socket: socketId,
    })
  }
}
