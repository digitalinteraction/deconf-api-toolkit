import {
  InterpretBooth,
  ActiveBooth,
  ActiveInterpreter,
} from '@openlab/deconf-shared'
import { ApiError } from '../lib/api-error'
import { DeconfBaseContext } from '../lib/context'

type Context = Pick<
  DeconfBaseContext,
  'sockets' | 'interpreterRepo' | 'metricsRepo' | 'jwt' | 'store' | 's3'
>

export class InterpreterSockets {
  #context: Context
  constructor(context: Context) {
    this.#context = context
  }

  #activeBoothKey({ sessionId, channel }: InterpretBooth) {
    return `active-booth/${sessionId}/${channel}`
  }
  #getActiveBooth(booth: InterpretBooth) {
    return this.#context.store.retrieve<ActiveBooth>(
      this.#activeBoothKey(booth)
    )
  }
  #activeInterpreterKey(socketId: string) {
    return `active-interpreter/${socketId}`
  }
  #getActiveInterpreter(socketId: string) {
    return this.#context.store.retrieve<ActiveInterpreter>(
      this.#activeInterpreterKey(socketId)
    )
  }

  //
  // Events
  //

  async socketDisconnected(socketId: string): Promise<void> {
    // 1. remove the active-interpreter if set
    const activeInterpreter = await this.#getActiveInterpreter(socketId)
    if (!activeInterpreter) return
    const { sessionId, channel } = activeInterpreter.booth

    await this.#context.store.delete(this.#activeInterpreterKey(socketId))

    // 2. remove the active-booth packet if interpreting
    const activeBooth = await this.#getActiveBooth(activeInterpreter.booth)
    if (!activeBooth) return

    // 3. emit the leave to the booth
    this.#context.sockets.emitTo(
      `interpret/${sessionId}/${channel}`,
      'interpreter-left',
      activeBooth.interpreter
    )

    if (activeBooth.socketId !== socketId) return

    await this.#context.store.delete(
      this.#activeBoothKey(activeInterpreter.booth)
    )

    // 3. emit the stop to the booth
    this.#context.sockets.emitTo(
      `interpret/${sessionId}/${channel}`,
      'interpreter-stopped',
      activeBooth.interpreter
    )

    // 4. emit the stop to the channel
    this.#context.sockets.emitTo(
      `channel/${sessionId}/${channel}`,
      'channel-stopped'
    )
  }

  //
  // Interpret
  //

  async acceptInterpret(
    socketId: string,
    booth: InterpretBooth
  ): Promise<void> {
    const {
      auth,
      interpretRoom,
    } = await this.#context.interpreterRepo.prepInterpreter(socketId, booth)

    // 1. emit the acceptance to the interpreter room
    this.#context.sockets.emitTo(
      interpretRoom,
      'interpreter-accepted',
      auth.interpreter
    )

    // 2. log the event
    await this.#context.metricsRepo.trackEvent('interpret/accepted', booth, {
      attendee: auth.authToken.sub,
      socket: socketId,
    })
  }

  async joinBooth(socketId: string, booth: InterpretBooth): Promise<void> {
    const {
      auth,
      interpretRoom,
    } = await this.#context.interpreterRepo.prepInterpreter(socketId, booth)

    // 1. emit the interpreter to the socket
    this.#context.sockets.emitTo(socketId, 'interpreter-self', auth.interpreter)

    // 2. emit the current room's occupants to the joiner
    const occupants = await this.#context.sockets.getSocketsInRoom(
      interpretRoom
    )
    for (const id of occupants) {
      const other = await this.#context.jwt.getSocketAuth(id).catch(() => null)
      if (!other || !other.interpreter) continue
      this.#context.sockets.emitTo(
        socketId,
        'interpreter-joined',
        other.interpreter
      )
    }

    // 3. emit the active interpreter to the joiner
    const activeBooth = await this.#getActiveBooth(booth)
    if (activeBooth) {
      this.#context.sockets.emitTo(
        socketId,
        'interpreter-started',
        activeBooth.interpreter
      )
    }

    // 4. join the interpret room
    await this.#context.sockets.joinRoom(socketId, interpretRoom)

    // 5. emit the join to the booth
    this.#context.sockets.emitTo(
      interpretRoom,
      'interpreter-joined',
      auth.interpreter
    )

    // 6. log an event
    await this.#context.metricsRepo.trackEvent('interpret/joined', booth, {
      attendee: auth.authToken.sub,
      socket: socketId,
    })
  }

  async leaveBooth(socketId: string, booth: InterpretBooth): Promise<void> {
    const {
      auth,
      interpretRoom,
      channelRoom,
    } = await this.#context.interpreterRepo.prepInterpreter(socketId, booth)

    // 1. leave the interpreter room
    await this.#context.sockets.leaveRoom(socketId, interpretRoom)

    // 2. broadcast the leaving to the booth
    this.#context.sockets.emitTo(
      interpretRoom,
      'interpreter-left',
      auth.interpreter
    )

    // 3. stop interpretation if active
    const activeBooth = await this.#getActiveBooth(booth)
    if (activeBooth && activeBooth.socketId === socketId) {
      this.#context.sockets.emitTo(
        interpretRoom,
        'interpreter-stopped',
        auth.interpreter
      )
      this.#context.sockets.emitTo(channelRoom, 'channel-stopped')
    }

    // 4. remove any lingering active packets
    await this.#context.store.delete(this.#activeInterpreterKey(socketId))

    // 5. log an event
    await this.#context.metricsRepo.trackEvent('interpret/left', booth, {
      attendee: auth.authToken.sub,
      socket: socketId,
    })
  }

  async messageBooth(
    socketId: string,
    booth: InterpretBooth,
    message: string
  ): Promise<void> {
    const {
      auth,
      interpretRoom,
    } = await this.#context.interpreterRepo.prepInterpreter(socketId, booth)

    // 1. broadcast the message to the booth
    this.#context.sockets.emitTo(
      interpretRoom,
      'interpreter-message',
      auth.interpreter,
      message
    )
  }

  async requestInterpreter(
    socketId: string,
    booth: InterpretBooth,
    duration: number
  ): Promise<void> {
    const {
      auth,
      interpretRoom,
    } = await this.#context.interpreterRepo.prepInterpreter(socketId, booth)

    // 1. broadcast the request to the booth
    this.#context.sockets.emitTo(
      interpretRoom,
      'interpreter-requested',
      auth.interpreter,
      duration
    )

    // 2. log an event
    await this.#context.metricsRepo.trackEvent(
      'interpret/requested',
      { ...booth, duration },
      { socket: socketId, attendee: auth.authToken.sub }
    )
  }

  async sendAudio(socketId: string, rawData: Buffer): Promise<void> {
    const activeInterpreter = await this.#getActiveInterpreter(socketId)
    if (!activeInterpreter) throw ApiError.unauthorized()
    const { sessionId, channel } = activeInterpreter.booth

    // 1. broadcast the data to the channel
    this.#context.sockets.emitTo(
      `channel/${sessionId}/${channel}`,
      'channel-data',
      rawData
    )

    // 2. upload the chunk to s3
    const timestamp = new Date().getTime()
    const cleanSessionId = sessionId.replace(/\s+/g, '').toLowerCase()
    await this.#context.s3.uploadFile(
      `interpret/${cleanSessionId}/${channel}/${timestamp}.pcm`,
      rawData
    )
  }

  async startInterpret(socketId: string, booth: InterpretBooth): Promise<void> {
    const {
      auth,
      interpretRoom,
      channelRoom,
    } = await this.#context.interpreterRepo.prepInterpreter(socketId, booth)

    // 1. boot any existing interpreters
    const activeBooth = await this.#getActiveBooth(booth)
    if (activeBooth) {
      this.#context.sockets.emitTo(
        activeBooth.socketId,
        'interpreter-takeover',
        auth.interpreter
      )
    }

    // 2. store the active-booth packet
    await this.#context.store.put<ActiveBooth>(this.#activeBoothKey(booth), {
      attendee: auth.authToken.sub,
      interpreter: auth.interpreter,
      socketId: socketId,
    })

    // 3. store the active-interpreter packet
    await this.#context.store.put<ActiveInterpreter>(
      this.#activeInterpreterKey(socketId),
      { booth }
    )

    // 4. broadcast the start to the booth
    this.#context.sockets.emitTo(
      interpretRoom,
      'interpreter-started',
      auth.interpreter
    )

    // 5. broadcast the start to the channel
    this.#context.sockets.emitTo(channelRoom, 'channel-started')

    // 6. log an event
    this.#context.metricsRepo.trackEvent('interpret/started', booth, {
      attendee: auth.authToken.sub,
      socket: socketId,
    })
  }

  async stopInterpret(socketId: string, booth: InterpretBooth): Promise<void> {
    const {
      auth,
      interpretRoom,
      channelRoom,
    } = await this.#context.interpreterRepo.prepInterpreter(socketId, booth)

    // 1. remove the active-interpreter packet
    this.#context.store.delete(this.#activeInterpreterKey(socketId))

    // 2. remove the active-booth packet
    this.#context.store.delete(this.#activeBoothKey(booth))

    // 3. broadcast the stop to the booth
    this.#context.sockets.emitTo(
      interpretRoom,
      'interpreter-stopped',
      auth.interpreter
    )

    // 4. broadcast the stop to the channel
    this.#context.sockets.emitTo(channelRoom, 'channel-stopped')

    // 5. log an event
    this.#context.metricsRepo.trackEvent('interpret/stopped', booth, {
      attendee: auth.authToken.sub,
      socket: socketId,
    })
  }
}
