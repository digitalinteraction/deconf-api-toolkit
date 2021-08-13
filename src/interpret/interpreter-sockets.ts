import { Interpreter } from '@openlab/deconf-shared'
import { ApiError } from '../lib/api-error'
import { DeconfBaseContext } from '../lib/context'
import { InterpretBooth } from './interpret-booth-struct'

export interface ActiveBooth {
  socketId: string
  attendee: number
  interpreter: Interpreter
}

type Context = Pick<
  DeconfBaseContext,
  'sockets' | 'interpreterRepo' | 'metricsRepo' | 'jwt' | 'store'
>

export class InterpreterSockets {
  get #sockets() {
    return this.#context.sockets
  }
  get #interpreterRepo() {
    return this.#context.interpreterRepo
  }
  get #jwt() {
    return this.#context.jwt
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

  #getActiveBooth({ sessionId, channel }: InterpretBooth) {
    return this.#store.retrieve<ActiveBooth>(
      `active-booth/${sessionId}/${channel}`
    )
  }

  async #stopInterpretation(
    { sessionId, channel }: InterpretBooth,
    interpreter: Interpreter
  ) {
    const activeBooth = await this.#getActiveBooth({ sessionId, channel })
    if (activeBooth) {
      this.#sockets.emitTo(
        `interpret/${sessionId}/${channel}`,
        'interpreter-stopped',
        interpreter
      )
      this.#sockets.emitTo(`channel/${sessionId}/${channel}`, 'channel-stopped')
      await this.#store.delete(`active-booth/${sessionId}/${channel}`)
    }
  }

  // Events
  async socketDisconnected(socketId: string) {
    const rooms = await this.#sockets.getSocketRooms(socketId)

    const auth = await this.#jwt.getSocketAuth(socketId)
    if (!auth || !auth.interpreter) throw ApiError.unauthorized()

    const interpretRooms = Array.from(rooms).filter((room) =>
      room.startsWith('interpret/')
    )

    for (const room of interpretRooms) {
      this.#sockets.emitTo(room, 'interpreter-left', auth.interpreter)
    }
  }

  // Interpret
  async acceptInterpret(socketId: string, booth: InterpretBooth) {
    const { auth, interpretRoom } = await this.#interpreterRepo.prepInterpreter(
      socketId,
      booth
    )

    this.#sockets.emitTo(
      interpretRoom,
      'interpreter-accepted',
      auth.interpreter
    )

    await this.#metricsRepo.trackEvent('interpreter-accepted', booth, {
      attendee: auth.authToken.sub,
      socket: socketId,
    })
  }

  async joinBooth(socketId: string, booth: InterpretBooth) {
    const { auth, interpretRoom } = await this.#interpreterRepo.prepInterpreter(
      socketId,
      booth
    )

    // 1. emit the current room's occupants to the joiner
    const occupants = await this.#sockets.getRoomSockets(interpretRoom)
    for (const id of occupants) {
      const other = await this.#jwt.getSocketAuth(id).catch(() => null)
      if (!other || !other.interpreter) continue
      this.#sockets.emitTo(socketId, 'interpreter-joined', other.interpreter)
    }

    // 2. emit the active interpreter to the joiner
    const activeBooth = await this.#getActiveBooth(booth)
    if (activeBooth) {
      this.#sockets.emitTo(
        socketId,
        'interpreter-started',
        activeBooth.interpreter
      )
    }

    // 3. join the interpret room
    this.#sockets.joinRoom(socketId, interpretRoom)

    // 4. emit the join to the booth
    this.#sockets.emitTo(interpretRoom, 'interpreter-joined', auth.interpreter)

    // 5. log an event
    await this.#metricsRepo.trackEvent('interpreter-joined', booth, {
      attendee: auth.authToken.sub,
      socket: socketId,
    })
  }

  async leaveBooth(socketId: string, booth: InterpretBooth) {
    const { auth, interpretRoom } = await this.#interpreterRepo.prepInterpreter(
      socketId,
      booth
    )

    // 1. leave the interpreter room
    this.#sockets.leaveRoom(socketId, interpretRoom)

    // 2. broadcast the leaving to the booth
    this.#sockets.emitTo(interpretRoom, 'interpreter-left', auth.interpreter)

    // 3. stop interpretation if active
    await this.#stopInterpretation(booth, auth.interpreter)

    // 4. log an event
    await this.#metricsRepo.trackEvent('interpreter-left', booth, {
      attendee: auth.authToken.sub,
      socket: socketId,
    })
  }

  async messageBooth(socketId: string, booth: InterpretBooth, message: string) {
    const { auth, interpretRoom } = await this.#interpreterRepo.prepInterpreter(
      socketId,
      booth
    )

    // 1. broadcast the message to the booth
    this.#sockets.emitTo(
      interpretRoom,
      'interpreter-message',
      auth.interpreter,
      'Test Message'
    )
  }

  async requestInterpret(
    socketId: string,
    booth: InterpretBooth,
    duration: number
  ) {
    // 1. broadcast the request to the booth
  }

  async sendAudio(socketId: string, rawData: Buffer) {
    // 1. get the booth packet
    // 2. broadcast the data to the channel
    // 3. upload the chunk to s3
  }

  async startInterpret(socketId: string, booth: InterpretBooth) {
    // 1. boot any existing interpreters
    // 2. store the booth packet
    // 3. broadcast the start to the booth
    // 4. broadcast the start to the channel
    // 5. log an event
  }

  async stopInterpret(socketId: string, booth: InterpretBooth) {
    // 1. get the booth packet
    // 2. remove the booth packet
    // 3. broadcast the stop to the booth
    // 4. broadcast the stop to the channel
    // 5. log an event
  }
}
